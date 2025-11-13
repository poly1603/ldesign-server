# 日志系统使用指南

本服务器使用 **Winston** 作为日志框架，提供了完整的日志记录和管理功能。

## 📁 日志文件结构

```
logs/
├── application-YYYY-MM-DD.log        # 所有级别的日志（info, debug, warn, error）
├── errors/
│   └── error-YYYY-MM-DD.log          # 仅包含 error 级别的日志
├── warnings/
│   └── warn-YYYY-MM-DD.log           # 警告级别及以上的日志
├── exceptions/
│   └── exceptions-YYYY-MM-DD.log     # 未捕获的异常
└── rejections/
    └── rejections-YYYY-MM-DD.log     # 未处理的 Promise rejection
```

## 🎯 日志级别

日志按以下级别记录（从低到高）：

1. **debug** - 调试信息（仅开发环境）
2. **info** - 常规信息
3. **warn** - 警告信息
4. **error** - 错误信息

## 📝 日志格式

所有日志以 JSON 格式存储，便于解析和分析：

```json
{
  "timestamp": "2025-11-13 09:05:25",
  "level": "info",
  "message": "HTTP Request",
  "context": "HttpRequest",
  "method": "GET",
  "url": "/api/v1/users",
  "statusCode": 200,
  "duration": "15ms",
  "ip": "::ffff:127.0.0.1"
}
```

## 🔄 日志轮转策略

- **轮转周期**: 每天自动创建新日志文件
- **压缩**: 旧日志自动压缩为 `.gz` 文件
- **文件大小**: 单个文件最大 20MB
- **保留时间**:
  - 应用日志：14 天
  - 错误日志：30 天
  - 警告日志：14 天
  - 异常和拒绝日志：30 天

## 📊 查看日志

### 使用 PowerShell 脚本（推荐）

我们提供了一个方便的日志查看工具：

```powershell
# 查看今天的所有日志（最后50行）
.\scripts\view-logs.ps1

# 查看今天的错误日志
.\scripts\view-logs.ps1 -Type error

# 查看特定日期的日志
.\scripts\view-logs.ps1 -Date "2025-11-12"

# 查看最后100行
.\scripts\view-logs.ps1 -Lines 100

# 实时跟踪日志（类似 tail -f）
.\scripts\view-logs.ps1 -Follow

# 过滤包含特定关键词的日志
.\scripts\view-logs.ps1 -Filter "用户登录"

# 显示日志统计信息
.\scripts\view-logs.ps1 -Stats

# 以原始JSON格式输出
.\scripts\view-logs.ps1 -Json
```

### 参数说明

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `-Type` | string | 日志类型：`all`, `error`, `warn`, `exception`, `rejection` | `all` |
| `-Lines` | int | 显示最后N行 | 50 |
| `-Date` | string | 指定日期，格式：YYYY-MM-DD | 今天 |
| `-Follow` | switch | 实时跟踪日志 | false |
| `-Json` | switch | 以JSON格式输出 | false |
| `-Filter` | string | 过滤关键词 | 空 |
| `-Stats` | switch | 显示日志统计 | false |

### 使用原生命令

```powershell
# 查看最后20行
Get-Content logs\application-2025-11-13.log -Tail 20

# 实时跟踪
Get-Content logs\application-2025-11-13.log -Tail 20 -Wait

# 搜索包含特定内容的日志
Select-String -Path logs\application-2025-11-13.log -Pattern "error"

# 格式化JSON输出
Get-Content logs\application-2025-11-13.log -Tail 5 | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 💻 在代码中使用日志

### 注入日志服务

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class YourService {
  constructor(private readonly logger: LoggerService) {}

  yourMethod() {
    // 使用日志
  }
}
```

### 基础日志方法

```typescript
// 常规信息
this.logger.log('用户登录成功', 'UserService');

// 调试信息（仅开发环境显示）
this.logger.debug('查询参数', 'UserService');

// 警告
this.logger.warn('缓存未命中', 'CacheService');

// 错误
this.logger.error('数据库连接失败', stackTrace, 'DatabaseService');
```

### 专用日志方法

