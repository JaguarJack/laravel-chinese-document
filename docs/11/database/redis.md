---
title: Laravel Redis
---

# 数据库: Redis

[[toc]]

## 简介

[Redis](https://redis.io) 是一个开源的高级键值存储。它通常被称为数据结构服务器，因为键可以包含[字符串](https://redis.io/docs/data-types/strings/)、[哈希](https://redis.io/docs/data-types/hashes/)、[列表](https://redis.io/docs/data-types/lists/)、[集合](https://redis.io/docs/data-types/sets/)和[有序集合](https://redis.io/docs/data-types/sorted-sets/)。

在使用 Laravel 配合 Redis 之前，我们建议你通过 PECL 安装并使用 [PhpRedis](https://github.com/phpredis/phpredis) PHP 扩展。与用户态的 PHP 包相比，扩展的安装更复杂，但是对于重度使用 Redis 的应用程序可能会带来更好的性能。如果你正在使用 [Laravel Sail](/docs/11/packages/sail)，这个扩展已在你的应用程序的 Docker 容器中安装。

如果你无法安装 PhpRedis 扩展，你可以通过 Composer 安装 `predis/predis` 包。Predis 是一个完全用 PHP 编写的 Redis 客户端，不需要任何额外的扩展：

```shell
composer require predis/predis:^2.0
```

## 配置

你可以通过 `config/database.php` 配置文件配置应用程序的 Redis 设置。在这个文件中，你将看到一个包含应用程序所使用 Redis 服务器的 `redis` 数组：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'username' => env('REDIS_USERNAME'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
    ],

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'username' => env('REDIS_USERNAME'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
    ],

],
```

你的配置文件中定义的每个 Redis 服务器都需要有一个名称、主机和端口，除非你定义了一个单独的 URL 来代表 Redis 连接：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => 'tcp://127.0.0.1:6379?database=0',
    ],

    'cache' => [
        'url' => 'tls://user:password@127.0.0.1:6380?database=1',
    ],

],
```

#### 配置连接方案

默认情况下，Redis 客户端将在连接 Redis 服务器时使用 `tcp` 方案；但是，如果你想通过指定配置数组中的 `scheme` 配置项来使用 TLS/SSL 加密，你可以如下配置：

```php
'default' => [
    'scheme' => 'tls',
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
],
```

### 集群

如果你的应用程序正在使用 Redis 服务器集群，你应该在配置文件的 `clusters` 键中定义这些集群。默认情况下这个配置键是不存在的，所以你需要在应用程序的 `config/database.php` 配置文件中创建它：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'clusters' => [
        'default' => [
            [
                'url' => env('REDIS_URL'),
                'host' => env('REDIS_HOST', '127.0.0.1'),
                'username' => env('REDIS_USERNAME'),
                'password' => env('REDIS_PASSWORD'),
                'port' => env('REDIS_PORT', '6379'),
                'database' => env('REDIS_DB', '0'),
            ],
        ],
    ],

    // ...
],
```

默认情况下，Laravel 会使用原生 Redis 集群，因为 `options.cluster` 配置值被设置为 `redis`。Redis 集群是一个很好的默认选择，因为它能优雅地处理故障转移。

Laravel 也支持客户端分片。然而，客户端分片不处理故障转移；因此，它主要适用于可从其他主要数据存储中获取的临时缓存数据。

如果你想使用客户端分片而不是原生 Redis 集群，你可以在应用程序的 `config/database.php` 配置文件中移除 `options.cluster` 配置值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'clusters' => [
        // ...
    ],

    // ...
],
```

### Predis

如果你希望你的应用通过 Predis 包与 Redis 交互，你应该确保 `REDIS_CLIENT` 环境变量的值是 `predis`：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'predis'),

    // ...
],
```

除了默认配置选项，Predis 支持可以为你的每个 Redis 服务器定义的额外[连接参数](https://github.com/nrk/predis/wiki/Connection-Parameters)。要使用这些额外配置选项，请将它们添加到你的应用的 `config/database.php` 配置文件中的 Redis 服务器配置中：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'read_write_timeout' => 60,
],
```

### PhpRedis

默认情况下，Laravel 会使用 PhpRedis 扩展来与 Redis 通信。Laravel 用来与 Redis 通信的客户端由 `redis.client` 配置选项的值决定，这通常反映了 `REDIS_CLIENT` 环境变量的值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    // ...
],
```

除了默认的配置选项，PhpRedis 支持以下额外的连接参数：`name`、`persistent`、`persistent_id`、`prefix`、`read_timeout`、`retry_interval`、`timeout`，和 `context`。你可以将任何这些选项添加到 `config/database.php` 配置文件中的 Redis 服务器配置中：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'read_timeout' => 60,
    'context' => [
        // 'auth' => ['username', 'secret'],
        // 'stream' => ['verify_peer' => false],
    ],
],
```

#### PhpRedis 序列化和压缩

PhpRedis 扩展也可以配置使用各种序列化和压缩算法。这些算法可以通过你的 Redis 配置中的 `options` 数组进行配置：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
        'serializer' => Redis::SERIALIZER_MSGPACK,
        'compression' => Redis::COMPRESSION_LZ4,
    ],

    // ...
],
```

目前支持的序列化器包括：`Redis::SERIALIZER_NONE`（默认），`Redis::SERIALIZER_PHP`，`Redis::SERIALIZER_JSON`，`Redis::SERIALIZER_IGBINARY`，和 `Redis::SERIALIZER_MSGPACK`。

支持的压缩算法包括：`Redis::COMPRESSION_NONE`（默认），`Redis::COMPRESSION_LZF`，`Redis::COMPRESSION_ZSTD`，和 `Redis::COMPRESSION_LZ4`。

## 与 Redis 交互

你可以通过调用 `Redis` [facade](/docs/11/architecture-concepts/facades) 上的各种方法与 Redis 交互。`Redis` facade 支持动态方法，意味着你可以在 facade 上调用任何 [Redis 命令](https://redis.io/commands)，该命令将直接传递给 Redis。在这个例子中，我们将通过在 `Redis` facade 上调用 `get` 方法来调用 Redis 的 `GET` 命令：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Redis;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的概况。
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => Redis::get('user:profile:'.$id)
        ]);
    }
}
```

