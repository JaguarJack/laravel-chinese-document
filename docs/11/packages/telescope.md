# Telescope

[[toc]]

## 简介

[Laravel Telescope](https://github.com/laravel/telescope) 是您本地 Laravel 开发环境的绝佳伴侣。Telescope 提供了对进入您应用的请求、异常、日志条目、数据库查询、队列作业、邮件、通知、缓存操作、计划任务、变量转储等的洞察。

![Telescope 示例图片](https://laravel.com/img/docs/telescope-example.png)

## 安装

您可以使用 Composer 包管理器将 Telescope 安装到您的 Laravel 项目中：

```shell
composer require laravel/telescope
```

安装 Telescope 后，使用 `telescope:install` Artisan 命令发布其资源和迁移。安装 Telescope 后，您还应该运行 `migrate` 命令以创建存储 Telescope 数据所需的表：

```shell
php artisan telescope:install

php artisan migrate
```

最后，您可以通过 `/telescope` 路由访问 Telescope 仪表板。

### 仅本地安装

如果您计划仅使用 Telescope 辅助本地开发，您可以使用 `--dev` 标志进行安装：

```shell
composer require laravel/telescope --dev

php artisan telescope:install

php artisan migrate
```

运行 `telescope:install` 后，您应该从应用的 `bootstrap/providers.php` 配置文件中删除 `TelescopeServiceProvider` 服务提供商的注册。相反，应在您的 `App\Providers\AppServiceProvider` 类的 `register` 方法中手动注册 Telescope 的服务提供商。我们将确保当前环境是 `local`，然后再注册提供商：

```php
/**
 * Register any application services.
 */
public function register(): void
{
    if ($this->app->environment('local')) {
        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(TelescopeServiceProvider::class);
    }
}
```

最后，您还应该通过在您的 `composer.json` 文件中添加以下内容来防止 Telescope 包被[自动发现](/docs/11/digging-deeper/packages#package-discovery)：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "laravel/telescope"
        ]
    }
},
```

### 配置

发布 Telescope 的资源后，其主要配置文件将位于 `config/telescope.php`。此配置文件允许您配置[监视器选项](#available-watchers)。每个配置选项都包括其用途的描述，请务必彻底探索此文件。

如果需要，您可以使用 `enabled` 配置选项完全禁用 Telescope 的数据收集：

```php
'enabled' => env('TELESCOPE_ENABLED', true),
```

### 数据剪裁

如果不进行剪裁，`telescope_entries` 表会非常快地积累记录。为了缓解这个问题，您应该[安排](/docs/11/digging-deeper/scheduling)定期运行 `telescope:prune` Artisan 命令：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune')->daily();
```

默认情况下，所有超过 24 小时的条目都会被剪裁。您可以在调用命令时使用 `hours` 选项来决定保留 Telescope 数据的时间。例如，以下命令将删除所有超过 48 小时创建的记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune --hours=48')->daily();
```

### 仪表板授权

Telescope 仪表板可以通过 `/telescope` 路由访问。默认情况下，您只能在 `local` 环境中访问此仪表板。在您的 `app/Providers/TelescopeServiceProvider.php` 文件中，有一个[授权网关](/docs/11/security/authorization#gates)定义。这个授权网关控制着在**非本地**环境中访问 Telescope 的权限。您可以根据需要修改此网关以限制对您的 Telescope 安装的访问：

```php
use App\Models\User;

/**
 * Register the Telescope gate.
 *
 * This gate determines who can access Telescope in non-local environments.
 */
