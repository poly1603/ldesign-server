import { Router } from 'express'
import { success } from '../utils/response'

export const healthRouter = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务器运行状态
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服务器运行正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     uptime:
 *                       type: number
 *                       description: 服务器运行时间（秒）
 *                       example: 12345.67
 *                     timestamp:
 *                       type: number
 *                       description: 当前时间戳
 *                       example: 1234567890123
 */
healthRouter.get('/', (req, res) => {
  return success(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  })
})
