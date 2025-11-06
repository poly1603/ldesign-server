import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * Vitest E2E 测试配置
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.e2e.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})












