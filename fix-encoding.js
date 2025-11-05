import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 递归获取所有controller文件
function getAllControllerFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...getAllControllerFiles(fullPath))
    } else if (item.name.endsWith('.controller.ts')) {
      files.push(fullPath)
    }
  }
  
  return files
}

// 修复文件
function fixFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`)
  
  try {
    // 读取文件
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // 检查是否有乱码字符或非ASCII字符
    const hasBadChars = content.includes('�') || /[\x80-\xFF]/.test(content)
    
    if (hasBadChars) {
      console.log('  Found problematic characters, fixing...')
      
      // 替换所有包含乱码的ApiOperation (使用全局标志)
      content = content.replace(/summary:\s*['"]([^'"]*[�\x80-\xFF][^'"]*)['"]/, (match) => {
        modified = true
        return `summary: 'API Operation'`
      })
      
      // 全局替换所有包含乱码的字符串
      content = content.replace(/summary:\s*['"]([^'"]*[�\x80-\xFF][^'"]*)['"]/, (match) => {
        modified = true
        return `summary: 'API Operation'`
      })
      
      content = content.replace(/description:\s*['"]([^'"]*[�\x80-\xFF][^'"]*)['"]/, (match) => {
        modified = true
        return `description: 'API Description'`
      })
      
      // 替换注释中的问题字符
      content = content.replace(/\/\*\*?\s*([^\n]*[�\x80-\xFF][^\n]*)/g, (match) => {
        modified = true
        return '/** API Operation'
      })
      
      content = content.replace(/\*\s*([^\n]*[�\x80-\xFF][^\n]*)/g, (match) => {
        modified = true
        return '* API Operation'
      })
      
      // 特别处理: 移除BOM和其他特殊字符
      content = content.replace(/^\uFEFF/, '')
      content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      
      if (content !== fs.readFileSync(filePath, 'utf8')) {
        modified = true
      }
    }
    
    if (modified) {
      // 写回文件
      fs.writeFileSync(filePath, content, 'utf8')
      console.log('  ✓ Fixed')
    } else {
      console.log('  ✓ No changes needed')
    }
    
    return true
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`)
    return false
  }
}

// 主函数
async function main() {
  console.log('Starting to fix controller files...\n')
  
  const srcDir = path.join(__dirname, 'src', 'modules')
  const files = getAllControllerFiles(srcDir)
  
  console.log(`Found ${files.length} controller files\n`)
  
  let fixed = 0
  let failed = 0
  
  for (const file of files) {
    if (fixFile(file)) {
      fixed++
    } else {
      failed++
    }
  }
  
  console.log(`\nDone!`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nPlease run 'pnpm dev' to test the changes.`)
}

main().catch(console.error)
