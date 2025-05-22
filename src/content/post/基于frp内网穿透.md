---
title: 基于frp内网穿透
description: 基于frp内网穿透
publishDate: 2025-05-21
draft: false
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
serverAddr = "47.120.44...." (脱敏)
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
:::note
客户端和服务器部署更新
:::
## 更新--2025-3-28

### frp服务端

**使用`bash <(curl -sL kejilion.sh)`工具箱部署，命令输入`k`选11再选择55可快速启动脚本**

<img src="https://cfimgbed.240723.xyz/file/1743521078365_1.png" alt="工具箱.png" style="zoom:67%;" />

* 现已部署完：

  * 公网IP：

    * 面板端口：8056
    * **服务端口：8055**
    * **面板账户**：user_82422771
    * **面板密码**：67ae346dc51f2daf
  * **token：aae61e541cf60d8588c1d192ccc4a394**
* **面板地址：`公网IP:8056`**

### frp客户端

- **新建配置并添加token认证**   **（注：服务端口需设置为：8055）**

<img src="https://cfimgbed.240723.xyz/file/1747930283086_20250523001115031.png" alt="image-20250523001114814" style="zoom:67%;" />

<img src="https://cfimgbed.240723.xyz/file/1747929865934_20250523000415974.png" alt="image-20250523000415784" style="zoom: 80%;" />

- **添加代理并设置本地端口号和远程端口号**

<img src="https://cfimgbed.240723.xyz/file/1747929936843_20250523000530701.png" alt="image-20250523000530494" style="zoom:67%;" />

**最终通过 `公网IP:远程端口号`访问**

