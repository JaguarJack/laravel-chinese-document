---
title: Laravel 异常处理
---

# 异常处理

[[toc]]

## 简介

当您开始一个新的 Laravel 项目时，错误和异常处理已为您配置好；但是，在任何时候，您都可以在应用程序的 `bootstrap/app.php` 中使用 `withExceptions` 方法来管理异常的报告和渲染方式。

`withExceptions` 闭包中提供的 `$exceptions` 对象是 `Illuminate\Foundation\Configuration\Exceptions` 的一个实例，它负责管理应用程序中的异常处理。我们将在本文档中进一步深入讨论这个对象。

## 配置

在您的 `config/app.php` 配置文件中的 `debug` 选项决定了向用户显示多少有关错误的信息。默认情况下，此选项设置为尊重 `.env` 文件中存储的 `APP_DEBUG` 环境变量的值。

在本地开发时，您应该将 `APP_DEBUG` 环境变量设置为 `true`。**在您的生产环境中，这个值应该始终为 `false`。如果在生产环境中将值设置为 `true`，您有可能将敏感的配置值暴露给应用程序的最终用户。**

## 处理异常

### 报告异常

在 Laravel 中，异常报告用于日志记录异常或将其发送到外部服务，如 [Sentry](https://github.com/getsentry/sentry-laravel) 或 [Flare](https://flareapp.io)。默认情况下，异常将根据您的[日志记录](/docs/11/basics/logging)配置进行记录。但是，您可以自由地以任何您希望的方式记录异常。

如果您需要以不同的方式报告不同类型的异常，您可以在应用程序的 `bootstrap/app.php` 中使用 `report` 方法注册一个闭包，当需要报告某种类型的异常时，应执行该闭包。Laravel 会通过检查闭包的类型提示来确定闭包报告的异常类型：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

当您使用 `report` 方法注册自定义异常报告回调时，Laravel 仍将使用应用程序的默认日志配置记录异常。如果您希望阻止异常传播到默认的日志记录栈，可以在定义报告回调时使用 `stop` 方法，或者从回调中返回 `false` ：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    })->stop();

    $exceptions->report(function (InvalidOrderException $e) {
        return false;
    });
})
```

[!NOTE]

> 要自定义给定异常的异常报告，您也可以使用[可报告异常](/docs/11/basics/errors#renderable-exceptions)。

#### 全局日志上下文

如果可能，Laravel 会自动将当前用户的 ID 作为上下文数据添加到每个异常的日志消息中。您可以使用应用程序的 `bootstrap/app.php` 文件中的 `context` 异常方法定义自己的全局上下文数据。此信息将包含在您应用程序编写的每个异常的日志消息中：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->context(fn () => [
        'foo' => 'bar',
    ]);
})
```

#### 异常日志上下文

虽然为每条日志消息添加上下文很有用，但有时某个特定异常可能有独特的上下文，您希望将其包含在您的日志中。通过在应用程序的一个异常上定义 `context` 方法，您可以指定应添加到该异常日志条目中的与该异常相关的任何数据：

```php
<?php

namespace App\Exceptions;

use Exception;

class InvalidOrderException extends Exception
{
    // ...

    /**
     * 获取异常的上下文信息。
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return ['order_id' => $this->orderId];
    }
}
```

#### `report` 辅助函数

有时您可能需要报告一个异常，但继续处理当前请求。`report` 辅助函数允许您快速报告一个异常而不向用户渲染错误页面：

```php
public function isValid(string $value): bool
{
    try {
        // 验证这个值...
    } catch (Throwable $e) {
        report($e);

        return false;
    }
}
```

#### 去重复报告的异常

如果您在应用程序中到处使用 `report` 函数，您可能会偶尔多次报告相同的异常，导致日志中出现重复条目。

如果您想确保单个实例的异常只被报告一次，您可以在应用程序的 `bootstrap/app.php` 文件中调用 `dontReportDuplicates` 异常方法：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReportDuplicates();
})
```

现在，当使用同一实例的异常调用 `report` 帮助器时，只有第一次调用会被报告：

```php
$original = new RuntimeException('Whoops!');

report($original); // 报告了

try {
    throw $original;
} catch (Throwable $caught) {
    report($caught); // 忽略了
}

