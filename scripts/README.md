# 日志管理脚本

本目录包含用于查看和管理服务器日志的实用脚本。

## 🚀 快速开始

### 实时监控今日日志（最常用）

```powershell
.\scripts\tail-logs.ps1
```

这会实时显示今天的日志，类似于 Linux 的 `tail -f`。

### 查看日志统计

```powershell
.\scripts\view-logs.ps1 -Stats
```

显示所有日志文件的统计信息，包括文件数量、大小等。

## 📋 view-logs.ps1 详细用法

这是一个功能强大的日志查看工具，支持多种选项。

### 基础用法

```powershell
# 查看今天的所有日志（最后50行）
.\scripts\view-logs.ps1

# 查看今天的错误日志
.\scripts\view-logs.ps1 -Type error

# 查看今天的警告日志
.\scripts\view-logs.ps1 -Type warn
```

### 查看历史日志

```powershell
# 查看昨天的日志
.\scripts\view-logs.ps1 -Date "2025-11-12"

# 查看特定日期的错误日志
.\scripts\view-logs.ps1 -Type error -Date "2025-11-12"
```

### 控制显示行数

```powershell
# 查看最后100行
.\scripts\view-logs.ps1 -Lines 100

# 查看最后10行错误日志
.\scripts\view-logs.ps1 -Type error -Lines 10
```

### 过滤和搜索

```powershell
# 搜索包含特定关键词的日志
.\scripts\view-logs.ps1 -Filter "HTTP Request"

# 搜索包含"error"关键词的日志
.\scripts\view-logs.ps1 -Filter "error"

# 组合使用：查看昨天包含"用户"的日志
.\scripts\view-logs.ps1 -Date "2025-11-12" -Filter "用户"
```

### 实时跟踪

```powershell
# 实时跟踪今天的所有日志
.\scripts\view-logs.ps1 -Follow

# 实时跟踪错误日志
.\scripts\view-logs.ps1 -Type error -Follow

# 实时跟踪并过滤特定关键词
.\scripts\view-logs.ps1 -Follow -Filter "HTTP Request"
```

### JSON 格式输出

```powershell
# 以原始JSON格式输出（便于进一步处理）
.\scripts\view-logs.ps1 -Json

# 导出到文件
.\scripts\view-logs.ps1 -Json -Lines 1000 > exported-logs.json
```

## 📊 实用示例

### 调试特定API

```powershell
# 实时监控包含特定API路径的请求
.\scripts\view-logs.ps1 -Follow -Filter "/api/v1/users"
```

### 查看最近的错误

```powershell
# 查看最近20条错误
.\scripts\view-logs.ps1 -Type error -Lines 20
```

### 分析昨天的日志

```powershell
# 先看统计
.\scripts\view-logs.ps1 -Stats

# 再看具体内容
.\scripts\view-logs.ps1 -Date "2025-11-12" -Lines 100

# 重点查看错误
.\scripts\view-logs.ps1 -Type error -Date "2025-11-12"
```

### 导出日志进行分析

```powershell
# 导出最近1000条日志为JSON
.\scripts\view-logs.ps1 -Json -Lines 1000 > analysis.json

# 使用PowerShell进行统计分析
$logs = Get-Content analysis.json | ConvertFrom-Json
$logs | Group-Object level | Select-Object Count, Name
```

## 🎯 日志类型说明

| Type 值 | 说明 |
|---------|------|
| `all` | 所有级别的日志（默认） |
| `error` | 仅错误日志 |
| `warn` | 警告日志 |
| `exception` | 未捕获的异常 |
| `rejection` | 未处理的 Promise rejection |

## 💡 小技巧

1. **开发时实时监控**：在一个终端运行 `.\scripts\tail-logs.ps1`，另一个终端运行服务器
2. **快速查看错误**：`.\scripts\view-logs.ps1 -Type error` 快速定位问题
3. **性能分析**：使用 `-Filter` 搜索 "HTTP Request" 查看请求耗时
4. **导出分析**：使用 `-Json` 导出日志，然后用其他工具分析

## 📖 更多文档

详细的日志系统文档请参考：`docs/LOGGING.md`
