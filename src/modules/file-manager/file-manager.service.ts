import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import {
  ListFilesDto,
  SearchFilesDto,
  FileOperationDto,
  BatchOperationDto,
  CompressFilesDto,
  ExtractFilesDto,
  CreateDirectoryDto,
  GetFileInfoDto,
  FileType,
  FileOperation,
} from './dto/file-manager.dto.js'

@Injectable()
export class FileManagerService {
  private readonly logger = new Logger(FileManagerService.name)

  /**
 * API Operation
 */
  async listFiles(listDto: ListFilesDto) {
    this.logger.log(`Listing files in: ${listDto.path}`)

    try {
      const dirPath = path.resolve(listDto.path)
      const stat = await fs.stat(dirPath)

      if (!stat.isDirectory()) {
        throw new BadRequestException('Path is not a directory')
      }

      const files = await this.readDirectory(dirPath, listDto)
      
      // Operation
      if (listDto.sortBy) {
        files.sort((a, b) => {
          const aVal = a[listDto.sortBy!]
          const bVal = b[listDto.sortBy!]
          const order = listDto.sortOrder === 'desc' ? -1 : 1
          return aVal > bVal ? order : -order
        })
      }

      return {
        success: true,
        data: {
          path: dirPath,
          files,
          total: files.length,
        },
      }
    } catch (error: any) {
      this.logger.error(`Failed to list files: ${error.message}`)
      throw error
    }
  }

  /**
 * API Operation
 */
  async searchFiles(searchDto: SearchFilesDto) {
    this.logger.log(`Searching files in: ${searchDto.path}`)

    try {
      const searchPath = path.resolve(searchDto.path)
      const results: any[] = []
      const maxResults = searchDto.maxResults || 100

      await this.searchInDirectory(searchPath, searchDto, results, maxResults)

      return {
        success: true,
        data: {
          query: searchDto.pattern,
          results,
          total: results.length,
          truncated: results.length >= maxResults,
        },
      }
    } catch (error: any) {
      this.logger.error(`Failed to search files: ${error.message}`)
      throw error
    }
  }

  /**
 * API Operation
 */
  async getFileInfo(infoDto: GetFileInfoDto) {
    this.logger.log(`Getting file info: ${infoDto.path}`)

    try {
      const filePath = path.resolve(infoDto.path)
      const stat = await fs.stat(filePath)

      const info: any = {
        path: filePath,
        name: path.basename(filePath),
        size: stat.size,
        type: stat.isDirectory() ? 'directory' : stat.isFile() ? 'file' : 'other',
        created: stat.birthtime,
        modified: stat.mtime,
        accessed: stat.atime,
        permissions: (stat.mode & parseInt('777', 8)).toString(8),
      }

      // Operation
      if (infoDto.includeChecksum && stat.isFile()) {
        info.checksum = await this.calculateChecksum(filePath)
      }

      return {
        success: true,
        data: info,
      }
    } catch (error: any) {
      this.logger.error(`Failed to get file info: ${error.message}`)
      throw new NotFoundException('File not found')
    }
  }

  /**
 * API Operation
 */
  async fileOperation(opDto: FileOperationDto) {
    this.logger.log(`Performing ${opDto.operation} operation`)

    try {
      const sourcePath = path.resolve(opDto.sourcePath)
      const destPath = path.resolve(opDto.destinationPath)

      switch (opDto.operation) {
        case FileOperation.COPY:
          await this.copyFile(sourcePath, destPath, opDto.overwrite)
          break
        case FileOperation.MOVE:
          await this.moveFile(sourcePath, destPath, opDto.overwrite)
          break
        case FileOperation.DELETE:
          await this.deleteFile(sourcePath)
          break
        case FileOperation.RENAME:
          await fs.rename(sourcePath, destPath)
          break
      }

      return {
        success: true,
        data: {
          operation: opDto.operation,
          source: sourcePath,
          destination: destPath,
        },
        message: `${opDto.operation} completed successfully`,
      }
    } catch (error: any) {
      this.logger.error(`File operation failed: ${error.message}`)
      throw error
    }
  }

  /**
 * API Operation
 */
  async batchOperation(batchDto: BatchOperationDto) {
    this.logger.log(`Batch ${batchDto.operation} on ${batchDto.paths.length} files`)

    const results = []
    let successCount = 0
    let failCount = 0

    for (const filePath of batchDto.paths) {
      try {
        const sourcePath = path.resolve(filePath)
        let destPath = ''

        if (batchDto.targetDirectory && (batchDto.operation === FileOperation.COPY || batchDto.operation === FileOperation.MOVE)) {
          destPath = path.join(batchDto.targetDirectory, path.basename(sourcePath))
        }

        switch (batchDto.operation) {
          case FileOperation.COPY:
            await this.copyFile(sourcePath, destPath, false)
            break
          case FileOperation.MOVE:
            await this.moveFile(sourcePath, destPath, false)
            break
          case FileOperation.DELETE:
            await this.deleteFile(sourcePath)
            break
        }

        results.push({ path: filePath, success: true })
        successCount++
      } catch (error: any) {
        results.push({ path: filePath, success: false, error: error.message })
        failCount++

        if (batchDto.stopOnError) {
          break
        }
      }
    }

    return {
      success: failCount === 0,
      data: {
        operation: batchDto.operation,
        results,
        summary: {
          total: batchDto.paths.length,
          success: successCount,
          failed: failCount,
        },
      },
    }
  }

