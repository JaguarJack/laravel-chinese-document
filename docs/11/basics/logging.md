---
title: Laravel 日志记录
---

# 日志记录

[[toc]]

## 简介

为了帮助您了解应用程序中发生的情况，Laravel 提供了健壮的日志服务，允许您将消息记录到文件、系统错误日志，甚至发送到 Slack 以通知您的整个团队。

Laravel 日志基于“渠道”概念。每个渠道代表一种特定的日志信息记录方式。例如，`single` 渠道将日志文件写入单个日志文件，而 `slack` 渠道则将日志消息发送到 Slack。基于它们的严重性，日志消息可能会写入多个渠道。

在底层，Laravel 使用了 [Monolog](https://github.com/Seldaek/monolog) 库，它支持多种强大的日志处理器。Laravel 让配置这些处理器变得非常简单，允许您混合搭配它们来自定义应用程序的日志处理。

## 配置

控制应用程序日志行为的所有配置选项都位于 `config/logging.php` 配置文件中。该文件允许您配置应用程序的日志渠道，因此请务必检查每个可用的渠道及其选项。我们将在下面回顾一些常见的选项。

默认情况下，Laravel 在记录消息时会使用 `stack` 渠道。`stack` 渠道用于将多个日志渠道聚合到一个渠道中。有关构建堆栈的更多信息，请查看[下方文档](#building-log-stacks)。

### 可用的渠道驱动

每个日志渠道都由一个“驱动”驱动。驱动确定日志消息的记录方式和位置。以下日志渠道驱动在每个 Laravel 应用程序中都可用。大多数驱动的条目已经存在于您应用程序的 `config/logging.php` 配置文件中，因此请务必检查此文件以了解其内容：

| 名称         | 描述                                                   |
| ------------ | ------------------------------------------------------ |
| `custom`     | 调用指定工厂创建渠道的驱动                             |
| `daily`      | 基于 `RotatingFileHandler` 的 Monolog 驱动，它每天轮换 |
| `errorlog`   | 基于 `ErrorLogHandler` 的 Monolog 驱动                 |
| `monolog`    | Monolog 工厂驱动，可使用任何支持的 Monolog 处理器      |
| `papertrail` | 基于 `SyslogUdpHandler` 的 Monolog 驱动                |
| `single`     | 基于单个文件或路径的记录器渠道（`StreamHandler`）      |
| `slack`      | 基于 `SlackWebhookHandler` 的 Monolog 驱动             |
| `stack`      | 用于创建“多渠道”渠道的包装器                           |
| `syslog`     | 基于 `SyslogHandler` 的 Monolog 驱动                   |

[!NOTE]

> 查看有关[高级渠道自定义](#monolog-channel-customization)的文档，了解更多关于 `monolog` 和 `custom` 驱动的信息。

#### 配置渠道名称

默认情况下，Monolog 会根据当前环境（如 `production` 或 `local`）匹配的“渠道名称”进行实例化。要更改此值，您可以在渠道配置中添加一个 `name` 选项：

```php
'stack' => [
    'driver' => 'stack',
    'name' => 'channel-name',
    'channels' => ['single', 'slack'],
],
```

### 渠道前提条件

#### 配置 Single 和 Daily 渠道

`single` 和 `daily` 渠道有三个可选配置选项：`bubble`、`permission` 和 `locking`。

| 名称         | 描述                                 | 默认值  |
| ------------ | ------------------------------------ | ------- |
| `bubble`     | 指示消息在处理后是否应冒泡到其他渠道 | `true`  |
| `locking`    | 尝试在写入日志文件之前对其加锁       | `false` |
| `permission` | 日志文件的权限                       | `0644`  |

此外，`daily` 渠道的保留策略可以通过 `LOG_DAILY_DAYS` 环境变量或设置 `days` 配置选项进行配置。

| 名称   | 描述                     | 默认值 |
| ------ | ------------------------ | ------ |
| `days` | 应保留每日日志文件的天数 | `7`    |

#### 配置 Papertrail 渠道

`papertrail` 渠道需要 `host` 和 `port` 配置选项。这些可以通过 `PAPERTRAIL_URL` 和 `PAPERTRAIL_PORT` 环境变量定义。您可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获得这些值。

#### 配置 Slack 渠道

`slack` 渠道需要一个 `url` 配置选项。该值可通过 `LOG_SLACK_WEBHOOK_URL` 环境变量定义。此 URL 应与您为 Slack 团队配置的[传入 Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) 的 URL 相匹配。

默认情况下，Slack 只会接收 `critical` 级别以上的日志；但是，您可以使用 `LOG_LEVEL` 环境变量或修改 Slack 日志渠道配置数组中的 `level` 配置选项来调整这一点。

### 记录弃用警告

PHP、Laravel 和其他库经常通知他们的用户一些功能已经被弃用，并将在未来的版本中被删除。如果您想记录这些弃用警告，您可以使用 `LOG_DEPRECATIONS_CHANNEL` 环境变量，或在应用程序的 `config/logging.php` 配置文件中指定您偏好的 `deprecations` 日志渠道：

```php
'deprecations' => [
    'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
    'trace' => env('LOG_DEPRECATIONS_TRACE', false),
],

'channels' => [
    // ...
]
```

或者，您可以定义一个名为 `deprecations` 的日志渠道。如果存在带此名称的日志渠道，它将始终用于记录弃用：

```php
'channels' => [
    'deprecations' => [
        'driver' => 'single',
        'path' => storage_path('logs/php-deprecation-warnings.log'),
    ],
],
```

## 构建日志堆栈

如前所述，`stack` 驱动允许您将多个渠道组合成一个日志渠道以便于管理。为了说明如何使用日志堆栈，让我们来看一个您可能在生产应用程序中看到的示例配置：

```php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['syslog', 'slack'], // [tl! add]
        'ignore_exceptions' => false,
    ],

    'syslog' => [
        'driver' => 'syslog',
        'level' => env('LOG_LEVEL', 'debug'),
        'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
        'replace_placeholders' => true,
    ],

    'slack' => [
        'driver' => 'slack',
        'url' => env('LOG_SLACK_WEBHOOK_URL'),
        'username' => env('LOG_SLACK_USERNAME', 'Laravel Log'),
        'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
        'level' => env('LOG_LEVEL', 'critical'),
        'replace_placeholders' => true,
    ],
],
```

让我们分析一下这个配置。首先，注意我们的 `stack` 渠道通过它的 `channels` 选项聚合了两个其他渠道：`syslog` 和 `slack`。因此，在记录消息时，这两个渠道都有机会记录该消息。但是，如我们下面将看到的，这些渠道是否实际记录消息可能由消息的严重性/“等级”决定。

#### 日志等级

注意上面示例中 `syslog` 和 `slack` 渠道配置上的 `level` 配置选项。此选项决定了消息必须达到的最低“等级”才能被渠道记录。Monolog（为 Laravel 的日志服务提供支持）提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424) 中定义的所有日志等级。按严重性降序排列，这些日志等级是：**emergency（紧急）**、**alert（警告）**、**critical（关键）**、**error（错误）**、**warning（警告）**、**notice（通知）**、**info（信息）** 和 **debug（调试）**。

因此，设想我们使用 `debug` 方法记录一条消息：

```php
Log::debug('An informational message.');
```

根据我们的配置，`syslog` 渠道将把消息写入系统日志；然而，由于错误消息不是 `critical` 级别或以上，它不会被发送到 Slack。但是，如果我们记录一个 `emergency` 消息，它将被发送到系统日志和 Slack，因为 `emergency` 级别高于这两个渠道的最低等级阈值：

```php
Log::emergency('The system is down!');
```

## 写入日志消息

您可以使用 `Log` [facade（门面）](/docs/11/architecture-concepts/facades) 将信息写入日志。如前所述，记录器提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424) 中定义的八个日志等级：**emergency（紧急）**、**alert（警告）**、**critical（关键）**、**error（错误）**、**warning（警告）**、**notice（通知）**、**info（信息）** 和 **debug（调试）**：

```php
use Illuminate\Support\Facades\Log;

Log::emergency($message);
Log::alert($message);
Log::critical($message);
Log::error($message);
Log::warning($message);
Log::notice($message);
Log::info($message);
Log::debug($message);
```

您可以调用任何这些方法来记录相应等级的消息。默认情况下，消息将写入由您的 `logging` 配置文件配置的默认日志渠道：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 为给定用户显示个人资料。
     */
    public function show(string $id): View
    {
        Log::info('显示用户个人资料，用户ID: {id}', ['id' => $id]);

        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

### 上下文信息

可以将上下文数据数组传递给日志方法。这些上下文数据将被格式化并与日志消息一起显示：

```php
use Illuminate\Support\Facades\Log;

Log::info('用户 {id} 登录失败。', ['id' => $user->id]);
```

有时，您可能希望指定某些应该包含在特定渠道后续所有日志条目中的上下文信息。例如，您可能希望记录与应用程序的每个传入请求相关联的请求 ID。为此，您可以调用 `Log` facade 的 `withContext` 方法：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();

        Log::withContext([
            'request-id' => $requestId
        ]);

        $response = $next($request);

        $response->headers->set('Request-Id', $requestId);

        return $response;
    }
}
```

如果您希望在 _所有_ 日志渠道中共享上下文信息，您可以调用 `Log::shareContext()` 方法。此方法将为所有创建的渠道以及随后创建的任何渠道提供上下文信息：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();

        Log::shareContext([
            'request-id' => $requestId
        ]);

        // ...
    }
}
```

