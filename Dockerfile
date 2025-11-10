# 多阶段构建 - 阶段1: 依赖安装
FROM node:20-alpine AS deps
WORKDIR /app

# 安装 pnpm 和必要的构建工具
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache python3 make g++

# 复制包管理文件
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ../../package.json ./../
COPY ../../pnpm-workspace.yaml ./../
COPY tools/server/package.json ./tools/server/

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 多阶段构建 - 阶段2: 构建
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制包管理文件和源代码
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ../../package.json ./../
COPY ../../pnpm-workspace.yaml ./../
COPY tools/server ./tools/server

# 安装所有依赖（包括开发依赖）
RUN pnpm install --frozen-lockfile

# 构建应用
WORKDIR /app/tools/server
RUN pnpm build

# 多阶段构建 - 阶段3: 生产镜像
FROM node:20-alpine AS production
WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 创建非 root 用户和必要目录
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    mkdir -p logs data && \
    chown -R nestjs:nodejs logs data

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps" \
    UV_THREADPOOL_SIZE=128

# 复制构建产物和生产依赖
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/tools/server/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/tools/server/package.json ./
COPY --chown=nestjs:nodejs tools/server/ecosystem.config.js ./ecosystem.config.js 2>/dev/null || :

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]














































