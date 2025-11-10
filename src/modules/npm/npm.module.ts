import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NpmController } from './npm.controller.js'
import { NpmService } from './npm.service.js'
import { NpmRegistry } from './entities/npm-registry.entity.js'
import { WebSocketModule } from '../../common/websocket/websocket.module.js'

@Module({
  imports: [
    TypeOrmModule.forFeature([NpmRegistry]),
    WebSocketModule,
  ],
  controllers: [NpmController],
  providers: [NpmService],
  exports: [NpmService],
})
export class NpmModule implements OnModuleInit {
  constructor(private readonly npmService: NpmService) {}

  async onModuleInit() {
    // 初始化默认 NPM 仓库配置
    await this.npmService.initializeDefaultRegistries()
  }
}

