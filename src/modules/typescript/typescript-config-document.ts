/**
 * TypeScript 配置文档内容
 * 
 * 这是一份详细的 tsconfig.json 配置解析文档
 */
export const TYPESCRIPT_CONFIG_DOCUMENT = `# TypeScript 配置完全指南

## 概述

\`tsconfig.json\` 是 TypeScript 项目的配置文件，用于指定编译选项、文件包含/排除规则、以及项目引用等。本文档将详细介绍每个配置项的作用和用法。

---

## 根级配置选项

### files

**类型**: \`string[]\`

**说明**: 明确指定要编译的文件列表。如果指定了 \`files\`，TypeScript 只会编译这些文件，而不会自动发现其他文件。

**示例**:
\`\`\`json
{
  "files": [
    "src/index.ts",
    "src/utils.ts"
  ]
}
\`\`\`

**使用场景**: 当你只需要编译特定文件时使用，通常不推荐，因为需要手动维护文件列表。

---

### include

**类型**: \`string[]\`

**说明**: 指定要包含在编译中的文件或目录。支持 glob 模式匹配。

**默认值**: \`["**/*"]\`（如果未指定 \`files\`）

**示例**:
\`\`\`json
{
  "include": [
    "src/**/*",
    "tests/**/*"
  ]
}
\`\`\`

**常用模式**:
- \`"src/**/*"\` - 包含 src 目录下的所有文件
- \`"**/*.ts"\` - 包含所有 .ts 文件
- \`"**/*.tsx"\` - 包含所有 .tsx 文件

---

### exclude

**类型**: \`string[]\`

**说明**: 指定要从编译中排除的文件或目录。注意：\`exclude\` 只影响 \`include\` 选项，不会影响通过 \`files\` 明确指定的文件。

**默认值**: \`["node_modules", "bower_components", "jspm_packages"]\`

**示例**:
\`\`\`json
{
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}
\`\`\`

---

### extends

**类型**: \`string\`

**说明**: 继承另一个配置文件。可以继承基础配置，然后覆盖或扩展特定选项。

**示例**:
\`\`\`json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
\`\`\`

**使用场景**: 在 monorepo 项目中，可以创建一个基础配置，然后各个子项目继承它。

---

### references

**类型**: \`Array<{ path: string }>\`

**说明**: 项目引用，用于 TypeScript 项目引用功能。允许将大型项目拆分为多个较小的项目。

**示例**:
\`\`\`json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" }
  ]
}
\`\`\`

**使用场景**: 在 monorepo 中管理多个相互依赖的 TypeScript 项目。

---

## compilerOptions - 编译选项

### 语言和环境选项

#### target

**类型**: \`string\`

**说明**: 指定编译后的 JavaScript 版本。TypeScript 会将代码编译为指定版本的 JavaScript。

**可选值**: \`ES3\`, \`ES5\`, \`ES6\` / \`ES2015\`, \`ES2016\`, \`ES2017\`, \`ES2018\`, \`ES2019\`, \`ES2020\`, \`ES2021\`, \`ES2022\`, \`ES2023\`, \`ESNext\`

**默认值**: \`ES3\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020"
  }
}
\`\`\`

**建议**: 现代项目推荐使用 \`ES2020\` 或更高版本，以获得更好的性能和更少的编译代码。

---

#### lib

**类型**: \`string[]\`

**说明**: 指定要包含在编译中的库文件。这些库文件定义了全局类型和 API。

**可选值**: 
- ES 版本: \`ES5\`, \`ES6\`, \`ES2015\`, \`ES2016\`, \`ES2017\`, \`ES2018\`, \`ES2019\`, \`ES2020\`, \`ES2021\`, \`ES2022\`, \`ES2023\`, \`ESNext\`
- DOM: \`DOM\`, \`DOM.Iterable\`
- WebWorker: \`WebWorker\`, \`ScriptHost\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
\`\`\`

**说明**: 
- \`DOM\`: 包含浏览器 DOM API 的类型定义
- \`DOM.Iterable\`: 包含可迭代的 DOM 集合类型
- 通常需要与 \`target\` 版本匹配或更高

---

#### jsx

**类型**: \`"preserve" | "react" | "react-native" | "react-jsx" | "react-jsxdev"\`

**说明**: 指定如何处理 JSX 代码。

**可选值**:
- \`"preserve"\`: 保留 JSX 代码，不进行转换（需要其他工具处理）
- \`"react"\`: 将 JSX 转换为 \`React.createElement()\` 调用
- \`"react-native"\`: 保留 JSX，但生成 .js 文件
- \`"react-jsx"\`: 使用新的 JSX 转换（React 17+）
- \`"react-jsxdev"\`: 开发模式的新 JSX 转换

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
\`\`\`

**建议**: React 17+ 项目推荐使用 \`"react-jsx"\`，无需在每个文件中导入 React。

---

#### experimentalDecorators

**类型**: \`boolean\`

**说明**: 启用实验性装饰器支持。装饰器是 TypeScript 和 JavaScript 的一个提案功能。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
\`\`\`

**使用场景**: 使用 Angular、NestJS 等框架时通常需要启用。

---

#### emitDecoratorMetadata

**类型**: \`boolean\`

**说明**: 为装饰器发出设计类型元数据。需要 \`experimentalDecorators\` 为 \`true\`。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
\`\`\`

**使用场景**: NestJS、TypeORM 等框架需要此选项来支持依赖注入和元数据反射。

---

### 模块选项

#### module

**类型**: \`string\`

**说明**: 指定生成什么模块代码。

**可选值**: \`None\`, \`CommonJS\`, \`AMD\`, \`System\`, \`UMD\`, \`ES6\` / \`ES2015\`, \`ES2020\`, \`ES2022\`, \`ESNext\`, \`Node16\`, \`NodeNext\`

**默认值**: 如果 \`target\` 是 \`ES3\` 或 \`ES5\`，则为 \`CommonJS\`；否则为 \`ES6\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "module": "ES2020"
  }
}
\`\`\`

**说明**:
- \`CommonJS\`: Node.js 默认模块系统（\`require\` / \`module.exports\`）
- \`ES2020\` / \`ESNext\`: ES 模块（\`import\` / \`export\`）
- \`Node16\` / \`NodeNext\`: Node.js 16+ 的原生 ES 模块支持

---

#### moduleResolution

**类型**: \`"node" | "classic" | "node16" | "nodenext" | "bundler"\`

**说明**: 指定模块解析策略。

**可选值**:
- \`"classic"\`: TypeScript 1.6 之前的解析策略（不推荐）
- \`"node"\`: Node.js 风格的模块解析
- \`"node16"\` / \`"nodenext"\`: Node.js 16+ 的模块解析
- \`"bundler"\`: 适用于打包工具的解析策略

**默认值**: 如果 \`module\` 是 \`AMD\`, \`System\`, \`ES6\` 等，则为 \`"classic"\`；否则为 \`"node"\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
\`\`\`

---

#### baseUrl

**类型**: \`string\`

**说明**: 指定模块解析的基础目录。所有非相对模块导入都会相对于此目录解析。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "baseUrl": "./src"
  }
}
\`\`\`

**使用场景**: 避免使用相对路径导入（如 \`../../../utils\`），可以使用绝对路径（如 \`utils/helper\`）。

---

#### paths

**类型**: \`Record<string, string[]>\`

**说明**: 路径映射，用于将模块路径映射到实际文件路径。需要与 \`baseUrl\` 一起使用。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
\`\`\`

**使用场景**: 
- 使用别名简化导入路径
- 支持 monorepo 项目中的跨包导入

---

#### rootDirs

**类型**: \`string[]\`

**说明**: 指定多个根目录，这些目录的内容在运行时会被合并到一个目录中。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "rootDirs": ["src", "generated"]
  }
}
\`\`\`

**使用场景**: 当代码分布在多个目录中，但在运行时被视为同一目录时使用。

---

#### typeRoots

**类型**: \`string[]\`

**说明**: 指定类型定义文件的根目录。默认情况下，TypeScript 会在 \`node_modules/@types\` 中查找类型定义。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "typeRoots": ["./typings", "./node_modules/@types"]
  }
}
\`\`\`

---

#### types

**类型**: \`string[]\`

**说明**: 指定要包含的类型定义包。如果指定，只有列出的包会被包含。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "types": ["node", "jest"]
  }
}
\`\`\`

**注意**: 如果设置为空数组 \`[]\`，则不会自动包含任何类型定义。

---

#### resolveJsonModule

**类型**: \`boolean\`

**说明**: 允许导入 JSON 文件。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
\`\`\`

**使用场景**: 需要导入 JSON 配置文件或数据文件时。

---

#### allowSyntheticDefaultImports

**类型**: \`boolean\`

**说明**: 允许从没有默认导出的模块进行默认导入。不影响代码生成，只影响类型检查。

**默认值**: 如果 \`module\` 是 \`ES6\` 或更高，则为 \`true\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true
  }
}
\`\`\`

---

#### esModuleInterop

**类型**: \`boolean\`

**说明**: 启用 ES 模块互操作性。当设置为 \`true\` 时，\`allowSyntheticDefaultImports\` 也会自动设置为 \`true\`。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
\`\`\`

**建议**: 现代项目推荐启用，以便更好地与 CommonJS 模块互操作。

---

### 输出选项

#### outDir

**类型**: \`string\`

**说明**: 指定编译输出的目录。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "outDir": "./dist"
  }
}
\`\`\`

---

#### outFile

**类型**: \`string\`

**说明**: 将所有输出文件合并到一个文件中。只能与 \`module\` 为 \`AMD\` 或 \`System\` 时使用。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "module": "AMD",
    "outFile": "./dist/bundle.js"
  }
}
\`\`\`

**注意**: 不推荐使用，现代项目应该使用打包工具（如 Webpack、Rollup）来处理文件合并。

---

#### rootDir

**类型**: \`string\`

**说明**: 指定源文件的根目录。用于控制输出目录的结构。

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
\`\`\`

**说明**: 如果 \`src/index.ts\` 编译后会在 \`dist/index.js\`，保持相同的目录结构。

---

#### declaration

**类型**: \`boolean\`

**说明**: 生成对应的 .d.ts 声明文件。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "declaration": true
  }
}
\`\`\`

**使用场景**: 创建库时，需要生成类型定义文件供其他项目使用。

---

#### declarationMap

**类型**: \`boolean\`

**说明**: 为声明文件生成 source map。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
\`\`\`

**使用场景**: 在 IDE 中提供更好的跳转到源文件的功能。

---

#### sourceMap

**类型**: \`boolean\`

**说明**: 生成 source map 文件，用于调试。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
\`\`\`

**使用场景**: 开发环境推荐启用，方便调试编译后的代码。

---

#### removeComments

**类型**: \`boolean\`

**说明**: 移除编译输出中的注释。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "removeComments": true
  }
}
\`\`\`

**使用场景**: 生产环境可以启用，减小文件体积。

---

#### noEmit

**类型**: \`boolean\`

**说明**: 不生成输出文件，只进行类型检查。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "noEmit": true
  }
}
\`\`\`

**使用场景**: 当使用其他工具（如 Babel、SWC）进行编译时，TypeScript 只负责类型检查。

---

### 类型检查选项

#### strict

**类型**: \`boolean\`

**说明**: 启用所有严格类型检查选项。这是一个快捷方式，启用以下所有选项：
- \`strictNullChecks\`
- \`strictFunctionTypes\`
- \`strictBindCallApply\`
- \`strictPropertyInitialization\`
- \`noImplicitAny\`
- \`noImplicitThis\`
- \`alwaysStrict\`

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "strict": true
  }
}
\`\`\`

**强烈建议**: 新项目应该启用 \`strict\` 模式，以获得更好的类型安全。

---

#### noImplicitAny

**类型**: \`boolean\`

**说明**: 当表达式或声明具有隐式 \`any\` 类型时报告错误。

**默认值**: \`false\`（如果 \`strict\` 为 \`true\`，则为 \`true\`）

**示例**:
\`\`\`typescript
// 如果 noImplicitAny 为 true，这会报错
function add(a, b) {
  return a + b
}
\`\`\`

---

#### strictNullChecks

**类型**: \`boolean\`

**说明**: 启用严格的 null 检查。\`null\` 和 \`undefined\` 不能赋值给其他类型，除非明确声明。

**默认值**: \`false\`（如果 \`strict\` 为 \`true\`，则为 \`true\`）

**示例**:
\`\`\`typescript
// 如果 strictNullChecks 为 true
let name: string = null // 错误！
let name: string | null = null // 正确
\`\`\`

**建议**: 强烈推荐启用，可以避免很多运行时错误。

---

#### strictFunctionTypes

**类型**: \`boolean\`

**说明**: 启用严格的函数类型检查。函数参数类型是逆变的。

**默认值**: \`false\`（如果 \`strict\` 为 \`true\`，则为 \`true\`）

---

#### strictBindCallApply

**类型**: \`boolean\`

**说明**: 启用对 \`bind\`、\`call\` 和 \`apply\` 方法的严格检查。

**默认值**: \`false\`（如果 \`strict\` 为 \`true\`，则为 \`true\`）

---

#### strictPropertyInitialization

**类型**: \`boolean\`

**说明**: 确保类属性在使用前已初始化。需要 \`strictNullChecks\` 为 \`true\`。

**默认值**: \`false\`（如果 \`strict\` 为 \`true\`，则为 \`true\`）

**示例**:
\`\`\`typescript
class User {
  name: string // 错误！未初始化
  age: number = 0 // 正确
  email?: string // 正确，可选属性
}
\`\`\`

---

#### noImplicitThis

**类型**: \`boolean\`

**说明**: 当 \`this\` 表达式具有隐式 \`any\` 类型时报告错误。

**默认值**: \`false\`（如果 \`strict\` 为 \`true\`，则为 \`true\`）

---

#### noUnusedLocals

**类型**: \`boolean\`

**说明**: 报告未使用的局部变量错误。

**默认值**: \`false\`

**示例**:
\`\`\`typescript
function test() {
  const unused = 1 // 错误！
  const used = 2
  return used
}
\`\`\`

---

#### noUnusedParameters

**类型**: \`boolean\`

**说明**: 报告未使用的函数参数错误。

**默认值**: \`false\`

**示例**:
\`\`\`typescript
function test(unused: number) { // 错误！
  return 1
}
\`\`\`

---

#### noImplicitReturns

**类型**: \`boolean\`

**说明**: 当函数没有显式返回语句时报告错误。

**默认值**: \`false\`

---

#### noFallthroughCasesInSwitch

**类型**: \`boolean\`

**说明**: 报告 switch 语句中的 fallthrough 情况错误。

**默认值**: \`false\`

**示例**:
\`\`\`typescript
switch (value) {
  case 1:
    console.log('1')
    // 错误！缺少 break
  case 2:
    console.log('2')
    break
}
\`\`\`

---

### 其他选项

#### skipLibCheck

**类型**: \`boolean\`

**说明**: 跳过对声明文件（.d.ts）的类型检查。

**默认值**: \`false\`

**示例**:
\`\`\`json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
\`\`\`

**使用场景**: 可以加快编译速度，特别是在大型项目中。

---

#### forceConsistentCasingInFileNames

**类型**: \`boolean\`

**说明**: 确保文件名大小写一致。在大小写敏感的文件系统上很重要。

**默认值**: \`false\`

**建议**: 推荐启用，避免跨平台问题。

---

#### allowJs

**类型**: \`boolean\`

**说明**: 允许编译 JavaScript 文件。

**默认值**: \`false\`

**使用场景**: 在迁移 JavaScript 项目到 TypeScript 时很有用。

---

#### checkJs

**类型**: \`boolean\`

**说明**: 在 .js 文件中报告错误。需要 \`allowJs\` 为 \`true\`。

**默认值**: \`false\`

---

## 最佳实践

### 1. 启用严格模式

\`\`\`json
{
  "compilerOptions": {
    "strict": true
  }
}
\`\`\`

### 2. 使用路径别名

\`\`\`json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
\`\`\`

### 3. 生成声明文件（库项目）

\`\`\`json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
\`\`\`

### 4. 启用 Source Map（开发环境）

\`\`\`json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
\`\`\`

### 5. 使用现代 ES 版本

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
\`\`\`

---

## 常见问题

### Q: 如何配置路径别名？

A: 使用 \`baseUrl\` 和 \`paths\` 选项，并在打包工具（如 Vite、Webpack）中配置相应的别名。

### Q: strict 模式太严格怎么办？

A: 可以逐个启用 strict 的子选项，而不是一次性启用所有。

### Q: 如何加快编译速度？

A: 
- 启用 \`skipLibCheck\`
- 使用 \`incremental\` 选项
- 考虑使用项目引用（\`references\`）

### Q: 如何处理第三方库的类型定义？

A: 大多数库在 \`@types/\` 包中提供类型定义，或者库本身包含类型定义。如果都没有，可以创建 \`typings\` 目录并手动定义。

---

## 总结

\`tsconfig.json\` 是 TypeScript 项目的核心配置文件。合理配置可以：

- 提高代码质量和类型安全
- 优化编译输出
- 改善开发体验
- 加快编译速度

建议根据项目需求逐步调整配置，而不是一次性启用所有选项。

`






















