import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

/**
 * API Operation
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
 * API Operation
 */
  async onModuleInit() {
    await this.initializeDatabase()
  }

  /**
 * API Operation
 */
  private async initializeDatabase(): Promise<void> {
    try {
      // Operation
      if (this.dataSource.isInitialized) {
        console.log(' ')
      } else {
        await this.dataSource.initialize()
        console.log(' ')
      }
    } catch (error) {
      console.error(' :', error)
      throw error
    }
  }

  /**
 * API Operation
 */
  getDataSource(): DataSource {
    return this.dataSource
  }
}
