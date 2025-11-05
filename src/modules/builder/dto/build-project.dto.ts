import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export enum BuildFormat {
  ESM = 'esm',
  CJS = 'cjs',
  UMD = 'umd',
  IIFE = 'iife',
  DTS = 'dts',
}

/**
 * API Operation
 */
export enum BuildEngine {
  ROLLUP = 'rollup',
  ROLLDOWN = 'rolldown',
  ESBUILD = 'esbuild',
  SWC = 'swc',
  VITE = 'vite',
}

/**
 * API Operation
 */
export class BuildProjectDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-lib' })
  @IsString()
  path!: string

  @ApiPropertyOptional({
    description: '',
    enum: BuildFormat,
    isArray: true,
    example: [BuildFormat.ESM, BuildFormat.CJS],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BuildFormat, { each: true })
  formats?: BuildFormat[]

  @ApiPropertyOptional({
    description: '',
    enum: BuildEngine,
    example: BuildEngine.ROLLUP,
  })
  @IsOptional()
  @IsEnum(BuildEngine)
  engine?: BuildEngine

  @ApiPropertyOptional({ description: ' sourcemap', example: true })
  @IsOptional()
  @IsBoolean()
  sourcemap?: boolean

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  minify?: boolean

  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  @IsBoolean()
  watch?: boolean

  @ApiPropertyOptional({ description: '', example: 'dist' })
  @IsOptional()
  @IsString()
  outDir?: string
}

/**
 * API Operation
 */
export class AnalyzeProjectDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-lib' })
  @IsString()
  path!: string
}
