import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { platform } from 'os'
import { execa } from 'execa'
import { INodeManager, NodeVersion } from './managers/node-manager.interface.js'
import { NvmWindowsManager } from './managers/nvm-windows.manager.js'
import { NvsManager } from './managers/nvs.manager.js'
import { FnmManager } from './managers/fnm.manager.js'
import { VoltaManager } from './managers/volta.manager.js'
import { MiseManager } from './managers/mise.manager.js'
import { PackageManagerUtil } from '../../utils/package-manager.util.js'
import { WebSocketEventsService } from '../../common/websocket/services/websocket-events.service.js'
import type { NodeManagerInstallEventData } from '../../common/websocket/types/websocket-events.types.js'
import { ExecUtil } from '../../utils/exec.util.js'

/**
 * Node 管理器类型
 */
export type NodeManagerType = 'nvm-windows' | 'nvs' | 'fnm' | 'volta' | 'mise'

type PlatformKey = 'windows' | 'macos' | 'linux'

/**
 * 管理器信息
 */
export interface ManagerInfo {
  type: NodeManagerType
  name: string
  installed: boolean
  available: boolean
  supported: boolean
  platforms: PlatformKey[]
}

interface InstallCommandStep {
  type: 'command'
  title: string
  command: string
  args: string[]
  shell?: boolean
  timeout?: number
  env?: Record<string, string>
}

interface InstallTaskStep {
  type: 'task'
  title: string
  task: () => Promise<{ success: boolean; message: string; output?: string }>
}

type InstallStep = InstallCommandStep | InstallTaskStep

/**
 * Node 版本管理服务
 */
@Injectable()
export class NodeService {
  private readonly logger = new Logger(NodeService.name)
  private managers: Map<NodeManagerType, INodeManager>
  private currentManager: INodeManager | null = null
  private readonly execAsync = promisify(exec)
  private readonly currentPlatform: PlatformKey
  private readonly installingManagers = new Set<NodeManagerType>()
  private cachedAvailableVersions?: { versions: string[]; timestamp: number }

  constructor(private readonly wsEventsService: WebSocketEventsService) {
    this.currentPlatform = this.getCurrentPlatformKey()
    // 初始化所有管理器
    this.managers = new Map<NodeManagerType, INodeManager>([
      ['nvm-windows', new NvmWindowsManager()],
      ['nvs', new NvsManager()],
      ['fnm', new FnmManager()],
      ['volta', new VoltaManager()],
      ['mise', new MiseManager()],
    ])
  }

  /**
   * 检测并选择可用的管理器
   * @returns 管理器实例，如果没有找到则返回 null
   */
  private async detectManager(): Promise<INodeManager | null> {
    // 如果已经检测过，直接返回
    if (this.currentManager) {
      return this.currentManager
    }

    const order = this.getDetectionOrder()

    for (const type of order) {
      if (!this.isManagerSupported(type)) {
        continue
      }
      const manager = this.managers.get(type)
      if (manager && (await manager.isInstalled())) {
        this.currentManager = manager
        return manager
      }
    }

    return null
  }

  /**
   * 获取所有管理器状态
   * @returns 管理器信息列表
   */
  async getManagersStatus(): Promise<ManagerInfo[]> {
    const statuses: ManagerInfo[] = []

    for (const [type, manager] of this.managers.entries()) {
      const platforms = this.getSupportedPlatforms(type)
      const supported = this.isManagerSupported(type)
      const installed = supported ? await manager.isInstalled() : false
      statuses.push({
        type,
        name: manager.name,
        installed,
        available: supported && !installed,
        supported,
        platforms,
      })
    }

    return statuses
  }

  /**
   * 获取可用的管理器列表（用于安装）
   * @returns 管理器信息列表
   */
  async getAvailableManagers(): Promise<ManagerInfo[]> {
    const statuses = await this.getManagersStatus()
    return statuses.filter(status => status.supported && !status.installed)
  }

