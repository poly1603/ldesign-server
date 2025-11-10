/**
 * Package.json 配置项 Schema 定义
 * 根据 npm 官方文档定义所有 package.json 字段及其属性
 */

export interface PackageConfigOptionSchema {
  /** 配置项名称 */
  name: string
  /** 配置项中文名称 */
  nameZh?: string
  /** 配置项路径（支持嵌套，如 dependencies.react） */
  path: string
  /** 配置项类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
  /** 是否必需 */
  required?: boolean
  /** 配置项分类 */
  category: string
  /** 默认值 */
  defaultValue?: any
  /** 类型说明 */
  description: string
  /** 中文描述 */
  descriptionZh: string
  /** 枚举值（如果是 enum 类型） */
  enumValues?: string[]
  /** 数组选项（如果是 array 类型，且选项固定） */
  arrayOptions?: string[]
  /** 示例值 */
  example?: any
}

/**
 * 配置项分类定义
 */
export const PACKAGE_CONFIG_CATEGORIES = {
  BASIC: 'basic', // 基本信息
  DEPENDENCIES: 'dependencies', // 依赖管理
  SCRIPTS: 'scripts', // 脚本命令
  FILES: 'files', // 文件配置
  PUBLISH: 'publish', // 发布配置
  WORKSPACE: 'workspace', // 工作区配置
  ENGINE: 'engine', // 引擎配置
  REPOSITORY: 'repository', // 仓库配置
  AUTHOR: 'author', // 作者信息
  LICENSE: 'license', // 许可证
  CONFIG: 'config', // 配置选项
  OTHER: 'other', // 其他
} as const

/**
 * 分类显示名称
 */
export const PACKAGE_CATEGORY_LABELS: Record<string, string> = {
  [PACKAGE_CONFIG_CATEGORIES.BASIC]: '基本信息',
  [PACKAGE_CONFIG_CATEGORIES.DEPENDENCIES]: '依赖管理',
  [PACKAGE_CONFIG_CATEGORIES.SCRIPTS]: '脚本命令',
  [PACKAGE_CONFIG_CATEGORIES.FILES]: '文件配置',
  [PACKAGE_CONFIG_CATEGORIES.PUBLISH]: '发布配置',
  [PACKAGE_CONFIG_CATEGORIES.WORKSPACE]: '工作区配置',
  [PACKAGE_CONFIG_CATEGORIES.ENGINE]: '引擎配置',
  [PACKAGE_CONFIG_CATEGORIES.REPOSITORY]: '仓库配置',
  [PACKAGE_CONFIG_CATEGORIES.AUTHOR]: '作者信息',
  [PACKAGE_CONFIG_CATEGORIES.LICENSE]: '许可证',
  [PACKAGE_CONFIG_CATEGORIES.CONFIG]: '配置选项',
  [PACKAGE_CONFIG_CATEGORIES.OTHER]: '其他',
}

/**
 * Package.json 所有配置项的完整定义
 */
