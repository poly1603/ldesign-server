import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller.js'
import { ConfigModule } from './config/config.module.js'
import { ConfigService } from './config/config.service.js'
import { DatabaseModule } from './database/database.module.js'
import { NodeModule } from './modules/node/node.module.js'
import { GitModule } from './modules/git/git.module.js'
import { ProjectModule } from './modules/project/project.module.js'
import { SystemModule } from './modules/system/system.module.js'
import { LogsModule } from './modules/logs/logs.module.js'
import { HealthModule } from './modules/health/health.module.js'
import { BuilderModule } from './modules/builder/builder.module.js'
import { ChangelogModule } from './modules/changelog/changelog.module.js'
import { DepsModule } from './modules/deps/deps.module.js'
import { GeneratorModule } from './modules/generator/generator.module.js'
import { SecurityModule } from './modules/security/security.module.js'
import { TestingModule } from './modules/testing/testing.module.js'
import { DeployerModule } from './modules/deployer/deployer.module.js'
import { DocsGeneratorModule } from './modules/docs-generator/docs-generator.module.js'
import { EnvModule } from './modules/env/env.module.js'
import { FormatterModule } from './modules/formatter/formatter.module.js'
import { MockModule } from './modules/mock/mock.module.js'
import { MonitorModule } from './modules/monitor/monitor.module.js'
import { PublisherModule } from './modules/publisher/publisher.module.js'
import { PerformanceModule } from './modules/performance/performance.module.js'
import { LauncherModule } from './modules/launcher/launcher.module.js'
import { TranslatorModule } from './modules/translator/translator.module.js'
import { FileManagerModule } from './modules/file-manager/file-manager.module.js'
import { SchedulerModule } from './modules/scheduler/scheduler.module.js'
import { WorkflowModule } from './modules/workflow/workflow.module.js'
import { NotificationModule } from './modules/notification/notification.module.js'
import { DatabaseModule as DatabaseManagementModule } from './modules/database/database.module.js'
import { IntegrationModule } from './modules/integration/integration.module.js'
import { BatchModule } from './modules/batch/batch.module.js'
import { FontModule } from './modules/font/font.module.js'
import { ToolManagerModule } from './modules/tool-manager/tool-manager.module.js'
import { Project } from './modules/project/entities/project.entity.js'
import { CommandExecution } from './modules/project/entities/command-execution.entity.js'
import { LoggerMiddleware } from './common/middleware/logger.middleware.js'
import { WebSocketModule } from './common/websocket/websocket.module.js'
import { CacheModule } from './common/cache/cache.module.js'
import { ThrottleModule } from './common/throttle/throttle.module.js'

/**
 * 应用根模块
 */
@Module({
  imports: [
    ConfigModule,
    CacheModule,
    ThrottleModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.getDatabasePath(),
        entities: [Project, CommandExecution],
        synchronize: !configService.isProduction(),
        logging: configService.isDevelopment() ? ['query', 'error'] : ['error'],
        // SQLite 性能优化
        extra: {
          // 启用 WAL 模式以提高并发性能
          journal_mode: 'WAL',
          // 提高缓存大小
          cache_size: 10000,
          // 启用内存映射 I/O
          mmap_size: 268435456, // 256MB
          // 同步模式：NORMAL 在性能和安全性之间取得平衡
          synchronous: 'NORMAL',
          // 临时存储在内存中
          temp_store: 'MEMORY',
          // 启用查询分析（开发环境）
          analyze: configService.isDevelopment(),
        },
        // 连接池配置（虽然 SQLite 是单连接，但这些设置有助于连接管理）
        maxQueryExecutionTime: 5000, // 5 秒查询超时
        cache: false,
        // 自动加载实体
        autoLoadEntities: true,
        // 禁用外键约束检查以提高性能（生产环境）
        foreignKeys: !configService.isProduction(),
      }),
    }),
    DatabaseModule,
    WebSocketModule,
    NodeModule,
    GitModule,
    ProjectModule,
    SystemModule,
    LogsModule,
    HealthModule,
    BuilderModule,
    ChangelogModule,
    DepsModule,
    GeneratorModule,
    SecurityModule,
    TestingModule,
    DeployerModule,
    DocsGeneratorModule,
    EnvModule,
    FormatterModule,
    MockModule,
    MonitorModule,
    PublisherModule,
    PerformanceModule,
    LauncherModule,
    TranslatorModule,
    FileManagerModule,
    SchedulerModule,
    WorkflowModule,
    NotificationModule,
    DatabaseManagementModule,
    IntegrationModule,
    BatchModule,
    FontModule,
    ToolManagerModule,
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
