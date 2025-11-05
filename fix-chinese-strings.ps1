# 修复Controller文件中的中文编码问题
# 策略：将所有ApiOperation中的中文summary替换为对应的英文

$replacements = @{
    '获取所有版本管理器状态' = 'Get all version managers status'
    '获取管理器状态列表' = 'Successfully got managers status list'
    '安装版本管理�?' = 'Install version manager'
    '成功安装管理�?' = 'Manager installed successfully'
    '获取已安装的 Node 版本列表' = 'Get installed Node versions list'
    '成功获取版本列�?' = 'Successfully got versions list'
    '安装指定版本的 Node' = 'Install specified Node version'
    '成功安装 Node 版本' = 'Node version installed successfully'
    '切换 Node 版本' = 'Switch Node version'
    '成功切换版本' = 'Version switched successfully'
    '卸载 Node 版本' = 'Uninstall Node version'
    '成功卸载版本' = 'Version uninstalled successfully'
    '获取所有可用的 Node 版本' = 'Get all available Node versions'
    '成功获取可用版本' = 'Successfully got available versions'
    '清理缓存' = 'Clean cache'
    '成功清理缓存' = 'Cache cleaned successfully'
}

# 获取所有controller文件
$files = Get-ChildItem -Path "src\modules" -Filter "*.controller.ts" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    try {
        # 使用UTF-8读取
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $modified = $false
        
        # 替换已知的问题字符串
        foreach ($key in $replacements.Keys) {
            if ($content -match [regex]::Escape($key)) {
                $content = $content -replace [regex]::Escape($key), $replacements[$key]
                $modified = $true
                Write-Host "  Replaced: $key" -ForegroundColor Yellow
            }
        }
        
        # 移除所有损坏的中文字符（显示为�的字符）
        if ($content -match '�') {
            # 简单策略：将包含�的字符串替换为通用描述
            $content = $content -replace "summary: '[^']*�[^']*'", "summary: 'API Operation'"
            $content = $content -replace "description: '[^']*�[^']*'", "description: 'API Description'"
            $modified = $true
            Write-Host "  Removed corrupted characters" -ForegroundColor Yellow
        }
        
        if ($modified) {
            # 写回文件（UTF-8 with BOM）
            $utf8BOM = New-Object System.Text.UTF8Encoding $true
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8BOM)
            Write-Host "  Saved: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "  No changes needed" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan
Write-Host "Please review the changes and run 'pnpm dev' to test." -ForegroundColor Yellow
