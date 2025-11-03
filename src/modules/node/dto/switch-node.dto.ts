import { IsString, IsNotEmpty } from 'class-validator'

/**
 * 切换 Node 版本 DTO
 */
export class SwitchNodeDto {
  /**
   * 要切换到的版本
   */
  @IsString()
  @IsNotEmpty()
  version: string
}

