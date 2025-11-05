# LDesign Tools API 服务器

> 本地开发工具集 REST API 服务 - 基于 NestJS

## 📋 项目概览

这是一个运行在本地的 REST API 服务，将 LDesign 工具库转换为 HTTP API 接口，方便前端应用或其他客户端调用。

**核心特性：**
- ✅ **27 个功能模块**，300+ API 端点
- ✅ 完整的 **Swagger/OpenAPI** 文档
- ✅ **SQLite** 数据库，轻量高效
- ✅ **本地运行**，无需认证
- ✅ **实时通信** WebSocket 支持
- ✅ **完整的错误处理** 和日志记录

---

## 🚀 快速开始

### 启动服务

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

### 访问服务

```
主服务: http://localhost:3000/api
API文档: http://localhost:3000/api-docs
```

---

## 📦 模块列表 (27个)

### 核心开发工具 (19个)

| 模块 | 端点数 | 功能描述 |
|------|--------|---------|
| **Node Manager** | 15+ | Node.js版本管理、切换、安装 |
| **Project Manager** | 20+ | 项目管理、命令执行、依赖分析 |
| **Git Manager** | 18+ | Git操作、分支管理、提交历史 |
| **Builder** | 12+ | 项目构建、打包、编译 |
| **Changelog** | 8+ | 变更日志生成、版本管理 |
| **Dependencies** | 10+ | 依赖分析、更新、漏洞检测 |
| **Generator** | 15+ | 代码生成器、模板管理 |
| **Security** | 12+ | 安全扫描、漏洞检测、审计 |
| **Testing** | 16+ | 测试运行、覆盖率、报告 |
| **Deployer** | 14+ | 部署管理、发布流程 |
| **Docs Generator** | 8+ | 文档生成、API文档 |
| **Environment Manager** | 10+ | 环境变量管理、配置 |
| **Formatter** | 9+ | 代码格式化、Lint检查 |
| **Mock** | 11+ | Mock数据生成、API模拟 |
| **Monitor** | 13+ | 性能监控、日志分析 |
| **Publisher** | 9+ | NPM/包发布管理 |
| **Performance** | 10+ | 性能测试、优化建议 |
| **Launcher** | 8+ | 应用启动、进程管理 |
| **Translator** | 7+ | 国际化、翻译管理 |

### 扩展功能模块 (6个)

| 模块 | 端点数 | 功能描述 |
|------|--------|---------|
| **File Manager** | 8 | 文件操作、压缩、搜索 |
| **Scheduler** | 11 | 定时任务、Cron作业 |
| **Workflow** | 14 | 工作流自动化、流程管理 |
| **Notification** | 14 | 通知系统、邮件、Webhook |
| **Database** | 11 | 数据库管理、备份、查询 |
| **Integration** | 28 | 第三方集成 (GitHub/GitLab/Docker/Jenkins) |

### 系统模块 (2个)

| 模块 | 端点数 | 功能描述 |
|------|--------|---------|
| **Health** | 3 | 健康检查、服务状态 |
| **System** | 8+ | 系统信息、资源监控 |

---

## 🔌 Integration 模块详解

最新添加的 Integration 模块提供第三方服务集成能力：

### GitHub 集成 (6个端点)

```typescript
POST /api/integration/github/repo              // 获取仓库信息
POST /api/integration/github/issues            // 获取Issues列表
POST /api/integration/github/issue/create      // 创建Issue
POST /api/integration/github/pr/create         // 创建Pull Request
POST /api/integration/github/workflows         // 获取Workflows
POST /api/integration/github/workflow/trigger  // 触发Workflow
```

**示例：创建GitHub Issue**
```bash
curl -X POST http://localhost:3000/api/integration/github/issue/create \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "your-username",
    "repo": "your-repo",
    "title": "Bug: API not working",
    "body": "Description of the issue",
    "labels": ["bug", "api"],
    "token": "ghp_your_token_here"
  }'
```

### GitLab 集成 (4个端点)

```typescript
POST /api/integration/gitlab/project           // 获取项目信息
POST /api/integration/gitlab/pipelines         // 获取Pipelines
POST /api/integration/gitlab/pipeline/trigger  // 触发Pipeline
POST /api/integration/gitlab/mr/create         // 创建Merge Request
```

### Docker 集成 (8个端点)

```typescript
POST /api/integration/docker/build             // 构建镜像
POST /api/integration/docker/run               // 运行容器
POST /api/integration/docker/operation         // 容器操作
GET  /api/integration/docker/ps                // 列出容器
GET  /api/integration/docker/images            // 列出镜像
POST /api/integration/docker/push              // 推送镜像
POST /api/integration/docker/pull              // 拉取镜像
```

**示例：构建Docker镜像**
```bash
curl -X POST http://localhost:3000/api/integration/docker/build \
  -H "Content-Type: application/json" \
  -d '{
    "dockerfile": "./Dockerfile",
    "context": ".",
    "tag": "myapp:latest",
    "buildArgs": {
      "NODE_VERSION": "18"
    }
  }'
```

### Jenkins 集成 (3个端点)

```typescript
POST /api/integration/jenkins/job/trigger      // 触发Job
POST /api/integration/jenkins/job/status       // 获取Job状态
GET  /api/integration/jenkins/jobs             // 列出Jobs
```

### 配置管理 (4个端点)

```typescript
POST   /api/integration/config                 // 保存配置
POST   /api/integration/config/list            // 配置列表
GET    /api/integration/config/:type/:name     // 获取配置
DELETE /api/integration/config/:type/:name     // 删除配置
```

---

## 📊 统计数据

