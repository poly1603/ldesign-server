<template>
  <div class="api-doc">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <router-link to="/" class="logo">
            <span class="gradient-text">LDesign</span> API
          </router-link>
          <nav class="nav">
            <a href="http://localhost:3002" target="_blank" class="nav-link">
              API 服务
            </a>
          </nav>
        </div>
      </div>
    </header>

    <div class="main">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-content">
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索接口..."
              class="search-input"
            >
          </div>
          
          <nav class="api-nav">
            <div 
              v-for="group in filteredApiGroups" 
              :key="group.name"
              class="nav-group"
            >
              <h3 class="group-title">{{ group.name }}</h3>
              <ul class="group-items">
                <li 
                  v-for="api in group.apis" 
                  :key="api.id"
                  class="nav-item"
                  :class="{ active: selectedApi?.id === api.id }"
                  @click="selectApi(api)"
                >
                  <span class="method" :class="api.method.toLowerCase()">{{ api.method }}</span>
                  <span class="path">{{ api.path }}</span>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="content">
        <div v-if="!selectedApi" class="welcome">
          <div class="welcome-content">
            <h1>欢迎使用 LDesign API 文档</h1>
            <p>请从左侧选择一个 API 接口查看详细信息</p>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-number">{{ totalApis }}</div>
                <div class="stat-label">API 接口</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ apiGroups.length }}</div>
                <div class="stat-label">接口分组</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="api-detail">
          <!-- API 基本信息 -->
          <div class="api-header">
            <div class="api-title">
              <span class="method" :class="selectedApi.method.toLowerCase()">
                {{ selectedApi.method }}
              </span>
              <h1>{{ selectedApi.path }}</h1>
            </div>
            <p class="api-description">{{ selectedApi.description }}</p>
          </div>

          <!-- 在线测试 - 置顶 -->
          <section class="section test-section">
            <h2>在线测试</h2>
            <div class="test-panel">
              <div class="test-form">
                <div class="form-group">
                  <h3>请求参数</h3>
                  
                  <!-- 认证Token -->
                  <div class="param-input">
                    <label>Authorization Token <span class="optional-mark">(自动填充)</span></label>
                    <input 
                      v-model="testParams.token"
                      type="text"
                      placeholder="Bearer token for authentication"
                      class="input"
                      readonly
                    >
                  </div>
                  
                  <!-- 参数网格布局 -->
                  <div class="params-grid">
                    <div 
                      v-for="param in selectedApi.parameters" 
                      :key="param.name"
                      class="param-input-grid"
                    >
                      <label>
                        {{ param.name }} 
                        <span v-if="param.required" class="required-mark">*</span>
                        <span v-else class="optional-mark">(可选)</span>
                        <span class="param-type">{{ param.type }}</span>
                      </label>
                      <input 
                        v-if="param.type !== 'array'"
                        v-model="testParams[param.name]"
                        :type="getInputType(param.type)"
                        :placeholder="param.description"
                        class="input"
                      >
                      <textarea 
                        v-else
                        v-model="testParams[param.name]"
                        :placeholder="`${param.description} (JSON数组格式或逗号分隔)`"
                        class="input textarea"
                        rows="3"
                      ></textarea>
                      <div class="param-description">{{ param.description }}</div>
                    </div>
                  </div>
                  
                  <div v-if="!selectedApi.parameters?.length" class="no-params">
                    <p>此接口无需额外参数</p>
                  </div>
                </div>
                
                <div class="test-actions">
                  <button 
                    @click="sendTestRequest" 
                    :disabled="isLoading"
                    class="btn btn-primary"
                  >
                    {{ isLoading ? '发送中...' : '发送请求' }}
                  </button>
                  <button @click="clearTestParams" class="btn btn-secondary">
                    清空参数
                  </button>
                  <!-- 验证码生成按钮 -->
                  <button 
                    v-if="selectedApi.id === 'auth-captcha-generate'"
                    @click="generateCaptcha" 
                    :disabled="isLoading"
                    class="btn btn-info"
                  >
                    {{ isLoading ? '生成中...' : '生成验证码' }}
                  </button>
                </div>
              </div>
              
              <div v-if="testResponse" class="test-result">
                <h3>响应结果</h3>
                <div class="response-status" :class="getStatusClass(testResponse.status)">
                  状态码: {{ testResponse.status }} {{ testResponse.statusText }}
                  <span v-if="testResponse.note" class="response-note">{{ testResponse.note }}</span>
                </div>
                
                <!-- 验证码图片展示 -->
                <div v-if="selectedApi.id === 'auth-captcha-generate' && testResponse.data?.captchaSvg" class="captcha-display">
                  <h4>验证码图片</h4>
                  <div class="captcha-image" v-html="testResponse.data.captchaSvg"></div>
                  <div class="captcha-info">
                    <p><strong>会话ID:</strong> {{ testResponse.data.sessionId }}</p>
                    <p class="captcha-hint">请将此会话ID和验证码用于登录或注册</p>
                  </div>
                </div>
                
                <!-- 请求信息 -->
                <div class="request-info">
                  <h4>请求信息</h4>
                  <div class="info-item">
                    <strong>URL:</strong> {{ testResponse.requestUrl }}
                  </div>
                  <div v-if="testResponse.requestBody && Object.keys(testResponse.requestBody).length" class="info-item">
                    <strong>请求体:</strong>
                    <pre class="request-body"><code>{{ JSON.stringify(testResponse.requestBody, null, 2) }}</code></pre>
                  </div>
                  <div v-if="testResponse.requestHeaders" class="info-item">
                    <strong>请求头:</strong>
                    <pre class="request-headers"><code>{{ JSON.stringify(testResponse.requestHeaders, null, 2) }}</code></pre>
                  </div>
                </div>
                
                <!-- 响应信息 -->
                <div class="response-info">
                  <h4>响应数据</h4>
                  <div v-if="testResponse.headers" class="info-item">
                    <strong>响应头:</strong>
                    <pre class="response-headers"><code>{{ JSON.stringify(testResponse.headers, null, 2) }}</code></pre>
                  </div>
                  <div class="info-item">
                    <strong>响应体:</strong>
                    <pre class="response-body"><code>{{ JSON.stringify(testResponse.data, null, 2) }}</code></pre>
                  </div>
                </div>
                
                <div v-if="testResponse.error" class="error-info">
                  <h4>错误信息</h4>
                  <div class="error-message">{{ testResponse.error }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 请求参数 -->
          <section class="section">
            <h2>请求参数</h2>
            <div v-if="selectedApi.parameters?.length" class="params-table">
              <table>
                <thead>
                  <tr>
                    <th>参数名</th>
                    <th>类型</th>
                    <th>必填</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="param in selectedApi.parameters" :key="param.name">
                    <td><code>{{ param.name }}</code></td>
                    <td><span class="type">{{ param.type }}</span></td>
                    <td>
                      <span class="required" :class="{ yes: param.required }">
                        {{ param.required ? '是' : '否' }}
                      </span>
                    </td>
                    <td>{{ param.description }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="no-params">
              <p>此接口无需参数</p>
            </div>
          </section>

          <!-- 响应示例 -->
          <section class="section">
            <h2>响应示例</h2>
            <div class="response-example">
              <pre><code>{{ JSON.stringify(selectedApi.response, null, 2) }}</code></pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import axios from 'axios'

// 类型定义
interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
}

interface ApiInfo {
  id: string
  method: string
  path: string
  description: string
  parameters?: ApiParameter[]
  response: any
}

interface ApiGroup {
  name: string
  apis: ApiInfo[]
}

// 响应式数据
const searchQuery = ref('')
const selectedApi = ref<ApiInfo | null>(null)
const testParams = reactive<Record<string, any>>({})
const testResponse = ref<any>(null)
const isLoading = ref(false)

// Token管理
const getStoredToken = () => {
  return localStorage.getItem('api_token') || ''
}

const setStoredToken = (token: string) => {
  localStorage.setItem('api_token', token)
}

// 初始化token
testParams.token = getStoredToken()

// 完整的 API 数据 - 按照后端实际接口分类
const apiGroups = ref<ApiGroup[]>([
  {
    name: '认证管理',
    apis: [
      {
        id: 'auth-login',
        method: 'POST',
        path: '/auth/login',
        description: '用户登录',
        parameters: [
          { name: 'username', type: 'string', required: true, description: '用户名或邮箱' },
          { name: 'password', type: 'string', required: true, description: '密码' },
          { name: 'captchaSessionId', type: 'string', required: true, description: '验证码会话ID' },
          { name: 'captcha', type: 'string', required: true, description: '验证码' }
        ],
        response: {
          code: 200,
          message: '登录成功',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
              fullName: '管理员',
              roles: ['admin']
            }
          }
        }
      },
      {
        id: 'auth-register',
        method: 'POST',
        path: '/auth/register',
        description: '用户注册',
        parameters: [
          { name: 'username', type: 'string', required: true, description: '用户名' },
          { name: 'email', type: 'string', required: true, description: '邮箱' },
          { name: 'password', type: 'string', required: true, description: '密码' },
          { name: 'confirmPassword', type: 'string', required: true, description: '确认密码' },
          { name: 'fullName', type: 'string', required: false, description: '全名' },
          { name: 'phone', type: 'string', required: false, description: '手机号' },
          { name: 'captchaSessionId', type: 'string', required: true, description: '验证码会话ID' },
          { name: 'captcha', type: 'string', required: true, description: '验证码' }
        ],
        response: {
          code: 201,
          message: '注册成功',
          data: {
            id: 2,
            username: 'newuser',
            email: 'newuser@example.com',
            fullName: '新用户'
          }
        }
      },
      {
        id: 'auth-refresh',
        method: 'POST',
        path: '/auth/refresh',
        description: '刷新访问令牌',
        parameters: [
          { name: 'refreshToken', type: 'string', required: true, description: '刷新令牌' }
        ],
        response: {
          code: 200,
          message: '令牌刷新成功',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      },
      {
        id: 'auth-logout',
        method: 'POST',
        path: '/auth/logout',
        description: '用户登出',
        parameters: [],
        response: {
          code: 200,
          message: '登出成功'
        }
      },
      {
        id: 'auth-change-password',
        method: 'PATCH',
        path: '/auth/change-password',
        description: '修改密码',
        parameters: [
          { name: 'oldPassword', type: 'string', required: true, description: '旧密码' },
          { name: 'newPassword', type: 'string', required: true, description: '新密码' }
        ],
        response: {
          code: 200,
          message: '密码修改成功'
        }
      },
      {
        id: 'auth-forgot-password',
        method: 'POST',
        path: '/auth/forgot-password',
        description: '忘记密码',
        parameters: [
          { name: 'email', type: 'string', required: true, description: '邮箱地址' }
        ],
        response: {
          code: 200,
          message: '如果邮箱存在，重置密码邮件已发送'
        }
      },
      {
        id: 'auth-reset-password',
        method: 'POST',
        path: '/auth/reset-password',
        description: '重置密码',
        parameters: [
          { name: 'token', type: 'string', required: true, description: '重置令牌' },
          { name: 'newPassword', type: 'string', required: true, description: '新密码' }
        ],
        response: {
          code: 200,
          message: '密码重置成功'
        }
      },
      {
        id: 'auth-verify-token',
        method: 'POST',
        path: '/auth/verify-token',
        description: '验证令牌有效性',
        parameters: [],
        response: {
          code: 200,
          message: '令牌验证成功',
          data: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            fullName: '管理员',
            roles: ['admin'],
            permissions: ['user:read', 'user:create', 'user:update', 'user:delete']
          }
        }
      },
      {
        id: 'auth-captcha-generate',
        method: 'GET',
        path: '/auth/captcha/generate',
        description: '生成验证码',
        parameters: [],
        response: {
          code: 200,
          message: '验证码生成成功',
          data: {
            sessionId: 'captcha_1234567890_abc123',
            captchaImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIi4uLg==',
            expiresIn: 300
          }
        }
      },
      {
        id: 'auth-captcha-verify',
        method: 'POST',
        path: '/auth/captcha/verify',
        description: '验证验证码',
        parameters: [
          { name: 'sessionId', type: 'string', required: true, description: '验证码会话ID' },
          { name: 'captcha', type: 'string', required: true, description: '验证码' }
        ],
        response: {
          code: 200,
          message: '验证码验证完成',
          data: {
            valid: true,
            message: '验证码验证成功'
          }
        }
      }
    ]
  },
  {
    name: '用户管理',
    apis: [
      {
        id: 'users-list',
        method: 'GET',
        path: '/users',
        description: '获取用户列表',
        parameters: [
          { name: 'page', type: 'number', required: false, description: '页码，默认为1' },
          { name: 'limit', type: 'number', required: false, description: '每页数量，默认为10' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词' },
          { name: 'status', type: 'string', required: false, description: '用户状态：active/inactive' },
          { name: 'role', type: 'string', required: false, description: '角色筛选' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            users: [
              {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                fullName: '系统管理员',
                avatar: null,
                status: 'active',
                roles: [{ id: 1, name: 'admin', displayName: '管理员' }],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          }
        }
      },
      {
        id: 'users-create',
        method: 'POST',
        path: '/users',
        description: '创建用户',
        parameters: [
          { name: 'username', type: 'string', required: true, description: '用户名' },
          { name: 'email', type: 'string', required: true, description: '邮箱' },
          { name: 'password', type: 'string', required: true, description: '密码' },
          { name: 'fullName', type: 'string', required: true, description: '全名' },
          { name: 'avatar', type: 'string', required: false, description: '头像URL' }
        ],
        response: {
          code: 201,
          message: '用户创建成功',
          data: {
            id: 2,
            username: 'newuser',
            email: 'newuser@example.com',
            fullName: '新用户',
            status: 'active',
            createdAt: '2024-01-02T00:00:00.000Z'
          }
        }
      },
      {
        id: 'users-detail',
        method: 'GET',
        path: '/users/:id',
        description: '获取用户详情',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '用户ID' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            fullName: '系统管理员',
            avatar: null,
            status: 'active',
            roles: [{ id: 1, name: 'admin', displayName: '管理员' }],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        }
      },
      {
        id: 'users-update',
        method: 'PATCH',
        path: '/users/:id',
        description: '更新用户信息',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '用户ID' },
          { name: 'username', type: 'string', required: false, description: '用户名' },
          { name: 'email', type: 'string', required: false, description: '邮箱' },
          { name: 'fullName', type: 'string', required: false, description: '全名' },
          { name: 'avatar', type: 'string', required: false, description: '头像URL' }
        ],
        response: {
          code: 200,
          message: '用户更新成功',
          data: {
            id: 1,
            username: 'admin_updated',
            email: 'admin@example.com',
            fullName: '系统管理员（已更新）',
            updatedAt: '2024-01-02T00:00:00.000Z'
          }
        }
      },
      {
        id: 'users-delete',
        method: 'DELETE',
        path: '/users/:id',
        description: '删除用户',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '用户ID' }
        ],
        response: {
          code: 200,
          message: '用户删除成功'
        }
      },
      {
        id: 'users-toggle-status',
        method: 'PATCH',
        path: '/users/:id/status',
        description: '切换用户状态',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '用户ID' }
        ],
        response: {
          code: 200,
          message: '用户状态切换成功',
          data: {
            id: 1,
            status: 'inactive'
          }
        }
      },
      {
        id: 'users-assign-roles',
        method: 'POST',
        path: '/users/:id/roles',
        description: '分配用户角色',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '用户ID' },
          { name: 'roleIds', type: 'array', required: true, description: '角色ID数组' }
        ],
        response: {
          code: 200,
          message: '角色分配成功',
          data: {
            id: 1,
            roles: [
              { id: 1, name: 'admin', displayName: '管理员' },
              { id: 2, name: 'user', displayName: '普通用户' }
            ]
          }
        }
      }
    ]
  },
  {
    name: '角色管理',
    apis: [
      {
        id: 'roles-list',
        method: 'GET',
        path: '/roles',
        description: '获取角色列表',
        parameters: [
          { name: 'page', type: 'number', required: false, description: '页码' },
          { name: 'limit', type: 'number', required: false, description: '每页数量' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            roles: [
              {
                id: 1,
                name: 'admin',
                displayName: '管理员',
                description: '系统管理员角色',
                status: 'active',
                permissions: [
                  { id: 1, name: 'user:read', displayName: '查看用户' },
                  { id: 2, name: 'user:create', displayName: '创建用户' }
                ],
                createdAt: '2024-01-01T00:00:00.000Z'
              }
            ],
            total: 1
          }
        }
      },
      {
        id: 'roles-create',
        method: 'POST',
        path: '/roles',
        description: '创建角色',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '角色名称' },
          { name: 'displayName', type: 'string', required: true, description: '显示名称' },
          { name: 'description', type: 'string', required: false, description: '角色描述' }
        ],
        response: {
          code: 201,
          message: '角色创建成功',
          data: {
            id: 2,
            name: 'editor',
            displayName: '编辑者',
            description: '内容编辑角色',
            status: 'active'
          }
        }
      },
      {
        id: 'roles-detail',
        method: 'GET',
        path: '/roles/:id',
        description: '获取角色详情',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '角色ID' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            name: 'admin',
            displayName: '管理员',
            description: '系统管理员角色',
            status: 'active',
            permissions: [
              { id: 1, name: 'user:read', displayName: '查看用户' },
              { id: 2, name: 'user:create', displayName: '创建用户' }
            ]
          }
        }
      },
      {
        id: 'roles-update',
        method: 'PATCH',
        path: '/roles/:id',
        description: '更新角色信息',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '角色ID' },
          { name: 'displayName', type: 'string', required: false, description: '显示名称' },
          { name: 'description', type: 'string', required: false, description: '角色描述' }
        ],
        response: {
          code: 200,
          message: '角色更新成功',
          data: {
            id: 1,
            displayName: '超级管理员',
            description: '系统超级管理员角色'
          }
        }
      },
      {
        id: 'roles-delete',
        method: 'DELETE',
        path: '/roles/:id',
        description: '删除角色',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '角色ID' }
        ],
        response: {
          code: 200,
          message: '角色删除成功'
        }
      },
      {
        id: 'roles-toggle-status',
        method: 'PATCH',
        path: '/roles/:id/status',
        description: '切换角色状态',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '角色ID' }
        ],
        response: {
          code: 200,
          message: '角色状态切换成功'
        }
      },
      {
        id: 'roles-assign-permissions',
        method: 'POST',
        path: '/roles/:id/permissions',
        description: '分配角色权限',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '角色ID' },
          { name: 'permissionIds', type: 'array', required: true, description: '权限ID数组' }
        ],
        response: {
          code: 200,
          message: '权限分配成功',
          data: {
            id: 1,
            permissions: [
              { id: 1, name: 'user:read', displayName: '查看用户' },
              { id: 2, name: 'user:create', displayName: '创建用户' }
            ]
          }
        }
      }
    ]
  },
  {
    name: '权限管理',
    apis: [
      {
        id: 'permissions-list',
        method: 'GET',
        path: '/permissions',
        description: '获取权限列表',
        parameters: [
          { name: 'page', type: 'number', required: false, description: '页码' },
          { name: 'limit', type: 'number', required: false, description: '每页数量' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词' },
          { name: 'module', type: 'string', required: false, description: '模块筛选' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            permissions: [
              {
                id: 1,
                name: 'user:read',
                displayName: '查看用户',
                description: '查看用户信息的权限',
                module: 'user',
                status: 'active',
                createdAt: '2024-01-01T00:00:00.000Z'
              }
            ],
            total: 1
          }
        }
      },
      {
        id: 'permissions-tree',
        method: 'GET',
        path: '/permissions/tree',
        description: '获取权限树',
        parameters: [],
        response: {
          code: 200,
          message: 'success',
          data: [
            {
              id: 1,
              name: 'user',
              displayName: '用户管理',
              children: [
                { id: 2, name: 'user:read', displayName: '查看用户' },
                { id: 3, name: 'user:create', displayName: '创建用户' }
              ]
            }
          ]
        }
      },
      {
        id: 'permissions-create',
        method: 'POST',
        path: '/permissions',
        description: '创建权限',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '权限名称' },
          { name: 'displayName', type: 'string', required: true, description: '显示名称' },
          { name: 'description', type: 'string', required: false, description: '权限描述' },
          { name: 'module', type: 'string', required: true, description: '所属模块' },
          { name: 'parentId', type: 'number', required: false, description: '父权限ID' }
        ],
        response: {
          code: 201,
          message: '权限创建成功',
          data: {
            id: 4,
            name: 'user:update',
            displayName: '更新用户',
            module: 'user',
            status: 'active'
          }
        }
      },
      {
        id: 'permissions-detail',
        method: 'GET',
        path: '/permissions/:id',
        description: '获取权限详情',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '权限ID' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            name: 'user:read',
            displayName: '查看用户',
            description: '查看用户信息的权限',
            module: 'user',
            status: 'active'
          }
        }
      },
      {
        id: 'permissions-update',
        method: 'PATCH',
        path: '/permissions/:id',
        description: '更新权限信息',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '权限ID' },
          { name: 'displayName', type: 'string', required: false, description: '显示名称' },
          { name: 'description', type: 'string', required: false, description: '权限描述' }
        ],
        response: {
          code: 200,
          message: '权限更新成功'
        }
      },
      {
        id: 'permissions-delete',
        method: 'DELETE',
        path: '/permissions/:id',
        description: '删除权限',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '权限ID' }
        ],
        response: {
          code: 200,
          message: '权限删除成功'
        }
      },
      {
        id: 'permissions-toggle-status',
        method: 'PATCH',
        path: '/permissions/:id/status',
        description: '切换权限状态',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '权限ID' }
        ],
        response: {
          code: 200,
          message: '权限状态切换成功'
        }
      }
    ]
  },
  {
    name: '菜单管理',
    apis: [
      {
        id: 'menus-list',
        method: 'GET',
        path: '/menus',
        description: '获取菜单列表',
        parameters: [
          { name: 'parentId', type: 'number', required: false, description: '父菜单ID' },
          { name: 'level', type: 'number', required: false, description: '菜单层级' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: [
            {
              id: 1,
              name: 'dashboard',
              title: '仪表板',
              path: '/dashboard',
              icon: 'dashboard',
              sort: 1,
              status: 'active',
              children: []
            }
          ]
        }
      },
      {
        id: 'menus-tree',
        method: 'GET',
        path: '/menus/tree',
        description: '获取菜单树结构',
        parameters: [],
        response: {
          code: 200,
          message: 'success',
          data: [
            {
              id: 1,
              name: 'dashboard',
              title: '仪表板',
              path: '/dashboard',
              icon: 'dashboard',
              children: [
                {
                  id: 2,
                  name: 'analytics',
                  title: '数据分析',
                  path: '/dashboard/analytics'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'menus-user',
        method: 'GET',
        path: '/menus/user',
        description: '获取当前用户可访问的菜单',
        parameters: [],
        response: {
          code: 200,
          message: 'success',
          data: [
            {
              id: 1,
              name: 'dashboard',
              title: '仪表板',
              path: '/dashboard',
              icon: 'dashboard'
            }
          ]
        }
      },
      {
        id: 'menus-create',
        method: 'POST',
        path: '/menus',
        description: '创建菜单',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '菜单名称' },
          { name: 'title', type: 'string', required: true, description: '菜单标题' },
          { name: 'path', type: 'string', required: false, description: '菜单路径' },
          { name: 'icon', type: 'string', required: false, description: '菜单图标' },
          { name: 'parentId', type: 'number', required: false, description: '父菜单ID' },
          { name: 'sort', type: 'number', required: false, description: '排序' }
        ],
        response: {
          code: 201,
          message: '菜单创建成功',
          data: {
            id: 3,
            name: 'users',
            title: '用户管理',
            path: '/users',
            icon: 'user'
          }
        }
      },
      {
        id: 'menus-update',
        method: 'PATCH',
        path: '/menus/:id',
        description: '更新菜单',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '菜单ID' },
          { name: 'title', type: 'string', required: false, description: '菜单标题' },
          { name: 'path', type: 'string', required: false, description: '菜单路径' },
          { name: 'icon', type: 'string', required: false, description: '菜单图标' },
          { name: 'sort', type: 'number', required: false, description: '排序' }
        ],
        response: {
          code: 200,
          message: '菜单更新成功'
        }
      },
      {
        id: 'menus-delete',
        method: 'DELETE',
        path: '/menus/:id',
        description: '删除菜单',
        parameters: [
          { name: 'id', type: 'number', required: true, description: '菜单ID' }
        ],
        response: {
          code: 200,
          message: '菜单删除成功'
        }
      }
    ]
  },
  {
    name: '系统管理',
    apis: [
      {
        id: 'system-stats',
        method: 'GET',
        path: '/system/stats',
        description: '获取系统统计数据',
        parameters: [],
        response: {
          code: 200,
          message: 'success',
          data: {
            userCount: 156,
            roleCount: 8,
            permissionCount: 45,
            menuCount: 23,
            apiCallsToday: 1234,
            systemUptime: '15天 8小时 32分钟'
          }
        }
      },
      {
        id: 'system-config',
        method: 'GET',
        path: '/system/config',
        description: '获取系统配置',
        parameters: [],
        response: {
          code: 200,
          message: 'success',
          data: {
            siteName: 'LDesign API 管理系统',
            siteDescription: '企业级API管理平台',
            allowRegistration: true,
            emailVerificationRequired: false,
            maxLoginAttempts: 5,
            sessionTimeout: 3600
          }
        }
      },
      {
        id: 'system-config-update',
        method: 'PUT',
        path: '/system/config',
        description: '更新系统配置',
        parameters: [
          { name: 'siteName', type: 'string', required: false, description: '站点名称' },
          { name: 'siteDescription', type: 'string', required: false, description: '站点描述' },
          { name: 'allowRegistration', type: 'boolean', required: false, description: '允许注册' },
          { name: 'emailVerificationRequired', type: 'boolean', required: false, description: '需要邮箱验证' }
        ],
        response: {
          code: 200,
          message: '系统配置更新成功'
        }
      },
      {
        id: 'system-logs',
        method: 'GET',
        path: '/system/logs',
        description: '获取系统日志',
        parameters: [
          { name: 'page', type: 'number', required: false, description: '页码' },
          { name: 'limit', type: 'number', required: false, description: '每页数量' },
          { name: 'level', type: 'string', required: false, description: '日志级别：info/warn/error' },
          { name: 'startDate', type: 'string', required: false, description: '开始日期' },
          { name: 'endDate', type: 'string', required: false, description: '结束日期' }
        ],
        response: {
          code: 200,
          message: 'success',
          data: {
            logs: [
              {
                id: 1,
                level: 'info',
                message: '用户登录成功',
                userId: 1,
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0...',
                createdAt: '2024-01-01T10:30:00.000Z'
              }
            ],
            total: 1
          }
        }
      },
      {
        id: 'system-logs-clear',
        method: 'DELETE',
        path: '/system/logs',
        description: '清理系统日志',
        parameters: [
          { name: 'beforeDate', type: 'string', required: false, description: '清理此日期之前的日志' },
          { name: 'level', type: 'string', required: false, description: '清理指定级别的日志' }
        ],
        response: {
          code: 200,
          message: '日志清理成功',
          data: {
            deletedCount: 150
          }
        }
      },
      {
        id: 'system-backup',
        method: 'POST',
        path: '/system/backup',
        description: '创建数据备份',
        parameters: [
          { name: 'includeUsers', type: 'boolean', required: false, description: '包含用户数据' },
          { name: 'includeRoles', type: 'boolean', required: false, description: '包含角色数据' },
          { name: 'includePermissions', type: 'boolean', required: false, description: '包含权限数据' }
        ],
        response: {
          code: 200,
          message: '备份创建成功',
          data: {
            backupId: 'backup_20240101_103000',
            fileName: 'ldesign_backup_20240101_103000.sql',
            size: '2.5MB',
            createdAt: '2024-01-01T10:30:00.000Z'
          }
        }
      },
      {
        id: 'system-health',
        method: 'GET',
        path: '/health',
        description: '系统健康检查',
        parameters: [],
        response: {
          code: 200,
          message: 'success',
          data: {
            status: 'healthy',
            database: {
              status: 'connected',
              responseTime: '15ms'
            },
            redis: {
              status: 'connected',
              responseTime: '5ms'
            },
            memory: {
              used: '256MB',
              total: '1GB',
              percentage: 25
            },
            uptime: '15天 8小时 32分钟'
          }
        }
      }
    ]
  }
])

