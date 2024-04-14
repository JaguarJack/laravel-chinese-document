---
title: Laravel 事件
---

# 事件

[[toc]]

## 介绍

Laravel 的事件提供了一个简单的观察者模式实现，允许你订阅和监听应用程序内发生的各种事件。事件类通常存储在 `app/Events` 目录，而它们的监听器存储在 `app/Listeners`。如果你没有在你的应用程序中看到这些目录，不用担心，当你使用 Artisan 控制台命令生成事件和监听器时，它们将为你创建。

事件是解耦应用程序的各个方面的绝佳方式，因为一个事件可以有多个不互相依赖的监听器。例如，每次订单发货时，你可能希望向用户发送一个 Slack 通知。你可以触发一个 `App\Events\OrderShipped` 事件，该事件可以被监听器接收，并用来发送一个 Slack 通知，而不是将你的订单处理代码与 Slack 通知代码耦合在一起。

## 生成事件和监听器

要快速生成事件和监听器，您可以使用 `make:event` 和 `make:listener` Artisan 命令：

```shell
php artisan make:event PodcastProcessed

php artisan make:listener SendPodcastNotification --event=PodcastProcessed
```

为方便起见，您也可以在不提供额外参数的情况下调用 `make:event` 和 `make:listener` Artisan 命令。当你这样做时，Laravel 会自动提示你输入类名，并在创建监听器时输入它应该监听的事件：

```shell
php artisan make:event

php artisan make:listener
```

## 注册事件和监听器

### 事件发现

默认情况下，Laravel 将通过扫描应用程序的 `Listeners` 目录自动查找和注册你的事件监听器。当 Laravel 发现任何监听器类方法以 `handle` 或 `__invoke` 开始时，Laravel 会将这些方法注册为方法签名中类型提示的事件的监听器：

```php
use App\Events\PodcastProcessed;

class SendPodcastNotification
{
    /**
     * 处理给定事件。
     */
    public function handle(PodcastProcessed $event): void
    {
        // ...
    }
}
```

如果您计划将监听器存储在不同的目录或多个目录中，您可以指示 Laravel 扫描这些目录，方法是在应用程序的 `bootstrap/app.php` 文件中使用 `withEvents` 方法：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/Listeners',
])
```

可以使用 `event:list` 命令列出应用程序内注册的所有监听器：

```shell
php artisan event:list
```

#### 生产环境中的事件发现

为了给你的应用程序加速，你应该使用 `optimize` 或 `event:cache` Artisan 命令来缓存应用程序所有监听器的清单。通常，这个命令应该作为应用程序的[部署过程](/docs/11/getting-started/deployment#optimization)的一部分运行。框架将使用这个清单来加速事件注册过程。`event:clear`命令可以用来销毁事件缓存。

### 手动注册事件

使用 `Event` facade，您可以在应用程序的 `AppServiceProvider` 中的 `boot` 方法中手动注册事件及其相应的监听器：

```php
use App\Domain\Orders\Events\PodcastProcessed;
use App\Domain\Orders\Listeners\SendPodcastNotification;
use Illuminate\Support\Facades\Event;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(
        PodcastProcessed::class,
        SendPodcastNotification::class,
    );
}
```

可以使用 `event:list` 命令列出应用程序内注册的所有监听器：

```shell
php artisan event:list
```

### 闭包监听器

通常监听器被定义为类，但是，您还可以在应用程序的 `AppServiceProvider` 的 `boot` 方法中手动注册基于闭包的事件监听器：

```php
use App\Events\PodcastProcessed;
use Illuminate\Support\Facades\Event;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(function (PodcastProcessed $event) {
        // ...
    });
}
```

#### 可队列的匿名事件监听器

当注册基于闭包的事件监听器时，你可以将监听器的闭包包裹在 `Illuminate\Events\queueable` 函数内，以指示 Laravel 使用[队列](/docs/11/digging-deeper/queues)执行监听器：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(queueable(function (PodcastProcessed $event) {
        // ...
    }));
}
```

就像队列化的工作任务一样，你可以使用 `onConnection`、`onQueue` 和 `delay` 方法来自定义队列监听器的执行：

```php
Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->onConnection('redis')->onQueue('podcasts')->delay(now()->addSeconds(10)));
```