report($original); // 忽略了
report($caught); // 忽略了
```

### 异常日志等级

当消息写入应用程序的[日志](/docs/11/basics/logging)时，消息以指定的[日志等级](/docs/11/basics/logging#log-levels)写入，这表示被记录的消息的严重性或重要性。

如上所述，即使您使用 `report` 方法注册自定义异常报告回调，Laravel 仍将使用应用程序的默认日志配置记录异常；但是，由于日志等级有时会影响消息记录的管道，您可能希望配置某些异常在哪个日志等级下被记录。

为此，您可以使用应用程序的 `bootstrap/app.php` 文件中的 `level` 异常方法。此方法将异常类型作为其第一个参数，日志等级作为其第二个参数接收：

```php
use PDOException;
use Psr\Log\LogLevel;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->level(PDOException::class, LogLevel::CRITICAL);
})
```

### 按类型忽略异常

在构建应用程序时，有些类型的异常您永远不希望报告。要忽略这些异常，您可以在应用程序的 `bootstrap/app.php` 文件中使用 `dontReport` 异常方法。此方法提供的任何类都永远不会被报告；但是，它们仍然可以有自定义的渲染逻辑：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReport([
        InvalidOrderException::class,
    ]);
})
```

在内部，Laravel 已经为您忽略了某些类型的错误，例如由于 404 HTTP 错误导致的异常或由于无效 CSRF 令牌生成的 419 HTTP 响应。如果您想指示 Laravel 停止忽略给定类型的异常，您可以在应用程序的 `bootstrap/app.php` 文件中使用 `stopIgnoring` 异常方法：

```php
use Symfony\Component\HttpKernel\Exception\HttpException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->stopIgnoring(HttpException::class);
})
```

### 渲染异常

默认情况下，Laravel 异常处理器将异常转换为 HTTP 响应。但是，您可以为给定类型的异常注册自定义渲染闭包。您可以通过在应用程序的 `bootstrap/app.php` 文件中使用 `render` 异常方法来完成此操作。

传递给 `render` 方法的闭包应返回 `Illuminate\Http\Response` 的实例，该实例可通过 `response` 辅助函数生成。Laravel 将通过检查闭包的类型提示来确定闭包渲染的异常类型：

```php
use App\Exceptions\InvalidOrderException;
use Illuminate\Http\Request;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (InvalidOrderException $e, Request $request) {
        return response()->view('errors.invalid-order', [], 500);
    });
})
```

您还可以使用 `render` 方法覆盖 Laravel 或 Symfony 内置异常的渲染行为，如 `NotFoundHttpException`。如果传递给 `render` 方法的闭包不返回值，将使用 Laravel 的默认异常渲染：

```php
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (NotFoundHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => 'Record not found.'
            ], 404);
        }
    });
})
```

#### 将异常渲染为 JSON

在渲染异常时，Laravel 会根据请求的 `Accept` 头自动确定异常应渲染为 HTML 还是 JSON 响应。如果您希望自定义 Laravel 确定是否渲染 HTML 或 JSON 异常响应的方式，您可以使用 `shouldRenderJsonWhen` 方法：

```php
use Illuminate\Http\Request;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
        if ($request->is('admin/*')) {
            return true;
        }

        return $request->expectsJson();
    });
})
```

#### 自定义异常响应

在极少数情况下，您可能需要自定义 Laravel 异常处理器渲染的整个 HTTP 响应。为此，您可以使用 `respond` 方法注册一个响应自定义闭包：

```php
use Symfony\Component\HttpFoundation\Response;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->respond(function (Response $response) {
        if ($response->getStatusCode() === 419) {
            return back()->with([
                'message' => '页面过期，请重试。',
            ]);
        }

        return $response;
    });
})
```

### 可报告和可渲染的异常

