# WebSocket 实时通信指南

> LDesign Tools API WebSocket 实时事件推送

## 📋 概览

WebSocket 提供实时双向通信，用于推送构建进度、测试结果、部署状态等实时事件。

**连接地址：** `ws://localhost:3000/events`

**协议：** Socket.IO

---

## 🚀 快速开始

### Node.js 客户端

```bash
npm install socket.io-client
```

```javascript
import { io } from 'socket.io-client'

// 连接到服务器
const socket = io('http://localhost:3000/events', {
  transports: ['websocket'],
})

// 连接成功
socket.on('connect', () => {
  console.log('✅ Connected to server')
  console.log('Client ID:', socket.id)
})

// 接收连接消息
socket.on('connection', (data) => {
  console.log('Connection info:', data)
})

// 接收所有事件
socket.on('event', (event) => {
  console.log('📨 Event received:', event)
  console.log('Type:', event.type)
  console.log('Data:', event.data)
  console.log('Timestamp:', new Date(event.timestamp))
})

// 断开连接
socket.on('disconnect', () => {
  console.log('❌ Disconnected from server')
})
```

### 浏览器客户端

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Client</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>WebSocket Events</h1>
  <div id="events"></div>

  <script>
    const socket = io('http://localhost:3000/events')
    
    socket.on('connect', () => {
      console.log('Connected:', socket.id)
    })
    
    socket.on('event', (event) => {
      const eventsDiv = document.getElementById('events')
      const eventDiv = document.createElement('div')
      eventDiv.innerHTML = `
        <p><strong>${event.type}</strong></p>
        <pre>${JSON.stringify(event.data, null, 2)}</pre>
        <hr>
      `
      eventsDiv.appendChild(eventDiv)
    })
  </script>
</body>
</html>
```

---

## 📡 事件类型

### 构建事件 (Build)

```javascript
// 订阅构建房间
socket.emit('joinRoom', { room: 'build:build-123' })

