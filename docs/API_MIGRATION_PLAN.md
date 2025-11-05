# LDesign Tools API 接口转换方案

## 概述

将 LDesign 工具库转换为统一的 REST API 接口,通过 NestJS 框架提供服务。

## 已完成的模块

### ✅ 1. Node Manager (node-manager)
- **功能**: Node.js 版本管理
- **API 路径**: `/api/node`
- **主要接口**:
  - `GET /api/node/managers` - 获取所有版本管理器状态
  - `GET /api/node/current` - 获取当前 Node.js 版本
  - `GET /api/node/versions` - 获取已安装版本列表
  - `POST /api/node/versions` - 安装指定版本
  - `PUT /api/node/versions/:version` - 切换版本
  - `DELETE /api/node/versions/:version` - 删除版本

### ✅ 2. Project Manager (project-manager)
- **功能**: 项目管理、扫描、分析
- **API 路径**: `/api/projects`
- **主要接口**:
  - `GET /api/projects` - 获取所有项目
  - `GET /api/projects/:id` - 获取项目详情
  - `POST /api/projects` - 创建项目
  - `POST /api/projects/import` - 导入项目
  - `POST /api/projects/analyze` - 分析项目
  - `POST /api/projects/:id/command` - 执行项目命令

### ✅ 3. Git Management (git)
- **功能**: Git 仓库管理
- **API 路径**: `/api/git`
- **主要接口**:
  - `GET /api/git/status` - 获取 Git 状态
  - `GET /api/git/repo/info` - 获取仓库信息
  - `POST /api/git/repo/init` - 初始化仓库
  - `POST /api/git/repo/clone` - 克隆仓库
  - `POST /api/git/commit` - 提交更改
  - `POST /api/git/push` - 推送更新

### ✅ 4. Builder (builder) - 新增
- **功能**: 前端库打包构建
- **API 路径**: `/api/builder`
- **主要接口**:
  - `POST /api/builder/build` - 构建项目
  - `POST /api/builder/analyze` - 分析项目
  - `GET /api/builder/engines` - 获取支持的构建引擎
  - `GET /api/builder/formats` - 获取支持的构建格式

---

## 待实现的模块

### 📝 5. Changelog (changelog)
**优先级**: 高
**功能**: 自动化变更日志生成
**建议接口**:
```
POST   /api/changelog/generate      - 生成变更日志
GET    /api/changelog/:version      - 获取指定版本的日志
GET    /api/changelog/formats       - 获取支持的输出格式
POST   /api/changelog/parse         - 解析提交信息
GET    /api/changelog/statistics    - 获取统计信息
```

### 📦 6. Dependencies Manager (deps)
**优先级**: 高
**功能**: 依赖管理、分析、安全审计
**建议接口**:
```
GET    /api/deps/list               - 获取依赖列表
POST   /api/deps/install            - 安装依赖
POST   /api/deps/update             - 更新依赖
POST   /api/deps/analyze            - 分析依赖
GET    /api/deps/outdated           - 检查过时依赖
POST   /api/deps/audit              - 安全审计
GET    /api/deps/tree               - 依赖树
```

### 🚀 7. Deployer (deployer)
**优先级**: 中
**功能**: 部署管理 (Docker/K8s/CI-CD)
**建议接口**:
```
POST   /api/deployer/deploy         - 执行部署
GET    /api/deployer/status         - 部署状态
POST   /api/deployer/rollback       - 回滚部署
GET    /api/deployer/history        - 部署历史
POST   /api/deployer/preview        - 预览部署
GET    /api/deployer/templates      - 获取部署模板
```

### 🌍 8. Environment Manager (env)
**优先级**: 中
**功能**: 环境变量管理
**建议接口**:
```
GET    /api/env/list                - 获取环境变量列表
POST   /api/env/set                 - 设置环境变量
DELETE /api/env/:key                - 删除环境变量
POST   /api/env/load                - 加载 .env 文件
POST   /api/env/export              - 导出环境变量
GET    /api/env/validate            - 验证环境配置
```

