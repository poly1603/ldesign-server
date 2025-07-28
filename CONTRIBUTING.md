# 贡献指南

感谢您对 LDesign API Server 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 添加新功能
- 🧪 编写测试
- 🎨 改进代码质量

## 📋 开始之前

在开始贡献之前，请确保您已经：

1. ⭐ 给项目点个 Star
2. 📖 阅读了 [README.md](./README.md)
3. 🔍 搜索了现有的 [Issues](../../issues) 和 [Pull Requests](../../pulls)
4. 📋 了解了项目的 [行为准则](#行为准则)

## 🚀 快速开始

### 1. Fork 和克隆项目

```bash
# Fork 项目到您的 GitHub 账户
# 然后克隆到本地
git clone https://github.com/YOUR_USERNAME/ldesign-server.git
cd ldesign-server

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/ldesign-server.git
```

### 2. 设置开发环境

```bash
# 安装依赖
pnpm install

# 复制环境变量文件
cp .env.example .env

# 启动开发环境数据库
docker-compose -f docker-compose.dev.yml up -d

# 启动开发服务器
pnpm run start:dev
```

### 3. 创建分支

```bash
# 确保您在最新的 main 分支
git checkout main
git pull upstream main

# 创建新的功能分支
git checkout -b feature/your-feature-name
# 或者修复分支
git checkout -b fix/your-fix-name
```

## 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来编写提交信息。

### 提交信息格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复 Bug 的代码变动）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 相关变动
- `build`: 构建系统或外部依赖的变动

### 提交示例

```bash
# 新功能
git commit -m "feat(auth): add password reset functionality"

# 修复 Bug
git commit -m "fix(user): resolve email validation issue"

# 文档更新
git commit -m "docs: update API documentation"

# 重构
git commit -m "refactor(auth): simplify JWT token validation"
```

## 🧪 代码规范

### 代码风格

我们使用 ESLint 和 Prettier 来保持代码风格的一致性：

```bash
# 检查代码风格
pnpm run lint

# 自动修复代码风格问题
pnpm run lint:fix

# 格式化代码
pnpm run format
```

### TypeScript 规范

- 使用 TypeScript 严格模式
- 为所有函数和方法添加类型注解
- 使用接口定义数据结构
- 避免使用 `any` 类型

### 命名规范

- **文件名**: 使用 kebab-case（如：`user.service.ts`）
- **类名**: 使用 PascalCase（如：`UserService`）
- **方法名**: 使用 camelCase（如：`getUserById`）
- **常量**: 使用 UPPER_SNAKE_CASE（如：`MAX_RETRY_COUNT`）
- **接口**: 使用 PascalCase，可选择性添加 `I` 前缀（如：`User` 或 `IUser`）

### 代码组织

```typescript
// 1. 导入第三方库
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// 2. 导入项目内部模块
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

// 3. 类定义
@Injectable()
export class UserService {
  // 4. 构造函数
  constructor(
    private readonly userRepository: Repository<User>,
  ) {}

  // 5. 公共方法
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 实现逻辑
  }

  // 6. 私有方法
  private validateUser(user: User): boolean {
    // 实现逻辑
  }
}
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行测试并生成覆盖率报告
pnpm run test:cov

# 运行端到端测试
pnpm run test:e2e

# 监听模式运行测试
pnpm run test:watch
```

### 编写测试

- 为新功能编写单元测试
- 为 API 端点编写集成测试
- 测试覆盖率应保持在 80% 以上
- 使用描述性的测试名称

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // 测试实现
    });

    it('should throw error when email already exists', async () => {
      // 测试实现
    });
  });
});
```

## 📚 文档

### API 文档

- 使用 Swagger 装饰器为 API 添加文档
- 为所有 DTO 添加验证和文档注解
- 提供清晰的示例和描述

```typescript
@ApiOperation({ summary: '创建新用户' })
@ApiResponse({ status: 201, description: '用户创建成功', type: User })
@ApiResponse({ status: 400, description: '请求参数错误' })
@Post()
async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
  return this.userService.createUser(createUserDto);
}
```

### 代码注释

- 为复杂的业务逻辑添加注释
- 使用 JSDoc 格式为公共方法添加文档
- 解释 "为什么" 而不是 "是什么"

```typescript
/**
 * 验证用户密码强度
 * 密码必须包含至少8个字符，包括大小写字母、数字和特殊字符
 * @param password 待验证的密码
 * @returns 验证结果
 */
