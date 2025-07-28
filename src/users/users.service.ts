import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, roleIds, ...userData } = createUserDto;

    // 检查用户名和邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === email) {
        throw new ConflictException('邮箱已存在');
      }
    }

    const user = this.userRepository.create({
      username,
      email,
      ...userData,
    });

    // 分配角色
    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({
        id: In(roleIds),
      });
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  async findAll(query: QueryUserDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      roleId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // 角色筛选
    if (roleId) {
      queryBuilder.andWhere('role.id = :roleId', { roleId });
    }

    // 排序
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { username, email, roleIds, ...updateData } = updateUserDto;

    // 检查用户名和邮箱是否已被其他用户使用
    if (username && username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUser) {
        throw new ConflictException('用户名已存在');
      }
    }

    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 更新基本信息
    Object.assign(user, updateData);
    if (username) user.username = username;
    if (email) user.email = email;

    // 更新角色
    if (roleIds !== undefined) {
      if (roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({
          id: In(roleIds),
        });
        user.roles = roles;
      } else {
        user.roles = [];
      }
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    
    // 检查是否为系统管理员
    if (user.hasRole('admin')) {
      throw new BadRequestException('不能删除系统管理员');
    }

    await this.userRepository.remove(user);
  }

  async toggleStatus(id: number): Promise<User> {
    const user = await this.findOne(id);
    
    // 检查是否为系统管理员
    if (user.hasRole('admin')) {
      throw new BadRequestException('不能修改系统管理员状态');
    }

    user.status =
      user.status === UserStatus.ACTIVE
        ? UserStatus.INACTIVE
        : UserStatus.ACTIVE;

    return this.userRepository.save(user);
  }

  async assignRoles(id: number, roleIds: number[]): Promise<User> {
    const user = await this.findOne(id);
    
    // 检查是否为系统管理员
    if (user.hasRole('admin')) {
      throw new BadRequestException('不能修改系统管理员角色');
    }

    const roles = await this.roleRepository.findBy({
      id: In(roleIds),
    });

    user.roles = roles;
    return this.userRepository.save(user);
  }

  async updateLoginInfo(id: number, ip: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      loginCount: () => 'loginCount + 1',
    });
  }
}
