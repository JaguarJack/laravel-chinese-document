# 门面

- [介绍](#introduction)
- [何时使用门面](#when-to-use-facades)
  - [门面 vs. 依赖注入](#facades-vs-dependency-injection)
  - [门面 vs. 助手函数](#facades-vs-helper-functions)
- [门面的工作原理](#how-facades-work)
- [实时门面](#real-time-facades)
- [门面类参考](#facade-class-reference)

## 介绍

在 Laravel 文档中，您会看到许多与 Laravel 功能交互的代码示例，这些示例通过 "门面" 与 Laravel 的特性进行交互。门面为应用程序的[服务容器](/docs/11/architecture-concepts/container)中可用的类提供了一个 "静态" 接口。Laravel 自带许多门面，它们提供了对几乎所有 Laravel 特性的访问。

Laravel 门面充当对服务容器中的基础类的 "静态代理"，提供了简洁、表达力强的语法，同时保持了比传统静态方法更多的可测试性和灵活性。如果您不完全了解门面是如何工作的，也没关系，只需跟着流程继续学习 Laravel。

所有 Laravel 的门面都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以轻松地访问门面，如下所示：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在 Laravel 文档中，许多示例将使用门面来演示框架的各种特性。

#### 助手函数

为了补充门面，Laravel 提供了各种全局 "助手函数"，使与常见的 Laravel 特性交互变得更加简单。您可能会与一些常见的助手函数进行交互，如 `view`、`response`、`url`、`config` 等。每个 Laravel 提供的助手函数都有其相应特性的文档；然而，您可以在专门的 [助手文档](/docs/11/digging-deeper/reverb) 中找到完整的列表。

例如，我们可以使用 `response` 函数来生成 JSON 响应，而不是使用 `Illuminate\Support\Facades\Response` 门面：

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

## 何时使用门面

门面有许多优点。它们提供了简洁、易记的语法，允许您使用 Laravel 的特性，而无需记住必须手动注入或配置的长类名。此外，由于它们对 PHP 的动态方法的独特使用，它们易于测试。

然而，在使用门面时，必须谨慎。门面的主要危险在于类 "作用域蔓延"。由于门面非常容易使用，并且不需要注入，因此很容易让您的类继续增长，并在单个类中使用许多门面。使用依赖注入时，一个很大的构造函数会给出明显的视觉反馈，告诉您的类正在变得过大。因此，在使用门面时，特别注意类的大小，以确保其责任范围保持窄。如果您的类变得太大，考虑将其拆分为多个较小的类。

### 门面 vs. 依赖注入

依赖注入的主要优点之一是能够替换注入类的实现。这在测试过程中非常有用，因为您可以注入一个模拟或存根，并断言在存根上调用了各种方法。

通常情况下，不可能模拟或存根一个真正的静态类方法。然而，由于门面使用动态方法将方法调用代理到从服务容器中解析出的对象，我们实际上可以像测试注入的类实例一样测试门面。例如，考虑以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的门面测试方法，我们可以编写以下测试来验证我们预期的参数调用了 `Cache::get` 方法：

```php
use Illuminate\Support\Facades\Cache;

test('基本示例', function () {
    Cache::shouldReceive('get')
         ->with('key')
         ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
});
```

### 门面 vs. 助手函数

除了门面之外，Laravel 还包括各种 "助手" 函数，可以执行常见的任务，如生成视图、触发事件、调度作业或发送 HTTP 响应。许多这些助手函数执行与相应门面相同的功能。例如，这个门面调用和助手调用是等价的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

门面和助手函数之间没有实际区别。当使用助手函数时，您仍然可以像测试相应门面一样测试它们。例如，考虑以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 助手将调用 `Cache` 门面底层的 `get` 方法。因此，即使我们使用助手函数，我们仍然可以编写以下测试来验证使用预期的参数调用了该方法：

```php
use Illuminate\Support\Facades\Cache;

/**
 * A basic functional test example.
 */
public function test_basic_example(): void
{
    Cache::shouldReceive('get')
         ->

with('key')
         ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
}
```

## 门面的工作原理

在 Laravel 应用程序中，门面是一个类，提供对容器中的对象的访问。使这一切工作的机制在于 `Facade` 类。Laravel 的门面以及您创建的任何自定义门面都将扩展基础的 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基类利用了 `__callStatic()` 魔术方法，将您的门面的调用推迟到从容器中解析出的对象。在下面的示例中，对 Laravel 缓存系统进行了调用。通过查看此代码，人们可能会假设在 `Cache` 类上调用了静态 `get` 方法：

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

请注意，在文件顶部附近，我们正在 "导入" `Cache` 门面。该门面用作访问 `Illuminate\Contracts\Cache\Factory` 接口的底层实现的代理。我们使用门面进行的任何调用都将传递到 Laravel 缓存服务的底层实例。

如果我们查看 `Illuminate\Support\Facades\Cache` 类，您将会发现没有静态方法 `get`：

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

相反，`Cache` 门面扩展了基础的 `Facade` 类，并定义了 `getFacadeAccessor()` 方法。此方法的作用是返回服务容器绑定的名称。当用户引用 `Cache` 门面上的任何静态方法时，Laravel 将从[服务容器](/docs/11/architecture-concepts/container)中解析 `cache` 绑定，并针对该对象运行所请求的方法（在本例中是 `get`）。

## 实时门面

使用实时门面，您可以将应用程序中的任何类视为门面。为了说明可以如何使用它，让我们首先查看一些不使用实时门面的代码。例如，假设我们的 `Podcast` 模型具有 `publish` 方法。但是，为了发布播客，我们需要注入一个 `Publisher` 实例：

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

在方法中注入发布者实现使我们能够轻松地测试该方法，因为我们可以模拟注入的发布者。然而，这要求我们每次调用 `publish` 方法时都必须传递一个发布者实例。使用实时门面，我们可以保持相同的可测试性，同时不需要显式传递 `Publisher` 实例。要生成实时门面，请将导入类的命名空间前缀更改为 `Facades`：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher; // [tl! remove]
use Facades\App\Contracts\Publisher; // [tl! add]
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * Publish the podcast.
     */
    public function publish(Publisher $publisher): void // [tl! remove]
    public function publish(): void // [tl! add]
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this); // [tl! remove]
        Publisher::publish($this); // [tl! add]
    }
}
```

当使用实时门面时，将使用出现在 `Facades` 前缀之后的接口或类名称部分从服务容器中解析发布者实现。在测试时，我们可以使用 Laravel 内置的门面测试助手来模拟此方法调用：

```php
<?php

use App\Models\Podcast;
use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('podcast can be published', function () {
    $podcast = Podcast::factory()->create();

    Publisher::shouldReceive('publish')->once()->with($podcast);

    $podcast->publish();
});
```

## 门面类参考

以下是每个门面及其底层类。这是一个快速查找给定门面根的 API 文档的有用工具。在适用的情况下，还包括[服务容器绑定](/docs/11/architecture-concepts/container)键。

| 门面              | 类                                              | 服务容器绑定         |
| ----------------- | ----------------------------------------------- | -------------------- |
| App               | Illuminate\Foundation\Application               | app                  |
| Artisan           | Illuminate\Contracts\Console\Kernel             | artisan              |
| Auth              | Illuminate\Auth\AuthManager                     | auth                 |
| Auth（实例）      | Illuminate\Contracts\Auth\Guard                 | auth.driver          |
| Blade             | Illuminate\View\Compilers\BladeCompiler         | blade.compiler       |
| Broadcast         | Illuminate\Contracts\Broadcasting\Factory       |                      |
| Broadcast（实例） | Illuminate\Contracts\Broadcasting\Broadcaster   |                      |
| Bus               | Illuminate\Contracts\Bus\Dispatcher             |                      |
| Cache             | Illuminate\Cache\CacheManager                   | cache                |
| Cache（实例）     | Illuminate\Cache\Repository                     | cache.store          |
| Config            | Illuminate\Config\Repository                    | config               |
| Cookie            | Illuminate\Cookie\CookieJar                     | cookie               |
| Crypt             | Illuminate\Encryption\Encrypter                 | encrypter            |
| Date              | Illuminate\Support\DateFactory                  | date                 |
| DB                | Illuminate\Database\DatabaseManager             | db                   |
| DB（实例）        | Illuminate\Database\Connection                  | db.connection        |
| Event             | Illuminate\Events\Dispatcher                    | events               |
| File              | Illuminate\Filesystem\Filesystem                | files                |
| Gate              | Illuminate\Contracts\Auth\Access\Gate           |                      |
| Hash              | Illuminate\Contracts\Hashing\Hasher             | hash                 |
| Http              | Illuminate\Http\Client\Factory                  |                      |
| Lang              | Illuminate\Translation\Translator               | translator           |
| Log               | Illuminate\Log\LogManager                       | log                  |
| Mail              | Illuminate\Mail\Mailer                          | mailer               |
| Notification      | Illuminate\Notifications\ChannelManager         |                      |
| Password          | Illuminate\Auth\Passwords\PasswordBrokerManager | auth.password        |
| Password（实例）  | Illuminate\Auth\Passwords\PasswordBroker        | auth.password.broker |
| Pipeline（实例）  | Illuminate\Pipeline\Pipeline                    |                      |
| Process           | Illuminate\Process\Factory                      |                      |
| Queue             | Illuminate\Queue\QueueManager                   | queue                |
| Queue（实例）     | Illuminate\Contracts\Queue\Queue                | queue.connection     |
| Queue（基类）     | Illuminate\Queue\Queue                          |                      |
| RateLimiter       | Illuminate\Cache\RateLimiter                    |                      |
| Redirect          | Illuminate\Routing\Redirector                   | redirect             |
| Redis             | Illuminate\Redis\RedisManager                   | redis                |
| Redis（实例）     | Illuminate\Redis\Connections\Connection         | redis.connection     |
| Request           | Illuminate\Http\Request                         | request              |
| Response          | Illuminate\Contracts\Routing\ResponseFactory    |                      |
| Response（实例）  | Illuminate\Http\Response                        |                      |
| Route             | Illuminate\Routing\Router                       | router               |
| Schema            | Illuminate\Database\Schema\Builder              |                      |
| Session           | Illuminate\Session\SessionManager               | session              |
| Session（实例）   | Illuminate\Session\Store                        | session.store        |
| Storage           | Illuminate\Filesystem\FilesystemManager         | filesystem           |
| Storage（实例）   | Illuminate\Contracts\Filesystem\Filesystem      | filesystem.disk      |
| URL               | Illuminate\Routing\UrlGenerator                 | url                  |
| Validator         | Illuminate\Validation\Factory                   | validator            |
| Validator（实例） | Illuminate\Validation\Validator                 |                      |
| View              | Illuminate\View\Factory                         | view                 |
| View（实例）      | Illuminate\View\View                            |                      |
| View（无返回值）  | Illuminate\Contracts\View\View                  |                      |