如果你想处理匿名的队列化监听器失败的情况，你可以在定义 `queueable` 监听器时提供一个闭包给 `catch` 方法。此闭包将接收事件实例和导致监听器失败的 `Throwable` 实例：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;
use Throwable;

Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->catch(function (PodcastProcessed $event, Throwable $e) {
    // 队列监听器失败...
}));
```

#### 通配符事件监听器

您还可以使用 `*` 字符作为通配符参数来注册监听器，允许您使用同一监听器捕获多个事件。通配符监听器将事件名称作为它们的第一个参数，并将整个事件数据数组作为它们的第二个参数接收：

```php
Event::listen('event.*', function (string $eventName, array $data) {
    // ...
});
```

## 定义事件

事件类本质上是一个数据容器，包含与事件相关的信息。例如，假设 `App\Events\OrderShipped` 事件接收到一个 [Eloquent ORM](/docs/11/eloquent/eloquent) 对象：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * 创建一个新的事件实例。
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

如你所见，这个事件类不包含逻辑。它是购买的 `App\Models\Order` 实例的容器。如果事件对象被 PHP 的 `serialize` 函数序列化，如在使用[队列化监听器](#queued-event-listeners)时，事件使用的 `SerializesModels` 特性将优雅地序列化任何 Eloquent 模型。

## 定义监听器

接下来，让我们看看我们示例事件的监听器。事件监听器在它们的 `handle` 方法中接收事件实例。当使用 `--event` 选项调用 `make:listener` Artisan 命令时，它会自动导入正确的事件类并在 `handle` 方法中类型提示事件。在 `handle` 方法中，你可以执行任何响应事件所需的操作：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;

class SendShipmentNotification
{
    /**
     * 创建事件监听器。
     */
    public function __construct()
    {
        // ...
    }

    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        // 使用 $event->order 访问订单...
    }
}
```

> [!NOTE]
> 你的事件监听器也可以在构造函数中类型提示它们需要的任何依赖。所有事件监听器都是通过 Laravel [服务容器](/docs/11/architecture-concepts/container)解析的，因此依赖项将自动注入。

#### 停止事件的传播

有时，你可能希望停止事件传播给其他监听器。你可以通过在监听器的 `handle` 方法返回 `false` 来做到。

## 队列化事件监听器

如果监听器将执行一个慢任务，如发送电子邮件或发出 HTTP 请求，那么队列化监听器可能是有益的。在使用队列监听器之前，请确保[配置你的队列](/docs/11/digging-deeper/queues)并在你的服务器或本地开发环境上启动一个队列工作者。

要指定一个监听器应该被队列化，只需在监听器类中添加 `ShouldQueue` 接口。`make:listener` Artisan 命令生成的监听器已经导入了这个接口到当前的命名空间，所以你可以立即使用它：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

这就是全部了！现在，当一个由这个监听器处理的事件被分派时，监听器会自动由事件分派器使用 Laravel 的[队列系统](/docs/11/digging-deeper/queues)进行队列化。如果队列中执行监听器时没有抛出异常，队列化的作业将在处理完成后自动删除。

#### 自定义队列连接、队列名称和延迟

如果你想自定义事件监听器的队列连接、队列名称或队列延迟时间，你可以在监听器类上定义 `$connection`、`$queue` 或 `$delay` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * 任务应该发送到的连接的名称。
     *
     * @var string|null
     */
    public $connection = 'sqs';

    /**
     * 任务应该发送到的队列的名称。
     *
     * @var string|null
     */
    public $queue = 'listeners';

    /**
     * 任务应该被处理的时间（秒）。
     *
     * @var int
     */
    public $delay = 60;
}
```

如果你想在运行时定义监听器的队列连接、队列名称或延迟，你可以在监听器中定义 `viaConnection`、`viaQueue` 或 `withDelay` 方法：

```php
/**
 * 获取监听器队列连接的名称。
 */
public function viaConnection(): string
{
    return 'sqs';
}

/**
 * 获取监听器的队列名称。
 */
public function viaQueue(): string
{
    return 'listeners';
}

/**
 * 获取作业处理前的秒数。
 */
