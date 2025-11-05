import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

/**
 * 请求日志中间件
 * 记录所有 HTTP 请求的详细信息
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  /**
   * 处理请求
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @param next - 下一个中间件
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req
    const startTime = Date.now()

    // 监听响应结束事件
    res.on('finish', () => {
      const { statusCode } = res
      const responseTime = Date.now() - startTime
      const contentLength = res.get('content-length') || 0

      // 构建日志消息
      const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${contentLength} - ${ip}`

      // 根据状态码选择日志级别
      if (statusCode >= 500) {
        this.logger.error(message)
      }
      else if (statusCode >= 400) {
        this.logger.warn(message)
      }
      else {
        this.logger.log(message)
      }
    })

    next()
  }
}




















