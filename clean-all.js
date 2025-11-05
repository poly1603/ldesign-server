import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

function cleanFile(filePath) {
  console.log(`Cleaning: ${path.basename(filePath)}`)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const original = content
    
    // 1. 移除 BOM
    content = content.replace(/^\uFEFF/, '')
    
    // 2. 移除所有控制字符（除了换行、制表等）
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // 3. 替换所有包含非ASCII字符的summary
    content = content.replace(/summary:\s*['"]([^'"]*)['"]/g, (match, text) => {
      if (/[\x80-\xFF]/.test(text) || text.includes('�')) {
        return `summary: 'API Operation'`
      }
      return match
    })
    
    // 4. 替换所有包含非ASCII字符的description
    content = content.replace(/description:\s*['"]([^'"]*)['"]/g, (match, text) => {
      if (/[\x80-\xFF]/.test(text) || text.includes('�')) {
        return `description: 'Operation completed successfully'`
      }
      return match
    })
    
    // 5. 清理注释中的非ASCII字符
    content = content.replace(/\/\*\*[\s\S]*?\*\//g, (match) => {
      if (/[\x80-\xFF]/.test(match) || match.includes('�')) {
        return '/**\n * API Operation\n */'
      }
      return match
    })
    
    content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      if (/[\x80-\xFF]/.test(match) || match.includes('�')) {
        return '/* API Operation */'
      }
      return match
    })
    
    // 6. 清理单行注释中的非ASCII字符
    content = content.replace(/\/\/.*$/gm, (match) => {
      if (/[\x80-\xFF]/.test(match) || match.includes('�')) {
        return '// API Operation'
      }
      return match
    })
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log('  ✓ Cleaned')
      return true
    } else {
      console.log('  ✓ Already clean')
      return false
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('Cleaning all controller files...\n')
  
  const srcDir = path.join(__dirname, 'src', 'modules')
  const files = getAllControllerFiles(srcDir)
  
  console.log(`Found ${files.length} controller files\n`)
  
  let cleaned = 0
  
  for (const file of files) {
    if (cleanFile(file)) {
      cleaned++
    }
  }
  
  console.log(`\nDone!`)
  console.log(`Cleaned: ${cleaned}/${files.length}`)
}

main().catch(console.error)