  /**
   * 安装指定的管理器
   * @param managerType - 管理器类型
   * @returns 安装结果
   */
  async installManager(managerType: NodeManagerType): Promise<{
    success: boolean
    message: string
    data?: {
      taskId?: string
      alreadyInstalled?: boolean
    }
  }> {
    const manager = this.managers.get(managerType)
    if (!manager) {
      throw new NotFoundException(`未知的管理器类型: ${managerType}`)
    }

    if (!this.isManagerSupported(managerType)) {
      return {
        success: false,
        message: `${manager.name} 不支持当前操作系统，暂无法自动安装`,
        data: {
          alreadyInstalled: false,
        },
      }
    }

    if (await manager.isInstalled()) {
      return {
        success: true,
        message: `${manager.name} 已经安装`,
        data: {
          alreadyInstalled: true,
        },
      }
    }

    if (this.installingManagers.has(managerType)) {
      return {
        success: false,
        message: `${manager.name} 安装任务正在进行，请稍后再试。`,
      }
    }

    const steps = await this.buildInstallPlan(managerType)
    if (steps.length === 0) {
      return {
        success: false,
        message: `${manager.name} 暂不支持自动安装，请手动安装后刷新状态。`,
      }
    }

    const taskId = randomUUID()
    this.installingManagers.add(managerType)
    this.logger.log(`[InstallManager] 开始安装 ${manager.name}, taskId=${taskId}`)
    this.emitInstallStart(taskId, managerType, manager.name, `开始安装 ${manager.name}`)

    setImmediate(() => {
      this.performManagerInstallation(taskId, managerType, manager, steps).catch((error) => {
        this.logger.error(`[InstallManager] 安装 ${manager.name} 失败: ${error.message}`)
      })
    })

    return {
      success: true,
      message: `已开始安装 ${manager.name}`,
      data: {
        taskId,
      },
    }
  }

  /**
   * 获取已安装的 Node 版本列表
   * @returns Node 版本列表
   */
  async listVersions(): Promise<NodeVersion[]> {
    const manager = await this.detectManager()
    if (!manager) {
      throw new BadRequestException('未找到已安装的 Node 版本管理器')
    }

    return manager.listVersions()
  }

  /**
   * 获取当前使用的 Node 版本
   * @returns 当前版本
   */
  async getCurrentVersion(): Promise<string | null> {
    const manager = await this.detectManager()
    if (!manager) {
      return this.getSystemNodeVersion()
    }

    return manager.getCurrentVersion()
  }

  /**
   * 获取系统默认 Node 版本（无需管理器）
   * @returns Node 版本号（如 18.17.0），如果无法检测则返回 null
   */
  private async getSystemNodeVersion(): Promise<string | null> {
    try {
      const { stdout } = await this.execAsync('node -v', { timeout: 5000 })
      const raw = stdout.trim()
      if (!raw) {
        return null
      }
      return raw.replace(/^v/, '')
    } catch (error: any) {
      // node 命令不存在或执行失败
      if (error?.stderr) {
        console.warn('[NodeService] 获取系统 Node 版本失败:', error.stderr)
      }
      return null
    }
  }

  /**
   * 安装指定版本的 Node.js
   * @param version - 要安装的版本
   * @returns 安装结果
   */
  async installVersion(version: string): Promise<{ success: boolean; message: string }> {
    const manager = await this.detectManager()
    if (!manager) {
      throw new BadRequestException('未找到已安装的 Node 版本管理器')
    }

    if (!version || version.trim() === '') {
      throw new BadRequestException('版本号不能为空')
    }

    return manager.installVersion(version.trim())
  }

  /**
   * 切换到指定版本
   * @param version - 要切换到的版本
   * @returns 切换结果
   */
  async switchVersion(version: string): Promise<{ success: boolean; message: string }> {
    const manager = await this.detectManager()
    if (!manager) {
      throw new BadRequestException('未找到已安装的 Node 版本管理器')
    }

    if (!version || version.trim() === '') {
      throw new BadRequestException('版本号不能为空')
    }

    return manager.switchVersion(version.trim())
  }

  /**
   * 删除指定版本
   * @param version - 要删除的版本
   * @returns 删除结果
   */
  async removeVersion(version: string): Promise<{ success: boolean; message: string }> {
    const manager = await this.detectManager()
    if (!manager) {
      throw new BadRequestException('未找到已安装的 Node 版本管理器')
    }

    if (!version || version.trim() === '') {
      throw new BadRequestException('版本号不能为空')
    }

    return manager.removeVersion(version.trim())
  }

  /**
   * 获取可用版本列表（从远程）
   * @returns 可用版本列表
   */
  async listAvailableVersions(): Promise<string[]> {
    const manager = await this.detectManager()
    if (!manager) {
      return this.fetchNodeVersionsFromNpm()
    }

    try {
      const versions = await manager.listAvailableVersions()
      if (Array.isArray(versions) && versions.length > 0) {
        return versions
      }
    } catch (error: any) {
      this.logger.warn(`[AvailableVersions] 通过管理器获取版本失败: ${error.message}`)
    }

    return this.fetchNodeVersionsFromNpm()
  }