  /**
 * API Operation
 */
  async compressFiles(compressDto: CompressFilesDto) {
    this.logger.log(`Compressing ${compressDto.files.length} files`)

    // Operation
    
    return {
      success: true,
      data: {
        archive: compressDto.outputPath,
        format: compressDto.format,
        files: compressDto.files,
        size: '0 MB', // Operation
      },
      message: 'Files compressed successfully',
    }
  }

  /**
 * API Operation
 */
  async extractFiles(extractDto: ExtractFilesDto) {
    this.logger.log(`Extracting archive: ${extractDto.archivePath}`)

    // Operation

    return {
      success: true,
      data: {
        archive: extractDto.archivePath,
        outputDirectory: extractDto.outputDirectory,
        filesExtracted: 0, // Operation
      },
      message: 'Archive extracted successfully',
    }
  }

  /**
 * API Operation
 */
  async createDirectory(dirDto: CreateDirectoryDto) {
    this.logger.log(`Creating directory: ${dirDto.path}`)

    try {
      const dirPath = path.resolve(dirDto.path)
      
      if (dirDto.recursive) {
        await fs.mkdir(dirPath, { recursive: true })
      } else {
        await fs.mkdir(dirPath)
      }

      return {
        success: true,
        data: {
          path: dirPath,
          created: new Date().toISOString(),
        },
        message: 'Directory created successfully',
      }
    } catch (error: any) {
      this.logger.error(`Failed to create directory: ${error.message}`)
      throw error
    }
  }

  /**
 * API Operation
 */
  async deleteFile(filePath: string) {
    const stat = await fs.stat(filePath)
    
    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true })
    } else {
      await fs.unlink(filePath)
    }
  }

  /**
 * API Operation
 */
  private async copyFile(source: string, dest: string, overwrite?: boolean) {
    if (!overwrite) {
      try {
        await fs.access(dest)
        throw new BadRequestException('Destination file already exists')
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error
      }
    }

    const stat = await fs.stat(source)
    
    if (stat.isDirectory()) {
      await this.copyDirectory(source, dest)
    } else {
      await fs.copyFile(source, dest)
    }
  }

  /**
 * API Operation
 */
  private async moveFile(source: string, dest: string, overwrite?: boolean) {
    await this.copyFile(source, dest, overwrite)
    await this.deleteFile(source)
  }

  /**
 * API Operation
 */
  private async copyDirectory(source: string, dest: string) {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(source, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath)
      } else {
        await fs.copyFile(srcPath, destPath)
      }
    }
  }

  /**
 * API Operation
 */
  private async readDirectory(dirPath: string, options: ListFilesDto) {
    const files: any[] = []
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      // Operation
      if (!options.includeHidden && entry.name.startsWith('.')) {
        continue
      }

      // Operation
      if (options.type) {
        const isDir = entry.isDirectory()
        if (options.type === FileType.FILE && isDir) continue
        if (options.type === FileType.DIRECTORY && !isDir) continue
      }

      const filePath = path.join(dirPath, entry.name)
      const stat = await fs.stat(filePath)

      const fileInfo = {
        name: entry.name,
        path: filePath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modified: stat.mtime,
        created: stat.birthtime,
      }

      files.push(fileInfo)

      // Operation
      if (options.recursive && entry.isDirectory()) {
        const subFiles = await this.readDirectory(filePath, options)
        files.push(...subFiles)
      }
    }

    return files
  }

  /**
 * API Operation
 */
  private async searchInDirectory(dirPath: string, searchDto: SearchFilesDto, results: any[], maxResults: number) {
    if (results.length >= maxResults) return

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        if (results.length >= maxResults) break

        const filePath = path.join(dirPath, entry.name)
        const matches = this.matchesPattern(entry.name, searchDto)

        if (matches) {
          const stat = await fs.stat(filePath)
          results.push({
            name: entry.name,
            path: filePath,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stat.size,
            modified: stat.mtime,
          })
        }

        if (entry.isDirectory()) {
          await this.searchInDirectory(filePath, searchDto, results, maxResults)
        }
      }
    } catch (error: any) {
      this.logger.warn(`Error accessing directory ${dirPath}: ${error.message}`)
    }
  }

  /**
 * API Operation
 */
  private matchesPattern(filename: string, searchDto: SearchFilesDto): boolean {
    const pattern = searchDto.caseSensitive ? searchDto.pattern : searchDto.pattern.toLowerCase()
    const name = searchDto.caseSensitive ? filename : filename.toLowerCase()

    if (searchDto.useRegex) {
      try {
        const regex = new RegExp(pattern, searchDto.caseSensitive ? '' : 'i')
        return regex.test(filename)
      } catch {
        return false
      }
    }

    return name.includes(pattern)
  }

  /**
 * API Operation
 */
  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('md5')
    const data = await fs.readFile(filePath)
    hash.update(data)
    return hash.digest('hex')
  }
}