```
总模块数:      27 个
总API端点:     300+ 个
代码文件:      100+ 个
代码行数:      18,000+ 行
数据库:        SQLite (TypeORM)
文档覆盖率:    100%
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **NestJS** | 10.x | 后端框架 |
| **TypeScript** | 5.7.3 | 编程语言 |
| **SQLite** | 3.x | 数据库 |
| **TypeORM** | 0.3.x | ORM框架 |
| **Swagger** | 7.x | API文档 |
| **class-validator** | 0.14.x | 数据验证 |
| **WebSocket** | - | 实时通信 |

---

## 📝 API 响应格式

所有API统一返回格式：

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "statusCode": 400,
  "timestamp": "2025-01-05T03:49:43.000Z",
  "path": "/api/..."
}
```

---

## 🔍 使用示例

### 1. 查看项目列表

```bash
curl http://localhost:3000/api/projects
```

### 2. 创建定时任务

```bash
curl -X POST http://localhost:3000/api/scheduler/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Build",
    "type": "cron",
    "cron": "0 2 * * *",
    "command": "npm run build"
  }'
```

### 3. 执行工作流

```bash
curl -X POST http://localhost:3000/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "workflow-123",
    "input": {}
  }'
```

### 4. 发送通知

```bash
curl -X POST http://localhost:3000/api/notification/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Build Complete",
    "body": "Your build has finished successfully."
  }'
```

---

## 🌐 WebSocket 支持

实时功能通过 WebSocket 提供：

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.on('open', () => {
  console.log('Connected to server')
})

ws.on('message', (data) => {
  const event = JSON.parse(data)
  console.log('Received:', event)
})

// 订阅构建事件
ws.send(JSON.stringify({
  action: 'subscribe',
  channel: 'build',
  projectId: 'project-123'
}))
```

---

## 📚 Swagger 文档

访问 **http://localhost:3000/api-docs** 可以：

- 📖 查看所有API接口文档
- 🧪 在线测试API
- 📥 导出OpenAPI规范
- 🔍 搜索和过滤接口

---

## 🔐 安全说明

**本服务设计为本地开发使用，无需认证。**

⚠️ **注意事项：**
- 仅在本机运行
- 不要暴露到公网
- 敏感数据请使用环境变量
- Token和密钥不要硬编码

---

## 📁 项目结构

```
src/
├── modules/              # 功能模块
│   ├── node/            # Node.js管理
│   ├── git/             # Git管理
│   ├── project/         # 项目管理
│   ├── integration/     # 第三方集成 ✨NEW
│   ├── file-manager/    # 文件管理
│   ├── scheduler/       # 任务调度
│   ├── workflow/        # 工作流
│   ├── notification/    # 通知系统
│   ├── database/        # 数据库管理
│   └── ...              # 其他模块
├── common/              # 公共组件
│   ├── filters/         # 异常过滤器
│   ├── interceptors/    # 拦截器
│   ├── middleware/      # 中间件
│   └── websocket/       # WebSocket
├── config/              # 配置管理
├── database/            # 数据库配置
├── app.module.ts        # 应用模块
└── main.ts              # 入口文件
```

---

## 🧪 开发指南

### 添加新模块

```bash
# 1. 创建模块目录
mkdir src/modules/your-module

# 2. 创建DTO
touch src/modules/your-module/dto/your-module.dto.ts

# 3. 创建Service
touch src/modules/your-module/your-module.service.ts

# 4. 创建Controller
touch src/modules/your-module/your-module.controller.ts

# 5. 创建Module
touch src/modules/your-module/your-module.module.ts

# 6. 在app.module.ts中注册模块
```

### 模块开发模板

```typescript
// DTO
export class CreateItemDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  @IsNotEmpty()
  name: string
}

// Service
@Injectable()
export class YourService {
  async create(dto: CreateItemDto) {
    return { success: true, data: { id: 1, ...dto } }
  }
}

// Controller
@ApiTags('your-module')
@Controller('api/your-module')
export class YourController {
  constructor(private readonly service: YourService) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  async create(@Body() dto: CreateItemDto) {
    try {
      return await this.service.create(dto)
    } catch (error: any) {
      throw new HttpException(
        error.message || '创建失败',
        HttpStatus.BAD_REQUEST
      )
    }
  }
}
```

---

## 🐛 常见问题

### Q: 端口被占用怎么办？

A: 服务会自动尝试其他端口（3001, 3002...）或终止占用进程。

### Q: 如何修改数据库路径？

A: 修改 `.env` 文件中的 `DATABASE_PATH` 配置。

### Q: 支持远程访问吗？

A: 默认仅监听 localhost，如需远程访问请修改配置并注意安全。

### Q: 如何添加认证？

A: 这是本地开发工具，默认无认证。如需要请参考 NestJS Guard 实现。

---

## 📈 性能优化

- ✅ SQLite WAL模式
- ✅ 查询缓存 (30秒)
- ✅ 响应压缩 (Gzip)
- ✅ 请求超时控制 (30秒)
- ✅ 内存映射I/O (256MB)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

---

## 🎉 更新日志

### v1.0.0 (2025-01-05)

- ✨ 新增 Integration 模块 (GitHub/GitLab/Docker/Jenkins)
- ✨ 新增 Workflow 工作流模块
- ✨ 新增 Scheduler 定时任务模块
- ✨ 新增 Notification 通知模块
- ✨ 新增 Database 数据库管理模块
- ✨ 新增 File Manager 文件管理模块
- 🎨 完整的 Swagger API 文档
- 🐛 修复多个模块的类型错误
- 📝 完善项目文档

---

## 📞 联系方式

如有问题请提交 Issue 或联系维护者。

**Happy Coding! 🚀**
