---
title: Laravel 模拟
---

# 模拟

[[toc]]

## 简介

在测试 Laravel 应用程序时，您可能希望“模拟”应用程序的某些方面，以便在给定的测试过程中它们实际上不被执行。例如，当测试分发事件的控制器时，您可能希望模拟事件监听器，以便在测试中它们实际上不会被执行。这允许您只测试控制器的 HTTP 响应，而不必担心事件监听器的执行，因为事件监听器可以在它们自己的测试用例中被测试。

Laravel 提供了用于模拟事件、任务和其他 facades 的有用方法。这些辅助功能主要在 Mockery 之上提供了便利层，所以您不必手动进行复杂的 Mockery 方法调用。

## 模拟对象

当您需要模拟一个对象，并将其通过 Laravel 的[服务容器](/docs/11/architecture-concepts/container)注入到您的应用程序时，您需要将模拟的实例作为 `instance` 绑定到容器中。这将指示容器使用您的模拟对象实例，而不是构造对象本身：

```php
use App\Service;
use Mockery;
use Mockery\MockInterface;

test('可以模拟某些事情', function () {
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->shouldReceive('process')->once();
        })
    );
});
```

```php
use App\Service;
use Mockery;
use Mockery\MockInterface;

public function test_something_can_be_mocked(): void
{
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->shouldReceive('process')->once();
        })
    );
}
```

为了让这更方便，你可以使用 Laravel 基本测试用例类提供的 `mock` 方法。例如，下面的例子与上面的例子等价：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->mock(Service::class, function (MockInterface $mock) {
    $mock->shouldReceive('process')->once();
});
```

当您只需要模拟对象的几个方法时，可以使用 `partialMock` 方法。没有被模拟的方法将在被调用时正常执行：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->partialMock(Service::class, function (MockInterface $mock) {
    $mock->shouldReceive('process')->once();
});
```

类似地，如果你想对一个对象进行[间谍](http://docs.mockery.io/en/latest/reference/spies.html)，Laravel 的基本测试用例类也提供了一个 `spy` 方法作为 `Mockery::spy` 方法的方便包装。间谍与模拟类似；然而，间谍记录间谍与被测试代码之间的任何互动，使您可以在代码执行后进行断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

## 模拟 Facades

与传统的静态方法调用不同，[facades](/docs/11/architecture-concepts/facades)（包括[实时 facades](/docs/11/architecture-concepts/facades#real-time-facades)）可以被模拟。这比传统的静态方法提供了很大的优势，并给您提供了如果您使用传统依赖注入时相同的可测试性。在测试时，您可能经常想要模拟在控制器中发生的对 Laravel facade 的调用。例如，考虑以下控制器动作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 检索应用程序的所有用户的列表。
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

我们可以使用 `shouldReceive` 方法模拟对 `Cache` facade 的调用，该方法将返回一个 [Mockery](https://github.com/padraic/mockery) 模拟实例。由于 facades 实际上是通过 Laravel [服务容器](/docs/11/architecture-concepts/container)解析和管理的，所以它们比典型的静态类有更多的可测试性。例如，让我们模拟对 `Cache` facade 的 `get` 方法的调用：

```php
<?php

use Illuminate\Support\Facades\Cache;

test('获取索引', function () {
    Cache::shouldReceive('get')
                ->once()
                ->with('key')
                ->andReturn('value');

    $response = $this->get('/users');

    // ...
});
```

```php
<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_get_index(): void
    {
        Cache::shouldReceive('get')
                    ->once()
                    ->with('key')
                    ->andReturn('value');

        $response = $this->get('/users');

        // ...
    }
}
```

> [!WARNING]  
> 您不应该模拟 `Request` facade。相反，在运行测试时，将您希望的输入传递给诸如 `get` 和 `post` 的 [HTTP 测试方法](/docs/11/testing/http-tests)。同样，不要模拟 `Config` facade，而是在测试中调用 `Config::set` 方法。

### Facade Spies

如果您想对 facade 进行[间谍](http://docs.mockery.io/en/latest/reference/spies.html)，您可以在相应的 facade 上调用 `spy` 方法。间谍与模拟类似；然而，间谍记录间谍与被测试代码之间的任何互动，使您可以在代码执行后进行断言：

```php
<?php

use Illuminate\Support\Facades\Cache;

test('值被存储在缓存中', function () {
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->once()->with('name', 'Taylor', 10);
});
```

```php
use Illuminate\Support\Facades\Cache;

public function test_values_are_be_stored_in_cache(): void
{
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->once()->with('name', 'Taylor', 10);
}
```

## 与时间互动

在测试时，您可能偶尔需要修改诸如 `now` 或 `Illuminate\Support\Carbon::now()` 等助手返回的时间。值得庆幸的是，Laravel 的基础特征测试类包括允许您操纵当前时间的助手：

```php
test('时间可以被操控', function () {
    // 旅行到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 旅行到过去...
    $this->travel(-5)->hours();

    // 旅行到一个明确的时间...
    $this->travelTo(now()->subHours(6));

    // 返回到当前时间...
    $this->travelBack();
});
```

```php
public function test_time_can_be_manipulated(): void
{
    // 旅行到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 旅行到过去...
    $this->travel(-5)->hours();

    // 旅行到一个明确的时间...
    $this->travelTo(now()->subHours(6));

    // 返回到当前时间...
    $this->travelBack();
}
```

您还可以向各种时间旅行方法提供一个闭包。闭包将在指定时间冻结时被调用。一旦闭包执行完毕，时间将恢复正常：

```php
$this->travel(5)->days(function () {
    // 测试未来五天内的某些事情...
});

$this->travelTo(now()->subDays(10), function () {
    // 在给定时刻测试某事...
});
```

`freezeTime` 方法可以用来冻结当前时间。同样，`freezeSecond` 方法将冻结当前时间，但在当前秒的开始：

```php
use Illuminate\Support\Carbon;

// 冻结时间并在执行闭包后恢复正常时间...
$this->freezeTime(function (Carbon $time) {
    // ...
});

// 冻结当前秒的时间并在执行闭包后恢复正常时间...
$this->freezeSecond(function (Carbon $time) {
    // ...
})
```

正如您所期望的，上面讨论的所有方法主要用于测试时间敏感的应用程序行为，例如锁定讨论论坛上的不活跃帖子：

```php
use App\Models\Thread;

test('论坛主题在一周不活跃后锁定', function () {
    $thread = Thread::factory()->create();

    $this->travel(1)->week();

    expect($thread->isLockedByInactivity())->toBeTrue();
});
```

```php
use App\Models\Thread;

public function test_forum_threads_lock_after_one_week_of_inactivity()
{
    $thread = Thread::factory()->create();

    $this->travel(1)->week();

    $this->assertTrue($thread->isLockedByInactivity());
}
```
