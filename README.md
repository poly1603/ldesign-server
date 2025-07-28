# LDesign API Server

企业级后端API管理系统，基于 NestJS + TypeScript + MySQL + Redis 构建。

## 🚀 特性

- **现代化技术栈**: NestJS + TypeScript + TypeORM + MySQL + Redis
- **完整的认证授权**: JWT + RBAC权限控制
- **API文档**: 集成Swagger自动生成文档
- **数据验证**: 基于class-validator的请求验证
- **错误处理**: 全局异常过滤器和统一响应格式
- **日志记录**: 结构化日志和请求追踪
- **缓存支持**: Redis缓存和会话管理
- **限流保护**: 基于IP的请求限流
- **Docker支持**: 完整的容器化部署方案
- **环境配置**: 多环境配置管理

## 📋 系统要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL >= 8.0
- Redis >= 6.0

## 🛠️ 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ldesign-server
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

复制环境变量文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库和其他服务：

```env
# 应用配置
APP_NAME=LDesign API Server
APP_PORT=3000
APP_ENV=development

# 数据库配置（远程MySQL）
DB_TYPE=mysql
DB_HOST=192.168.3.227
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=ldesign_api

# Redis配置（远程Redis）
REDIS_HOST=192.168.3.227
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

### 4. 数据库初始化

```bash
# 同步数据库结构
pnpm run db:sync

# 或者运行迁移（推荐生产环境）
pnpm run migration:run
```

### 5. 启动开发服务器

```bash
pnpm run start:dev
```

应用将在 `http://localhost:3000` 启动。

### 6. 访问API文档

开发环境下，Swagger文档可在以下地址访问：
- API文档: `http://localhost:3000/api-docs`
- 健康检查: `http://localhost:3000/api/v1/health`

## 🐳 Docker 部署

### 开发环境

启动开发环境的数据库服务：

```bash
docker-compose -f docker-compose.dev.yml up -d
```

这将启动：
- MySQL (端口: 3307)
- Redis (端口: 6380)
- phpMyAdmin (端口: 8080)
- Redis Commander (端口: 8081)

### 生产环境

```bash
# 构建并启动所有服务
docker-compose up -d

# 仅启动应用（使用外部数据库）
docker-compose up -d app
```

## 📁 项目结构

```
src/
├── auth/                 # 认证模块
│   ├── dto/             # 数据传输对象
│   ├── strategies/      # Passport策略
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── common/              # 通用模块
│   ├── decorators/      # 装饰器
│   ├── dto/            # 通用DTO
│   ├── filters/        # 异常过滤器
│   ├── guards/         # 守卫
│   └── interceptors/   # 拦截器
├── config/             # 配置文件
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
├── entities/           # 数据库实体
│   ├── user.entity.ts
│   ├── role.entity.ts
│   ├── permission.entity.ts
│   ├── menu.entity.ts
│   └── system-log.entity.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## 🔧 可用脚本

```bash
# 开发
pnpm run start:dev      # 启动开发服务器
pnpm run start:debug    # 启动调试模式

# 构建
pnpm run build          # 构建生产版本
pnpm run start:prod     # 启动生产服务器

# 测试
pnpm run test           # 运行单元测试
pnpm run test:e2e       # 运行端到端测试
pnpm run test:cov       # 运行测试覆盖率

# 代码质量
pnpm run lint           # 代码检查
pnpm run format         # 代码格式化

# 数据库
pnpm run db:sync        # 同步数据库结构
pnpm run migration:generate  # 生成迁移文件
pnpm run migration:run  # 运行迁移
```

## 🌐 API 接口

### 认证接口

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/refresh` - 刷新令牌
- `POST /api/v1/auth/logout` - 用户登出
- `PATCH /api/v1/auth/change-password` - 修改密码
- `POST /api/v1/auth/forgot-password` - 忘记密码
- `POST /api/v1/auth/reset-password` - 重置密码
- `POST /api/v1/auth/verify-token` - 验证令牌

### 系统接口

- `GET /api/v1/` - 获取应用信息
- `GET /api/v1/health` - 健康检查

## 🔐 权限系统

系统采用基于角色的访问控制（RBAC）：

- **用户（User）**: 系统用户
- **角色（Role）**: 用户角色，如管理员、普通用户等
- **权限（Permission）**: 具体的操作权限
- **菜单（Menu）**: 系统菜单，与权限关联

### 权限装饰器使用

```typescript
// 公开接口（无需认证）
@Public()
@Get('public')
publicEndpoint() {}

// 需要特定权限
@Permissions('user:read', 'user:write')
@Get('users')
getUsers() {}

// 需要特定角色
@Roles('admin', 'manager')
@Delete('users/:id')
deleteUser() {}

// 超级管理员权限
@SuperAdmin()
@Post('system/reset')
resetSystem() {}
```

## 📊 监控和日志

- **请求日志**: 自动记录所有API请求
- **错误日志**: 详细的错误堆栈信息
- **性能监控**: 请求响应时间统计
- **健康检查**: 系统状态监控端点

## 🚀 部署指南

### 1. 环境准备

确保服务器已安装：
- Docker & Docker Compose
- Node.js 18+ (如果不使用Docker)
- MySQL 8.0+
- Redis 6.0+

### 2. 配置文件

创建生产环境配置文件 `.env.production`：

```env
NODE_ENV=production
APP_PORT=3000
DB_HOST=your-mysql-host
DB_USERNAME=your-username
DB_PASSWORD=your-password
REDIS_HOST=your-redis-host
JWT_SECRET=your-production-jwt-secret
```

### 3. 使用Docker部署

```bash
# 拉取最新代码
git pull origin main

# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 4. 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 构建应用
pnpm run build

# 启动应用
pm2 start dist/main.js --name "ldesign-api"

# 保存PM2配置
pm2 save
pm2 startup
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您有任何问题或建议，请：

1. 查看 [文档](./docs)
2. 提交 [Issue](../../issues)
3. 联系维护者

---

**LDesign API Server** - 让API开发更简单、更高效！