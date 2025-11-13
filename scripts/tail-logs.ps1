# 快速查看今日日志
# 使用方法: .\scripts\tail-logs.ps1

Write-Host "`n============ 今日日志实时监控 ============`n" -ForegroundColor Cyan

$today = Get-Date -Format "yyyy-MM-dd"
$logFile = Join-Path $PSScriptRoot "..\logs\application-$today.log"

if (-not (Test-Path $logFile)) {
    Write-Host "今日日志文件不存在，服务器可能尚未启动" -ForegroundColor Yellow
    Write-Host "日志文件路径: $logFile`n" -ForegroundColor Gray
    exit
}

Write-Host "监控文件: $logFile" -ForegroundColor Green
Write-Host "按 Ctrl+C 停止监控`n" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

# 先显示最后10行
Get-Content $logFile -Tail 10 | ForEach-Object {
    try {
        $obj = $_ | ConvertFrom-Json
        $color = switch ($obj.level) {
            "error" { "Red" }
            "warn"  { "Yellow" }
            "info"  { "Green" }
            "debug" { "Gray" }
            default { "White" }
        }
        
        $timestamp = $obj.timestamp
        $level = $obj.level.ToUpper().PadRight(5)
        $context = if ($obj.context) { "[$($obj.context)]" } else { "" }
        $message = $obj.message
        
        Write-Host "[$timestamp]" -NoNewline -ForegroundColor Cyan
        Write-Host " [$level]" -NoNewline -ForegroundColor $color
        if ($context) {
            Write-Host " $context" -NoNewline -ForegroundColor Magenta
        }
        Write-Host " $message" -ForegroundColor White
    } catch {
        Write-Host $_ -ForegroundColor Gray
    }
}

Write-Host "`n--- 实时监控中 ---`n" -ForegroundColor Yellow

# 实时跟踪
Get-Content $logFile -Wait -Tail 0 | ForEach-Object {
    try {
        $obj = $_ | ConvertFrom-Json
        $color = switch ($obj.level) {
            "error" { "Red" }
            "warn"  { "Yellow" }
            "info"  { "Green" }
            "debug" { "Gray" }
            default { "White" }
        }
        
        $timestamp = $obj.timestamp
        $level = $obj.level.ToUpper().PadRight(5)
        $context = if ($obj.context) { "[$($obj.context)]" } else { "" }
        $message = $obj.message
        
        Write-Host "[$timestamp]" -NoNewline -ForegroundColor Cyan
        Write-Host " [$level]" -NoNewline -ForegroundColor $color
        if ($context) {
            Write-Host " $context" -NoNewline -ForegroundColor Magenta
        }
        Write-Host " $message" -ForegroundColor White
        
        # 如果是错误，显示堆栈跟踪
        if ($obj.level -eq "error" -and $obj.stack) {
            Write-Host "  Stack: $($obj.stack)" -ForegroundColor DarkRed
        }
    } catch {
        Write-Host $_ -ForegroundColor Gray
    }
}
