import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, RoleStatus } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, permissionIds, ...roleData } = createRoleDto;

    // 检查角色名是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('角色名已存在');
    }

    const role = this.roleRepository.create({
      name,
      ...roleData,
    });

    // 分配权限
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({
        id: In(permissionIds),
      });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async findAll(query: QueryRoleDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      isSystem,
      sortBy = 'sort',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(role.name LIKE :search OR role.displayName LIKE :search OR role.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('role.status = :status', { status });
    }

    // 系统角色筛选
    if (isSystem !== undefined) {
      queryBuilder.andWhere('role.isSystem = :isSystem', { isSystem });
    }

    // 排序
    queryBuilder.orderBy(`role.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [roles, total] = await queryBuilder.getManyAndCount();

    return {
      data: roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    const { name, permissionIds, ...updateData } = updateRoleDto;

    // 检查是否为系统角色
    if (role.isSystem) {
      throw new BadRequestException('不能修改系统角色');
    }

    // 检查角色名是否已被其他角色使用
    if (name && name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name },
      });
      if (existingRole) {
        throw new ConflictException('角色名已存在');
      }
    }

    // 更新基本信息
    Object.assign(role, updateData);
    if (name) role.name = name;

    // 更新权限
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findBy({
          id: In(permissionIds),
        });
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    
    // 检查是否为系统角色
    if (role.isSystem) {
      throw new BadRequestException('不能删除系统角色');
    }

    // 检查是否有用户使用该角色
    if (role.users && role.users.length > 0) {
      throw new BadRequestException('该角色下还有用户，不能删除');
    }

    await this.roleRepository.remove(role);
  }

  async toggleStatus(id: number): Promise<Role> {
    const role = await this.findOne(id);
    
    // 检查是否为系统角色
    if (role.isSystem) {
      throw new BadRequestException('不能修改系统角色状态');
    }

    role.status =
      role.status === RoleStatus.ACTIVE
        ? RoleStatus.INACTIVE
        : RoleStatus.ACTIVE;

    return this.roleRepository.save(role);
  }

  async assignPermissions(id: number, permissionIds: number[]): Promise<Role> {
    const role = await this.findOne(id);
    
    // 检查是否为系统角色
    if (role.isSystem) {
      throw new BadRequestException('不能修改系统角色权限');
    }

    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds),
    });

    role.permissions = permissions;
    return this.roleRepository.save(role);
  }
}
