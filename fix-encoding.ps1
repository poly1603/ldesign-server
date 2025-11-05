# 批量修复文件编码为UTF-8 BOM
$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    try {
        # 读取文件内容（尝试多种编码）
        $content = $null
        $encodings = @(
            [System.Text.Encoding]::UTF8,
            [System.Text.Encoding]::Default,
            [System.Text.Encoding]::GetEncoding("GB2312")
        )
        
        foreach ($encoding in $encodings) {
            try {
                $content = [System.IO.File]::ReadAllText($file.FullName, $encoding)
                if ($content -and $content -notmatch '�') {
                    break
                }
            } catch {
                continue
            }
        }
        
        if ($content) {
            # 写回文件（UTF-8 with BOM）
            $utf8 = New-Object System.Text.UTF8Encoding $true
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8)
            Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "  Skipped: $($file.Name)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Error: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan
