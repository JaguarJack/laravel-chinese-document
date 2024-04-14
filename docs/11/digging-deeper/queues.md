---
title: Laravel 队列
---

# 队列

[[toc]]

## 介绍

在构建您的网络应用程序时，您可能有一些任务，如解析和存储上传的 CSV 文件，这在典型的网络请求期间执行起来花费时间过长。幸运的是，Laravel 使您可以轻松创建可在后台处理的队列作业。通过将耗时任务移到队列中，您的应用程序可以以极快的速度响应网络请求，并为您的客户提供更好的用户体验。

Laravel 队列提供了跨各种不同队列后端的统一队列 API，如 [Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 或者甚至是关系型数据库。

Laravel 的队列配置选项存储在您的应用程序的 `config/queue.php` 配置文件中。在这个文件中，您将找到框架包含的每个队列驱动的连接配置，包括数据库、[Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 和 [Beanstalkd](https://beanstalkd.github.io/) 驱动，以及一个同步驱动，它将立即执行作业（用于本地开发）。一个丢弃队列作业的 `null` 队列驱动也包含在内。

> [!NOTE]
> Laravel 现在提供了 Horizon，一个美丽的仪表板和配置系统，用于您通过 Redis 强化的队列。更多信息请查阅完整的 [Horizon 文档](/docs/11/packages/horizon)。

### 连接 vs 队列

在开始使用 Laravel 队列之前，了解“连接”和“队列”之间的区别非常重要。在您的 `config/queue.php` 配置文件中，有一个 `connections` 配置数组。此选项定义了到后端队列服务如 Amazon SQS、Beanstalk 或 Redis 的连接。然而，任何给定的队列连接可能有多个“队列”，可以被认为是不同的堆栈或堆放队列作业的堆。

请注意，`queue` 配置文件中的每个连接配置示例都包含一个 `queue` 属性。当作业被发送到一个给定的连接时，这是作业将被调度到的默认队列。换句话说，如果您派发一个作业而没有明确指定它应该被发送到哪个队列，这个作业将被放置在连接配置中定义的 `queue` 属性的队列上：

```php
use App\Jobs\ProcessPodcast;

// 这个作业被发送到默认连接的默认队列...
ProcessPodcast::dispatch();

// 这个作业被发送到默认连接的 "emails" 队列...
ProcessPodcast::dispatch()->onQueue('emails');
```

一些应用程序可能永远不需要将作业推送到多个队列，而是更愿意有一个简单的队列。然而，将工作推送到多个队列对于希望优先或分段处理工作的应用程序来说特别有用，因为 Laravel 队列工作者允许您指定它应该按优先级处理的队列。例如，如果您将作业推到 `high` 队列，您可以运行一个给予它们更高处理优先级的工作者：

```shell
php artisan queue:work --queue=high,default
```

### 驱动注释和先决条件

#### 数据库

为了使用 `database` 队列驱动，您需要一个数据库表来保存作业。通常，这包含在 Laravel 默认的 `0001_01_01_000002_create_jobs_table.php` [数据库迁移](/docs/11/database/migrations)中；然而，如果您的应用程序不包含此迁移，您可以使用 `make:queue-table` Artisan 命令创建它：

```shell
php artisan make:queue-table

php artisan migrate
```

#### Redis

为了使用 `redis` 队列驱动，您应该在 `config/database.php` 配置文件中配置一个 Redis 数据库连接。

> [!WARNING] > `serializer` 和 `compression` Redis 选项不被 `redis` 队列驱动支持。

**Redis 集群**

如果您的 Redis 队列连接使用 Redis 集群，则您的队列名称必须包含一个[键哈希标签](https://redis.io/docs/reference/cluster-spec/#hash-tags)。这是必需的，以确保给定队列的所有 Redis 键都被放置在同一个哈希槽中：

```php
'redis' => [
    'driver' => 'redis',
    'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
    'queue' => env('REDIS_QUEUE', '{default}'),
    'retry_after' => env('REDIS_QUEUE_RETRY_AFTER', 90),
    'block_for' => null,
    'after_commit' => false,
],
```

**阻塞**

在使用 Redis 队列时，您可以使用 `block_for` 配置选项指定驱动在作业可用前应等待多久，然后再遍历工作者循环并重新轮询 Redis 数据库。

根据您的队列负载调整此值比不断地轮询 Redis 数据库以获得新作业更有效率。例如，您可以将值设置为 `5`，以表示驱动应该在作业可用时阻塞五秒：

```php
'redis' => [
    'driver' => 'redis',
    'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
    'queue' => env('REDIS_QUEUE', 'default'),
    'retry_after' => env('REDIS_QUEUE_RETRY_AFTER', 90),
    'block_for' => 5,
    'after_commit' => false,
],
```

> [!WARNING]
> 将 `block_for` 设置为 `0` 会导致队列工作者无限期地阻塞，直到有作业可用。这也将阻止信号广播，如 `SIGTERM`，直到下一个作业处理完毕。

#### 其他驱动所需先决条件

以下依赖项适用于列出的队列驱动。这些依赖项可以通过 Composer 包管理器安装：

- Amazon SQS: `aws/aws-sdk-php ~3.0`
- Beanstalkd: `pda/pheanstalk ~5.0`
- Redis: `predis/predis ~2.0` 或 phpredis PHP 扩展

## 创建作业

### 生成作业类

默认情况下，您的应用程序的所有可排队作业都存储在 `app/Jobs` 目录中。如果 `app/Jobs` 目录不存在，当您运行 `make:job` Artisan 命令时，它将被创建：

```shell
php artisan make:job ProcessPodcast
```

生成的类将实现 `Illuminate\Contracts\Queue\ShouldQueue` 接口，表明 Laravel 该作业应该被推送到队列以异步运行。

> [!NOTE]
> 作业模板可以使用 [模板发布](/docs/11/digging-deeper/artisan#stub-customization) 自定义。

### 类结构

作业类非常简单，通常只包含一个 `handle` 方法，当作业由队列处理时调用该方法。让我们开始，看一个例子作业类。在这个例子中，我们将假装我们管理一个播客发布服务，并需要在播客文件发布之前处理上传的播客文件：

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 创建一个新的作业实例。
     */
    public function __construct(
        public Podcast $podcast,
    ) {}

    /**
     * 执行作业。
     */
    public function handle(AudioProcessor $processor): void
    {
        // 处理上传的播客...
    }
}
```

在这个例子中，注意我们可以直接在可排队作业的构造函数中传递 [Eloquent 模型](/docs/11/eloquent/eloquent)。由于作业使用了 `SerializesModels` 特性，Eloquent 模型及其加载的关系将在作业处理时优雅地序列化和反序列化。

如果您的排队作业接受了一个 Eloquent 模型作为其构造器，那么模型的标识符将被序列化到队列上。当作业实际处理时，队列系统将自动重新检索数据库中的完整模型实例及其加载的关系。这种模型序列化方法允许将非常小的作业有效载荷发送到您的队列驱动。

#### `handle` 方法依赖注入

`handle` 方法在队列处理作业时调用。请注意，我们可以在作业的 `handle` 方法中对依赖进行类型提示。Laravel [服务容器](/docs/11/architecture-concepts/container)自动注入这些依赖项。

如果您想要完全控制容器如何将依赖项注入到 `handle` 方法中，您可以使用容器的 `bindMethod` 方法。`bindMethod` 方法接受一个回调，它接收作业和容器。在回调中，您可以自由调用 `handle` 方法。通常，您应该在 `App\Providers\AppServiceProvider` [服务提供者](/docs/11/architecture-concepts/providers)的 `boot` 方法中调用此方法：

```php
use App\Jobs\ProcessPodcast;
use App\Services\AudioProcessor;
use Illuminate\Contracts\Foundation\Application;

$this->app->bindMethod([ProcessPodcast::class, 'handle'], function (ProcessPodcast $job, Application $app) {
    return $job->handle($app->make(AudioProcessor::class));
});
```

> [!WARNING]
> 二进制数据，如原始图像内容，在传递给排队作业之前应通过 `base64_encode` 函数传递。否则，当作业被放置在队列上时，作业可能无法正确序列化为 JSON。

#### 队列关系

因为当作业被加入队列时，所有加载的 Eloquent 模型关系也会被序列化，所以序列化的作业字符串有时会变得相当大。此外，当作业反序列化并且从数据库重新检索模型关系时，它们将被完整检索。在作业队列过程中模型被序列化之前应用的任何关系限制，在作业反序列化时不会应用。因此，如果你希望在队列作业中处理给定关系的一个子集，你应该在队列作业中重新限定该关系。

或者，为了防止序列化关系，设置属性值时可以在模型上调用 `withoutRelations` 方法。这个方法将返回没有加载关系的模型实例：

```php
/**
 * 创建一个新的作业实例。
 */
public function __construct(Podcast $podcast)
{
    $this->podcast = $podcast->withoutRelations();
}
```

如果你使用的是 PHP 构造函数属性提升，并希望指示一个 Eloquent 模型不应该序列化它的关系，你可以使用 `WithoutRelations` 属性：

```php
use Illuminate\Queue\Attributes\WithoutRelations;

/**
 * 创建一个新的作业实例。
 */
public function __construct(
    #[WithoutRelations]
    public Podcast $podcast
) {
}
```

如果作业接收到的是 Eloquent 模型的集合或数组而不是单个模型，则集合内的模型在作业反序列化和执行时不会恢复它们的关系。这样做是为了防止处理大量模型的作业产生过多的资源使用。

### 唯一作业

> [!WARNING]  
> 唯一作业需要一个支持 [锁](/docs/11/digging-deeper/cache#atomic-locks) 的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。此外，唯一作业约束不适用于批次中的作业。

有时候，你可能想要确保在任何时间点队列中只有一个特定作业的实例。你可以通过在作业类上实现 `ShouldBeUnique` 接口来实现这一点。这个接口不需要你在你的类中定义任何额外的方法：

```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    //...
}
```

在上面的例子中，`UpdateSearchIndex` 作业是唯一的。所以，如果队列中已经有一个实例的作业还没处理完，那么作业就不会被派发。

在某些情况下，你可能想要定义一个特定的“键”来使作业唯一，或者你可能想要指定一个超时时间，超过这个时间作业不再保持唯一。要做到这一点，你可以在你的作业类上定义 `uniqueId` 和 `uniqueFor` 属性或方法：

```php
use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    /**
     * 产品实例。
     *
     * @var \App\Models\Product
     */
    public $product;

    /**
     * 作业的唯一锁释放后的秒数。
     *
     * @var int
     */
    public $uniqueFor = 3600;

    /**
     * 获取作业的唯一 ID。
     */
    public function uniqueId(): string
    {
        return $this->product->id;
    }
}
```

在上面的例子中，`UpdateSearchIndex` 作业通过产品 ID 唯一。所以，任何新派发的带有相同产品 ID 的作业都会被忽略，直到现有作业处理完成。另外，如果现有作业在一小时内未处理完，唯一锁将被释放，可以将另一个带有相同唯一键的作业派发到队列。

> [!WARNING]  
> 如果你的应用程序从多个 Web 服务器或容器派发作业，你应该确保你所有的服务器都与同一个中央缓存服务器通信，这样 Laravel 才能准确地确定一个作业是否是唯一的。

#### 在处理开始之前保持作业唯一

默认情况下，一个唯一的作业在处理完成后或者在所有重试尝试失败后会“解锁”。然而，在某些情况下，你可能希望你的作业在处理之前立即解锁。要做到这一点，你的作业应该实现 `ShouldBeUniqueUntilProcessing` 合约而不是 `ShouldBeUnique` 合约：

```php
use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ...
}
```

#### 唯一作业锁

在幕后，当一个 `ShouldBeUnique` 作业被派发时，Laravel 会尝试使用 `uniqueId` 键获得一个 [锁](/docs/11/digging-deeper/cache#atomic-locks)。如果没有获得锁，作业就不会被派发。这个锁在作业处理完成或所有重试尝试失败后会被释放。默认情况下，Laravel 将使用默认缓存驱动来获取这个锁。然而，如果你希望使用另一个驱动来获取锁，你可以定义一个 `uniqueVia` 方法，该方法返回应该使用的缓存驱动：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    ...

    /**
     * 获取唯一作业锁的缓存驱动。
     */
    public function uniqueVia(): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]  
> 如果你只需要限制作业的并发处理，请使用 [`WithoutOverlapping`](/docs/11/digging-deeper/queues#preventing-job-overlaps) 作业中间件。

### 加密作业

Laravel 允许你通过[加密](/docs/11/security/encryption)来确保作业数据的隐私和完整性。要开始使用，只需向作业类添加 `ShouldBeEncrypted` 接口。一旦在类上添加了这个接口，Laravel 将自动加密你的作业后再推送到队列：

```php
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateSearchIndex implements ShouldQueue, ShouldBeEncrypted
{
    // ...
}
```

## 任务中间件

任务中间件允许你在执行队列任务时添加自定义逻辑，从而减少任务自身中的样板代码。例如，请考虑以下利用 Laravel 的 Redis 限流功能的 `handle` 方法，该方法允许每五秒处理一个任务：

```php
use Illuminate\Support\Facades\Redis;

/**
 * Execute the job.
 */
public function handle(): void
{
    Redis::throttle('key')->block(0)->allow(1)->every(5)->then(function () {
        info('Lock obtained...');

        // Handle job...
    }, function () {
        // Could not obtain lock...

        return $this->release(5);
    });
}
```

虽然这段代码是有效的，但由于 `handle` 方法中充满了 Redis 限流逻辑，使得方法的实现变得复杂。此外，这个限流逻辑必须为我们想要限流的任何其他任务复制一遍。

我们可以定义一个处理限流的任务中间件来代替在 `handle` 方法中进行限流。Laravel 没有任务中间件的默认位置，所以你可以把任务中间件放在应用程序的任何位置。在这个例子中，我们会把中间件放在 `app/Jobs/Middleware` 目录：

```php
<?php

namespace App\Jobs\Middleware;

use Closure;
use Illuminate\Support\Facades\Redis;

class RateLimited
{
    /**
     * Process the queued job.
     *
     * @param  \Closure(object): void  $next
     */
    public function handle(object $job, Closure $next): void
    {
        Redis::throttle('key')
                ->block(0)->allow(1)->every(5)
                ->then(function () use ($job, $next) {
                    // Lock obtained...

                    $next($job);
                }, function () use ($job) {
                    // Could not obtain lock...

                    $job->release(5);
                });
    }
}
```

如你所见，与[路由中间件](/docs/11/basics/middleware)一样，任务中间件接收正在处理中的任务和一个应该被调用以继续处理任务的回调函数。

在创建任务中间件之后，可以通过从任务的 `middleware` 方法返回它们来将中间件附加到任务上。这个方法在由 `make:job` Artisan 命令脚手架创建的任务中并不存在，所以你需要手动将其添加到你的任务类中：

```php
use App\Jobs\Middleware\RateLimited;

/**
 * Get the middleware the job should pass through.
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new RateLimited];
}
```

> [!NOTE]
> 任务中间件也可以分配给可队列化的事件监听器、邮件和通知。

### 限流

尽管我们刚刚演示了如何编写自己的限流任务中间件，但 Laravel 实际上包含了你可以用来限流任务的限流中间件。像[路由限流器](/docs/11/basics/routing#defining-rate-limiters)一样，任务限流器使用 `RateLimiter` facade 的 `for` 方法来定义。

例如，你可能希望允许用户每小时备份一次数据，而对高级客户则不设此限制。为了实现这一点，你可以在 `AppServiceProvider` 的 `boot` 方法中定义一个 `RateLimiter`：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    RateLimiter::for('backups', function (object $job) {
        return $job->user->vipCustomer()
                    ? Limit::none()
                    : Limit::perHour(1)->by($job->user->id);
    });
}
```

在上面的例子中，我们定义了一个每小时限制；然而，你可以使用 `perMinute` 方法轻松定义基于分钟的限流。此外，你可以传递任何你希望的值给限流的 `by` 方法；不过，这个值最常用于按客户划分限流：

```php
return Limit::perMinute(50)->by($job->user->id);
```

一旦你定义了限流，你可以使用 `Illuminate\Queue\Middleware\RateLimited` 中间件将限流器附加到你的任务上。每次任务超出限流时，该中间件将把任务重新放回队列，并根据限流持续时间适当延迟。

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * Get the middleware the job should pass through.
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new RateLimited('backups')];
}
```

将受限流控制的任务重新放回队列仍会增加该任务 `attempts` 的总次数。你可能希望相应地调整任务类上的 `tries` 和 `maxExceptions` 属性。或者，你可能希望使用[`retryUntil` 方法](#time-based-attempts)来定义任务不再尝试的时间量。

如果你不希望在任务受到限流时重试任务，你可以使用 `dontRelease` 方法：

```php
/**
 * Get the middleware the job should pass through.
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new RateLimited('backups'))->dontRelease()];
}
```

> [!NOTE]
> 如果你使用 Redis，则可以使用 `Illuminate\Queue\Middleware\RateLimitedWithRedis` 中间件，它为 Redis 进行了微调，比基本的限流中间件更有效。

### 防止作业重复执行

Laravel 包含一个 `Illuminate\Queue\Middleware\WithoutOverlapping` 中间件，允许你根据任意键值防止作业重叠。当一个排队的作业正在修改一个一次只能由一项任务修改的资源时，这个功能非常有用。

例如，假设你有一个排队作业在更新用户的信用分数，你想防止同一个用户 ID 的信用分数更新作业重叠。要做到这一点，你可以从作业的 `middleware` 方法返回 `WithoutOverlapping` 中间件：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new WithoutOverlapping($this->user->id)];
}
```

任何同类型的重叠作业都会被重新放回队列。你也可以指定释放作业后必须经过的秒数，才能再次尝试执行该作业：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->releaseAfter(60)];
}
```

如果你希望立即删除任何重叠的作业，以便它们不会被重新尝试，你可以使用 `dontRelease` 方法：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->dontRelease()];
}
```

`WithoutOverlapping` 中间件由 Laravel 的原子锁功能支持。有时，你的作业可能会意外失败或超时，导致锁没有被释放。因此，你可以使用 `expireAfter` 方法显式地定义一个锁过期时间。例如，下面的例子将指导 Laravel 在作业开始处理三分钟后释放 `WithoutOverlapping` 锁：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->expireAfter(180)];
}
```

> [!WARNING] > `WithoutOverlapping` 中间件需要一个支持[锁](/docs/11/digging-deeper/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

#### 在不同的作业类之间共享锁键

默认情况下，`WithoutOverlapping` 中间件只会防止相同类的作业重复。因此，尽管两个不同的作业类可能使用同一个锁键，它们也不会被防止重叠。然而，你可以指示 Laravel 使用 `shared` 方法将键应用于作业类之间：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

class ProviderIsDown
{
    // ...

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}

class ProviderIsUp
{
    // ...

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}
```

### 异常节流

Laravel 包含一个 `Illuminate\Queue\Middleware\ThrottlesExceptions` 中间件，允许你对异常进行节流。一旦作业抛出了一定数量的异常，所有进一步尝试执行作业的操作将被延迟，直到过了指定的时间间隔。这个中间件对于与不稳定的第三方服务交互的作业特别有用。

例如，让我们想象一个与开始抛出异常的第三方 API 交互的排队作业。为了节流异常，你可以从作业的 `middleware` 方法返回 `ThrottlesExceptions` 中间件。通常，这个中间件应该与实现了[基于时间的尝试](#time-based-attempts)的作业配对使用：

```php
use DateTime;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new ThrottlesExceptions(10, 5)];
}

/**
 * 确定作业应何时超时。
 */
public function retryUntil(): DateTime
{
    return now()->addMinutes(5);
}
```

中间件构造器接受的第一个参数是作业在被节流前可以抛出的异常数量，第二个构造器参数是一旦作业被节流后，在尝试再次执行作业前应经过的分钟数。在上面的代码示例中，如果作业在 5 分钟内抛出了 10 个异常，我们将等待 5 分钟后再次尝试执行作业。

当作业抛出一个异常但还没有达到异常阈值时，作业通常会立即被重试。然而，你可以通过在附加中间件到作业时调用 `backoff` 方法来指定这样的作业应被延迟的分钟数：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 5))->backoff(5)];
}
```

在内部，这个中间件使用 Laravel 的缓存系统来实现速率限制，并且作业的类名被用作缓存 "键"。你可以通过在附加中间件到你的作业时调用 `by` 方法来覆盖这个键。如果你有多个作业与同一个第三方服务交互，并且你希望它们共享一个通用的节流 "bucket"，这可能会很有用：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10))->by('key')];
}
```

默认情况下，这个中间件将节流每个异常。你可以通过在附加中间件到作业时调用 `when` 方法来修改这种行为。只有当提供给 `when` 方法的闭包返回 `true` 时，异常才会被节流：

```php
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10))->when(
        fn (Throwable $throwable) => $throwable instanceof HttpClientException
    )];
}
```

如果你希望将被节流的异常报告给你的应用程序的异常处理程序，你可以在附加中间件到作业时调用 `report` 方法来做到这一点。你也可以提供一个闭包给 `report` 方法，并且如果给定闭包返回 `true`，异常才会被报告：

```php
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10))->report(
        fn (Throwable $throwable) => $throwable instanceof HttpClientException
    )];
}
```

> [!NOTE]
> 如果你使用的是 Redis，你可以使用 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 中间件，它为 Redis 进行了优化，比基本的异常节流中间件更高效。

## 调度作业

一旦你编写了作业类，你可以使用作业本身的 `dispatch` 方法来调度它。传递给 `dispatch` 方法的参数将被赋给作业的构造器：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast);

        return redirect('/podcasts');
    }
}
```

