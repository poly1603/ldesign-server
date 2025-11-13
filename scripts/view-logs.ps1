# 日志查看工具
# 使用方法: .\scripts\view-logs.ps1 [选项]

param(
    [string]$Type = "all",           # 日志类型: all, error, warn, exception, rejection
    [int]$Lines = 50,                # 显示最后N行
    [string]$Date = "",              # 指定日期，格式: YYYY-MM-DD
    [switch]$Follow,                 # 实时跟踪日志
    [switch]$Json,                   # 以JSON格式输出
    [string]$Filter = "",            # 过滤关键词
    [switch]$Stats                   # 显示日志统计
)

$LogsDir = Join-Path $PSScriptRoot "..\logs"

function Get-LogFileName {
    param($Type, $Date)
    
    if (-not $Date) {
        $Date = Get-Date -Format "yyyy-MM-dd"
    }
    
    switch ($Type) {
        "all"       { return Join-Path $LogsDir "application-$Date.log" }
        "error"     { return Join-Path $LogsDir "errors\error-$Date.log" }
        "warn"      { return Join-Path $LogsDir "warnings\warn-$Date.log" }
        "exception" { return Join-Path $LogsDir "exceptions\exceptions-$Date.log" }
        "rejection" { return Join-Path $LogsDir "rejections\rejections-$Date.log" }
        default     { return Join-Path $LogsDir "application-$Date.log" }
    }
}

function Show-LogStats {
    Write-Host "`n========== 日志统计 ==========" -ForegroundColor Cyan
    
    # 获取所有日志文件
    $allFiles = Get-ChildItem -Path $LogsDir -Recurse -File -Filter "*.log"
    
    Write-Host "`n总日志文件数: $($allFiles.Count)" -ForegroundColor Green
    Write-Host "总大小: $([math]::Round(($allFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB`n" -ForegroundColor Green
    
    # 按类型统计
    $categories = @{
        "应用日志" = "application-*.log"
        "错误日志" = "error-*.log"
        "警告日志" = "warn-*.log"
        "异常日志" = "exceptions-*.log"
        "拒绝日志" = "rejections-*.log"
    }
    
    foreach ($cat in $categories.GetEnumerator()) {
        $files = Get-ChildItem -Path $LogsDir -Recurse -File -Filter $cat.Value
        if ($files) {
            $size = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1KB, 2)
            $count = $files.Count
            Write-Host "$($cat.Key): $count 文件, ${size} KB" -ForegroundColor Yellow
        }
    }
    
    # 最新日志文件
    Write-Host "`n最新日志文件:" -ForegroundColor Cyan
    $allFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        $relPath = $_.FullName -replace [regex]::Escape($LogsDir), "logs"
        Write-Host "  $relPath - $($_.LastWriteTime)" -ForegroundColor Gray
    }
    
    Write-Host "`n==============================`n" -ForegroundColor Cyan
}

function Show-Logs {
    param($FilePath, $Lines, $Follow, $Filter)
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "日志文件不存在: $FilePath" -ForegroundColor Red
        Write-Host "可能该日期没有产生日志，或服务器未启动过" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n正在查看: $FilePath" -ForegroundColor Cyan
    Write-Host "文件大小: $([math]::Round((Get-Item $FilePath).Length / 1KB, 2)) KB`n" -ForegroundColor Gray
    
    if ($Follow) {
        Write-Host "实时跟踪模式（按 Ctrl+C 退出）" -ForegroundColor Yellow
        if ($Filter) {
            Get-Content $FilePath -Tail $Lines -Wait | Where-Object { $_ -like "*$Filter*" }
        } else {
            Get-Content $FilePath -Tail $Lines -Wait
        }
    } else {
        $content = Get-Content $FilePath -Tail $Lines
        
        if ($Filter) {
            $content = $content | Where-Object { $_ -like "*$Filter*" }
        }
        
        if ($Json) {
            # JSON 格式化输出
            $content | ForEach-Object {
                try {
                    $obj = $_ | ConvertFrom-Json
                    $obj | ConvertTo-Json -Depth 10
                } catch {
                    $_
                }
            }
        } else {
            # 美化输出
            $content | ForEach-Object {
                try {
                    $obj = $_ | ConvertFrom-Json
                    $color = switch ($obj.level) {
                        "error" { "Red" }
                        "warn"  { "Yellow" }
                        "info"  { "Green" }
                        "debug" { "Gray" }
                        default { "White" }
                    }
                    
                    Write-Host "[$($obj.timestamp)] " -NoNewline -ForegroundColor Cyan
                    Write-Host "[$($obj.level.ToUpper())] " -NoNewline -ForegroundColor $color
                    if ($obj.context) {
                        Write-Host "[$($obj.context)] " -NoNewline -ForegroundColor Magenta
                    }
                    Write-Host $obj.message -ForegroundColor White
                    
                    # 显示额外信息
                    $extraInfo = $obj.PSObject.Properties | Where-Object { 
                        $_.Name -notin @('timestamp', 'level', 'context', 'message') 
                    }
                    if ($extraInfo) {
                        $extraInfo | ForEach-Object {
                            Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor DarkGray
                        }
                    }
                } catch {
                    # 如果不是JSON，直接输出
                    Write-Host $_
                }
            }
        }
    }
}

# 主逻辑
if ($Stats) {
    Show-LogStats
} else {
    $logFile = Get-LogFileName -Type $Type -Date $Date
    Show-Logs -FilePath $logFile -Lines $Lines -Follow:$Follow -Filter $Filter
}
