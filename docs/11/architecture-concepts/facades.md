---
title: Laravel Facade 门面
---

# 门面

[[toc]]

# 介绍

在 Laravel 文档中，您会看到很多通过“facades”与 Laravel 功能进行交互的代码示例。Facades 为应用程序的[服务容器](/docs/11/architecture-concepts/container)中的类提供了一个“静态”接口。Laravel 提供了许多 facades，几乎可以访问 Laravel 的所有功能。

Laravel 的 facades 充当服务容器中底层类的“静态代理”，它们提供了精简、富有表现力的语法，并保持了比传统静态方法更好的可测试性和灵活性。如果您暂时还不完全了解 facades 是如何工作的，没关系——顺其自然地继续学习 Laravel 即可。

Laravel 的所有 facades 都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以很容易地像这样访问一个 facade：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在整个 Laravel 文档中，许多示例都会使用 facades 来演示框架的各种功能。

#### 辅助函数

作为 facades 的补充，Laravel 提供了多种全局的“辅助函数”，这些函数让与常见的 Laravel 特性交互变得更加容易。您可能会用到的一些常用辅助函数包括 `view`、`response`、`url`、`config` 等等。每个 Laravel 提供的辅助函数都有对应特性的文档说明；但是，完整的列表可以在专门的[辅助函数文档](/docs/11/digging-deeper/helpers)中找到。

例如，我们可以使用 `response` 函数来生成 JSON 响应，而不是使用 `Illuminate\Support\Facades\Response` facade：

```php
use Illuminate\Support\Facades\Response;

Route::get('/users', function () {
    return Response::json([
        // ...
    ]);
});

Route::get('/users', function () {
    return response()->json([
        // ...
    ]);
});
```

## 使用 Facades 的时机

Facades 有很多好处。它们提供了简洁、便于记忆的语法，使您能够在不用记住必须手动注入或配置的长类名的情况下使用 Laravel 的功能。此外，由于它们对 PHP 动态方法的独特使用，它们很容易进行测试。

然而，在使用 facades 时需要注意。facades 的主要风险是类的“作用域蔓延”。由于 facades 很容易使用，不需要注入，所以您的类可能会越来越大，并在一个类中使用许多 facades。使用依赖注入时，通过一个大构造函数所提供的视觉反馈可以减轻这种可能性，提示您的类可能过大。因此，在使用 facades 时，请特别注意类的大小，以便其责任范围保持狭窄。如果您的类变得太大，请考虑将其拆分为多个较小的类。

### Facades vs. 依赖注入

依赖注入的主要好处之一是能够替换注入类的实现。这在测试过程中很有用，因为您可以注入一个 mock 或 stub，然后断言在 stub 上调用了各种方法。

通常，mock 或 stub 真正静态的类方法是不可能的。然而，由于 facades 使用动态方法代理服务容器中解析的对象方法调用，我们实际上可以像测试注入类实例一样测试 facades。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的 facade 测试方法，我们可以编写以下测试来验证 `Cache::get` 方法是否按照我们预期的参数被调用：

```php
use Illuminate\Support\Facades\Cache;

test('basic example', function () {
    Cache::shouldReceive('get')
         ->with('key')
         ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
});
```

### Facades vs. 辅助函数

除了 facades，Laravel 还包含了一系列用于执行常见任务的“辅助函数”，如生成视图、触发事件、派发任务或发送 HTTP 响应。许多辅助函数的功能与对应的 facade 相同。例如，以下 facade 调用和辅助函数调用是等效的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

实际上，facades 和辅助函数之间没有任何实际区别。使用辅助函数时，您可以像测试对应的 facade 一样对其进行测试。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数将调用 `Cache` facade 底层类的 `get` 方法。因此，尽管我们使用的是辅助函数，我们仍然可以编写以下测试来验证该方法是否按照我们预期的参数被调用：

