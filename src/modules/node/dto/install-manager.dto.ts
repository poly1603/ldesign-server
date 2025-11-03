import { IsEnum, IsNotEmpty } from 'class-validator'

/**
 * Node 管理器类型
 */
export enum NodeManagerTypeEnum {
  NVM_WINDOWS = 'nvm-windows',
  NVS = 'nvs',
  FNM = 'fnm',
}

/**
 * 安装管理器 DTO
 */
export class InstallManagerDto {
  /**
   * 要安装的管理器类型
   */
  @IsEnum(NodeManagerTypeEnum)
  @IsNotEmpty()
  managerType: 'nvm-windows' | 'nvs' | 'fnm'
}

