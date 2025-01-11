---
title: Linux相关
description: Linux相关
publishDate: 2025-01-11
tags:
  - linux
ogImage: /social-card.avif
---

# docker

## 启动

- `service docker start` -- 启动docker

## 镜像相关

- `docker images`       --查看本地镜像
- `docker search xx`      --搜索镜像(联网)
- `docker pull 镜像名:版本号`     --下载镜像，若不带版本号则默认latest
- `docker rmi  对应镜像id`     --删除本地镜像，id可通过查看命令获得
- `docker rmi $(docker images -q)`    --**一次性删除所有本地镜像**

## 容器相关

- `docker run  `      --创建容器

  - -i **--创建交互式环境**

  - -t **--重新分配一个伪终端**

    - **注意：-i一般与-t一块使用**

  - -d **--后台运行容器，并返回容器ID**

  - –v  **--挂载数据卷，将宿主机里的路径映射到容器的路径，即可以在容器里的路径就可以访问到宿主机该路径上的相关文件**

    - **常见使用格式**：

      - `docker run … -v 宿主机目录(文件):容器目录(文件)`

      - eg: `docker run -id --name 容器名 镜像名 -v /home/lsr/project:/home/lsr/project`

      - **注意：**

        **1.必须是绝对路径 2.若目录不存在会自动创建  3.可以挂载多个数据卷**

  - -p **--映射端口，将容器里的端口映射到宿主机上的端口，即可以通过宿主机的端口就可以访问到容器的端口**

    - **常见使用格式**：
      - `docker run … -v 宿主机端口:容器端口`

  - **简单常用组合：**

    - `docker run -id --name `容器名 镜像名和版本......   **--创建交互式环境，使容器后台运行，并返回容器id**
      - 使用此命令后，需使用`docker exec -it 容器名 /bin/bash`  --进入之前创建好的容器
      - 以id创建的容器通过exit退出后不会停止运行，一般称为守护式容器
    - `docker run -itd --name `容器名 镜像名和版本 /bin/bash   --一般等同于docker -id ...命令
      - 也需使用`docker exec -it 容器名 /bin/bash`  --进入之前创建好的容器

- `docker ps`        查看运行中容器

  - `docker  ps -a`        **--查看所有容器，包括没有运行的**

- `docker exec –it 容器名 /bin/bash`  **--进入容器**

- `docker stop 容器名  `    **--关闭容器**

- `docker rm 容器id(可只写前四位)或容器名 `   **--删除容器**

- `docker rm `docker ps -aq``     **--删除所有容器(开启的容器无法被删除)**

- `docker inspect 容器名   `   **--查看容器信息(信息比较多)**

## docker镜像导入导出

- `docker commit 容器名 镜像名:版本号   `  
  - **--容器转镜像**

- `docker save –o /路径/xxx.tar  镜像名称:版本号  `
  -  **--镜像转压缩文件**

- `docker load –i  /路径/xxx.tar`
  - **--压缩文件导入为镜像**

## docker安装mysql

1. `docker pull mysql`  --拉取mysql，可指定版本 eg: docker pull mysql:5.7
2. `docker run -id  -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 --name mysql1 mysql`  --创建mysql容器，并添加了3306端口映射
3. `docker ps` --查看是否启动
4. `docker -it 容器名 /bin/bash`

## docker 安装code-server（云端Vscode）

```bash
docker run -itd --name coder codercom/code-server:latest -p 10064:8080 -v /home/lsr/project:/home/lsr/project -e PASSWORD=123456  --auth password
```



# linux下安装python

```bash
yum install openssl-devel bzip2-devel expat-devel gdbm-devel readline-devel sqlite-devel
```

到python官网找到下载路径, 用wget下载

```bash
wget https://www.python.org/ftp/python/3.5.3/Python-3.5.3.tgz
```

解压tgz包

```bash
tar -zxvf Python-3.5.3.tgz
```

把python移到/usr/local下面

```bash
mv Python-3.5.3 /usr/local
```

删除旧版本的python依赖

