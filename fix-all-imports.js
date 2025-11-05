import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  files.forEach(file => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList)
    } else if (extname(file) === '.ts' && !file.endsWith('.d.ts')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

function fixImports(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  let modified = false
  
  // 匹配所有相对路径的 import
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g
  
  content = content.replace(importRegex, (match, path) => {
    // 如果已经有 .js 后缀，跳过
    if (path.endsWith('.js')) {
      return match
    }
    
    // 如果是相对路径且不是以 .js 结尾，添加 .js
    modified = true
    return match.replace(path, `${path}.js`)
  })
  
  if (modified) {
    writeFileSync(filePath, content, 'utf-8')
    return true
  }
  
  return false
}

// 修复所有 src 目录下的 TypeScript 文件
const srcDir = join(process.cwd(), 'src')
const tsFiles = getAllTsFiles(srcDir)

let fixedCount = 0
let skippedCount = 0

tsFiles.forEach(file => {
  if (fixImports(file)) {
    fixedCount++
    const relativePath = file.replace(srcDir, 'src')
    console.log(`✅ Fixed: ${relativePath}`)
  } else {
    skippedCount++
  }
})

console.log(`\n✨ Done! Fixed ${fixedCount} files, skipped ${skippedCount} files`)
