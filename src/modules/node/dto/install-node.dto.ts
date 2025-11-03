import { IsString, IsNotEmpty } from 'class-validator'

/**
 * 安装 Node 版本 DTO
 */
export class InstallNodeDto {
  /**
   * 要安装的版本（如 "18.17.0" 或 "lts"）
   */
  @IsString()
  @IsNotEmpty()
  version: string
}