```bash
ll /usr/bin | grep python
rm -rf /usr/bin/python
```

进入python目录

```bash
cd /usr/local/Python-3.5.3/
```

配置

```bash
./configure
```

编译 make

```bash
make
```

编译，安装

```bash
make install
```

删除旧的软链接，创建新的软链接到最新的python

```bash
rm -rf /usr/bin/python
ln -s /usr/local/bin/python /usr/bin/python
python -V
```


# ubuntu安装nodejs

**在docker容器内安装nodejs，前提需要保证docker容器需要有网（宿主机有网）**

```apl
curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -
```

```cpp
sudo apt-get install -y nodejs
```

# 解决Ubuntu突然上不了网

```cpp
sudo rm /etc/resolv.conf

sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'

sudo bash -c 'echo "[network]" > /etc/wsl.conf'

sudo bash -c 'echo "generateResolvConf = false" >> /etc/wsl.conf'

sudo chattr +i /etc/resolv.conf
```

# 解决Ubuntu长时间断网

Ubuntu系统会每隔一段时间 lcp-echo-interval=30 （30s）检查是否有echo-reply信号，如果长时间不使用，连续 lcp-echo-failure=4 次都没有信号，Ubuntu就认为网络出现了问题，就会自行断开网络。

```
sudo vi /etc/ppp/options
```

- 找到`lcp-echo-interval `和 `lcp-echo-failure`把值改大


- 再重启网络


```
sudo service network-manager restart
```



# 清除buff/cache(解决内存占用问题)

## 手动清除

```cpp
> sync
> echo 1 > /proc/sys/vm/drop_caches
> echo 2 > /proc/sys/vm/drop_caches
> echo 3 > /proc/sys/vm/drop_caches
```

- `sync`：将所有未写的系统缓冲区写到磁盘中，包含已修改的i-node、已延迟的块I/O和读写映射文件
- `echo 1 > /proc/sys/vm/drop_caches`：清除page cache
- `echo 2 > /proc/sys/vm/drop_caches`：清除回收slab分配器中的对象（包括目录项缓存和inode缓存）。slab分配器是内核中管理内存的一种机制，其中很多缓存数据实现都是用的pagecache。
- `echo 3 > /proc/sys/vm/drop_caches`：清除pagecache和slab分配器中的缓存对象。
  - /proc/sys/vm/drop_caches的值,默认为0


## 定时任务清除

```cpp
root:> vim clean.sh
#!/bin/bash#每两小时清除一次缓存
echo "开始清除缓存"
sync;sync;sync #写入硬盘，防止数据丢失
sleep 20#延迟20秒
echo 1 > /proc/sys/vm/drop_caches
echo 2 > /proc/sys/vm/drop_caches
echo 3 > /proc/sys/vm/drop_caches
root:> chmod +x clean.sh
root:> crontab -e
# 每两小时执行一次
0 */2 * * * /opt/clean.sh
```

## 设置crond启动以及开机自启

```cpp
systemctl start crond.service
systemctl enable crond.service
#centos写法，且需要安装相关包
```

# 查看linux内存占用

- `top  `**--像windows任务管理器动态查看内存**

- `free -h `**以GB查看内存占用**
- `free -m `**以MB查看内存占用**

# 类似于find查找工具--fd

