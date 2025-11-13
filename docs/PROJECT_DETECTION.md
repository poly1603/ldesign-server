# 项目识别功能说明

## 概述

系统会根据项目的 `package.json` 自动识别项目类型和框架。

## 项目类型

系统支持以下项目类型：

| 类型 | 说明 | 识别条件 |
|------|------|----------|
| **HYBRID** | 库+项目混合 | 同时包含 `@ldesign/launcher` 和 `@ldesign/builder` |
| **PROJECT** | 项目（可运行的应用） | 包含 `@ldesign/launcher` 或后端框架依赖 |
| **LIBRARY** | 库（供其他项目使用） | 包含 `@ldesign/builder` |
| **STATIC** | 静态项目/前端项目 | 前端框架或其他类型 |

## 支持的框架识别

### 后端框架（自动设置为 PROJECT 类型）

- **NestJS** - 检测 `@nestjs/core` 或 `@nestjs/common`
- **Express** - 检测 `express`
- **Koa** - 检测 `koa`
- **Fastify** - 检测 `fastify`
- **Hapi** - 检测 `@hapi/hapi`

### 前端框架

- **Vue** - 检测 `vue`
- **React** - 检测 `react`
- **Angular** - 检测 `@angular/core`
- **Next.js** - 检测 `next`
- **Nuxt.js** - 检测 `nuxt`
- **Svelte** - 检测 `svelte`

## 识别优先级

1. **LDesign 特定包**（最高优先级）
   - `@ldesign/launcher` 和 `@ldesign/builder` 的组合决定 HYBRID/PROJECT/LIBRARY 类型

2. **后端框架**
   - 如果检测到后端框架，自动设置为 PROJECT 类型（除非被 LDesign 包覆盖）

3. **前端框架**
   - 如果只检测到前端框架，保持为 STATIC 类型（除非被 LDesign 包覆盖）

## 示例

### NestJS 项目

```json
{
  "name": "my-nestjs-api",
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0"
  }
}
```

**识别结果：**
- 类型：`PROJECT`
- 框架：`NestJS`

### Vue 前端项目

```json
{
  "name": "my-vue-app",
  "dependencies": {
    "vue": "^3.0.0"
  }
}
```

**识别结果：**
- 类型：`STATIC`
- 框架：`Vue`

### LDesign 项目

```json
{
  "name": "my-ldesign-project",
  "dependencies": {
    "@ldesign/launcher": "^1.0.0",
    "vue": "^3.0.0"
  }
}
```

**识别结果：**
- 类型：`PROJECT`（因为有 @ldesign/launcher）
- 框架：`Vue`

### Express API 项目

```json
{
  "name": "my-express-api",
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

**识别结果：**
- 类型：`PROJECT`
- 框架：`Express`

## 技术实现

识别逻辑位于 `src/projects/projects.service.ts` 的 `readProjectInfo` 方法中。

### 关键代码流程

1. 检查项目目录是否存在
2. 查找并读取 `package.json`
3. 合并 `dependencies` 和 `devDependencies`
4. 按优先级检测框架和类型
5. 返回项目信息

### API 端点

```http
POST /api/v1/projects/analyze
Content-Type: application/json

{
  "path": "D:\\WorkBench\\my-project"
}
```

**响应：**

```json
{
  "name": "my-project",
  "path": "D:\\WorkBench\\my-project",
  "version": "1.0.0",
  "type": "project",
  "framework": "NestJS",
  "hasPackageJson": true,
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0"
  }
}
```

## 扩展识别规则

如果需要添加新的框架识别，请修改 `src/projects/projects.service.ts` 文件中的检测逻辑：

```typescript
// 添加新的后端框架
else if (deps['your-framework']) {
  projectInfo.framework = 'YourFramework';
  projectInfo.type = ProjectType.PROJECT;
}

// 添加新的前端框架
else if (deps['your-frontend-framework']) {
  projectInfo.framework = 'YourFrontendFramework';
  // 前端框架保持 STATIC 类型（除非有 LDesign 包）
}
```

## 常见问题

### Q: 为什么我的 NestJS 项目被识别为"静态项目"？

A: 在 2025-11-13 之前的版本存在这个问题。请确保服务器已更新到最新版本。

### Q: 如何手动修改项目类型？

A: 导入项目后，可以通过编辑功能手动修改项目类型和框架信息。

### Q: 项目有多个框架怎么办？

A: 系统会按优先级选择最主要的框架。例如，同时有 Express 和 Vue，会优先识别为 Express（PROJECT 类型）。

### Q: 可以添加自定义框架吗？

A: 可以在导入后手动编辑框架字段，或者修改源代码添加新的检测规则。

## 更新日志

### 2025-11-13

- ✅ 添加后端框架识别（NestJS, Express, Koa, Fastify, Hapi）
- ✅ 修复 NestJS 项目被错误识别为静态项目的问题
- ✅ 优化识别优先级逻辑
- ✅ 改进代码注释和文档
