import { Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { RunTestsDto, RunE2ETestsDto, GetCoverageDto, LintDto } from './dto/testing.dto.js'

const execAsync = promisify(exec)

@Injectable()
export class TestingService {
  /**
   * Run unit/integration tests
   */
  async runTests(runDto: RunTestsDto): Promise<any> {
    const { projectPath, testPattern, watch = false, coverage = false, framework } = runDto

    try {
      // Detect test framework from package.json if not specified
      const detectedFramework = framework || (await this.detectTestFramework(projectPath))

      if (!detectedFramework) {
        return {
          success: false,
          message: 'No test framework detected in project',
        }
      }

      let command = `cd "${projectPath}" && `

      switch (detectedFramework) {
        case 'jest':
          command += `npx jest${testPattern ? ` ${testPattern}` : ''}${watch ? ' --watch' : ''}${coverage ? ' --coverage' : ''}`
          break
        case 'vitest':
          command += `npx vitest${watch ? '' : ' run'}${coverage ? ' --coverage' : ''}${testPattern ? ` ${testPattern}` : ''}`
          break
        case 'mocha':
          command += `npx mocha${testPattern ? ` ${testPattern}` : ' test/**/*.test.js'}`
          break
        default:
          command += `npm test`
      }

      const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 })

      return {
        success: true,
        message: 'Tests executed successfully',
        framework: detectedFramework,
        output: stdout || stderr,
      }
    } catch (error: any) {
      // Tests might fail but command executes
      return {
        success: false,
        message: 'Tests completed with failures',
        output: error.stdout || error.stderr || error.message,
      }
    }
  }

  /**
   * Run E2E tests
   */
  async runE2ETests(runDto: RunE2ETestsDto): Promise<any> {
    const { projectPath, testFile, headless = true } = runDto

    try {
      // Check for common E2E test frameworks
      const packageJsonPath = join(projectPath, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        let command = `cd "${projectPath}" && `

        if (deps['@playwright/test']) {
          command += `npx playwright test${testFile ? ` ${testFile}` : ''}${headless ? '' : ' --headed'}`
        } else if (deps['cypress']) {
          command += `npx cypress run${testFile ? ` --spec ${testFile}` : ''}${headless ? '' : ' --headed'}`
        } else if (deps['puppeteer']) {
          command += `npm run test:e2e`
        } else {
          return {
            success: false,
            message: 'No E2E test framework detected',
          }
        }

        const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 })

        return {
          success: true,
          message: 'E2E tests executed successfully',
          output: stdout || stderr,
        }
      }

      return {
        success: false,
        message: 'package.json not found',
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'E2E tests failed',
        output: error.stdout || error.stderr || error.message,
      }
    }
  }

  /**
   * Get test coverage report
   */
  async getCoverage(coverageDto: GetCoverageDto): Promise<any> {
    const { projectPath, format = 'json' } = coverageDto

    try {
      const coveragePath = join(projectPath, 'coverage')
      
      if (!existsSync(coveragePath)) {
        return {
          success: false,
          message: 'Coverage report not found. Run tests with --coverage first.',
        }
      }

      let reportFile: string
      switch (format) {
        case 'json':
          reportFile = join(coveragePath, 'coverage-summary.json')
          break
        case 'html':
          reportFile = join(coveragePath, 'index.html')
          break
        default:
          reportFile = join(coveragePath, 'lcov-report', 'index.html')
      }

      if (existsSync(reportFile)) {
        const content = readFileSync(reportFile, 'utf-8')
        
        return {
          success: true,
          data: format === 'json' ? JSON.parse(content) : content,
          path: reportFile,
        }
      }

      return {
        success: false,
        message: `Coverage report in ${format} format not found`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get coverage report',
        error: error.message,
      }
    }
  }

  /**
   * Run linter
   */
  async runLint(lintDto: LintDto): Promise<any> {
    const { projectPath, fix = false, files = [] } = lintDto

    try {
      const filesPattern = files.length > 0 ? files.join(' ') : '.'
      const command = `cd "${projectPath}" && npx eslint ${filesPattern}${fix ? ' --fix' : ''}`

      const { stdout, stderr } = await execAsync(command)

      return {
        success: true,
        message: fix ? 'Linting completed with fixes' : 'Linting completed',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Linting found issues',
        output: error.stdout || error.stderr || error.message,
      }
    }
  }

  /**
   * Run type checking
   */
  async runTypeCheck(projectPath: string): Promise<any> {
    try {
      const command = `cd "${projectPath}" && npx tsc --noEmit`
      const { stdout, stderr } = await execAsync(command)

      return {
        success: true,
        message: 'Type checking passed',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Type checking failed',
        output: error.stdout || error.stderr || error.message,
      }
    }
  }

  /**
   * List available test scripts
   */
  async listTestScripts(projectPath: string): Promise<any> {
    try {
      const packageJsonPath = join(projectPath, 'package.json')
      
      if (!existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'package.json not found',
        }
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const scripts = packageJson.scripts || {}
      
      // Filter test-related scripts
      const testScripts = Object.keys(scripts)
        .filter(key => key.includes('test') || key.includes('lint') || key.includes('check'))
        .reduce((obj: any, key) => {
          obj[key] = scripts[key]
          return obj
        }, {})

      return {
        success: true,
        data: testScripts,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to list test scripts',
        error: error.message,
      }
    }
  }

  // Helper: Detect test framework
  private async detectTestFramework(projectPath: string): Promise<string | null> {
    try {
      const packageJsonPath = join(projectPath, 'package.json')
      
      if (!existsSync(packageJsonPath)) {
        return null
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

      if (deps['jest'] || deps['@types/jest']) return 'jest'
      if (deps['vitest']) return 'vitest'
      if (deps['mocha']) return 'mocha'

      return null
    } catch {
      return null
    }
  }
}