如果你希望有条件地调度一个作业，你可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
ProcessPodcast::dispatchIf($accountActive, $podcast);

ProcessPodcast::dispatchUnless($accountSuspended, $podcast);
```

在新的 Laravel 应用程序中，默认的队列驱动是 `sync` 驱动。这个驱动在当前请求的前台同步执行作业，通常在本地开发中很方便。如果你想实际开始为后台处理排队作业，你可以在应用程序的 `config/queue.php` 配置文件中指定不同的队列驱动。

### 延迟调度

如果你想指定一个作业不应该立即可用于由队列工作器处理，当调度作业时，你可以使用 `delay` 方法。例如，让我们指定一个作业应该在调度后 10 分钟才能被处理：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast)
                      ->delay(now()->addMinutes(10));

        return redirect('/podcasts');
    }
}
```

> [!WARNING]
> Amazon SQS 队列服务的最大延迟时间是 15 分钟。

#### 在响应发送到浏览器后调度

另外，如果你的 web 服务器使用 FastCGI，`dispatchAfterResponse` 方法延迟调度作业，直到 HTTP 响应发送到用户浏览器之后。这将仍然允许用户开始使用应用程序，即使一个排队的作业仍然在执行。这通常只应该用于执行时间大约一秒钟的作业，例如发送电子邮件。由于它们是在当前 HTTP 请求中处理的，以这种方式调度的作业不需要运行队列工作器就能被处理：

