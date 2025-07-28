import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  LoginResponseDto,
  RegisterResponseDto,
  RefreshTokenResponseDto,
} from './dto';
import {
  GenerateCaptchaDto,
  GenerateCaptchaResponseDto,
  VerifyCaptchaDto,
  VerifyCaptchaResponseDto,
} from './dto/captcha.dto';
import {
  Public,
  CurrentUser,
  CurrentUserId,
  ApiSuccessResponse,
  ApiCreatedResponse,
  ApiErrorResponses,
  ResponseDto,
} from '../common';
import { User } from '../entities';

@ApiTags('认证管理')
@Controller('auth')
@ApiErrorResponses()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiSuccessResponse(LoginResponseDto, { description: '登录成功' })
  async login(@Body() loginDto: LoginDto): Promise<ResponseDto<LoginResponseDto>> {
    // 验证验证码
    const captchaResult = this.captchaService.verifyCaptcha(loginDto.captchaSessionId, loginDto.captcha);
    if (!captchaResult.valid) {
      throw new BadRequestException(captchaResult.message);
    }
    
    const result = await this.authService.login(loginDto);
    return ResponseDto.success(result, '登录成功');
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '用户注册' })
  @ApiCreatedResponse(RegisterResponseDto, { description: '注册成功' })
  async register(@Body() registerDto: RegisterDto): Promise<ResponseDto<RegisterResponseDto>> {
    // 验证验证码
    const captchaResult = this.captchaService.verifyCaptcha(registerDto.captchaSessionId, registerDto.captcha);
    if (!captchaResult.valid) {
      throw new BadRequestException(captchaResult.message);
    }
    
    const result = await this.authService.register(registerDto);
    return ResponseDto.created(result, '注册成功');
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiSuccessResponse(RefreshTokenResponseDto, { description: '刷新成功' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ResponseDto<RefreshTokenResponseDto>> {
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    return ResponseDto.success(result, '令牌刷新成功');
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiSuccessResponse(undefined, { description: '登出成功' })
  async logout(@CurrentUser() user: User): Promise<ResponseDto> {
    // TODO: 实现令牌黑名单机制
    // await this.authService.logout(user.id);
    return ResponseDto.success(null, '登出成功');
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiSuccessResponse(undefined, { description: '密码修改成功' })
  async changePassword(
    @CurrentUserId() userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ResponseDto> {
    await this.authService.changePassword(userId, changePasswordDto);
    return ResponseDto.success(null, '密码修改成功');
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '忘记密码' })
  @ApiSuccessResponse(undefined, { description: '重置密码邮件已发送' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ResponseDto> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseDto.success(null, '如果邮箱存在，重置密码邮件已发送');
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  @ApiSuccessResponse(undefined, { description: '密码重置成功' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseDto> {
    await this.authService.resetPassword(resetPasswordDto);
    return ResponseDto.success(null, '密码重置成功');
  }

  @Post('verify-token')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '验证令牌有效性' })
  @ApiSuccessResponse(User, { description: '令牌有效' })
  async verifyToken(@CurrentUser() user: User): Promise<ResponseDto<any>> {
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      roles: user.roles?.map(role => role.name) || [],
      permissions: user.roles?.flatMap(role => 
        role.permissions?.map(permission => permission.name) || []
      ) || [],
    };
    
    return ResponseDto.success(userInfo, '令牌验证成功');
  }

  @Get('captcha/generate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生成验证码' })
  @ApiSuccessResponse(GenerateCaptchaResponseDto, { description: '验证码生成成功' })
  async generateCaptcha(): Promise<ResponseDto<GenerateCaptchaResponseDto>> {
    const result = await this.captchaService.generateCaptcha();
    return ResponseDto.success(result, '验证码生成成功');
  }

  @Post('captcha/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证验证码' })
  @ApiSuccessResponse(VerifyCaptchaResponseDto, { description: '验证码验证成功' })
  async verifyCaptcha(
    @Body() verifyCaptchaDto: VerifyCaptchaDto,
  ): Promise<ResponseDto<VerifyCaptchaResponseDto>> {
    const result = this.captchaService.verifyCaptcha(
      verifyCaptchaDto.sessionId,
      verifyCaptchaDto.captcha,
    );
    return ResponseDto.success(result, '验证码验证完成');
  }
}