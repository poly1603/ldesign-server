import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import {
  BusinessException,
  ErrorCode,
} from '../common/exceptions/business.exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private users: User[] = [];
  private currentId = 1;

  /**
   * 创建用户
   */
  create(createUserDto: CreateUserDto): User {
    // 检查用户名是否已存在
    const existingUser = this.users.find(
      (u) => u.username === createUserDto.username,
    );
    if (existingUser) {
      throw new BusinessException(
        '用户名已存在',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = this.users.find(
      (u) => u.email === createUserDto.email,
    );
    if (existingEmail) {
      throw new BusinessException(
        '邮箱已被使用',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    const user = new User({
      id: this.currentId++,
      ...createUserDto,
    });

    this.users.push(user);
    this.logger.log(`创建用户成功: ${user.username}`);

    return user;
  }

  /**
   * 查询所有用户
   */
  findAll(): User[] {
    return this.users;
  }

  /**
   * 根据ID查询用户
   */
  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new BusinessException('用户不存在', ErrorCode.RESOURCE_NOT_FOUND);
    }
    return user;
  }

  /**
   * 更新用户
   */
  update(id: number, updateUserDto: UpdateUserDto): User {
    const user = this.findOne(id);

    // 如果更新用户名，检查是否重复
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = this.users.find(
        (u) => u.username === updateUserDto.username,
      );
      if (existingUser) {
        throw new BusinessException(
          '用户名已存在',
          ErrorCode.RESOURCE_ALREADY_EXISTS,
        );
      }
    }

    // 如果更新邮箱，检查是否重复
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = this.users.find(
        (u) => u.email === updateUserDto.email,
      );
      if (existingEmail) {
        throw new BusinessException(
          '邮箱已被使用',
          ErrorCode.RESOURCE_ALREADY_EXISTS,
        );
      }
    }

    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    this.logger.log(`更新用户成功: ${user.username}`);

    return user;
  }

  /**
   * 删除用户
   */
  remove(id: number): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new BusinessException('用户不存在', ErrorCode.RESOURCE_NOT_FOUND);
    }

    const user = this.users[index];
    this.users.splice(index, 1);

    this.logger.log(`删除用户成功: ${user.username}`);
  }
}
