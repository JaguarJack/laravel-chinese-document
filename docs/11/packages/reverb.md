# Laravel Reverb

[[toc]]

## 简介

Laravel Reverb 为您的 Laravel 应用带来了快速的、可扩展的实时 WebSocket 通信，并且与 Laravel 现有的[事件广播工具](/docs/11/digging-deeper/broadcasting)无缝集成。

## 安装

您可以使用 `install:broadcasting` Artisan 命令来安装 Reverb：

```
php artisan install:broadcasting
```

## 配置

在底层，`install:broadcasting` Artisan 命令会运行 `reverb:install` 命令，它会使用一系列合理的默认配置选项来安装 Reverb。如果您想要更改任何配置选项，可以通过更新 Reverb 的环境变量或者更新 `config/reverb.php` 配置文件来进行。

### 应用凭据

为了建立与 Reverb 的连接，需要在客户端和服务器之间交换一组 Reverb "应用" 凭据。这些凭据在服务器端配置，并用于验证来自客户端的请求。您可以使用以下环境变量来定义这些凭据：

```ini
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
```

### 允许的来源

您也可以通过更新 `config/reverb.php` 配置文件中 `apps` 部分的 `allowed_origins` 配置值来定义客户端请求可能来自的来源。任何未列在允许来源中的请求都会被拒绝。您可以使用 `*` 来允许所有来源：

```php
'apps' => [
    [
        'id' => 'my-app-id',
        'allowed_origins' => ['laravel.com'],
        // ...
    ]
]
```

### 额外的应用

通常情况下，Reverb 为安装它的应用提供 WebSocket 服务。然而，也有可能通过单个 Reverb 安装来为多个应用提供服务。

例如，您可能希望维护一个单一的 Laravel 应用，通过 Reverb 为多个应用提供 WebSocket 连接。这可以通过在应用的 `config/reverb.php` 配置文件中定义多个 `apps` 来实现：

```php
'apps' => [
    [
        'id' => 'my-app-one',
        // ...
    ],
    [
        'id' => 'my-app-two',
        // ...
    ],
],
```

### SSL

在大多数情况下，安全的 WebSocket 连接是由上游的 Web 服务器（如 Nginx 等）处理的，然后请求被代理到您的 Reverb 服务器。

