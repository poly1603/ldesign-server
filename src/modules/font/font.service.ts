import { Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync, mkdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'
import {
  ExtractFontDto,
  ExtractFontFromFilesDto,
  OptimizeFontDto,
  ConvertFontDto,
  AnalyzeFontDto,
} from './dto/font.dto.js'

const execAsync = promisify(exec)

@Injectable()
export class FontService {
  private fontsDir = join(process.cwd(), 'fonts-output')

  constructor() {
    // Ensure fonts output directory exists
    if (!existsSync(this.fontsDir)) {
      mkdirSync(this.fontsDir, { recursive: true })
    }
  }

  /**
   * Extract font subset based on specific text
   */
  async extractFont(extractDto: ExtractFontDto): Promise<any> {
    const { fontPath, text, outputDir, outputName, allFormats = true, hinting = true } = extractDto

    // Validate font file exists
    if (!existsSync(fontPath)) {
      throw new Error(`Font file not found: ${fontPath}`)
    }

    const outputDirectory = outputDir || this.fontsDir
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true })
    }

    const fontName = outputName || basename(fontPath, extname(fontPath))
    const uniqueChars = [...new Set(text)].join('')

    try {
      // Check if fontmin is installed
      await this.ensureFontminInstalled()

      // Create a temporary Node script to run fontmin
      const script = `
const Fontmin = require('fontmin');
const fontmin = new Fontmin()
  .src('${fontPath.replace(/\\/g, '\\\\')}')
  .use(Fontmin.glyph({
    text: '${uniqueChars.replace(/'/g, "\\'")}',
    hinting: ${hinting}
  }))
  .dest('${outputDirectory.replace(/\\/g, '\\\\')}');

${
  allFormats
    ? `
fontmin
  .use(Fontmin.ttf2eot())
  .use(Fontmin.ttf2woff())
  .use(Fontmin.ttf2woff2())
  .use(Fontmin.ttf2svg());
`
    : ''
}

fontmin.run((err, files) => {
  if (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  }
  console.log(JSON.stringify({ 
    success: true, 
    files: files.map(f => f.path),
    chars: ${uniqueChars.length}
  }));
  process.exit(0);
});
      `

      const { stdout } = await execAsync(`node -e "${script.replace(/"/g, '\\"')}"`)
      const result = JSON.parse(stdout.trim())

      const outputFiles = result.files || []

      return {
        success: true,
        message: 'Font extracted successfully',
        data: {
          outputDirectory,
          fontName,
          charactersExtracted: uniqueChars.length,
          originalText: text,
          files: outputFiles.map((f: string) => basename(f)),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Font extraction failed',
        error: error.toString(),
      }
    }
  }

  /**
   * Extract font by scanning files for text content
   */
  async extractFontFromFiles(extractDto: ExtractFontFromFilesDto): Promise<any> {
    const { fontPath, filePaths, outputDir, outputName, allFormats = true } = extractDto

    // Validate font file
    if (!existsSync(fontPath)) {
      throw new Error(`Font file not found: ${fontPath}`)
    }

    // Collect all text from files
    let allText = ''
    const processedFiles: string[] = []

    for (const filePath of filePaths) {
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8')
          allText += content
          processedFiles.push(filePath)
        } catch (error) {
          console.warn(`Failed to read file: ${filePath}`)
        }
      }
    }

    if (allText.length === 0) {
      return {
        success: false,
        message: 'No text content found in provided files',
      }
    }

    // Use extractFont with collected text
    return this.extractFont({
      fontPath,
      text: allText,
      outputDir,
      outputName,
      allFormats,
      hinting: true,
    })
  }

  /**
   * Optimize font file (reduce size)
   */
  async optimizeFont(optimizeDto: OptimizeFontDto): Promise<any> {
    const { fontPath, outputDir, removeHinting = false, compressSvg = true } = optimizeDto

    if (!existsSync(fontPath)) {
      throw new Error(`Font file not found: ${fontPath}`)
    }

    const outputDirectory = outputDir || this.fontsDir
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true })
    }

    try {
      await this.ensureFontminInstalled()

      const script = `
const Fontmin = require('fontmin');
const fontmin = new Fontmin()
  .src('${fontPath.replace(/\\/g, '\\\\')}')
  .dest('${outputDirectory.replace(/\\/g, '\\\\')}');

${removeHinting ? "fontmin.use(Fontmin.glyph({ hinting: false }));" : ''}
${compressSvg ? 'fontmin.use(Fontmin.svgs2ttf()).use(Fontmin.ttf2svg());' : ''}

fontmin.run((err, files) => {
  if (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  }
  console.log(JSON.stringify({ success: true, files: files.map(f => f.path) }));
  process.exit(0);
});
      `

      const { stdout } = await execAsync(`node -e "${script.replace(/"/g, '\\"')}"`)
      const result = JSON.parse(stdout.trim())

      return {
        success: true,
        message: 'Font optimized successfully',
        data: {
          outputDirectory,
          files: result.files.map((f: string) => basename(f)),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Font optimization failed',
      }
    }
  }

  /**
   * Convert font to different format
   */
  async convertFont(convertDto: ConvertFontDto): Promise<any> {
    const { fontPath, targetFormat, outputDir } = convertDto

    if (!existsSync(fontPath)) {
      throw new Error(`Font file not found: ${fontPath}`)
    }

    const outputDirectory = outputDir || this.fontsDir
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true })
    }

    const validFormats = ['ttf', 'woff', 'woff2', 'eot', 'svg']
    if (!validFormats.includes(targetFormat)) {
      return {
        success: false,
        message: `Invalid target format. Must be one of: ${validFormats.join(', ')}`,
      }
    }

    try {
      await this.ensureFontminInstalled()

      const converterMap: Record<string, string> = {
        eot: 'ttf2eot',
        woff: 'ttf2woff',
        woff2: 'ttf2woff2',
        svg: 'ttf2svg',
        ttf: 'otf2ttf', // Default converter
      }

      const converter = converterMap[targetFormat]

      const script = `
const Fontmin = require('fontmin');
const fontmin = new Fontmin()
  .src('${fontPath.replace(/\\/g, '\\\\')}')
  .use(Fontmin.${converter}())
  .dest('${outputDirectory.replace(/\\/g, '\\\\')}');

fontmin.run((err, files) => {
  if (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  }
  console.log(JSON.stringify({ success: true, files: files.map(f => f.path) }));
  process.exit(0);
});
      `

      const { stdout } = await execAsync(`node -e "${script.replace(/"/g, '\\"')}"`)
      const result = JSON.parse(stdout.trim())

      return {
        success: true,
        message: `Font converted to ${targetFormat} successfully`,
        data: {
          outputDirectory,
          targetFormat,
          files: result.files.map((f: string) => basename(f)),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Font conversion failed',
      }
    }
  }

  /**
   * Analyze font file (get metadata)
   */
  async analyzeFont(analyzeDto: AnalyzeFontDto): Promise<any> {
    const { fontPath } = analyzeDto

    if (!existsSync(fontPath)) {
      return {
        success: false,
        message: `Font file not found: ${fontPath}`,
      }
    }

    try {
      const stats = statSync(fontPath)

      return {
        success: true,
        data: {
          path: fontPath,
          name: basename(fontPath),
          extension: extname(fontPath),
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          modified: stats.mtime,
          format: this.detectFontFormat(fontPath),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Font analysis failed',
      }
    }
  }

  /**
   * Check if fontmin is installed globally
   */
  async checkFontminInstallation(): Promise<any> {
    try {
      await execAsync('npm list -g fontmin --depth=0')
      return {
        success: true,
        installed: true,
        message: 'Fontmin is installed',
      }
    } catch {
      return {
        success: true,
        installed: false,
        message: 'Fontmin is not installed',
        installCommand: 'npm install -g fontmin',
      }
    }
  }

  /**
   * Install fontmin globally
   */
  async installFontmin(): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync('npm install -g fontmin')
      return {
        success: true,
        message: 'Fontmin installed successfully',
        output: stdout || stderr,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to install fontmin',
        error: error.message,
      }
    }
  }

  // Helper methods
  private async ensureFontminInstalled(): Promise<void> {
    const check = await this.checkFontminInstallation()
    if (!check.installed) {
      throw new Error(
        'Fontmin is not installed. Please install it first using: npm install -g fontmin',
      )
    }
  }

  private detectFontFormat(filePath: string): string {
    const ext = extname(filePath).toLowerCase()
    const formatMap: Record<string, string> = {
      '.ttf': 'TrueType Font',
      '.otf': 'OpenType Font',
      '.woff': 'Web Open Font Format',
      '.woff2': 'Web Open Font Format 2',
      '.eot': 'Embedded OpenType',
      '.svg': 'SVG Font',
    }
    return formatMap[ext] || 'Unknown'
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }
}
