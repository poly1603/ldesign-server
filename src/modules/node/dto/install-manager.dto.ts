import { IsEnum, IsNotEmpty } from 'class-validator'

/**
 * Node 管理器类型
 */
export enum NodeManagerTypeEnum {
  NVM_WINDOWS = 'nvm-windows',
  NVS = 'nvs',
  FNM = 'fnm',
  VOLTA = 'volta',
  MISE = 'mise',
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
  managerType: NodeManagerTypeEnum
}

