#!/usr/bin/env node

/**
 * 开发服务器启动脚本
 * 使用 NestJS CLI 启动开发服务器（支持热重载）
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const isWindows = process.platform === 'win32'

const child = spawn('pnpm', ['nest', 'start', '--watch'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: isWindows,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error('[ldesign-server-dev] 启动失败:', error)
  process.exit(1)
})












