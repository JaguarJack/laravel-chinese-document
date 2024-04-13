# Laravel Octane

[[toc]]

## 介绍

[Laravel Octane](https://github.com/laravel/octane) 通过使用高性能应用服务器（包括 [FrankenPHP](https://frankenphp.dev/)、[Open Swoole](https://openswoole.com/)、[Swoole](https://github.com/swoole/swoole-src) 和 [RoadRunner](https://roadrunner.dev)）来服务您的应用程序，从而极大地提升了您的应用程序的性能。Octane 启动您的应用程序一次，保持其在内存中，然后以超音速的速度向它发送请求。

## 安装

Octane 可以通过 Composer 包管理器安装：

```shell
composer require laravel/octane
```

安装 Octane 后，您可以执行 `octane:install` Artisan 命令，该命令将安装 Octane 的配置文件到您的应用程序中：

```shell
php artisan octane:install
```

## 服务器先决条件

> [!WARNING]  
> Laravel Octane 需要 [PHP 8.1+](https://php.net/releases/)。

### FrankenPHP

> [!WARNING]  
> FrankenPHP 的 Octane 集成处于测试阶段，在生产环境中应谨慎使用。

[FrankenPHP](https://frankenphp.dev) 是一个用 Go 编写的 PHP 应用程序服务器，支持早期提示和 Zstandard 压缩等现代 Web 功能。当您安装 Octane 并选择 FrankenPHP 作为您的服务器时，Octane 将自动为您下载并安装 FrankenPHP 二进制文件。

#### 通过 Laravel Sail 使用 FrankenPHP

如果您计划使用 [Laravel Sail](/docs/11/packages/sail) 开发您的应用程序，您应该运行以下命令来安装 Octane 和 FrankenPHP：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane
```

接下来，您应该使用 `octane:install` Artisan 命令来安装 FrankenPHP 二进制文件：

```shell
./vendor/bin/sail artisan octane:install --server=frankenphp
```

最后，在您应用程序的 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。这个环境变量将包含 Sail 用来使用 Octane 而不是 PHP 开发服务器来服务您的应用程序的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: '/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=frankenphp --host=0.0.0.0 --admin-port=2019 --port=80'
      XDG_CONFIG_HOME: /var/www/html/config
      XDG_DATA_HOME: /var/www/html/data
```

为了启用 HTTPS、HTTP/2 和 HTTP/3，请改用以下修改：

```yaml
services:
  laravel.test:
    ports:
      - '${APP_PORT:-80}:80'
      - '${VITE_PORT:-5173}:${VITE_PORT:-5173}'
      - '443:443'
      - '443:443/udp'
    environment:
      SUPERVISOR_PHP_COMMAND: '/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --host=localhost --port=443 --admin-port=2019 --https'
      XDG_CONFIG_HOME: /var/www/html/config
      XDG_DATA_HOME: /var/www/html/data
```

通常，您应该通过 `https://localhost` 访问您的 FrankenPHP Sail 应用程序，因为使用 `https://127.0.0.1` 需要额外的配置，并且[不推荐](https://frankenphp.dev/docs/known-issues/#using-https127001-with-docker)。

#### 通过 Docker 使用 FrankenPHP

使用 FrankenPHP 的官方 Docker 镜像可以提供改进的性能，并使用不包含在 FrankenPHP 静态安装中的附加扩展。此外，官方 Docker 镜像还提供对本地不支持的平台如 Windows 的 FrankenPHP 运行支持。FrankenPHP 的官方 Docker 镜像适合本地开发和生产使用。

您可以使用以下 Dockerfile 作为容器化您的 FrankenPHP 驱动 Laravel 应用程序的起点：

```dockerfile
FROM dunglas/frankenphp

RUN install-php-extensions \
    pcntl
    # 在此处添加其他 PHP 扩展...

COPY . /app

ENTRYPOINT ["php", "artisan", "octane:frankenphp"]
```

然后，在开发过程中，您可以使用以下 Docker Compose 文件来运行您的应用程序：

```yaml
# compose.yaml
services:
  frankenphp:
    build:
      context: .
    entrypoint: php artisan octane:frankenphp --max-requests=1
    ports:
      - '8000:8000'
    volumes:
      - .:/app
```

您可以查阅[官方 FrankenPHP 文档](https://frankenphp.dev/docs/docker/) 获取有关于使用 Docker 运行 FrankenPHP 的更多信息。

### RoadRunner

[RoadRunner](https://roadrunner.dev) 由使用 Go 构建的 RoadRunner 二进制文件提供支持。当您首次启动基于 RoadRunner 的 Octane 服务器时，Octane 将提供为您下载并安装 RoadRunner 二进制文件。

#### 通过 Laravel Sail 使用 RoadRunner

如果您计划使用 [Laravel Sail](/docs/11/packages/sail) 开发您的应用程序，您应该运行以下命令来安装 Octane 和 RoadRunner：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane spiral/roadrunner-cli spiral/roadrunner-http
```

接下来，您应该启动一个 Sail shell 并使用 `rr` 可执行文件来检索最新的基于 Linux 的 RoadRunner 二进制文件构建：

```shell
./vendor/bin/sail shell

# 在 Sail shell 中...
./vendor/bin/rr get-binary
```

然后，在您应用程序的 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。这个环境变量将包含 Sail 用来使用 Octane 而不是 PHP 开发服务器来服务您的应用程序的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: '/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=roadrunner --host=0.0.0.0 --rpc-port=6001 --port=80'
```

最后，确保 `rr` 二进制文件是可执行的并构建您的 Sail 镜像：

```shell
chmod +x ./rr

./vendor/bin/sail build --no-cache
```

### Swoole

如果您计划使用 Swoole 应用服务器来服务您的 Laravel Octane 应用程序，则必须安装 Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install swoole
```

#### Open Swoole

如果您想使用 Open Swoole 应用服务器来服务您的 Laravel Octane 应用程序，您必须安装 Open Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install openswoole
```

使用 Laravel Octane 与 Open Swoole 一起使用提供的功能与 Swoole 相同，如并发任务、ticks 和间隔。

#### 通过 Laravel Sail 使用 Swoole

> [!WARNING]  
> 在通过 Sail 服务 Octane 应用程序之前，请确保您拥有 Laravel Sail 的最新版本，并在您的应用程序的根目录中执行 `./vendor/bin/sail build --no-cache`。

或者，您也可以使用 [Laravel Sail](/docs/11/packages/sail)，这是 Laravel 官方基于 Docker 的开发环境，来开发基于 Swoole 的 Octane 应用程序。Laravel Sail 默认包含 Swoole 扩展。但是，您仍然需要调整 Sail 使用的 `docker-compose.yml` 文件。

首先，在您应用程序的 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。这个环境变量将包含 Sail 用来使用 Octane 而不是 PHP 开发服务器来服务您的应用程序的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: '/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=swoole --host=0.0.0.0 --port=80'
```

最后，构建您的 Sail 镜像：

```shell
./vendor/bin/sail build --no-cache
```

#### Swoole 配置

如果需要，您可以在 `octane` 配置文件中添加一些 Swoole 支持的额外配置选项。因为这些选项很少需要修改，所以它们并不包含在默认配置文件中：

```php
'swoole' => [
    'options' => [
        'log_file' => storage_path('logs/swoole_http.log'),
        'package_max_length' => 10 * 1024 * 1024,
    ],
],
```

## 应用的服务

Octane 服务器可以通过 `octane:start` Artisan 命令启动。默认情况下，此命令将使用应用程序的 `octane` 配置文件中的 `server` 配置选项指定的服务器：

```shell
php artisan octane:start
```

默认情况下，Octane 会在 8000 端口启动服务器，因此您可以通过 `http://localhost:8000` 在网络浏览器中访问您的应用程序。

### 通过 HTTPS 为您的应用程序服务

默认情况下，通过 Octane 运行的应用程序生成的链接前缀为 `http://`。当通过 HTTPS 为应用程序提供服务时，可以在应用程序的 `config/octane.php` 配置文件中使用 `OCTANE_HTTPS` 环境变量设置为 `true`。当此配置值设置为 `true` 时，Octane 将指导 Laravel 为所有生成的链接加上 `https://` 前缀：

```php
'https' => env('OCTANE_HTTPS', false),
```

### 通过 Nginx 为您的应用程序服务

> [!NOTE]  
> 如果您还没有准备好管理自己的服务器配置，或者不习惯配置运行强大的 Laravel Octane 应用程序所需的各种服务，请查看 Laravel Forge。

在生产环境中，您应该在传统的 Web 服务器（如 Nginx 或 Apache）背后为您的 Octane 应用程序提供服务。这样做将允许 Web 服务器为您的静态资产（如图像和样式表）提供服务，并管理您的 SSL 证书终止。

在下面的 Nginx 配置示例中，Nginx 将为网站的静态资产提供服务，并将请求代理到运行在 8000 端口的 Octane 服务器：

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name domain.com;
    server_tokens off;
    root /home/forge/domain.com/public;

    index index.php;

    charset utf-8;

    location /index.php {
        try_files /not_exists @octane;
    }

    location / {
        try_files $uri $uri/ @octane;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log off;
    error_log  /var/log/nginx/domain.com-error.log error;

    error_page 404 /index.php;

    location @octane {
        set $suffix "";

        if ($uri = /index.php) {
            set $suffix ?$query_string;
        }

        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_pass http://127.0.0.1:8000$suffix;
    }
}
```

### 监视文件更改

由于应用程序在 Octane 服务器启动时加载进内存，并在提供服务请求期间保留，所以当您刷新浏览器时，应用程序文件的任何更改将不会反映。例如，添加到 `routes/web.php` 文件的路由定义在服务器重新启动之前不会被反映。为了方便起见，您可以使用 `--watch` 标志指示 Octane 在应用程序内发生任何文件更改时自动重新启动服务器：

```shell
php artisan octane:start --watch
```

在使用此功能之前，您应该确保在本地开发环境中安装了 [Node](https://nodejs.org)。此外，您应该在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监视库：

```shell
npm install --save-dev chokidar
```

您可以使用应用程序的 `config/octane.php` 配置文件中的 `watch` 配置选项来配置应监视的目录和文件。

### 指定工作进程数量

默认情况下，Octane 将为您的机器提供的每个 CPU 核心启动一个应用程序请求工作进程。然后这些工作进程将用于服务进入应用程序的 HTTP 请求。在调用 `octane:start` 命令时，您可以使用 `--workers` 选项手动指定您希望启动多少个工作进程：

```shell
php artisan octane:start --workers=4
```

如果您使用的是 Swoole 应用服务器，您也可以指定要启动多少个 ["任务工作进程"](#concurrent-tasks)：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

### 指定最大请求计数

为了帮助防止内存泄漏，Octane 会在任何工作进程处理了 500 个请求后优雅地重启它。要调整这个数字，您可以使用 `--max-requests` 选项：

```shell
php artisan octane:start --max-requests=250
```

### 重新加载工作进程

您可以使用 `octane:reload` 命令优雅地重启 Octane 服务器的应用程序工作进程。通常，应该在部署后执行此操作，以便将新部署的代码加载到内存中，并用于服务后续请求：

```shell
php artisan octane:reload
```

### 停止服务器

您可以使用 `octane:stop` Artisan 命令停止 Octane 服务器：

```shell
php artisan octane:stop
```

#### 检查服务器状态

您可以使用 `octane:status` Artisan 命令检查 Octane 服务器的当前状态：

```shell
php artisan octane:status
```

## 依赖注入与 Octane

由于 Octane 一次启动您的应用程序并在提供服务请求的同时将其保持在内存中，因此在构建您的应用程序时，您应该考虑一些注意事项。例如，应用程序服务提供者的 `register` 和 `boot` 方法将只在请求工作进程最初启动时执行一次。在后续请求中，将重用相同的应用程序实例。

鉴于此，您应当在注入应用程序服务容器或请求到任何对象的构造函数时特别小心。这样做可能会导致该对象在后续请求中有旧版容器或请求。

Octane 将自动处理在请求之间重置任何第一方框架状态。然而，Octane 通常不知道如何重置应用程序创建的全局状态。因此，您应该知道如何以一种对 Octane 友好的方式构建应用程序。下面，我们将讨论在使用 Octane 时可能引起问题的最常见情况。

### 容器注入

一般情况下，您应该避免将应用程序服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个应用程序服务容器注入到作为单例绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app);
    });
}
```

在此示例中，如果在应用程序启动过程中解析了 `Service` 实例，则容器将注入服务中，并且同一容器将在后续请求中由 `Service` 实例持有。这**可能**对您的特定应用程序不是问题；然而，它可能导致容器意外丢失后续在启动周期或后续请求中添加的绑定。

作为变通方法，您可以停止将绑定注册为单例，或者您可以将容器解析器闭包注入服务中，该闭包始终解析当前容器实例:

```php
use App\Service;
use Illuminate\Container\Container;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app);
});

$this->app->singleton(Service::class, function () {
    return new Service(fn () => Container::getInstance());
});
```

全局 `app` 帮助器和 `Container::getInstance()` 方法将始终返回最新版本的应用程序容器。

### 请求注入

一般情况下，您应该避免将应用程序服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个请求实例注入到作为单例绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app['request']);
    });
}
```

在此示例中，如果在应用程序启动过程中解析了 `Service` 实例，则 HTTP 请求将注入服务中，并且同一请求将在后续请求中由 `Service` 实例持有。因此，所有头部、输入和查询字符串数据都将是错误的，以及所有其他请求数据。

作为变通方法，您可以停止将绑定注册为单例，或者您可以将请求解析器闭包注入服务中，该闭包始终解析当前请求实例。或者，最推荐的方法是简单地在运行时将您的对象需要的特定请求信息传递给对象的方法：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app['request']);
});

$this->app->singleton(Service::class, function (Application $app) {
    return new Service(fn () => $app['request']);
});

// 或...

$service->method($request->input('name'));
```

全局 `request` 帮助器将始终返回应用程序当前正在处理的请求，因此在您的应用程序中使用是安全的。

> [!WARNING]  
> 在你的控制器方法和路由闭包中类型提示 `Illuminate\Http\Request` 实例是可以接受的。

### 配置仓库注入

一般情况下，你应该避免将配置仓库实例注入到其他对象的构造函数中。例如，以下绑定将配置仓库注入到作为单例的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app->make('config'));
    });
}
```

在这个例子中，如果配置值在请求之间发生变化，服务将无法访问新值，因为它依赖于原始的仓库实例。

作为变通方法，你可以停止将绑定注册为单例，或者你可以将配置仓库解析器闭包注入到类中：

```php
use App\Service;
use Illuminate\Container\Container;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app->make('config'));
});

