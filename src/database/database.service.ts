import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

/**
 * 数据库服务
 * 负责数据库初始化和维护
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * 模块初始化时执行
   */
  async onModuleInit() {
    await this.initializeDatabase()
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // 检查连接状态
      if (this.dataSource.isInitialized) {
        console.log('✅ 数据库连接成功')
      } else {
        await this.dataSource.initialize()
        console.log('✅ 数据库连接成功')
      }
    } catch (error) {
      console.error('❌ 数据库连接失败:', error)
      throw error
    }
  }

  /**
   * 获取数据源
   * @returns 数据源实例
   */
  getDataSource(): DataSource {
    return this.dataSource
  }
}
