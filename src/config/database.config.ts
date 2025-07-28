import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Role, Permission, Menu, SystemLog } from '../entities';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const dbType = process.env.DB_TYPE as any || 'mysql';
    
    const baseConfig = {
      type: dbType,
      entities: [User, Role, Permission, Menu, SystemLog],
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
      logging: process.env.DB_LOGGING === 'true' || false,
    };

    if (dbType === 'sqlite') {
      return {
        ...baseConfig,
        type: 'sqlite',
        database: process.env.DB_DATABASE || './data/ldesign_api.db',
      };
    }

    // MySQL configuration
    return {
      ...baseConfig,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'ldesign_api',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      timezone: '+08:00',
      charset: 'utf8mb4',
      extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
      },
      maxQueryExecutionTime: 60000,
    };
  },
);