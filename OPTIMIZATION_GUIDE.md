# NestJS 项目优化说明

本文档记录了对 NestJS 项目进行的优化和改进。

## 优化概览

### 1. 日志系统升级 ✅

使用 **Winston** 专业日志库替代原生 Logger，提供了完整的日志管理功能。

#### 功能特点

- **文件存储**：自动按日期分割日志文件
- **分级记录**：支持 debug、info、warn、error 等多个级别
- **错误日志分离**：错误日志单独存储，便于排查问题
- **自动归档**：支持日志文件压缩和自动清理
- **结构化日志**：JSON 格式，便于日志分析

#### 日志文件结构

```
logs/
├── application-2024-01-15.log        # 所有级别日志
├── errors/
│   └── error-2024-01-15.log         # 仅错误日志
├── warnings/
│   └── warn-2024-01-15.log          # 警告日志
├── exceptions/
│   └── exceptions-2024-01-15.log    # 未捕获的异常
└── rejections/
    └── rejections-2024-01-15.log    # 未处理的 Promise rejection
```

#### 日志配置

在 `.env` 文件中配置：

```env
LOG_LEVEL=debug          # 日志级别：debug | info | warn | error
LOG_DIR=logs            # 日志目录
LOG_MAX_FILES=14d       # 保留天数
LOG_MAX_SIZE=20m        # 单文件最大大小
```

#### 使用示例

```typescript
import { LoggerService } from './logger/logger.service';

// 注入服务
constructor(private readonly logger: LoggerService) {}

// 基础日志
this.logger.log('操作成功', 'ContextName');
this.logger.error('操作失败', errorStack, 'ContextName');
this.logger.warn('警告信息', 'ContextName');
this.logger.debug('调试信息', 'ContextName');

// HTTP 请求日志
this.logger.logRequest('GET', '/api/users', 200, 150, '127.0.0.1');

// HTTP 错误日志
this.logger.logError('GET', '/api/users', 500, '服务器错误', stack, '127.0.0.1');

// 业务错误日志
this.logger.logBusinessError(2001, '用户不存在', { userId: 123 });

// 系统事件日志
this.logger.logSystemEvent('Application Started', { port: 7001 });
```

### 2. 系统信息接口 ✅

新增了详细的系统信息获取接口，提供实时的系统状态监控。

#### 接口列表

##### GET /api/system/info

获取详细的系统信息，包括：

- **系统信息**：平台、架构、主机名、操作系统类型和版本
- **内存信息**：总内存、空闲内存、已用内存、使用率
- **进程内存**：堆内存、外部内存、RSS、ArrayBuffers
- **CPU 信息**：型号、速度、核心数
- **应用信息**：名称、版本、环境、运行时间、Node.js 版本

响应示例：

```json
{
  "code": 200,
  "message": "获取系统信息成功",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "environment": "development",
    "version": "1.0.0",
    "appName": "NestJS API Server",
    "nodeVersion": "v20.11.0",
    "system": {
      "platform": "win32",
      "arch": "x64",
      "cpus": 8,
      "hostname": "DESKTOP-PC",
      "type": "Windows_NT",
      "release": "10.0.22631"
    },
    "memory": {
      "total": "16.00 GB",
      "free": "8.50 GB",
      "used": "7.50 GB",
      "usagePercent": "46.88%",
      "process": {
        "heapTotal": "45.23 MB",
        "heapUsed": "32.18 MB",
        "external": "2.45 MB",
        "rss": "78.90 MB",
        "arrayBuffers": "1.23 MB"
      }
    },
    "cpu": {
      "model": "Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz",
      "speed": "3600 MHz",
      "cores": 8
    }
  },
  "timestamp": 1705315800000,
  "path": "/api/system/info"
}
```

##### GET /api/system/health

简化的健康检查接口：

```json
{
  "code": 200,
  "message": "系统健康",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600
  }
}
```

### 3. 接口格式规范 ✅

统一的响应格式，确保所有接口返回一致的数据结构。

#### 成功响应格式

```json
{
  "code": 200,
  "message": "请求成功",
  "data": { /* 响应数据 */ },
  "timestamp": 1705315800000,
  "path": "/api/xxx"
}
```

#### 错误响应格式

```json
{
  "code": 400,
  "message": "错误描述",
  "data": null,
  "timestamp": 1705315800000,
  "path": "/api/xxx"
}
```

开发环境下会额外返回错误堆栈信息：

```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null,
  "timestamp": 1705315800000,
  "path": "/api/xxx",
  "stack": "Error: ...\n    at ..."
}
```

#### 错误码规范

