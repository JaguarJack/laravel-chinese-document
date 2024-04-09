# Laravel 中文文档

## 如何安装

```sh
git clone https://github.com/JaguarJack/laravel-chinese-document.git

cd laravel-chinese-document

yarn install

yarn docs:dev
```

## 翻译

目前仓库只支持 `Laravel 11` 版本，请在 `docs/11` 目录下对应目录进行翻译 🙏，希望可以有更多喜欢 Laravel 的开发者加入进来

## 如何部署

目前仓库只支持部署到自己的服务器

### fork 仓库

### 设置服务器信息

找到仓库 `Settings` > `Secrets and variables` > `Actions`

#### 设置以下几个变量

- SERVER_HOST 服务器 IP 地址
- SERVER_USERNAME 服务器登录用户名
- SERVER_SECRET 服务器 SSH 密钥
- SERVER_PORT SSH 端口号
- SERVER_WORKDIR 上传目录

#### 解析域名

#### 部署配置

```conf
server
{
    listen 80;
    server_name 你的域名;
    return 301 你的域名$request_uri;
}

server
{
    listen  443  ssl http2;
    server_name 你的域名;
    index index.html index.php index.htm default.php default.htm default.html;

    ## ssl 证书 配置
    ssl_certificate    # pem文件的路径
    ssl_certificate_key # key文件的路径
    # ssl验证相关配置
    ssl_session_timeout  5m;    #缓存有效期
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;

    root 文档项目根目录
    location / {
    	try_files $uri $uri/ /index.html =404;
    }
}

```
