/**
 * Node 版本信息
 */
export interface NodeVersion {
  version: string
  installed: boolean
  active: boolean
  path?: string
}

/**
 * Node 管理器接口
 * 定义所有 Node 版本管理器必须实现的方法
 */
export interface INodeManager {
  /**
   * 管理器名称
   */
  readonly name: string

  /**
   * 检测管理器是否已安装
   * @returns 是否已安装
   */
  isInstalled(): Promise<boolean>

  /**
   * 获取已安装的 Node 版本列表
   * @returns Node 版本列表
   */
  listVersions(): Promise<NodeVersion[]>

  /**
   * 获取当前使用的 Node 版本
   * @returns 当前版本，如果未设置则返回 null
   */
  getCurrentVersion(): Promise<string | null>

  /**
   * 安装指定版本的 Node.js
   * @param version - 要安装的版本（如 "18.17.0" 或 "lts"）
   * @returns 安装结果
   */
  installVersion(version: string): Promise<{ success: boolean; message: string }>

  /**
   * 切换到指定版本
   * @param version - 要切换到的版本
   * @returns 切换结果
   */
  switchVersion(version: string): Promise<{ success: boolean; message: string }>

  /**
   * 删除指定版本
   * @param version - 要删除的版本
   * @returns 删除结果
   */
  removeVersion(version: string): Promise<{ success: boolean; message: string }>

  /**
   * 获取可用版本列表（从远程）
   * @returns 可用版本列表
   */
  listAvailableVersions(): Promise<string[]>
}