protected function gate(): void
{
    Gate::define('viewTelescope', function (User $user) {
        return in_array($user->email, [
            'taylor@laravel.com',
        ]);
    });
}
```

> [!WARNING]  
> 您应确保在生产环境中将您的 `APP_ENV` 环境变量更改为 `production`。否则，您的 Telescope 安装将公开可用。

## 升级 Telescope

在升级到 Telescope 的新主要版本时，重要的是您仔细审查[升级指南](https://github.com/laravel/telescope/blob/master/UPGRADE.md)。

此外，在升级到任何新的 Telescope 版本时，您应该重新发布 Telescope 的资源：

```shell
php artisan telescope:publish
```

为了保持资源的最新状态，避免在未来的更新中遇到问题，您可以将 `vendor:publish --tag=laravel-assets` 命令添加到您的应用的 `composer.json` 文件中的 `post-update-cmd` 脚本中：

```json
{
  "scripts": {
    "post-update-cmd": ["@php artisan vendor:publish --tag=laravel-assets --ansi --force"]
  }
}
```

## 筛选

### 条目

您可以通过在 `App\Providers\TelescopeServiceProvider` 类中定义的 `filter` 闭包筛选 Telescope 记录的数据。默认情况下，该闭包将在 `local` 环境中记录所有数据，并在其他所有环境中记录异常、失败的作业、计划任务和带有监控标签的数据：

```php
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->hideSensitiveRequestDetails();

    Telescope::filter(function (IncomingEntry $entry) {
        if ($this->app->environment('local')) {
            return true;
        }

        return $entry->isReportableException() ||
            $entry->isFailedJob() ||
            $entry->isScheduledTask() ||
            $entry->isSlowQuery() ||
            $entry->hasMonitoredTag();
    });
}
```

### 批处理

虽然 `filter` 闭包筛选单个条目的数据，您可以使用 `filterBatch` 方法注册一个闭包，该闭包筛选给定请求或控制台命令的所有数据。如果闭包返回 `true`，则 Telescope 将记录所有条目：

```php
use Illuminate\Support\Collection;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->hideSensitiveRequestDetails();

    Telescope::filterBatch(function (Collection $entries) {
        if ($this->app->environment('local')) {
            return true;
        }

        return $entries->contains(function (IncomingEntry $entry) {
            return $entry->isReportableException() ||
                $entry->isFailedJob() ||
                $entry->isScheduledTask() ||
                $entry->isSlowQuery() ||
                $entry->hasMonitoredTag();
            });
    });
}
```

## 标记

Telescope 允许您通过“标签”搜索条目。通常，标签是 Eloquent 模型类名或认证用户 ID，Telescope 会自动添加到条目中。偶尔，您可能想要将自己的自定义标签附加到条目上。为此，您可以使用 `Telescope::tag` 方法。`tag` 方法接受一个闭包，该闭包应返回一个标签数组。闭包返回的标签将与 Telescope 自动附加到条目的任何标签合并。通常，您应该在 `App\Providers\TelescopeServiceProvider` 类的 `register` 方法内调用 `tag` 方法：

```php
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->hideSensitiveRequestDetails();

    Telescope::tag(function (IncomingEntry $entry) {
        return $entry->type === 'request'
                    ? ['status:'.$entry->content['response_status']]
                    : [];
    });
 }
```

## 可用监视器

Telescope “监视器”在执行请求或控制台命令时收集应用程序数据。您可以在 `config/telescope.php` 配置文件中自定义您希望启用的监视器列表：

```php
'watchers' => [
    Watchers\CacheWatcher::class => true,
    Watchers\CommandWatcher::class => true,
    ...
],
```

一些监视器还允许您提供额外的定制选项：

```php
  'watchers' => [
        Watchers\QueryWatcher::class => [
            'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
            'slow' => 100,
        ],
        ...
    ],
