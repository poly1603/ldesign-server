/**
 * Package.json 配置文档内容
 * 
 * 这是一份详细的 package.json 配置解析文档
 */
export const PACKAGE_CONFIG_DOCUMENT = `# Package.json 配置完全指南

## 概述

\`package.json\` 是 Node.js 项目的核心配置文件，用于定义项目的元数据、依赖关系、脚本命令等。本文档将详细介绍每个字段的作用和用法。

---

## 基本信息字段

### name

**类型**: \`string\`（必需）

**说明**: 包的名称。必须是小写，一个单词，无空格，可以包含连字符（-）和下划线（_）。

**规则**:
- 长度不超过 214 个字符
- 不能以点（.）或下划线（_）开头
- 不能包含大写字母
- 不能包含 URL 不安全的字符

**示例**:
\`\`\`json
{
  "name": "my-package"
}
\`\`\`

---

### version

**类型**: \`string\`（必需）

**说明**: 包的版本号，必须遵循语义化版本规范（Semantic Versioning，简称 semver）。

**版本格式**: \`主版本号.次版本号.修订号\`

- **主版本号（Major）**: 不兼容的 API 修改
- **次版本号（Minor）**: 向后兼容的功能性新增
- **修订号（Patch）**: 向后兼容的问题修正

**示例**:
\`\`\`json
{
  "version": "1.0.0"
}
\`\`\`

**预发布版本**:
- \`1.0.0-alpha.1\` - 内部测试版本
- \`1.0.0-beta.1\` - 公开测试版本
- \`1.0.0-rc.1\` - 发布候选版本

---

### description

**类型**: \`string\`

**说明**: 包的简短描述，用于 npm 搜索和展示。

**示例**:
\`\`\`json
{
  "description": "A wonderful package for doing amazing things"
}
\`\`\`

---

### keywords

**类型**: \`string[]\`

**说明**: 关键词数组，用于 npm 搜索。帮助其他开发者找到你的包。

**示例**:
\`\`\`json
{
  "keywords": ["react", "vue", "typescript", "ui", "components"]
}
\`\`\`

---

### homepage

**类型**: \`string\`

**说明**: 项目主页的 URL。

**示例**:
\`\`\`json
{
  "homepage": "https://example.com"
}
\`\`\`

---

### bugs

**类型**: \`object\` 或 \`string\`

**说明**: 问题跟踪器的 URL 和/或电子邮件地址。

**示例**:
\`\`\`json
{
  "bugs": {
    "url": "https://github.com/user/repo/issues",
    "email": "support@example.com"
  }
}
\`\`\`

或简写形式：
\`\`\`json
{
  "bugs": "https://github.com/user/repo/issues"
}
\`\`\`

---

## 依赖管理字段

### dependencies

**类型**: \`object\`

**说明**: 生产环境依赖。这些依赖会在安装包时自动安装，并且会包含在包的依赖树中。

**版本范围语法**:
- \`^1.2.3\` - 兼容版本（推荐）：允许次版本号和修订号更新
- \`~1.2.3\` - 近似版本：只允许修订号更新
- \`1.2.3\` - 精确版本：必须完全匹配
- \`>=1.2.3\` - 大于等于
- \`<=1.2.3\` - 小于等于
- \`1.2.3 - 2.3.4\` - 版本范围
- \`*\` - 任何版本（不推荐）

**示例**:
\`\`\`json
{
  "dependencies": {
    "react": "^18.0.0",
    "vue": "^3.0.0",
    "lodash": "^4.17.21"
  }
}
\`\`\`

---

### devDependencies

**类型**: \`object\`

**说明**: 开发环境依赖。这些依赖只在开发时需要，不会安装到生产环境。

**使用场景**:
- 构建工具（webpack、vite、rollup）
- 测试框架（jest、mocha、vitest）
- 代码检查工具（eslint、prettier）
- TypeScript 编译器
- 开发服务器

**示例**:
\`\`\`json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "@types/node": "^20.0.0"
  }
}
\`\`\`

---

### peerDependencies

**类型**: \`object\`

**说明**: 对等依赖。表示你的包需要宿主环境提供这些依赖，但不会自动安装。

**使用场景**:
- 插件或库需要特定的框架版本
- 避免重复安装大型依赖
- 确保版本兼容性

**示例**:
\`\`\`json
{
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  }
}
\`\`\`

**注意**: npm 7+ 会自动安装 peerDependencies，npm 6 及以下版本需要手动安装。

---

### optionalDependencies

**类型**: \`object\`

**说明**: 可选依赖。如果安装失败，npm 不会报错，包仍然可以正常使用。

**使用场景**:
- 平台特定的依赖（如 \`fsevents\` 只在 macOS 上可用）
- 增强功能，但不是必需的

**示例**:
\`\`\`json
{
  "optionalDependencies": {
    "fsevents": "^2.0.0"
  }
}
\`\`\`

---

### bundledDependencies

**类型**: \`array\`

**说明**: 捆绑依赖。这些依赖会被打包到包的 tarball 中。

**使用场景**:
- 需要确保特定版本的依赖
- 离线安装支持
- 避免依赖版本冲突

**示例**:
\`\`\`json
{
  "bundledDependencies": ["lodash"]
}
\`\`\`

**注意**: 数组中的包名必须同时存在于 \`dependencies\` 或 \`devDependencies\` 中。

---

## 脚本命令字段

### scripts

**类型**: \`object\`

**说明**: 可以通过 \`npm run\` 执行的脚本命令。

**常用脚本**:
- \`start\` - 启动应用（\`npm start\` 可以省略 \`run\`）
- \`test\` - 运行测试（\`npm test\` 可以省略 \`run\`）
- \`build\` - 构建项目
- \`dev\` - 开发模式
- \`lint\` - 代码检查
- \`format\` - 代码格式化

**示例**:
\`\`\`json
{
  "scripts": {
    "start": "node index.js",
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "jest",
    "lint": "eslint src",
    "format": "prettier --write src"
  }
}
\`\`\`

**生命周期脚本**:
- \`preinstall\` - 安装前执行
- \`postinstall\` - 安装后执行
- \`prepublish\` - 发布前执行
- \`prepublishOnly\` - 仅在发布前执行（不包括本地安装）
- \`prepack\` - 打包前执行
- \`postpack\` - 打包后执行

---

## 文件配置字段

### main

**类型**: \`string\`

**说明**: 包的主入口文件。当其他包通过 \`require('your-package')\` 引入时，会加载这个文件。

**示例**:
\`\`\`json
{
  "main": "index.js"
}
\`\`\`

---

### module

**类型**: \`string\`

**说明**: ES 模块入口文件。支持 ES 模块的打包工具（如 webpack、rollup）会优先使用这个字段。

**示例**:
\`\`\`json
{
  "main": "lib/index.js",
  "module": "esm/index.js"
}
\`\`\`

---

### types / typings

**类型**: \`string\`

**说明**: TypeScript 类型定义文件的入口。\`typings\` 是 \`types\` 的别名。

**示例**:
\`\`\`json
{
  "types": "index.d.ts"
}
\`\`\`

---

### exports

**类型**: \`object\`

**说明**: 包的导出映射。允许定义多个入口点和条件导出。

**示例**:
\`\`\`json
{
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./cjs/index.js",
      "types": "./index.d.ts"
    },
    "./utils": {
      "import": "./esm/utils.js",
      "require": "./cjs/utils.js"
    }
  }
}
\`\`\`

**条件导出**:
- \`import\` - ES 模块导入
- \`require\` - CommonJS 导入
- \`node\` - Node.js 环境
- \`browser\` - 浏览器环境
- \`default\` - 默认导出

---

### files

**类型**: \`string[]\`

**说明**: 发布到 npm 时要包含的文件列表。如果未指定，默认包含所有文件（除了 \`.gitignore\` 中列出的）。

**示例**:
\`\`\`json
{
  "files": [
    "dist",
    "src",
    "README.md",
    "LICENSE"
  ]
}
\`\`\`

**默认包含的文件**（即使不在 \`files\` 中）:
- \`package.json\`
- \`README.md\`
- \`LICENSE\` / \`LICENCE\`
- \`CHANGELOG.md\` / \`CHANGES.md\` / \`HISTORY.md\`
- \`main\` 字段指定的文件

**默认排除的文件**:
- \`.git\`
- \`node_modules\`
- \`.DS_Store\`
- \`*.log\`
- \`npm-debug.log*\`

---

### bin

**类型**: \`object\` 或 \`string\`

**说明**: 可执行文件的映射。当包被全局安装时，这些文件会被链接到 PATH 中。

**示例**:
\`\`\`json
{
  "bin": {
    "my-cli": "./bin/cli.js"
  }
}
\`\`\`

或单个可执行文件：
\`\`\`json
{
  "bin": "./bin/cli.js"
}
\`\`\`

**注意**: 可执行文件必须以 \`#!/usr/bin/env node\` 开头。

---

## 发布配置字段

### private

**类型**: \`boolean\`

**说明**: 设置为 \`true\` 可以防止包被意外发布到 npm。

**示例**:
\`\`\`json
{
  "private": true
}
\`\`\`

**使用场景**:
- 内部项目
- 不打算发布的包
- 工作区根目录

---

### publishConfig

**类型**: \`object\`

**说明**: 发布时的配置选项，会覆盖默认的 npm 配置。

**示例**:
\`\`\`json
{
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  }
}
\`\`\`

**access 选项**:
- \`public\` - 公开包（默认，对于 scoped 包需要显式设置）
- \`restricted\` - 私有包（需要 npm 付费账户）

---

### os

**类型**: \`string[]\`

**说明**: 指定包支持的操作系统。

**可选值**:
- \`darwin\` - macOS
- \`linux\` - Linux
- \`win32\` - Windows
- \`freebsd\` - FreeBSD
- \`openbsd\` - OpenBSD
- \`sunos\` - SunOS
- \`aix\` - AIX

**示例**:
\`\`\`json
{
  "os": ["darwin", "linux", "win32"]
}
\`\`\`

---

### cpu

**类型**: \`string[]\`

**说明**: 指定包支持的 CPU 架构。

**可选值**:
- \`x64\` - 64 位 x86
- \`ia32\` - 32 位 x86
- \`arm\` - ARM
- \`arm64\` - ARM 64 位
- \`mips\` / \`mipsel\` - MIPS
- \`ppc\` / \`ppc64\` - PowerPC
- \`s390\` / \`s390x\` - IBM System z

**示例**:
\`\`\`json
{
  "cpu": ["x64", "arm64"]
}
\`\`\`

---

## 工作区配置字段

### workspaces

**类型**: \`string[]\`

**说明**: 工作区包列表。用于 monorepo 项目，允许在一个根目录下管理多个包。

**示例**:
\`\`\`json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
\`\`\`

**支持的 glob 模式**:
- \`packages/*\` - packages 目录下的所有包
- \`packages/**\` - packages 目录及其子目录下的所有包
- \`apps/app-*\` - apps 目录下以 app- 开头的包

---

## 引擎配置字段

### engines

**类型**: \`object\`

**说明**: 指定 Node.js 和 npm 的版本要求。

**示例**:
\`\`\`json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
\`\`\`

**版本语法**:
- \`>=18.0.0\` - 大于等于
- \`<=20.0.0\` - 小于等于
- \`18.x\` - 主版本匹配
- \`^18.0.0\` - 兼容版本

**注意**: \`engines\` 字段默认只是警告，不会阻止安装。要强制执行，需要设置 \`engine-strict=true\`（不推荐）。

---

## 仓库配置字段

### repository

**类型**: \`object\` 或 \`string\`

**说明**: 代码仓库的 URL 和类型。

**示例**:
\`\`\`json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/user/repo.git",
    "directory": "packages/my-package"
  }
}
\`\`\`

或简写形式：
\`\`\`json
{
  "repository": "https://github.com/user/repo.git"
}
\`\`\`

**支持的仓库类型**:
- \`git\` - Git 仓库
- \`svn\` - Subversion 仓库
- \`hg\` - Mercurial 仓库

---

## 作者信息字段

### author

**类型**: \`string\` 或 \`object\`

**说明**: 包作者信息。

**字符串格式**:
\`\`\`json
{
  "author": "John Doe <john@example.com> (https://example.com)"
}
\`\`\`

**对象格式**:
\`\`\`json
{
  "author": {
    "name": "John Doe",
    "email": "john@example.com",
    "url": "https://example.com"
  }
}
\`\`\`

---

### contributors

**类型**: \`array\`

**说明**: 包贡献者列表。格式与 \`author\` 相同。

**示例**:
\`\`\`json
{
  "contributors": [
    "Jane Doe <jane@example.com>",
    {
      "name": "Bob Smith",
      "email": "bob@example.com"
    }
  ]
}
\`\`\`

---

## 许可证字段

### license

**类型**: \`string\`

**说明**: 包的许可证。推荐使用 SPDX 许可证标识符。

**常用许可证**:
- \`MIT\` - MIT 许可证（最常用）
- \`Apache-2.0\` - Apache 2.0 许可证
- \`ISC\` - ISC 许可证
- \`BSD-2-Clause\` - BSD 2-Clause 许可证
- \`BSD-3-Clause\` - BSD 3-Clause 许可证
- \`GPL-2.0\` - GPL 2.0 许可证
- \`GPL-3.0\` - GPL 3.0 许可证
- \`LGPL-2.1\` - LGPL 2.1 许可证
- \`LGPL-3.0\` - LGPL 3.0 许可证
- \`Unlicense\` - 无许可证（公共领域）

**示例**:
\`\`\`json
{
  "license": "MIT"
}
\`\`\`

**多个许可证**:
\`\`\`json
{
  "license": "(MIT OR Apache-2.0)"
}
\`\`\`

---

### licenses

**类型**: \`array\`

**说明**: 许可证列表（已废弃，推荐使用 \`license\` 字段）。

**示例**:
\`\`\`json
{
  "licenses": [
    {
      "type": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    }
  ]
}
\`\`\`

---

## 配置选项字段

### config

**类型**: \`object\`

**说明**: 配置值，可以在脚本中通过环境变量访问。

**示例**:
\`\`\`json
{
  "config": {
    "port": 8080,
    "host": "localhost"
  }
}
\`\`\`

在脚本中使用：
\`\`\`json
{
  "scripts": {
    "start": "node server.js --port $npm_package_config_port"
  }
}
\`\`\`

---

## 其他字段

### preferGlobal

**类型**: \`boolean\`

**说明**: 如果为 \`true\`，npm 会警告用户如果包没有全局安装。

**示例**:
\`\`\`json
{
  "preferGlobal": true
}
\`\`\`

**注意**: 此字段已废弃，不推荐使用。

---

### directories

**类型**: \`object\`

**说明**: 目录结构提示，帮助工具了解项目的目录结构。

**示例**:
\`\`\`json
{
  "directories": {
    "lib": "lib",
    "bin": "bin",
    "man": "man",
    "doc": "doc",
    "example": "example",
    "test": "test"
  }
}
\`\`\`

---

## 最佳实践

### 1. 版本管理

\`\`\`json
{
  "version": "1.0.0"
}
\`\`\`

- 遵循语义化版本规范
- 使用自动化工具管理版本（如 \`npm version\`）

### 2. 依赖管理

\`\`\`json
{
  "dependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "react": ">=16.8.0"
  }
}
\`\`\`

- 生产依赖放在 \`dependencies\`
- 开发工具放在 \`devDependencies\`
- 使用 \`^\` 允许次版本更新（推荐）

### 3. 脚本命令

\`\`\`json
{
  "scripts": {
    "start": "node index.js",
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "jest",
    "lint": "eslint src"
  }
}
\`\`\`

- 使用有意义的脚本名称
- 组合多个命令使用 \`&&\` 或 \`|\`

### 4. 文件配置

\`\`\`json
{
  "main": "lib/index.js",
  "module": "esm/index.js",
  "types": "index.d.ts",
  "files": ["dist", "src", "README.md"]
}
\`\`\`

- 同时提供 CommonJS 和 ES 模块入口
- 明确指定要发布的文件

### 5. 工作区配置（Monorepo）

\`\`\`json
{
  "private": true,
  "workspaces": ["packages/*"]
}
\`\`\`

- 根目录设置为 \`private: true\`
- 使用 \`workspaces\` 管理多个包

---

## 常见问题

### Q: dependencies 和 devDependencies 的区别？

A: 
- \`dependencies\`: 生产环境需要的依赖，会安装到 \`node_modules\` 中
- \`devDependencies\`: 只在开发时需要，生产环境不会安装

### Q: ^ 和 ~ 的区别？

A:
- \`^1.2.3\`: 允许更新到 \`1.x.x\`（不更新主版本）
- \`~1.2.3\`: 只允许更新到 \`1.2.x\`（不更新次版本）

### Q: 如何发布私有包？

A: 使用 scoped 包名（如 \`@my-org/my-package\`）并设置 \`publishConfig.access\` 为 \`restricted\`。

### Q: workspaces 和 lerna/pnpm workspace 的关系？

A: \`workspaces\` 是 npm/yarn 的原生功能，pnpm 有自己的 workspace 配置，但都基于 \`package.json\` 的 \`workspaces\` 字段。

---

## 总结

\`package.json\` 是 Node.js 项目的核心配置文件。合理配置可以：

- 明确项目依赖和版本要求
- 提供便捷的脚本命令
- 控制包的发布和安装行为
- 支持 monorepo 工作区管理

建议根据项目需求逐步完善配置，而不是一次性添加所有字段。

`






















