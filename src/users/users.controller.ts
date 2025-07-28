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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ApiResponseDecorator } from '../common/decorators/api-response.decorator';
import { User } from '../entities/user.entity';

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponseDecorator(User)
  @Permissions('user:create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '用户列表获取成功' })
  @Permissions('user:read')
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponseDecorator(User)
  @Permissions('user:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponseDecorator(User)
  @Permissions('user:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  @Permissions('user:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '切换用户状态' })
  @ApiResponseDecorator(User)
  @Permissions('user:update')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleStatus(id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: '分配用户角色' })
  @ApiResponseDecorator(User)
  @Permissions('user:assign-roles')
  assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, assignRolesDto.roleIds);
  }
}
