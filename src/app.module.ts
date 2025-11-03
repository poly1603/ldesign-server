import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'
import { DatabaseModule } from './database/database.module'
import { NodeModule } from './modules/node/node.module'
import { GitModule } from './modules/git/git.module'
import { ProjectModule } from './modules/project/project.module'
import { SystemModule } from './modules/system/system.module'
import { Project } from './modules/project/entities/project.entity'
import { LoggerMiddleware } from './common/middleware/logger.middleware'

/**
 * 应用根模块
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.getDatabasePath(),
        entities: [Project],
        synchronize: !configService.isProduction(),
        logging: configService.isDevelopment(),
      }),
    }),
    DatabaseModule,
    NodeModule,
    GitModule,
    ProjectModule,
    SystemModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  /**
   * 配置中间件
   * @param consumer - 中间件消费者
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