```php
use App\Jobs\SendNotification;

SendNotification::dispatchAfterResponse();
```

你也可以 `dispatch` 一个闭包并将 `afterResponse` 方法链式调用到 `dispatch` 帮助器上，以在发送 HTTP 响应后执行闭包：

```php
use App\Mail\WelcomeMessage;
use Illuminate\Support\Facades\Mail;

dispatch(function () {
    Mail::to('taylor@example.com')->send(new WelcomeMessage);
})->afterResponse();
```

### 同步调度

如果你想立即（同步）调度一个作业，你可以使用 `dispatchSync` 方法。使用这个方法时，作业不会被排队，将会立即在当前进程中执行：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatchSync($podcast);

        return redirect('/podcasts');
    }
}
```

### 作业和数据库事务

在数据库事务中调度作业是完全可以的，但你应该特别注意确保你的作业实际上能够成功执行。在事务中调度作业时，有可能作业在父事务提交之前就被工作器处理了。当这种情况发生时，你在数据库事务期间对模型或数据库记录所做的任何更新可能还没有反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能还不存在于数据库中。

幸运的是，Laravel 提供了几种方法来解决这个问题。首先，你可以在队列连接的配置数组中设置 `after_commit` 连接选项：

```php
'redis' => [
    'driver' => 'redis',
    // ...
    'after_commit' => true,
],
```

当 `after_commit` 选项为 `true` 时，你可以在数据库事务中调度作业；但是，Laravel 会等到打开的父数据库事务提交后再实际调度作业。当然，如果目前没有开启的数据库事务，作业将被立即调度。

如果事务因在事务期间发生的异常而回滚，那么在该事务期间调度的作业将被丢弃。

> [!NOTE]
> 将 `after_commit` 配置选项设置为 `true` 还会导致任何排队的事件监听器、邮件、通知和广播事件在所有打开的数据库事务提交后被调度。

#### 内联指定提交调度行为

如果你没有将 `after_commit` 队列连接配置选项设置为 `true`，你仍然可以指定特定作业应在所有打开的数据库事务提交后被调度。为此，你可以将 `afterCommit` 方法链接到你的调度操作：

```php
use App\Jobs\ProcessPodcast;

ProcessPodcast::dispatch($podcast)->afterCommit();
```

类似地，如果 `after_commit` 配置选项被设置为 `true`，你可以指定特定作业应立即调度，无需等待任何打开的数据库事务提交：

```php
ProcessPodcast::dispatch($podcast)->beforeCommit();
```

### 作业链

作业链允许你指定一系列排队作业，在主作业成功执行后按顺序运行。如果序列中的一个作业失败了，剩余的作业将不会被运行。要执行排队作业链，你可以使用 `Bus` facade 提供的 `chain` 方法。Laravel 的命令总线是建立在排队作业调度之上的底层组件：

```php
use App\Jobs\OptimizePodcast;
use App\Jobs\ProcessPodcast;
use App\Jobs\ReleasePodcast;
use Illuminate\Support\Facades\Bus;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->dispatch();
```

除了链式调用作业类实例，你还可以链式闭包：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    function () {
        Podcast::update(/* ... */);
    },
])->dispatch();
```

> [!WARNING]
> 在作业内使用 `$this->delete()` 方法删除作业不会阻止链式作业被处理。只有当链中的某个作业失败时，链才会停止执行。

#### 链接和队列的连接

如果你希望指定应用于链式作业的连接和队列，你可以使用 `onConnection` 和 `onQueue` 方法。这些方法指定了应该使用的队列连接和队列名称，除非排队作业明确分配了不同的连接/队列：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->onConnection('redis')->onQueue('podcasts')->dispatch();
```

#### 给作业链添加作业

有时，你可能需要在作业链中的另一个作业中预先或追加一个作业到现有作业链。你可以使用 `prependToChain` 和 `appendToChain` 方法来实现这一点：

```php
/**
 * 执行作业。
 */
public function handle(): void
{
    // ...

    // 预先添加到当前链，紧接当前作业后立即运行...
    $this->prependToChain(new TranscribePodcast);

    // 追加到当前链，链末尾运行作业...
    $this->appendToChain(new TranscribePodcast);
}
```

#### 作业链故障

当链式作业时，你可以使用 `catch` 方法指定一个闭包，如果链中的作业失败了，应该调用该闭包。给定的回调将在调用时收到导致作业失败的 `Throwable` 实例：

```php
use Illuminate\Support\Facades\Bus;
use Throwable;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->catch(function (Throwable $e) {
    // 链中的作业失败了...
})->dispatch();
```

> [!WARNING]
> 由于链回调是序列化的，并且在稍后由 Laravel 队列执行，所以你不应该在链回调中使用 `$this` 变量。

### 自定义队列和连接

#### 指定特定队列调度

通过将作业推送到不同的队列，你可以“分类”你的排队作业，甚至确定为各种队列分配多少工人。请记住，这并不是将作业推送到由你的队列配置文件定义的不同队列“连接”，而只是推送到单个连接中的特定队列。要指定队列，请在调度作业时使用 `onQueue` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onQueue('processing');

        return redirect('/podcasts');
    }
}
```

