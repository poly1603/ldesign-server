import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 权限装饰器
 * @param permissions 权限名称数组
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 角色装饰器
 * @param roles 角色名称数组
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 公开接口装饰器（不需要认证）
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 需要任意权限（满足其中一个即可）
 * @param permissions 权限名称数组
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata('requireAnyPermission', permissions);

/**
 * 需要所有权限（必须全部满足）
 * @param permissions 权限名称数组
 */
export const RequireAllPermissions = (...permissions: string[]) =>
  SetMetadata('requireAllPermissions', permissions);

/**
 * 需要任意角色（满足其中一个即可）
 * @param roles 角色名称数组
 */
export const RequireAnyRole = (...roles: string[]) =>
  SetMetadata('requireAnyRole', roles);

/**
 * 需要所有角色（必须全部满足）
 * @param roles 角色名称数组
 */
export const RequireAllRoles = (...roles: string[]) =>
  SetMetadata('requireAllRoles', roles);

/**
 * 资源所有者权限（只能操作自己的资源）
 */
export const ResourceOwner = () => SetMetadata('resourceOwner', true);

/**
 * 超级管理员权限
 */
export const SuperAdmin = () => SetMetadata('superAdmin', true);