import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiSuccessResponse,
  ApiCreatedResponse,
} from '../common/decorators/api-response.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建用户' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse('用户创建成功')
  @ApiBadRequestResponse({ description: '请求参数错误' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有用户' })
  @ApiSuccessResponse('获取用户列表成功')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', type: Number })
  @ApiSuccessResponse('获取用户信息成功')
  @ApiNotFoundResponse({ description: '用户不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiSuccessResponse('用户更新成功')
  @ApiBadRequestResponse({ description: '请求参数错误' })
  @ApiNotFoundResponse({ description: '用户不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID', type: Number })
  @ApiSuccessResponse('用户删除成功')
  @ApiNotFoundResponse({ description: '用户不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.usersService.remove(id);
  }
}
