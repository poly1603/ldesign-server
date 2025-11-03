import { Module, Global } from '@nestjs/common'
import { ConfigService } from './config.service'

/**
 * 全局配置模块
 * 提供应用配置和环境变量管理
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
