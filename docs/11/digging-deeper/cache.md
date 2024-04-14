---
title: Laravel 缓存
---

# 缓存

[[toc]]

## 简介

您的应用程序执行的一些数据检索或处理任务可能是 CPU 密集型的，或需要几秒钟时间才能完成。在这种情况下，通常会将检索到的数据缓存一段时间，以便在后续对同一数据的请求中能够快速检索。缓存的数据通常存储在非常快速的数据存储如 [Memcached](https://memcached.org) 或 [Redis](https://redis.io) 中。

幸运的是，Laravel 提供了一个表达丰富、统一的缓存后端 API，使您能够利用它们快速检索数据的优势，从而加速您的 Web 应用程序。

## 配置

您的应用程序的缓存配置文件位于 `config/cache.php`。在此文件中，您可以指定希望默认使用的缓存存储。Laravel 默认支持常用的缓存后端，如 [Memcached](https://memcached.org)、[Redis](https://redis.io)、[DynamoDB](https://aws.amazon.com/dynamodb)，以及关系型数据库。此外，还可用基于文件的缓存驱动程序，而`array`和"null"缓存驱动程序为您的自动化测试提供便利的缓存后端。

缓存配置文件还包含了许多其他选项，您可以查看。默认情况下，Laravel 配置为使用 `database` 缓存驱动程序，它将序列化的缓存对象存储在您的应用程序的数据库中。

### 驱动程序先决条件

#### 数据库

当使用 `database` 缓存驱动程序时，您将需要一个数据库表来包含缓存数据。通常，这已包含在 Laravel 默认的 `0001_01_01_000001_create_cache_table.php` [数据库迁移](/docs/11/database/migrations) 中；然而，如果您的应用程序不包含此迁移，您可以使用 `make:cache-table` Artisan 命令来创建它：

```shell
php artisan make:cache-table

php artisan migrate
```

#### Memcached

使用 Memcached 驱动程序需要安装 [Memcached PECL 包](https://pecl.php.net/package/memcached)。您可以在 `config/cache.php` 配置文件中列出所有的 Memcached 服务器。该文件已经包含了一个 `memcached.servers` 条目，可以让您开始使用：

```php
'memcached' => [
    // ...

    'servers' => [
        [
            'host' => env('MEMCACHED_HOST', '127.0.0.1'),
            'port' => env('MEMCACHED_PORT', 11211),
            'weight' => 100,
        ],
    ],
],
```

如需要，您可以将 `host` 选项设置为 UNIX 套接字路径。如果这样做，则 `port` 选项应设置为 `0`：

```php
'memcached' => [
    // ...

    'servers' => [
        [
            'host' => '/var/run/memcached/memcached.sock',
            'port' => 0,
            'weight' => 100
        ],
    ],
],
```

#### Redis

在使用 Redis 缓存与 Laravel 之前，您需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包（~2.0）。[Laravel Sail](/docs/11/packages/sail) 已包括此扩展。此外，官方 Laravel 部署平台如 [Laravel Forge](https://forge.laravel.com) 和 [Laravel Vapor](https://vapor.laravel.com) 默认安装了 PhpRedis 扩展。

有关配置 Redis 的更多信息，请查阅其 [Laravel 文档页面](/docs/11/database/redis#configuration)。

#### DynamoDB

在使用 [DynamoDB](https://aws.amazon.com/dynamodb) 缓存驱动程序之前，您必须创建一个 DynamoDB 表来存储所有缓存的数据。通常，此表应命名为 `cache`。但是，您应该根据 `cache` 配置文件中的 `stores.dynamodb.table` 配置值来命名表。表名也可以通过 `DYNAMODB_CACHE_TABLE` 环境变量设置。

此表还应有一个与应用程序的 `cache` 配置文件中的 `stores.dynamodb.attributes.key` 配置项值相对应的字符串分区键。默认情况下，分区键应命名为 `key`。

接下来，安装 AWS SDK，以便您的 Laravel 应用程序能够与 DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

此外，您应确保为 DynamoDB 缓存存储的配置选项提供了值。通常，这些选项，如 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`，应在应用程序的 `.env` 配置文件中定义：

```php
'dynamodb' => [
    'driver' => 'dynamodb',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
    'endpoint' => env('DYNAMODB_ENDPOINT'),
],
```

## 缓存使用

### 获取缓存实例

要获取缓存存储实例，您可以使用 `Cache` facade，这是我们在本文档中将使用的。`Cache` facade 为 Laravel 缓存契约的底层实现提供了便利、简洁的访问：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 展示应用程序的所有用户列表。
     */
    public function index(): array
    {
        $value = Cache::get('key');

        return [
            // ...
        ];
    }
}
```

#### 访问多个缓存存储

使用 `Cache` facade，您可以通过 `store` 方法访问各种缓存存储。传递给 `store` 方法的键应对应于您的 `cache` 配置文件中的 `stores` 配置数组中列出的存储之一：

```php
$value = Cache::store('file')->get('foo');

Cache::store('redis')->put('bar', 'baz', 600); // 10 分钟
```

### 从缓存中检索项目

`Cache` facade 的 `get` 方法用于从缓存中检索项目。如果缓存中不存在该项目，将返回 `null`。如果您愿意，可以向 `get` 方法传递第二个参数，指定如果项目不存在希望返回的默认值：

```php
$value = Cache::get('key');

$value = Cache::get('key', 'default');
```

您甚至可以传递一个闭包作为默认值。如果指定的项目不存在于缓存中，则会返回闭包的结果。传递闭包允许您推迟从数据库或其他外部服务检索默认值：

```php
$value = Cache::get('key', function () {
    return DB::table(/* ... */)->get();
});
```

#### 确定项目存在

`has` 方法可用于确定缓存中是否存在某个项目。如果该项目存在但其值为 `null`，此方法也将返回 `false`：

```php
if (Cache::has('key')) {
    // ...
}
```

#### 增减值

`increment` 和 `decrement` 方法可用于调整缓存中整数项目的值。这两个方法都接受一个可选的第二个参数，指示增加或减少项目值的数量：

```php
// 如果值不存在，则初始化该值...
Cache::add('key', 0, now()->addHours(4));

// 增加或减少值...
Cache::increment('key');
Cache::increment('key', $amount);
Cache::decrement('key');
Cache::decrement('key', $amount);
```

#### 检索和存储

有时您可能希望从缓存中检索一个项目，但如果请求的项目不存在，也会存储一个默认值。例如，您可能希望从缓存中检索所有用户，如果他们不存在，则从数据库中检索他们并将其添加到缓存中。您可以使用 `Cache::remember` 方法来做这件事：

```php
$value = Cache::remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

如果项目不存在于缓存中，传递给 `remember` 方法的闭包将被执行，其结果将被放入缓存中。

您可以使用 `rememberForever` 方法从缓存中检索一个项目，或者如果它不存在，则永久存储它：

```php
$value = Cache::rememberForever('users', function () {
    return DB::table('users')->get();
});
```

#### 检索和删除

如果您需要从缓存中检索一个项目，然后删除该项目，您可以使用 `pull` 方法。与 `get` 方法一样，如果缓存中不存在该项目，将返回 `null`：

```php
$value = Cache::pull('key');
```

### 存储项目到缓存中

您可以使用 `Cache` facade 上的 `put` 方法将项目存储到缓存中：

```php
Cache::put('key', 'value', $seconds = 10);
```

如果未向 `put` 方法传递存储时间，则该项目将被无限期存储：

```php
Cache::put('key', 'value');
```

除了传递秒数作为整数，您还可以传递一个 `DateTime` 实例，表示缓存项目的期望过期时间：

```php
Cache::put('key', 'value', now()->addMinutes(10));
```

#### 如果不存在则存储

`add` 方法只有在缓存存储中不存在时才会添加项目。如果项目实际添加到缓存中，则该方法将返回 `true`。否则，该方法将返回 `false`。`add` 方法是一个原子操作：

```php
Cache::add('key', 'value', $seconds);
```

#### 永久存储项目

`forever` 方法可用于永久存储缓存中的项目。由于这些项目不会过期，它们必须使用 `forget` 方法手动从缓存中移除：

```php
Cache::forever('key', 'value');
```

> [!NOTE]  
> 如果您使用的是 Memcached 驱动程序，当缓存达到大小限制时，存储的“永久”项目可能会被移除。

### 从缓存中移除项目

您可以使用 `forget` 方法从缓存中移除项目：

```php
Cache::forget('key');
```

您也可以通过提供零或负数的过期秒数来移除项目：

```php
Cache::put('key', 'value', 0);

Cache::put('key', 'value', -5);
```

您可以使用 `flush` 方法清除整个缓存：

```php
Cache::flush();
```

> [!WARNING]  
> 清除缓存不会尊重您配置的缓存 "前缀"，并将移除所有来自缓存的条目。当清除一个被其他应用程序共享的缓存时，请谨慎考虑。

### 缓存助手函数

除了使用 `Cache` facade，您还可以使用全局 `cache` 函数通过缓存检索和存储数据。当调用 `cache` 函数时，且带有单个字符串参数，它将返回给定键的值：

```php
$value = cache('key');
```

如果您向函数提供键值对数组和过期时间，则它将在指定的时长内存储缓存中的值：

```php
cache(['key' => 'value'], $seconds);

cache(['key' => 'value'], now()->addMinutes(10));
```

当调用 `cache` 函数而没有任何参数时，它返回一个 `Illuminate\Contracts\Cache\Factory` 实现的实例，允许您调用其他缓存方法：

```php
cache()->remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

> [!NOTE]  
> 当测试全局 `cache` 函数的调用时，您可以使用 `Cache::shouldReceive` 方法，就像您在 [测试 facade](/docs/11/testing/mocking#mocking-facades) 时一样。

## 原子锁

> [!WARNING]  
> 要使用此功能，您的应用程序必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动程序作为应用程序的默认缓存驱动程序。此外，所有服务器必须与相同的中心缓存服务器通信。

### 管理锁

原子锁允许在不担心竞争条件的情况下操纵分布式锁。例如，[Laravel Forge](https://forge.laravel.com) 使用原子锁确保一次只在服务器上执行一个远程任务。您可以使用 `Cache::lock` 方法来创建和管理锁：

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('foo', 10);

if ($lock->get()) {
    // 10秒内获得锁...

    $lock->release();
}
```

`get` 方法还接受一个闭包。一旦执行了闭包，Laravel 将自动释放锁：

```php
Cache::lock('foo', 10)->get(function () {
    // 10秒内获得锁并自动释放...
});
```

如果您请求时锁不可用，您可以指示 Laravel 等待指定的秒数。如果在指定的时间限制内无法获得锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException`：

```php
use Illuminate\Contracts\Cache\LockTimeoutException;

$lock = Cache::lock('foo', 10);

try {
    $lock->block(5);

    // 最多等待5秒后获得锁...
} catch (LockTimeoutException $e) {
    // 无法获得锁...
} finally {
    optional($lock)->release();
}
```

通过将闭包传递给 `block` 方法，可以简化上面的示例。当将闭包传递给这个方法时，Laravel 将尝试在指定的秒数内获得锁，并在执行闭包后自动释放锁：

```php
Cache::lock('foo', 10)->block(5, function () {
    // 最多等待5秒后获得锁...
});
```

### 跨进程管理锁

有时，您可能希望在一个进程中获得锁，并在另一个进程中释放它。例如，您可能在一个 Web 请求中获得锁，并希望在由该请求触发的队列任务结束时释放锁。在这种情况下，您应该将锁的范围 "所有者令牌" 传递给队列任务，以便任务可以使用给定的令牌重新实例化锁。

在下面的示例中，如果成功获得锁，我们将派遣一个队列任务。此外，我们将通过锁的 `owner` 方法将锁的所有者令牌传递给队列任务：

```php
$podcast = Podcast::find($id);

$lock = Cache::lock('processing', 120);

if ($lock->get()) {
    ProcessPodcast::dispatch($podcast, $lock->owner());
}
```

在我们应用程序的 `ProcessPodcast` 任务中，我们可以使用所有者令牌恢复和释放锁：

```php
Cache::restoreLock('processing', $this->owner)->release();
```

如果您希望释放锁而不尊重其当前所有者，您可以使用 `forceRelease` 方法：

```php
Cache::lock('processing')->forceRelease();
```

## 添加自定义缓存驱动程序

### 编写驱动程序

要创建我们的自定义缓存驱动程序，我们首先需要实现 `Illuminate\Contracts\Cache\Store` [合约](/docs/11/digging-deeper/contracts)。因此，一个 MongoDB 缓存实现可能看起来像这样：

```php
<?php

namespace App\Extensions;

use Illuminate\Contracts\Cache\Store;

class MongoStore implements Store
{
    public function get($key) {}
    public function many(array $keys) {}
    public function put($key, $value, $seconds) {}
    public function putMany(array $values, $seconds) {}
    public function increment($key, $value = 1) {}
    public function decrement($key, $value = 1) {}
    public function forever($key, $value) {}
    public function forget($key) {}
    public function flush() {}
    public function getPrefix() {}
}
```

我们只需要使用 MongoDB 连接实现每个方法。要查看如何实现每个方法的示例，可以看一下 [Laravel 框架源码](https://github.com/laravel/framework) 中的 `Illuminate\Cache\MemcachedStore`。完成实现后，我们可以通过调用 `Cache` facade 的 `extend` 方法完成我们的自定义驱动注册：

```php
Cache::extend('mongo', function (Application $app) {
    return Cache::repository(new MongoStore);
});
```

> [!NOTE]  
> 如果您想知道在哪里放置您的自定义缓存驱动程序代码，您可以在您的 `app` 目录中创建一个 `Extensions` 命名空间。但是，请记住，Laravel 没有严格的应用程序结构，您可以根据自己的喜好自由组织您的应用程序。

### 注册驱动程序

要在 Laravel 中注册自定义缓存驱动程序，我们将使用 `Cache` facade 上的 `extend` 方法。由于其他服务提供者可能会尝试在其 `boot` 方法中读取缓存的值，我们将在 `booting` 回调中注册我们的自定义驱动程序。通过使用 `booting` 回调，我们可以确保在我们应用程序的服务提供者的 `boot` 方法调用之前，且在所有服务提供者的 `register` 方法调用之后，就注册自定义驱动程序。我们将在应用程序的 `App\Providers\AppServiceProvider` 类的 `register` 方法中注册我们的 `booting` 回调：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoStore;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        $this->app->booting(function () {
             Cache::extend('mongo', function (Application $app) {
                 return Cache::repository(new MongoStore);
             });
         });
    }

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        // ...
    }
}
```

传递给 `extend` 方法的第一个参数是驱动程序的名称。这将对应于 `config/cache.php` 配置文件中的 `driver` 选项。第二个参数是一个闭包，应该返回一个 `Illuminate\Cache\Repository` 实例。这个闭包将被传递一个 `$app` 实例，这是 [服务容器](/docs/11/architecture-concepts/container) 的一个实例。

注册扩展后，更新应用程序的 `config/cache.php` 配置文件中的 `CACHE_STORE` 环境变量或 `default` 选项为您扩展的名称。

## 事件

您可以监听由缓存分发的各种[事件](/docs/11/digging-deeper/events)，以便在每个缓存操作上执行代码：

| 事件名称                               |
| -------------------------------------- |
| `Illuminate\Cache\Events\CacheHit`     |
| `Illuminate\Cache\Events\CacheMissed`  |
| `Illuminate\Cache\Events\KeyForgotten` |
| `Illuminate\Cache\Events\KeyWritten`   |
