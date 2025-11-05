import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator'

export class ExtractFontDto {
  @ApiProperty({ description: 'Source font file path' })
  @IsString()
  fontPath: string

  @ApiProperty({ description: 'Text to extract (characters to include)' })
  @IsString()
  text: string

  @ApiProperty({ description: 'Output directory path', required: false })
  @IsOptional()
  @IsString()
  outputDir?: string

  @ApiProperty({ description: 'Output font file name', required: false })
  @IsOptional()
  @IsString()
  outputName?: string

  @ApiProperty({ description: 'Generate all formats (ttf, woff, woff2, eot, svg)', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  allFormats?: boolean

  @ApiProperty({ description: 'Use glyph hinting', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  hinting?: boolean
}

export class ExtractFontFromFilesDto {
  @ApiProperty({ description: 'Source font file path' })
  @IsString()
  fontPath: string

  @ApiProperty({ description: 'Array of file paths to scan for text', type: [String] })
  @IsArray()
  @IsString({ each: true })
  filePaths: string[]

  @ApiProperty({ description: 'Output directory path', required: false })
  @IsOptional()
  @IsString()
  outputDir?: string

  @ApiProperty({ description: 'Output font file name', required: false })
  @IsOptional()
  @IsString()
  outputName?: string

  @ApiProperty({ description: 'Generate all formats', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  allFormats?: boolean
}

export class OptimizeFontDto {
  @ApiProperty({ description: 'Source font file path' })
  @IsString()
  fontPath: string

  @ApiProperty({ description: 'Output directory path', required: false })
  @IsOptional()
  @IsString()
  outputDir?: string

  @ApiProperty({ description: 'Remove font hinting', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  removeHinting?: boolean

  @ApiProperty({ description: 'Compress SVG output', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  compressSvg?: boolean
}

export class ConvertFontDto {
  @ApiProperty({ description: 'Source font file path' })
  @IsString()
  fontPath: string

  @ApiProperty({ description: 'Target format', enum: ['ttf', 'woff', 'woff2', 'eot', 'svg'] })
  @IsString()
  targetFormat: string

  @ApiProperty({ description: 'Output directory path', required: false })
  @IsOptional()
  @IsString()
  outputDir?: string
}

export class AnalyzeFontDto {
  @ApiProperty({ description: 'Font file path to analyze' })
  @IsString()
  fontPath: string
}
