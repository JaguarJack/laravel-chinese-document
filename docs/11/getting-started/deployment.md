---
title: Laravel 部署
---

# 部署

[[toc]]

## 简介

当您准备将您的 Laravel 应用程序部署到生产环境时，有一些重要的事情可以做以确保您的应用程序尽可能高效地运行。在本文档中，我们将介绍一些确保您的 Laravel 应用程序正确部署的出色起点。

## 服务器要求

Laravel 框架有一些系统要求。您应该确保您的 Web 服务器具有以下最低 PHP 版本和扩展：

- PHP >= 8.2
- Ctype PHP 扩展
- cURL PHP 扩展
- DOM PHP 扩展
- Fileinfo PHP 扩展
- Filter PHP 扩展
- Hash PHP 扩展
- Mbstring PHP 扩展
- OpenSSL PHP 扩展
- PCRE PHP 扩展
- PDO PHP 扩展
- Session PHP 扩展
- Tokenizer PHP 扩展
- XML PHP 扩展

## 服务器配置

### Nginx

如果您将应用程序部署到运行 Nginx 的服务器上，您可以使用以下配置文件作为配置 Web 服务器的起点。根据您的服务器配置，这个文件很可能需要进行自定义。**如果您希望在管理服务器方面获得帮助，请考虑使用 Laravel 官方服务器管理和部署服务，如 [Laravel Forge](https://forge.laravel.com)。**

请确保，如下面的配置所示，您的 Web 服务器将所有请求定向到您的应用程序的 `public/index.php` 文件。您永远不应该尝试将 `index.php` 文件移动到项目的根目录，因为从项目根目录提供应用程序将会将许多敏感的配置文件暴露给公共互联网：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;
    root /srv/example.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 优化

在将应用程序部署到生产环境时，有多种文件应该被缓存，包括您的配置、事件、路由和视图。Laravel 提供了一个方便的 `optimize` Artisan 命令，将缓存所有这些文件。通常，此命令应该作为应用程序部署过程的一部分被调用：

```shell
php artisan optimize
```

`optimize:clear` 方法可用于删除 `optimize` 命令生成的所有缓存文件：

```shell
php artisan optimize:clear
```

在以下文档中，我们将讨论 `optimize` 命令执行的每个细化优化命令。

### 配置缓存

在将应用程序部署到生产环境时，您应该确保在部署过程中运行 `config:cache` Artisan 命令：

```shell
php artisan config:cache
```

此命令将把 Laravel 的所有配置文件合并到一个单一的缓存文件中，这大大减少了框架在加载配置值时必须对文件系统进行的访问次数。

> [!WARNING]
> 如果您在部署过程中执行 `config:cache` 命令，您应该确保只从配置文件中调用 `env` 函数。一旦配置被缓存，`.env` 文件将不会被加载，所有对 `.env` 变量的 `env` 函数调用都将返回 `null`。

### 事件缓存

您应该在部署过程中缓存应用程序的自动发现事件到监听器映射。这可以通过在部署期间调用 `event:cache` Artisan 命令来实现：

```shell
php artisan event:cache
```

### 路由缓存

如果您正在构建一个具有许多路由的大型应用程序，您应该确保在部署过程中运行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

此命令将所有路由注册减少到缓存文件中的单个方法调用中，当注册数百个路由时，提高路由注册的性能。

### 视图缓存

在将应用程序部署到生产环境时，您应该确保在部署过程中运行 `view:cache` Artisan 命令：

```shell
php artisan view:cache
```

此命令预编译所有 Blade 视图，以便它们不会按需编译，提高了返回视图的每个请求的性能。

## 调试模式

您的 `config/app.php` 配置文件中的 debug 选项决定了实际向用户显示的错误信息量。默认情况下，此选项设置为遵循存储在应用程序的 `.env` 文件中的 `APP_DEBUG` 环境变量的值。

> [!WARNING] > **在您的生产环境中，这个值应该始终为 `false`。如果在生产中将 `APP_DEBUG` 变量设置为 `true`，您将冒着向应用程序的最终用户暴露敏感配置值的风险。**

## 健康检查路由

Laravel 包括一个内置的健康检查路由，可用于监控您的应用程序状态。在生产中，此路由可用于向正常运行监控、负载均衡器或 Kubernetes 等编排系统报告您的应用程序状态。

默认情况下，健康检查路由在 `/up` 下提供服务，并且如果应用程序没有异常启动，将返回 200 HTTP 响应。否则，将返回 500 HTTP 响应。您可以在应用程序的 `bootstrap/app` 文件中配置此路由的 URI：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up', // [tl! remove]
    health: '/status', // [tl! add]
)
```

当对此路由发出 HTTP 请求时，Laravel 还将分派 `Illuminate\Foundation\Events\DiagnosingHealth` 事件，允许您执行与您的应用程序相关的其他健康检查。在此事件的[监听器](/docs/11/digging-deeper/events)中，您可以检查应用程序的数据库或缓存状态。如果您检测到应用程序存在问题，您可以简单地从监听器中抛出异常。

## 使用 Forge / Vapor 轻松部署

#### Laravel Forge

如果您还不准备管理自己的服务器配置，或者不习惯配置运行健壮的 Laravel 应用程序所需的各种服务，[Laravel Forge](https://forge.laravel.com) 是一个绝佳的选择。

Laravel Forge 可以在 DigitalOcean、Linode、AWS 等各种基础设施提供商上创建服务器。此外，Forge 安装并管理构建健壮的 Laravel 应用程序所需的所有工具，如 Nginx、MySQL、Redis、Memcached、Beanstalk 等。

> [!NOTE]
> 想要完整的使用 Laravel Forge 部署指南？查看 [Laravel Bootcamp](https://bootcamp.laravel.com/deploying) 和在 Laracasts 上可用的 Forge [视频系列](https://laracasts.com/series/learn-laravel-forge-2022-edition)。

#### Laravel Vapor

如果您希望拥有完全无服务器、自动扩展的部署平台，适用于 Laravel，请查看 [Laravel Vapor](https://vapor.laravel.com)。Laravel Vapor 是一个为 Laravel 提供动力的无服务器部署平台，由 AWS 支持。在 Vapor 上启动您的 Laravel 基础设施，并爱上无服务器的可扩展简洁性。Laravel Vapor 由 Laravel 的创建者精心调整，与框架无缝协作，因此您可以继续像习惯的那样编写 Laravel 应用程序。
