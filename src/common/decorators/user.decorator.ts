import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../entities';

/**
 * 获取当前用户装饰器
 * @param data 可选，指定返回用户的特定字段
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

/**
 * 获取当前用户ID装饰器
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

/**
 * 获取当前用户角色装饰器
 */
export const CurrentUserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.roles?.map((role: any) => role.name) || [];
  },
);

/**
 * 获取当前用户权限装饰器
 */
export const CurrentUserPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.roles) {
      return [];
    }

    const permissions = new Set<string>();
    user.roles.forEach((role: any) => {
      if (role.permissions) {
        role.permissions.forEach((permission: any) => {
          permissions.add(permission.name);
        });
      }
    });

    return Array.from(permissions);
  },
);