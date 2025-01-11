---
title: 基于frp内网穿透
description: 基于frp内网穿透
publishDate: 2025-01-11
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

- **docker参数：**
  - 服务器镜像：snowdreamtech/frps
  - 重启：always

  - 网络模式：host

  - 文件映射：/etc/frp/frps.ini:/etc/frp/frps.ini
- **运行docker**

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