  private async buildInstallPlan(managerType: NodeManagerType): Promise<InstallStep[]> {
    const steps: InstallStep[] = []
    const isWindows = this.currentPlatform === 'windows'

    // Windows 上，fnm、nvm-windows、nvs 都需要包管理器
    if (isWindows && (managerType === 'nvm-windows' || managerType === 'nvs' || managerType === 'fnm')) {
      const bootstrapSteps = await this.createPackageManagerBootstrapSteps()
      steps.push(...bootstrapSteps)
    }

    switch (managerType) {
      case 'volta': {
        steps.push(...this.createVoltaInstallSteps())
        break
      }
      case 'mise': {
        steps.push(...this.createMiseInstallSteps())
        break
      }
      case 'fnm': {
        steps.push(...this.createFnmInstallSteps())
        break
      }
      case 'nvm-windows': {
        steps.push(...this.createNvmWindowsInstallSteps())
        break
      }
      case 'nvs': {
        steps.push(...this.createNvsInstallSteps())
        break
      }
      default:
        break
    }

    return steps
  }

  private getDetectionOrder(): NodeManagerType[] {
    if (this.currentPlatform === 'windows') {
      return ['nvm-windows', 'nvs', 'fnm', 'volta', 'mise']
    }

    return ['fnm', 'volta', 'mise']
  }

  private getCurrentPlatformKey(): PlatformKey {
    const current = platform()
    if (current === 'win32') {
      return 'windows'
    }
    if (current === 'darwin') {
      return 'macos'
    }
    return 'linux'
  }

  private getSupportedPlatforms(type: NodeManagerType): PlatformKey[] {
    switch (type) {
      case 'nvm-windows':
        return ['windows']
      case 'nvs':
        return ['windows']
      case 'fnm':
        return ['windows', 'macos', 'linux']
      case 'volta':
        return ['windows', 'macos', 'linux']
      case 'mise':
        return ['windows', 'macos', 'linux']
      default:
        return ['windows', 'macos', 'linux']
    }
  }

  private isManagerSupported(type: NodeManagerType): boolean {
    return this.getSupportedPlatforms(type).includes(this.currentPlatform)
  }

  private createVoltaInstallSteps(): InstallStep[] {
    if (this.currentPlatform === 'windows') {
      return [
        {
          type: 'command',
          title: '下载并安装 Volta',
          command: 'powershell.exe',
          args: [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            [
              'Write-Host "开始安装 Volta..."',
              'try {',
              '  Set-ExecutionPolicy Bypass -Scope Process -Force',
              '  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072',
              '  Invoke-WebRequest -Uri https://get.volta.sh -UseBasicParsing | Invoke-Expression',
              '  if ($LASTEXITCODE -eq 0 -or $?) {',
              '    Write-Host "Volta 安装成功"',
              '    exit 0',
              '  } else {',
              '    Write-Error "Volta 安装失败（退出码: $LASTEXITCODE）"',
              '    exit 1',
              '  }',
              '} catch {',
              '  Write-Error "Volta 安装失败: $_"',
              '  Write-Error "请手动安装: Invoke-WebRequest https://get.volta.sh -UseBasicParsing | Invoke-Expression"',
              '  exit 1',
              '}',
            ].join('\n'),
          ],
          timeout: 600000,
        },
      ]
    }
    const script = 'curl https://get.volta.sh | bash'
    return [
      {
        type: 'command',
        title: '安装 Volta',
        command: 'bash',
        args: ['-c', script],
        timeout: 600000,
      },
    ]
  }

  private createMiseInstallSteps(): InstallStep[] {
    if (this.currentPlatform === 'windows') {
      return [
        {
          type: 'command',
          title: '下载并安装 Mise',
          command: 'powershell.exe',
          args: [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            [
              'Write-Host "开始安装 Mise..."',
              'try {',
              '  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force',
              '  Invoke-RestMethod -Uri https://mise.run | Invoke-Expression',
              '  if ($LASTEXITCODE -eq 0 -or $?) {',
              '    Write-Host "Mise 安装成功"',
              '    exit 0',
              '  } else {',
              '    Write-Error "Mise 安装失败（退出码: $LASTEXITCODE）"',
              '    exit 1',
              '  }',
              '} catch {',
              '  Write-Error "Mise 安装失败: $_"',
              '  Write-Error "请手动安装: irm https://mise.run | iex"',
              '  exit 1',
              '}',
            ].join('\n'),
          ],
          timeout: 600000,
        },
      ]
    }
    const script = 'curl https://mise.run | sh'
    return [
      {
        type: 'command',
        title: '安装 Mise',
        command: 'bash',
        args: ['-c', script],
        timeout: 600000,
      },
    ]
  }