$this->app->singleton(Service::class, function () {
    return new Service(fn () => Container::getInstance()->make('config'));
});
```

全局 `config` 将始终返回最新版本的配置仓库，因此在你的应用程序中是安全使用的。

### 管理内存泄漏

请记住，Octane 在请求之间将你的应用程序保持在内存中；因此，向静态维护的数组添加数据将导致内存泄漏。例如，以下控制器存在内存泄漏，因为每个对应用程序的请求将继续向静态 `$data` 数组添加数据：

```php
use App\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Handle an incoming request.
 */
public function index(Request $request): array
{
    Service::$data[] = Str::random(10);

    return [
        // ...
    ];
}
```

在构建你的应用程序时，你应该特别注意避免创建这种类型的内存泄漏。建议你在本地开发期间监视应用程序的内存使用情况，以确保你没有在你的应用程序中引入新的内存泄漏。

## 并发任务

> [!WARNING]  
> 此功能需要 [Swoole](#swoole)。

当使用 Swoole 时，你可以通过轻量级后台任务并发执行操作。你可以使用 Octane 的 `concurrently` 方法来实现这一点。你可以将此方法与 PHP 数组解构结合使用，以检索每个操作的结果：

```php
use App\Models\User;
use App\Models\Server;
use Laravel\Octane\Facades\Octane;