或者，你可以在作业的构造函数中调用 `onQueue` 方法来指定作业的队列：

```php
<?php

namespace App\Jobs;

 use Illuminate\Bus\Queueable;
 use Illuminate\Contracts\Queue\ShouldQueue;
 use Illuminate\Foundation\Bus\Dispatchable;
 use Illuminate\Queue\InteractsWithQueue;
 use Illuminate\Queue\SerializesModels;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 创建一个新的作业实例。
     */
    public function __construct()
    {
        $this->onQueue('processing');
    }
}
```

#### 指定特定连接调度

如果你的应用与多个队列连接交互，你可以使用 `onConnection` 方法来指定作业应推送到的连接：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onConnection('sqs');

        return redirect('/podcasts');
    }
}
```

你可以链式调用 `onConnection` 和 `onQueue` 方法来指定作业的连接和队列：

```php
ProcessPodcast::dispatch($podcast)
              ->onConnection('sqs')
              ->onQueue('processing');
```

或者，你可以在作业的构造函数中调用 `onConnection` 方法来指定作业的连接：

```php
<?php

namespace App\Jobs;

 use Illuminate\Bus\Queueable;
 use Illuminate\Contracts\Queue\ShouldQueue;
 use Illuminate\Foundation\Bus\Dispatchable;
 use Illuminate\Queue\InteractsWithQueue;
 use Illuminate\Queue\SerializesModels;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 创建一个新的作业实例。
     */
    public function __construct()
    {
        $this->onConnection('sqs');
    }
}
```

### 指定最大作业尝试次数/超时值

#### 最大尝试次数

如果你的排队作业遇到错误，你可能不希望它无限期地重新尝试。因此，Laravel 提供了多种方法来指定作业可能尝试的次数或持续时间。

指定作业可能尝试的最大次数的一种方法是通过 Artisan 命令行的 `--tries` 开关。这将适用于由工作器处理的所有作业，除非正在处理的作业指定了它可能尝试的次数：

```shell
php artisan queue:work --tries=3
```

如果一个作业超过其最大尝试次数，它将被视为“失败”的作业。有关处理失败作业的更多信息，请查看[失败作业文档](#dealing-with-failed-jobs)。如果给 `queue:work` 命令提供了 `--tries=0`，作业将无限次重试。

你可以采取更细粒度的方法，通过在作业类本身定义作业可能尝试的最大次数。如果在作业上指定了最大尝试次数，它将优先于命令行上提供的 `--tries` 值：

```php
<?php

namespace App\Jobs;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 作业可尝试的次数。
     *
     * @var int
     */
    public $tries = 5;
}
```

如果你需要对特定作业的最大尝试次数进行动态控制，你可以在作业上定义一个 `tries` 方法：

```php
/**
 * 确定作业可能尝试的次数。
 */
public function tries(): int
{
    return 5;
}
```

#### 基于时间的尝试

作为定义作业在失败前可尝试次数的替代方式，你可以定义一个作业不再尝试的时间。这允许在给定时间范围内任意次数地尝试作业。要定义作业不再尝试的时间，请在作业类中添加一个 `retryUntil` 方法。此方法应该返回一个 `DateTime` 实例：

```php
use DateTime;

/**
 * 确定作业应当超时的时间。
 */
public function retryUntil(): DateTime
{
    return now()->addMinutes(10);
}
```

> [!NOTE]
> 你也可以在[队列事件监听器](/docs/11/digging-deeper/events#queued-event-listeners)上定义 `tries` 属性或 `retryUntil` 方法。

#### 最大异常数

有时你可能希望指定一个作业可以尝试多次，但如果重试是由给定数量的未处理异常触发的（而不是直接被 `release` 方法释放的），应该失败。为此，你可以在作业类中定义一个 `maxExceptions` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Redis;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 作业可尝试的次数。
     *
     * @var int
     */
    public $tries = 25;

    /**
     * 允许在失败前的最大未处理异常数。
     *
     * @var int
     */
    public $maxExceptions = 3;

    /**
     * 执行作业。
     */
    public function handle(): void
    {
        Redis::throttle('key')->allow(10)->every(60)->then(function () {
            // 获取到锁，处理播客...
        }, function () {
            // 无法获取锁...
            return $this->release(10);
        });
    }
}
```

在这个例子中，如果应用程序无法获得 Redis 锁，作业将被释放 10 秒，并将继续尝试最多 25 次。然而，如果作业抛出了三个未处理的异常，作业将失败。

#### 超时

