# 架构设计文档

## 概述

本项目采�?NestJS 框架，遵循企业级应用的最佳实践，实现了模块化、可维护、可扩展的后端架构�?

## 设计原则

### 1. 模块化设�?(Modularity)

每个功能模块都是独立的，包含自己�?Controller、Service、DTO �?Entity。模块之间通过依赖注入进行通信�?

```
Module -> Controller -> Service -> Repository/External APIs
       -> Providers
```

### 2. 单一职责 (Single Responsibility)

- **Controller**: 负责处理 HTTP 请求和响�?
- **Service**: 负责业务逻辑处理
- **DTO**: 负责数据传输和验�?
- **Entity**: 负责数据模型定义

### 3. 依赖注入 (Dependency Injection)

使用 NestJS 的依赖注入系统，提高代码的可测试性和可维护性�?

## 技术架�?

### 分层架构

```
┌─────────────────────────────────────�?
�?        Client Layer                �?
�?    (Browser/Mobile/Desktop)        �?
└─────────────────────────────────────�?
              �?HTTP/HTTPS
┌─────────────────────────────────────�?
�?     API Gateway Layer              �?
�? (Middleware, Guards, Interceptors) �?
└─────────────────────────────────────�?
              �?
┌─────────────────────────────────────�?
�?    Controller Layer                �?
�?  (Route Handlers, Validators)      �?
└─────────────────────────────────────�?
              �?
┌─────────────────────────────────────�?
�?     Service Layer                  �?
�?   (Business Logic)                 �?
└─────────────────────────────────────�?
              �?
┌─────────────────────────────────────�?
�?   Data Access Layer                �?
�?  (Repository/ORM/External APIs)    �?
└─────────────────────────────────────�?
```

## 核心组件

### 1. 全局配置 (Global Configuration)

**位置**: `src/config/configuration.ts`

使用 @nestjs/config 管理所有环境变量和配置，支持：
- 类型安全的配置访�?
- 环境变量验证
- 默认值设�?
- 多环境支�?

### 2. 异常处理 (Exception Handling)

**位置**: `src/common/filters/http-exception.filter.ts`

- 全局异常过滤器捕获所有异�?
- 统一错误响应格式
- 详细的错误日志记�?
- 支持自定义业务异�?

**异常层级**:
```
BaseException
  ├── HttpException (NestJS)
  └── BusinessException (自定�?
        ├── ValidationException
        ├── NotFoundException
        └── ...
```

### 3. 响应转换 (Response Transformation)

**位置**: `src/common/interceptors/transform.interceptor.ts`

- 自动包装所有成功响�?
- 统一响应格式
- 支持自定义响应消�?

**响应结构**:
```typescript
{
  code: number;        // 状态码
  message: string;     // 响应消息
  data: T;            // 响应数据
  timestamp: number;   // 时间�?
  path: string;       // 请求路径
}
```

### 4. 日志系统 (Logging)

**位置**: `src/common/interceptors/logging.interceptor.ts`

自动记录所有请求的�?
- 请求信息（方法、路径、IP、UA�?
- 请求参数（body、query、params�?
- 响应时间
- 错误信息和堆�?

### 5. 数据验证 (Validation)

使用 class-validator �?class-transformer�?
- 自动类型转换
- 请求参数验证
- 详细的错误消�?
- 白名单过�?

## 请求生命周期

```
1. Client Request
   �?
2. Middleware (CORS, Body Parser)
   �?
3. Guards (Authentication, Authorization)
   �?
4. Interceptors (Before) - Logging
   �?
5. Pipes - Validation & Transformation
   �?
6. Controller Method - Route Handler
   �?
7. Service Method - Business Logic
   �?
8. Controller Return
   �?
9. Interceptors (After) - Transform Response
   �?
10. Exception Filters (if error)
   �?
11. Client Response
```

## 模块组织

### Common Module (通用模块)

