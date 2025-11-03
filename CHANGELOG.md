# 变更日志

本文档记录了项目的所有重要变更。

## [1.0.0] - 2024-01-XX

### ✨ 新增功能

#### 配置管理
- ✅ 添加 `ConfigModule` - 统一的环境变量管理
- ✅ 添加 `ConfigService` - 配置验证和类型安全
- ✅ 支持环境变量验证和默认值

#### API 文档
- ✅ 集成 Swagger/OpenAPI 文档
- ✅ 自动生成 API 文档
- ✅ 支持在线测试接口
- ✅ 添加 `ApiStandardResponse` 装饰器统一响应格式

#### 日志系统
- ✅ 添加请求日志中间件 `LoggerMiddleware`
- ✅ 自动记录所有 HTTP 请求
- ✅ 根据状态码使用不同日志级别

#### 异常处理
- ✅ 添加 `BusinessException` 业务异常类
- ✅ 添加 `NotFoundBusinessException` 未找到异常
- ✅ 添加 `ConflictBusinessException` 冲突异常
- ✅ 添加 `UnauthorizedBusinessException` 未授权异常
- ✅ 添加 `ForbiddenBusinessException` 禁止访问异常
- ✅ 完善全局异常过滤器，支持业务异常

#### 健康检查
- ✅ 完善健康检查接口
- ✅ 添加系统信息（平台、架构、Node 版本、内存使用）

#### 测试框架
- ✅ 迁移测试框架从 Jest 到 Vitest
- ✅ 添加 Vitest 配置文件
- ✅ 支持测试 UI 和覆盖率报告

#### Docker 支持
- ✅ 添加 Dockerfile 多阶段构建
- ✅ 添加 docker-compose.yml
- ✅ 支持数据持久化
- ✅ 添加健康检查配置

### 🔧 改进

- ✅ 更新 `app.module.ts` 使用配置服务
- ✅ 更新 `main.ts` 集成 Swagger 和配置
- ✅ 完善响应 DTO，添加 Swagger 装饰器
- ✅ 更新异常过滤器支持业务异常和错误代码
- ✅ 优化日志输出格式

### 📝 文档

- ✅ 更新 README.md，添加新特性说明
- ✅ 添加环境变量配置说明
- ✅ 添加 Docker 部署说明
- ✅ 添加测试使用说明
- ✅ 添加 Swagger 文档访问说明

### 🛠️ 开发工具

- ✅ 添加 `.env.example` 环境变量模板
- ✅ 更新 `package.json` 脚本
- ✅ 添加 Vitest 相关依赖

### 📦 依赖更新

- ✅ 添加 `@nestjs/swagger@^7.4.2`
- ✅ 添加 `vitest@^2.1.5`
- ✅ 添加 `@vitest/ui@^2.1.5`
- ✅ 添加 `@vitest/coverage-v8@^2.1.5`
- ✅ 移除 `@types/jest`
- ✅ 移除 `jest` 和 `ts-jest`

---

## 版本说明

- **主版本号**：不兼容的 API 变更
- **次版本号**：向后兼容的功能新增
- **修订号**：向后兼容的问题修复

## 变更类型

- ✨ 新增功能
- 🐛 问题修复
- 🔧 改进优化
- 📝 文档更新
- ⚠️ 破坏性变更
- 🛠️ 开发工具