### 📚 9. Docs Generator (docs-generator)
**优先级**: 中
**功能**: 文档生成
**建议接口**:
```
POST   /api/docs/generate           - 生成文档
GET    /api/docs/preview            - 预览文档
POST   /api/docs/extract            - 提取文档注释
GET    /api/docs/templates          - 获取文档模板
POST   /api/docs/build              - 构建文档站点
```

### 🎨 10. Formatter (formatter)
**优先级**: 中
**功能**: 代码格式化
**建议接口**:
```
POST   /api/formatter/format        - 格式化代码
POST   /api/formatter/check         - 检查格式
GET    /api/formatter/rules         - 获取格式化规则
POST   /api/formatter/fix           - 自动修复格式问题
GET    /api/formatter/config        - 获取格式化配置
```

### 🧬 11. Generator (generator)
**优先级**: 高
**功能**: 代码生成器
**建议接口**:
```
POST   /api/generator/generate      - 生成代码
GET    /api/generator/templates     - 获取模板列表
POST   /api/generator/component     - 生成组件
POST   /api/generator/page          - 生成页面
POST   /api/generator/api           - 生成 API
POST   /api/generator/custom        - 自定义生成
```

### 🚀 12. Launcher (launcher)
**优先级**: 低
**功能**: 项目启动器
**建议接口**:
```
POST   /api/launcher/start          - 启动项目
POST   /api/launcher/stop           - 停止项目
GET    /api/launcher/status         - 获取运行状态
GET    /api/launcher/logs           - 获取日志
POST   /api/launcher/restart        - 重启项目
```

### 🧪 13. Mock (mock)
**优先级**: 中
**功能**: 数据模拟
**建议接口**:
```
POST   /api/mock/generate           - 生成模拟数据
GET    /api/mock/templates          - 获取数据模板
POST   /api/mock/server/start       - 启动 Mock 服务器
POST   /api/mock/server/stop        - 停止 Mock 服务器
GET    /api/mock/server/status      - Mock 服务器状态
```

### 📊 14. Monitor (monitor)
**优先级**: 中
**功能**: 系统监控
**建议接口**:
```
GET    /api/monitor/metrics         - 获取监控指标
GET    /api/monitor/health          - 健康检查
GET    /api/monitor/logs            - 获取日志
GET    /api/monitor/alerts          - 获取告警
POST   /api/monitor/alert/config    - 配置告警规则
```

### ⚡ 15. Performance (performance)
**优先级**: 低
**功能**: 性能分析
**建议接口**:
```
POST   /api/performance/analyze     - 性能分析
GET    /api/performance/report      - 性能报告
POST   /api/performance/benchmark   - 基准测试
GET    /api/performance/metrics     - 性能指标
POST   /api/performance/compare     - 性能对比
```

### 📤 16. Publisher (publisher)
**优先级**: 中
**功能**: 包发布管理
**建议接口**:
```
POST   /api/publisher/publish       - 发布包
POST   /api/publisher/check         - 发布前检查
GET    /api/publisher/versions      - 获取已发布版本
POST   /api/publisher/unpublish     - 取消发布
GET    /api/publisher/status        - 发布状态
```

### 🔒 17. Security (security)
**优先级**: 高
**功能**: 安全检查
**建议接口**:
```
POST   /api/security/scan           - 安全扫描
GET    /api/security/vulnerabilities - 获取漏洞列表
POST   /api/security/audit          - 安全审计
GET    /api/security/report         - 安全报告
POST   /api/security/fix            - 修复安全问题
```

### 🧪 18. Testing (testing)
**优先级**: 高
**功能**: 测试工具
**建议接口**:
```
POST   /api/testing/run             - 运行测试
GET    /api/testing/results         - 测试结果
GET    /api/testing/coverage        - 覆盖率报告
POST   /api/testing/generate        - 生成测试用例
GET    /api/testing/frameworks      - 支持的测试框架
```