// 计算属性
const filteredApiGroups = computed(() => {
  if (!searchQuery.value) return apiGroups.value
  
  return apiGroups.value.map(group => ({
    ...group,
    apis: group.apis.filter(api => 
      api.path.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })).filter(group => group.apis.length > 0)
})

const totalApis = computed(() => {
  return apiGroups.value.reduce((total, group) => total + group.apis.length, 0)
})

// 方法
const selectApi = (api: ApiInfo) => {
  selectedApi.value = api
  testResponse.value = null
  clearTestParams()
}

const clearTestParams = () => {
  Object.keys(testParams).forEach(key => {
    delete testParams[key]
  })
}

const getInputType = (type: string) => {
  switch (type) {
    case 'number': return 'number'
    case 'email': return 'email'
    case 'password': return 'password'
    default: return 'text'
  }
}

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'error'
  if (status >= 500) return 'server-error'
  return ''
}

// 构建请求体
const buildRequestBody = () => {
  if (!selectedApi.value) return {}
  
  const body: any = {}
  selectedApi.value.parameters?.forEach(param => {
    if (param.required || testParams[param.name]) {
      let value = testParams[param.name]
      
      // 类型转换
      if (param.type === 'number' && value) {
        value = Number(value)
      } else if (param.type === 'boolean' && value !== undefined) {
        value = value === 'true' || value === true
      } else if (param.type === 'array' && value) {
        try {
          value = JSON.parse(value)
        } catch {
          value = value.split(',')
        }
      }
      
      body[param.name] = value
    }
  })
  
  return body
}

