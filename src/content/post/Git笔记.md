---
title: Git笔记
description: Git笔记（有更新）
publishDate: 2025-10-15
tags:
  - Git
ogImage: /social-card.avif
---
# Git 使用指南

## Git 基本概念

Git 是一个分布式版本控制系统。使用 `git init` 初始化后,会在当前文件夹下创建 `.git` 隐藏文件夹,其中包含:

- **暂存区(Stage)**: 临时存放待提交的文件
- **本地仓库区(Repository)**: 存储已提交的版本记录

---

## 核心工作流命令

### git add - 添加文件到暂存区

```bash
# 添加所有文件(最常用)
git add .

# 添加特定文件
git add index.html

# 添加整个目录
git add css/

# 添加所有js文件
git add *.js
```

### git commit - 提交到本地仓库

```bash
# 标准提交
git commit -m '提交说明'

# 快速提交(跳过add,仅对已追踪文件有效)
git commit -a -m '提交说明'

# 修改最近一次提交说明
git commit --amend -m '新的提交说明'
```

### git log - 查看提交历史

```bash
# 查看简洁版日志(推荐)
git log --oneline
```

---

## 版本管理

### git reset - 版本回退

```bash
# 回退到指定版本
git reset --hard 版本号
```

**重要提示**: 回退后如需查看完整版本历史(包括被回退的版本),使用:

```bash
git reflog
```

---

## 远程仓库操作

### git clone - 克隆远程仓库

```bash
git clone git@github.com:用户名/仓库名.git
```

### git remote - 管理远程仓库别名

```bash
# 添加远程仓库别名
git remote add origin git@github.com:用户名/仓库名.git

# 查看所有远程仓库
git remote -v
```

**说明**: 一个远程仓库可以设置多个别名

### git push - 推送到远程仓库

```bash
# 首次推送(建立跟踪关系)
git push -u origin main

# 后续推送
git push origin main

# 强制推送(慎用!)
git push -f origin main
```

**`-u` 参数详解**:

- 全称 `--set-upstream`
- 作用: 建立本地分支与远程分支的跟踪关系
- 使用后,后续可直接使用 `git push` 而无需指定分支名

### git pull - 拉取远程更新

```bash
git pull origin main
```

**最佳实践**: 在 `push` 前先执行 `pull`,避免冲突

---

## 分支管理

### git branch - 分支操作

```bash
# 查看本地分支
git branch

# 创建新分支
git branch dev

# 查看所有分支(含远程)
git branch -a

# 查看远程分支
git branch -r
```

### git checkout - 切换/创建分支

```bash
# 切换到已存在的分支
git checkout dev

# 创建并切换到新分支
git checkout -b dev
```

### git switch - 切换/创建分支 (推荐)

`git switch` 是 Git 2.23 版本引入的新命令,语义更清晰,推荐使用:

```bash
# 切换到已存在的分支
git switch dev

# 创建并切换到新分支
git switch -c dev
```

### 克隆后切换到远程分支

当你克隆一个仓库后,默认只在 `main`/`master` 分支。如果需要切换到其他远程分支工作:

```bash
# 1. 查看所有分支(包括远程分支)
git branch -a

# 输出示例:
# * main
#   remotes/origin/main
#   remotes/origin/dev
#   remotes/origin/feature-login

# 2. 基于远程分支创建本地分支并切换
git switch -c dev origin/dev

# 或使用 checkout 方式(旧写法)
git checkout -b dev origin/dev
```

**命令解析**:

- `git switch -c dev origin/dev`
  - `-c`: create,创建新分支
  - `dev`: 本地分支名
  - `origin/dev`: 远程分支名
  - 作用: 创建本地 `dev` 分支,并自动跟踪远程 `origin/dev` 分支

**实际应用场景**:

```bash
# 克隆项目
git clone git@github.com:用户名/项目名.git
cd 项目名

# 查看有哪些远程分支
git branch -a

# 切换到开发分支工作
git switch -c develop origin/develop

# 现在你就在本地 develop 分支了,并且已跟踪远程 develop 分支
```

---

## 常见问题解决

### 回车换行符警告

**错误提示**: `warning: LF will be replaced by CRLF`

**解决方法**:

```bash
git config --global core.autocrlf false
```

### push 失败: 远程仓库更新

**错误**: `error: failed to push some refs`

**原因**: 本地仓库落后于远程仓库

**解决**:

```bash
git pull origin main  # 先拉取合并
git push origin main  # 再推送
```

### 本地代码推送到已有远程仓库

**场景**: 本地有代码,想推送到 GitHub 上已经存在的仓库（而非新建仓库）

**解决步骤**:

```bash
# 1. 初始化本地仓库
git init

# 2. 添加远程仓库
git remote add origin git@github.com:用户名/已有仓库名.git

# 3. 拉取远程仓库内容
git pull origin main

# 4. 创建并切换到新分支（避免直接在主分支操作）
git switch -c feature-new

# 5. 添加本地文件
git add .

# 6. 提交
git commit -m '添加本地代码'

# 7. 推送到远程（使用 -u 建立跟踪关系）
git push -u origin feature-new
```

**注意事项**:

- 使用 `git switch -c` 创建新分支，现代Git推荐使用
- 使用 `-u` 参数在首次推送时建立本地分支与远程分支的跟踪关系
- 建议先创建新分支,避免直接覆盖主分支
- 推送后可在 GitHub 上创建 Pull Request 合并代码

---

## 完整工作流程

### 提交代码到 GitHub

```bash
# 1. 初始化仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交到本地仓库
git commit -m 'first commit'

# 4. 关联远程仓库
git remote add origin git@github.com:用户名/仓库名.git

# 5. 推送到远程(首次使用-u)
git push -u origin main
```

---

## Git 忽略文件

创建 `.gitignore` 文件来排除不需要版本控制的文件:

```gitignore
# 忽略单个文件
demo.txt

# 忽略指定路径文件
css/demo1.txt

# 忽略整个文件夹
node_modules/

# 忽略所有 .log 文件
*.log
```

---

## 高级操作: 同步上游仓库

### 场景一: 同步自己的 fork 仓库

恢复到上次提交到 GitHub 的状态:

```bash
git checkout main
git fetch origin
git merge origin/main
```

### 场景二: 同步原始上游仓库

适用于 fork 他人项目后,获取原作者的最新更新:

**首次设置** (只需执行一次):

```bash
git remote add upstream git@github.com:原作者/原仓库.git
```

**日常同步流程**:

```bash
# 1. 切换到主分支
git checkout main

# 2. 获取上游更新
git fetch upstream

# 3. 合并到本地
git merge upstream/main

# 4. 推送到自己的 fork
git push origin main
```

**验证上游仓库**:

```bash
git remote -v
```

---

## 快速参考

| 命令                             | 说明                 |
| -------------------------------- | -------------------- |
| `git add .`                    | 添加所有更改         |
| `git commit -m 'msg'`          | 提交更改             |
| `git push -u origin main`      | 首次推送             |
| `git pull`                     | 拉取更新             |
| `git branch -a`                | 查看所有分支(含远程) |
| `git switch -c dev origin/dev` | 切换到远程分支       |
| `git switch -c feature-new`    | 创建新分支           |
| `git log --oneline`            | 查看简洁日志         |
| `git reset --hard 版本号`      | 版本回退             |
| `git reflog`                   | 查看完整历史         |