```typescript
// 记录 HTTP 请求
this.logger.logRequest('GET', '/api/v1/users', 200, 150, '127.0.0.1');

// 记录 HTTP 错误
this.logger.logError(
  'POST',
  '/api/v1/users',
  400,
  '参数验证失败',
  stackTrace,
  '127.0.0.1'
);

// 记录业务错误
this.logger.logBusinessError(
  10001,
  '用户名已存在',
  { username: 'john' }
);

// 记录系统事件
this.logger.logSystemEvent('Database Connected', {
  host: 'localhost',
  database: 'mydb'
});
```

## 🔍 日志分析示例

### 统计请求次数

```powershell
# 统计各接口的请求次数
Get-Content logs\application-2025-11-13.log | 
  ConvertFrom-Json | 
  Where-Object { $_.message -eq "HTTP Request" } | 
  Group-Object url | 
  Select-Object Count, Name | 
  Sort-Object Count -Descending
```

### 查找慢请求

```powershell
# 查找响应时间超过1000ms的请求
Get-Content logs\application-2025-11-13.log | 
  ConvertFrom-Json | 
  Where-Object { 
    $_.message -eq "HTTP Request" -and 
    [int]($_.duration -replace 'ms', '') -gt 1000 
  } | 
  Select-Object timestamp, method, url, duration
```

### 统计错误类型

```powershell
# 统计各类错误的数量
Get-Content logs\errors\error-2025-11-13.log | 
  ConvertFrom-Json | 
  Group-Object message | 
  Select-Object Count, Name | 
  Sort-Object Count -Descending
```

## ⚙️ 配置修改

日志配置文件位于：`src/logger/logger.config.ts`

### 修改日志级别

```typescript
// 修改开发/生产环境的日志级别
level: isDevelopment ? 'debug' : 'info',
```

### 修改保留时间

```typescript
// 在 DailyRotateFile 配置中修改
maxFiles: '14d', // 保留14天
```

### 修改文件大小限制

```typescript
maxSize: '20m', // 单个文件最大20MB
```

## 📦 日志存储方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **文件日志**（当前） | 简单、无依赖、易于部署 | 查询不便、不支持复杂分析 | 小型项目、开发环境 |
| **数据库日志** | 查询方便、支持复杂分析 | 性能开销大、维护成本高 | 需要复杂查询的场景 |
| **ELK/日志平台** | 功能强大、可视化好 | 部署复杂、资源消耗大 | 大型项目、生产环境 |

## 🚀 升级到数据库日志（可选）

如果需要将日志存储到数据库以便于查询，可以参考以下实现：

### 1. 创建日志实体

```typescript
// src/logger/entities/log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  level: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  context: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true })
  ip: string;
}
```

### 2. 添加数据库传输

```typescript
// src/logger/transports/database.transport.ts
import Transport from 'winston-transport';
import { Repository } from 'typeorm';
import { Log } from '../entities/log.entity';

export class DatabaseTransport extends Transport {
  constructor(private logRepository: Repository<Log>) {
    super();
  }

  async log(info: any, callback: () => void) {
    try {
      await this.logRepository.save({
        level: info.level,
        message: info.message,
        context: info.context,
        metadata: info,
        url: info.url,
        method: info.method,
        statusCode: info.statusCode,
        ip: info.ip,
      });
    } catch (error) {
      // 记录失败不应影响应用运行
      console.error('Failed to save log to database:', error);
    }
    callback();
  }
}
```

### 3. 注册传输

在 `logger.config.ts` 中添加数据库传输到 transports 数组。

## 📌 注意事项

1. **敏感信息**: 不要在日志中记录密码、API密钥等敏感信息
2. **性能**: 避免在高频代码中使用 debug 级别日志
3. **日志清理**: 定期检查日志文件大小，确保磁盘空间充足
4. **日志分析**: 建议使用专业工具（如 ELK Stack）进行生产环境日志分析

## 🔗 相关资源

- [Winston 文档](https://github.com/winstonjs/winston)
- [nest-winston 文档](https://github.com/gremo/nest-winston)
- [日志最佳实践](https://www.loggly.com/ultimate-guide/node-logging-basics/)
