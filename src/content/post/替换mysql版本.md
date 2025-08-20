---
title: 替换MySQL版本
description: 替换MySQL版本
publishDate: 2025-01-11
tags:
  - 考研
ogImage: /social-card.avif
---

# 替换MySQL版本

## 第一步：到官网下载MySQL5.8的包

传送门：[MySQL官网](https://dev.mysql.com/downloads/)

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440031.png)

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440369.png)

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440672.png)

## 第二步：新老版本替换

1. 清空D:/PHPstudy/PHPTutorial/MySQL/文件夹，并把刚下载的MySQL5.7的包解压、解压下的文件拷贝到D:/PHPstudy/PHPTutorial/MySQL/文件夹下
2. 刚下载的包里面是没有my.ini配置文件的，所以你可以新建一个，也可以把之前的my.ini复制到D:/PHPstudy/PHPTutorial/MySQL/文件夹下

新建配置文件，格式大概是这样

```
[mysqld]  port=3306  skip-grant-tables  basedir="D:/PHPStudy/PHPTutorial/MySQL/"  datadir="D:/PHPStudy/PHPTutorial/MySQL/data/"  sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
```

注意`basedir`和`datadir`的路径要准确，不能错

这里有一个小坑，如果你用的是以前的配置文件

```
如果你配置文件中有`table_cache`和`innodb_additional_mem_pool_size`有这两个配置的话，需要把`table_cache`改为`table_open_cache`,`innodb_additional_mem_pool_size`前面加`#`号注释掉
```

## 第三步：安装MySQL服务

用cmd命令行，在`D:/PHPStudy/PHPTutorial/MySQL/bin/`执行命令`mysqld install;`

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440098.png)

初始化MySQL命令：`mysqld --install;`

启动MySQL服务命令：`net start mysql;`

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440465.png)

注意：若无法启动，或者启动后库内没有mysql表，则运行：
`mysqld --initialize-insecure --initialize-insecure --user=mysql;`

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440798.png)

## 第四步：修改MySQL密码

输入`mysql -uroot -p`执行,会让你输入密码，现在没有设置密码，回车就行

然后选择数据库`use mysql;`，执行`update user set authentication_string=password('输入你的密码') where user='root';`

然后在执行`flush privileges;`

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440973.png)

## 第五步：PHPstudy控制MySQL启动

如果用PHPstudy无法启动MySQL

![img](https://cdn.mengze.vip/gh/RichardQt/PicBed/note/202206171440522.png)

检查服务是否启动，打开`任务管理器=>服务`，查找MySQL服务，如果只有一个MySQL服务就手动的启动，如果有两个MySQL服务，如`MySQL`和`MySQLa`,就需要删除一个服务，在`D:/PHPStudy/PHPTutorial/MySQL/bin/`执行`sc delete mysql`就好了。

## 附录

### my.ini文件

```ini
#  power by phpStudy  2014  www.phpStudy.net  官网下载最新版

[client]
port=3306
[mysql]
default-character-set=utf8

[mysqld]
port=3306
basedir="D:/phpStudy/MySQL/"
datadir="D:/phpStudy/MySQL/data/"
character-set-server=utf8
default-storage-engine=INNODB
#支持 INNODB 引擎模式。修改为　default-storage-engine=INNODB　即可。
#如果 INNODB 模式如果不能启动，删除data目录下ib开头的日志文件重新启动。

sql-mode="NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
max_connections=512

query_cache_size=0
table_open_cache=256
tmp_table_size=18M

thread_cache_size=8
myisam_max_sort_file_size=64G
myisam_sort_buffer_size=35M
key_buffer_size=25M
read_buffer_size=64K
read_rnd_buffer_size=256K
sort_buffer_size=256K

#innodb_additional_mem_pool_size=2M

innodb_flush_log_at_trx_commit=1
innodb_log_buffer_size=1M

innodb_buffer_pool_size=47M
innodb_log_file_size=24M
innodb_thread_concurrency=8


show_compatibility_56 = ON
performance_schema

```

