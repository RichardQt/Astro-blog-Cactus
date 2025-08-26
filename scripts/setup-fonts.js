#!/usr/bin/env node

/**
 * 字体子集化配置脚本
 * 用于生成和准备字体文件上传到 GitHub CDN
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const FONT_CONFIG = {
  // Maple Mono NF CN 字体下载地址
  fontUrl: 'https://github.com/subframe7536/maple-font/releases/download/v7.0-beta34/MapleMono-NF-CN.zip',
  // 输出目录
  outputDir: './fonts-output',
  // CDN 基础路径
  cdnBase: 'https://cdn.jsdelivr.net/gh/RichardQt/Static_Resource_Acceleration@main/fonts/'
};

// 生成安装指南
async function generateInstructions() {
  const instructions = `
# 字体子集化配置指南

## 方案1：使用 cn-font-split（推荐）

### 步骤1：安装 cn-font-split
\`\`\`bash
npm install -g cn-font-split
\`\`\`

### 步骤2：下载 Maple Mono NF CN 字体
从以下地址下载字体：
https://github.com/subframe7536/maple-font/releases

下载 MapleMono-NF-CN.zip 并解压

### 步骤3：生成字体子集
\`\`\`bash
# 创建输出目录
mkdir fonts-output

# 运行字体分割（假设字体文件名为 MapleMono-NF-CN-Regular.ttf）
cn-font-split -i MapleMono-NF-CN-Regular.ttf -o ./fonts-output
\`\`\`

### 步骤4：上传到 GitHub
1. 克隆你的 CDN 仓库：
\`\`\`bash
git clone https://github.com/RichardQt/Static_Resource_Acceleration.git
cd Static_Resource_Acceleration
\`\`\`

2. 创建 fonts 目录并复制文件：
\`\`\`bash
mkdir -p fonts
cp ../fonts-output/* fonts/
\`\`\`

3. 提交并推送：
\`\`\`bash
git add .
git commit -m "Add font subset files"
git push
\`\`\`

## 方案2：使用完整字体（简单但文件较大）

### 步骤1：下载完整字体
下载 MapleMono-NF-CN-Regular.woff2

### 步骤2：上传到 GitHub
\`\`\`bash
git clone https://github.com/RichardQt/Static_Resource_Acceleration.git
cd Static_Resource_Acceleration
cp MapleMono-NF-CN-Regular.woff2 .
git add .
git commit -m "Add complete font file"
git push
\`\`\`

## 配置说明

### 使用子集化字体（方案1）
将 cn-font-split 生成的 result.css 引入到你的项目中。

### 使用完整字体（方案2）
在 CSS 中直接引用完整字体文件。

## CDN 加速选项

### jsDelivr（推荐，自动压缩和缓存）
\`\`\`
https://cdn.jsdelivr.net/gh/RichardQt/Static_Resource_Acceleration@main/字体文件名
\`\`\`

### Statically
\`\`\`
https://cdn.statically.io/gh/RichardQt/Static_Resource_Acceleration/main/字体文件名
\`\`\`

### GitHub Raw（不推荐，无CDN加速）
\`\`\`
https://raw.githubusercontent.com/RichardQt/Static_Resource_Acceleration/main/字体文件名
\`\`\`
`;

  await fs.writeFile('FONT_SETUP_GUIDE.md', instructions);
  console.log('✅ 生成了字体配置指南: FONT_SETUP_GUIDE.md');
}

// 生成更新后的 CSS 配置
async function generateCSSConfig() {
  const cssContent = `/* 
 * 字体配置文件
 * 根据你选择的方案，使用对应的配置
 */

/* ===== 方案1：使用字体子集化 ===== */
/* 
 * 如果使用 cn-font-split，请引入生成的 result.css：
 * @import url('https://cdn.jsdelivr.net/gh/RichardQt/Static_Resource_Acceleration@main/fonts/result.css');
 */

/* ===== 方案2：使用完整字体 ===== */
@font-face {
    font-family: 'Maple Mono NF CN';
    src: url('https://cdn.jsdelivr.net/gh/RichardQt/Static_Resource_Acceleration@main/MapleMono-NF-CN-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

/* 英文字体 */
@font-face {
    font-family: 'SiteLatin';
    src: url('https://cdn.jsdelivr.net/gh/RichardQt/Static_Resource_Acceleration@main/main.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

/* 应用字体 */
:root {
    --font-sans: 'SiteLatin', 'Maple Mono NF CN', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

body {
    font-family: var(--font-sans);
}
`;

  await fs.writeFile('fonts-config.css', cssContent);
  console.log('✅ 生成了 CSS 配置文件: fonts-config.css');
}

// 主函数
async function main() {
  console.log('🚀 开始生成字体配置文件...\n');
  
  // 确保 scripts 目录存在
  try {
    await fs.mkdir('scripts', { recursive: true });
  } catch (e) {
    // 忽略目录已存在的错误
  }
  
  await generateInstructions();
  await generateCSSConfig();
  
  console.log('\n📝 接下来的步骤：');
  console.log('1. 阅读 FONT_SETUP_GUIDE.md 了解详细步骤');
  console.log('2. 选择方案1（子集化）或方案2（完整字体）');
  console.log('3. 按照指南上传字体到你的 GitHub 仓库');
  console.log('4. 更新项目中的 CSS 配置');
}

main().catch(console.error);