然而，有时直接由 Reverb 服务器处理安全连接是有用的，如在本地开发时。如果您使用 [Laravel Herd's](https://herd.laravel.com) 安全站点功能，或者您使用 [Laravel Valet](/docs/11/packages/valet)，并且已经对您的应用运行了 [secure command](/docs/11/packages/valet#securing-sites)，那么您可以使用为您的站点生成的 Herd / Valet 证书来保护您的 Reverb 连接。为此，设置 `REVERB_HOST` 环境变量为您站点的主机名或者在启动 Reverb 服务器时明确传递主机名选项：

```sh
php artisan reverb:start --host="0.0.0.0" --port=8080 --hostname="laravel.test"
```

因为 Herd 和 Valet 域指向 `localhost`，执行上述命令将导致您的 Reverb 服务器可以通过安全的 WebSocket 协议 (`wss`) 在 `wss://laravel.test:8080` 上进行访问。

您还可以通过在应用的 `config/reverb.php` 配置文件中定义 `tls` 选项来手动选择证书。在 `tls` 选项数组中，您可以提供 [PHP 的 SSL 上下文选项](https://www.php.net/manual/en/context.ssl.php) 支持的任何选项：

```php
'options' => [
    'tls' => [
        'local_cert' => '/path/to/cert.pem'
    ],
],
```

## 运行服务器

Reverb 服务器可以使用 `reverb:start` Artisan 命令来启动：

```sh
php artisan reverb:start
```

默认情况下，Reverb 服务器会在 `0.0.0.0:8080` 启动，使其能够从所有网络接口进行访问。

如果您需要指定自定义主机或端口，您可以在启动服务器时通过 `--host` 和 `--port` 选项来这么做：

```sh
php artisan reverb:start --host=127.0.0.1 --port=9000
```

或者，您可以在应用的 `.env` 配置文件中定义 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量。

### 调试

为了改善性能，Reverb 默认不会输出任何调试信息。如果您想要看到通过 Reverb 服务器传播的数据流，您可以在 `reverb:start` 命令中提供 `--debug` 选项：

```sh
php artisan reverb:start --debug
```

### 重启

由于 Reverb 是一个长期运行的过程，不重启服务器的话，您的代码变更将不会生效。可以通过 `reverb:restart` Artisan 命令来重启服务器。

`reverb:restart` 命令确保在停止服务器之前所有连接都优雅地终止。如果您使用如 Supervisor 这样的进程管理器运行 Reverb，服务器将在所有连接被终止后由进程管理器自动重启：

```sh
php artisan reverb:restart
```

## 监控

Reverb 可以通过与 [Laravel Pulse](/docs/11/packages/pulse) 的集成来进行监控。启用 Reverb 的 Pulse 集成后，您可以追踪服务器处理的连接数和消息数。

为了启用集成，您首先应该确保您已经[安装了 Pulse](/docs/11/packages/pulse#installation)。然后，将 Reverb 的任何记录器添加到应用的 `config/pulse.php` 配置文件中：

```php
use Laravel\Reverb\Pulse\Recorders\ReverbConnections;
use Laravel\Reverb\Pulse\Recorders\ReverbMessages;

'recorders' => [
    ReverbConnections::class => [
        'sample_rate' => 1,
    ],

    ReverbMessages::class => [
        'sample_rate' => 1,
    ],

    ...
],
```

接下来，将每个记录器的 Pulse 卡片添加到您的 [Pulse 仪表板](/docs/11/packages/pulse#dashboard-customization)：

```blade
<x-pulse>
    <livewire:reverb.connections cols="full" />
    <livewire:reverb.messages cols="full" />
    ...
</x-pulse>
```

## 在生产环境中运行 Reverb

由于 WebSocket 服务器的长时间运行特性，您可能需要对服务器和托管环境进行一些优化，以确保您的 Reverb 服务器能够有效地处理可用资源的最佳连接数。

> [!NOTE]  
> 如果您的站点由 [Laravel Forge](https://forge.laravel.com) 管理，您可以直接从 "应用" 面板自动优化服务器以适应 Reverb。通过启用 Reverb 集成，Forge 将确保您的服务器已经准备好投入生产，包括安装任何所需的扩展和增加允许的连接数。

### 打开的文件

每个 WebSocket 连接都保存在内存中，直到客户端或服务器断开连接。在 Unix 和类 Unix 环境中，每个连接都由一个文件表示。然而，操作系统和应用程序层面通常对允许打开的文件数量有限制。

#### 操作系统

在基于 Unix 的操作系统上，您可以使用 `ulimit` 命令来确定允许打开的文件数量：

```sh
ulimit -n
```

此命令将显示不同用户允许的打开文件限制。您可以通过编辑 `/etc/security/limits.conf` 文件来更新这些值。例如，将 `forge` 用户的最大打开文件数更新为 10,000，如下所示：

```ini
# /etc/security/limits.conf
forge        soft  nofile  10000
forge        hard  nofile  10000
```

### 事件循环

Reverb 在底层使用了 ReactPHP 事件循环来管理服务器上的 WebSocket 连接。默认情况下，这个事件循环由 `stream_select` 驱动，它不需要任何额外的扩展。然而，`stream_select` 通常限制为最多 1024 个打开的文件。因此，如果您计划处理超过 1000 个并发连接，您将需要使用其他不受同样限制的事件循环。

如果 Reverb 能够使用 `ext-event`、`ext-ev` 或 `ext-uv`，它将自动切换到这些驱动的循环。所有这些 PHP 扩展都可以通过 PECL 安装：

```sh
pecl install event
# 或者
pecl install ev
# 或者
pecl install uv
```

### Web 服务器

在大多数情况下，Reverb 运行在服务器的一个非面向 Web 的端口上。因此，为了将流量路由到 Reverb，应该配置一个反向代理。假设 Reverb 运行在 `0.0.0.0` 主机和 `8080` 端口上，且您的服务器使用的是 Nginx Web 服务器，可以使用以下 Nginx 站点配置为您的 Reverb 服务器定义一个反向代理：

```nginx
server {
    ...

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_pass http://0.0.0.0:8080;
    }

    ...
}
```

通常，为了防止服务器过载，Web 服务器被配置为限制允许的连接数。要将 Nginx Web 服务器的允许连接数增加到 10,000，应更新 `nginx.conf` 文件的 `worker_rlimit_nofile` 和 `worker_connections` 值：

```nginx
user forge;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
worker_rlimit_nofile 10000;

events {
  worker_connections 10000;
  multi_accept on;
}
```

上面的配置将允许每个进程最多生成 10,000 个 Nginx 工作进程。此外，这个配置将 Nginx 的打开文件限制设置为 10,000。

### 端口

基于 Unix 的操作系统通常会限制服务器上可以打开的端口数量。您可以通过以下命令查看当前允许的范围：

```sh
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768 60999
```

上面的输出显示服务器最多可以处理 28,231 (60,999 - 32,768) 个连接，因为每个连接都需要一个空闲端口。尽管我们推荐使用[水平扩展](#scaling)来增加允许的连接数量，但您可以通过更新服务器的 `/etc/sysctl.conf` 配置文件中允许的端口范围来增加可用的打开端口数量。

### 进程管理

在大多数情况下，您应该使用进程管理器，如 Supervisor，来确保 Reverb 服务器持续运行。如果您正在使用 Supervisor 来运行 Reverb，您应该更新服务器的 `supervisor.conf` 文件中的 `minfds` 设置，以确保 Supervisor 能够打开处理 Reverb 服务器连接所需的文件：

```ini
[supervisord]
...
minfds=10000
```

### 扩展

如果您需要处理的连接数量超过单个服务器允许的数量，您可以水平扩展您的 Reverb 服务器。利用 Redis 的发布/订阅功能，Reverb 能够跨多个服务器管理连接。当您的应用程序的一个 Reverb 服务器收到一条消息时，该服务器将使用 Redis 将传入消息发布给所有其他服务器。

要启用水平扩展，您应该在应用程序的 `.env` 配置文件中将 `REVERB_SCALING_ENABLED` 环境变量设置为 `true`：

```shell
REVERB_SCALING_ENABLED=true
```

接下来，您应该有一个专用的、中心化的 Redis 服务器，所有的 Reverb 服务器将与其通信。Reverb 将使用为您的应用程序配置的[默认 Redis 连接](/docs/11/database/redis#configuration)来向所有 Reverb 服务器发布消息。

一旦您启用了 Reverb 的扩展选项并配置了 Redis 服务器，您可以简单地在能够与您的 Redis 服务器通信的多个服务器上调用 `reverb:start` 命令。这些 Reverb 服务器应该放置在一个负载均衡器后面，以均匀地分配传入请求。
