import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
  format: ['esm'],
  outDir: 'dist',
  dts: false, // 暂时禁用类型定义文件生成（有类型错误）
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  platform: 'node',
  keepNames: true,
  external: [
    'swagger-ui-express',
    'swagger-jsdoc',
    'js-yaml',
  ],
  onSuccess: async () => {
    console.log('✅ @ldesign/server 构建完成')
  },
})
