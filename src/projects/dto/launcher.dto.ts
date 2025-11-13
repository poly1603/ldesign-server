import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * 启动开发服务器 DTO
 */
export class DevDto {
  @ApiProperty({ description: '环境模式', required: false, example: 'development' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiProperty({ description: '端口号', required: false, example: 3000 })
  @IsOptional()
  @IsNumber()
  port?: number;

  @ApiProperty({ description: '主机地址', required: false, example: 'localhost' })
  @IsOptional()
  @IsString()
  host?: string;
}

/**
 * 构建项目 DTO
 */
export class BuildDto {
  @ApiProperty({ description: '环境模式', required: false, example: 'production' })
  @IsOptional()
  @IsString()
  mode?: string;
}

/**
 * 预览构建结果 DTO
 */
export class PreviewDto {
  @ApiProperty({ description: '端口号', required: false, example: 4173 })
  @IsOptional()
  @IsNumber()
  port?: number;

  @ApiProperty({ description: '主机地址', required: false, example: 'localhost' })
  @IsOptional()
  @IsString()
  host?: string;
}

/**
 * 进程响应 DTO
 */
export class ProcessResponseDto {
  @ApiProperty({ description: '进程ID' })
  pid: number;

  @ApiProperty({ description: '项目ID' })
  projectId: number;

  @ApiProperty({ description: '命令' })
  command: string;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiProperty({ description: '启动时间' })
  startTime: Date;
}
