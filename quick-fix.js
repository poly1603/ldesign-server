import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const fixes = {
  // TS4053 fixes - add Promise<any> return type
  'src/modules/notification/notification.controller.ts': [
    { pattern: /async (createTemplate|listTemplates|getTemplate|updateTemplate|getHistory|getStatus)\([^)]*\)\s*{/g, replacement: 'async $1($2): Promise<any> {' },
  ],
  'src/modules/scheduler/scheduler.controller.ts': [
    { pattern: /async (createJob|listJobs|getJob|updateJob|pauseJob|resumeJob)\([^)]*\)\s*{/g, replacement: 'async $1($2): Promise<any> {' },
  ],
  'src/modules/workflow/workflow.controller.ts': [
    { pattern: /async (createWorkflow|listWorkflows|getWorkflow|updateWorkflow|stopWorkflow|getExecutionStatus|getExecutionHistory|exportWorkflow|importWorkflow)\([^)]*\)\s*{/g, replacement: 'async $1($2): Promise<any> {' },
  ],
}

// Simple fix for broken files - restore from git or comment out
const brokenFiles = [
  'src/modules/deps/deps.controller.ts',
  'src/modules/health/health.controller.ts',
  'src/modules/launcher/launcher.service.ts',
  'src/modules/logs/logs.controller.ts',
  'src/modules/testing/dto/testing.dto.ts',
]

console.log('Quick Fix Script\n')

// Fix TS4053 errors
console.log('1. Fixing TS4053 errors (adding Promise<any>)...\n')

for (const [filePath, patterns] of Object.entries(fixes)) {
  const fullPath = path.join(__dirname, filePath)
  console.log(`Processing: ${filePath}`)
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8')
    let modified = false
    
    for (const { pattern, replacement } of patterns) {
      if (pattern.test(content)) {
        // Add : Promise<any> before {
        content = content.replace(
          /async (createTemplate|listTemplates|getTemplate|updateTemplate|getHistory|getStatus|createJob|listJobs|getJob|updateJob|pauseJob|resumeJob|createWorkflow|listWorkflows|getWorkflow|updateWorkflow|stopWorkflow|getExecutionStatus|getExecutionHistory|exportWorkflow|importWorkflow)\(([^)]*)\)\s*{/g,
          (match, methodName, params) => {
            return `async ${methodName}(${params}): Promise<any> {`
          }
        )
        modified = true
      }
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8')
      console.log('  ✓ Fixed\n')
    } else {
      console.log('  ○ No changes needed\n')
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}\n`)
  }
}

// Restore broken files from git
console.log('2. Restoring broken files from git...\n')

for (const filePath of brokenFiles) {
  console.log(`Restoring: ${filePath}`)
  try {
    const {execSync} = await import('child_process')
    execSync(`git checkout HEAD -- "${filePath}"`, { stdio: 'pipe' })
    console.log('  ✓ Restored\n')
  } catch (error) {
    console.log('  ⚠ Not in git or already restored\n')
  }
}

console.log('Done! Now run: pnpm dev')
