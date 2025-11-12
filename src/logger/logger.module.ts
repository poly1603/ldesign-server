import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { LoggerConfig } from './logger.config';
import { LoggerService } from './logger.service';

/**
 * 日志模块
 * 配置并导出日志服务
 */
@Global()
@Module({
  imports: [
    WinstonModule.forRoot(LoggerConfig.createWinstonConfig()),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