```

### 批处理监视器

批处理监视器记录队列中的批处理信息，包括作业和连接信息。

### 缓存监视器

缓存监视器在缓存密钥被命中、遗漏、更新或遗忘时记录数据。

### 命令监视器

命令监视器记录每次执行 Artisan 命令时的参数、选项、退出码和输出。如果您想要排除某些命令不被监视器记录，您可以在`config/telescope.php`文件中的`ignore`选项中指定命令：

```php
'watchers' => [
    Watchers\CommandWatcher::class => [
        'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
        'ignore' => ['key:generate'],
    ],
    ...
],
```

### 调试监视器

调试监视器在 Telescope 中记录并显示变量转储。使用 Laravel 时，可以使用全局`dump`函数转储变量。调试监视器标签页必须在浏览器中打开，否则转储将被监视器忽略。

### 事件监视器

事件监视器记录应用程序派发的任何事件的有效载荷、侦听器和广播数据。Laravel 框架的内部事件将被事件监视器忽略。

### 异常监视器

异常监视器记录应用程序抛出的任何可报告异常的数据和堆栈跟踪。

### 门卫监视器

门卫监视器记录应用程序的门卫和策略检查数据及结果。如果您想要排除某些能力不被监视器记录，您可以在`config/telescope.php`文件中的`ignore_abilities`选项中指定这些能力：

```php
'watchers' => [
    Watchers\GateWatcher::class => [
        'enabled' => env('TELESCOPE_GATE_WATCHER', true),
        'ignore_abilities' => ['viewNova'],
    ],
    ...
],
```

### HTTP 客户端监视器

HTTP 客户端监视器记录您的应用程序发起的传出 HTTP 客户端请求。

### 工作监视器

工作监视器记录应用程序派发的任何任务的数据和状态。

### 日志监视器

日志监视器记录应用程序编写的日志数据。

默认情况下，Telescope 只会记录`error`级别以上的日志。然而，您可以修改应用程序的`config/telescope.php`配置文件中的`level`选项来修改这种行为：

```php
'watchers' => [
    Watchers\LogWatcher::class => [
        'enabled' => env('TELESCOPE_LOG_WATCHER', true),
        'level' => 'debug',
    ],

    // ...
],
```

### 邮件监视器

邮件监视器允许您在浏览器中预览应用程序发送的电子邮件及其相关数据。您也可以将邮件下载为`.eml`文件。

### 模型监视器

模型监视器在派发 Eloquent 模型事件时记录模型更改。您可以通过监视器的`events`选项指定应记录哪些模型事件：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
    ],
    ...
],
```

如果您想要记录在给定请求期间液化的模型数量，请启用`hydrations`选项：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
        'hydrations' => true,
    ],
    ...
],
```

### 通知监视器

通知监视器记录您的应用程序发送的所有通知。如果通知触发了一封电子邮件，并且您已启用邮件监视器，该电子邮件也将在邮件监视器屏幕上可供预览。

### 查询监视器

查询监视器记录应用程序执行的所有查询的原始 SQL、绑定和执行时间。监视器还会将任何慢于 100 毫秒的查询标记为`slow`。您可以使用监视器的`slow`选项自定义慢查询阈值：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 50,
    ],
    ...
],
```

### Redis 监视器

Redis 监视器记录您的应用程序执行的所有 Redis 命令。如果您使用 Redis 进行缓存，缓存命令也将由 Redis 监视器记录。

### 请求监视器

请求监视器记录应用程序处理的任何请求的请求、头部、会话和相应数据。您可以通过`size_limit`（单位为千字节）选项限制记录的响应数据：

```php
'watchers' => [
    Watchers\RequestWatcher::class => [
        'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
        'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
    ],
    ...
],
```

### 调度监视器

调度监视器记录您的应用程序运行的任何[计划任务](/docs/11/digging-deeper/scheduling)的命令和输出。

### 视图监视器

视图监视器记录渲染视图时使用的[视图](/docs/11/basics/views)名称、路径、数据和"组合器"。

## 显示用户头像

Telescope 仪表板显示在保存某个条目时认证的用户的用户头像。默认情况下，Telescope 将使用 Gravatar 网络服务检索头像。然而，您可以通过在`App\Providers\TelescopeServiceProvider`类中注册回调来自定义头像 URL。回调将接收用户的 ID 和电子邮件地址，并应返回用户的头像图片 URL：

```php
use App\Models\User;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用程序服务。
 */
public function register(): void
{
    // ...

    Telescope::avatar(function (string $id, string $email) {
        return '/avatars/'.User::find($id)->avatar_path;
    });
}

```