public function withDelay(OrderShipped $event): int
{
    return $event->highPriority ? 0 : 60;
}
```

#### 有条件地队列监听器

有时，你可能需要根据仅在运行时可用的某些数据来确定监听器是否应该进入队列。为此，可以在监听器中添加 `shouldQueue` 方法来确定监听器是否应该进入队列。如果 `shouldQueue` 方法返回 `false`，监听器将不会执行：

```php
<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class RewardGiftCard implements ShouldQueue
{
    /**
     * 奖励顾客礼品卡。
     */
    public function handle(OrderCreated $event): void
    {
        // ...
    }

    /**
     * 确定监听器是否应该进入队列。
     */
    public function shouldQueue(OrderCreated $event): bool
    {
        return $event->order->subtotal >= 5000;
    }
}
```

### 手动交互队列

如果你需要手动访问监听器底层队列作业的 `delete` 和 `release` 方法，你可以使用 `Illuminate\Queue\InteractsWithQueue` trait 来进行。这个特性默认情况下被生成的监听器导入，并提供了这些方法的访问能力：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        if (true) {
            $this->release(30);
        }
    }
}
```

### 队列化事件监听器与数据库事务

当队列监听器在数据库事务内被分派时，它们可能会在数据库事务提交之前被队列处理。发生这种情况时，你在数据库事务中对模型或数据库记录所做的任何更新可能尚未反映到数据库中。此外，事务中创建的任何模型或数据库记录可能不存在于数据库中。如果你的监听器依赖于这些模型，如果处理分派队列监听器的作业时，可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以通过在监听器类上实现 `ShouldHandleEventsAfterCommit` 接口，来指示特定的队列监听器在所有打开的数据库事务提交后分派：

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue, ShouldHandleEventsAfterCommit
{
    use InteractsWithQueue;
}
```

> [!NOTE]
> 要了解更多关于如何解决这些问题的信息，请查看有关[队列作业和数据库事务](/docs/11/digging-deeper/queues#jobs-and-database-transactions)的文档。

### 处理失败的作业

有时你的队列事件监听器可能会失败。如果队列监听器超过了你的队列工作者定义的最大尝试次数，监听器的 `failed` 方法将被调用。`failed` 方法接收事件实例和导致失败的 `Throwable`：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        // ...
    }

    /**
     * 处理作业失败。
     */
    public function failed(OrderShipped $event, Throwable $exception): void
    {
        // ...
    }
}
```

#### 指定队列监听器的最大尝试次数

如果你的队列监听器遇到错误，你可能不希望它无限尝试。因此，Laravel 提供了多种方法来指定监听器可能尝试的次数或时间。

你可以在监听器类上定义一个 `$tries` 属性，来指定监听器在被视为失败之前可以尝试的次数：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 队列监听器可以被尝试的次数。
     *
     * @var int
     */
    public $tries = 5;
}
```

作为定义监听器在失败之前可以尝试的次数的替代方法，你可以定义一个时间，在该时间之后不再尝试监听器。这允许监听器在给定的时间框架内尝试任意次数。要定义不再尝试监听器的时间，可以在监听器类中添加一个 `retryUntil` 方法。此方法应返回一个 `DateTime` 实例：

```php
use DateTime;

/**
 * 确定监听器处理超时的时间。
 */
public function retryUntil(): DateTime
{
    return now()->addMinutes(5);
}
```

## Dispatching Events

要调度一个事件，你可以调用事件的静态 `dispatch` 方法。这个方法是由 `Illuminate\Foundation\Events\Dispatchable` trait 在事件上提供的。传递给 `dispatch` 方法的任何参数都会传递给事件的构造函数：

```php
<?php

namespace App\Http\Controllers;