- [下载地址](https://github.com/sharkdp/fd/releases)
- 常见用法（**在Linux中命令变为fdfind**）：
  - `fd xxx（文件名）` **--:point_up: 查找<u>*当前路径下*</u>往后的相关文件** 	
    - 注：**默认 fd 是匹配智能大小写的，如果你搜索的内容是包含大写会按照大小写精确匹配，但如果是小写会忽略大小写匹配**
  - `fd -H xxx `  **--查找<u>*当前路径下*</u>往后相关文件（包含隐藏文件）**
  - `fd -a  xxx ` **--查找<u>*当前路径下*</u>相关文件，并返回其绝对路径**
  - `fd -l xxx`  **--返回查找的文件【<u>*当前路径下*</u>】列表详情，类似于ls -l （仅在linux系统中使用）**

# 发送API的工具（CLI工具）

## curl命令

- **无需安装**

- 常见选项

  | 参数 | 内容                                                         | 格式                                                         |
  | ---- | ------------------------------------------------------------ | ------------------------------------------------------------ |
  | -H   | 请求头                                                       | 添加`"Content-Type: application/json"`请求头或者`Accept-Language: en-US`请求头 |
  | -d   | 用于发送 POST 请求的数据体【使用-d后就可以省略` -XPOST`】<br/>默认发起`Content-Type : application/x-www-form-urlencoded`请求头 | `'{"id": "001", "name":"张三", "phone":"13099999999"}' `或者`'id=001&name=张三&phone=13099999999'`<br/>**注意：此处的数据并不是json格式，仅仅是长得像，如果要发送json格式的请求数据，需要加上请求头`"Content-Type: application/json"`** |
  | -X   | 请求协议                                                     | `POST、GET、DELETE、PUSH、PUT、OPTIONS、HEAD`                |
  | -o   | 参数将服务器的回应保存成文件                                 |                                                              |

- 常见命令
  - `CURL url ` **--默认发起对url的get请求**
    - **注：命令不区分大小写，这里大小写只是为了区分**
  - `CURL -X POST url`  **--发起不带参数的post请求**
  - `CURL -X POST URL -d 参数` **--发起普通的带参数的post请求**
    - 也可以省略为 `-XPOST` **简写成**：**`CURL URL -d + 参数`**
    - **如果要发起json格式的数据请求可以在前面加上`-H "Content-Type: application/json"`，即变为`CURL -H "Content-Type: application/json" URL -d + 参数`**
      - eg：`$ curl -H "Content-Type: application/json" -XPOST http://119.3.172.37:8999/api/data -d "{\"start\":\"202101\",\"end\":\"202105\"}" `
      - **注意：**
        - **在window下，json格式数据中双引号要加`\`转义**
    - **如果参数过长，可以将json格式的参数写成文件的形式，然后再前面加上`@`,`@` 符号表明后面跟的是当前路径下的文件名，【路径可以指定】**
      - eg:`curl -H "Content-Type: application/json" -X POST http://119.3.172.37:8999/api/data -d @demo.json`
  - `CURL -X POST URL -d 参数 -o 文件名` **--发起普通的带参数的post请求，并将返回的内容保存成文件（格式不限）**
    - eg：`curl -H "Content-Type: application/json" -o data.json -X POST http://119.3.172.37:8999/api/data -d @demo.json` 将返回的内容保存成json格式

## httpie --API 时代的人性化 CLI HTTP 客户端

- [需要下载](https://github.com/httpie/httpie/releases)
  - ubuntu上可直接通过命令下载`apt install httpie`
  
- 常见选项
  - `-f (等同于--form)`         **--将`Content-Type`设置为`application/x-www-form-urlencoded;charset=utf-8`**

  - `-o `         **--将返回内容保存成文件，文件名和路径名可以自定义**7

  - `--proxy`   **--设置代理**

- 常见命令

  - **get 请求**
    - `http url` 等同于 `http get url` 【默认发起get请求】
    
  - **post 请求**【默认请求头为`application/json`，**注：HTTPie内置JSON的支持。事实上HTTPie默认使用的`Content-Type`就是`application/json`因此，当你不指定`Content-Type`发送请求参数时，它们就会自动序列化为JSON对象。**】

    - **默认传递json，因为其内置了json，所以用`key=value`方式会自动进行json序列化**
      - eg：`http post http://119.3.172.37:8999/api/data start=202101 end=202105`
      
    - `-f` 选项使http命令序列化数据字段，并将`Content-Type`设置为`application/x-www-form-urlencoded;charset=utf-8`
      - eg：`http -f POST tonydeng.github.io name='Tony' email='tonydeng@email.com'`实际发出的请求的请求头是表单格式，请求数据会变成`name=Tony&email=tonydeng%40email.com`
    

