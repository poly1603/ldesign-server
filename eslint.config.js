import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false, // NestJS 项目不使用 Vue
  stylistic: false,
  ignores: [
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '*.d.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
    'scripts/**',
    'bin/**',
    '**/*.mjs', // 忽略 .mjs 文件以避免 ESLint 版本兼容问题
    'fix-imports.mjs',
    'test.js',
    'test-*.js',
    'quick-test.ps1',
    'test-simple.ps1',
    'test-api.http',
    '*.db',
    'ldesign-server.db',
    'vitest.config.ts', // 临时忽略，避免 ESLint 版本兼容问题
  ],
  rules: {
    // 自定义规则
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'group', 'groupEnd', 'time', 'timeEnd', 'table', 'debug'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
    'unicorn/prefer-node-protocol': 'off', // 临时禁用，避免 ESLint 版本兼容问题
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.*', '**/*.spec.*'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    {
      files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
})

