/**
 * Swagger API 文档路由
 */

import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '../config/swagger'

export const swaggerRouter = Router()

// Swagger UI 配置
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { font-size: 36px }
  `,
  customSiteTitle: 'LDesign Tools API 文档',
  customfavIcon: '/favicon.ico',
}

// Swagger JSON
swaggerRouter.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Swagger UI
swaggerRouter.use('/', swaggerUi.serve)
swaggerRouter.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions))

