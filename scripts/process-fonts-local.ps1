# PowerShell 脚本：使用本地 cn-font-split 处理字体子集化

Write-Host "🚀 开始字体处理流程..." -ForegroundColor Green

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

# 运行字体分割（使用本地安装的 cn-font-split）
Write-Host "`n🔪 开始字体子集化..." -ForegroundColor Yellow
$outputDir = "output"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# 返回项目根目录运行 cn-font-split
$currentPath = Get-Location
$ttfFullPath = $ttfFile.FullName
$outputFullPath = Join-Path $currentPath $outputDir

Set-Location ..
Write-Host "执行命令: pnpm exec cn-font-split -i `"$ttfFullPath`" -o `"$outputFullPath`" --reporter=json" -ForegroundColor Cyan

& pnpm exec cn-font-split -i "$ttfFullPath" -o "$outputFullPath" --reporter=json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 字体子集化成功!" -ForegroundColor Green
} else {
    Write-Host "⚠️ 字体子集化可能遇到问题，请检查输出" -ForegroundColor Yellow
}

# 检查输出
Set-Location $workDir
$outputFiles = Get-ChildItem -Path $outputDir
Write-Host "`n📊 生成的文件:" -ForegroundColor Cyan
$totalSize = 0
$outputFiles | ForEach-Object {
    $sizeKB = [math]::Round($_.Length/1024, 2)
    $totalSize += $_.Length
    $fileName = $_.Name
    Write-Host ("  - {0} ({1} KB)" -f $fileName, $sizeKB) -ForegroundColor White
}
$totalSizeMB = [math]::Round($totalSize/1024/1024, 2)
Write-Host ("`n  Total Size: {0} MB" -f $totalSizeMB) -ForegroundColor Yellow

# 准备上传
Write-Host "`n📤 准备上传到 GitHub..." -ForegroundColor Yellow
$instructions = @"

Next Steps:

1. Clone your CDN repository (if not already cloned):
   git clone https://github.com/RichardQt/Static_Resource_Acceleration.git
   
2. Copy font files to repository:
   Copy all files from font-workspace/output/ to Static_Resource_Acceleration/fonts/
   
3. Commit and push:
   cd Static_Resource_Acceleration
   git add .
   git commit -m "Add Chinese font subset files"
   git push

4. Wait a few minutes for CDN cache to take effect

5. Update your project configuration (src/styles/global.css)
   Uncomment line 12 to enable font subsetting

"@
Write-Host $instructions -ForegroundColor Cyan

Set-Location ..
Write-Host "✅ 脚本执行完成! 生成的文件在 font-workspace/output 目录" -ForegroundColor Green
