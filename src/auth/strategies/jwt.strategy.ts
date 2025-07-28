import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities';

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    // 查找用户并加载角色和权限信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        roles: {
          permissions: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('用户账号已被禁用');
    }

    // 更新最后活跃时间
    await this.userRepository.update(user.id, {
      lastActiveAt: new Date(),
    });

    return user;
  }
}