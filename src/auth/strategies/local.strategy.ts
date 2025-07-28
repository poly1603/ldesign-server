import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../entities';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username', // 可以是 username 或 email
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }
}