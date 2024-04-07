# 发布说明

[[toc]]

## 版本控制方案

Laravel 及其其他第一方包遵循 [语义化版本控制](https://semver.org)。主要框架版本每年发布一次（约 Q1），而小版本和补丁版本可能每周发布一次。小版本和补丁版本应**永不**包含破坏性更改。

在您的应用程序或包中引用 Laravel 框架或其组件时，您应始终使用版本约束，如 `^11.0`，因为 Laravel 的主要版本确实包含破坏性更改。然而，我们努力始终确保您可以在一天或更短时间内更新到新的主要版本。

#### 命名参数

命名参数不在 Laravel 的向后兼容性指南中。我们可能会在必要时重命名函数参数，以改进 Laravel 代码库。因此，使用命名参数调用 Laravel 方法时应谨慎，并理解参数名称可能在将来更改。

## 支持政策

对于所有 Laravel 版本，我们为期 18 个月提供错误修复，为期 2 年提供安全修复。对于所有其他库，包括 Lumen，只有最新的主要版本接收错误修复。此外，请查看 Laravel [支持的数据库版本](/docs/{{version}}/database#introduction)。

```table
| 版本 | PHP (*) | 发布日期 | 错误修复截止日期 | 安全修复截止日期 |
| --- | --- | --- | --- | --- |
| 9 | 8.0 - 8.2 | 2022年2月8日 | 2023年8月8日 | 2024年2月6日 |
| 10 | 8.1 - 8.3 | 2023年2月14日 | 2024年8月6日 | 2025年2月4日 |
| 11 | 8.2 - 8.3 | 2024年3月12日 | 2025年9月3日 | 2026年3月12日 |
| 12 | 8.2 - 8.3 | 2025年第一季度 | 2026年第三季度 | 2027年第一季度 |
```

## Laravel 11

Laravel 11 在 Laravel 10.x 的改进基础上继续发展，引入了简化的应用结构、每秒速率限制、健康路由、优雅的加密密钥轮换、队列测试改进、[Resend](https://resend.com) 邮件传输、Prompt 验证器集成、新的 Artisan 命令等。此外，引入了 Laravel Reverb，一个第一方、可扩展的 WebSocket 服务器，为您的应用程序提供强大的实时功能。

### PHP 8.2

Laravel 11.x 要求最低 PHP 版本为 8.2。

### 简化的应用结构

_Laravel 的简化应用结构由 [Taylor Otwell](https://github.com/taylorotwell) 和 [Nuno Maduro](https://github.com/nunomaduro) 开发_。

Laravel 11 为**新** Laravel 应用引入了简化的应用结构，无需对现有应用程序进行任何更改。新的应用结构旨在提供更精简、更现代的体验，同时保留 Laravel 开发人员已经熟悉的许多概念。下面我们将讨论 Laravel 新应用结构的亮点。

#### 应用引导文件

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

#### 服务提供者

与默认的 Laravel 应用结构包含五个服务提供者不同，Laravel 11 只包含一个 `AppServiceProvider`。之前的服务提供者的功能已经合并到 `bootstrap/app.php` 中，由框架自动处理，或者可以放在应用程序的 `AppServiceProvider` 中。

#### 可选 API 和广播路由

```shell
php artisan install:api

php artisan install:broadcasting
```

#### 中间件

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(
        except: ['stripe/*']
    );

    $middleware->web(append: [
        EnsureUserIsSubscribed::class,
    ])
})
```

#### 调度

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->daily();
```

#### 异常处理

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReport(MissedFlightException::class);

    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

#### 基础 `Controller` 类

```php
<?php

namespace App\Http\Controllers;

abstract class Controller
{
    //
}
```

#### 应用默认值

默认情况下，新的 Laravel 应用使用 SQLite 进行数据库存储，以及 Laravel 的会话、缓存和队列的 `database` 驱动。这允许您在创建新的 Laravel 应用后立即开始构建您的应用程序，无需安装额外的软件或创建额外的数据库迁移。

### Laravel Reverb

_Laravel Reverb 由 [Joe Dixon](https://github.com/joedixon) 开发_。

```shell
php artisan reverb:start
```

### 每秒速率限制

```php
RateLimiter::for('invoices', function (Request $request) {
    return Limit::perSecond(1);
});
```

### 健康路由

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

### 优雅的加密密钥轮换

### 自动密码重哈希

### Prompt 验证

```php
$name = text('What is your name?', validate: [
    'name' => 'required|min:3|max:255',
]);
```

### 队列交互测试

```php
use App\Jobs\ProcessPodcast;

$job = (new ProcessPodcast)->withFakeQueueInteractions();

$job->handle();

$job->assertReleased(delay: 30);
```

### 新的 Artisan 命令

```shell
php artisan make:class
php artisan make:enum
php artisan make:interface
php artisan make:trait
```

### 模型转换改进

```php
/**
 * Get the attributes that should be cast.
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::using(OptionCollection::class),
                  // AsEncryptedCollection::using(OptionCollection::class),
                  // AsEnumArrayObject::using(OptionEnum::class),
                  // AsEnumCollection::using(OptionEnum::class),
    ];
}
```

### `once` 函数

```php
function random(): int
{
    return once(function () {
        return random_int(1, 1000);
    });
}

random(); // 123
random(); // 123 (cached result)
random(); // 123 (cached result)
```

### 改进的内存数据库测试性能

### 改进的 MariaDB 支持

### 数据库检查和改进的架构操作

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```
