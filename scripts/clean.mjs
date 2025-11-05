#!/usr/bin/env node

/**
 * 清理构建产物脚本
 * 删除 dist 目录及其所有内容
 */

import { rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')

try {
  rmSync(distDir, { recursive: true, force: true })
  console.log('✅ 清理完成: dist 目录已删除')
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('ℹ️  dist 目录不存在，无需清理')
  } else {
    console.error('❌ 清理失败:', error.message)
    process.exit(1)
  }
}

