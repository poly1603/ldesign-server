# Integration 模块 - 快速参考

> 第三方服务集成模块 - GitHub、GitLab、Docker、Jenkins

## 📋 概览

Integration 模块提供与主流开发工具和平台的集成能力，支持通过 REST API 调用这些服务。

**支持的服务：**
- ✅ GitHub (仓库、Issues、PR、Workflows)
- ✅ GitLab (项目、Pipelines、MR)
- ✅ Docker (镜像、容器管理)
- ✅ Jenkins (Job触发、状态查询)

**总端点数：** 28个

---

## 🔧 GitHub 集成

### 1. 获取仓库信息

```http
POST /api/integration/github/repo
Content-Type: application/json

{
  "owner": "username",
  "repo": "repository-name",
  "token": "ghp_xxx" // 可选
}
```

### 2. 获取 Issues 列表

```http
POST /api/integration/github/issues
Content-Type: application/json

{
  "owner": "username",
  "repo": "repository-name",
  "token": "ghp_xxx"
}
```

### 3. 创建 Issue

```http
POST /api/integration/github/issue/create
Content-Type: application/json

{
  "owner": "username",
  "repo": "repository-name",
  "title": "Bug: Something is broken",
  "body": "Detailed description...",
  "labels": ["bug", "priority-high"],
  "assignees": ["user1", "user2"],
  "token": "ghp_xxx"
}
```

### 4. 创建 Pull Request

```http
POST /api/integration/github/pr/create
Content-Type: application/json

{
  "owner": "username",
  "repo": "repository-name",
  "title": "Feature: Add new feature",
  "body": "PR description...",
  "head": "feature-branch",
  "base": "main",
  "token": "ghp_xxx"
}
```

### 5. 获取 Workflows 列表

```http
POST /api/integration/github/workflows
Content-Type: application/json

{
  "owner": "username",
  "repo": "repository-name",
  "token": "ghp_xxx"
}
```

### 6. 触发 Workflow

```http
POST /api/integration/github/workflow/trigger
Content-Type: application/json

{
  "owner": "username",
  "repo": "repository-name",
  "workflowFile": "ci.yml",
  "ref": "main",
  "inputs": {
    "environment": "production"
  },
  "token": "ghp_xxx"
}
```

---

## 🦊 GitLab 集成

### 1. 获取项目信息

```http
POST /api/integration/gitlab/project
Content-Type: application/json

{
  "projectId": "12345",
  "gitlabUrl": "https://gitlab.com", // 可选，默认 gitlab.com
  "token": "glpat-xxx" // 可选
}
```

### 2. 获取 Pipelines 列表

```http
POST /api/integration/gitlab/pipelines
Content-Type: application/json

{
  "projectId": "12345",
  "token": "glpat-xxx"
}
```

### 3. 触发 Pipeline

```http
POST /api/integration/gitlab/pipeline/trigger
Content-Type: application/json

{
  "projectId": "12345",
  "ref": "main",
  "variables": {
    "DEPLOY_ENV": "production"
  },
  "token": "glpat-xxx"
}
```

### 4. 创建 Merge Request

```http
POST /api/integration/gitlab/mr/create
Content-Type: application/json

{
  "projectId": "12345",
  "title": "Feature: New feature",
  "description": "MR description...",
  "sourceBranch": "feature-branch",
  "targetBranch": "main",
  "token": "glpat-xxx"
}
```

---

## 🐳 Docker 集成

### 1. 构建镜像

```http
POST /api/integration/docker/build
Content-Type: application/json

{
  "dockerfile": "./Dockerfile",
  "context": ".",
  "tag": "myapp:1.0.0",
  "buildArgs": {
    "NODE_VERSION": "18",
    "NPM_REGISTRY": "https://registry.npm.org"
  }
}
```

### 2. 运行容器

```http
POST /api/integration/docker/run
Content-Type: application/json

{
  "image": "myapp:1.0.0",
  "name": "myapp-container",
  "ports": ["3000:3000", "8080:8080"],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "volumes": ["/host/path:/container/path"],
  "detach": true
}
```

### 3. 容器操作

```http
POST /api/integration/docker/operation
Content-Type: application/json

{
  "container": "myapp-container",
  "operation": "stop" // stop | remove | logs
}
```

### 4. 列出容器

```http
GET /api/integration/docker/ps
```

### 5. 列出镜像

```http
GET /api/integration/docker/images
```

### 6. 推送镜像

```http
POST /api/integration/docker/push
Content-Type: application/json

{
  "image": "myapp",
  "tag": "1.0.0" // 可选
}
```

### 7. 拉取镜像

```http
POST /api/integration/docker/pull
Content-Type: application/json

{
  "image": "nginx",
  "tag": "alpine" // 可选
}
```

---

## 🔨 Jenkins 集成

### 1. 触发 Job

```http
POST /api/integration/jenkins/job/trigger
Content-Type: application/json

{
  "jenkinsUrl": "https://jenkins.example.com",
  "jobName": "build-job",
  "username": "admin", // 可选
  "token": "jenkins_token", // 可选
  "parameters": {
    "BRANCH": "main",
    "ENVIRONMENT": "production"
  }
}
```

