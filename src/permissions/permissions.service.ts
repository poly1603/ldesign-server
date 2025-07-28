import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Permission, PermissionStatus } from '../entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { name, parentId, ...permissionData } = createPermissionDto;

    // 检查权限名是否已存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictException('权限名已存在');
    }

    // 检查父级权限是否存在
    let parent: Permission | null = null;
    if (parentId) {
      parent = await this.permissionRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('父级权限不存在');
      }
    }

    const permission = this.permissionRepository.create({
      ...permissionData,
      name,
      parent,
    });

    return await this.permissionRepository.save(permission);
  }

  async findAll(query: QueryPermissionDto) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      parentId,
      isSystem,
      sortBy = 'sort',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.parent', 'parent')
      .leftJoinAndSelect('permission.children', 'children');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(permission.name LIKE :search OR permission.displayName LIKE :search OR permission.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 类型筛选
    if (type) {
      queryBuilder.andWhere('permission.type = :type', { type });
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('permission.status = :status', { status });
    }

    // 父级权限筛选
    if (parentId !== undefined) {
      if (parentId === 0) {
        queryBuilder.andWhere('permission.parentId IS NULL');
      } else {
        queryBuilder.andWhere('permission.parentId = :parentId', { parentId });
      }
    }

    // 系统权限筛选
    if (isSystem !== undefined) {
      queryBuilder.andWhere('permission.isSystem = :isSystem', { isSystem });
    }

    // 排序
    queryBuilder.orderBy(`permission.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [permissions, total] = await queryBuilder.getManyAndCount();

    return {
      data: permissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTree(): Promise<Permission[]> {
    const permissions = await this.permissionRepository.find({
      relations: ['children'],
      where: { parent: IsNull() },
      order: { sort: 'ASC' },
    });

    return this.buildTree(permissions);
  }

  private async buildTree(permissions: Permission[]): Promise<Permission[]> {
    for (const permission of permissions) {
      if (permission.children && permission.children.length > 0) {
        permission.children = await this.buildTree(permission.children);
        permission.children.sort((a, b) => a.sort - b.sort);
      }
    }
    return permissions;
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'roles'],
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return permission;
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name },
      relations: ['parent', 'children'],
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    const { name, parentId, ...updateData } = updatePermissionDto;

    // 检查是否为系统权限
    if (permission.isSystem) {
      throw new BadRequestException('不能修改系统权限');
    }

    // 检查权限名是否已被其他权限使用
    if (name && name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name },
      });
      if (existingPermission) {
        throw new ConflictException('权限名已存在');
      }
    }

    // 检查父级权限
    if (parentId !== undefined) {
      if (parentId === permission.id) {
        throw new BadRequestException('不能将自己设为父级权限');
      }

      if (parentId) {
        const parent = await this.permissionRepository.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new NotFoundException('父级权限不存在');
        }
        permission.parent = parent;
      } else {
        permission.parent = null;
      }
    }

    // 更新基本信息
    Object.assign(permission, updateData);
    if (name) permission.name = name;

    return this.permissionRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    
    // 检查是否为系统权限
    if (permission.isSystem) {
      throw new BadRequestException('不能删除系统权限');
    }

    // 检查是否有子权限
    if (permission.children && permission.children.length > 0) {
      throw new BadRequestException('该权限下还有子权限，不能删除');
    }

    // 检查是否有角色使用该权限
    if (permission.roles && permission.roles.length > 0) {
      throw new BadRequestException('该权限被角色使用，不能删除');
    }

    await this.permissionRepository.remove(permission);
  }

  async toggleStatus(id: number): Promise<Permission> {
    const permission = await this.findOne(id);
    
    // 检查是否为系统权限
    if (permission.isSystem) {
      throw new BadRequestException('不能修改系统权限状态');
    }

    permission.status =
      permission.status === PermissionStatus.ACTIVE
        ? PermissionStatus.INACTIVE
        : PermissionStatus.ACTIVE;

    return this.permissionRepository.save(permission);
  }
}