// 监听构建事件
socket.on('event', (event) => {
  switch (event.type) {
    case 'build:start':
      console.log('构建开始:', event.data)
      break
    case 'build:progress':
      console.log('构建进度:', event.data.progress + '%')
      break
    case 'build:complete':
      console.log('构建完成:', event.data)
      break
    case 'build:error':
      console.error('构建失败:', event.data.error)
      break
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'build:start' | 'build:progress' | 'build:complete' | 'build:error',
  data: {
    projectId: string
    buildId: string
    status: 'started' | 'building' | 'completed' | 'failed'
    progress?: number      // 0-100
    message?: string
    error?: string
    duration?: number      // 毫秒
    output?: string
  },
  timestamp: number,
  room: 'build:build-123'
}
```

---

### 测试事件 (Test)

```javascript
socket.emit('joinRoom', { room: 'test:test-456' })

socket.on('event', (event) => {
  if (event.type.startsWith('test:')) {
    console.log('测试事件:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'test:start' | 'test:progress' | 'test:complete' | 'test:error',
  data: {
    projectId: string
    testId: string
    status: 'started' | 'running' | 'completed' | 'failed'
    progress?: number
    passed?: number
    failed?: number
    total?: number
    coverage?: number
    message?: string
    error?: string
  },
  timestamp: number,
  room: 'test:test-456'
}
```

---

### 部署事件 (Deploy)

```javascript
socket.emit('joinRoom', { room: 'deploy:deploy-789' })

socket.on('event', (event) => {
  if (event.type.startsWith('deploy:')) {
    console.log('部署事件:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'deploy:start' | 'deploy:progress' | 'deploy:complete' | 'deploy:error',
  data: {
    projectId: string
    deployId: string
    environment: string
    status: 'started' | 'deploying' | 'completed' | 'failed'
    progress?: number
    message?: string
    error?: string
    url?: string
  },
  timestamp: number,
  room: 'deploy:deploy-789'
}
```

---

### 工作流事件 (Workflow)

```javascript
socket.emit('joinRoom', { room: 'workflow:exec-001' })

socket.on('event', (event) => {
  if (event.type.startsWith('workflow:')) {
    console.log('工作流事件:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'workflow:start' | 'workflow:step' | 'workflow:complete' | 'workflow:error',
  data: {
    workflowId: string
    executionId: string
    step?: string
    stepIndex?: number
    totalSteps?: number
    status: 'started' | 'running' | 'completed' | 'failed'
    progress?: number
    message?: string
    error?: string
    output?: any
  },
  timestamp: number,
  room: 'workflow:exec-001'
}
```

---

### 任务调度事件 (Job)

```javascript
socket.emit('joinRoom', { room: 'job:job-abc' })

socket.on('event', (event) => {
  if (event.type.startsWith('job:')) {
    console.log('任务事件:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'job:scheduled' | 'job:start' | 'job:complete' | 'job:error',
  data: {
    jobId: string
    executionId: string
    name: string
    status: 'scheduled' | 'started' | 'completed' | 'failed'
    scheduledTime?: Date
    startTime?: Date
    endTime?: Date
    message?: string
    error?: string
    output?: any
  },
  timestamp: number,
  room: 'job:job-abc'
}
```

---

### 文件操作事件 (File)

```javascript
socket.on('event', (event) => {
  if (event.type.startsWith('file:')) {
    console.log('文件操作:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'file:upload' | 'file:download' | 'file:compress' | 'file:extract' | 'file:complete',
  data: {
    operation: 'upload' | 'download' | 'compress' | 'extract' | 'copy' | 'move' | 'delete'
    path: string
    size?: number
    progress?: number
    status: 'started' | 'processing' | 'completed' | 'failed'
    message?: string
    error?: string
  },
  timestamp: number
}
```

---

### 监控事件 (Monitor)

```javascript
socket.emit('joinRoom', { room: 'monitor' })

socket.on('event', (event) => {
  if (event.type.startsWith('monitor:')) {
    console.log('监控事件:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'monitor:alert' | 'monitor:metric',
  data: {
    type: 'alert' | 'metric'
    name: string
    value?: number
    threshold?: number
    status: 'ok' | 'warning' | 'critical'
    message: string
    timestamp: number
  },
  timestamp: number,
  room: 'monitor'
}
```

---

### 集成事件 (Integration)

```javascript
socket.on('event', (event) => {
  if (event.type.startsWith('integration:')) {
    console.log('集成事件:', event)
  }
})
```

**事件数据结构：**
```typescript
{
  type: 'integration:github' | 'integration:gitlab' | 'integration:docker' | 'integration:jenkins',
  data: {
    platform: 'github' | 'gitlab' | 'docker' | 'jenkins'
    action: string
    status: 'started' | 'completed' | 'failed'
    message?: string
    error?: string
    data?: any
  },
  timestamp: number
}
```

---

## 🏠 房间 (Rooms)

使用房间来订阅特定资源的事件：

### 加入房间

```javascript
socket.emit('joinRoom', { room: 'build:build-123' })
socket.emit('joinRoom', { room: 'project' })
socket.emit('joinRoom', { room: 'monitor' })
```

### 离开房间

```javascript
socket.emit('leaveRoom', { room: 'build:build-123' })
```

### 房间类型

| 房间类型 | 格式 | 说明 |
|---------|------|------|
| `project` | `project` | 所有项目事件 |
| `project:{id}` | `project:proj-123` | 特定项目事件 |
| `build` | `build` | 所有构建事件 |
| `build:{id}` | `build:build-123` | 特定构建事件 |
| `test:{id}` | `test:test-456` | 特定测试事件 |
| `deploy:{id}` | `deploy:deploy-789` | 特定部署事件 |
| `workflow:{id}` | `workflow:exec-001` | 特定工作流事件 |
| `job:{id}` | `job:job-abc` | 特定任务事件 |
| `monitor` | `monitor` | 所有监控事件 |
| `system` | `system` | 所有系统事件 |
| `global` | `global` | 全局事件 |

---

## 🔧 实用方法

### Ping/Pong

```javascript
socket.emit('ping')

socket.on('pong', (data) => {
  console.log('Pong received:', data.timestamp)
})
```

### 断线重连

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason)
  
  if (reason === 'io server disconnect') {
    // 服务器断开连接，需要手动重连
    socket.connect()
  }
  // 其他情况会自动重连
})

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts')
})
```

---

## 📊 完整示例

### React Hook

```typescript
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketEvent {
  type: string
  data: any
  timestamp: number
  room?: string
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [events, setEvents] = useState<WebSocketEvent[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })

    newSocket.on('event', (event: WebSocketEvent) => {
      setEvents((prev) => [...prev, event])
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [url])

  const joinRoom = (room: string) => {
    socket?.emit('joinRoom', { room })
  }

  const leaveRoom = (room: string) => {
    socket?.emit('leaveRoom', { room })
  }

  return {
    socket,
    events,
    connected,
    joinRoom,
    leaveRoom,
  }
}

// 使用示例
function App() {
  const { events, connected, joinRoom } = useWebSocket('http://localhost:3000/events')

  useEffect(() => {
    if (connected) {
      joinRoom('build:build-123')
      joinRoom('monitor')
    }
  }, [connected])

  return (
    <div>
      <h1>WebSocket Events ({connected ? 'Connected' : 'Disconnected'})</h1>
      {events.map((event, index) => (
        <div key={index}>
          <h3>{event.type}</h3>
          <pre>{JSON.stringify(event.data, null, 2)}</pre>
        </div>
      ))}
    </div>
  )
}
```

---

## 🎯 使用场景

### 场景 1: 实时构建日志

```javascript
const socket = io('http://localhost:3000/events')

// 开始构建
const buildId = 'build-' + Date.now()
socket.emit('joinRoom', { room: `build:${buildId}` })

// 触发构建
fetch('http://localhost:3000/api/builder/build', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'my-project',
    buildId: buildId,
  })
})

// 监听构建进度
socket.on('event', (event) => {
  if (event.type === 'build:progress') {
    updateProgressBar(event.data.progress)
    appendLog(event.data.output)
  } else if (event.type === 'build:complete') {
    showSuccess(event.data.message)
  } else if (event.type === 'build:error') {
    showError(event.data.error)
  }
})
```

### 场景 2: 实时监控仪表板

```javascript
const socket = io('http://localhost:3000/events')
socket.emit('joinRoom', { room: 'monitor' })
socket.emit('joinRoom', { room: 'system' })

const metrics = {}

socket.on('event', (event) => {
  if (event.type === 'monitor:metric') {
    metrics[event.data.name] = event.data.value
    updateChart(metrics)
  } else if (event.type === 'monitor:alert') {
    if (event.data.status === 'critical') {
      showAlert(event.data.message)
    }
  }
})
```

### 场景 3: 工作流执行监控

```javascript
const socket = io('http://localhost:3000/events')
const executionId = 'exec-' + Date.now()

socket.emit('joinRoom', { room: `workflow:${executionId}` })

// 执行工作流
fetch('http://localhost:3000/api/workflow/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowId: 'my-workflow',
    executionId: executionId,
  })
})

// 监听步骤执行
socket.on('event', (event) => {
  if (event.type === 'workflow:step') {
    updateStepStatus(event.data.stepIndex, event.data.status)
    console.log(`Step ${event.data.step}: ${event.data.message}`)
  }
})
```

---

## 🐛 故障排查

### 连接失败

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error)
  // 检查服务器是否运行
  // 检查URL是否正确
  // 检查防火墙设置
})
```

### 重连配置

```javascript
const socket = io('http://localhost:3000/events', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
})
```

### 调试模式

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/events', {
  transports: ['websocket'],
})

// 启用调试日志
socket.onAny((eventName, ...args) => {
  console.log('Event:', eventName, args)
})

socket.onAnyOutgoing((eventName, ...args) => {
  console.log('Outgoing:', eventName, args)
})
```

---

## 📚 相关文档

- [Socket.IO 客户端文档](https://socket.io/docs/v4/client-api/)
- [API 文档](../README_API.md)

---

**Happy Coding! 🚀**