[$users, $servers] = Octane::concurrently([
    fn () => User::all(),
    fn () => Server::all(),
]);
```

Octane 处理的并发任务利用了 Swoole 的 "任务工作者"，并且在与传入请求完全不同的进程中执行。用于处理并发任务的工作进程数由 `octane:start` 命令上的 `--task-workers` 指令决定：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

调用 `concurrently` 方法时，由于 Swoole 任务系统强加的限制，你不应提供超过 1024 个任务。

## 周期性任务和间隔任务

> [!WARNING]  
> 此功能需要 [Swoole](#swoole)。

当使用 Swoole 时，你可以注册周期性操作，这些操作将在指定的秒数每次执行。你可以通过 `tick` 方法注册周期性回调。提供给 `tick` 方法的第一个参数应该是表示计时器名称的字符串。第二个参数应该是一个可调用对象，它将在指定的时间间隔内调用。

在此示例中，我们将注册一个闭包，每 10 秒调用一次。通常，`tick` 方法应当在你的应用程序的某个服务提供者的 `boot` 方法内调用：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
        ->seconds(10);
```

使用 `immediate` 方法，你可以指示 Octane 在 Octane 服务器最初启动时立即调用计时回调，之后每 N 秒调用一次：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
        ->seconds(10)
        ->immediate();