[!NOTE]

> 如果您需要在处理队列作业时共享日志上下文，您可以使用[作业中间件](/docs/11/digging-deeper/queues#job-middleware)。

### 写入特定渠道

有时您可能希望将消息记录到应用程序的默认渠道以外的其他渠道。您可以使用 `Log` facade 的 `channel` 方法检索并记录到配置文件中定义的任何渠道：

```php
use Illuminate\Support\Facades\Log;

Log::channel('slack')->info('发生了一些事情！');
```

如果您想要创建一个由多个渠道组成的即时日志堆栈，您可以使用 `stack` 方法：

```php
Log::stack(['single', 'slack'])->info('发生了一些事情！');
```

#### 按需渠道

也可以通过在运行时提供配置来创建一个即时渠道，而无需该配置在应用程序的 `logging` 配置文件中。为此，您可以将配置数组传递给 `Log` facade 的 `build` 方法：

```php
use Illuminate\Support\Facades\Log;

Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
])->info('发生了一些事情！');
```

您可能还希望在即时日志堆栈中包含一个即时渠道。这可以通过在传递给 `stack` 方法的数组中包含您的即时渠道实例来实现：

```php
use Illuminate\Support\Facades\Log;

$channel = Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
]);

Log::stack(['slack', $channel])->info('发生了一些事情！');
```

## Monolog 渠道自定义

### 为渠道自定义 Monolog

有时您可能需要完全控制 Monolog 的配置，以便用于现有渠道。例如，您可能想为 Laravel 内置的 `single` 渠道配置自定义 Monolog `FormatterInterface` 实现。

首先，在渠道的配置中定义一个 `tap` 数组。`tap` 数组应该包含有机会在创建 Monolog 实例后自定义（或“tap”） Monolog 实例的类列表。这些类的放置位置没有固定的规定，您可以在应用程序中创建一个目录来包含这些类：

```php
'single' => [
    'driver' => 'single',
    'tap' => [App\Logging\CustomizeFormatter::class],
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'replace_placeholders' => true,
],
```

配置完 `tap` 选项后，您可以定义将自定义 Monolog 实例的类。这个类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例将所有方法调用代理到底层 Monolog 实例：

```php
<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\LineFormatter;

class CustomizeFormatter
{
    /**
     * 自定义给定的日志记录器实例。
     */
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(new LineFormatter(
                '[%datetime%] %channel%.%level_name%: %message% %context% %extra%'
            ));
        }
    }
}
```

[!NOTE]

> 您的所有 "tap" 类都是由[服务容器](/docs/11/architecture-concepts/container)解析的，因此它们所需的任何构造函数依赖关系都会自动被注入。

### 创建 Monolog 处理器渠道

Monolog 有多种[可用的处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Handler)，而 Laravel 并没有为每个处理器都包含内置的渠道。在某些情况下，您可能希望创建一个自定义渠道，它仅是一个没有对应 Laravel 日志驱动的特定 Monolog 处理器的实例。可以使用 `monolog` 驱动轻松创建这些渠道。

使用 `monolog` 驱动时，`handler` 配置选项用于指定将被实例化的处理器。可选地，处理器需要的任何构造函数参数可以使用 `with` 配置选项指定：

```php
'logentries' => [
    'driver'  => 'monolog',
    'handler' => Monolog\Handler\SyslogUdpHandler::class,
    'with' => [
        'host' => 'my.logentries.internal.datahubhost.company.com',
        'port' => '10000',
    ],
],
```

#### Monolog 格式化器

使用 `monolog` 驱动时，默认会使用 Monolog `LineFormatter` 作为格式化器。不过，您可以使用 `formatter` 和 `formatter_with` 配置选项来自定义传递给处理器的格式化器类型：

```php
'browser' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\BrowserConsoleHandler::class,
    'formatter' => Monolog\Formatter\HtmlFormatter::class,
    'formatter_with' => [
        'dateFormat' => 'Y-m-d',
    ],
],
```

如果您使用的是 Monolog 处理器，该处理器能够提供其自己的格式化器，则您可以将 `formatter` 配置选项的值设置为 `default`：

```php
'newrelic' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\NewRelicHandler::class,
    'formatter' => 'default',
],
```

#### Monolog 处理器

Monolog 也可以在记录日志之前处理消息。您可以创建自己的处理器或使用 Monolog 提供的[现成处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Processor)。

如果您希望为 `monolog` 驱动自定义处理器，请在您的渠道配置中添加 `processors` 配置项：

```php
'memory' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\StreamHandler::class,
    'with' => [
        'stream' => 'php://stderr',
    ],
    'processors' => [
        // 简单语法...
        Monolog\Processor\MemoryUsageProcessor::class,

        // 带选项的...
        [
           'processor' => Monolog\Processor\PsrLogMessageProcessor::class,
           'with' => ['removeUsedContextFields' => true],
       ],
    ],
],
```

### 通过工厂创建自定义渠道

如果您希望定义一个完全自定义的渠道，在该渠道中您对 Monolog 的实例化和配置有完全的控制权，您可以在 `config/logging.php` 配置文件中指定一个 `custom` 驱动类型。您的配置应包括一个 `via` 选项，该选项包含将被调用以创建 Monolog 实例的工厂类的名称：

```php
'channels' => [
    'example-custom-channel' => [
        'driver' => 'custom',
        'via' => App\Logging\CreateCustomLogger::class,
    ],
],
```

配置好 `custom` 驱动渠道后，您就可以定义创建您的 Monolog 实例的类了。这个类只需要一个 `__invoke` 方法，该方法应该返回 Monolog 记录器实例。该方法将接收渠道配置数组作为唯一参数：

```php
<?php

namespace App\Logging;

use Monolog\Logger;

class CreateCustomLogger
{
    /**
     * 创建一个自定义 Monolog 实例。
     */
    public function __invoke(array $config): Logger
    {
        return new Logger(/* ... */);
    }
}
```

## 使用 Pail 跟踪日志消息

经常您可能需要实时跟踪您的应用程序的日志。例如，调试问题或监视应用程序的日志以了解特定类型的错误。

Laravel Pail 是一个包，允许您直接从命令行轻松深入 Laravel 应用程序的日志文件。与标准的 `tail` 命令不同，Pail 旨在与任何日志驱动（包括 Sentry 或 Flare）一起工作。此外，Pail 提供了一组有用的过滤器，帮助您快速找到所需的内容。

![Pail 示例图片](https://laravel.com/img/docs/pail-example.png)

### 安装

> [!WARNING]：
> Laravel Pail 需要 [PHP 8.2+](https://php.net/releases/) 和 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) 扩展。

要开始，请使用 Composer 包管理器将 Pail 安装到您的项目中：

```bash
composer require laravel/pail
```

### 使用

要开始跟踪日志，请运行 `pail` 命令：

```bash
php artisan pail
```

要增加输出的详细程度并避免截断（…），使用 `-v` 选项：

```bash
php artisan pail -v
```

要获得最大的详细程度并显示异常堆栈跟踪，请使用 `-vv` 选项：

```bash
php artisan pail -vv
```

要停止跟踪日志，随时按 `Ctrl+C`。

### 过滤日志

#### `--filter`

您可以使用 `--filter` 选项按类型、文件、消息和堆栈跟踪内容过滤日志：

```bash
php artisan pail --filter="QueryException"
```

#### `--message`

要仅按消息过滤日志，您可以使用 `--message` 选项：

```bash
php artisan pail --message="User created"
```

#### `--level`

`--level` 选项可用于按[日志级别](#log-levels)过滤日志：

```bash
php artisan pail --level=error
```

#### `--user`

要仅显示在特定用户认证时写入的日志，您可以将用户的 ID 提供给 `--user` 选项：

```bash
php artisan pail --user=1
```
