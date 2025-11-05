import { Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import { platform } from 'os'
import { InstallToolDto, UninstallToolDto, CheckToolDto, UpdateToolDto, ToolType } from './dto/tool-manager.dto.js'

const execAsync = promisify(exec)

@Injectable()
export class ToolManagerService {
  private getPlatform(): string {
    const p = platform()
    if (p === 'win32') return 'windows'
    if (p === 'darwin') return 'macos'
    return 'linux'
  }

  /**
   * Install development tool
   */
  async installTool(installDto: InstallToolDto): Promise<any> {
    const { tool, platform: targetPlatform, version } = installDto
    const currentPlatform = targetPlatform || this.getPlatform()

    try {
      let command: string

      switch (tool) {
        case ToolType.NODE:
          command = await this.getNodeInstallCommand(currentPlatform, version)
          break
        case ToolType.GIT:
          command = await this.getGitInstallCommand(currentPlatform, version)
          break
        case ToolType.NVM_WINDOWS:
          command = await this.getNvmWindowsInstallCommand()
          break
        case ToolType.NVS:
          command = await this.getNvsInstallCommand(currentPlatform)
          break
        case ToolType.FNM:
          command = await this.getFnmInstallCommand(currentPlatform)
          break
        default:
          return {
            success: false,
            message: `Unsupported tool: ${tool}`,
          }
      }

      const { stdout, stderr } = await execAsync(command)

      return {
        success: true,
        message: `${tool} installed successfully`,
        platform: currentPlatform,
        version: version || 'latest',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to install ${tool}`,
        error: error.message,
        stderr: error.stderr,
      }
    }
  }

  /**
   * Uninstall development tool
   */
  async uninstallTool(uninstallDto: UninstallToolDto): Promise<any> {
    const { tool, platform: targetPlatform } = uninstallDto
    const currentPlatform = targetPlatform || this.getPlatform()

    try {
      let command: string

      switch (tool) {
        case ToolType.NODE:
          command = await this.getNodeUninstallCommand(currentPlatform)
          break
        case ToolType.GIT:
          command = await this.getGitUninstallCommand(currentPlatform)
          break
        case ToolType.NVM_WINDOWS:
        case ToolType.NVS:
        case ToolType.FNM:
          command = await this.getNodeManagerUninstallCommand(tool, currentPlatform)
          break
        default:
          return {
            success: false,
            message: `Unsupported tool: ${tool}`,
          }
      }

      const { stdout, stderr } = await execAsync(command)

      return {
        success: true,
        message: `${tool} uninstalled successfully`,
        platform: currentPlatform,
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to uninstall ${tool}`,
        error: error.message,
      }
    }
  }

  /**
   * Check if tool is installed
   */
  async checkTool(checkDto: CheckToolDto): Promise<any> {
    const { tool } = checkDto

    try {
      let command: string

      switch (tool) {
        case ToolType.NODE:
          command = 'node --version'
          break
        case ToolType.GIT:
          command = 'git --version'
          break
        case ToolType.NVM_WINDOWS:
          command = 'nvm version'
          break
        case ToolType.NVS:
          command = 'nvs --version'
          break
        case ToolType.FNM:
          command = 'fnm --version'
          break
        default:
          return {
            success: false,
            message: `Unsupported tool: ${tool}`,
          }
      }

      const { stdout } = await execAsync(command)
      const version = stdout.trim()

      return {
        success: true,
        installed: true,
        tool,
        version,
        platform: this.getPlatform(),
      }
    } catch {
      return {
        success: true,
        installed: false,
        tool,
        platform: this.getPlatform(),
        message: `${tool} is not installed`,
      }
    }
  }

  /**
   * Update tool to latest or specific version
   */
  async updateTool(updateDto: UpdateToolDto): Promise<any> {
    const { tool, version } = updateDto

    try {
      // For most tools, updating = installing latest version
      return await this.installTool({
        tool,
        version: version || 'latest',
      })
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update ${tool}`,
        error: error.message,
      }
    }
  }

  /**
   * Get all supported tools status
   */
  async getAllToolsStatus(): Promise<any> {
    const tools = [ToolType.NODE, ToolType.GIT, ToolType.NVM_WINDOWS, ToolType.NVS, ToolType.FNM]

    const results = await Promise.all(
      tools.map((tool) => this.checkTool({ tool })),
    )

    return {
      success: true,
      platform: this.getPlatform(),
      tools: results.map((r) => ({
        tool: r.tool,
        installed: r.installed,
        version: r.version || null,
      })),
    }
  }

  // Private helper methods for generating install commands
  private async getNodeInstallCommand(platform: string, version?: string): Promise<string> {
    const ver = version || 'lts'

    if (platform === 'windows') {
      // Using winget or chocolatey
      return `powershell -Command "& { winget install OpenJS.NodeJS.LTS }"`
    } else if (platform === 'macos') {
      // Using Homebrew
      return `brew install node${version ? `@${version}` : ''}`
    } else {
      // Linux - using nvm
      return `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm install ${ver}`
    }
  }

  private async getNodeUninstallCommand(platform: string): Promise<string> {
    if (platform === 'windows') {
      return `powershell -Command "& { winget uninstall OpenJS.NodeJS }"`
    } else if (platform === 'macos') {
      return `brew uninstall node`
    } else {
      return `sudo rm -rf /usr/local/bin/node /usr/local/lib/node_modules`
    }
  }

  private async getGitInstallCommand(platform: string, version?: string): Promise<string> {
    if (platform === 'windows') {
      return `powershell -Command "& { winget install Git.Git }"`
    } else if (platform === 'macos') {
      return `brew install git`
    } else {
      return `sudo apt-get update && sudo apt-get install -y git`
    }
  }

  private async getGitUninstallCommand(platform: string): Promise<string> {
    if (platform === 'windows') {
      return `powershell -Command "& { winget uninstall Git.Git }"`
    } else if (platform === 'macos') {
      return `brew uninstall git`
    } else {
      return `sudo apt-get remove -y git`
    }
  }

  private async getNvmWindowsInstallCommand(): Promise<string> {
    return `powershell -Command "& { Invoke-WebRequest -Uri 'https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe' -OutFile '$env:TEMP\\nvm-setup.exe'; Start-Process -FilePath '$env:TEMP\\nvm-setup.exe' -Wait }"`
  }

  private async getNvsInstallCommand(platform: string): Promise<string> {
    if (platform === 'windows') {
      return `powershell -Command "& { Invoke-WebRequest -Uri 'https://github.com/jasongin/nvs/releases/latest/download/nvs.msi' -OutFile '$env:TEMP\\nvs.msi'; Start-Process msiexec.exe -ArgumentList '/i', '$env:TEMP\\nvs.msi', '/quiet' -Wait }"`
    } else {
      return `export NVS_HOME="$HOME/.nvs" && git clone https://github.com/jasongin/nvs "$NVS_HOME" && . "$NVS_HOME/nvs.sh" install`
    }
  }

  private async getFnmInstallCommand(platform: string): Promise<string> {
    if (platform === 'windows') {
      return `powershell -Command "& { winget install Schniz.fnm }"`
    } else if (platform === 'macos') {
      return `brew install fnm`
    } else {
      return `curl -fsSL https://fnm.vercel.app/install | bash`
    }
  }

  private async getNodeManagerUninstallCommand(tool: ToolType, platform: string): Promise<string> {
    if (platform === 'windows') {
      if (tool === ToolType.NVM_WINDOWS) {
        return `powershell -Command "& { Start-Process -FilePath (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\nvm' -Name 'UninstallString').UninstallString -Wait }"`
      } else if (tool === ToolType.FNM) {
        return `powershell -Command "& { winget uninstall Schniz.fnm }"`
      }
    } else if (platform === 'macos') {
      if (tool === ToolType.FNM) {
        return `brew uninstall fnm`
      } else if (tool === ToolType.NVS) {
        return `rm -rf "$HOME/.nvs"`
      }
    }

    return `echo "Manual uninstallation required for ${tool} on ${platform}"`
  }
}
