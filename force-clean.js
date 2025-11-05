import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getAllTsFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory() && !item.name.includes('node_modules')) {
      files.push(...getAllTsFiles(fullPath))
    } else if (item.name.endsWith('.ts')) {
      files.push(fullPath)
    }
  }
  
  return files
}

function isASCII(str) {
  return /^[\x00-\x7F]*$/.test(str)
}

function cleanFile(filePath) {
  const filename = path.basename(filePath)
  console.log(`Processing: ${filename}`)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const original = content
    let modified = false
    
    // 移除 BOM
    content = content.replace(/^\uFEFF/, '')
    
    // 1. 处理所有 @ApiOperation
    content = content.replace(/@ApiOperation\(\s*\{[^}]*\}\s*\)/g, (match) => {
      if (!isASCII(match)) {
        modified = true
        return `@ApiOperation({ summary: 'API Operation' })`
      }
      return match
    })
    
    // 2. 处理所有 @ApiResponse
    content = content.replace(/@ApiResponse\(\s*\{[^}]*\}\s*\)/g, (match) => {
      if (!isASCII(match)) {
        modified = true
        return `@ApiResponse({ status: 200, description: 'Success' })`
      }
      return match
    })
    
    // 3. 处理所有多行注释
    content = content.replace(/\/\*\*[\s\S]*?\*\//g, (match) => {
      if (!isASCII(match)) {
        modified = true
        return '/**\n * API Operation\n */'
      }
      return match
    })
    
    content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      if (!isASCII(match)) {
        modified = true
        return '/* Operation */'
      }
      return match
    })
    
    // 4. 处理单行注释
    content = content.replace(/\/\/.*$/gm, (match) => {
      if (!isASCII(match)) {
        modified = true
        return '// Operation'
      }
      return match
    })
    
    // 5. 清理任何剩余的非ASCII字符（在字符串中）
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!isASCII(line)) {
        // 检查是否是import或export行
        if (line.trim().startsWith('import') || line.trim().startsWith('export')) {
          continue
        }
        
        // 清理该行
        const cleanedLine = line.replace(/[^\x00-\x7F]/g, '')
        if (cleanedLine !== line) {
          lines[i] = cleanedLine
          modified = true
        }
      }
    }
    content = lines.join('\n')
    
    if (modified || content !== original) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`  ✓ Cleaned`)
      return true
    } else {
      console.log(`  ○ No changes`)
      return false
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('Force cleaning all TypeScript files...\n')
  
  const srcDir = path.join(__dirname, 'src')
  const files = getAllTsFiles(srcDir)
  
  // 只处理controller和service文件
  const targetFiles = files.filter(f => 
    f.includes('.controller.ts') || 
    f.includes('.service.ts') ||
    f.includes('.dto.ts')
  )
  
  console.log(`Found ${targetFiles.length} files to clean\n`)
  
  let cleaned = 0
  
  for (const file of targetFiles) {
    if (cleanFile(file)) {
      cleaned++
    }
  }
  
  console.log(`\nDone!`)
  console.log(`Cleaned: ${cleaned}/${targetFiles.length}`)
  console.log(`\nNow run: pnpm dev`)
}

main().catch(console.error)
