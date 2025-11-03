# @ldesign/server

LDesign 后台接口服务 - 基于 NestJS 的后台 API 服务，提供 Node 版本管理、Git 环境检测、项目管理等功能。

## ✨ 特性

- 🚀 **Node 版本管理** - 支持 nvm-windows、nvs、fnm 三种版本管理工具
- 🔧 **Git 环境管理** - 检测 Git 安装状态，支持通过包管理器重装
- 📦 **项目管理** - 完整的项目 CRUD 操作，支持项目导入和自动检测
- 🔍 **路径验证** - 完善的路径验证功能，确保路径安全
- 🎯 **统一响应格式** - 标准化的 API 响应格式
- 💾 **SQLite 数据库** - 轻量级本地数据库存储
- 📚 **Swagger 文档** - 自动生成的 API 文档，支持在线测试
- ⚙️ **配置管理** - 统一的环境变量管理和验证
- 📝 **请求日志** - 自动记录所有 HTTP 请求日志
- 🏥 **健康检查** - 详细的系统健康状态监控
- 🐳 **Docker 支持** - 完整的 Docker 部署方案
- 🧪 **测试框架** - 基于 Vitest 的现代化测试支持

## 📦 安装

```bash
# 安装依赖
pnpm install

# 复制环境变量文件（可选）
cp .env.example .env

# 构建项目
pnpm build

# 启动开发服务器（支持热重载）
pnpm start:dev

# 启动生产服务器
pnpm start:prod

# 启动调试模式
pnpm start:debug
```

## 🚀 快速开始

### 启动服务

```bash
# 开发模式（支持热重载）
pnpm start:dev

# 生产模式
pnpm start:prod
```

服务默认运行在 `http://localhost:3000/api`

### 访问 API 文档

启动服务后，访问 Swagger UI：
```
http://localhost:3000/api-docs
```

### 健康检查

```bash
curl http://localhost:3000/api/health
```

响应示例：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1704067200000,
    "uptime": 3600,
    "system": {
      "platform": "win32",
      "arch": "x64",
      "nodeVersion": "v20.10.0",
      "memory": {
        "total": 8589934592,
        "free": 4294967296,
        "used": 4294967296
      }
    }
  }
}
```

## 📚 API 文档

### Node 版本管理

#### 获取已安装的 Node 版本列表

```http
GET /api/node/versions
```

响应：

```json
{
  "success": true,
  "data": [
    {
      "version": "18.17.0",
      "installed": true,
      "active": false
    },
    {
      "version": "20.10.0",
      "installed": true,
      "active": true
    }
  ]
}
```

#### 获取当前使用的 Node 版本

```http
GET /api/node/current
```

#### 获取可用的版本管理工具列表

```http
GET /api/node/managers
```

#### 检测已安装的版本管理工具状态

```http
GET /api/node/manager/status
```

#### 安装指定的版本管理工具

```http
POST /api/node/manager/install
Content-Type: application/json

{
  "managerType": "nvm-windows"
}
```

#### 安装指定版本的 Node.js

```http
POST /api/node/install
Content-Type: application/json

{
  "version": "18.17.0"
}
```

#### 切换到指定版本

```http
POST /api/node/switch
Content-Type: application/json

{
  "version": "20.10.0"
}
```

#### 删除指定版本

```http
DELETE /api/node/versions/18.17.0
```

#### 获取可用版本列表（从远程）

```http
GET /api/node/versions/available
```

### Git 管理

#### 检测 Git 安装状态和版本

```http
GET /api/git/status
```

响应：

```json
{
  "success": true,
  "data": {
    "installed": true,
    "version": "git version 2.42.0.windows.2",
    "path": "C:\\Program Files\\Git\\cmd\\git.exe"
  }
}
```

#### 获取 Git 配置信息

```http
GET /api/git/config
```

#### 重新安装 Git

```http
POST /api/git/reinstall
Content-Type: application/json

