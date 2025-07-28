import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  ROLES_KEY,
  IS_PUBLIC_KEY,
} from '../decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 超级管理员拥有所有权限
    const isSuperAdmin = this.reflector.get<boolean>('superAdmin', context.getHandler());
    if (isSuperAdmin && this.isSuperAdmin(user)) {
      return true;
    }

    // 检查角色权限
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      const hasRole = this.checkRoles(user, requiredRoles);
      if (!hasRole) {
        throw new ForbiddenException('权限不足：缺少必要的角色');
      }
    }

    // 检查具体权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions) {
      const hasPermission = this.checkPermissions(user, requiredPermissions);
      if (!hasPermission) {
        throw new ForbiddenException('权限不足：缺少必要的权限');
      }
    }

    // 检查任意权限
    const requireAnyPermission = this.reflector.get<string[]>(
      'requireAnyPermission',
      context.getHandler(),
    );
    if (requireAnyPermission) {
      const hasAnyPermission = this.checkAnyPermissions(user, requireAnyPermission);
      if (!hasAnyPermission) {
        throw new ForbiddenException('权限不足：需要以下权限之一：' + requireAnyPermission.join(', '));
      }
    }

    // 检查所有权限
    const requireAllPermissions = this.reflector.get<string[]>(
      'requireAllPermissions',
      context.getHandler(),
    );
    if (requireAllPermissions) {
      const hasAllPermissions = this.checkAllPermissions(user, requireAllPermissions);
      if (!hasAllPermissions) {
        throw new ForbiddenException('权限不足：需要所有以下权限：' + requireAllPermissions.join(', '));
      }
    }

    // 检查任意角色
    const requireAnyRole = this.reflector.get<string[]>(
      'requireAnyRole',
      context.getHandler(),
    );
    if (requireAnyRole) {
      const hasAnyRole = this.checkAnyRoles(user, requireAnyRole);
      if (!hasAnyRole) {
        throw new ForbiddenException('权限不足：需要以下角色之一：' + requireAnyRole.join(', '));
      }
    }

    // 检查所有角色
    const requireAllRoles = this.reflector.get<string[]>(
      'requireAllRoles',
      context.getHandler(),
    );
    if (requireAllRoles) {
      const hasAllRoles = this.checkAllRoles(user, requireAllRoles);
      if (!hasAllRoles) {
        throw new ForbiddenException('权限不足：需要所有以下角色：' + requireAllRoles.join(', '));
      }
    }

    // 检查资源所有者权限
    const resourceOwner = this.reflector.get<boolean>(
      'resourceOwner',
      context.getHandler(),
    );
    if (resourceOwner) {
      const isOwner = this.checkResourceOwner(user, request);
      if (!isOwner) {
        throw new ForbiddenException('权限不足：只能操作自己的资源');
      }
    }

    return true;
  }

  private isSuperAdmin(user: any): boolean {
    return user.roles?.some((role: any) => role.name === 'super_admin') || false;
  }

  private checkRoles(user: any, requiredRoles: string[]): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    const userRoles = user.roles.map((role: any) => role.name);
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private checkPermissions(user: any, requiredPermissions: string[]): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    const userPermissions = new Set<string>();
    user.roles.forEach((role: any) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach((permission: any) => {
          userPermissions.add(permission.name);
        });
      }
    });

    return requiredPermissions.some(permission => userPermissions.has(permission));
  }

  private checkAnyPermissions(user: any, permissions: string[]): boolean {
    return this.checkPermissions(user, permissions);
  }

  private checkAllPermissions(user: any, permissions: string[]): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    const userPermissions = new Set<string>();
    user.roles.forEach((role: any) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach((permission: any) => {
          userPermissions.add(permission.name);
        });
      }
    });

    return permissions.every(permission => userPermissions.has(permission));
  }

  private checkAnyRoles(user: any, roles: string[]): boolean {
    return this.checkRoles(user, roles);
  }

  private checkAllRoles(user: any, roles: string[]): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    const userRoles = user.roles.map((role: any) => role.name);
    return roles.every(role => userRoles.includes(role));
  }

  private checkResourceOwner(user: any, request: any): boolean {
    // 检查路径参数中的用户ID
    const pathUserId = request.params?.userId || request.params?.id;
    if (pathUserId) {
      return parseInt(pathUserId) === user.id;
    }

    // 检查查询参数中的用户ID
    const queryUserId = request.query?.userId;
    if (queryUserId) {
      return parseInt(queryUserId) === user.id;
    }

    // 检查请求体中的用户ID
    const bodyUserId = request.body?.userId;
    if (bodyUserId) {
      return parseInt(bodyUserId) === user.id;
    }

    // 默认允许（需要在具体业务中实现更精确的检查）
    return true;
  }
}