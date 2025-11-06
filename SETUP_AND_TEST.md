# 服务启动和测试指南

## 当前状态检查

服务目前**未运行**，需要先启动服务才能测试接口。

## 启动步骤

### 1. 安装依赖（如果未安装）

```bash
cd tools/server
pnpm install
```

### 2. 构建项目（如果需要）

```bash
pnpm build
```

### 3. 启动服务

```bash
# 开发模式（推荐，支持热重载）
pnpm start:dev

# 或生产模式
pnpm start:prod
```

### 4. 验证服务已启动

启动成功后，控制台会显示：
```
🚀 服务已启动: http://localhost:3000/api
📚 Swagger 文档已启用: http://localhost:3000/api-docs
```

## 测试接口

### 方法 1: 使用测试脚本

在**另一个终端**运行：

```bash
cd tools/server
node test.js
```

或使用 PowerShell：

```powershell
.\test-simple.ps1
```

### 方法 2: 使用浏览器访问 Swagger UI

打开浏览器访问：
```
http://localhost:3000/api-docs
```

可以在 Swagger UI 中：
- 查看所有 API 文档
- 直接测试接口
- 查看请求/响应格式

### 方法 3: 直接测试健康检查

```bash
curl http://localhost:3000/api/health
```

或使用 PowerShell：
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
```

## 快速启动命令

```bash
# 一键启动（需要先安装依赖）
cd tools/server
pnpm install && pnpm build && pnpm start:dev
```

## 常见问题

### 问题 1: 端口 3000 已被占用

**解决方法**:
- 修改 `.env` 文件中的 `PORT` 配置
- 或停止占用端口的进程

### 问题 2: 依赖安装失败

**解决方法**:
```bash
# 清理后重新安装
rm -rf node_modules
pnpm install
```

### 问题 3: 构建失败

**解决方法**:
- 检查 TypeScript 错误
- 确保所有依赖已安装
- 查看控制台错误信息

---

**提示**: 如果服务已启动，测试脚本会自动检测并测试所有接口。






