export const PACKAGE_CONFIG_SCHEMA: PackageConfigOptionSchema[] = [
  // ========== 基本信息 ==========
  {
    name: 'name',
    nameZh: '包名称',
    path: 'name',
    type: 'string',
    required: true,
    category: PACKAGE_CONFIG_CATEGORIES.BASIC,
    description: 'Package name. Must be lowercase, one word, no spaces, can contain hyphens and underscores',
    descriptionZh: '包名称。必须是小写，一个单词，无空格，可以包含连字符和下划线',
    example: 'my-package',
  },
  {
    name: 'version',
    nameZh: '版本号',
    path: 'version',
    type: 'string',
    required: true,
    category: PACKAGE_CONFIG_CATEGORIES.BASIC,
    description: 'Package version, must follow semantic versioning (semver)',
    descriptionZh: '包版本号，必须遵循语义化版本规范（semver）',
    example: '1.0.0',
  },
  {
    name: 'description',
    nameZh: '描述',
    path: 'description',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.BASIC,
    description: 'Package description',
    descriptionZh: '包的描述信息',
    example: 'A wonderful package',
  },
  {
    name: 'keywords',
    nameZh: '关键词',
    path: 'keywords',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.BASIC,
    description: 'Keywords for npm search',
    descriptionZh: '用于 npm 搜索的关键词',
    example: ['react', 'vue', 'typescript'],
  },
  {
    name: 'homepage',
    nameZh: '主页',
    path: 'homepage',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.BASIC,
    description: 'Package homepage URL',
    descriptionZh: '包的主页 URL',
    example: 'https://example.com',
  },
  {
    name: 'bugs',
    nameZh: '问题反馈',
    path: 'bugs',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.BASIC,
    description: 'URL to the package issue tracker and/or email address',
    descriptionZh: '问题跟踪器的 URL 和/或电子邮件地址',
    example: { url: 'https://github.com/user/repo/issues', email: 'support@example.com' },
  },
  // ========== 依赖管理 ==========
  {
    name: 'dependencies',
    nameZh: '生产依赖',
    path: 'dependencies',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.DEPENDENCIES,
    description: 'Production dependencies',
    descriptionZh: '生产环境依赖',
    example: { react: '^18.0.0', vue: '^3.0.0' },
  },
  {
    name: 'devDependencies',
    nameZh: '开发依赖',
    path: 'devDependencies',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.DEPENDENCIES,
    description: 'Development dependencies',
    descriptionZh: '开发环境依赖',
    example: { typescript: '^5.0.0', vite: '^5.0.0' },
  },
  {
    name: 'peerDependencies',
    nameZh: '对等依赖',
    path: 'peerDependencies',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.DEPENDENCIES,
    description: 'Peer dependencies',
    descriptionZh: '对等依赖（peer dependencies）',
    example: { react: '>=16.8.0' },
  },
  {
    name: 'optionalDependencies',
    nameZh: '可选依赖',
    path: 'optionalDependencies',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.DEPENDENCIES,
    description: 'Optional dependencies',
    descriptionZh: '可选依赖',
    example: { fsevents: '^2.0.0' },
  },
  {
    name: 'bundledDependencies',
    nameZh: '捆绑依赖',
    path: 'bundledDependencies',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.DEPENDENCIES,
    description: 'Bundled dependencies',
    descriptionZh: '捆绑依赖（打包时包含的依赖）',
    example: ['lodash'],
  },
  // ========== 脚本命令 ==========
  {
    name: 'scripts',
    nameZh: '脚本命令',
    path: 'scripts',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.SCRIPTS,
    description: 'Scripts that can be run with npm run',
    descriptionZh: '可以通过 npm run 运行的脚本命令',
    example: { start: 'node index.js', build: 'tsc', test: 'jest' },
  },
  // ========== 文件配置 ==========
  {
    name: 'main',
    nameZh: '主入口文件',
    path: 'main',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'Main entry point of the package',
    descriptionZh: '包的主入口文件',
    example: 'index.js',
  },
  {
    name: 'module',
    nameZh: 'ES 模块入口',
    path: 'module',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'ES module entry point',
    descriptionZh: 'ES 模块入口文件',
    example: 'esm/index.js',
  },
  {
    name: 'types',
    nameZh: '类型定义文件',
    path: 'types',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'TypeScript type definitions entry point',
    descriptionZh: 'TypeScript 类型定义入口文件',
    example: 'index.d.ts',
  },
  {
    name: 'typings',
    nameZh: '类型定义文件（别名）',
    path: 'typings',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'TypeScript type definitions entry point (alias for types)',
    descriptionZh: 'TypeScript 类型定义入口文件（types 的别名）',
    example: 'index.d.ts',
  },
  {
    name: 'exports',
    nameZh: '导出映射',
    path: 'exports',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'Package exports map',
    descriptionZh: '包的导出映射',
    example: { '.': './index.js', './utils': './utils/index.js' },
  },
  {
    name: 'files',
    nameZh: '包含文件',
    path: 'files',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'Files to include when publishing',
    descriptionZh: '发布时包含的文件列表',
    example: ['dist', 'src', 'README.md'],
  },
  {
    name: 'bin',
    nameZh: '可执行文件',
    path: 'bin',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.FILES,
    description: 'Executable files',
    descriptionZh: '可执行文件映射',
    example: { 'my-cli': './bin/cli.js' },
  },
  // ========== 发布配置 ==========
  {
    name: 'private',
    nameZh: '私有包',
    path: 'private',
    type: 'boolean',
    category: PACKAGE_CONFIG_CATEGORIES.PUBLISH,
    description: 'Prevent accidental publishing',
    descriptionZh: '防止意外发布到 npm',
    defaultValue: false,
    example: true,
  },
  {
    name: 'publishConfig',
    nameZh: '发布配置',
    path: 'publishConfig',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.PUBLISH,
    description: 'Publish configuration',
    descriptionZh: '发布时的配置选项',
    example: { registry: 'https://registry.npmjs.org/', access: 'public' },
  },
  {
    name: 'os',
    nameZh: '支持的操作系统',
    path: 'os',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.PUBLISH,
    arrayOptions: ['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'sunos', 'aix'],
    description: 'Supported operating systems',
    descriptionZh: '支持的操作系统',
    example: ['darwin', 'linux', 'win32'],
  },
  {
    name: 'cpu',
    nameZh: '支持的 CPU 架构',
    path: 'cpu',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.PUBLISH,
    arrayOptions: ['x64', 'ia32', 'arm', 'arm64', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x'],
    description: 'Supported CPU architectures',
    descriptionZh: '支持的 CPU 架构',
    example: ['x64', 'arm64'],
  },
  // ========== 工作区配置 ==========
  {
    name: 'workspaces',
    nameZh: '工作区',
    path: 'workspaces',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.WORKSPACE,
    description: 'Workspace packages',
    descriptionZh: '工作区包列表',
    example: ['packages/*'],
  },
  // ========== 引擎配置 ==========
  {
    name: 'engines',
    nameZh: '引擎要求',
    path: 'engines',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.ENGINE,
    description: 'Node.js and npm version requirements',
    descriptionZh: 'Node.js 和 npm 版本要求',
    example: { node: '>=18.0.0', npm: '>=9.0.0' },
  },
  // ========== 仓库配置 ==========
  {
    name: 'repository',
    nameZh: '代码仓库',
    path: 'repository',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.REPOSITORY,
    description: 'Repository URL and type',
    descriptionZh: '代码仓库 URL 和类型',
    example: { type: 'git', url: 'https://github.com/user/repo.git' },
  },
  // ========== 作者信息 ==========
  {
    name: 'author',
    nameZh: '作者',
    path: 'author',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.AUTHOR,
    description: 'Package author',
    descriptionZh: '包作者',
    example: 'John Doe <john@example.com>',
  },
  {
    name: 'contributors',
    nameZh: '贡献者',
    path: 'contributors',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.AUTHOR,
    description: 'Package contributors',
    descriptionZh: '包贡献者列表',
    example: ['Jane Doe <jane@example.com>'],
  },
  // ========== 许可证 ==========
  {
    name: 'license',
    nameZh: '许可证',
    path: 'license',
    type: 'string',
    category: PACKAGE_CONFIG_CATEGORIES.LICENSE,
    description: 'Package license',
    descriptionZh: '包许可证',
    enumValues: ['MIT', 'Apache-2.0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'Unlicense'],
    example: 'MIT',
  },
  {
    name: 'licenses',
    nameZh: '许可证（复数）',
    path: 'licenses',
    type: 'array',
    category: PACKAGE_CONFIG_CATEGORIES.LICENSE,
    description: 'Package licenses (deprecated, use license instead)',
    descriptionZh: '包许可证列表（已废弃，使用 license 代替）',
    example: [{ type: 'MIT', url: 'https://opensource.org/licenses/MIT' }],
  },
  // ========== 配置选项 ==========
  {
    name: 'config',
    nameZh: '配置选项',
    path: 'config',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.CONFIG,
    description: 'Config values used in scripts',
    descriptionZh: '脚本中使用的配置值',
    example: { port: 8080 },
  },
  // ========== 其他 ==========
  {
    name: 'preferGlobal',
    nameZh: '优先全局安装',
    path: 'preferGlobal',
    type: 'boolean',
    category: PACKAGE_CONFIG_CATEGORIES.OTHER,
    description: 'Prefer global installation',
    descriptionZh: '优先全局安装',
    defaultValue: false,
    example: false,
  },
  {
    name: 'directories',
    nameZh: '目录配置',
    path: 'directories',
    type: 'object',
    category: PACKAGE_CONFIG_CATEGORIES.OTHER,
    description: 'Directory structure hints',
    descriptionZh: '目录结构提示',
    example: { lib: 'lib', bin: 'bin', man: 'man', doc: 'doc', example: 'example' },
  },
]






















