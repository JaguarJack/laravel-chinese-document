---
title: Laravel 发布说明
---

# 发布说明

[[toc]]

## 版本号规则

Laravel 及其其他官方包遵循语义化版本。每年发布一次主要框架版本（大约在每年第一季度），而次要和补丁版本可能每周发布一次。次要和补丁版本绝不会包含破坏性变更。

当您从应用程序或包中引用 Laravel 框架或其组件时，应始终使用诸如 `^11.0` 的版本约束，因为 Laravel 的主要发布版本确实包含了破坏性变更。但是，我们始终努力确保您可以在一天或更短的时间内更新到新的主要版本。

## 支持政策

对于所有 Laravel 发布版本，提供 18 个月的错误修复支持和 2 年的安全修复支持。对于所有其他附加库，包括 Lumen，只有最新的主要版本会接收错误修复。此外，请查看 Laravel 支持的数据库版本。

| 版本 | PHP (\*)  | 发布日期           | 错误修复支持截止日期 | 安全修复支持截止日期 |
| ---- | --------- | ------------------ | -------------------- | -------------------- |
| 9    | 8.0 - 8.2 | 2022 年 2 月 8 日  | 2023 年 8 月 8 日    | 2024 年 2 月 6 日    |
| 10   | 8.1 - 8.3 | 2023 年 2 月 14 日 | 2024 年 8 月 6 日    | 2025 年 2 月 4 日    |
| 11   | 8.2 - 8.3 | 2024 年 3 月 12 日 | 2025 年 9 月 3 日    | 2026 年 3 月 12 日   |
| 12   | 8.2 - 8.3 | 2025 年第一季度    | 2026 年第三季度      | 2027 年第一季度      |

(\*) 支持的 PHP 版本

## Laravel 11

Laravel 11 在 Laravel 10.x 基础上进一步改进，引入了简化的应用程序结构、每秒速率限制、健康路由、优雅的加密密钥轮换、队列测试改进、Resend 邮件传输、Prompt 验证器集成、新的 Artisan 命令等。此外，Laravel Reverb，一个官方的可扩展 WebSocket 服务器，已被引入，为您的应用程序提供强大的实时功能。

### PHP 8.2

Laravel 11.x 要求最低 PHP 版本为 8.2。

### 简化的应用程序结构

Laravel 11 引入了简化的应用程序结构，适用于**新的** Laravel 应用程序，无需对现有应用程序进行任何更改。新的应用程序结构旨在提供更精简、更现代的体验，同时保留 Laravel 开发人员已经熟悉的许多概念。以下是 Laravel 新应用程序结构的重点介绍。

#### 应用程序引导文件

`bootstrap/app.php` 文件已经更新为一个代码优先的应用程序配置文件。从这个文件中，您现在可以定制应用程序的路由、中间件、服务提供程序、异常处理等。这个文件统一了许多之前在应用程序文件结构中散布的高级应用程序行为设置：

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

#### 服务提供程序

在 Laravel 11 中，将默认的 Laravel 应用程序结构中包含的五个服务提供程序减少到了一个 `AppServiceProvider`。以前的服务提供程序的功能已经被合并到 `bootstrap/app.php` 中，由框架自动处理，或者可以放置在您应用程序的 `AppServiceProvider` 中。

例如，默认情况下，事件发现现在已经默认启用，大大减少了事件及其监听器的手动注册的需求。然而，如果您确实需要手动注册事件，您只需在 `AppServiceProvider` 中进行注册即可。同样，您可能在 `AppServiceProvider` 中注册以前在 `AuthServiceProvider` 中注册的路由模型绑定或授权门。

#### 可选择的 API 和广播路由

不再默认包含 `api.php` 和 `channels.php` 路由文件，因为许多应用程序不需要这些文件。相反，可以使用简单的 Artisan 命令创建它们：

```shell
php artisan install:api

php artisan install:broadcasting
```

#### 中间件

以前，新的 Laravel 应用程序包含九个中间件。这些中间件执行各种任务，如验证请求、修剪输入字符串和验证 CSRF 令牌。