  private createFnmInstallSteps(): InstallStep[] {
    if (this.currentPlatform === 'windows') {
      // Windows 上优先使用官方安装脚本（不需要管理员权限）
      return [
        {
          type: 'command',
          title: '通过官方脚本安装 fnm',
          command: 'powershell.exe',
          args: [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            [
              '$installed = $false',
              '$errorMsg = ""',
              '$newline = [Environment]::NewLine',
              '',
              '# 1. 优先尝试使用官方安装脚本（不需要管理员权限）',
              'Write-Host "使用官方脚本安装 fnm..."',
              'try {',
              '  $installScript = "https://fnm.vercel.app/install/ps1"',
              '  Set-ExecutionPolicy Bypass -Scope Process -Force',
              '  Invoke-WebRequest -Uri $installScript -UseBasicParsing | Invoke-Expression',
              '  if ($LASTEXITCODE -eq 0 -or $?) {',
              '    Write-Host "fnm 已通过官方脚本安装成功"',
              '    $installed = $true',
              '  }',
              '} catch {',
              '  $errorMsg += "官方脚本安装失败: $_" + $newline',
              '}',
              '',
              '# 2. 如果官方脚本失败，尝试使用已安装的包管理器',
              'if (-not $installed -and (Get-Command winget -ErrorAction SilentlyContinue)) {',
              '  Write-Host "官方脚本失败，尝试使用 Winget 安装 fnm..."',
              '  try {',
              '    winget install Schniz.fnm --accept-package-agreements --accept-source-agreements --silent',
              '    if ($LASTEXITCODE -eq 0) {',
              '      Write-Host "fnm 已通过 Winget 安装成功"',
              '      $installed = $true',
              '    } else {',
              '      $errorMsg += "Winget 安装失败（退出码: $LASTEXITCODE）" + $newline',
              '    }',
              '  } catch {',
              '    $errorMsg += "Winget 安装失败: $_" + $newline',
              '  }',
              '}',
              '',
              '# 3. 如果 Winget 失败，尝试 Scoop',
              'if (-not $installed -and (Get-Command scoop -ErrorAction SilentlyContinue)) {',
              '  Write-Host "Winget 失败，尝试使用 Scoop 安装 fnm..."',
              '  try {',
              '    scoop install fnm',
              '    if ($LASTEXITCODE -eq 0) {',
              '      Write-Host "fnm 已通过 Scoop 安装成功"',
              '      $installed = $true',
              '    } else {',
              '      $errorMsg += "Scoop 安装失败（退出码: $LASTEXITCODE）" + $newline',
              '    }',
              '  } catch {',
              '    $errorMsg += "Scoop 安装失败: $_" + $newline',
              '  }',
              '}',
              '',
              '# 4. 如果 Scoop 失败，尝试 Chocolatey（仅当已安装时）',
              'if (-not $installed -and (Get-Command choco -ErrorAction SilentlyContinue)) {',
              '  Write-Host "Scoop 失败，尝试使用 Chocolatey 安装 fnm..."',
              '  try {',
              '    choco install fnm -y',
              '    if ($LASTEXITCODE -eq 0) {',
              '      Write-Host "fnm 已通过 Chocolatey 安装成功"',
              '      $installed = $true',
              '    } else {',
              '      $errorMsg += "Chocolatey 安装失败（退出码: $LASTEXITCODE）" + $newline',
              '    }',
              '  } catch {',
              '    $errorMsg += "Chocolatey 安装失败: $_" + $newline',
              '  }',
              '}',
              '',
              '# 检查安装结果',
              'if (-not $installed) {',
              '  Write-Error "fnm 安装失败。错误信息: $errorMsg"',
              '  Write-Error "请尝试以下方法之一手动安装："',
              '  Write-Error "1. 官方脚本: Invoke-WebRequest -Uri https://fnm.vercel.app/install/ps1 -UseBasicParsing | Invoke-Expression"',
              '  Write-Error "2. Winget: winget install Schniz.fnm"',
              '  Write-Error "3. Scoop: scoop install fnm"',
              '  Write-Error "4. Chocolatey: choco install fnm -y (需要管理员权限)"',
              '  exit 1',
              '}',
            ].join('\n'),
          ],
          timeout: 600000,
        },
      ]
    }
    
    // macOS/Linux 使用官方安装脚本
    const script = 'curl -fsSL https://fnm.vercel.app/install | bash'
    return [
      {
        type: 'command',
        title: '安装 fnm',
        command: 'bash',
        args: ['-c', script],
        timeout: 600000,
      },
    ]
  }

