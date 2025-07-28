import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../entities';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  LoginResponseDto,
  RegisterResponseDto,
  RefreshTokenResponseDto,
} from './dto';
import { JwtPayload } from './strategies';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 验证用户凭据
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [
        { username },
        { email: username },
      ],
      relations: {
        roles: {
          permissions: true,
        },
      },
    });

    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      // 记录登录失败次数
      await this.recordLoginAttempt(user, false);
      return null;
    }

    // 重置登录失败次数
    await this.recordLoginAttempt(user, true);
    return user;
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
    });

    const tokens = await this.generateTokens(user);
    const userInfo = this.formatUserInfo(user);

    return {
      ...tokens,
      user: userInfo,
    };
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { username, email, password, confirmPassword, fullName, phone } = registerDto;

    // 验证密码确认
    if (password !== confirmPassword) {
      throw new BadRequestException('密码和确认密码不匹配');
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('邮箱已存在');
    }

    // 创建新用户
    const user = this.userRepository.create({
      username,
      email,
      password, // 密码会在实体的 @BeforeInsert 中自动哈希
      fullName: fullName || username,
      phone,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      fullName: savedUser.fullName,
      createdAt: savedUser.createdAt,
    };
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: {
          roles: {
            permissions: true,
          },
        },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('新密码和确认密码不匹配');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('当前密码错误');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    });
  }

  /**
   * 忘记密码
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return;
    }

    // 生成重置令牌
    const resetToken = this.generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpires,
    });

    // TODO: 发送重置密码邮件
    // await this.mailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * 重置密码
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword, confirmNewPassword } = resetPasswordDto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('新密码和确认密码不匹配');
    }

    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('重置令牌无效或已过期');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(user.id, {
      password: hashedNewPassword,
      passwordResetToken: null as any,
      passwordResetExpires: null as any,
      passwordChangedAt: new Date(),
    });
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1h';
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * 格式化用户信息
   */
  private formatUserInfo(user: User) {
    const roles = user.roles?.map(role => role.name) || [];
    const permissions = new Set<string>();
    
    user.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      roles,
      permissions: Array.from(permissions),
    };
  }

  /**
   * 记录登录尝试
   */
  private async recordLoginAttempt(user: User, success: boolean): Promise<void> {
    if (success) {
      await this.userRepository.update(user.id, {
        loginAttempts: 0,
        lockedUntil: null as any,
      });
    } else {
      const attempts = (user.loginAttempts || 0) + 1;
      const maxAttempts = this.configService.get<number>('security.maxLoginAttempts', 5);
      const lockoutDuration = this.configService.get<number>('security.lockoutDuration', 15 * 60 * 1000);

      const updateData: any = { loginAttempts: attempts };
      
      if (attempts >= maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + lockoutDuration);
      }

      await this.userRepository.update(user.id, updateData);
    }
  }

  /**
   * 生成重置令牌
   */
  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 3600; // 默认1小时

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 3600;
    }
  }
}