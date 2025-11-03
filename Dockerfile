# 使用官方 Node.js 运行时作为基础镜像
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制包管理文件
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# 复制 monorepo 根目录的 package.json（如果存在）
COPY ../../package.json ./../
COPY ../../pnpm-workspace.yaml ./../

# 复制当前包的源代码
COPY tools/server/package.json ./tools/server/
COPY tools/server/tsconfig*.json ./tools/server/
COPY tools/server/nest-cli.json ./tools/server/

# 安装依赖（仅在依赖变化时执行）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY tools/server/src ./tools/server/src

# 构建应用
WORKDIR /app/tools/server
RUN pnpm build

# 生产阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制包管理文件
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# 仅安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制构建产物
COPY --from=builder /app/tools/server/dist ./dist

# 复制必要的配置文件
COPY tools/server/package.json ./

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有者
RUN chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["node", "dist/main.js"]

