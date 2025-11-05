/**
 * API Operation
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { GenerateChangelogDto, ParseCommitsDto } from './dto/changelog.dto.js'

/**
 * API Operation
 */
export interface CommitInfo {
  type: string
  scope?: string
  subject: string
  body?: string
  breaking?: boolean
  hash: string
  author: string
  date: string
}

/**
 * API Operation
 */
export interface ChangelogResult {
  success: boolean
  message: string
  content?: string
  filePath?: string
  statistics?: ChangelogStatistics
}

/**
 * API Operation
 */
export interface ChangelogStatistics {
  totalCommits: number
  features: number
  fixes: number
  breaking: number
  others: number
}

/**
 * API Operation
 */
export interface VersionInfo {
  version: string
  date: string
  commits: CommitInfo[]
  statistics: ChangelogStatistics
}

/**
 * API Operation
 */
@Injectable()
export class ChangelogService {
  private readonly logger = new Logger(ChangelogService.name)

  /**
 * API Operation
 */
  async generate(dto: GenerateChangelogDto): Promise<ChangelogResult> {
    this.logger.log(`: ${dto.path}`)

    try {
      // Operation
      // Operation
      const format = dto.format || 'markdown'
      const version = dto.version || '1.0.0'

      const statistics: ChangelogStatistics = {
        totalCommits: 25,
        features: 10,
        fixes: 12,
        breaking: 2,
        others: 1,
      }

      const content = this.generateMockChangelog(version, statistics)

      this.logger.log(`: ${version}`)

      return {
        success: true,
        message: '',
        content,
        filePath: dto.output || 'CHANGELOG.md',
        statistics,
      }
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      return {
        success: false,
        message: `: ${error.message}`,
      }
    }
  }

  /**
 * API Operation
 */
  async parseCommits(dto: ParseCommitsDto): Promise<CommitInfo[]> {
    this.logger.log(`: ${dto.path}`)

    try {
      // Operation
      // Operation
      return [
        {
          type: 'feat',
          scope: 'api',
          subject: '',
          body: ' JWT ',
          breaking: false,
          hash: 'a1b2c3d',
          author: 'John Doe',
          date: '2024-01-15',
        },
        {
          type: 'fix',
          scope: 'ui',
          subject: '',
          breaking: false,
          hash: 'e4f5g6h',
          author: 'Jane Smith',
          date: '2024-01-14',
        },
        {
          type: 'feat',
          subject: '',
          body: 'BREAKING CHANGE: ',
          breaking: true,
          hash: 'i7j8k9l',
          author: 'Bob Wilson',
          date: '2024-01-13',
        },
      ]
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      throw new BadRequestException(`: ${error.message}`)
    }
  }

  /**
 * API Operation
 */
  async getVersionChangelog(path: string, version: string): Promise<VersionInfo> {
    this.logger.log(`: ${path} - ${version}`)

    try {
      // Operation
      const commits = await this.parseCommits({ path })

      const statistics: ChangelogStatistics = {
        totalCommits: commits.length,
        features: commits.filter(c => c.type === 'feat').length,
        fixes: commits.filter(c => c.type === 'fix').length,
        breaking: commits.filter(c => c.breaking).length,
        others: commits.filter(c => !['feat', 'fix'].includes(c.type)).length,
      }

      return {
        version,
        date: new Date().toISOString().split('T')[0],
        commits,
        statistics,
      }
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      throw new BadRequestException(`: ${error.message}`)
    }
  }

  /**
 * API Operation
 */
  async getStatistics(path: string): Promise<ChangelogStatistics> {
    this.logger.log(`: ${path}`)

    try {
      const commits = await this.parseCommits({ path })

      return {
        totalCommits: commits.length,
        features: commits.filter(c => c.type === 'feat').length,
        fixes: commits.filter(c => c.type === 'fix').length,
        breaking: commits.filter(c => c.breaking).length,
        others: commits.filter(c => !['feat', 'fix'].includes(c.type)).length,
      }
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      throw new BadRequestException(`: ${error.message}`)
    }
  }

  /**
 * API Operation
 */
  async getSupportedFormats(): Promise<{
    name: string
    description: string
    extension: string
  }[]> {
    return [
      {
        name: 'markdown',
        description: 'Markdown ',
        extension: '.md',
      },
      {
        name: 'json',
        description: 'JSON ',
        extension: '.json',
      },
      {
        name: 'html',
        description: 'HTML ',
        extension: '.html',
      },
    ]
  }

  /**
 * API Operation
 */
  private generateMockChangelog(version: string, stats: ChangelogStatistics): string {
    const date = new Date().toISOString().split('T')[0]
    
    return `# Changelog

## [${version}] - ${date}

###  Features (${stats.features})
- feat(api): 
- feat(ui): 
- feat(core): 

###  Bug Fixes (${stats.fixes})
- fix(ui): 
- fix(api): 
- fix(core): 

###  Breaking Changes (${stats.breaking})
- feat!: 
- refactor!:  API

###  Statistics
- Total Commits: ${stats.totalCommits}
- Features: ${stats.features}
- Bug Fixes: ${stats.fixes}
- Breaking Changes: ${stats.breaking}
- Others: ${stats.others}
`
  }
}
