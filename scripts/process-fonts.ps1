# PowerShell 脚本：自动处理字体子集化
# 使用前请确保安装了 Node.js 和 npm

Write-Host "🚀 开始字体处理流程..." -ForegroundColor Green

# 检查是否安装了 cn-font-split
Write-Host "`n📦 检查 cn-font-split 安装状态..." -ForegroundColor Yellow
$cnFontSplitInstalled = npm list -g cn-font-split 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "未安装 cn-font-split，正在安装..." -ForegroundColor Yellow
    npm install -g cn-font-split
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 安装失败，请手动安装: npm install -g cn-font-split" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ cn-font-split 安装成功!" -ForegroundColor Green
} else {
    Write-Host "✅ cn-font-split 已安装" -ForegroundColor Green
}

# 创建工作目录
$workDir = "font-workspace"
if (Test-Path $workDir) {
    Write-Host "`n🗑️ 清理旧的工作目录..." -ForegroundColor Yellow
    Remove-Item -Path $workDir -Recurse -Force
}
New-Item -ItemType Directory -Path $workDir | Out-Null
Set-Location $workDir

# 下载字体
Write-Host "`n📥 下载 Maple Mono NF CN 字体..." -ForegroundColor Yellow
$fontUrl = "https://github.com/subframe7536/maple-font/releases/download/v7.0-beta34/MapleMono-NF-CN.zip"
$fontZip = "MapleMono-NF-CN.zip"

try {
    Invoke-WebRequest -Uri $fontUrl -OutFile $fontZip
    Write-Host "✅ 字体下载成功!" -ForegroundColor Green
} catch {
    Write-Host "❌ 字体下载失败，请手动下载: $fontUrl" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 解压字体
Write-Host "`n📦 解压字体文件..." -ForegroundColor Yellow
Expand-Archive -Path $fontZip -DestinationPath "." -Force
Write-Host "✅ 解压成功!" -ForegroundColor Green

# 查找 TTF 文件
$ttfFiles = Get-ChildItem -Path . -Filter "*.ttf" -Recurse
if ($ttfFiles.Count -eq 0) {
    Write-Host "❌ 未找到 TTF 文件" -ForegroundColor Red
    Set-Location ..
    exit 1
}

$ttfFile = $ttfFiles[0]
Write-Host "✅ 找到字体文件: $($ttfFile.Name)" -ForegroundColor Green

# 运行字体分割
Write-Host "`n🔪 开始字体子集化..." -ForegroundColor Yellow
$outputDir = "output"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

& cn-font-split -i $ttfFile.FullName -o $outputDir --reporter=json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 字体子集化成功!" -ForegroundColor Green
} else {
    Write-Host "⚠️ 字体子集化可能遇到问题，请检查输出" -ForegroundColor Yellow
}

# 检查输出
$outputFiles = Get-ChildItem -Path $outputDir
Write-Host "`n📊 生成的文件:" -ForegroundColor Cyan
$outputFiles | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1024, 2)) KB)"
}

# 准备上传
Write-Host "`n📤 准备上传到 GitHub..." -ForegroundColor Yellow
Write-Host @"

接下来的步骤：

1. 打开 Git Bash 或命令行
2. 克隆你的 CDN 仓库：
   git clone https://github.com/RichardQt/Static_Resource_Acceleration.git
   
3. 复制字体文件：
   cp -r font-workspace/output/* Static_Resource_Acceleration/fonts/
   
4. 提交并推送：
   cd Static_Resource_Acceleration
   git add .
   git commit -m "Add Chinese font subset files"
   git push

5. 等待几分钟让 CDN 缓存生效

6. 更新你的项目配置
"@ -ForegroundColor Cyan

Set-Location ..
Write-Host "`n✅ 脚本执行完成!" -ForegroundColor Green