```

## Octane 缓存

> [!WARNING]  
> 此功能需要 [Swoole](#swoole)。

当使用 Swoole 时，你可以利用 Octane 缓存驱动，它提供了高达每秒 200 万次的读写速度。因此，这个缓存驱动是对于那些需要极端读/写速度的缓存层的应用程序来说是一个极好的选择。

这个缓存驱动由 [Swoole 表](https://www.swoole.co.uk/docs/modules/swoole-table) 提供动力。所有存储在缓存中的数据对服务器上的所有工作进程都是可用的。然而，当服务器重启时，缓存数据将被清空：

```php
Cache::store('octane')->put('framework', 'Laravel', 30);
```

> [!NOTE]  
> Octane 缓存中允许的最大条目数可以在应用程序的 `octane` 配置文件中定义。

### 缓存间隔

除了 Laravel 缓存系统提供的典型方法外，Octane 缓存驱动还具有基于间隔的缓存功能。这些缓存会在指定的间隔内自动刷新，并且应该在你的应用程序的某个服务提供者的 `boot` 方法中注册。例如，以下缓存将每五秒刷新一次：

```php
use Illuminate\Support\Str;

Cache::store('octane')->interval('random', function () {
    return Str::random(10);
}, seconds: 5);
```

## 表格

> [!WARNING]  
> 此功能需要 [Swoole](#swoole)。

当使用 Swoole 时，你可以定义和交互你自己的任意 [Swoole 表](https://www.swoole.co.uk/docs/modules/swoole-table)。Swoole 表格提供极端的性能吞吐量，并且这些表格中的数据可以被服务器上的所有工作进程访问。然而，当服务器重启时，它们内部的数据将会丢失。

表格应该在应用程序的 `octane` 配置文件中的 `tables` 配置数组中定义。一个允许最大 1000 行的示例表格已经为你配置好了。可以通过在列类型后指定列大小来配置字符串列的最大尺寸，如下所示：

```php
'tables' => [
    'example:1000' => [
        'name' => 'string:1000',
        'votes' => 'int',
    ],
],
```

要访问一个表格，你可以使用 `Octane::table` 方法：

```php
use Laravel\Octane\Facades\Octane;

Octane::table('example')->set('uuid', [
    'name' => 'Nuno Maduro',
    'votes' => 1000,
]);

return Octane::table('example')->get('uuid');
```

> [!WARNING]  
> Swoole 表支持的列类型有：`string`、`int` 和 `float`。
