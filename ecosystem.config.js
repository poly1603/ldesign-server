module.exports = {
  apps: [{
    name: 'ldesign-server',
    script: './dist/main.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1, // 生产环境使用所有 CPU 核心
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork', // 生产环境使用集群模式
    watch: false, // 生产环境不监听文件变化
    max_memory_restart: '1G', // 内存超过 1G 自动重启
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // 生产环境优化
      NODE_OPTIONS: '--max-old-space-size=4096', // 增加 Node.js 内存限制
      UV_THREADPOOL_SIZE: 128, // 增加 libuv 线程池大小
    },
    
    // 错误处理
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    time: true,
    
    // 自动重启配置
    autorestart: true,
    min_uptime: '10s', // 最小运行时间
    max_restarts: 10, // 最大重启次数
    
    // 优雅关闭
    kill_timeout: 5000, // 关闭超时时间
    listen_timeout: 3000, // 监听超时时间
    
    // 集群模式配置
    instance_var: 'INSTANCE_ID', // 实例 ID 环境变量
    
    // 性能监控
    monitoring: true,
    
    // 启动顺序
    wait_ready: true, // 等待应用准备就绪
    
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // 健康检查
    health_check_interval: 30000, // 30 秒健康检查间隔
  }],
  
  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/ldesign-server',
      'post-deploy': 'pnpm install && pnpm build && pm2 startOrRestart ecosystem.config.js --env production',
      'pre-deploy': 'git pull',
    },
  },
}