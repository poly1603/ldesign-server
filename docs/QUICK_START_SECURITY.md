# 快速实施指南：认证授权 + API 限流

本指南帮助你在 **1-2 天内** 快速实现最基础的安全功能。

## 📦 第一步：安装依赖

```bash
# 认证相关
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs

# 限流相关
npm install @nestjs/throttler

# 类型定义
npm install -D @types/passport-jwt @types/bcryptjs
```

## 🔐 第二步：实现认证系统

### 1. 创建认证模块

```bash
nest g module auth
nest g service auth
nest g controller auth
```

### 2. 创建 JWT 策略（src/auth/strategies/jwt.strategy.ts）

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    return { 
      id: payload.sub, 
      email: payload.email,
      role: payload.role 
    };
  }
}
```

### 3. 创建 JWT 守卫（src/auth/guards/jwt-auth.guard.ts）

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 4. 创建认证服务（src/auth/auth.service.ts）

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });
  }
}
```

### 5. 创建认证控制器（src/auth/auth.controller.ts）

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }
}
```

### 6. 创建 DTO（src/auth/dto/auth.dto.ts）

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;
}
```

### 7. 配置认证模块（src/auth/auth.module.ts）

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { 
          expiresIn: configService.get<string>('jwt.expiresIn', '7d') 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 8. 更新用户实体（src/users/entities/user.entity.ts）

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // 序列化时排除密码
  password: string;

  @Column()
  name: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 9. 更新配置文件（src/config/configuration.ts）

```typescript
export default () => ({
  // ... 现有配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
```

### 10. 更新 .env 文件

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 11. 保护路由

在需要认证的控制器或方法上添加守卫：

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard) // 整个控制器需要认证
@ApiBearerAuth() // Swagger 文档显示需要 Bearer Token
export class ProjectsController {
  @Get()
  findAll() {
    // 只有认证用户才能访问
  }
}
```

### 12. 获取当前用户

创建自定义装饰器（src/common/decorators/current-user.decorator.ts）：

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

使用：

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: any) {
  return user;
}
```

## 🛡️ 第三步：实现 API 限流

### 1. 配置限流模块（src/app.module.ts）

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ... 其他模块
    ThrottlerModule.forRoot([{
      ttl: 60000, // 时间窗口：60秒
      limit: 100, // 最多100个请求
    }]),
  ],
  providers: [
    // 全局启用限流
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 2. 自定义特定端点的限流

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // 登录接口：每分钟最多5次
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}
```

### 3. 跳过限流（如果需要）

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle() // 健康检查端点跳过限流
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

## 📝 第四步：更新 AppModule

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ... 现有模块
    AuthModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

## 🧪 第五步：测试

### 1. 注册用户

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. 使用 Token 访问受保护的接口

```bash
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. 测试限流

快速连续发送请求，超过限制后会收到 429 错误。

## 🔒 安全建议

### 1. 生产环境配置

```env
# 使用强密钥（至少32字符）
JWT_SECRET=use-a-very-long-and-random-secret-key-here-at-least-32-chars

# 更短的过期时间
JWT_EXPIRES_IN=1h

# 启用 HTTPS
NODE_ENV=production
```

### 2. 密码策略

添加密码强度验证：

```typescript
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return typeof value === 'string' && regex.test(value);
        },
        defaultMessage() {
          return '密码必须至少8位，包含大小写字母、数字和特殊字符';
        },
      },
    });
  };
}
```

### 3. Token 刷新

实现 Refresh Token 机制（可选但推荐）。

### 4. 日志记录

记录认证相关的操作：

```typescript
@Post('login')
async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
  this.logger.log(`Login attempt from ${ip} for ${loginDto.email}`, 'AuthController');
  // ...
}
```

## 📊 验证清单

- [ ] 用户可以注册
- [ ] 用户可以登录并获得 Token
- [ ] 使用 Token 可以访问受保护的接口
- [ ] 没有 Token 无法访问受保护的接口
- [ ] 密码已加密存储
- [ ] API 限流正常工作
- [ ] Swagger 文档显示认证信息
- [ ] 日志记录认证操作

## 🎯 下一步

完成基础认证后，可以继续实现：

1. **角色权限控制**（RBAC）
2. **Token 刷新机制**
3. **密码重置功能**
4. **邮箱验证**
5. **多因素认证（2FA）**

详细信息请查看 `docs/IMPROVEMENTS.md`。
