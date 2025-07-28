import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaptchaService } from './captcha.service';
import {
  GenerateCaptchaResponseDto,
  VerifyCaptchaDto,
  VerifyCaptchaResponseDto,
} from './dto/captcha.dto';
import { ResponseDto } from '../common/dto';
import { Public } from '../common/decorators';
import { ApiSuccessResponse, ApiErrorResponses } from '../common/decorators';

@ApiTags('验证码管理')
@Controller('auth/captcha')
@ApiErrorResponses()
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('generate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生成验证码' })
  @ApiSuccessResponse(GenerateCaptchaResponseDto, { description: '验证码生成成功' })
  async generateCaptcha(): Promise<ResponseDto<GenerateCaptchaResponseDto>> {
    const result = this.captchaService.generateCaptcha();
    return ResponseDto.success(result, '验证码生成成功');
  }

  @Post('verify')
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