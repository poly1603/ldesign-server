# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产环境镜像
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json
COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制构建产物
COPY --from=base /app/dist ./dist

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 更改文件所有权
CHOWN nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# 启动应用
CMD ["node", "dist/main"]