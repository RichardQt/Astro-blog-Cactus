---
title: Git笔记
description: Git笔记
publishDate: 2025-01-11
tags:
  - Git
ogImage: /social-card.avif
---

# Git笔记

## 基本介绍

git是一个分布式版本控制系统，在使用`git init` 初始化后，会在当前文件夹下创建一个.git隐藏文件，.git文件会包含两个区分别为**暂存区**和**本地仓库区**

## 常用指令

### 1、:1st_place_medal:git init 

**作用：初始化一个仓库，会在当前文件夹下生成一个隐藏文件`.git`，统筹当前文件夹下的所有文件**

### 2、git status

**作用：**查看当前文件下各文件状态，有两种颜色进行区分：**红色文件名**代表文件还没有进入暂存区，还是处于工作区，**绿色文件名**代表文件已经进入了暂存区

### 3、:1st_place_medal:git add  

**作用：文件名/目录名 将文件或者目录添加到暂存区，此时输入`git status`文件颜色会变绿**

- 将index.html添加到暂存区

  - **git add index.html**
- 将css目录下所有文件放进暂存区
  - **git add css**
- 将当前目录下所有的js文件放进暂存区
  - **git add *.js**

- 添加当前目录下所有文件
  - **git add .**

### 4、:1st_place_medal:git commit

**作用：将文件由暂存区添加到仓库区，并生成<u>版本号</u>，写法必须是`git commit -m 'text'`**

- 提交文件到暂存区
  - **git commit -m '提交说明'**
- 如果是一个已经暂存过的文件（代表文件已经被追踪过了），且再次修改可以直接使用
  - **git commit -a -m '提交说明'**
- 修改最近一次的提交说明
  - **git commit --amend -m '提交说明'**

### 5、git log

**作用：查看提交日志详细信息**

#### 5-1、:2nd_place_medal:git log --oneline

**作用：查看简洁的日志信息，且能看到提交的版本号**

### 6、:2nd_place_medal:git reset

**作用：版本回退，将代码恢复到已经提交的的某一次版本中**

- **git reset --hard 版本号** ---- 将代码回退到当前版本号的版本中

**注意**：

- **在使用`git reset` 命令后，版本会回退，若想撤销回退，使用`git log`是看不到回退之前的版本号的，此时，可以使用`git reflog`查看所有的版本信息**

### 6、git clone

**作用：**从远程仓库执行克隆命令，将该仓库下的所有文件克隆到本地 -----例如：`git clone git@github.com:RichardQt/PicBed.git`

### 7、:1st_place_medal:git push

**作用：将放在本地仓库中的文件提交到远程仓库中**

**命令一般为：git push 远程仓库的地址  分支名（默认为`master`）--------- 例如：`git push git@github.com:RichardQt/PicBed.git master `**

**注意**

:1st_place_medal: 但在`github`创建仓库时会默认创建一个别名`origin`，所以我们在提交代码时，可以直接使用`git push origin master`

- `-u` 参数可选
  - 将会关联到远程的master 分支上，以后就可以`git push`不指定参数了

### 8、:1st_place_medal:git pull

**作用：拉取命令，从远程仓库中拉取最新一次提交的内容，并保存到本地**

- **通常在`push`前，需要执行`pull`一次 ------【仅限在`github`创建项目，并将本地代码上传到远程仓库时使用】**

###  9、:2nd_place_medal:git remote

作用：每次push远程仓库时都需要带上远程仓库的地址，非常麻烦:sob:,我们可以给仓库设置一个别名来方便我们使用

- 给仓库设置一个别名

  - git remote add 仓库别名 远程仓库地址
  - eg : `git remote add lsr_Store git@github.com:RichardQt/PicBed.git`-----**意为：将远程仓库别名设置为`lsr_Store`**

### 10、:1st_place_medal:git checkout、 git branch 

**作用：切换分支、查看（当分支不存在时，便会自动创建）分支**	

- **`git checkout -b dev`----创建`dev`分支，然后切换到`dev`分支**
  - **`-b`参数表示创建并切换**:star:

## 常见报错

### 1、报错一

Git默认配置替换回车换行成统一的CRLF，我们只需要修改配置禁用该功能即可。

![image-20220717102224932](https://cdn.jsdelivr.net/gh/RichardQt/PicBed/note/202207171022009.png)

#### 解决方法

`git config --global core.autocrlf false`

## :+1: 提交到GitHub的基本流程

1. `git init`
2. `git add .`
3. `git commit -m 'first commit'`
4. `git remote add origin git@github.com:RichardQt/ScalaStudy.git`
5. `git push origin master`

**注意**：

如果在使用git push 命令时报错 `error: failed to push some refs to 'github.com:RichardQt/ScalaStudy.git'`，原因是**本地仓库和远程仓库内容不同**，本地仓库落后与远程仓库

通常是因为`github`中的`README.md`文件不在本地代码目录中。

![image-20220407100011702](https://cdn.jsdelivr.net/gh/RichardQt/PicBed/note/202204071000735.png)

所以我们需要执行`git pull --rebase origin master`将远程仓库的文件和本地仓库文件进行合并

## git忽视文件

在仓库中，有些文件是不想被git管理的，这样在提交文件时，一些特定的文件不会被提交上去

- **在仓库的根目录创建`.gitignore`的文件，文件名是固定的**
- **将不需要`git`管理的文件路径添加到`.gitignore`中**

**eg**:

```
创建一个.gitignore文件
#忽视demo.txt文件
demo.txt
#忽视css下的demo1.txt文件
css/demo1.txt
#忽视node_modules文件夹
node_modules
```