  /**
   * 创建包管理器引导步骤（自动检测并安装 Chocolatey/Scoop）
   */
  private async createPackageManagerBootstrapSteps(): Promise<InstallStep[]> {
    const steps: InstallStep[] = []

    // 检测已安装的包管理器
    const managers = await PackageManagerUtil.detectAll()
    const installedManager = managers.find((m) => m.installed)

    if (installedManager) {
      this.logger.log(`[Bootstrap] 检测到已安装的包管理器: ${installedManager.type}`)
      return steps // 无需安装
    }

    // 优先尝试安装 Scoop（不需要管理员权限）
    this.logger.log('[Bootstrap] 未检测到包管理器，开始安装 Scoop...')
    steps.push({
      type: 'command',
      title: '自动安装 Scoop 包管理器',
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; irm get.scoop.sh | iex',
      ],
      timeout: 600000, // 10 分钟超时
    })

    // 验证 Scoop 安装结果（如果失败，继续尝试 Chocolatey）
    steps.push({
      type: 'task',
      title: '验证 Scoop 安装结果',
      task: async () => {
        // 等待一下让环境变量生效
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const scoop = await PackageManagerUtil.detectScoop()
        if (scoop.installed) {
          this.logger.log(`[Bootstrap] Scoop 安装成功，版本: ${scoop.version || '未知'}`)
          return {
            success: true,
            message: 'Scoop 安装成功',
            output: `Scoop 版本: ${scoop.version || '未知'}`,
          }
        }

        // Scoop 安装失败，标记需要尝试 Chocolatey
        this.logger.warn('[Bootstrap] Scoop 安装失败，将尝试安装 Chocolatey...')
        // 返回成功但不输出消息，让后续步骤继续执行
        return {
          success: true,
          message: 'Scoop 安装未成功，将尝试 Chocolatey',
          output: 'Scoop 安装未成功，继续尝试 Chocolatey...',
        }
      },
    })