在 Laravel 11 中，这些中间件已经移动到框架本身，以便它们不会增加应用程序结构的体积。框架添加了用于自定义这些中间件行为的新方法，并且可以从您应用程序的 `bootstrap/app.php` 文件中调用：

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

由于所有中间件都可以轻松地通过您应用程序的 `bootstrap/app.php` 进行定制，因

此不再需要单独的 HTTP "kernel" 类。

---

#### 调度

使用新的 `Schedule` 门面，可以直接在应用程序的 `routes/console.php` 文件中定义计划任务，无需单独的控制台 "kernel" 类：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->daily();
```

#### 异常处理

与路由和中间件一样，异常处理现在可以从应用程序的 `bootstrap/app.php` 文件中定制，而不是单独的异常处理程序类，从而减少了新 Laravel 应用程序中包含的文件总数：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReport(MissedFlightException::class);

    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

#### 基础控制器类

新的 Laravel 应用程序中包含的基础控制器已经简化。它不再扩展 Laravel 的内部 `Controller` 类，并且已经删除了 `AuthorizesRequests` 和 `ValidatesRequests` trait，因为如果需要，它们可以包含在您应用程序的各个控制器中：

```php
<?php

namespace App\Http\Controllers;

abstract class Controller
{
    //
}
```

#### 应用程序默认设置

默认情况下，新的 Laravel 应用程序使用 SQLite 进行数据库存储，并且使用 `database` 驱动程序进行 Laravel 的会话、缓存和队列。这使您可以在创建新的 Laravel 应用程序后立即开始构建应用程序，而无需安装其他软件或创建其他数据库迁移。

此外，随着时间的推移，这些 Laravel 服务的 `database` 驱动程序已经变得足够健壮，可以在许多应用程序环境中用于生产使用；因此，它们为本地和生产应用程序提供了一个明智且统一的选择。

### Laravel Reverb

[Laravel Reverb](https://reverb.laravel.com) 提供了快速可扩展的实时 WebSocket 通信功能，直接集成到您的 Laravel 应用程序中，并与 Laravel Echo 等现有的一套事件广播工具无缝集成。

```shell
php artisan reverb:start
```

此外，Reverb 还支持通过 Redis 的发布/订阅功能进行水平扩展，允许您在多个后端 Reverb 服务器之间分发您的 WebSocket 流量，以支持单个、高需求的应用程序。

有关 Laravel Reverb 的更多信息，请查阅完整的[Reverb 文档](/docs/11/packages/reverb)。

### 每秒速率限制

Laravel 现在支持对所有速率限制器（包括 HTTP 请求和排队作业的速率限制器）进行“每秒”速率限制。以前，Laravel 的速率限制器仅限于“每分钟”的粒度：

```php
RateLimiter::for('invoices', function (Request $request) {
    return Limit::perSecond(1);
});
```

有关 Laravel 中速率限制的更多信息，请查看[速率限制文档](/docs/11/basics/routing#rate-limiting)。

### 健康路由

新的 Laravel 11 应用程序包括一个 `health` 路由指令，指示 Laravel 定义一个简单的健康检查端点，可以由第三方应用程序健康监控服务或诸如 Kubernetes 之类的编排系统调用。默认情况下，此路由在 `/up` 处提供：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

当对此路由发出 HTTP 请求时，Laravel 还将调度一个 `DiagnosingHealth` 事件，允许您执行与您的应用程序相关的其他健康检查。

### 优雅的加密密钥轮换

由于 Laravel 对所有 cookie（包括您应用程序的会话 cookie）进行了加密，因此实际上每个对 Laravel 应用程序的请求都依赖于加密。然而，由于这一点，轮换应用程序的加密密钥会导致您应用程序中的所有用户都注销。此外，解密使用上一个加密密钥加密的数据将变得不可能。

Laravel 11 允许您将应用程序的以前的加密密钥定义为逗号分隔的列表，通过 `APP_PREVIOUS_KEYS` 环境变量。

在加密值时，Laravel 总是使用“当前”的加密密钥，即在 `APP_KEY` 环境变量中。在解密值时，Laravel 首先尝试使用当前密钥。如果使用当前密钥解密失败，Laravel 将尝试使用所有先前的密钥，直到其中一个密钥能够解密该值。

这种优雅的解密方式允许用户在加密密钥轮换后继续无缝使用您的应用程序。

有关 Laravel 中加密的更多信息，请查看[加密文档](/docs/11/security/encryption)。

### 自动密码重新散列

Laravel 的默认密码哈希算法是 bcrypt。随着 CPU / GPU 处理能力的增加，bcrypt 哈希的“工作因子”可以调整。通常情况下，随着时间的推移，应该增加 bcrypt 的工作因子。如果您增加了应用程序的 bcrypt 工作因子，Laravel 现在将优雅地自动重新散列用户密码，用户进行身份验证时会进行重新散列。

### 提示验证

[Laravel Prompts](/docs/11/packages/prompts) 是一个用于向命令行应用程序添加漂亮

且用户友好的表单的 PHP 包，具有类似于浏览器的特性，包括占位符文本和验证。

Laravel Prompts 支持通过闭包进行输入验证：

```php
$name = text(
    label: 'What is your name?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

然而，当涉及许多输入或复杂的验证场景时，这可能变得麻烦。因此，在 Laravel 11 中，您可以在验证提示输入时利用 Laravel 的完整验证器的强大功能：

```php
$name = text('What is your name?', validate: [
    'name' => 'required|min:3|max:255',
]);
```

### 队列交互测试

以前，尝试测试是否发布、删除或手动失败了排队作业是麻烦的，并且需要定义自定义队列伪造和存根。但是，在 Laravel 11 中，您现在可以使用 `withFakeQueueInteractions` 方法轻松测试这些队列交互：

```php
use App\Jobs\ProcessPodcast;

$job = (new ProcessPodcast)->withFakeQueueInteractions();

$job->handle();

$job->assertReleased(delay: 30);
```

有关测试排队作业的更多信息，请查看[队列文档](/docs/11/digging-deeper/queues#testing)。

### 新的 Artisan 命令

新的 Artisan 命令已添加，以便快速创建类、枚举、接口和特性：

```shell
php artisan make:class
php artisan make:enum
php artisan make:interface
php artisan make:trait
```

### 模型转换改进

Laravel 11 支持使用方法而不是属性来定义模型的转换。这样可以更流畅地定义转换，特别是当与带参数的转换一起使用时：

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

有关属性转换的更多信息，请查看[Eloquent 文档](/docs/11/eloquent/eloquent-mutators#attribute-casting)。

### `once` 函数

`once` 辅助函数执行给定的回调，并将结果缓存到内存中，直到请求结束。对 `once` 函数使用相同回调的任何后续调用将返回先前缓存的结果：

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

有关 `once` 辅助函数的更多信息，请查看[帮助文档](/docs/11/packages/reverb#method-once)。

### 使用内存数据库进行测试的性能改进

在使用 `:memory:` SQLite 数据库进行测试时，Laravel 11 提供了显着的速度提升。为了实现这一点，Laravel 现在维护对 PHP 的 PDO 对象的引用，并在连接之间重用它，通常可以将总测试运行时间减少一半。

### 对 MariaDB 的改进支持

Laravel 11 包含了对 MariaDB 的改进支持。在以前的 Laravel 版本中，您可以通过 Laravel 的 MySQL 驱动程序使用 MariaDB。然而，在 Laravel 11 中，现在包含了专门的 MariaDB 驱动程序，为此数据库系统提供了更好的默认值。

有关 Laravel 数据库驱动程序的更多信息，请查看[数据库文档](/docs/11/database/database)。

### 数据库检查和改进模式操作

Laravel 11 提供了更多的数据库模式操作和检查方法，包括原生的修改、重命名和删除列。此外，还提供了高级空间类型、非默认模式名称和用于操作表、视图、列、索引和外键的原生模式方法：

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```

此外，Laravel 11 还引入了大量的小规模改进、性能优化和错误修复，以提高框架的整体质量和稳定性。有关更改的完整列表，请参阅[GitHub 发布页面](https://github.com/laravel/framework/releases/tag/v11.0.0)。
