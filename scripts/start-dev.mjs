#!/usr/bin/env node

/**
 * 开发服务器启动脚本
 * 使用 NestJS CLI 启动开发服务器（支持热重载）
 */

import { spawn } from 'node:child_process'

const isWindows = process.platform === 'win32'

// 直接使用 NestJS watch 模式
// 注意：由于已在源码中使用 .js 扩展名，watch 模式应该能正常工作
const child = spawn('pnpm', ['nest', 'start', '--watch'], {
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
  console.error('[start:dev] 启动失败:', error)
  process.exit(1)
})
