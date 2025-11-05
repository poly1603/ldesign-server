# LDesign Server - 快速开始指南

## 📦 已实现的 API 模块

### ✅ 1. Builder API (构建工具)

**基础路径**: `/api/builder`

#### 可用接口:

##### 1.1 构建项目
```http
POST /api/builder/build
Content-Type: application/json

{
  "path": "D:\\projects\\my-lib",
  "formats": ["esm", "cjs"],
  "engine": "rollup",
  "sourcemap": true,
  "minify": true,
  "watch": false,
  "outDir": "dist"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "构建成功",
  "data": {
    "success": true,
    "message": "构建成功",
    "outputs": [
      {
        "format": "esm",
        "file": "dist/index.js",
        "size": "42.3 KB"
      },
      {
        "format": "cjs",
        "file": "dist/index.cjs",
        "size": "43.1 KB"
      }
    ],
    "duration": 1234
  }
}
```

##### 1.2 分析项目
```http
POST /api/builder/analyze
Content-Type: application/json

{
  "path": "D:\\projects\\my-lib"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "framework": "React",
    "hasTypescript": true,
    "hasReact": true,
    "hasVue": false,
    "hasSvelte": false,
    "dependencies": {
      "react": "^18.0.0"
    },
    "devDependencies": {
      "typescript": "^5.0.0"
    },
    "entry": "src/index.ts",
    "recommendedEngine": "rollup",
    "recommendedFormats": ["esm", "cjs"]
  }
}
```

##### 1.3 获取支持的构建引擎
```http
GET /api/builder/engines
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "rollup",
      "available": true,
      "version": "4.x"
    },
    {
      "name": "esbuild",
      "available": true,
      "version": "0.20.x"
    }
  ]
}
```

##### 1.4 获取支持的构建格式
```http
GET /api/builder/formats
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "esm",
      "description": "ES Module format"
    },
    {
      "name": "cjs",
      "description": "CommonJS format"
    }
  ]
}
```

---

### ✅ 2. Node Manager API (Node版本管理)

**基础路径**: `/api/node`

#### 主要接口:

```http
GET    /api/node/managers              # 获取所有版本管理器状态
GET    /api/node/managers/current      # 获取当前管理器
GET    /api/node/current               # 获取当前Node版本
GET    /api/node/versions              # 获取已安装版本列表
GET    /api/node/versions/available    # 获取可用版本
GET    /api/node/versions/lts          # 获取LTS版本
POST   /api/node/versions              # 安装指定版本
PUT    /api/node/versions/:version     # 切换版本
DELETE /api/node/versions/:version     # 删除版本
```

---

### ✅ 3. Project Manager API (项目管理)

**基础路径**: `/api/projects`

#### 主要接口:

```http
GET    /api/projects                   # 获取所有项目
GET    /api/projects/paginated         # 分页获取项目
GET    /api/projects/:id               # 获取项目详情
POST   /api/projects                   # 创建项目
POST   /api/projects/import            # 导入项目
POST   /api/projects/analyze           # 分析项目
PUT    /api/projects/:id               # 更新项目
DELETE /api/projects/:id               # 删除项目
POST   /api/projects/:id/command       # 执行项目命令
GET    /api/projects/:id/command       # 获取命令执行记录
```

---

### ✅ 4. Git Manager API (Git管理)

**基础路径**: `/api/git`

#### 主要接口:

```http
GET    /api/git/status                 # 获取Git状态
GET    /api/git/repo/info              # 获取仓库信息
POST   /api/git/repo/init              # 初始化仓库
POST   /api/git/repo/clone             # 克隆仓库
GET    /api/git/commits                # 获取提交历史
POST   /api/git/branch                 # 创建分支
POST   /api/git/branch/checkout        # 切换分支
DELETE /api/git/branch                 # 删除分支
POST   /api/git/commit                 # 提交更改
POST   /api/git/pull                   # 拉取更新
POST   /api/git/push                   # 推送更新
```

---

## 🚀 启动服务

### 开发模式
```bash
cd D:\WorkBench\ldesign\tools\server
pnpm dev
```

### 生产模式
```bash
pnpm build
pnpm start
```

### 使用 PM2
```bash
pnpm start:pm2
```

---

## 📖 访问 API 文档

启动服务后,访问 Swagger 文档:

```
http://localhost:3000/api-docs
```

---

## 🧪 测试 API

### 使用 cURL

```bash
# 测试 Builder 分析接口
curl -X POST http://localhost:3000/api/builder/analyze \
  -H "Content-Type: application/json" \
  -d "{\"path\": \"D:\\\\projects\\\\my-lib\"}"

# 获取 Node 版本
curl http://localhost:3000/api/node/current

# 获取所有项目
curl http://localhost:3000/api/projects

# 获取 Git 状态
curl http://localhost:3000/api/git/status
```

### 使用 PowerShell

```powershell
# 测试 Builder 分析接口
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/builder/analyze" `
  -ContentType "application/json" `
  -Body '{"path": "D:\\projects\\my-lib"}'

# 获取 Node 版本
Invoke-RestMethod -Uri "http://localhost:3000/api/node/current"

# 获取所有项目
Invoke-RestMethod -Uri "http://localhost:3000/api/projects"
```

---

## 📋 响应格式

所有 API 返回统一的响应格式:

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 返回数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误描述"
}
```

---

## 🔍 下一步

1. 查看 [API 迁移计划](./API_MIGRATION_PLAN.md) 了解所有待实现的模块
2. 访问 Swagger 文档交互式测试 API
3. 根据需求选择优先实现的模块
4. 参考已有模块的实现方式创建新模块

---

## 📝 注意事项

1. **路径格式**: Windows 路径需要使用双反斜杠 `\\\\` 或单正斜杠 `/`
2. **端口占用**: 默认端口 3000,如被占用会自动切换到下一个可用端口
3. **数据库**: 使用 SQLite,数据库文件位于 `data/ldesign.db`
4. **日志**: 开发模式下会输出详细日志

---

## 🐛 常见问题

### 1. 端口被占用
服务会自动查找可用端口,无需手动处理

### 2. 模块未找到
确保安装了所有依赖: `pnpm install`

### 3. TypeScript 编译错误
运行类型检查: `pnpm type-check`

### 4. API 返回 404
检查路径是否包含 `/api` 前缀

---

## 📞 获取帮助

- 查看 [API 文档](http://localhost:3000/api-docs)
- 查看 [实现计划](./API_MIGRATION_PLAN.md)
- 检查服务日志