```php
use Illuminate\Support\Facades\Cache;

/**
 * A basic functional test example.
 */
public function test_basic_example(): void
{
    Cache::shouldReceive('get')
         ->with('key')
         ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
}
```

## Facade 的工作原理

在一个 Laravel 应用中，一个 facade 是一个类，用于从容器提供对象的访问。使其工作的机制在 `Facade` 类中。Laravel 的 facades 及您创建的任何自定义 facades 将扩展基础的 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基类使用了 `__callStatic()` 魔术方法来将对 facade 的调用延迟到从容器解析的对象。在下面的示例中，对 Laravel 缓存系统进行了调用。一看到这段代码，人们可能会以为是在 `Cache` 类上调用了静态的 `get` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show the profile for the given user.
     */
    public function showProfile(string $id): View
    {
        $user = Cache::get('user:'.$id);

        return view('profile', ['user' => $user]);
    }
}
```

注意，文件顶部我们 "导入" 了 `Cache` facade。这个 facade 充当访问 `Illuminate\Contracts\Cache\Factory` 接口的底层实现的代理。我们使用 facade 进行的任何调用都会被传递到 Laravel 缓存服务的底层实例。

如果我们查看 `Illuminate\Support\Facades\Cache` 类，你会看到没有 `get` 静态方法：

```php
class Cache extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return 'cache';
    }
}
```

相反，`Cache` facade 扩展了基础的 `Facade` 类并定义了方法 `getFacadeAccessor()`。这个方法的职责是返回一个服务容器绑定的名称。当用户引用 `Cache` facade 上的任何静态方法时，Laravel 解析了服务容器中的 `cache` 绑定，并对该对象执行请求的方法（在这个案例中是 `get`）。

## 实时 Facades

使用实时 facades，您可以将应用程序中的任何类视为 facade。为了说明如何使用，让我们先来看一些不使用实时 facades 的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。然而，为了发布 podcast，我们需要注入一个 `Publisher` 实例：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * Publish the podcast.
     */
    public function publish(Publisher $publisher): void
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this);
    }
}
```

将发布者实现注入方法中可以让我们轻松地隔离测试该方法，因为我们可以模拟被注入的发布者。然而，它要求我们每次调用 `publish` 方法时总是传递一个发布者实例。使用实时 facades，我们可以在不需要显式传递 `Publisher` 实例的情况下保持相同的可测试性。为了生成一个实时 facade，将导入类的命名空间前缀加上 `Facades`：

```php
<?php

namespace App\Models;

// utilize Facades\App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * Publish the podcast.
     */
    public function publish(): void
    {
        $this->update(['publishing' => now()]);

        Facades\App\Contracts\Publisher::publish($this);
    }
}
```

当使用实时 facade 时，发布者实现将使用 `Facades` 前缀后面出现的接口或类名称从服务容器中解析出来。测试时，我们可以使用 Laravel 内置的 facade 测试辅助函数来模拟这个方法调用：

```php
use App\Models\Podcast;
// use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('podcast can be published', function () {
    $podcast = Podcast::factory()->create();

    Facades\App\Contracts\Publisher::shouldReceive('publish')->once()->with($podcast);

    $podcast->publish();
});
```

## Facade 类参考

下面你会找到每个 `facade` 及其底层类。这是一个快速挖掘给定 `facade` 根的 `API` 文档的有用工具。另外，适用时还包括了[服务容器绑定](/docs/11/architecture-concepts/container)键。

