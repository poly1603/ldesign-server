/**
 * TypeScript API 功能测试脚本
 * 用于验证 TypeScript 配置和版本更新功能是否正常工作
 */

const fs = require('fs')
const path = require('path')

// 测试配置
const TEST_PROJECT_ID = 'test-project-id' // 需要替换为实际的项目 ID
const API_BASE_URL = 'http://localhost:3000/api/api'

// 测试用的临时项目路径
const TEST_PROJECT_PATH = path.join(__dirname, 'test-project')
const TEST_TSCONFIG_PATH = path.join(TEST_PROJECT_PATH, 'tsconfig.json')
const TEST_PACKAGE_JSON_PATH = path.join(TEST_PROJECT_PATH, 'package.json')

// 创建测试项目目录
function setupTestProject() {
  if (!fs.existsSync(TEST_PROJECT_PATH)) {
    fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true })
  }
  
  // 创建初始 tsconfig.json
  if (!fs.existsSync(TEST_TSCONFIG_PATH)) {
    const initialConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        strict: false,
      },
      include: ['src'],
    }
    fs.writeFileSync(TEST_TSCONFIG_PATH, JSON.stringify(initialConfig, null, 2))
    console.log('✓ 创建初始 tsconfig.json')
  }
  
  // 创建初始 package.json
  if (!fs.existsSync(TEST_PACKAGE_JSON_PATH)) {
    const initialPackageJson = {
      name: 'test-project',
      version: '1.0.0',
      devDependencies: {
        typescript: '^5.7.3',
      },
    }
    fs.writeFileSync(TEST_PACKAGE_JSON_PATH, JSON.stringify(initialPackageJson, null, 2))
    console.log('✓ 创建初始 package.json')
  }
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    return null
  }
}

// 测试 API
async function testAPI() {
  console.log('\n=== TypeScript API 功能测试 ===\n')
  
  setupTestProject()
  
  // 测试 1: 获取可用版本列表
  console.log('测试 1: 获取可用版本列表')
  try {
    const versionsResponse = await fetch(`${API_BASE_URL}/typescript/versions`)
    const versionsData = await versionsResponse.json()
    console.log('✓ 版本列表:', versionsData.data?.slice(0, 5).join(', '), '...')
  } catch (error) {
    console.error('✗ 获取版本列表失败:', error.message)
  }
  
  // 测试 2: 获取配置 Schema
  console.log('\n测试 2: 获取配置 Schema')
  try {
    const schemaResponse = await fetch(`${API_BASE_URL}/typescript/schema?version=5.7.3`)
    const schemaData = await schemaResponse.json()
    const categories = Object.keys(schemaData.data || {})
    console.log('✓ Schema 分类数:', categories.length)
    console.log('  分类:', categories.slice(0, 5).join(', '), '...')
  } catch (error) {
    console.error('✗ 获取 Schema 失败:', error.message)
  }
  
  // 测试 3: 获取当前版本
  console.log('\n测试 3: 获取当前 TypeScript 版本')
  try {
    const versionResponse = await fetch(`${API_BASE_URL}/typescript/project/${TEST_PROJECT_ID}/version`)
    const versionData = await versionResponse.json()
    console.log('✓ 当前版本:', versionData.data?.version || '未找到')
  } catch (error) {
    console.error('✗ 获取当前版本失败:', error.message)
  }
  
  // 测试 4: 获取配置
  console.log('\n测试 4: 获取 TypeScript 配置')
  try {
    const configResponse = await fetch(`${API_BASE_URL}/typescript/project/${TEST_PROJECT_ID}/config`)
    const configData = await configResponse.json()
    console.log('✓ 配置获取成功')
    console.log('  配置内容:', JSON.stringify(configData.data?.config || {}, null, 2).slice(0, 200))
  } catch (error) {
    console.error('✗ 获取配置失败:', error.message)
  }
  
  // 测试 5: 更新配置
  console.log('\n测试 5: 更新 TypeScript 配置')
  try {
    const beforeConfig = JSON.parse(readFile(TEST_TSCONFIG_PATH) || '{}')
    console.log('  更新前 target:', beforeConfig.compilerOptions?.target)
    
    const updateConfig = {
      config: {
        compilerOptions: {
          target: 'ES2022',
          module: 'CommonJS',
          strict: true,
          noImplicitAny: true,
        },
      },
    }
    
    const updateResponse = await fetch(`${API_BASE_URL}/typescript/project/${TEST_PROJECT_ID}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateConfig),
    })
    const updateData = await updateResponse.json()
    
    if (updateData.success) {
      console.log('✓ 配置更新成功')
      
      // 验证文件是否已更新
      const afterConfig = JSON.parse(readFile(TEST_TSCONFIG_PATH) || '{}')
      console.log('  更新后 target:', afterConfig.compilerOptions?.target)
      console.log('  更新后 strict:', afterConfig.compilerOptions?.strict)
      
      if (afterConfig.compilerOptions?.target === 'ES2022') {
        console.log('✓ 配置已正确保存到文件')
      } else {
        console.error('✗ 配置未正确保存')
      }
    } else {
      console.error('✗ 配置更新失败:', updateData.message)
    }
  } catch (error) {
    console.error('✗ 更新配置失败:', error.message)
  }
  
  // 测试 6: 更新版本
  console.log('\n测试 6: 更新 TypeScript 版本')
  try {
    const beforePackageJson = JSON.parse(readFile(TEST_PACKAGE_JSON_PATH) || '{}')
    const beforeVersion = beforePackageJson.devDependencies?.typescript
    console.log('  更新前版本:', beforeVersion)
    
    const updateVersion = {
      version: '5.6.3',
    }
    
    const updateVersionResponse = await fetch(`${API_BASE_URL}/typescript/project/${TEST_PROJECT_ID}/version`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateVersion),
    })
    const updateVersionData = await updateVersionResponse.json()
    
    if (updateVersionData.success) {
      console.log('✓ 版本更新成功')
      
      // 验证文件是否已更新
      const afterPackageJson = JSON.parse(readFile(TEST_PACKAGE_JSON_PATH) || '{}')
      const afterVersion = afterPackageJson.devDependencies?.typescript
      console.log('  更新后版本:', afterVersion)
      
      if (afterVersion === '^5.6.3') {
        console.log('✓ 版本已正确保存到 package.json')
      } else {
        console.error('✗ 版本未正确保存')
      }
    } else {
      console.error('✗ 版本更新失败:', updateVersionData.message)
    }
  } catch (error) {
    console.error('✗ 更新版本失败:', error.message)
  }
  
  console.log('\n=== 测试完成 ===\n')
}

// 运行测试
if (require.main === module) {
  testAPI().catch(console.error)
}

module.exports = { testAPI }























