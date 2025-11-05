# NestJS 性能优化指南

本文档记录了对 NestJS 后台接口项目的性能优化措施和最佳实践。

## 📊 优化概览

### 已实施的优化措施

#### 1. 🗄️ 数据库优化
- **SQLite 性能调优**
  - 启用 WAL（Write-Ahead Logging）模式提高并发性能
  - 增加缓存大小至 10000 页
  - 启用内存映射 I/O（256MB）
  - 优化同步模式为 NORMAL，平衡性能与安全性
  - 临时数据存储在内存中
  - 配置查询超时（5秒）和查询缓存（30秒）

#### 2. 💾 缓存机制
- **多级缓存策略**
  - 实现了内存缓存（开发环境）
  - 支持 Redis 缓存（生产环境，可选）
  - 提供统一的缓存服务接口
  - 支持批量操作和缓存装饰器模式
  - 可配置的 TTL 和缓存大小限制

#### 3. 🚦 中间件和拦截器优化
- **日志优化**
  - 生产环境只记录基本信息
  - 开发环境记录详细调试信息
  - 敏感信息自动过滤
- **响应压缩**
  - 使用 compression 中间件
  - 只压缩大于 1KB 的响应
  - 排除 WebSocket 连接
- **请求限流**
  - 使用 @nestjs/throttler 实现
  - 生产环境：60秒内最多100个请求
  - 开发环境：60秒内最多1000个请求
  - 健康检查端点不限流

#### 4. 🐳 Docker 优化
- **多阶段构建**
  - 分离依赖安装、构建和运行阶段
  - 最小化最终镜像大小
- **安全增强**
  - 使用非 root 用户运行
  - 使用 dumb-init 处理信号
- **性能配置**
  - 增加 Node.js 内存限制（2GB）
  - 增加 libuv 线程池大小（128）
  - 内置健康检查

#### 5. ⚙️ 生产环境配置
- **PM2 进程管理**
  - 集群模式支持（使用所有 CPU 核心）
  - 自动重启和内存限制
  - 优雅关闭处理
  - 日志管理和监控
- **环境变量优化**
  - 分离开发和生产配置
  - 支持环境特定的优化参数

## 🚀 使用指南

### 开发环境

```bash
# 安装依赖
pnpm install

# 运行开发服务器
pnpm dev

# 构建项目
pnpm build
```

### 生产环境

#### 使用 PM2

```bash
# 使用 PM2 启动（开发环境）
pnpm start:pm2

# 使用 PM2 启动（生产环境）
pnpm start:pm2:prod

# 停止服务
pnpm stop:pm2

# 重载服务（零停机）
pnpm reload:pm2

# 监控服务
pnpm monitor:pm2
```

#### 使用 Docker

```bash
# 构建镜像
docker build -t ldesign-server .

# 运行容器
docker run -d \
  --name ldesign-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v /path/to/data:/app/data \
  -v /path/to/logs:/app/logs \
  ldesign-server

# 使用 docker-compose
docker-compose up -d
```

## 📈 性能指标

### 预期改进

- **响应时间**: 减少 30-50%
- **吞吐量**: 提升 2-3 倍
- **内存使用**: 优化 20-30%
- **并发处理**: 支持更高并发连接

### 监控建议

1. **应用性能监控（APM）**
   - 使用 New Relic、DataDog 或 AppDynamics
   - 监控响应时间、错误率、吞吐量

2. **日志聚合**
   - 使用 ELK Stack 或 Grafana Loki
   - 集中管理和分析日志

3. **指标收集**
   - 使用 Prometheus + Grafana
   - 监控系统和应用级指标

## 🔧 进一步优化建议

### 短期优化

1. **添加 Redis 缓存**
   ```bash
   pnpm add cache-manager-redis-yet redis
   ```
   配置 Redis 连接并启用分布式缓存

2. **启用 HTTP/2**
   在 Nginx 或负载均衡器上配置 HTTP/2

3. **静态资源 CDN**
   将静态文件托管到 CDN 服务

### 长期优化

1. **数据库迁移**
   - 考虑迁移到 PostgreSQL 或 MySQL
   - 使用读写分离和连接池

2. **微服务架构**
   - 拆分大型模块为独立服务
   - 使用消息队列解耦服务

3. **GraphQL 支持**
   - 减少过度获取和欠获取问题
   - 提供更灵活的 API

## 📝 环境变量配置

复制 `.env.production.example` 为 `.env.production` 并根据实际情况配置：

```bash
# 基础配置
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_PATH=/var/lib/ldesign/server.db

# 缓存（可选）
REDIS_URL=redis://localhost:6379

# 性能优化
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=128

# 限流
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## 🎯 性能测试

### 压力测试工具

1. **Apache Bench (ab)**
   ```bash
   ab -n 10000 -c 100 http://localhost:3000/api/health
   ```

2. **wrk**
   ```bash
   wrk -t12 -c400 -d30s http://localhost:3000/api/health
   ```

3. **Artillery**
   ```bash
   npm install -g artillery
   artillery quick --count 100 --num 1000 http://localhost:3000/api/health
   ```

## 📚 参考资源

- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [SQLite Optimization](https://www.sqlite.org/optoverview.html)
- [PM2 Documentation](https://pm2.keymetrics.io/)

## 🤝 贡献

欢迎提交性能优化建议和改进方案！

## 📄 许可

MIT License