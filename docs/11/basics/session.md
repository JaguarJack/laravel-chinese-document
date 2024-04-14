---
title: Laravel Session 会话
---

# HTTP 会话

[[toc]]

## 介绍

由于 HTTP 驱动的应用程序是无状态的，会话提供了一种方法来存储关于用户的信息，这些信息可以跨多个请求传递。该用户信息通常放置在可以从后续请求访问的持久存储/后端中。

Laravel 随附了各种会话后端，可以通过表达式、统一的 API 来访问。支持诸如 [Memcached](https://memcached.org)、[Redis](https://redis.io) 和数据库等流行的后端。

### 配置

应用程序的会话配置文件存储在 `config/session.php` 中。确保你复查了该文件中提供的选项。默认情况下，Laravel 配置为使用 `database` 会话驱动。

会话 `driver` 配置选项定义了每个请求的会话数据将存储在哪里。Laravel 包含了各种驱动：

- `file` - 会话存储在 `storage/framework/sessions`。
- `cookie` - 会话存储在安全的加密 cookie 中。
- `database` - 会话存储在关系型数据库中。
- `memcached` / `redis` - 会话存储在这些快速的基于缓存的存储中之一。
- `dynamodb` - 会话存储在 AWS DynamoDB 中。
- `array` - 会话存储在 PHP 数组中，不会持久化。

> [!NOTE]
> array 驱动主要在 [测试](/docs/11/testing/testing) 期间使用，并且会阻止会话中存储的数据被持久化。

### 驱动先决条件

#### 数据库

使用 `database` 会话驱动时，你需要确保你有一个数据库表用于包含会话数据。通常，这包括在 Laravel 的默认 `0001_01_01_000000_create_users_table.php` [数据库迁移](/docs/11/database/migrations) 中；但是，如果由于某种原因你没有 `sessions` 表，你可以使用 `make:session-table` Artisan 命令来生成此迁移：

```shell
php artisan make:session-table

php artisan migrate
```

#### Redis

在 Laravel 中使用 Redis 会话之前，你将需要通过 PECL 安装 PhpRedis PHP 扩展或通过 Composer 安装 `predis/predis` 包（~1.0）。有关配置 Redis 的更多信息，请参阅 Laravel 的 [Redis 文档](/docs/11/database/redis#configuration)。

> [!NOTE] > `SESSION_CONNECTION` 环境变量或 `session.php` 配置文件中的 `connection` 选项可用于指定哪个 Redis 连接用于会话存储。

## 与会话交互

### 检索数据

在 Laravel 中有两种主要的方式与会话数据交互：全局 `session` 助手和通过 `Request` 实例。首先，让我们看看如何通过 `Request` 实例访问会话，它可以在路由闭包或控制器方法上进行类型提示。请记住，控制器方法依赖项是通过 Laravel [服务容器](/docs/11/architecture-concepts/container)自动注入的：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示给定用户的资料。
     */
    public function show(Request $request, string $id): View
    {
        $value = $request->session()->get('key');

        // ...

        $user = $this->users->find($id);

        return view('user.profile', ['user' => $user]);
    }
}
```

当你从会话中检索一个项时，你也可以将默认值作为第二个参数传递给 `get` 方法。如果会话中缺少指定的键，将返回此默认值。如果你给 `get` 方法传递一个默认值为闭包，并且请求的键不存在，闭包将被执行并返回其结果：

```php
$value = $request->session()->get('key', 'default');

$value = $request->session()->get('key', function () {
    return 'default';
});
```

#### 全局会话助手

你也可以使用全局 `session` PHP 函数来检索和存储会话中的数据。当 `session` 助手使用单个字符串参数调用时，它将返回那个会话键的值。当助手调用时带有一个键/值对数组时，这些值将被存储在会话中：

```php
Route::get('/home', function () {
    // 从会话中检索一段数据...
    $value = session('key');

    // 指定默认值...
    $value = session('key', 'default');

    // 在会话中存储一段数据...
    session(['key' => 'value']);
});
```

> [!NOTE]
> 使用 HTTP 请求实例与使用全局 `session` 助手使用会话之间没有多大实际差异。这两种方法都可以通过在所有的测试用例中可用的 `assertSessionHas` 方法进行 [测试](/docs/11/testing/testing)。

#### 检索所有会话数据

如果你想要检索会话中的所有数据，你可以使用 `all` 方法：

```php
$data = $request->session()->all();
```

#### 检索会话数据的一部分

`only` 和 `except` 方法可用于检索会话数据的子集：

```php
$data = $request->session()->only(['username', 'email']);

$data = $request->session()->except(['username', 'email']);
```

#### 确定会话中是否存在某项

要确定会话中是否存在某项，你可以使用 `has` 方法。如果项存在且不是 `null`，`has` 方法返回 `true`：

```php
if ($request->session()->has('users')) {
    // ...
}
```

要确定会话中是否存在某项，即使其值为 `null`，你可以使用 `exists` 方法：

```php
if ($request->session()->exists('users')) {
    // ...
}
```

要确定会话中是否缺少某项，你可以使用 `missing` 方法。如果项不存在，`missing` 方法返回 `true`：

```php
if ($request->session()->missing('users')) {
    // ...
}
```

### 存储数据

要在会话中存储数据，你通常会使用请求实例的 `put` 方法或全局 `session` 助手：

```php
// 通过请求实例...
$request->session()->put('key', 'value');

// 通过全局 "session" 助手...
session(['key' => 'value']);
```

#### 向数组会话值添加元素

如果会话值是一个数组，你可以使用 `push` 方法向其中添加新值。例如，如果 `user.teams` 键包含一个团队名称数组，你可以像这样向数组中添加一个新值：

```php
$request->session()->push('user.teams', 'developers');
```

#### 检索并删除项

`pull` 方法将检索并从会话中删除一个项：

```php
$value = $request->session()->pull('key', 'default');
```

#### 递增和递减会话值

如果你的会话数据包含你想要递增或递减的整数，则可以使用 `increment` 和 `decrement` 方法：

```php
$request->session()->increment('count');

$request->session()->increment('count', $incrementBy = 2);

$request->session()->decrement('count');

$request->session()->decrement('count', $decrementBy = 2);
```

### 闪存数据

有时你可能希望在会话中存储一些项，以便在下一个请求中使用。你可以使用 `flash` 方法来实现。使用这个方法在会话中存储的数据将立即可用并且在下一个 HTTP 请求中可用。在下一个 HTTP 请求之后，闪存的数据将被删除。闪存数据主要用于短暂的状态消息：

```php
$request->session()->flash('status', '任务成功！');
```

如果你需要在多个请求中持久化你的闪存数据，你可以使用 `reflash` 方法，它将保留所有闪存数据到额外的一个请求。如果你只需要保留特定的闪存数据，你可以使用 `keep` 方法：

```php
$request->session()->reflash();

$request->session()->keep(['username', 'email']);
```

要仅为当前请求持久化你的闪存数据，你可以使用 `now` 方法：

```php
$request->session()->now('status', '任务成功！');
```

### 删除数据

`forget` 方法将从会话中移除一个数据片段。如果你想要从会话中移除所有数据，你可以使用 `flush` 方法：

```php
// 忘记单个键...
$request->session()->forget('name');

// 忘记多个键...
$request->session()->forget(['name', 'status']);

$request->session()->flush();
```

### 重新生成会话 ID

重新生成会话 ID 通常是为了防止恶意用户对你的应用程序进行 [会话固定](https://owasp.org/www-community/attacks/Session_fixation) 攻击。

如果你使用 Laravel [应用启动器工具包](/docs/11/getting-started/starter-kits) 或 [Laravel Fortify](/docs/11/packages/fortify)，Laravel 在认证过程中会自动重新生成会话 ID；然而，如果你需要手动重新生成会话 ID，你可以使用 `regenerate` 方法：

```php
$request->session()->regenerate();
```

如果你需要重新生成会话 ID 并在一个声明中从会话中移除所有数据，你可以使用 `invalidate` 方法：

```php
$request->session()->invalidate();
```

## 会话阻塞

> [!WARNING]
> 要使用会话阻塞，你的应用程序必须使用支持 [原子锁](/docs/11/digging-deeper/cache#atomic-locks) 的缓存驱动。目前这些缓存驱动包括 `memcached`、`dynamodb`、`redis`、`database`、`file` 和 `array` 驱动。此外，你可能不使用 `cookie` 会话驱动。

默认情况下，Laravel 允许使用相同会话的请求并发执行。因此，例如，如果你使用 JavaScript HTTP 库对你的应用程序发起两个 HTTP 请求，它们将同时执行。对于许多应用程序，这不是问题；然而，在少数使用并发请求向两个不同应用端点写入数据的应用程序中，可能会发生会话数据丢失。

为了缓解这一问题，Laravel 提供了一种功能，允许你限制给定会话的并发请求。要开始，你可以简单地将 `block` 方法链到你的路由定义上。在这个示例中，对 `/profile` 端点的传入请求会获取一个会话锁。当持有此锁时，任何传入到 `/profile` 或 `/order` 端点的请求，如果共享相同的会话 ID，将等待第一个请求执行完成后再继续执行：

```php
Route::post('/profile', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10)

Route::post('/order', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10)
```

`block` 方法接受两个可选参数。`block` 方法接受的第一个参数是会话锁应持有的最长秒数，之后会话锁将被释放。当然，如果请求在这个时间之前执行完毕，锁会更早被释放。

`block` 方法接受的第二个参数是请求尝试获取会话锁时应等待的秒数。如果请求在给定的秒数内无法获取会话锁，则会抛出 `Illuminate\Contracts\Cache\LockTimeoutException` 异常。

如果这些参数都没有传递，将尝试最长 10 秒获取锁，并且请求在尝试获取锁时最多等待 10 秒：

```php
Route::post('/profile', function () {
    // ...
})->block()
```

## 添加自定义会话驱动

### 实现驱动

如果现有的会话驱动不符合你的应用程序的需要，Laravel 允许你编写自己的会话处理器。你的自定义会话驱动应该实现 PHP 内置的 `SessionHandlerInterface`。这个接口仅包含一些简单的方法。一个桩 MongoDB 实现看起来像下面这样：

```php
<?php

namespace App\Extensions;

class MongoSessionHandler implements \SessionHandlerInterface
{
    public function open($savePath, $sessionName) {}
    public function close() {}
    public function read($sessionId) {}
    public function write($sessionId, $data) {}
    public function destroy($sessionId) {}
    public function gc($lifetime) {}
}
```

> [!NOTE]
> Laravel 不附带用于存放你的扩展的目录。你可以随心所欲地放置它们。在这个例子中，我们创建了一个 `Extensions` 目录来容纳 `MongoSessionHandler`。

由于这些方法的目的不太容易理解，让我们快速地覆盖一下每个方法做什么：

- `open` 方法通常会用在基于文件的会话存储系统中。由于 Laravel 附带了一个 `file` 会话驱动，你很少需要在这个方法中放任何东西。你可以简单地让这个方法空着。
- `close` 方法，就像 `open` 方法一样，通常也可以忽略。对于大多数驱动，它不是必需的。
- `read` 方法应该返回与给定的 `$sessionId` 关联的会话数据的字符串版本。在检索或存储会话数据时，没有必要进行任何序列化或其他编码，因为 Laravel 将为你执行序列化。
- `write` 方法应该将给定的 `$data` 字符串与 `$sessionId` 关联，并写入到某些持久性存储系统中，如 MongoDB 或你选择的其他存储系统。同样，你不应该执行任何序列化 - Laravel 已经为你处理过了。
- `destroy` 方法应该从持久性存储中删除与 `$sessionId` 关联的数据。
- `gc` 方法应该销毁所有早于给定 `$lifetime` 的会话数据，`$lifetime` 是 UNIX 时间戳。对于像 Memcached 和 Redis 这样的自过期系统，这个方法可以空着。

### 注册驱动

一旦你的驱动实现完成，你就可以注册它到 Laravel 了。要向 Laravel 的会话后端添加额外的驱动，你可以使用 `Session` [facade](/docs/11/architecture-concepts/facades) 提供的 `extend` 方法。你应该在 [服务提供者](/docs/11/architecture-concepts/providers) 的 `boot` 方法中调用 `extend` 方法。你可以在现有的 `App\Providers\AppServiceProvider` 中做这个操作，或者创建一个全新的提供者：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoSessionHandler;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\ServiceProvider;

class SessionServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        Session::extend('mongo', function (Application $app) {
            // 返回一个 SessionHandlerInterface 的实现...
            return new MongoSessionHandler;
        });
    }
}
```

一旦会话驱动被注册，你可以使用 `SESSION_DRIVER` 环境变量或在应用程序的 `config/session.php` 配置文件中，指定 `mongo` 驱动作为应用程序的会话驱动。
