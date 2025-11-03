import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { INodeManager, NodeVersion } from './managers/node-manager.interface'
import { NvmWindowsManager } from './managers/nvm-windows.manager'
import { NvsManager } from './managers/nvs.manager'
import { FnmManager } from './managers/fnm.manager'
import { PackageManagerUtil } from '../../utils/package-manager.util'

/**
 * Node 管理器类型
 */
export type NodeManagerType = 'nvm-windows' | 'nvs' | 'fnm'

/**
 * 管理器信息
 */
export interface ManagerInfo {
  type: NodeManagerType
  name: string
  installed: boolean
  available: boolean
}

/**
 * Node 版本管理服务
 */
@Injectable()
export class NodeService {
  private managers: Map<NodeManagerType, INodeManager>
  private currentManager: INodeManager | null = null

  constructor() {
    // 初始化所有管理器
    this.managers = new Map([
      ['nvm-windows', new NvmWindowsManager()],
      ['nvs', new NvsManager()],
      ['fnm', new FnmManager()],
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

    // 按优先级检测：nvm-windows -> nvs -> fnm
    const order: NodeManagerType[] = ['nvm-windows', 'nvs', 'fnm']

    for (const type of order) {
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
      const installed = await manager.isInstalled()
      statuses.push({
        type,
        name: manager.name,
        installed,
        available: installed,
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
    return statuses.map((status) => ({
      ...status,
      available: !status.installed, // 未安装的可以安装
    }))
  }

  /**
   * 安装指定的管理器
   * @param managerType - 管理器类型
   * @returns 安装结果
   */
  async installManager(managerType: NodeManagerType): Promise<{
    success: boolean
    message: string
  }> {
    // 检查是否已安装
    const manager = this.managers.get(managerType)
    if (!manager) {
      throw new NotFoundException(`未知的管理器类型: ${managerType}`)
    }

    if (await manager.isInstalled()) {
      return {
        success: true,
        message: `${manager.name} 已经安装`,
      }
    }

    // 根据管理器类型选择安装包
    const packageMap: Record<NodeManagerType, string> = {
      'nvm-windows': 'nvm',
      nvs: 'nvs',
      fnm: 'fnm',
    }

    const packageName = packageMap[managerType]

    // 使用包管理器安装
    const result = await PackageManagerUtil.install(packageName)

    if (result.success) {
      // 清除缓存的当前管理器，以便重新检测
      this.currentManager = null
    }

    return result
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
      return null
    }

    return manager.getCurrentVersion()
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
      throw new BadRequestException('未找到已安装的 Node 版本管理器')
    }

    return manager.listAvailableVersions()
  }
}