| Facade               | Class                                           | Service Container Binding |
| -------------------- | ----------------------------------------------- | ------------------------- |
| App                  | Illuminate\Foundation\Application               | `app`                     |
| Artisan              | Illuminate\Contracts\Console\Kernel             | `artisan`                 |
| Auth                 | Illuminate\Auth\AuthManager                     | `auth`                    |
| Auth (Instance)      | Illuminate\Contracts\Auth\Guard                 | `auth.driver`             |
| Blade                | Illuminate\View\Compilers\BladeCompiler         | `blade.compiler`          |
| Broadcast            | Illuminate\Contracts\Broadcasting\Factory       |                           |
| Broadcast (Instance) | Illuminate\Contracts\Broadcasting\Broadcaster   |                           |
| Bus                  | Illuminate\Contracts\Bus\Dispatcher             |                           |
| Cache                | Illuminate\Cache\CacheManager                   | `cache`                   |
| Cache (Instance)     | Illuminate\Cache\Repository                     | `cache.store`             |
| Config               | Illuminate\Config\Repository                    | `config`                  |
| Cookie               | Illuminate\Cookie\CookieJar                     | `cookie`                  |
| Crypt                | Illuminate\Encryption\Encrypter                 | `encrypter`               |
| Date                 | Illuminate\Support\DateFactory                  | `date`                    |
| DB                   | Illuminate\Database\DatabaseManager             | `db`                      |
| DB (Instance)        | Illuminate\Database\Connection                  | `db.connection`           |
| Event                | Illuminate\Events\Dispatcher                    | `events`                  |
| File                 | Illuminate\Filesystem\Filesystem                | `files`                   |
| Gate                 | Illuminate\Contracts\Auth\Access\Gate           |                           |
| Hash                 | Illuminate\Contracts\Hashing\Hasher             | `hash`                    |
| Http                 | Illuminate\Http\Client\Factory                  |                           |
| Lang                 | Illuminate\Translation\Translator               | `translator`              |
| Log                  | Illuminate\Log\LogManager                       | `log`                     |
| Mail                 | Illuminate\Mail\Mailer                          | `mailer`                  |
| Notification         | Illuminate\Notifications\ChannelManager         |                           |
| Password             | Illuminate\Auth\Passwords\PasswordBrokerManager | `auth.password`           |
| Password (Instance)  | Illuminate\Auth\Passwords\PasswordBroker        | `auth.password.broker`    |
| Pipeline (Instance)  | Illuminate\Pipeline\Pipeline                    |                           |
| Process              | Illuminate\Process\Factory                      |                           |
| Queue                | Illuminate\Queue\QueueManager                   | `queue`                   |
| Queue (Instance)     | Illuminate\Contracts\Queue\Queue                | `queue.connection`        |
| Queue (Base Class)   | Illuminate\Queue\Queue                          |                           |
| RateLimiter          | Illuminate\Cache\RateLimiter                    |                           |
| Redirect             | Illuminate\Routing\Redirector                   | `redirect`                |
| Redis                | Illuminate\Redis\RedisManager                   | `redis`                   |
| Redis (Instance)     | Illuminate\Redis\Connections\Connection         | `redis.connection`        |
| Request              | Illuminate\Http\Request                         | `request`                 |
| Response             | Illuminate\Contracts\Routing\ResponseFactory    |                           |
| Response (Instance)  | Illuminate\Http\Response                        |                           |
| Route                | Illuminate\Routing\Router                       | `router`                  |
| Schema               | Illuminate\Database\Schema\Builder              |                           |
| Session              | Illuminate\Session\SessionManager               | `session`                 |
| Session (Instance)   | Illuminate\Session\Store                        | `session.store`           |
| Storage              | Illuminate\Filesystem\FilesystemManager         | `filesystem`              |
| Storage (Instance)   | Illuminate\Contracts\Filesystem\Filesystem      | `filesystem.disk`         |
| URL                  | Illuminate\Routing\UrlGenerator                 | `url`                     |
| Validator            | Illuminate\Validation\Factory                   | `validator`               |
| Validator (Instance) | Illuminate\Validation\Validator                 |                           |
| View                 | Illuminate\View\Factory                         | `view`                    |
| View (Instance)      | Illuminate\View\View                            |                           |
| Vite                 | Illuminate\Foundation\Vite                      |                           |
