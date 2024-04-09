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
