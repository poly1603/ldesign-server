import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 如果是公开接口，即使没有token也允许通过
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return user || null;
    }

    // 处理JWT相关错误
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token已过期，请重新登录');
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的Token');
      } else if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token尚未生效');
      } else {
        throw new UnauthorizedException('认证失败，请登录后重试');
      }
    }

    return user;
  }
}