### 2. 获取 Job 状态

```http
POST /api/integration/jenkins/job/status
Content-Type: application/json

{
  "jenkinsUrl": "https://jenkins.example.com",
  "jobName": "build-job",
  "buildNumber": 123, // 可选，不填则获取最新构建
  "username": "admin",
  "token": "jenkins_token"
}
```

### 3. 列出所有 Jobs

```http
GET /api/integration/jenkins/jobs?jenkinsUrl=https://jenkins.example.com&username=admin&token=xxx
```

---

## ⚙️ 配置管理

### 1. 保存配置

```http
POST /api/integration/config
Content-Type: application/json

{
  "type": "github", // github | gitlab | docker | jenkins
  "name": "my-github-config",
  "config": {
    "token": "ghp_xxx",
    "defaultOwner": "myorg"
  }
}
```

### 2. 获取配置列表

```http
POST /api/integration/config/list
Content-Type: application/json

{
  "type": "github" // 可选，不填返回所有配置
}
```

### 3. 获取指定配置

```http
GET /api/integration/config/github/my-github-config
```

### 4. 删除配置

```http
DELETE /api/integration/config/github/my-github-config
```

---

## 📝 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 返回数据
  },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "statusCode": 400
}
```

---

## 🔐 认证说明

### GitHub Token

- 创建路径：Settings → Developer settings → Personal access tokens
- 所需权限：`repo`, `workflow` (根据需要)
- 格式：`ghp_xxxxxxxxxxxx`

### GitLab Token

- 创建路径：Settings → Access Tokens
- 所需权限：`api`, `read_repository`, `write_repository`
- 格式：`glpat-xxxxxxxxxxxx`

### Jenkins Token

- 创建路径：User → Configure → API Token
- 认证方式：Basic Auth (username:token)

### Docker

- Docker命令直接通过本地Docker守护进程执行
- 需要本地安装Docker并确保Docker守护进程运行中

---

## 🎯 使用场景

### 场景 1: CI/CD 流程自动化

```javascript
// 1. 触发GitLab Pipeline
await fetch('http://localhost:3000/api/integration/gitlab/pipeline/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: '12345',
    ref: 'main',
    token: 'glpat-xxx'
  })
})

// 2. 构建Docker镜像
await fetch('http://localhost:3000/api/integration/docker/build', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dockerfile: './Dockerfile',
    context: '.',
    tag: 'myapp:latest'
  })
})

// 3. 推送镜像
await fetch('http://localhost:3000/api/integration/docker/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: 'myapp',
    tag: 'latest'
  })
})
```

### 场景 2: 自动化 Issue 管理

```javascript
// 1. 获取所有Issues
const response = await fetch('http://localhost:3000/api/integration/github/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    owner: 'myorg',
    repo: 'myrepo',
    token: 'ghp_xxx'
  })
})

// 2. 创建新Issue
await fetch('http://localhost:3000/api/integration/github/issue/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    owner: 'myorg',
    repo: 'myrepo',
    title: 'Auto-generated bug report',
    body: 'Details...',
    labels: ['bug', 'automated'],
    token: 'ghp_xxx'
  })
})
```

### 场景 3: 容器化部署

```javascript
// 1. 构建镜像
await fetch('http://localhost:3000/api/integration/docker/build', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dockerfile: './Dockerfile',
    context: '.',
    tag: 'app:v1.0.0'
  })
})

// 2. 停止旧容器
await fetch('http://localhost:3000/api/integration/docker/operation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    container: 'old-app',
    operation: 'stop'
  })
})

// 3. 启动新容器
await fetch('http://localhost:3000/api/integration/docker/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: 'app:v1.0.0',
    name: 'new-app',
    ports: ['3000:3000'],
    detach: true
  })
})
```

---

## 🐛 常见问题

### Q1: GitHub API 返回 401 错误？

A: 检查 Token 是否有效，确保 Token 有足够的权限。

### Q2: Docker 命令执行失败？

A: 确保本地 Docker 守护进程正在运行，可以通过 `docker ps` 测试。

### Q3: Jenkins 无法触发 Job？

A: 检查 Jenkins URL、Job 名称是否正确，用户是否有权限。

### Q4: GitLab Pipeline 触发失败？

A: 确认项目ID正确，Token 有 `api` 权限。

---

## 📚 相关文档

- [GitHub API 文档](https://docs.github.com/en/rest)
- [GitLab API 文档](https://docs.gitlab.com/ee/api/)
- [Docker API 文档](https://docs.docker.com/engine/api/)
- [Jenkins API 文档](https://www.jenkins.io/doc/book/using/remote-access-api/)

---

## 🎉 版本历史

### v1.0.0 (2025-01-05)

- ✨ 首次发布
- ✅ GitHub 集成完成
- ✅ GitLab 集成完成
- ✅ Docker 集成完成
- ✅ Jenkins 集成完成
- ✅ 配置管理功能

---

**更多信息请查看主文档：** [README_API.md](../README_API.md)
