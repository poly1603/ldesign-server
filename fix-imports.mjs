#!/usr/bin/env node

/**
 * 修复 NestJS 构建后的导入路径
 * 为所有本地导入添加 .js 扩展名
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const distDir = join(process.cwd(), 'dist')

console.log('🔧 修复 dist 目录的导入路径...\n')

function fixImports(content, filePath) {
  let changed = false
  
  // 修复相对路径导入（添加 .js 扩展名）- 简单的匹配方式
  const importRegex = /from\s+['"](\.[\/\w\-]+)['"]/g
  content = content.replace(importRegex, (match, importPath) => {
    // 如果已经有扩展名，跳过
    if (importPath.endsWith('.js') || importPath.endsWith('.json') || 
        importPath.endsWith('.css') || importPath.endsWith('.scss')) {
      return match
    }
    changed = true
    return `from '${importPath}.js'`
  })
  
  // 修复 export 语句
  const exportRegex = /export\s+\{[^}]+\}\s+from\s+['"](\.[\/\w\-]+)['"]/g
  content = content.replace(exportRegex, (match, importPath) => {
    // 如果已经有扩展名，跳过
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match
    }
    const exportPart = match.substring(0, match.lastIndexOf("'") || match.lastIndexOf('"'))
    changed = true
    return `${exportPart.substring(0, exportPart.lastIndexOf(importPath))}${importPath}.js'`
  })

  // 修复动态导入
  const dynamicImportRegex = /import\(['"](\.[\/\w\-]+)['"]\)/g
  content = content.replace(dynamicImportRegex, (match, importPath) => {
    // 如果已经有扩展名，跳过
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match
    }
    changed = true
    return `import('${importPath}.js')`
  })
  
  return { content, changed }
}

function walkDir(dir) {
  const files = readdirSync(dir)
  let fixedCount = 0
  
  files.forEach((file) => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath)
    } else if (file.endsWith('.js')) {
      const content = readFileSync(filePath, 'utf-8')
      const { content: fixedContent, changed } = fixImports(content, filePath)
      
      if (changed) {
        writeFileSync(filePath, fixedContent, 'utf-8')
        console.log(`✅ 修复: ${relative(distDir, filePath)}`)
        fixedCount++
      }
    }
  })
  
  return fixedCount
}

try {
  const fixedCount = walkDir(distDir)
  console.log(`\n✅ 修复完成！共修复 ${fixedCount} 个文件`)
} catch (error) {
  console.error('❌ 修复过程中出错:', error)
  process.exit(1)
}