提供全局共享的功能：
- DTO 基类
- 装饰�?
- 过滤�?
- 拦截�?
- 异常�?
- 工具函数

### Feature Modules (功能模块)

每个功能模块包含�?
```
users/
├── dto/                    # 数据传输对象
�?  ├── create-user.dto.ts
�?  └── update-user.dto.ts
├── entities/               # 实体�?
�?  └── user.entity.ts
├── users.controller.ts     # 控制�?
├── users.service.ts        # 服务
└── users.module.ts         # 模块定义
```

## 数据�?

### 创建资源 (POST)

```
Client
  �?POST /api/users + CreateUserDto
Controller
  �?Validation (class-validator)
Service
  �?Business Logic
  �?Check duplicates
  �?Create entity
Data Layer
  �?Save to database/storage
Service
  �?Return entity
Controller
  �?Auto-transform to ResponseDto
Client
  �?Response { code, message, data, ... }
```

## 扩展性设�?

### 添加新功能模�?

1. 使用 CLI 生成模块
   ```bash
   nest g resource products
   ```

2. 实现 CRUD 逻辑
   - 定义 Entity
   - 创建 DTO (Create/Update)
   - 实现 Service
   - 实现 Controller

3. 添加 Swagger 文档
   ```typescript
   @ApiTags('products')
   @Controller('products')
   export class ProductsController { ... }
   ```

4. 注册�?AppModule

### 添加中间�?

```typescript
// �?main.ts 或模块中
app.use(middleware);
```

### 添加守卫 (Guards)

```typescript
@UseGuards(AuthGuard)
export class ProtectedController { ... }
```

### 添加管道 (Pipes)

```typescript
@UsePipes(CustomValidationPipe)
create(@Body() dto: CreateDto) { ... }
```

## 性能优化

### 1. 缓存策略

可集成缓存：
- Redis 缓存
- In-memory 缓存
- HTTP 缓存�?

### 2. 数据库优�?

- 使用连接�?
- 查询优化
- 索引设计
- 分页查询

### 3. 异步处理

- 使用 Bull 队列
- 后台任务
- 定时任务

## 安全�?

### 1. 输入验证

- 使用 DTO �?class-validator
- 白名单过�?
- 类型转换

### 2. 认证授权

可集成：
- JWT 认证
- OAuth 2.0
- RBAC 权限控制

### 3. CORS

已启�?CORS，可根据需要配置：
```typescript
app.enableCors({
  origin: ['http://localhost:3001'],
  credentials: true,
});
```

### 4. 速率限制

可集�?@nestjs/throttler 防止 DDoS

## 测试策略

### 单元测试

- 测试 Service 逻辑
- Mock 依赖
- 覆盖�?> 80%

### 集成测试

- 测试 Controller �?Service 集成
- 使用测试数据�?

### E2E 测试

- 测试完整�?API 流程
- 模拟真实请求

## 部署建议

### 开发环�?

```bash
npm run start:dev
```

### 生产环境

1. **使用 PM2**
   ```bash
   pm2 start dist/main.js --instances max
   ```

2. **Docker 容器�?*
   ```bash
   docker-compose up -d
   ```

3. **Kubernetes 编排**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   ...
   ```

## 监控和日�?

### 推荐工具

- **日志**: Winston, Pino
- **监控**: Prometheus + Grafana
- **追踪**: Jaeger, Zipkin
- **错误跟踪**: Sentry

## 最佳实�?

1. �?使用 TypeScript 类型系统
2. �?遵循 SOLID 原则
3. �?编写清晰的文档和注释
4. �?使用 ESLint �?Prettier
5. �?编写测试用例
6. �?使用环境变量
7. �?版本控制和代码审�?
8. �?持续集成/持续部署

## 参考资�?

- [NestJS 官方文档](https://docs.nestjs.com)
- [TypeScript 手册](https://www.typescriptlang.org/docs)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