private validatePasswordStrength(password: string): boolean {
  // 实现复杂的密码验证逻辑
}
```

## 🔄 Pull Request 流程

### 1. 提交 PR 前的检查清单

- [ ] 代码已经过 lint 检查
- [ ] 所有测试都通过
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] 分支是基于最新的 main 分支

### 2. 创建 Pull Request

1. 推送您的分支到 GitHub
2. 在 GitHub 上创建 Pull Request
3. 填写 PR 模板中的所有必要信息
4. 添加适当的标签
5. 请求代码审查

### 3. PR 标题格式

```
<type>: <description>
```

示例：
- `feat: add user profile management`
- `fix: resolve authentication token expiration issue`
- `docs: update API documentation`

### 4. PR 描述模板

```markdown
## 📝 变更描述

简要描述此 PR 的变更内容。

## 🔗 相关 Issue

- Closes #123
- Related to #456

## 🧪 测试

- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

## 📸 截图（如适用）

添加相关截图或 GIF。

## ✅ 检查清单

- [ ] 代码已通过 lint 检查
- [ ] 所有测试都通过
- [ ] 添加了必要的测试
- [ ] 更新了文档
- [ ] 提交信息符合规范
```

## 🐛 报告 Bug

### Bug 报告模板

当您发现 Bug 时，请使用以下模板创建 Issue：

```markdown
## 🐛 Bug 描述

简要描述遇到的问题。

## 🔄 重现步骤

1. 执行 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 🎯 期望行为

描述您期望发生的行为。

## 📸 截图

如果适用，添加截图来帮助解释您的问题。

## 🖥️ 环境信息

- OS: [e.g. Windows 10]
- Node.js: [e.g. 18.17.0]
- pnpm: [e.g. 8.6.0]
- 浏览器: [e.g. Chrome 115]

## 📋 附加信息

添加任何其他相关信息。
```

## 💡 功能建议

### 功能建议模板

```markdown
## 🚀 功能描述

简要描述您建议的功能。

## 🎯 问题背景

描述这个功能要解决的问题。

## 💡 解决方案

描述您希望的解决方案。

## 🔄 替代方案

描述您考虑过的任何替代解决方案或功能。

## 📋 附加信息

添加任何其他相关信息或截图。
```

## 🏷️ 标签说明

我们使用以下标签来分类 Issues 和 PRs：

### 类型标签
- `bug` - Bug 报告
- `enhancement` - 功能增强
- `feature` - 新功能
- `documentation` - 文档相关
- `refactor` - 代码重构
- `performance` - 性能优化
- `security` - 安全相关

### 优先级标签
- `priority: high` - 高优先级
- `priority: medium` - 中优先级
- `priority: low` - 低优先级

### 状态标签
- `status: needs review` - 需要审查
- `status: in progress` - 进行中
- `status: blocked` - 被阻塞
- `status: ready` - 准备就绪

### 难度标签
- `good first issue` - 适合新手
- `help wanted` - 需要帮助
- `difficulty: easy` - 简单
- `difficulty: medium` - 中等
- `difficulty: hard` - 困难

## 📞 获取帮助

如果您在贡献过程中遇到问题，可以通过以下方式获取帮助：

1. 📖 查看 [文档](./README.md)
2. 🔍 搜索 [现有 Issues](../../issues)
3. 💬 在 Issue 中提问
4. 📧 联系维护者

## 🤝 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺，无论年龄、体型、残疾、种族、性别认同和表达、经验水平、国籍、个人形象、种族、宗教或性取向如何，参与我们项目和社区的每个人都能享受无骚扰的体验。

### 我们的标准

有助于创造积极环境的行为包括：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同情

不可接受的行为包括：

- 使用性化的语言或图像
- 恶意评论、侮辱/贬损评论，以及个人或政治攻击
- 公开或私下骚扰
- 未经明确许可发布他人的私人信息
- 在专业环境中可能被认为不当的其他行为

### 执行

项目维护者有权利和责任删除、编辑或拒绝与本行为准则不符的评论、提交、代码、wiki 编辑、问题和其他贡献，或者临时或永久禁止任何他们认为有不当、威胁、冒犯或有害行为的贡献者。

## 🎉 致谢

感谢所有为 LDesign API Server 项目做出贡献的开发者！

您的贡献让这个项目变得更好！ 🚀

---

**再次感谢您的贡献！** ❤️