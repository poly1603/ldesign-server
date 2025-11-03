import { IsOptional, IsEnum } from 'class-validator'
import { PackageManagerType } from '../../../utils/package-manager.util'

/**
 * 重装 Git DTO
 */
export class ReinstallGitDto {
  /**
   * 包管理器类型（可选，如果不指定则自动选择）
   */
  @IsOptional()
  @IsEnum(['chocolatey', 'scoop'])
  packageManager?: PackageManagerType
}

