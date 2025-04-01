---
title: 基于frp内网穿透
description: 基于frp内网穿透
publishDate: 2025-04-01
tags:
  - frp
ogImage: /social-card.avif
---
# 基于frp内网穿透

## 服务器端

```bash
# 创建存放目录
sudo mkdir /etc/frp
# 创建frps.ini文件
vi /etc/frp/frps.ini
```

### frps.toml文件

```ini
[common]
# 监听端口
bind_port = 7000
# 面板端口
dashboard_port = 7500
# 登录面板账号设置
dashboard_user = admin
dashboard_pwd = 123456
# 设置http及https协议下代理端口（非重要）
vhost_http_port = 7080
vhost_https_port = 7081

# 身份验证
token = 123456
```

* **docker参数：**

  * 服务器镜像：`snowdreamtech/frps`
  * 重启：always
  * 网络模式：host
  * 文件映射：`/etc/frp/frps.ini:/etc/frp/frps.ini`
* **运行docker**

```dockerfile
docker run --restart=always --network host -d -v /etc/frp/frps.ini:/etc/frp/frps.ini --name frps snowdreamtech/frps
```

## 客户端：(改为在windows 下运行)

### frpc.ini文件

```ini
serverAddr = "47.120.44.206"
serverPort = 7000
auth.method = "token"
auth.token = "52010"

[[proxies]]
name = "test"
type = "tcp"
localIP = "127.0.0.1"
localPort = 7077
remotePort = 8077
```

```cmd
.\frpc.exe -c .\frpc.toml
```

## 更新--2025-3-28

### frp服务端

* **使用`bash <(curl -sL kejilion.sh)`工具箱部署，命令输入`k`可快速启动脚本**

![工具箱.png](https://cfimgbed.240723.xyz/file/1743521078365_1.png)

* 现已部署完：

  * 公网IP：47.120.44.206

    * 面板端口：8056
    * **面板账户**：user_589456cb
    * **面板密码**：dcb317039f6f2ee7
  * **token：4732d84ee5129e13f33e7dddc1eed26f**

### frp客户端

改用gui界面来实现

![](/assets/images/snipaste_2025-03-30_12-16-16.jpg)