```typescript
export enum ErrorCode {
  // 通用错误 1000-1999
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,

  // 业务错误 2000-2999
  VALIDATION_ERROR = 2001,
  RESOURCE_NOT_FOUND = 2002,
  RESOURCE_ALREADY_EXISTS = 2003,
  OPERATION_FAILED = 2004,

  // 认证错误 3000-3999
  TOKEN_EXPIRED = 3001,
  TOKEN_INVALID = 3002,
  NO_PERMISSION = 3003,
}
```

### 4. 错误处理优化 ✅

#### 全局异常过滤器增强

- 集成 Winston 日志系统
- 详细记录错误信息（方法、URL、状态码、消息、堆栈、IP）
- 开发环境返回详细错误信息
- 生产环境隐藏敏感信息

#### 日志拦截器优化

- 记录所有 HTTP 请求和响应
- 自动计算请求耗时
- 记录请求参数（仅 debug 模式）
- 使用结构化日志格式

### 5. 项目结构优化 ✅

新增模块和文件：

```
src/
├── logger/                      # 日志模块
│   ├── logger.config.ts        # Winston 配置
│   ├── logger.service.ts       # 日志服务
│   └── logger.module.ts        # 日志模块
├── system/                      # 系统信息模块
│   ├── dto/
│   │   └── system-info.dto.ts # 系统信息 DTO
│   ├── system.controller.ts   # 系统信息控制器
│   ├── system.service.ts      # 系统信息服务
│   └── system.module.ts       # 系统模块
└── common/
    ├── filters/
    │   └── http-exception.filter.ts  # 优化的异常过滤器
    └── interceptors/
        └── logging.interceptor.ts    # 优化的日志拦截器
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 启动开发服务器

```bash
npm run start:dev
```

### 4. 访问接口

- API 文档：http://localhost:7001/api-docs
- 系统信息：http://localhost:7001/api/system/info
- 健康检查：http://localhost:7001/api/system/health

### 5. 查看日志

日志文件会自动生成在 `logs/` 目录下，按日期和类型分类存储。

## 依赖包说明

新增依赖：

- **winston**: 专业的日志库
- **nest-winston**: NestJS 的 Winston 集成
- **winston-daily-rotate-file**: 日志文件按日期自动分割

## 最佳实践

### 1. 日志记录

- **生产环境**：使用 `info` 级别，只记录重要信息
- **开发环境**：使用 `debug` 级别，记录详细信息
- **错误处理**：始终记录错误堆栈信息
- **敏感信息**：不要记录密码、Token 等敏感数据

### 2. 错误处理

- 使用 `BusinessException` 处理业务逻辑错误
- 使用标准的 HTTP 异常处理其他错误
- 为每种错误类型定义明确的错误码
- 提供清晰的错误消息

### 3. 系统监控

- 定期检查系统信息接口，监控资源使用情况
- 设置告警阈值（如内存使用率超过 80%）
- 监控日志文件大小，防止磁盘空间不足

## 性能优化

1. **日志性能**
   - 异步写入文件，不阻塞主线程
   - 自动压缩旧日志文件
   - 限制单个文件大小

2. **内存管理**
   - 定期清理过期日志文件
   - 使用流式处理大文件
   - 合理设置日志缓冲区

## 故障排查

### 日志文件未生成

1. 检查 `logs/` 目录是否有写入权限
2. 确认环境变量 `LOG_DIR` 配置正确
3. 查看控制台是否有错误信息

### 日志级别不生效

1. 确认 `.env` 文件中的 `LOG_LEVEL` 配置
2. 重启应用使配置生效
3. 检查是否被其他配置覆盖

### 系统信息接口返回不完整

1. 确认操作系统支持获取的信息类型
2. 检查是否有权限访问系统信息
3. 查看错误日志了解详情

## 后续优化建议

1. **日志分析**
   - 集成 ELK（Elasticsearch + Logstash + Kibana）进行日志分析
   - 使用 Grafana 进行日志可视化

2. **性能监控**
   - 集成 APM（Application Performance Monitoring）
   - 添加请求追踪（Tracing）

3. **告警系统**
   - 配置错误日志告警
   - 系统资源使用率告警

4. **日志增强**
   - 添加请求 ID 追踪
   - 记录用户操作审计日志
   - 集成链路追踪

## 相关文档

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Winston 文档](https://github.com/winstonjs/winston)
- [Nest Winston 文档](https://github.com/gremo/nest-winston)

## 版本历史

- **v1.0.0** (2024-01-15)
  - ✅ 集成 Winston 日志系统
  - ✅ 添加系统信息接口
  - ✅ 规范接口响应格式
  - ✅ 优化错误处理和日志记录

---

如有问题或建议，请联系开发团队。
