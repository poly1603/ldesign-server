# 快速测试脚本
# 用于测试 API 接口是否正常

$ErrorActionPreference = "Continue"

Write-Host "🧪 LDesign Server API 测试脚本" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"
$tests = @(
    @{ Name = "健康检查"; Path = "/health"; Method = "GET" },
    @{ Name = "Node 管理器状态"; Path = "/node/manager/status"; Method = "GET" },
    @{ Name = "Node 可用管理器"; Path = "/node/managers"; Method = "GET" },
    @{ Name = "Node 版本列表"; Path = "/node/versions"; Method = "GET" },
    @{ Name = "Node 当前版本"; Path = "/node/current"; Method = "GET" },
    @{ Name = "Git 状态"; Path = "/git/status"; Method = "GET" },
    @{ Name = "Git 配置"; Path = "/git/config"; Method = "GET" },
    @{ Name = "项目列表"; Path = "/projects"; Method = "GET" },
    @{ Name = "系统目录选择器"; Path = "/system/directory-picker"; Method = "GET" }
)

$passed = 0
$failed = 0

# 先检查服务是否可用
Write-Host "🔍 检查服务连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  ✅ 服务已连接 (状态码: $($response.StatusCode))" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ❌ 服务未连接: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 提示：请确保服务已启动" -ForegroundColor Yellow
    Write-Host "   运行命令: pnpm start:dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 测试各个接口
foreach ($test in $tests) {
    Write-Host "测试: $($test.Name)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($test.Path)" -Method $test.Method -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "  ✅ 通过 (状态码: $($response.StatusCode))" -ForegroundColor Green
            
            # 尝试解析 JSON 响应
            try {
                $json = $response.Content | ConvertFrom-Json
                if ($json.success) {
                    Write-Host "    响应格式: ✅ 正确" -ForegroundColor Gray
                } else {
                    Write-Host "    警告: success 字段为 false" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "    响应格式: ⚠️ 无法解析 JSON" -ForegroundColor Yellow
            }
            
            $passed++
        } else {
            Write-Host "  ❌ 失败 (状态码: $($response.StatusCode))" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

Write-Host "📊 测试结果: $passed 通过, $failed 失败" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 所有接口测试通过！" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分接口测试失败，请检查服务日志" -ForegroundColor Yellow
}





















