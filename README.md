# NestJS API Server

基于 NestJS 构建的企业级 RESTful API 服务器，集成了最佳实践和完整的功能示例。

## 特性

- 📚 **Swagger 文档**: 自动生成 API 文档，支持在线测试
- ✅ **请求验证**: 使用 class-validator 进行参数验证
- 🔄 **统一响应**: 标准化的响应格式
- ⚠️ **异常处理**: 全局异常过滤器
- 📋 **日志系统**: 详细的请求和响应日志
- ⚙️ **环境配置**: 使用 @nestjs/config 管理配置
- ❤️ **健康检查**: 系统状态监控端点
- 💡 **代码示例**: 完整的 CRUD 示例（用户模块）

## 技术栈

- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **API 文档**: Swagger/OpenAPI
- **验证**: class-validator + class-transformer
- **配置**: @nestjs/config

## 项目结构

```
src/
├── common/                  # 通用模块
│   ├── decorators/         # 自定义装饰器
│   ├── dto/                # 通用 DTO
│   ├── exceptions/         # 自定义异常
│   ├── filters/            # 异常过滤器
│   └── interceptors/       # 拦截器
├── config/                  # 配置文件
├── health/                  # 健康检查模块
├── users/                   # 用户模块（示例）
│   ├── dto/                # 数据传输对象
│   ├── entities/           # 实体类
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── app.module.ts           # 根模块
└── main.ts                 # 应用入口
```

## 环境要求

- Node.js >= 18.x
- npm >= 9.x

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

### 3. 启动应用

```bash
# 开发模式（热重载）
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 4. 访问应用

- **API 地址**: http://localhost:3000/api
- **Swagger 文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/api/health

## 可用脚本

```bash
# 开发
npm run start          # 启动应用
npm run start:dev      # 开发模式（监听文件变化）
npm run start:debug    # 调试模式

# 构建
npm run build          # 构建生产版本

# 代码质量
npm run format         # 格式化代码
npm run lint           # 代码检查和修复

# 测试
npm run test           # 运行单元测试
npm run test:watch     # 监听模式运行测试
npm run test:cov       # 生成测试覆盖率报告
npm run test:e2e       # 运行端到端测试
```

## API 文档

本项目集成了 Swagger，启动应用后访问 http://localhost:3000/api-docs 即可查看完整的 API 文档。

Swagger 提供了：
- 📖 完整的 API 接口列表
- 🔍 接口详细说明和参数
- ✨ 在线测试功能
- 📋 请求/响应示例

## 核心功能说明

### 统一响应格式

所有 API 响应都遵循统一格式：

```json
{
  "code": 200,
  "message": "请求成功",
  "data": { ... },
  "timestamp": 1699999999999,
  "path": "/api/users"
}
```

### 请求验证

使用 DTO + class-validator 进行参数验证：

```typescript
export class CreateUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少3个字符' })
  username: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}
```

### 异常处理

使用业务异常类处理错误：

```typescript
import { BusinessException, ErrorCode } from './common/exceptions/business.exception';

throw new BusinessException('用户不存在', ErrorCode.RESOURCE_NOT_FOUND);
```

### 日志系统

自动记录所有请求和响应：
- 请求方法、路径、IP、User-Agent
- 请求参数（body、query、params）
- 响应时间和状态
- 错误堆栈信息

## 开发指南

### 创建新模块

使用 NestJS CLI 快速创建模块：

```bash
# 创建完整的 CRUD 模块
nest g resource products

# 创建单独的组件
nest g module products
nest g controller products
nest g service products
```

### 最佳实践

1. **模块化设计**：按功能划分模块，保持代码结构清晰
2. **DTO 验证**：所有输入都应通过 DTO 进行验证
3. **统一响应**：使用 `ApiSuccessResponse` 等装饰器
4. **错误处理**：使用 `BusinessException` 处理业务错误
5. **API 文档**：为所有接口添加 Swagger 装饰器
6. **日志记录**：在关键操作处添加日志

### 添加 Swagger 文档

```typescript
@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Post()
  @ApiOperation({ summary: '创建产品' })
  @ApiSuccessResponse('产品创建成功')
  create(@Body() dto: CreateProductDto) {
    // ...
  }
}
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 端口号 | `3000` |
| `APP_NAME` | 应用名称 | `NestJS API Server` |
| `API_PREFIX` | API 路径前缀 | `api` |
| `SWAGGER_ENABLED` | 是否启用 Swagger | `true` |
| `SWAGGER_PATH` | Swagger 文档路径 | `api-docs` |
| `LOG_LEVEL` | 日志级别 | `debug` |

## 示例模块

项目包含一个完整的用户管理示例模块 (`src/users`)，展示了：

- ✅ CRUD 完整操作
- ✅ DTO 验证
- ✅ 业务异常处理
- ✅ Swagger 文档
- ✅ 日志记录
- ✅ 统一响应格式

### API 示例

```bash
# 创建用户
POST /api/users
{
  "username": "john_doe",
  "email": "john@example.com",
  "age": 25
}

# 获取所有用户
GET /api/users

# 获取指定用户
GET /api/users/1

# 更新用户
PATCH /api/users/1
{
  "age": 26
}

# 删除用户
DELETE /api/users/1
```

## 生产部署

### 构建应用

```bash
npm run build
```

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name "nestjs-api"

# 查看日志
pm2 logs nestjs-api

# 重启应用
pm2 restart nestjs-api
```

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

构建和运行：

```bash
docker build -t nestjs-api .
docker run -p 3000:3000 nestjs-api
```

## 常见问题

### 端口被占用

修改 `.env` 文件中的 `PORT` 配置。

### Swagger 文档不显示

确保 `.env` 中 `SWAGGER_ENABLED=true`。

### 验证不生效

确保 DTO 类使用了 class-validator 装饰器，并且全局验证管道已启用。

## 许可证

MIT