如上所述，你可以在 `Redis` facade 上调用 Redis 的任何命令。Laravel 使用魔术方法将命令传递给 Redis 服务器。如果一个 Redis 命令期望有参数，你应该将这些参数传递给 facade 的相应方法：

```php
use Illuminate\Support\Facades\Redis;

Redis::set('name', 'Taylor');

$values = Redis::lrange('names', 5, 10);
```

或者，你可以使用 `Redis` facade 的 `command` 方法将命令传递给服务器，该方法接受命令名称作为它的第一个参数，以及一个值数组作为它的第二个参数：

```php
$values = Redis::command('lrange', ['name', 5, 10]);
```

#### 使用多个 Redis 连接

你的应用的 `config/database.php` 配置文件允许你定义多个 Redis 连接/服务器。你可以使用 `Redis` facade 的 `connection` 方法获取特定 Redis 连接的连接：

```php
$redis = Redis::connection('connection-name');
```

要获取默认 Redis 连接的实例，你可以不带任何额外参数调用 `connection` 方法：

```php
$redis = Redis::connection();
```

### 事务

`Redis` 门面的 `transaction` 方法提供了一个方便的包装器，围绕 Redis 的原生 `MULTI` 和 `EXEC` 命令。`transaction` 方法接受一个闭包作为唯一参数。这个闭包将接收一个 Redis 连接实例，并且可以向这个实例发出任何命令。闭包中的所有 Redis 命令将在一个单独的，原子事务中执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::transaction(function (Redis $redis) {
    $redis->incr('user_visits', 1);
    $redis->incr('total_visits', 1);
});
```

> [!WARNING]
> 在定义一个 Redis 事务时，你不能从 Redis 连接中获取任何值。记住，你的事务是作为一个单独的原子操作执行的，并且该操作直到你的整个闭包完成执行其命令之后才会执行。

#### Lua 脚本

`eval` 方法提供了另一种执行多个 Redis 命令在一个单一的原子操作中的方法。然而，`eval` 方法的好处是能够在操作期间与 Redis 键值进行交互和检查。Redis 脚本是用 [Lua 编程语言](https://www.lua.org) 编写的。

`eval` 方法起初可能看起来有点吓人，但我们将探索一个基础示例来打破冰。`eval` 方法需要几个参数。首先，你应该将 Lua 脚本（作为字符串）传递给该方法。其次，你应该传递脚本交互的键的数量（作为整数）。第三，你应该传递这些键的名称。最后，你可以传递任何其他你需要在你的脚本中访问的附加参数。

在这个例子中，我们将增加一个计数器，检查它的新值，并且如果第一个计数器的值大于五，则增加第二个计数器。最后，我们将返回第一个计数器的值：

```php
$value = Redis::eval(<<<'LUA'
    local counter = redis.call("incr", KEYS[1])

    if counter > 5 then
        redis.call("incr", KEYS[2])
    end

    return counter
LUA, 2, 'first-counter', 'second-counter');
```

> [!WARNING]
> 请参阅 [Redis 文档](https://redis.io/commands/eval) 以获取有关 Redis 脚本的更多信息。

### 管道化命令

有时你可能需要执行数十个 Redis 命令。你可以使用 `pipeline` 方法，而不是为每个命令进行一次网络行程到你的 Redis 服务器。`pipeline` 方法接受一个参数：一个收到 Redis 实例的闭包。你可以向这个 Redis 实例发出你所有的命令，它们都将同时发送到 Redis 服务器以减少到服务器的网络行程。命令仍将按照发出的顺序执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::pipeline(function (Redis $pipe) {
    for ($i = 0; $i < 1000; $i++) {
        $pipe->set("key:$i", $i);
    }
});
```

## 发布/订阅

Laravel 提供了一个方便的接口到 Redis 的 `publish` 和 `subscribe` 命令。这些 Redis 命令允许你在给定的“频道”上监听消息。你可以从另一个应用程序，甚至使用另一种编程语言发布消息到频道，允许应用程序和进程之间轻松通信。

首先，让我们使用 `subscribe` 方法设置一个频道监听器。我们将在 [Artisan 命令](/docs/11/digging-deeper/artisan) 中放置此方法调用，因为调用 `subscribe` 方法开始一个长时间运行的过程：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisSubscribe extends Command
{
    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'redis:subscribe';

    /**
     * 控制台命令描述。
     *
     * @var string
     */
    protected $description = '订阅 Redis 频道';

    /**
     * 执行控制台命令。
     */
    public function handle(): void
    {
        Redis::subscribe(['test-channel'], function (string $message) {
            echo $message;
        });
    }
}
```

现在我们可以使用 `publish` 方法发布消息到频道：

```php
use Illuminate\Support\Facades\Redis;

Route::get('/publish', function () {
    // ...

    Redis::publish('test-channel', json_encode([
        'name' => 'Adam Wathan'
    ]));
});
```

#### 通配符订阅

使用 `psubscribe` 方法，你可以订阅一个通配符频道，这在捕获所有频道上的所有消息时可能很有用。频道名称将作为第二个参数传递给提供的闭包：

```php
Redis::psubscribe(['*'], function (string $message, string $channel) {
    echo $message;
});

Redis::psubscribe(['users.*'], function (string $message, string $channel) {
    echo $message;
});
```
