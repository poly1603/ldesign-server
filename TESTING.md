# 接口测试指南

本指南说明如何测试 LDesign Server 的 API 接口。

## 前置条件

1. **安装依赖**
   ```bash
   cd tools/server
   pnpm install
   ```

2. **构建项目**
   ```bash
   pnpm build
   ```

3. **启动服务**
   ```bash
   # 开发模式（支持热重载）
   pnpm start:dev
   
   # 或者生产模式
   pnpm start:prod
   ```

服务启动后会在控制台显示：
```
🚀 服务已启动: http://localhost:3000/api
📝 环境: development
📚 Swagger 文档已启用: http://localhost:3000/api-docs
```

## 测试方法

### 方法 1: 使用测试脚本（推荐）

```bash
# 在服务运行的情况下，在另一个终端执行
node test.js
```

测试脚本会：
- ✅ 自动检查服务连接
- ✅ 测试所有主要接口
- ✅ 显示详细的测试结果

### 方法 2: 使用 HTTP 文件（VSCode REST Client）

在 VSCode 中安装 "REST Client" 扩展，然后打开 `test-api.http` 文件，点击每个请求上方的 "Send Request" 按钮。

### 方法 3: 使用 Swagger UI（推荐用于探索）

1. 启动服务后，在浏览器中打开：
   ```
   http://localhost:3000/api-docs
   ```

2. 在 Swagger UI 中可以：
   - 📖 查看所有 API 文档
   - 🧪 直接在浏览器中测试接口
   - 📋 查看请求/响应示例

### 方法 4: 使用 curl

```bash
# 健康检查
curl http://localhost:3000/api/health

# Node 版本列表
curl http://localhost:3000/api/node/versions

# 项目列表
curl http://localhost:3000/api/projects
```

### 方法 5: 使用 Postman/Insomnia

1. 导入 OpenAPI 规范：
   ```
   http://localhost:3000/api-docs-json
   ```

2. 或者手动创建请求，使用基础 URL：
   ```
   http://localhost:3000/api
   ```

## 测试接口列表

### 健康检查
- `GET /api/health` - 检查服务状态和系统信息

### Node 版本管理
- `GET /api/node/manager/status` - 获取版本管理器状态
- `GET /api/node/managers` - 获取可用的版本管理器列表
- `GET /api/node/versions` - 获取已安装的 Node 版本
- `GET /api/node/current` - 获取当前使用的 Node 版本
- `GET /api/node/versions/available` - 获取可安装的版本列表
- `POST /api/node/install` - 安装指定版本的 Node
- `POST /api/node/switch` - 切换到指定版本
- `DELETE /api/node/versions/:version` - 删除指定版本

### Git 管理
- `GET /api/git/status` - 获取 Git 安装状态
- `GET /api/git/config` - 获取 Git 配置
- `POST /api/git/reinstall` - 重新安装 Git

### 项目管理
- `GET /api/projects` - 获取项目列表
- `GET /api/projects/:id` - 获取项目详情
- `POST /api/projects` - 创建新项目
- `POST /api/projects/import` - 导入项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `POST /api/projects/:id/open` - 更新最后打开时间

### 系统工具
- `GET /api/system/directory-picker` - 获取目录选择器信息
- `POST /api/system/validate-path` - 验证路径

## 常见问题

### 1. 连接被拒绝（ECONNREFUSED）

**原因**: 服务未启动

**解决方法**:
```bash
pnpm start:dev
```

### 2. 端口已被占用

**解决方法**:
- 修改 `.env` 文件中的 `PORT` 配置
- 或者停止占用端口的进程

### 3. 接口返回 404

**原因**: API 路径不正确

**解决方法**: 确保路径包含 `/api` 前缀，例如：
- ✅ `http://localhost:3000/api/health`
- ❌ `http://localhost:3000/health`

### 4. 接口返回 500 错误

**可能原因**:
- 数据库文件权限问题
- 依赖项缺失
- 配置错误

**解决方法**:
1. 检查控制台错误日志
2. 确认数据库文件可写
3. 重新安装依赖：`pnpm install`

## 自动化测试

运行单元测试：

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 测试覆盖率
pnpm test:cov

# UI 模式
pnpm test:ui
```

## 性能测试

使用 Apache Bench (ab) 进行压力测试：

```bash
# 安装 ab（如果未安装）
# Windows: 通过 XAMPP 或 Apache HTTP Server
# Linux/Mac: sudo apt-get install apache2-utils

# 测试健康检查接口
ab -n 1000 -c 10 http://localhost:3000/api/health
```

## 调试技巧

1. **查看详细日志**
   - 服务启动时会显示详细日志
   - 请求日志会自动记录在控制台

2. **使用 Swagger UI 测试**
   - 在浏览器中打开 Swagger UI
   - 可以直接测试接口并查看响应

3. **检查数据库**
   - 数据库文件：`ldesign-server.db`
   - 可以使用 SQLite 工具查看数据

## 测试检查清单

- [ ] 服务能够正常启动
- [ ] 健康检查接口返回 200
- [ ] Swagger 文档可以访问
- [ ] 所有 GET 接口正常响应
- [ ] POST/PUT/DELETE 接口功能正常
- [ ] 错误处理正确（返回标准格式）
- [ ] 请求日志正常记录

---

**提示**: 如果遇到问题，请查看控制台日志和错误信息，大多数问题都会有详细的错误提示。






















