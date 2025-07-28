import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const svgCaptcha = require('svg-captcha');
import { GenerateCaptchaResponseDto, VerifyCaptchaResponseDto } from './dto/captcha.dto';

interface CaptchaSession {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class CaptchaService {
  private captchaSessions = new Map<string, CaptchaSession>();
  private readonly captchaExpireTime: number;

  constructor(private configService: ConfigService) {
    // 验证码过期时间，默认5分钟
    this.captchaExpireTime = this.configService.get<number>('CAPTCHA_EXPIRE_TIME', 300);
    
    // 定期清理过期的验证码会话
    setInterval(() => {
      this.cleanExpiredSessions();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 生成验证码
   */
  generateCaptcha(sessionId?: string): GenerateCaptchaResponseDto {
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1iIl', // 忽略容易混淆的字符
      noise: 2, // 干扰线数量
      color: true, // 彩色验证码
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
    });

    // 生成会话ID
    const newSessionId = sessionId || this.generateSessionId();
    
    // 存储验证码信息
    const expiresAt = new Date(Date.now() + this.captchaExpireTime * 1000);
    this.captchaSessions.set(newSessionId, {
      code: captcha.text.toLowerCase(),
      expiresAt,
    });

    // 将SVG转换为Base64
    const captchaImage = `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;

    return {
      sessionId: newSessionId,
      captchaImage,
      expiresIn: this.captchaExpireTime,
    };
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(sessionId: string, inputCode: string): VerifyCaptchaResponseDto {
    const session = this.captchaSessions.get(sessionId);
    
    if (!session) {
      return {
        valid: false,
        message: '验证码会话不存在或已过期',
      };
    }

    // 检查是否过期
    if (new Date() > session.expiresAt) {
      this.captchaSessions.delete(sessionId);
      return {
        valid: false,
        message: '验证码已过期',
      };
    }

    // 验证验证码（不区分大小写）
    const isValid = session.code === inputCode.toLowerCase();
    
    if (isValid) {
      // 验证成功后删除会话
      this.captchaSessions.delete(sessionId);
      return {
        valid: true,
        message: '验证码验证成功',
      };
    } else {
      return {
        valid: false,
        message: '验证码错误',
      };
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理过期的验证码会话
   */
  private cleanExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.captchaSessions.entries()) {
      if (now > session.expiresAt) {
        this.captchaSessions.delete(sessionId);
      }
    }
  }

  /**
   * 获取当前活跃会话数量（用于监控）
   */
  getActiveSessionsCount(): number {
    return this.captchaSessions.size;
  }
}