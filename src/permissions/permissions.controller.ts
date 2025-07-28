import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ApiResponseDecorator } from '../common/decorators/api-response.decorator';
import { Permission } from '../entities/permission.entity';

@ApiTags('权限管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: '创建权限' })
  @ApiResponseDecorator(Permission)
  @Permissions('permission:create')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({ status: 200, description: '权限列表获取成功' })
  @Permissions('permission:read')
  findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取权限树' })
  @ApiResponse({ status: 200, description: '权限树获取成功' })
  @Permissions('permission:read')
  getTree() {
    return this.permissionsService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取权限详情' })
  @ApiResponseDecorator(Permission)
  @Permissions('permission:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新权限信息' })
  @ApiResponseDecorator(Permission)
  @Permissions('permission:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '权限删除成功' })
  @Permissions('permission:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '切换权限状态' })
  @ApiResponseDecorator(Permission)
  @Permissions('permission:update')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.toggleStatus(id);
  }
}