// 构建请求URL
const buildRequestUrl = () => {
  if (!selectedApi.value) return ''
  
  let url = `http://localhost:3002${selectedApi.value.path}`
  
  // 替换路径参数
  selectedApi.value.parameters?.forEach(param => {
    if (selectedApi.value!.path.includes(`:${param.name}`)) {
      const value = testParams[param.name] || `{${param.name}}`
      url = url.replace(`:${param.name}`, value)
    }
  })
  
  // 添加查询参数（仅对GET请求）
  if (selectedApi.value.method === 'GET') {
    const queryParams = new URLSearchParams()
    selectedApi.value.parameters?.forEach(param => {
      if (!selectedApi.value!.path.includes(`:${param.name}`) && testParams[param.name]) {
        queryParams.append(param.name, testParams[param.name])
      }
    })
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }
  }
  
  return url
}

const sendTestRequest = async () => {
  if (!selectedApi.value) return
  
  isLoading.value = true
  testResponse.value = null
  
  try {
    const api = selectedApi.value
    const url = buildRequestUrl()
    const requestBody = buildRequestBody()
    
    console.log('发送请求:', { url, requestBody, method: api.method })
    
    let response
    
    switch (api.method) {
      case 'GET':
        const params = { ...testParams }
        // 移除路径参数
        api.parameters?.forEach(param => {
          if (api.path.includes(`:${param.name}`)) {
            delete params[param.name]
          }
        })
        response = await axios.get(url, { 
          params,
          headers: {
            'Authorization': `Bearer ${testParams.token || 'your-token-here'}`
          }
        })
        break
      case 'POST':
        response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testParams.token || 'your-token-here'}`
          }
        })
        break
      case 'PUT':
      case 'PATCH':
        response = await axios.put(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testParams.token || 'your-token-here'}`
          }
        })
        break
      case 'DELETE':
        response = await axios.delete(url, {
          headers: {
            'Authorization': `Bearer ${testParams.token || 'your-token-here'}`
          }
        })
        break
      default:
        throw new Error(`不支持的请求方法: ${api.method}`)
    }
    
    testResponse.value = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      requestUrl: url,
      requestBody: requestBody,
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testParams.token || 'your-token-here'}`
      }
    }
    
    // 如果是登录接口且成功，自动存储token
    if (api.id === 'auth-login' && response.status === 200 && response.data?.data?.accessToken) {
      const token = response.data.data.accessToken
      setStoredToken(token)
      testParams.token = token
      console.log('登录成功，已自动存储token:', token)
    }
  } catch (error: any) {
    console.error('API 测试失败:', error)
    
    // 如果是网络错误，显示模拟响应
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      testResponse.value = {
        status: 200,
        statusText: 'OK (模拟响应)',
        data: selectedApi.value.response,
        requestUrl: buildRequestUrl(),
        requestBody: buildRequestBody(),
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testParams.token || 'your-token-here'}`
        },
        note: '由于后端服务未启动，显示模拟响应数据'
      }
    } else {
      testResponse.value = {
        status: error.response?.status || 500,
        statusText: error.response?.statusText || 'Internal Server Error',
        data: error.response?.data || { message: error.message },
        requestUrl: buildRequestUrl(),
        requestBody: buildRequestBody(),
        error: error.message
      }
    }
  } finally {
    isLoading.value = false
  }
}