### 🌐 19. Translator (translator)
**优先级**: 低
**功能**: 国际化翻译
**建议接口**:
```
POST   /api/translator/translate    - 翻译文本
POST   /api/translator/extract      - 提取翻译键
GET    /api/translator/languages    - 支持的语言
POST   /api/translator/import       - 导入翻译文件
POST   /api/translator/export       - 导出翻译文件
```

---

## 实施步骤

### 阶段 1: 核心模块 (已完成)
- ✅ Node Manager
- ✅ Project Manager
- ✅ Git
- ✅ Builder

### 阶段 2: 高优先级模块 (推荐下一步)
1. **Changelog** - 变更日志生成
2. **Dependencies** - 依赖管理
3. **Generator** - 代码生成
4. **Security** - 安全检查
5. **Testing** - 测试工具

### 阶段 3: 中优先级模块
1. Deployer
2. Docs Generator
3. Formatter
4. Mock
5. Monitor
6. Publisher
7. Environment Manager

### 阶段 4: 低优先级模块
1. Launcher
2. Performance
3. Translator

---

## 模块创建模板

每个模块需要创建以下文件:

```
src/modules/{module-name}/
├── dto/
│   ├── {action}.dto.ts          # 数据传输对象
│   └── index.ts
├── {module-name}.controller.ts  # 控制器
├── {module-name}.service.ts     # 服务
└── {module-name}.module.ts      # 模块
```

### 标准文件模板

#### 1. DTO 文件
```typescript
import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ActionDto {
  @ApiProperty({ description: '描述', example: '示例' })
  @IsString()
  field!: string
}
```

#### 2. Service 文件
```typescript
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class ModuleService {
  private readonly logger = new Logger(ModuleService.name)

  async action(dto: ActionDto): Promise<Result> {
    // 实现逻辑
  }
}
```

#### 3. Controller 文件
```typescript
import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'

@ApiTags('module-name')
@Controller('module-name')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  @Post('action')
  @ApiOperation({ summary: '操作说明' })
  async action(@Body() dto: ActionDto) {
    const result = await this.service.action(dto)
    return { success: true, data: result }
  }
}
```

#### 4. Module 文件
```typescript
import { Module } from '@nestjs/common'

@Module({
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
```

---

## 集成到 AppModule

修改 `src/app.module.ts`:

```typescript
import { BuilderModule } from './modules/builder/builder.module.js'

@Module({
  imports: [
    // ... 其他模块
    BuilderModule,
    // 添加新模块
  ],
})
export class AppModule {}
```

修改 `src/main.ts` 添加 Swagger tags:

```typescript
const config = new DocumentBuilder()
  // ... 其他配置
  .addTag('builder', 'Builder Management')
  .build()
```

---

## 测试方案

1. 启动服务: `pnpm dev`
2. 访问 Swagger 文档: `http://localhost:3000/api-docs`
3. 测试每个 API 接口
4. 验证返回数据格式
5. 检查错误处理

---

## 注意事项

1. **统一的响应格式**:
```typescript
{
  success: boolean
  message?: string
  data?: any
  error?: string
}
```

2. **错误处理**: 使用 NestJS 内置异常类
   - `BadRequestException`
   - `NotFoundException`
   - `ConflictException`

3. **日志记录**: 使用 Logger 记录关键操作

4. **异步操作**: 所有 I/O 操作使用 async/await

5. **类型安全**: 使用 TypeScript 类型和接口

6. **API 文档**: 使用 Swagger 装饰器完善文档

---

## 后续优化

1. **WebSocket 支持**: 对于长时间运行的任务(构建、部署等)
2. **任务队列**: 使用 Bull 处理异步任务
3. **缓存**: 使用 Redis 缓存频繁查询的数据
4. **权限控制**: 添加认证和授权机制
5. **速率限制**: 防止 API 滥用
6. **数据持久化**: 存储任务历史和配置
