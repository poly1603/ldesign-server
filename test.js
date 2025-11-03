/**
 * 简单的 API 测试脚本
 * 用于验证服务是否正常启动和接口是否可用
 */

import http from 'node:http'

const API_BASE = 'http://localhost:3000/api'

/**
 * 发送 HTTP 请求
 */
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5秒超时
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          resolve({ status: res.statusCode, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', (error) => {
      // 提供更详细的错误信息
      if (error.code === 'ECONNREFUSED') {
        reject(new Error(`连接被拒绝，请确保服务正在运行在 ${API_BASE}`))
      } else if (error.code === 'ETIMEDOUT') {
        reject(new Error(`请求超时，服务可能没有响应`))
      } else {
        reject(error)
      }
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('请求超时'))
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

/**
 * 测试所有接口
 */
async function testAll() {
  console.log('🧪 开始测试 API 接口...')
  console.log(`📡 目标地址: ${API_BASE}\n`)

  // 先测试服务是否可用
  try {
    console.log('🔍 检查服务连接...')
    await request('GET', '/health')
    console.log('  ✅ 服务已连接\n')
  } catch (error) {
    console.log(`  ❌ 服务未连接: ${error.message}`)
    console.log('\n💡 提示：请确保服务已启动')
    console.log('   运行命令: pnpm start:dev\n')
    process.exit(1)
  }

  const tests = [
    {
      name: '健康检查',
      method: 'GET',
      path: '/health',
    },
    {
      name: 'Node 管理器状态',
      method: 'GET',
      path: '/node/manager/status',
    },
    {
      name: 'Node 可用管理器列表',
      method: 'GET',
      path: '/node/managers',
    },
    {
      name: 'Node 版本列表',
      method: 'GET',
      path: '/node/versions',
    },
    {
      name: 'Node 当前版本',
      method: 'GET',
      path: '/node/current',
    },
    {
      name: 'Git 状态',
      method: 'GET',
      path: '/git/status',
    },
    {
      name: 'Git 配置',
      method: 'GET',
      path: '/git/config',
    },
    {
      name: '项目列表',
      method: 'GET',
      path: '/projects',
    },
    {
      name: '系统目录选择器信息',
      method: 'GET',
      path: '/system/directory-picker',
    },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      console.log(`测试: ${test.name}...`)
      const result = await request(test.method, test.path)
      if (result.status >= 200 && result.status < 300) {
        console.log(`  ✅ 通过 (${result.status})`)
        passed++
      } else {
        console.log(`  ❌ 失败 (${result.status}):`, result.data)
        failed++
      }
    } catch (error) {
      console.log(`  ❌ 错误:`, error.message)
      failed++
    }
    console.log('')
  }

  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`)
  process.exit(failed > 0 ? 1 : 0)
}

// 运行测试
testAll().catch((error) => {
  console.error('测试失败:', error)
  process.exit(1)
})