    // 条件性安装 Chocolatey（仅在 Scoop 未安装时）
    steps.push({
      type: 'command',
      title: '自动安装 Chocolatey 包管理器（需要管理员权限）',
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        [
          '# 检查是否已安装 Scoop',
          'if (Get-Command scoop -ErrorAction SilentlyContinue) {',
          '  Write-Host "Scoop 已安装，跳过 Chocolatey 安装"',
          '  exit 0',
          '}',
          '# 安装 Chocolatey',
          'Set-ExecutionPolicy Bypass -Scope Process -Force',
          '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072',
          "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))",
        ].join('\n'),
      ],
      timeout: 600000,
    })

    // 最终验证：确保至少有一个包管理器可用
    steps.push({
      type: 'task',
      title: '验证包管理器安装结果',
      task: async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const managers = await PackageManagerUtil.detectAll()
        const installed = managers.find((m) => m.installed)

        if (installed) {
          return {
            success: true,
            message: `${installed.type === 'chocolatey' ? 'Chocolatey' : 'Scoop'} 安装成功`,
            output: `${installed.type === 'chocolatey' ? 'Chocolatey' : 'Scoop'} 版本: ${installed.version || '未知'}`,
          }
        }

        // 提供详细的错误信息和解决建议
        const errorDetails = [
          '包管理器安装失败。',
          '',
          '可能的原因：',
          '1. Scoop 安装失败：可能需要网络连接或权限问题',
          '2. Chocolatey 安装失败：需要管理员权限',
          '',
          '建议解决方案：',
          '1. 手动安装 Scoop（推荐，不需要管理员权限）：',
          '   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force',
          '   irm get.scoop.sh | iex',
          '',
          '2. 手动安装 Chocolatey（需要管理员权限）：',
          '   以管理员身份运行 PowerShell，然后执行：',
          '   Set-ExecutionPolicy Bypass -Scope Process -Force',
          '   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072',
          "   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))",
          '',
          '3. 或者直接使用 fnm 的官方安装脚本（不需要包管理器）：',
          '   Invoke-WebRequest -Uri https://fnm.vercel.app/install/ps1 -UseBasicParsing | Invoke-Expression',
        ].join('\n')

        return {
          success: false,
          message: errorDetails,
        }
      },
    })

    return steps
  }

  /**
   * 创建 nvm-windows 安装步骤（使用包管理器）
   */
  private createNvmWindowsInstallSteps(): InstallStep[] {
    return [
      {
        type: 'command',
        title: '通过包管理器安装 nvm-windows',
        command: 'powershell.exe',
        args: [
          '-NoProfile',
          '-Command',
          [
            '$installed = $false',
            '$errorMsg = ""',
            '$newline = [Environment]::NewLine',
            '',
            '# 1. 优先尝试 Winget',
            'if (Get-Command winget -ErrorAction SilentlyContinue) {',
            '  Write-Host "使用 Winget 安装 nvm-windows..."',
            '  try {',
            '    winget install CoreyButler.NVMforWindows --accept-package-agreements --accept-source-agreements --silent',
            '    if ($LASTEXITCODE -eq 0) {',
            '      Write-Host "nvm-windows 已通过 Winget 安装成功"',
            '      $installed = $true',
            '    } else {',
            '      $errorMsg += "Winget 安装失败（退出码: $LASTEXITCODE）" + $newline',
            '    }',
            '  } catch {',
            '    $errorMsg += "Winget 安装失败: $_" + $newline',
            '  }',
            '}',
            '',
            '# 2. 如果 Winget 失败，尝试 Scoop',
            'if (-not $installed -and (Get-Command scoop -ErrorAction SilentlyContinue)) {',
            '  Write-Host "Winget 失败，尝试使用 Scoop 安装 nvm-windows..."',
            '  try {',
            '    scoop install nvm',
            '    if ($LASTEXITCODE -eq 0) {',
            '      Write-Host "nvm-windows 已通过 Scoop 安装成功"',
            '      $installed = $true',
            '    } else {',
            '      $errorMsg += "Scoop 安装失败（退出码: $LASTEXITCODE）" + $newline',
            '    }',
            '  } catch {',
            '    $errorMsg += "Scoop 安装失败: $_" + $newline',
            '  }',
            '}',
            '',
            '# 3. 如果 Scoop 失败，尝试 Chocolatey（仅当已安装时）',
            'if (-not $installed -and (Get-Command choco -ErrorAction SilentlyContinue)) {',
            '  Write-Host "Scoop 失败，尝试使用 Chocolatey 安装 nvm-windows..."',
            '  try {',
            '    choco install nvm -y',
            '    if ($LASTEXITCODE -eq 0) {',
            '      Write-Host "nvm-windows 已通过 Chocolatey 安装成功"',
            '      $installed = $true',
            '    } else {',
            '      $errorMsg += "Chocolatey 安装失败（退出码: $LASTEXITCODE）" + $newline',
            '    }',
            '  } catch {',
            '    $errorMsg += "Chocolatey 安装失败: $_" + $newline',
            '  }',
            '}',
            '',
            '# 检查安装结果',
            'if (-not $installed) {',
            '  Write-Error "nvm-windows 安装失败。错误信息: $errorMsg"',
            '  Write-Error "请尝试以下方法之一手动安装："',
            '  Write-Error "1. Winget: winget install CoreyButler.NVMforWindows"',
            '  Write-Error "2. Scoop: scoop install nvm"',
            '  Write-Error "3. Chocolatey: choco install nvm -y (需要管理员权限)"',
            '  exit 1',
            '}',
          ].join('\n'),
        ],
        timeout: 600000,
      },
    ]
  }

  /**
   * 创建 nvs 安装步骤（使用包管理器）
   */
  private createNvsInstallSteps(): InstallStep[] {
    return [
      {
        type: 'command',
        title: '通过包管理器安装 nvs',
        command: 'powershell.exe',
        args: [
          '-NoProfile',
          '-Command',
          [
            '$installed = $false',
            '$errorMsg = ""',
            '$newline = [Environment]::NewLine',
            '',
            '# 1. 优先尝试 Winget',
            'if (Get-Command winget -ErrorAction SilentlyContinue) {',
            '  Write-Host "使用 Winget 安装 nvs..."',
            '  try {',
            '    winget install jasongin.nvs --accept-package-agreements --accept-source-agreements --silent',
            '    if ($LASTEXITCODE -eq 0) {',
            '      Write-Host "nvs 已通过 Winget 安装成功"',
            '      $installed = $true',
            '    } else {',
            '      $errorMsg += "Winget 安装失败（退出码: $LASTEXITCODE）" + $newline',
            '    }',
            '  } catch {',
            '    $errorMsg += "Winget 安装失败: $_" + $newline',
            '  }',
            '}',
            '',
            '# 2. 如果 Winget 失败，尝试 Scoop',
            'if (-not $installed -and (Get-Command scoop -ErrorAction SilentlyContinue)) {',
            '  Write-Host "Winget 失败，尝试使用 Scoop 安装 nvs..."',
            '  try {',
            '    scoop install nvs',
            '    if ($LASTEXITCODE -eq 0) {',
            '      Write-Host "nvs 已通过 Scoop 安装成功"',
            '      $installed = $true',
            '    } else {',
            '      $errorMsg += "Scoop 安装失败（退出码: $LASTEXITCODE）" + $newline',
            '    }',
            '  } catch {',
            '    $errorMsg += "Scoop 安装失败: $_" + $newline',
            '  }',
            '}',
            '',
            '# 3. 如果 Scoop 失败，尝试 Chocolatey（仅当已安装时）',
            'if (-not $installed -and (Get-Command choco -ErrorAction SilentlyContinue)) {',
            '  Write-Host "Scoop 失败，尝试使用 Chocolatey 安装 nvs..."',
            '  try {',
            '    choco install nvs -y',
            '    if ($LASTEXITCODE -eq 0) {',
            '      Write-Host "nvs 已通过 Chocolatey 安装成功"',
            '      $installed = $true',
            '    } else {',
            '      $errorMsg += "Chocolatey 安装失败（退出码: $LASTEXITCODE）" + $newline',
            '    }',
            '  } catch {',
            '    $errorMsg += "Chocolatey 安装失败: $_" + $newline',
            '  }',
            '}',
            '',
            '# 检查安装结果',
            'if (-not $installed) {',
            '  Write-Error "nvs 安装失败。错误信息: $errorMsg"',
            '  Write-Error "请尝试以下方法之一手动安装："',
            '  Write-Error "1. Winget: winget install jasongin.nvs"',
            '  Write-Error "2. Scoop: scoop install nvs"',
            '  Write-Error "3. Chocolatey: choco install nvs -y (需要管理员权限)"',
            '  exit 1',
            '}',
          ].join('\n'),
        ],
        timeout: 600000,
      },
    ]
  }

  private async performManagerInstallation(
    taskId: string,
    managerType: NodeManagerType,
    manager: INodeManager,
    steps: InstallStep[],
  ): Promise<void> {
    try {
      await this.runInstallPlan(taskId, managerType, manager.name, steps)
      this.emitInstallProgress(taskId, managerType, manager.name, 92, '安装脚本执行完成，正在验证...')

      const installed = await manager.isInstalled()
      if (!installed) {
        throw new Error(
          `${manager.name} 安装脚本执行完成，但未检测到可执行文件。请重新打开终端或重启后再试。`,
        )
      }

      this.currentManager = null
      this.emitInstallComplete(taskId, managerType, manager.name, `${manager.name} 安装完成`)
      this.logger.log(`[InstallManager] ${manager.name} 安装完成, taskId=${taskId}`)
    } catch (error: any) {
      const message = error?.message || '未知错误'
      this.emitInstallError(taskId, managerType, manager.name, message)
      this.logger.error(`[InstallManager] ${manager.name} 安装失败: ${message}`)
    } finally {
      this.installingManagers.delete(managerType)
    }
  }

  private async runInstallPlan(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    steps: InstallStep[],
  ): Promise<void> {
    if (steps.length === 0) {
      throw new Error('未找到可执行的安装步骤')
    }

    const total = steps.length
    const baseProgress = 5
    const maxProgress = 85

    for (let index = 0; index < total; index++) {
      const step = steps[index]
      const startProgress = Math.min(
        maxProgress,
        Math.round(baseProgress + (index / total) * (maxProgress - baseProgress)),
      )
      const endProgress = Math.min(
        maxProgress,
        Math.round(baseProgress + ((index + 1) / total) * (maxProgress - baseProgress)),
      )

      this.emitInstallProgress(taskId, managerType, managerName, startProgress, `开始 ${step.title}`)

      if (step.type === 'command') {
        await this.runCommandStep(taskId, managerType, managerName, step)
      } else {
        const result = await step.task()
        if (result.output) {
          this.emitInstallLog(taskId, managerType, managerName, 'info', result.output)
        }
        if (!result.success) {
          throw new Error(result.message)
        }
      }

      this.emitInstallProgress(
        taskId,
        managerType,
        managerName,
        endProgress,
        `${step.title} 完成`,
      )
    }
  }

  private async runCommandStep(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    step: InstallCommandStep,
  ): Promise<void> {
    const child = execa(step.command, step.args, {
      shell: step.shell ?? false,
      timeout: step.timeout ?? 600000,
      env: {
        ...process.env,
        ...step.env,
      },
      // 确保所有输出都被捕获
      all: false, // 不合并 stdout 和 stderr，分别处理
    })

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')

    // 实时发送 stdout
    child.stdout?.on('data', (chunk: string | Buffer) => {
      const content = chunk.toString()
      if (content) {
        this.emitInstallLog(taskId, managerType, managerName, 'stdout', content)
      }
    })

    // 实时发送 stderr（错误输出）
    child.stderr?.on('data', (chunk: string | Buffer) => {
      const content = chunk.toString()
      if (content) {
        this.emitInstallLog(taskId, managerType, managerName, 'stderr', content)
      }
    })

    try {
      const result = await child
      // 命令成功执行后，如果还有未发送的输出，发送它们
      if (result.stdout && result.stdout.trim()) {
        this.emitInstallLog(taskId, managerType, managerName, 'stdout', result.stdout)
      }
      if (result.stderr && result.stderr.trim()) {
        this.emitInstallLog(taskId, managerType, managerName, 'stderr', result.stderr)
      }
    } catch (error: any) {
      // 命令失败时，收集所有错误信息
      const errorParts: string[] = []
      
      // 收集 stderr
      if (error.stderr && error.stderr.trim()) {
        errorParts.push(`标准错误输出:\n${error.stderr}`)
        this.emitInstallLog(taskId, managerType, managerName, 'stderr', error.stderr)
      }
      
      // 收集 stdout（有时错误信息也在 stdout 中）
      if (error.stdout && error.stdout.trim()) {
        errorParts.push(`标准输出:\n${error.stdout}`)
        this.emitInstallLog(taskId, managerType, managerName, 'stdout', error.stdout)
      }
      
      // 收集错误消息
      if (error.message && !errorParts.some(part => part.includes(error.message))) {
        errorParts.push(`错误消息: ${error.message}`)
      }
      
      // 收集退出码
      if (error.exitCode !== undefined) {
        errorParts.push(`退出码: ${error.exitCode}`)
      }
      
      // 组合错误信息
      const errorMessage = errorParts.length > 0 
        ? errorParts.join('\n\n') 
        : '命令执行失败（未知错误）'
      
      // 发送错误日志
      this.emitInstallLog(taskId, managerType, managerName, 'error', errorMessage)
      
      // 抛出错误
      throw new Error(errorMessage)
    }
  }

  private emitInstallStart(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    message?: string,
  ) {
    const payload: NodeManagerInstallEventData = {
      taskId,
      managerType,
      managerName,
      status: 'running',
      progress: 0,
      message,
    }
    this.wsEventsService.sendNodeManagerInstallStart(payload)
  }

  private emitInstallProgress(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    progress: number,
    message?: string,
  ) {
    const payload: NodeManagerInstallEventData = {
      taskId,
      managerType,
      managerName,
      status: 'running',
      progress: Math.max(0, Math.min(100, progress)),
      message,
    }
    this.wsEventsService.sendNodeManagerInstallProgress(payload)
  }

  private emitInstallLog(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    type: 'stdout' | 'stderr' | 'info' | 'error',
    content: string,
  ) {
    // 允许空内容通过，因为有些命令可能会输出空行
    // 但跳过完全为空的情况
    if (content === null || content === undefined) {
      return
    }
    
    const payload: NodeManagerInstallEventData = {
      taskId,
      managerType,
      managerName,
      status: 'running',
      log: {
        type,
        content: content.toString(), // 确保转换为字符串
      },
    }
    this.wsEventsService.sendNodeManagerInstallLog(payload)
  }

  private emitInstallComplete(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    message?: string,
  ) {
    const payload: NodeManagerInstallEventData = {
      taskId,
      managerType,
      managerName,
      status: 'completed',
      progress: 100,
      message,
    }
    this.wsEventsService.sendNodeManagerInstallComplete(payload)
  }

  private emitInstallError(
    taskId: string,
    managerType: NodeManagerType,
    managerName: string,
    errorMessage: string,
  ) {
    // 确保错误信息被发送为日志，方便前端实时显示
    this.emitInstallLog(taskId, managerType, managerName, 'error', `❌ 安装失败: ${errorMessage}`)
    
    const payload: NodeManagerInstallEventData = {
      taskId,
      managerType,
      managerName,
      status: 'failed',
      progress: 0,
      error: errorMessage,
      message: errorMessage,
    }
    this.wsEventsService.sendNodeManagerInstallError(payload)
  }

  private async fetchNodeVersionsFromNpm(): Promise<string[]> {
    const now = Date.now()
    const cacheDuration = 10 * 60 * 1000

    if (
      this.cachedAvailableVersions &&
      now - this.cachedAvailableVersions.timestamp < cacheDuration
    ) {
      return this.cachedAvailableVersions.versions
    }

    try {
      const result = await ExecUtil.exec('npm', ['view', 'node', 'versions', '--json'], {
        timeout: 60000,
      })

      if (result.exitCode === 0 && result.stdout) {
        const parsed = JSON.parse(result.stdout)
        const versionsArray = Array.isArray(parsed)
          ? parsed.map((item: any) => String(item))
          : []
        const latestVersions = versionsArray.slice(-60).reverse()
        const suggestions = ['latest', 'lts', 'current']
        const merged = [...suggestions, ...latestVersions]
        const unique = Array.from(new Set(merged))
        this.cachedAvailableVersions = { versions: unique, timestamp: now }
        return unique
      }
    } catch (error: any) {
      this.logger.warn(`[AvailableVersions] 通过 npm 获取版本失败: ${error.message}`)
    }

    const fallback = ['latest', 'lts', '20.11.1', '18.19.0', '16.20.2']
    this.cachedAvailableVersions = { versions: fallback, timestamp: now }
    return fallback
  }
}