// 生成验证码
const generateCaptcha = async () => {
  await sendTestRequest()
}
</script>

<style scoped>
.api-doc {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  color: #2c3e50;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-link {
  color: #6c757d;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #667eea;
}

.main {
  display: flex;
  height: calc(100vh - 80px);
  overflow: hidden;
}

.sidebar {
  width: 350px;
  background: white;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-content {
  padding: 1.5rem;
}

.search-box {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.nav-group {
  margin-bottom: 2rem;
}

.group-title {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.group-items {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-item .method {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
  margin-right: 0.75rem;
}

.method.get { background: #27ae60; color: white; }
.method.post { background: #3498db; color: white; }
.method.put { background: #f39c12; color: white; }
.method.patch { background: #9b59b6; color: white; }
.method.delete { background: #e74c3c; color: white; }

.nav-item.active .method {
  background: rgba(255, 255, 255, 0.2);
}

.path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  flex: 1;
}

.content {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

.welcome {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
}

.welcome-content {
  text-align: center;
  max-width: 500px;
}

.welcome-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.welcome-content p {
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.api-detail {
  padding: 2rem;
  max-width: 1000px;
}

.api-header {
  margin-bottom: 2rem;
}

.api-title {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.api-title h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin-left: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.api-description {
  font-size: 1.1rem;
  color: #6c757d;
  line-height: 1.6;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.params-table table {
  width: 100%;
  border-collapse: collapse;
}

.params-table th,
.params-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.params-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.required.yes {
  color: #e74c3c;
  font-weight: 600;
}

.no-params {
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.response-example pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}

.test-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-group h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
}

.param-input {
  margin-bottom: 1rem;
}

.param-input label {
  display: block;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

/* Grid布局样式 */
.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.param-input-grid {
  display: flex;
  flex-direction: column;
}

.param-input-grid label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

/* 验证码显示样式 */
.captcha-display {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.captcha-display h4 {
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}

.captcha-image {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 2px solid #dee2e6;
}

.captcha-image svg {
  max-width: 100%;
  height: auto;
}

.captcha-info {
  margin-top: 1rem;
}

.captcha-info p {
  margin: 0.5rem 0;
  font-size: 14px;
}

.captcha-hint {
  color: #6c757d;
  font-style: italic;
}

/* 测试区域置顶样式 */
.test-section {
  order: -1;
}

/* 按钮样式增强 */
.btn.btn-info {
  background: #17a2b8;
  border-color: #17a2b8;
  color: white;
}

.btn.btn-info:hover {
  background: #138496;
  border-color: #117a8b;
}

.required-mark {
  color: #e74c3c;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.test-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.test-result h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
}

.response-status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  margin-bottom: 1rem;
}

.response-status.success {
  background: #d4edda;
  color: #155724;
}

.response-status.error {
  background: #f8d7da;
  color: #721c24;
}

.response-status.server-error {
  background: #f5c6cb;
  color: #721c24;
}

.response-body {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.4;
}

.response-note {
  font-size: 12px;
  color: #6c757d;
  font-weight: normal;
  margin-left: 10px;
}

.request-info,
.response-info {
  margin-bottom: 1.5rem;
}

.request-info h4,
.response-info h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.25rem;
}

.info-item {
  margin-bottom: 1rem;
}

.info-item strong {
  display: block;
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.request-body,
.request-headers,
.response-headers {
  background: #f8f9fa;
  color: #495057;
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid #e9ecef;
}

.error-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
}

.error-info h4 {
  color: #721c24;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #721c24;
  font-family: monospace;
  font-size: 13px;
}

.param-type {
  font-size: 11px;
  background: #e3f2fd;
  color: #1976d2;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 5px;
}

.optional-mark {
  color: #6c757d;
  font-size: 12px;
}

.param-description {
  font-size: 12px;
  color: #6c757d;
  margin-top: 0.25rem;
  font-style: italic;
}

.textarea {
  resize: vertical;
  min-height: 60px;
}

@media (max-width: 1024px) {
  .test-panel {
    grid-template-columns: 1fr;
  }
  
  .params-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    max-height: 300px;
  }
  
  .api-detail {
    padding: 1rem;
  }
  
  .params-grid {
    grid-template-columns: 1fr;
  }
  
  .test-actions {
    flex-direction: column;
  }
  
  .test-actions .btn {
    width: 100%;
  }
}
</style>