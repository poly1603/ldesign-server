import { Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  AnalyzeDepsDto,
  CheckOutdatedDto,
  UpdateDepsDto,
  InstallDepsDto,
  AuditDepsDto,
  SearchPackageDto,
  PackageInfoDto,
} from './dto/deps.dto.js'

const execAsync = promisify(exec)

@Injectable()
export class DepsService {
  /**
   * Analyze project dependencies
   */
  async analyzeDeps(analyzeDto: AnalyzeDepsDto): Promise<any> {
    const { projectPath, includeDev = true } = analyzeDto

    const packageJsonPath = join(projectPath, 'package.json')
    if (!existsSync(packageJsonPath)) {
      return {
        success: false,
        message: 'package.json not found in project',
      }
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const deps = packageJson.dependencies || {}
      const devDeps = includeDev ? packageJson.devDependencies || {} : {}

      return {
        success: true,
        data: {
          total: Object.keys(deps).length + Object.keys(devDeps).length,
          dependencies: deps,
          devDependencies: devDeps,
          peerDependencies: packageJson.peerDependencies || {},
          optionalDependencies: packageJson.optionalDependencies || {},
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to analyze dependencies',
        error: error.message,
      }
    }
  }

  /**
   * Check for outdated dependencies
   */
  async checkOutdated(checkDto: CheckOutdatedDto): Promise<any> {
    const { projectPath, packageManager = 'npm' } = checkDto

    try {
      const command = `cd "${projectPath}" && ${packageManager} outdated --json`
      const { stdout } = await execAsync(command)

      let outdated: any = {}
      try {
        outdated = JSON.parse(stdout)
      } catch {
        // npm outdated exits with code 1 when packages are outdated
        outdated = {}
      }

      return {
        success: true,
        data: {
          outdated,
          count: Object.keys(outdated).length,
        },
      }
    } catch (error: any) {
      // Check if error contains JSON output
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout)
          return {
            success: true,
            data: {
              outdated,
              count: Object.keys(outdated).length,
            },
          }
        } catch {}
      }

      return {
        success: false,
        message: 'Failed to check outdated dependencies',
        error: error.message,
      }
    }
  }

  /**
   * Update dependencies
   */
  async updateDeps(updateDto: UpdateDepsDto): Promise<any> {
    const { projectPath, packages, latest = false } = updateDto

    try {
      let command: string
      if (packages && packages.length > 0) {
        command = `cd "${projectPath}" && npm update ${packages.join(' ')}${latest ? ' --latest' : ''}`
      } else {
        command = `cd "${projectPath}" && npm update${latest ? ' --latest' : ''}`
      }

      const { stdout, stderr } = await execAsync(command)

      return {
        success: true,
        message: 'Dependencies updated successfully',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to update dependencies',
        error: error.message,
      }
    }
  }

  /**
   * Install dependencies
   */
  async installDeps(installDto: InstallDepsDto): Promise<any> {
    const { projectPath, packageManager = 'npm', production = false } = installDto

    try {
      const prodFlag = production ? '--production' : ''
      const command = `cd "${projectPath}" && ${packageManager} install ${prodFlag}`

      const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 })

      return {
        success: true,
        message: 'Dependencies installed successfully',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to install dependencies',
        error: error.message,
      }
    }
  }

  /**
   * Audit dependencies for vulnerabilities
   */
  async auditDeps(auditDto: AuditDepsDto): Promise<any> {
    const { projectPath, fix = false } = auditDto

    try {
      const command = fix
        ? `cd "${projectPath}" && npm audit fix --json`
        : `cd "${projectPath}" && npm audit --json`

      const { stdout } = await execAsync(command)
      const auditResult = JSON.parse(stdout)

      return {
        success: true,
        data: auditResult,
      }
    } catch (error: any) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout)
          return {
            success: true,
            data: auditResult,
          }
        } catch {}
      }

      return {
        success: false,
        message: 'Failed to audit dependencies',
        error: error.message,
      }
    }
  }

  /**
   * Search npm packages
   */
  async searchPackage(searchDto: SearchPackageDto): Promise<any> {
    const { query, limit = 20 } = searchDto

    try {
      const command = `npm search ${query} --json`
      const { stdout } = await execAsync(command)
      const results = JSON.parse(stdout)

      return {
        success: true,
        data: {
          results: results.slice(0, limit),
          total: results.length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to search packages',
        error: error.message,
      }
    }
  }

  /**
   * Get package information
   */
  async getPackageInfo(packageDto: PackageInfoDto): Promise<any> {
    const { packageName, version } = packageDto

    try {
      const pkgVersion = version ? `${packageName}@${version}` : packageName
      const command = `npm view ${pkgVersion} --json`
      const { stdout } = await execAsync(command)
      const packageInfo = JSON.parse(stdout)

      return {
        success: true,
        data: packageInfo,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Package not found: ${packageName}`,
        error: error.message,
      }
    }
  }

  /**
   * Clean node_modules and reinstall
   */
  async cleanInstall(projectPath: string): Promise<any> {
    try {
      // Remove node_modules
      const removeCommand =
        process.platform === 'win32'
          ? `cd "${projectPath}" && rmdir /s /q node_modules 2>nul || echo "Already clean"`
          : `cd "${projectPath}" && rm -rf node_modules`

      await execAsync(removeCommand)

      // Reinstall
      const installCommand = `cd "${projectPath}" && npm install`
      const { stdout, stderr } = await execAsync(installCommand, { maxBuffer: 1024 * 1024 * 10 })

      return {
        success: true,
        message: 'Clean install completed successfully',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to clean install',
        error: error.message,
      }
    }
  }

  /**
   * List globally installed packages
   */
  async listGlobalPackages(): Promise<any> {
    try {
      const command = 'npm list -g --depth=0 --json'
      const { stdout } = await execAsync(command)
      const result = JSON.parse(stdout)

      return {
        success: true,
        data: {
          dependencies: result.dependencies || {},
          count: Object.keys(result.dependencies || {}).length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to list global packages',
        error: error.message,
      }
    }
  }
}
