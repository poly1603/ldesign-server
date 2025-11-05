import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// 需要修复的模块
const modules = [
  'git',
  'project', 
  'system',
  'builder',
  'changelog',
  'deployer',
  'docs-generator',
  'env',
  'formatter',
  'generator',
  'mock',
  'monitor',
  'performance',
  'publisher',
  'security',
  'translator',
]

modules.forEach((moduleName) => {
  // 修复 module.ts
  const moduleFilePath = join(process.cwd(), 'src', 'modules', moduleName, `${moduleName}.module.ts`)
  
  try {
    let content = readFileSync(moduleFilePath, 'utf-8')
    let modified = false
    
    // 修复 controller 导入
    if (content.includes(`from './${moduleName}.controller'`)) {
      content = content.replace(
        new RegExp(`from '\\.\\/${moduleName}\\.controller'`, 'g'),
        `from './${moduleName}.controller.js'`
      )
      modified = true
    }
    
    // 修复 service 导入
    if (content.includes(`from './${moduleName}.service'`)) {
      content = content.replace(
        new RegExp(`from '\\.\\/${moduleName}\\.service'`, 'g'),
        `from './${moduleName}.service.js'`
      )
      modified = true
    }
    
    // 修复 entity 导入
    if (content.includes(`from './entities/`)) {
      content = content.replace(
        /from '\.\/entities\/([^']+)'/g,
        "from './entities/$1.js'"
      )
      modified = true
    }
    
    if (modified) {
      writeFileSync(moduleFilePath, content, 'utf-8')
      console.log(`✅ Fixed: ${moduleName}.module.ts`)
    }
  } catch (error) {
    console.log(`⚠️  Error processing ${moduleName}.module.ts: ${error.message}`)
  }
  
  // 修复 controller.ts
  const controllerFilePath = join(process.cwd(), 'src', 'modules', moduleName, `${moduleName}.controller.ts`)
  
  try {
    let content = readFileSync(controllerFilePath, 'utf-8')
    let modified = false
    
    // 修复 service 导入
    if (content.includes(`from './${moduleName}.service'`)) {
      content = content.replace(
        new RegExp(`from '\\.\\/${moduleName}\\.service'`, 'g'),
        `from './${moduleName}.service.js'`
      )
      modified = true
    }
    
    // 修复 dto 导入
    if (content.match(/from '\.\/(dto|entities)\/[^']+'/)) {
      content = content.replace(
        /from '\.\/((dto|entities)\/[^']+)'/g,
        (match, path) => {
          if (path.endsWith('.js')) return match
          return `from './${path}.js'`
        }
      )
      modified = true
    }
    
    if (modified) {
      writeFileSync(controllerFilePath, content, 'utf-8')
      console.log(`✅ Fixed: ${moduleName}.controller.ts`)
    }
  } catch (error) {
    // Controller file may not exist for some modules
  }
})

console.log('\n✨ All imports fixed!')