通常，你大致知道你的排队作业需要多长时间。因此，Laravel 允许你指定一个“超时”值。默认情况下，超时值为 60 秒。如果作业的处理时间超过超时值指定的秒数，处理作业的工作进程将退出并报错。通常，工作进程将由服务器上配置的[进程管理器](#supervisor-configuration)自动重启。

作业可以运行的最大秒数可以使用命令行上的 `--timeout` 开关指定：

```shell
php artisan queue:work --timeout=30
```

如果作业通过持续超时超过其最大尝试次数，它将被标记为失败。

你还可以在作业类本身定义作业允许运行的最大秒数。如果在作业上指定了超时时间，它将优先于命令行上指定的任何超时时间：

```php
<?php

namespace App\Jobs;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 作业在超时前可以运行的秒数。
     *
     * @var int
     */
    public $timeout = 120;
}
```

有时，诸如套接字或外部 HTTP 连接之类的 IO 阻塞过程可能不会遵守您指定的超时。因此，在使用这些功能时，你应该始终尝试使用他们的 API 来指定超时时间。例如，当使用 Guzzle 时，你应该总是指定连接和请求超时值。

> [!WARNING]
> 必须安装 `pcntl` PHP 扩展才能指定作业超时。此外，作业的“超时”值应始终小于其["重试后"](#job-expiration)值。否则，可能在作业实际完成执行或超时前，作业就会被重试。

#### 超时失败

如果你想表明作业在超时时应被标记为[失败](#dealing-with-failed-jobs)，你可以在作业类上定义 `$failOnTimeout` 属性：

```php
/**
 * 表明如果作业超时应该将其标记为失败。
 *
 * @var bool
 */
public $failOnTimeout = true;
```

### 错误处理

如果在处理作业时抛出异常，作业将自动被释放回队列，以便稍后再尝试。只要应用程序允许，作业将继续被释放，直到达到最大尝试次数。最大尝试次数由 `queue:work` Artisan 命令上使用的 `--tries` 开关定义。或者，最大尝试次数可以在作业类本身上定义。有关运行队列工作器的更多信息[可以在下面找到](#running-the-queue-worker)。

#### 手动释放作业

有时你可能希望手动将作业释放回队列，以便稍后再次尝试。你可以通过调用 `release` 方法来实现这一点：

```php
/**
 * 执行作业。
 */
public function handle(): void
{
    // ...

    $this->release();
}
```

默认情况下，`release` 方法会将作业立即释放回队列。但是，你可以通过向 `release` 方法传递一个整数或日期实例来指示队列，使作业在指定的秒数之后才能进行处理：

```php
$this->release(10);

$this->release(now()->addSeconds(10));
```

#### 手动标记作业失败

有时你可能需要手动将作业标记为“失败”。为此，你可以调用 `fail` 方法：

```php
/**
 * 执行作业。
 */
public function handle(): void
{
    // ...

    $this->fail();
}
```

如果你想由于捕获到的异常而将作业标记为失败，你可以将异常传递给 `fail` 方法。或者，为方便起见，你可以传递一个将为你转换成异常的字符串错误消息：

```php
$this->fail($exception);

$this->fail('Something went wrong.');
```

> [!NOTE]
> 有关失败作业的更多信息，请查阅[处理作业失败的文档](#dealing-with-failed-jobs)。

## 作业批处理

Laravel 的作业批处理功能允许你轻松执行一批作业，然后在作业批次完成执行后执行某些操作。在开始之前，你应该创建一个数据库迁移来构建一个表，该表将包含有关作业批次的元信息，例如它们的完成百分比。可以使用 `make:queue-batches-table` Artisan 命令来生成这个迁移：

```shell
php artisan make:queue-batches-table

php artisan migrate
```

### 定义可批处理的作业

要定义一个可批处理的作业，你应该像平常一样[创建一个可排队的作业](#creating-jobs)；但是，你应该将 `Illuminate\Bus\Batchable` 特性添加到作业类。这个 trait 提供了一个 `batch` 方法，可用于检索作业正在执行的当前批次：

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ImportCsv implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 执行作业。
     */
    public function handle(): void
    {
        if ($this->batch()->cancelled()) {
            // 确定批次是否已取消...

            return;
        }

        // 导入 CSV 文件的一部分...
    }
}
```

### 调度批处理作业

要调度一批作业，您应该使用 `Bus` facade 的 `batch` 方法。当然，批处理主要在与完成回调结合使用时才有用。因此，您可以使用 `then`、`catch` 和 `finally` 方法为批处理定义完成回调。这些回调在被调用时都将接收到一个 `Illuminate\Bus\Batch` 实例。在这个例子中，我们将假设我们正在排队一批处理 CSV 文件中给定数量行的作业：

```php
use App\Jobs\ImportCsv;
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;
use Throwable;

$batch = Bus::batch([
    new ImportCsv(1, 100),
    new ImportCsv(101, 200),
    new ImportCsv(201, 300),
    new ImportCsv(301, 400),
    new ImportCsv(401, 500),
])->before(function (Batch $batch) {
    // 批处理已创建但尚未添加任何作业...
})->progress(function (Batch $batch) {
    // 单个作业已成功完成...
})->then(function (Batch $batch) {
    // 所有作业都已成功完成...
})->catch(function (Batch $batch, Throwable $e) {
    // 检测到第一个批处理作业失败...
})->finally(function (Batch $batch) {
    // 批处理执行完毕...
})->dispatch();

return $batch->id;
```

批处理的 ID 可以通过 `$batch->id` 属性访问，可以用来在调度后通过 Laravel 命令总线[查询批处理信息](#inspecting-batches)。

> [!WARNING]
> 由于批处理回调会被序列化并在稍后由 Laravel 队列执行，所以您不应该在回调中使用 `$this` 变量。此外，由于批处理作业是封装在数据库事务中的，所以不应该在作业中执行触发隐式提交的数据库语句。

#### 命名批处理

部分工具，如 Laravel Horizon 和 Laravel Telescope 可能会为命名的批处理提供更友好的调试信息。为了给批处理分配一个任意名称，您可以在定义批处理时调用 `name` 方法：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有作业都已成功完成...
})->name('Import CSV')->dispatch();
```

#### 批处理连接和队列

如果您想指定应用于批处理作业的连接和队列，您可以使用 `onConnection` 和 `onQueue` 方法。所有批处理作业必须在同一连接和队列中执行：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有作业都已成功完成...
})->onConnection('redis')->onQueue('imports')->dispatch();
```

### 链接和批处理

您可以将一组[链接的作业](#job-chaining)定义在一个批处理中，方法是将链接的作业放在一个数组内。例如，我们可以并行执行两个作业链，并在两个作业链都完成处理后执行一个回调：

```php
use App\Jobs\ReleasePodcast;
use App\Jobs\SendPodcastReleaseNotification;
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

Bus::batch([
    [
        new ReleasePodcast(1),
        new SendPodcastReleaseNotification(1),
    ],
    [
        new ReleasePodcast(2),
        new SendPodcastReleaseNotification(2),
    ],
])->then(function (Batch $batch) {
    // ...
})->dispatch();
```

相反，您可以通过在链中定义批处理来在一个[链](#job-chaining)中运行一批作业。例如，您可以先运行一批作业来发布多个播客，然后运行一批作业来发送发布通知：

```php
use App\Jobs\FlushPodcastCache;
use App\Jobs\ReleasePodcast;
use App\Jobs\SendPodcastReleaseNotification;
use Illuminate\Support\Facades\Bus;

Bus::chain([
    new FlushPodcastCache,
    Bus::batch([
        new ReleasePodcast(1),
        new ReleasePodcast(2),
    ]),
    Bus::batch([
        new SendPodcastReleaseNotification(1),
        new SendPodcastReleaseNotification(2),
    ]),
])->dispatch();
```

### 向批处理中添加作业

有时在一个批处理作业中添加额外的作业可能很有用。这种模式在您需要批处理数以千计的作业，可能会在一个 web 请求中花费太长时间派送时非常有用。因此，您可能希望派送一个初始批次的“装载器”作业，以用更多作业润湿批次：

```php
$batch = Bus::batch([
    new LoadImportBatch,
    new LoadImportBatch,
    new LoadImportBatch,
])->then(function (Batch $batch) {
    // 所有作业都已成功完成...
})->name('Import Contacts')->dispatch();
```

在这个例子中，我们将使用 `LoadImportBatch` 作业为批处理带来额外的作业。为此，我们可以使用可通过作业的 `batch` 方法访问的批处理实例上的 `add` 方法：

```php
use App\Jobs\ImportContacts;
use Illuminate\Support\Collection;

/**
 * 执行作业。
 */
public function handle(): void
{
    if ($this->batch()->cancelled()) {
        return;
    }

    $this->batch()->add(Collection::times(1000, function () {
        return new ImportContacts;
    }));
}
```

> [!WARNING]
> 您只能在属于同一批处理的作业中，向批处理中添加作业。

### 查看批处理

`Illuminate\Bus\Batch` 实例提供了批处理完成回调的多种属性和方法，可帮助您与特定批处理作业进行交互和查看：

```php
// 批处理的 UUID...
$batch->id;

// 批处理的名称（如果适用）...
$batch->name;

// 分配给批次的作业数量...
$batch->totalJobs;

// 尚未由队列处理的作业数量...
$batch->pendingJobs;

// 失败的作业数量...
$batch->failedJobs;

// 到目前为止已处理的作业数量...
$batch->processedJobs();

// 批处理完成百分比（0-100）...
$batch->progress();

// 指示批处理是否已执行完毕...
$batch->finished();

// 取消批处理的执行...
$batch->cancel();

// 指示批处理是否已被取消...
$batch->cancelled();
```

#### 从路由返回批处理

所有的 `Illuminate\Bus\Batch` 实例都可以转换成 JSON，这意味着您可以直接从应用程序的某个路由返回它们以获取包含有关批处理信息的 JSON 负载，包括其完成进度。这使得在应用程序的 UI 中显示有关批处理完成进度的信息变得十分便捷。

要通过其 ID 检索批处理，您可以使用 `Bus` facade 的 `findBatch` 方法：

```php
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Route;

Route::get('/batch/{batchId}', function (string $batchId) {
    return Bus::findBatch($batchId);
});
```

### 取消批处理

有时您可能需要取消某个给定批次的执行。这可以通过对 `Illuminate\Bus\Batch` 实例调用 `cancel` 方法来实现：

```php
/**
 * 执行作业。
 */
public function handle(): void
{
    if ($this->user->exceedsImportLimit()) {
        return $this->batch()->cancel();
    }

    if ($this->batch()->cancelled()) {
        return;
    }
}
```

您可能已经在前面的示例中注意到，批处理作业通常应在继续执行之前确定其对应的批处理是否已被取消。但为了方便起见，您也可以为作业分配 `SkipIfBatchCancelled` [中间件](#job-middleware)。顾名思义，这个中间件会指示 Laravel，如果其对应的批处理已被取消，则不处理作业：

```php
use Illuminate\Queue\Middleware\SkipIfBatchCancelled;

/**
 * 获取作业应通过的中间件。
 */
public function middleware(): array
{
    return [new SkipIfBatchCancelled];
}
```

### 批处理失败

当批处理作业失败时，（如果分配）将调用 `catch` 回调。这个回调只会在该批处理中第一个失败的作业发生时被调用。

#### 允许失败

当批处理中的作业失败时，Laravel 会自动将批处理标记为“已取消”。如果您愿意，您可以禁用此行为，以便作业失败不会自动将批处理标记为已取消。这可以通过在调度批处理时调用 `allowFailures` 方法来实现：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有作业都已成功完成...
})->allowFailures()->dispatch();
```

#### 重试失败的批处理作业

为了方便起见，Laravel 提供了一个 `queue:retry-batch` Artisan 命令，允许您轻松地重试给定批处理的所有失败作业。`queue:retry-batch` 命令接受要重试其失败作业的批处理的 UUID：

```shell
php artisan queue:retry-batch 32dbc76c-4f82-4749-b610-a639fe0099b5
```

### 修剪批处理

如果不进行修剪，`job_batches` 表可能会很快积累记录。为了缓解这种情况，您应该[安排](/docs/11/digging-deeper/scheduling) `queue:prune-batches` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches')->daily();
```

默认情况下，所有已完成且超过 24 小时的批处理都会被修剪。在调用命令时您可以使用 `hours` 选项来决定保留批处理数据的时间长短。例如，以下命令将删除所有超过 48 小时完成的批处理：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48')->daily();
```

有时，您的 `jobs_batches` 表可能会积累从未成功完成的批处理记录，例如未成功重试的失败作业的批处理。您可以指示 `queue:prune-batches` 命令使用 `unfinished` 选项来修剪这些未完成的批处理记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --unfinished=72')->daily();
```

同样，您的 `jobs_batches` 表也可能积累已取消批处理的批处理记录。您可以指示 `queue:prune-batches` 命令使用 `cancelled` 选项来修剪这些已取消批处理记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --cancelled=72')->daily();
```

### 在 DynamoDB 中存储批处理

Laravel 还提供了在 [DynamoDB](https://aws.amazon.com/dynamodb) 而非关系型数据库中存储批处理元信息的支持。不过，您需要手动创建一个 DynamoDB 表来存储所有的批处理记录。

通常情况下，此表应命名为 `job_batches`，但您应基于应用程序 `queue` 配置文件中的 `queue.batching.table` 配置值来命名此表。

#### DynamoDB 批处理表配置

`job_batches` 表应具有一个名为 `application` 的字符串主分区键和一个名为 `id` 的字符串主排序键。键中的 `application` 部分将包含您的应用程序名称，该名称由应用程序 `app` 配置文件中的 `name` 配置值定义。由于应用程序名称是 DynamoDB 表键的一部分，您可以使用同一张表来存储多个 Laravel 应用程序的作业批处理。

此外，如果您希望利用 [自动批处理修剪](#pruning-batches-in-dynamodb) 功能，您可以为表定义 `ttl` 属性。

#### DynamoDB 配置

接下来，安装 AWS SDK，以便您的 Laravel 应用程序可以与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

然后，将 `queue.batching.driver` 配置选项的值设置为 `dynamodb`。此外，您应在 `batching` 配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于认证 AWS。使用 `dynamodb` 驱动时不需要 `queue.batching.database` 配置选项：

```php
'batching' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'job_batches',
],
```

### 在 DynamoDB 中修剪批次

在使用 [DynamoDB](https://aws.amazon.com/dynamodb) 存储作业批次信息时，通常用于修剪关系型数据库中存储的批次的命令将不适用。相反，您可以利用 [DynamoDB 的本地 TTL 功能](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html) 来自动删除旧批次的记录。

如果您在 DynamoDB 表中定义了 `ttl` 属性，您可以定义配置参数指导 Laravel 如何修剪批次记录。配置值 `queue.batching.ttl_attribute` 定义持有 TTL 的属性名称，而 `queue.batching.ttl` 配置值定义批次记录可以从 DynamoDB 表中删除的秒数，相对于记录最后一次更新的时间：

```php
'batching' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'job_batches',
    'ttl_attribute' => 'ttl',
    'ttl' => 60 * 60 * 24 * 7, // 7 天...
],
```

### 队列闭包

除了发送作业类到队列，您还可以发送闭包。这适用于需要在当前请求周期之外执行的快速简单任务。当将闭包发送到队列时，闭包的代码内容会被加密签名，防止在传输中被修改：

```php
$podcast = App\Podcast::find(1);

dispatch(function () use ($podcast) {
    $podcast->publish();
});
```

使用 `catch` 方法，您可以提供一个闭包，该闭包在队列闭包在用完队列的[配置重试次数](#max-job-attempts-and-timeout)后未能成功完成时执行：

```php
use Throwable;

dispatch(function () use ($podcast) {
    $podcast->publish();
})->catch(function (Throwable $e) {
    // 任务失败...
});
```

> [!warning]
> 因为 `catch` 回调是被 Laravel 队列序列化并在随后由队列执行的，所以你不应在 `catch` 回调中使用 `$this` 变量。

### 运行队列工作器

#### `queue:work` 命令

Laravel 包含了一个 Artisan 命令，可以启动一个队列工作器并处理新推送到队列的作业。您可以使用 `queue:work` Artisan 命令运行工作器。请注意一旦 `queue:work` 命令启动，它将持续运行直到被手动停止或关闭终端：

```shell
php artisan queue:work
```

> [!NOTE]
> 为了让 `queue:work` 进程在后台永久运行，您应该使用进程监控工具如 [Supervisor](#supervisor-configuration) 来确保队列工作器不会停止运行。

执行 `queue:work` 命令时可包含 `-v` 标志，如果您希望在命令的输出中包含处理过的作业 ID：

```shell
php artisan queue:work -v
```

请记住，队列工作器是长时间运行的进程，并在内存中存储启动应用状态。因此，它们在启动后不会注意到代码库的变化。因此，在部署过程中，记得[重启您的队列工作器](#queue-workers-and-deployment)。此外，记住应用程序创建或修改的任何静态状态不会自动在作业之间重置。

或者，您可以运行 `queue:listen` 命令。使用 `queue:listen` 命令时，当您想重新加载已更新的代码或重置应用状态时，不需要手动重启工作器；但是，与 `queue:work` 命令相比，该命令效率要低得多：

```shell
php artisan queue:listen
```

#### 运行多个队列工作器

要给队列分配多个工作器并同时处理作业，您只需启动多个 `queue:work` 进程即可。在本地可以通过在终端中打开多个标签页来完成，在生产环境中可以使用您的进程管理器的配置设置完成。[在使用 Supervisor 时](#supervisor-configuration)，您可以使用 `numprocs` 配置值。

#### 指定连接和队列

您还可以指定工作器应使用的队列连接。传递给 `work` 命令的连接名称应对应于您的 `config/queue.php` 配置文件中定义的连接之一：

```shell
php artisan queue:work redis
```

默认情况下，`queue:work` 命令仅处理给定连接上的默认队列的作业。但是，您可以通过仅处理给定连接上的特定队列来进一步自定义队列工作器。例如，如果您的所有电子邮件都在您的 `redis` 队列连接的 `emails` 队列中处理，那么您可以发出以下命令来启动一个只处理该队列的工作器：

```shell
php artisan queue:work redis --queue=emails
```

#### 处理指定数量的作业

`--once` 选项可以用于指示工作器只从队列中处理单个作业：

```shell
php artisan queue:work --once
```

`--max-jobs` 选项可以用于指示工作器处理给定数量的作业然后退出。结合 [Supervisor](#supervisor-configuration) 使用时，这个选项可能很有用，因为您的工作器会在处理给定数量的作业后自动重启，释放可能积累的任何内存：

```shell
php artisan queue:work --max-jobs=1000
```

#### 处理所有排队作业然后退出

`--stop-when-empty` 选项可以用于指示工作器处理所有作业然后优雅地退出。当在 Docker 容器中处理 Laravel 队列时，如果您希望在队列为空后关闭容器，这个选项可能会很有用：

```shell
php artisan queue:work --stop-when-empty
```

#### 处理作业指定秒数

`--max-time` 选项可以用于指示工作器处理作业指定秒数然后退出。结合 [Supervisor](#supervisor-configuration) 使用时，这个选项可能很有用，因为您的工作器会在处理作业指定时间后自动重启，释放可能积累的任何内存：

```shell
# Process jobs for one hour and then exit...
php artisan queue:work --max-time=3600
```

#### 工作器休眠时间

当队列上的作业可用时，工作器将在作业之间毫无延迟地持续处理作业。然而，如果队列上没有可用的作业，`sleep` 选项将决定工作器 "休眠" 多少秒。当然，在休眠时，工作器不会处理任何新作业：

```shell
php artisan queue:work --sleep=3
```

#### 维护模式和队列

当您的应用程序处于 [维护模式](/docs/11/getting-started/configuration#maintenance-mode) 时，不会处理任何排队的作业。一旦应用程序退出维护模式，作业将继续像往常一样处理。

如果您希望在维护模式启用时强制队列工作器处理作业，您可以使用 `--force` 选项：

```shell
php artisan queue:work --force
```

#### 资源考虑

Daemon 队列工作器在处理每个作业前不会 "重启" 框架。因此，您应该在每个作业完成后释放任何重资源。例如，如果您在使用 GD 库进行图像处理，当您完成图像处理后，应使用 `imagedestroy` 释放内存。

### 队列优先级

有时您可能希望建立如何处理队列的优先级。例如，在 `config/queue.php` 配置文件中，您可能会将 `redis` 连接的默认 `queue` 设置为 `low`。但是，偶尔您可能希望将作业推送到 `high` 优先级队列，如下所示：

```php
dispatch((new Job)->onQueue('high'));
```

要启动一个工作器以确保所有 `high` 队列作业在继续执行 `low` 队列上的任何作业之前都得到处理，请将逗号分隔的队列名称列表传递给 `work` 命令：

```shell
php artisan queue:work --queue=high,low
```

### 队列工作者与部署

由于队列工作者是长期运行的进程，如果不重启，它们不会注意到代码的变化。因此，使用队列工作者部署应用程序的最简单方法是在部署过程中重启工作者。您可以通过发出 `queue:restart` 命令来优雅地重启所有工作者：

```shell
php artisan queue:restart
```

这个命令会指示所有队列工作者在他们完成处理当前任务后优雅地退出，这样就不会丢失现有的任务。当执行 `queue:restart` 命令时，队列工作者将会退出，因此你应该运行一个进程管理器，如 Supervisor，来自动重启队列工作者。

> [!NOTE]
> 队列使用缓存存储重启信号，所以在使用此功能之前，您应该确认缓存驱动已为您的应用正确配置。

### 任务过期和超时

#### 任务过期

在您的 `config/queue.php` 配置文件中，每个队列连接都定义了一个 `retry_after` 选项。此选项指定队列连接在重试正在处理中的任务之前应该等待多少秒。例如，如果 `retry_after` 的值设置为 `90`，则如果任务已被处理 90 秒而未被释放或删除，该任务将被重新放回队列。通常，您应该将 `retry_after` 值设置为您的任务合理完成处理所需的最长秒数。

> [!WARNING]
> 唯一不包含 `retry_after` 值的队列连接是 Amazon SQS。SQS 会根据 [默认可见性超时](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/AboutVT.html)，该超时是在 AWS 控制台内管理的，来重试任务。

#### 工作者超时

`queue:work` Artisan 命令暴露了一个 `--timeout` 选项。默认情况下，`--timeout` 值为 60 秒。如果一个任务的处理时间超过了超时值指定的秒数，处理该任务的工作者将会出错退出。通常，工作者会被配置在您服务器上的 [进程管理器](#supervisor-configuration) 自动重启：

```shell
php artisan queue:work --timeout=60
```

`retry_after` 配置选项和 `--timeout` 命令行选项虽然不同，但它们共同确保任务不丢失，并且任何任务只被成功处理一次。

> [!WARNING] > `--timeout` 值应始终至少比您的 `retry_after` 配置值短几秒钟。这将确保处理冻结任务的工作者在任务被重试之前总是被终止。如果您的 `--timeout` 选项比 `retry_after` 配置值长，您的任务可能会被处理两次。

## Supervisor 配置

在生产环境中，您需要一种方法来保持您的 `queue:work` 进程运行。`queue:work` 进程可能会因各种原因停止运行，例如超过工作者超时或执行 `queue:restart` 命令。

因此，您需要配置一个进程监视器，可以检测您的 `queue:work` 进程何时退出并自动重启它们。此外，进程监视器可以让您指定希望同时运行多少个 `queue:work` 进程。Supervisor 是 Linux 环境中常用的进程监视器，我们将在以下文档中讨论如何配置它。

#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，如果 `queue:work` 进程失败，它将自动重启它们。要在 Ubuntu 上安装 Supervisor，您可以使用以下命令：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果您自己配置和管理 Supervisor 感到不知所措，可以考虑使用 [Laravel Forge](https://forge.laravel.com)，它将为您的生产 Laravel 项目自动安装和配置 Supervisor。

#### 配置 Supervisor

Supervisor 配置文件通常存储在 `/etc/supervisor/conf.d` 目录中。在此目录中，您可以创建任意数量的配置文件，指示 supervisor 如何监视您的进程。例如，让我们创建一个 `laravel-worker.conf` 文件，用来启动和监视 `queue:work` 进程：

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/app.com/artisan queue:work sqs --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=forge
numprocs=8
redirect_stderr=true
stdout_logfile=/home/forge/app.com/worker.log
stopwaitsecs=3600
```

在此示例中，`numprocs` 指令将指示 Supervisor 运行八个 `queue:work` 进程，并监视所有进程，如果它们失败，则自动重启它们。您应更改配置中的 `command` 指令，以反映您所需的队列连接和工作者选项。

> [!WARNING]
> 您应确保 `stopwaitsecs` 的值大于您最长运行任务消耗的秒数。否则，Supervisor 可能会在任务完成处理之前杀死它。

#### 启动 Supervisor

创建配置文件后，您可以使用以下命令更新 Supervisor 配置并启动进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start "laravel-worker:*"
```

有关 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

## 处理失败的作业

有时候你的队列作业可能会失败。别担心，事情不总是按计划进行！Laravel 提供了一种方便的方式来指定作业尝试的最大次数。在一个异步作业尝试次数超过这个数量后，它将被插入到 `failed_jobs` 数据库表中。同步派发的作业如果失败了，则不会存储在这个表中，它们的异常会立即被应用程序处理。

在新的 Laravel 应用程序中通常会预设一个用于创建 `failed_jobs` 表的迁移。然而，如果你的应用程序没有包含这个表的迁移，你可以使用 `make:queue-failed-table` 命令来创建迁移：

```shell
php artisan make:queue-failed-table

php artisan migrate
```

当运行一个队列工作进程时，你可以使用 `queue:work` 命令的 `--tries` 开关来指定作业尝试的最大次数。如果你没有为 `--tries` 选项指定一个值，作业将只尝试一次，或者尝试多次，这取决于作业类的 `$tries` 属性：

```shell
php artisan queue:work redis --tries=3
```

使用 `--backoff` 选项，你可以指定在重试遇到异常的作业前 Laravel 应该等待多少秒。默认情况下，作业会立即被释放回队列，以便再次尝试：

```shell
php artisan queue:work redis --tries=3 --backoff=3
```

如果你想要在每个作业的基础上配置在重试遇到异常的作业前 Laravel 应该等待多少秒，你可以通过在你的作业类中定义一个 `backoff` 属性来实现：

```php
/**
 * The number of seconds to wait before retrying the job.
 *
 * @var int
 */
public $backoff = 3;
```

如果你需要更复杂的逻辑来决定作业的退避时间，你可以在你的作业类上定义一个 `backoff` 方法：

```php
/**
 * Calculate the number of seconds to wait before retrying the job.
 */
public function backoff(): int
{
    return 3;
}
```

你可以通过从 `backoff` 方法返回一个退避值数组来轻松配置“指数”退避。在这个例子中，如果有更多尝试剩余，第一次重试的延迟将是 1 秒，第二次重试是 5 秒，第三次重试是 10 秒，并且每次后续重试都是 10 秒：

```php
/**
 * Calculate the number of seconds to wait before retrying the job.
 *
 * @return array<int, int>
 */
public function backoff(): array
{
    return [1, 5, 10];
}
```

### 处理失败的作业后的清理

当一个特定作业失败时，你可能想要向用户发送警报，或撤销作业部分完成的任何操作。为了实现这一点，你可以在作业类上定义一个 `failed` 方法。导致作业失败的 `Throwable` 实例将被传递给 `failed` 方法：

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessPodcast implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Podcast $podcast,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(AudioProcessor $processor): void
    {
        // Process uploaded podcast...
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        // Send user notification of failure, etc...
    }
}
```

> [!WARNING]  
> 在调用 `failed` 方法之前会实例化作业的一个新实例；因此，任何可能在 `handle` 方法内发生的类属性修改都将丢失。

### 重试失败的作业

要查看已经插入到 `failed_jobs` 数据库表中的所有失败作业，你可以使用 `queue:failed` Artisan 命令：

```shell
php artisan queue:failed
```

`queue:failed` 命令会列出作业 ID、连接、队列、失败时间以及关于作业的其他信息。可以使用作业 ID 来重试失败的作业。例如，要重试一个 ID 为 `ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece` 的失败作业，请执行以下命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece
```

如果有必要，你可以同时传递多个 ID 给这个命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece 91401d2c-0784-4f43-824c-34f94a33c24d
```

你也可以重试特定队列中的所有失败作业：

```shell
php artisan queue:retry --queue=name
```

要重试所有失败的作业，执行 `queue:retry` 命令并将 `all` 作为 ID 传递：

```shell
php artisan queue:retry all
```

如果你希望删除一个失败的作业，你可以使用 `queue:forget` 命令：

```shell
php artisan queue:forget 91401d2c-0784-4f43-824c-34f94a33c24d
```

> [!NOTE]  
> 使用 [Horizon](/docs/11/packages/horizon) 时，你应该使用 `horizon:forget` 命令来删除失败的作业，而不是 `queue:forget` 命令。

要从 `failed_jobs` 表中删除所有失败的作业，你可以使用 `queue:flush` 命令：

```shell
php artisan queue:flush
```

### 忽略缺失的模型

在将 Eloquent 模型注入到作业中时，这个模型会在放置到队列之前自动序列化，并在作业处理时重新从数据库获取。然而，如果模型在作业等待工作人员处理时被删除了，你的作业可能会因 `ModelNotFoundException` 而失败。

为了方便起见，你可以通过将作业的 `deleteWhenMissingModels` 属性设置为 `true` 来选择自动删除缺失模型的作业。当这个属性设置为 `true` 时，Laravel 会安静地丢弃作业，而不会引发异常：

```php
/**
 * Delete the job if its models no longer exist.
 *
 * @var bool
 */
public $deleteWhenMissingModels = true;
```

### 修剪失败的作业

你可以通过调用 `queue:prune-failed` Artisan 命令来修剪你的应用程序 `failed_jobs` 表中的记录：

```shell
php artisan queue:prune-failed
```

默认情况下，所有超过 24 小时的失败作业记录都将被修剪。如果你为命令提供 `--hours` 选项，那么只有在最后 N 小时内插入的失败作业记录才会被保留。例如，下面的命令将删除所有超过 48 小时插入的失败作业记录：

```shell
php artisan queue:prune-failed --hours=48
```

### 在 DynamoDB 中存储失败的作业

Laravel 也支持在 [DynamoDB](https://aws.amazon.com/dynamodb) 中而非关系型数据库表中存储失败作业的记录。然而，你必须手动创建一个 DynamoDB 表来存储所有的失败作业记录。通常，这个表应该被命名为 `failed_jobs`，但你应该根据应用程序的 `queue` 配置文件中 `queue.failed.table` 配置值来命名表。

`failed_jobs` 表应该有一个名为 `application` 的字符串主分区键，以及一个名为 `uuid` 的字符串主排序键。键的 `application` 部分将包含你的应用程序名称，该名称由应用程序的 `app` 配置文件中的 `name` 配置值定义。由于应用程序名称是 DynamoDB 表键的一部分，你可以使用同一个表来存储多个 Laravel 应用程序的失败作业。

此外，请确保你安装了 AWS SDK 以便你的 Laravel 应用程序可以与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `queue.failed.driver` 配置选项的值设置为 `dynamodb`。此外，你应该在失败作业配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将被用于与 AWS 进行认证。使用 `dynamodb` 驱动时，`queue.failed.database` 配置选项不是必须的：

```php
'failed' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'failed_jobs',
],
```

### 禁用失败作业的存储

你可以通过将 `queue.failed.driver` 配置选项的值设置为 `null` 来指示 Laravel 不存储失败的作业。通常，这通过 `QUEUE_FAILED_DRIVER` 环境变量来完成：

```ini
QUEUE_FAILED_DRIVER=null
```

### 失败作业事件

如果你想注册一个在作业失败时调用的事件监听器，你可以使用 `Queue` facade 的 `failing` 方法。例如，我们可以从 Laravel 中包含的 `AppServiceProvider` 的 `boot` 方法中附加一个闭包到这个事件：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Queue\Events\JobFailed;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        Queue::failing(function (JobFailed $event) {
            // $event->connectionName
            // $event->job
            // $event->exception
        });
    }
}
```

### 从队列中清除作业

> [!NOTE]  
> 在使用 [Horizon](/docs/11/packages/horizon) 时，你应该使用 `horizon:clear` 命令来清除队列中的作业，而不是 `queue:clear` 命令。

如果你希望删除默认连接的默认队列中的所有作业，你可以使用 `queue:clear` Artisan 命令来完成：

```shell
php artisan queue:clear
```

你也可以提供 `connection` 参数和 `queue` 选项来删除特定连接和队列中的作业：

```shell
php artisan queue:clear redis --queue=emails
```

> [!WARNING]  
> 从队列中清除作业仅适用于 SQS、Redis 和数据库队列驱动。此外，SQS 消息删除过程需要多达 60 秒，因此在你清除队列后的 60 秒内发送到 SQS 队列的作业也可能被删除。

### 监控队列

如果你的队列突然收到大量作业，可能会变得不堪重负，导致作业完成的等待时间变长。如果需要，Laravel 可以在你的队列作业数量超过指定阈值时提醒你。

首先，你应该[每分钟运行一次](/docs/11/digging-deeper/scheduling) `queue:monitor` 命令。该命令接受你希望监控的队列名称以及你所希望的作业数量阈值：

```shell
php artisan queue:monitor redis:default,redis:deployments --max=100
```

仅仅调度此命令并不足以触发通知提醒你队列状态不堪重负。当命令遇到作业数量超过你的阈值的队列时，将会派发一个 `Illuminate\Queue\Events\QueueBusy` 事件。你可以在应用程序的 `AppServiceProvider` 中监听这个事件来向你或你的开发团队发送通知：

```php
use App\Notifications\QueueHasLongWaitTime;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    Event::listen(function (QueueBusy $event) {
        Notification::route('mail', 'dev@example.com')
                ->notify(new QueueHasLongWaitTime(
                    $event->connection,
                    $event->queue,
                    $event->size
                ));
    });
}
```

### 测试

在测试派发作业的代码时，你可能希望指示 Laravel 实际上不执行作业本身，因为作业的代码可以直接单独地测试，而不是与派发它的代码一起测试。当然，为了测试作业本身，你可以在测试中实例化一个作业实例并直接调用 `handle` 方法。

你可以使用 `Queue` facade 的 `fake` 方法来阻止排队的作业实际被推送到队列。在调用了 `Queue` facade 的 `fake` 方法之后，你可以断言应用程序试图推送作业到队列：

```php
<?php

use App\Jobs\AnotherJob;
use App\Jobs\FinalJob;
use App\Jobs\ShipOrder;
use Illuminate\Support\Facades\Queue;

test('orders can be shipped', function () {
    Queue::fake();

    // Perform order shipping...

    // Assert that no jobs were pushed...
    Queue::assertNothingPushed();

    // Assert a job was pushed to a given queue...
    Queue::assertPushedOn('queue-name', ShipOrder::class);

    // Assert a job was pushed twice...
    Queue::assertPushed(ShipOrder::class, 2);

    // Assert a job was not pushed...
    Queue::assertNotPushed(AnotherJob::class);

    // Assert that a Closure was pushed to the queue...
    Queue::assertClosurePushed();

    // Assert the total number of jobs that were pushed...
    Queue::assertCount(3);
});
```

你可以将一个闭包传递给 `assertPushed` 或 `assertNotPushed` 方法来断言推送了一个通过特定“真实测试”的作业。如果至少有一个推送的作业通过了给定的真实测试，则断言将成功：

```php
Queue::assertPushed(function (ShipOrder $job) use ($order) {
    return $job->order->id === $order->id;
});
```

### 对一部分作业进行伪造

如果你只需要虚拟特定的作业，同时允许你的其他作业正常执行，你可以将作业的类名传递给 `fake` 方法，这些作业会被虚拟：

```php
test('orders can be shipped', function () {
    Queue::fake([
        ShipOrder::class,
    ]);

    // Perform order shipping...

    // Assert a job was pushed twice...
    Queue::assertPushed(ShipOrder::class, 2);
});
```

你可以使用 `except` 方法来虚拟除了一组特定作业的所有作业：

```php
Queue::fake()->except([
    ShipOrder::class,
]);
```

### 测试作业链

要测试作业链，你需要使用 `Bus` facade 的伪造功能。可以使用 `Bus` facade 的 `assertChained` 方法来断言[作业链](/docs/11/digging-deeper/queues#job-chaining)已经被派发。`assertChained` 方法接受一个作为其第一个参数的链式作业数组：

```php
use App\Jobs\RecordShipment;
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Support\Facades\Bus;

Bus::fake();

// ...

Bus::assertChained([
    ShipOrder::class,
    RecordShipment::class,
    UpdateInventory::class
]);
```

如上例所示，链式作业的数组可以是作业的类名数组。然而，你也可以提供一个实际作业实例的数组。当这样做时，Laravel 将确保作业实例是与你的应用程序派发的链式作业相同的类并且具有相同的属性值：

```php
Bus::assertChained([
    new ShipOrder,
    new RecordShipment,
    new UpdateInventory,
]);
```

你可以使用 `assertDispatchedWithoutChain` 方法来断言一个作业被推送而没有作业链：

```php
Bus::assertDispatchedWithoutChain(ShipOrder::class);
```

#### 测试作业链更改

如果链式作业[将作业添加到现有链中](#adding-jobs-to-the-chain)，你可以使用作业的 `assertHasChain` 方法来断言作业具有预期的剩余作业链：

```php
$job = new ProcessPodcast;

$job->handle();

$job->assertHasChain([
    new TranscribePodcast,
    new OptimizePodcast,
    new ReleasePodcast,
]);
```

可以使用 `assertDoesntHaveChain` 方法来断言作业的剩余链为空：

```php
$job->assertDoesntHaveChain();
```

#### 测试链式批次

如果你的作业链[包含一个作业批次](#chains-and-batches)，你可以通过在链式断言中插入一个 `Bus::chainedBatch` 定义来断言链式批次符合你的预期：

```php
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;

Bus::assertChained([
    new ShipOrder,
    Bus::chainedBatch(function (PendingBatch $batch) {
        return $batch->jobs->count() === 3;
    }),
    new UpdateInventory,
]);
```

### 测试作业批次

`Bus` facade 的 `assertBatched` 方法可以用来断言已经派发了一个[作业批次](/docs/11/digging-deeper/queues#job-batching)。提供给 `assertBatched` 方法的闭包接收到一个 `Illuminate\Bus\PendingBatch` 实例，该实例可用于检查批次中的作业：

```php
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;

Bus::fake();

// ...

Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->name == 'import-csv' &&
           $batch->jobs->count() === 10;
});
```

你可以使用 `assertBatchCount` 方法来断言派发了特定数量的批次：

```php
Bus::assertBatchCount(3);
```

你可以使用 `assertNothingBatched` 来断言没有批次被派发：

```php
Bus::assertNothingBatched();
```

#### 测试作业 / 批次互动

此外，你可能偶尔需要测试单个作业与其底层批次的互动。例如，你可能需要测试作业是否取消了其批次的进一步处理。要做到这一点，你需要通过 `withFakeBatch` 方法为作业分配一个假批次。`withFakeBatch` 方法返回一个包含作业实例和假批次的元组：

```php
[$job, $batch] = (new ShipOrder)->withFakeBatch();

$job->handle();

$this->assertTrue($batch->cancelled());
$this->assertEmpty($batch->added);
```

### 测试作业/队列互动

有时候，您可能需要测试一个排队的作业是否[将自己释放回队列](#manually-releasing-a-job)。或者，您可能需要测试作业是否已经删除了自己。您可以通过实例化作业并调用`withFakeQueueInteractions`方法来测试这些队列互动。

一旦作业的队列互动被模拟，您就可以调用作业的`handle`方法。调用作业之后，`assertReleased`、`assertDeleted`和`assertFailed`方法可用来对作业的队列互动进行断言：

```php
use App\Jobs\ProcessPodcast;

$job = (new ProcessPodcast)->withFakeQueueInteractions();

$job->handle();

$job->assertReleased(delay: 30);
$job->assertDeleted();
$job->assertFailed();
```

## 作业事件

使用`Queue`[facade](/docs/11/architecture-concepts/facades)上的`before`和`after`方法，您可以指定在处理排队作业之前或之后执行的回调函数。这些回调函数是执行额外日志记录或为仪表板增加统计数据的绝佳机会。通常，您应该从[服务提供者](/docs/11/architecture-concepts/providers)的`boot`方法中调用这些方法。例如，我们可以使用随 Laravel 提供的`AppServiceProvider`：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Queue::before(function (JobProcessing $event) {
            // $event->connectionName
            // $event->job
            // $event->job->payload()
        });

        Queue::after(function (JobProcessed $event) {
            // $event->connectionName
            // $event->job
            // $event->job->payload()
        });
    }
}
```

使用`Queue`[facade](/docs/11/architecture-concepts/facades)上的`looping`方法，您可以指定在工作进程尝试从队列获取作业之前执行的回调函数。例如，您可以注册一个闭包来回滚因先前失败的作业而遗留开启的任何事务：

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

Queue::looping(function () {
    while (DB::transactionLevel() > 0) {
        DB::rollBack();
    }
});
```
