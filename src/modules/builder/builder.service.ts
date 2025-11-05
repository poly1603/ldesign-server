/**
 * API Operation
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { BuildProjectDto } from './dto/build-project.dto.js'

/**
 * API Operation
 */
export interface BuildResult {
  success: boolean
  message: string
  outputs?: {
    format: string
    file: string
    size: string
  }[]
  duration?: number
  error?: string
}

/**
 * API Operation
 */
export interface ProjectAnalysis {
  framework?: string
  hasTypescript: boolean
  hasReact: boolean
  hasVue: boolean
  hasSvelte: boolean
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  entry?: string
  recommendedEngine?: string
  recommendedFormats?: string[]
}

/**
 * API Operation
 */
@Injectable()
export class BuilderService {
  private readonly logger = new Logger(BuilderService.name)

  /**
 * API Operation
 */
  async build(dto: BuildProjectDto): Promise<BuildResult> {
    this.logger.log(`: ${dto.path}`)

    try {
      const startTime = Date.now()

      // Operation
      // Operation
      const result: BuildResult = {
        success: true,
        message: '',
        outputs: [
          {
            format: 'esm',
            file: 'dist/index.js',
            size: '42.3 KB',
          },
          {
            format: 'cjs',
            file: 'dist/index.cjs',
            size: '43.1 KB',
          },
        ],
        duration: Date.now() - startTime,
      }

      this.logger.log(` ${result.duration}ms`)
      return result
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      return {
        success: false,
        message: '',
        error: error.message,
      }
    }
  }

  /**
 * API Operation
 */
  async analyze(projectPath: string): Promise<ProjectAnalysis> {
    this.logger.log(`: ${projectPath}`)

    try {
      // Operation
      // Operation
      const fs = require('fs')
      const path = require('path')

      const packageJsonPath = path.join(projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        throw new BadRequestException('package.json ')
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      const analysis: ProjectAnalysis = {
        hasTypescript: !!packageJson.devDependencies?.typescript,
        hasReact: !!packageJson.dependencies?.react || !!packageJson.peerDependencies?.react,
        hasVue: !!packageJson.dependencies?.vue || !!packageJson.peerDependencies?.vue,
        hasSvelte: !!packageJson.dependencies?.svelte,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        entry: packageJson.main || 'src/index.ts',
        recommendedEngine: 'rollup',
        recommendedFormats: ['esm', 'cjs'],
      }

      // Operation
      if (analysis.hasReact) {
        analysis.framework = 'React'
      }
      else if (analysis.hasVue) {
        analysis.framework = 'Vue'
      }
      else if (analysis.hasSvelte) {
        analysis.framework = 'Svelte'
      }

      this.logger.log(`: ${analysis.framework || 'Unknown'}`)
      return analysis
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      throw new BadRequestException(`: ${error.message}`)
    }
  }

  /**
 * API Operation
 */
  async getSupportedEngines(): Promise<{
    name: string
    version?: string
    available: boolean
  }[]> {
    return [
      { name: 'rollup', available: true, version: '4.x' },
      { name: 'rolldown', available: true, version: '1.0.0-beta' },
      { name: 'esbuild', available: true, version: '0.20.x' },
      { name: 'swc', available: true, version: '1.4.x' },
      { name: 'vite', available: true, version: '5.x' },
    ]
  }

  /**
 * API Operation
 */
  async getSupportedFormats(): Promise<{
    name: string
    description: string
  }[]> {
    return [
      { name: 'esm', description: 'ES Module format' },
      { name: 'cjs', description: 'CommonJS format' },
      { name: 'umd', description: 'Universal Module Definition' },
      { name: 'iife', description: 'Immediately Invoked Function Expression' },
      { name: 'dts', description: 'TypeScript declaration files' },
    ]
  }
}