use App\Events\OrderShipped;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrderShipmentController extends Controller
{
    /**
     * 发货给定订单。
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 订单发货逻辑...

        OrderShipped::dispatch($order);

        return redirect('/orders');
    }
}
```

如果你想要条件性调度一个事件，你可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
OrderShipped::dispatchIf($condition, $order);

OrderShipped::dispatchUnless($condition, $order);
```

> [!NOTE]
> 在测试时，断言某些事件被调度而不实际触发它们的监听器可能很有帮助。Laravel 的[内置测试助手](#testing)使其变得简单。

### 在数据库事务后调度事件

有时候，你可能想指示 Laravel 只有在活动的数据库事务提交后才调度事件。为此，你可以在事件类上实现 `ShouldDispatchAfterCommit` 接口。

这个接口指示 Laravel 直到当前的数据库事务提交后才调度事件。如果事务失败，事件将被丢弃。如果在调度事件时没有进行数据库事务，则事件将立即调度：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped implements ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * 创建一个新的事件实例。
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

## Event Subscribers

### 编写事件订阅者

事件订阅者是类，在订阅者类本身中可以订阅多个事件，允许你在一个类中定义几个事件处理程序。订阅者应该定义一个 `subscribe` 方法，它将传递一个事件调度器实例。你可以在给定的调度器上调用 `listen` 方法来注册事件监听器：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * 处理用户登录事件。
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * 处理用户注销事件。
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * 为订阅者注册监听器。
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            Login::class,
            [UserEventSubscriber::class, 'handleUserLogin']
        );

        $events->listen(
            Logout::class,
            [UserEventSubscriber::class, 'handleUserLogout']
        );
    }
}
```

如果你的事件监听器方法在订阅者中定义，你可能会发现从订阅者的 `subscribe` 方法返回事件和方法名的数组更方便。Laravel 将在注册事件监听器时自动确定订阅者的类名：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * 处理用户登录事件。
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * 处理用户注销事件。
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * 为订阅者注册监听器。
     *
     * @return array<string, string>
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleUserLogin',
            Logout::class => 'handleUserLogout',
        ];
    }
}
```

### 注册事件订阅者

在编写了订阅者之后，你就可以用事件调度器注册它了。你可以使用 `Event` facade 的 `subscribe` 方法注册订阅者。通常，这应该在应用程序的 `AppServiceProvider` 的 `boot` 方法中完成：

```php
<?php

namespace App\Providers;

use App\Listeners\UserEventSubscriber;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Event::subscribe(UserEventSubscriber::class);
    }
}
```

## Testing

在测试调度事件的代码时，你可能希望指示 Laravel 实际上不执行事件的监听器，因为监听器的代码可以直接并独立于调度相应事件的代码进行测试。当然，要测试监听器本身，你可以在你的测试中实例化一个监听器并直接调用 `handle` 方法。

使用 `Event` facade 的 `fake` 方法，你可以阻止监听器执行，执行被测试的代码，然后使用 `assertDispatched`、`assertNotDispatched` 和 `assertNothingDispatched` 方法断言你的应用程序调度了哪些事件：

```php
<?php

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;

test('orders can be shipped', function () {
    Event::fake();

    // 执行订单发货...

    // 断言一个事件被调度...
    Event::assertDispatched(OrderShipped::class);

    // 断言一个事件被调度两次...
    Event::assertDispatched(OrderShipped::class, 2);

    // 断言一个事件没有被调度...
    Event::assertNotDispatched(OrderFailedToShip::class);

    // 断言没有事件被调度...
    Event::assertNothingDispatched();
});
```

你可以向 `assertDispatched` 或 `assertNotDispatched` 方法传递一个闭包，以断言调度了通过给定“真测试”的事件。如果至少有一个事件调度通过给定的真测试，那么断言将会成功：

```php
Event::assertDispatched(function (OrderShipped $event) use ($order) {
    return $event->order->id === $order->id;
});
```

如果你只是想断言一个事件监听器正在监听一个给定的事件，你可以使用 `assertListening` 方法：

```php
Event::assertListening(
    OrderShipped::class,
    SendShipmentNotification::class
);
```

> [!WARNING]
> 在调用 `Event::fake()` 后，不会执行任何事件监听器。因此，如果你的测试使用依赖于事件的模型工厂，例如在模型的 `creating` 事件期间创建一个 UUID，你应该在使用工厂**之后**调用 `Event::fake()`。

### 伪造事件的子集

如果你只想伪造特定一组事件的事件监听器，你可以将它们传递给 `fake` 或 `fakeFor` 方法：

```php
test('orders can be processed', function () {
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其他事件正常调度...
    $order->update([...]);
});
```

你可以使用 `except` 方法伪造所有事件，除了指定的一组事件：

```php
Event::fake()->except([
    OrderCreated::class,
]);
```

### 限定范围的事件假设

如果你只想在测试的一部分中伪造事件监听器，你可以使用 `fakeFor` 方法：

```php
<?php

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Support\Facades\Event;

test('orders can be processed', function () {
    $order = Event::fakeFor(function () {
        $order = Order::factory()->create();

        Event::assertDispatched(OrderCreated::class);

        return $order;
    });

    // 事件正常调度和观察器将运行...
    $order->update([...]);
});
```
