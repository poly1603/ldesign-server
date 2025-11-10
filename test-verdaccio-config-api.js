/**
 * 测试 Verdaccio 配置接口
 * 运行方式: node test-verdaccio-config-api.js
 */

import http from 'http'
import { URL } from 'url'

const API_BASE = 'http://localhost:3000/api'

async function testApi(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE)
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve({ status: res.statusCode, data: result })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

async function main() {
  console.log('🧪 开始测试 Verdaccio 配置接口...\n')

  try {
    // 测试 1: 获取配置项结构定义
    console.log('1️⃣ 测试获取配置项结构定义...')
    const schemaResult = await testApi('GET', '/npm/verdaccio/config/schema')
    console.log(`   状态码: ${schemaResult.status}`)
    if (schemaResult.status === 200 && schemaResult.data.success) {
      const schema = schemaResult.data.data
      const keys = Object.keys(schema)
      console.log(`   ✅ 成功获取配置结构，包含 ${keys.length} 个顶级配置项:`)
      keys.forEach((key) => {
        console.log(`      - ${key}: ${schema[key].description || '无描述'}`)
      })
    } else {
      console.log(`   ❌ 失败: ${JSON.stringify(schemaResult.data)}`)
    }
    console.log('')

    // 测试 2: 获取配置（需要有效的 registry ID）
    console.log('2️⃣ 测试获取配置（需要有效的 registry ID）...')
    console.log('   ⚠️  跳过（需要先创建本地 Verdaccio 仓库）')
    console.log('')

    console.log('✅ 接口测试完成！')
    console.log('\n📋 配置项统计:')
    if (schemaResult.status === 200 && schemaResult.data.success) {
      const schema = schemaResult.data.data
      const countConfigs = (obj, depth = 0) => {
        let count = 0
        for (const key in obj) {
          count++
          if (obj[key].properties) {
            count += countConfigs(obj[key].properties, depth + 1)
          }
          if (obj[key].additionalProperties) {
            count++
            if (obj[key].additionalProperties.properties) {
              count += countConfigs(obj[key].additionalProperties.properties, depth + 1)
            }
          }
        }
        return count
      }
      const totalCount = countConfigs(schema)
      console.log(`   - 顶级配置项: ${Object.keys(schema).length}`)
      console.log(`   - 总配置项（包含嵌套）: ${totalCount}`)
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('   请确保后端服务正在运行 (http://localhost:3000)')
  }
}

main()

