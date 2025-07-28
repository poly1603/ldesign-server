import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { UserResponse } from '../interfaces/user.interface';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ): Promise<UserResponse> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    return this.usersService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(parseInt(id, 10));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponse> {
    return this.usersService.update(parseInt(id, 10), updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.remove(parseInt(id, 10));
  }
}