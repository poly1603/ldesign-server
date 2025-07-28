<template>
  <div class="home">
    <div class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="gradient-text">LDesign</span>
            <br>
            API 文档系统
          </h1>
          <p class="hero-description">
            现代化、交互式的 API 文档平台，提供完整的接口说明和实时测试功能
          </p>
          <div class="hero-actions">
            <router-link to="/api-docs" class="btn btn-primary">
              查看 API 文档
            </router-link>
            <a href="http://localhost:3002" target="_blank" class="btn btn-secondary">
              访问 API 服务
            </a>
          </div>
        </div>
        <div class="hero-image">
          <div class="api-preview">
            <div class="preview-header">
              <div class="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="preview-title">API 接口</div>
            </div>
            <div class="preview-content">
              <div class="api-item">
                <span class="method get">GET</span>
                <span class="path">/api/users</span>
              </div>
              <div class="api-item">
                <span class="method post">POST</span>
                <span class="path">/api/users</span>
              </div>
              <div class="api-item">
                <span class="method put">PUT</span>
                <span class="path">/api/users/:id</span>
              </div>
              <div class="api-item">
                <span class="method delete">DELETE</span>
                <span class="path">/api/users/:id</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="features">
      <div class="container">
        <h2 class="section-title">功能特性</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>完整文档</h3>
            <p>详细的 API 接口说明，包含请求参数、响应格式和示例代码</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>实时测试</h3>
            <p>在线测试 API 接口，支持参数配置和响应预览</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3>现代设计</h3>
            <p>简洁美观的界面设计，提供良好的用户体验</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>快速响应</h3>
            <p>基于 Vue 3 和 Vite 构建，提供极速的开发和使用体验</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
  pointer-events: none;
}

.hero-content {
  flex: 1;
  max-width: 600px;
  z-index: 1;
  position: relative;
}

.hero-title {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  position: relative;
}

.api-preview {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-dots {
  display: flex;
  gap: 6px;
  margin-right: 12px;
}

.preview-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.preview-dots span:nth-child(1) { background: #ff5f56; }
.preview-dots span:nth-child(2) { background: #ffbd2e; }
.preview-dots span:nth-child(3) { background: #27ca3f; }

.preview-title {
  font-size: 14px;
  font-weight: 500;
}

.preview-content {
  padding: 16px;
}

.api-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.api-item:last-child {
  border-bottom: none;
}

.method {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 60px;
  text-align: center;
  margin-right: 12px;
}

.method.get { background: #27ae60; color: white; }
.method.post { background: #3498db; color: white; }
.method.put { background: #f39c12; color: white; }
.method.delete { background: #e74c3c; color: white; }

.path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.features {
  padding: 80px 0;
  background: white;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: #2c3e50;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero {
    text-align: center;
  }
  
  .hero .container {
    flex-direction: column;
    gap: 2rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .api-preview {
    width: 100%;
    max-width: 350px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>