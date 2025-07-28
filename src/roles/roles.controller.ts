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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ApiResponseDecorator } from '../common/decorators/api-response.decorator';
import { Role } from '../entities/role.entity';

@ApiTags('角色管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponseDecorator(Role)
  @Permissions('role:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '角色列表获取成功' })
  @Permissions('role:read')
  findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @ApiResponseDecorator(Role)
  @Permissions('role:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色信息' })
  @ApiResponseDecorator(Role)
  @Permissions('role:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '角色删除成功' })
  @Permissions('role:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '切换角色状态' })
  @ApiResponseDecorator(Role)
  @Permissions('role:update')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.toggleStatus(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '分配角色权限' })
  @ApiResponseDecorator(Role)
  @Permissions('role:assign-permissions')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }
}