{
  "packageManager": "chocolatey"  // 可选：chocolatey 或 scoop
}
```

### 项目管理

#### 获取项目列表

```http
GET /api/projects
```

#### 获取项目详情

```http
GET /api/projects/:id
```

#### 创建新项目

```http
POST /api/projects
Content-Type: application/json

{
  "name": "my-project",
  "path": "C:\\Projects\\my-project",
  "type": "web",
  "framework": "vue",
  "packageManager": "pnpm",
  "description": "我的项目描述"
}
```

#### 导入项目

```http
POST /api/projects/import
Content-Type: application/json

{
  "path": "C:\\Projects\\existing-project",
  "name": "Existing Project"  // 可选
}
```

#### 更新项目

```http
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

#### 删除项目

```http
DELETE /api/projects/:id
```

#### 更新项目最后打开时间

```http
POST /api/projects/:id/open
```

### 系统工具

#### 验证路径是否有效

```http
POST /api/system/validate-path
Content-Type: application/json

{
  "path": "C:\\Projects\\my-project",
  "mustExist": true,
  "mustBeDirectory": true,
  "mustBeReadable": true
}
```

响应：

```json
{
  "success": true,
  "data": {
    "valid": true,
    "exists": true,
    "isDirectory": true,
    "isReadable": true,
    "isWritable": true,
    "errors": [],
    "normalizedPath": "C:\\Projects\\my-project"
  }
}
```

#### 获取目录选择器提示信息

```http
GET /api/system/directory-picker
```

响应：

```json
{
  "success": true,
  "data": {
    "platform": "Windows",
    "method": "window.showDirectoryPicker()",
    "description": "使用浏览器原生的 Directory Picker API 选择目录...",
    "example": "..."
  }
}
```

## 🏗️ 项目结构

```
src/
├── main.ts                    # 应用入口
├── app.module.ts              # 根模块
├── app.controller.ts          # 根控制器
├── modules/
│   ├── node/                  # Node 版本管理模块
│   ├── git/                   # Git 管理模块
│   ├── project/               # 项目管理模块
│   └── system/                # 系统工具模块
├── common/                    # 通用模块
│   ├── filters/               # 异常过滤器
│   ├── interceptors/          # 拦截器
│   └── dto/                   # 通用 DTO
├── database/                  # 数据库模块
└── utils/                     # 工具类
    ├── exec.util.ts           # 命令执行工具
    ├── path.util.ts           # 路径工具
    └── package-manager.util.ts # 包管理器工具
```

## 🔧 配置

### 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# 服务端口
PORT=3000

# 环境模式: development | production | test
NODE_ENV=development

# API 前缀
API_PREFIX=api

# 数据库路径
DATABASE_PATH=ldesign-server.db

# CORS 配置
CORS_ORIGIN=true
CORS_CREDENTIALS=true

# Swagger 配置
SWAGGER_ENABLED=true
SWAGGER_TITLE=LDesign Server API
SWAGGER_DESCRIPTION=LDesign 后台接口服务
SWAGGER_VERSION=1.0.0
SWAGGER_PATH=api-docs

# 日志配置
LOG_LEVEL=log
LOG_TIMESTAMP=true
```

### 数据库

数据库文件位置：`ldesign-server.db`（SQLite）

数据库会在首次启动时自动创建。

## 📝 开发

### 代码规范

项目使用 ESLint 和 Prettier 进行代码格式化：

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint --fix
```

### 测试

```bash
# 运行测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 使用 UI 运行测试
pnpm test:ui

# 测试覆盖率
pnpm test:cov

# E2E 测试
pnpm test:e2e
```

### Docker 部署

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 构建 Docker 镜像
docker build -f Dockerfile -t ldesign-server:latest ../..

# 运行容器
docker run -d -p 3000:3000 --name ldesign-server ldesign-server:latest
```

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关链接

- [NestJS 文档](https://docs.nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [Better-SQLite3 文档](https://github.com/WiseLibs/better-sqlite3)

