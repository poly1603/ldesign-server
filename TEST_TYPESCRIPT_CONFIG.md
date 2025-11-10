# TypeScript 配置页面功能测试指南

## 测试前准备

1. 确保后端服务正在运行（`tools/server`）
2. 确保前端服务正在运行（`tools/web`）
3. 准备一个测试项目（有 `tsconfig.json` 和 `package.json`）

## 测试步骤

### 1. 测试配置保存功能

#### 步骤：
1. 打开 TypeScript 配置页面（`/projects/{projectId}/config/typescript`）
2. 修改任意配置项（例如：将 `target` 从 `ES2020` 改为 `ES2022`）
3. 点击"保存配置"按钮
4. 检查：
   - ✅ 是否显示"配置已成功保存到 tsconfig.json"提示
   - ✅ 页面是否刷新显示最新配置值
   - ✅ 打开项目的 `tsconfig.json` 文件，确认配置已正确保存

#### 预期结果：
- 配置成功保存到 `tsconfig.json`
- 页面显示更新后的配置值
- 文件中的配置格式正确（JSON 格式，2 空格缩进）

### 2. 测试版本更新功能

#### 步骤：
1. 打开 TypeScript 配置页面
2. 在版本选择器中选择不同的版本（例如：从 `5.7.3` 改为 `5.6.3`）
3. 点击版本旁边的更新按钮（Package 图标）
4. 检查：
   - ✅ 是否显示"TypeScript 版本已更新到 X.X.X"提示
   - ✅ 页面是否重新加载并显示新版本的配置项
   - ✅ 打开项目的 `package.json` 文件，确认 `devDependencies.typescript` 已更新

#### 预期结果：
- `package.json` 中的 `typescript` 版本已更新为 `^X.X.X`
- 配置页面显示的配置项根据新版本过滤（只显示该版本支持的配置项）
- 当前版本显示为更新后的版本

### 3. 测试配置刷新功能

#### 步骤：
1. 修改配置并保存
2. 刷新浏览器页面（F5）
3. 检查：
   - ✅ 页面是否显示保存后的配置值
   - ✅ 所有配置项是否正确加载

#### 预期结果：
- 刷新后显示的是最新保存的配置
- 配置值与 `tsconfig.json` 文件内容一致

### 4. 测试深度合并功能

#### 步骤：
1. 在 `tsconfig.json` 中设置一些配置（例如：`target: 'ES2020'`, `strict: true`）
2. 在配置页面只修改 `target` 为 `ES2022`
3. 保存配置
4. 检查：
   - ✅ `tsconfig.json` 中 `target` 已更新为 `ES2022`
   - ✅ `strict: true` 仍然保留（没有被删除）

#### 预期结果：
- 只修改的配置项被更新
- 未修改的配置项保持不变
- 嵌套对象（如 `compilerOptions`）正确合并

### 5. 测试版本过滤功能

#### 步骤：
1. 选择一个较旧的 TypeScript 版本（例如：`4.0.5`）
2. 检查配置项列表
3. 选择一个较新的版本（例如：`5.7.3`）
4. 检查配置项列表

#### 预期结果：
- 旧版本不显示新版本引入的配置项（有 `introducedIn` 的配置项）
- 新版本显示所有支持的配置项
- 已废弃的配置项（有 `deprecatedIn`）在相应版本中不显示

### 6. 测试中文名称显示

#### 步骤：
1. 查看配置页面
2. 检查所有配置项的标签

#### 预期结果：
- 所有配置项都显示中文名称
- 中文名称下方显示英文名称（较小字体）
- Tooltip 图标紧跟中文名称后面

## 常见问题排查

### 问题 1: 配置保存后页面没有更新
- **检查**：浏览器控制台是否有错误
- **解决**：检查 API 响应格式是否正确

### 问题 2: 版本更新后配置项没有变化
- **检查**：`loadSchema()` 是否被正确调用
- **解决**：确认版本更新后调用了 `loadConfig()`

### 问题 3: 配置保存后文件没有变化
- **检查**：后端日志是否有错误
- **解决**：检查项目路径是否正确，文件权限是否足够

## API 端点测试

可以使用以下 curl 命令测试 API：

```bash
# 获取版本列表
curl http://localhost:3000/api/api/typescript/versions

# 获取配置 Schema
curl http://localhost:3000/api/api/typescript/schema?version=5.7.3

# 获取项目配置
curl http://localhost:3000/api/api/typescript/project/{projectId}/config

# 更新配置
curl -X PUT http://localhost:3000/api/api/typescript/project/{projectId}/config \
  -H "Content-Type: application/json" \
  -d '{"config":{"compilerOptions":{"target":"ES2022"}}}'

# 更新版本
curl -X PUT http://localhost:3000/api/api/typescript/project/{projectId}/version \
  -H "Content-Type: application/json" \
  -d '{"version":"5.6.3"}'
```