而不是在应用程序的 `bootstrap/app.php` 文件中定义自定义报告和渲染行为，您可以直接在应用程序的异常上定义 `report` 和 `render` 方法。这些方法存在时，它们将自动被框架调用：

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvalidOrderException extends Exception
{
    /**
     * 报告异常。
     */
    public function report(): void
    {
        // ...
    }

    /**
     * 将异常渲染成 HTTP 响应。
     */
    public function render(Request $request): Response
    {
        return response(/* ... */);
    }
}
```

如果您的异常扩展了已经可渲染的异常，比如内置的 Laravel 或 Symfony 异常，您可以从异常的 `render` 方法返回 `false` 来渲染异常的默认 HTTP 响应：

```php
/**
 * 将异常渲染成 HTTP 响应。
 */
public function render(Request $request): Response|bool
{
    if (/** 确定异常是否需要自定义渲染 */) {

        return response(/* ... */);
    }

    return false;
}
```

如果您的异常包含自定义报告逻辑，这些逻辑只在某些条件满足时才需要，您可能需要指示 Laravel 有时使用默认的异常处理配置来报告异常。为此，您可以从异常的 `report` 方法返回 `false`：

```php
/**
 * 报告异常。
 */
public function report(): bool
{
    if (/** 确定异常是否需要自定义报告 */) {

        // ...

        return true;
    }

    return false;
}
```

[!NOTE]

> 您可以为 `report` 方法的任何所需依赖类型提示，并且 Laravel 的[服务容器](/docs/11/architecture-concepts/container)将自动将它们注入到方法中。

### 节流报告的异常

如果您的应用程序报告了大量的异常，您可能希望限制实际记录或发送到应用程序外部错误跟踪服务的异常数量。

要对异常进行随机采样率，您可以在应用程序的 `bootstrap/app.php` 文件中使用 `throttle` 异常方法。`throttle` 方法接收一个闭包，该闭包应该返回一个 `Lottery` 实例：

```php
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        return Lottery::odds(1, 1000);
    });
})
```

也可以基于异常类型有条件地采样。如果您只想为特定异常类的实例进行采样，您可以仅为该类返回一个 `Lottery` 实例：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof ApiMonitoringException) {
            return Lottery::odds(1, 1000);
        }
    });
})
```

您还可以通过返回 `Limit` 实例而不是 `Lottery` 来限制记录或发送到外部错误跟踪服务的异常的频率。如果您想要防止突然出现的异常高峰淹没您的日志，例如，当您的应用程序使用的第三方服务宕机时，这会很有用：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300);
        }
    });
})
```

默认情况下，限制将使用异常的类作为频率限制的关键。您可以通过在 `Limit` 上指定自己的键来自定义它，使用 `by` 方法：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300)->by($e->getMessage());
        }
    });
})
```

当然，您可以为不同的异常返回 `Lottery` 和 `Limit` 的混合：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        return match (true) {
            $e instanceof BroadcastException => Limit::perMinute(300),
            $e instanceof ApiMonitoringException => Lottery::odds(1, 1000),
            default => Limit::none(),
        };
    });
})
```

## HTTP 异常

有些异常描述了来自服务器的 HTTP 错误代码。例如，这可能是一个 "页面未找到" 错误（404），一个 "未授权错误" （401），甚至是开发者生成的 500 错误。为了在应用程序中的任何位置生成这样的响应，您可以使用 `abort` 辅助函数：

```php
abort(404);
```

### 自定义 HTTP 错误页面

Laravel 让显示各种 HTTP 状态码的自定义错误页面变得简单。例如，要自定义 404 HTTP 状态码的错误页面，请创建一个 `resources/views/errors/404.blade.php` 视图模板。该视图将被渲染为应用程序生成的所有 404 错误。这个目录中的视图应以它们对应的 HTTP 状态码命名。由 `abort` 函数引发的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例将作为一个 `$exception` 变量传递到视图中：

```php
<h2>{{ $exception->getMessage() }}</h2>
```

您可以使用 `vendor:publish` Artisan 命令发布 Laravel 的默认错误页面模板。一旦这些模板被发布，您可以根据自己的喜好进行自定义：

```shell
php artisan vendor:publish --tag=laravel-errors
```

#### 回退 HTTP 错误页面

您也可以为一系列 HTTP 状态码定义一个 "fallback" 错误页面。如果不存在对应特定 HTTP 状态码的页面，则会渲染此页面。要完成此操作，请在应用程序的 `resources/views/errors` 目录中定义一个 `4xx.blade.php` 模板和一个 `5xx.blade.php` 模板。
