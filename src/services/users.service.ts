import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { User, UserResponse } from '../interfaces/user.interface';

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      profile: {
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
        bio: '这是张三的个人简介'
      }
    },
    {
      id: 2,
      name: '李四',
      email: 'lisi@example.com',
      createdAt: '2024-01-02T00:00:00.000Z',
      profile: {
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
        bio: '这是李四的个人简介'
      }
    },
    {
      id: 3,
      name: '王五',
      email: 'wangwu@example.com',
      createdAt: '2024-01-03T00:00:00.000Z',
      profile: {
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
        bio: '这是王五的个人简介'
      }
    }
  ];

  private nextId = 4;

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    let filteredUsers = this.users;
    
    if (search) {
      filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const total = filteredUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const users = filteredUsers.slice(startIndex, endIndex);
    
    return {
      code: 200,
      message: 'success',
      data: {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const user = this.users.find(u => u.id === id);
    
    if (!user) {
      throw new NotFoundException({
        code: 404,
        message: 'User not found',
        data: null
      });
    }
    
    return {
      code: 200,
      message: 'success',
      data: user
    };
  }

  async create(createUserDto: CreateUserDto) {
    const newUser: User = {
      id: this.nextId++,
      name: createUserDto.name,
      email: createUserDto.email,
      createdAt: new Date().toISOString(),
      profile: {
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${createUserDto.name}`,
        bio: '新用户，还没有设置个人简介'
      }
    };
    
    this.users.push(newUser);
    
    return {
      code: 201,
      message: 'User created successfully',
      data: newUser
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new NotFoundException({
        code: 404,
        message: 'User not found',
        data: null
      });
    }
    
    const updatedUser = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date().toISOString()
    };
    
    this.users[userIndex] = updatedUser;
    
    return {
      code: 200,
      message: 'User updated successfully',
      data: updatedUser
    };
  }

  async remove(id: number) {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new NotFoundException({
        code: 404,
        message: 'User not found',
        data: null
      });
    }
    
    this.users.splice(userIndex, 1);
    
    return {
      code: 200,
      message: 'User deleted successfully',
      data: null
    };
  }
}