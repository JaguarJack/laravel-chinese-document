---
title: Laravel 上下文
---

# 上下文

[[toc]]

## 介绍

Laravel 的 "上下文" 功能允许你在应用程序内执行的请求、任务和命令中捕获、检索和共享信息。这些捕获的信息也包含在应用程序编写的日志中，让你更深入了解在写入日志条目之前发生的代码执行历史，使你能跟踪分布式系统中的执行流程。

### 工作原理

理解 Laravel 上下文功能的最佳方式是使用内置的日志功能来看它的实际操作。要开始，你可以使用 `Context` facade [添加信息到上下文](#capturing-context)。在此示例中，我们将使用 [中间件](/docs/11/basics/middleware) 在每个传入请求中添加请求 URL 和唯一跟踪 ID 到上下文中：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AddContext
{
    /**
     * 处理传入请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('url', $request->url());
        Context::add('trace_id', Str::uuid()->toString());

        return $next($request);
    }
}
```

添加到上下文中的信息将自动作为元数据附加到在请求期间编写的任何 [日志条目](/docs/11/basics/logging) 中。作为元数据附加上下文信息允许通过 `Context` 共享的信息与各个日志条目传递的信息进行区分。例如，设想我们写下以下日志条目：

```php
Log::info('User authenticated.', ['auth_id' => Auth::id()]);
```

编写的日志不仅包含传递给日志条目的 `auth_id`，还包含上下文中的 `url` 和 `trace_id` 作为元数据：

```
User authenticated. {"auth_id":27} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

添加到上下文中的信息也可用于调度到队列的任务。例如，设想我们在添加一些信息到上下文后将一个 `ProcessPodcast` 任务调度到队列：

```php
// 在我们的中间件中...
Context::add('url', $request->url());
Context::add('trace_id', Str::uuid()->toString());

// 在我们的控制器中...
ProcessPodcast::dispatch($podcast);
```

当任务被调度时，当前存储在上下文中的任何信息将被捕获并与任务共享。执行任务时，捕获的信息将被重新注入当前上下文中。因此，如果我们的任务的 `handle` 方法写入日志：

```php
class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // ...

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        Log::info('Processing podcast.', [
            'podcast_id' => $this->podcast->id,
        ]);

        // ...
    }
}
```

结果的日志条目会包含在最初调度任务的请求期间添加到上下文中的信息：

```
Processing podcast. {"podcast_id":95} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

尽管我们关注的是 Laravel 上下文的内置日志相关特性，以下文档将说明上下文如何允许你跨 HTTP 请求 / 排队任务边界共享信息，甚至如何添加[隐藏的上下文数据](#hidden-context)，这些数据不会与日志条目一起编写。

## 捕获上下文

您可以使用 `Context` facade 的 `add` 方法在当前上下文中存储信息：

```php
use Illuminate\Support\Facades\Context;

Context::add('key', 'value');
```

要一次性添加多个项目，您可以将一个关联数组传递给 `add` 方法：

```php
Context::add([
    'first_key' => 'value',
    'second_key' => 'value',
]);
```

`add` 方法会覆盖任何存在且共享相同键的值。如果您只希望在键不存在时添加信息到上下文，您可以使用 `addIf` 方法：

```php
Context::add('key', 'first');

Context::get('key');
// "first"

Context::addIf('key', 'second');

Context::get('key');
// "first"
```

#### 条件上下文

`when` 方法可用于基于给定条件添加数据到上下文。如果给定条件评估为 `true`，`when` 方法提供的第一个闭包将被调用，如果条件评估为 `false`，将调用第二个闭包：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;

Context::when(
    Auth::user()->isAdmin(),
    fn ($context) => $context->add('permissions', Auth::user()->permissions),
    fn ($context) => $context->add('permissions', []),
);
```

### 栈

上下文提供了创建 "栈" 的能力，即按添加顺序存储的数据列表。您可以通过调用 `push` 方法将信息添加到栈中：

```php
use Illuminate\Support\Facades\Context;

Context::push('breadcrumbs', 'first_value');

Context::push('breadcrumbs', 'second_value', 'third_value');

Context::get('breadcrumbs');
// [
//     'first_value',
//     'second_value',
//     'third_value',
// ]
```

栈可用于捕获有关请求的历史信息，例如应用程序中发生的事件。例如，您可以创建一个事件监听器，每次执行查询时压入到栈中，捕获查询 SQL 和持续时间作为元组：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;

DB::listen(function ($event) {
    Context::push('queries', [$event->time, $event->sql]);
});
```

## 检索上下文

您可以使用 `Context` facade 的 `get` 方法从上下文中检索信息：

```php
use Illuminate\Support\Facades\Context;

$value = Context::get('key');
```

您可以使用 `only` 方法检索上下文中的信息子集：

```php
$data = Context::only(['first_key', 'second_key']);
```

如果您想检索存储在上下文中的所有信息，您可以调用 `all` 方法：

```php
$data = Context::all();
```

### 确定项目存在

您可以使用 `has` 方法确定上下文是否存储了给定键的任何值：

```php
use Illuminate\Support\Facades\Context;

if (Context::has('key')) {
    // ...
}
```

`has` 方法将不管存储的值如何都返回 `true`。因此，例如，带有 `null` 值的键会被认为存在：

```php
Context::add('key', null);

Context::has('key');
// true
```

## 移除上下文

`forget` 方法可用于从当前上下文中移除键及其值：

```php
use Illuminate\Support\Facades\Context;

Context::add(['first_key' => 1, 'second_key' => 2]);

Context::forget('first_key');

Context::all();

// ['second_key' => 2]
```

您可以通过向 `forget` 方法提供一个数组一次性忘记多个键：

```php
Context::forget(['first_key', 'second_key']);
```

## 隐藏上下文

上下文提供了存储 "隐藏" 数据的能力。这些隐藏信息不会附加到日志中，也无法通过上面记录的数据检索方法访问。上下文提供了一组不同的方法来交互隐藏的上下文信息：

```php
use Illuminate\Support\Facades\Context;

Context::addHidden('key', 'value');

Context::getHidden('key');
// 'value'

Context::get('key');
// null
```

"隐藏" 方法映射了上面记录的非隐藏方法的功能：

```php
Context::addHidden(/* ... */);
Context::addHiddenIf(/* ... */);
Context::pushHidden(/* ... */);
Context::getHidden(/* ... */);
Context::onlyHidden(/* ... */);
Context::allHidden(/* ... */);
Context::hasHidden(/* ... */);
Context::forgetHidden(/* ... */);
```

## 事件

上下文分派了两个事件，允许你挂钩到上下文的水合和脱水过程中。

为了说明这些事件如何被使用，假设在你的应用程序的中间件中，你根据传入 HTTP 请求的 `Accept-Language` 头设置 `app.locale` 配置值。上下文的事件允许你在请求期间捕获此值并在队列上恢复它，确保在队列上发送的通知有正确的 `app.locale` 值。我们可以使用上下文的事件和[隐藏](#hidden-context)数据来实现这一点，以下文档将进行说明。

### 脱水

每当一个任务被调度到队列时，上下文中的数据会被 "脱水" 并与任务的载荷一起捕获。`Context::dehydrating` 方法允许您注册一个闭包，在脱水过程中被调用。在此闭包中，您可以对将与排队任务共享的数据进行更改。

通常，您应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册 `dehydrating` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Context::dehydrating(function (Repository $context) {
        $context->addHidden('locale', Config::get('app.locale'));
    });
}
```

> [!NOTE]
> 您不应该在 `dehydrating` 回调中使用 `Context` facade，因为那会改变当前进程的上下文。确保您只对传递给回调的存储库进行更改。

### 水合

每当一个排队的任务开始在队列上执行时，与任务共享的任何上下文都会被 "水合" 回当前上下文。`Context::hydrated` 方法允许您注册一个在水合过程中被调用的闭包。

通常，您应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册 `hydrated` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Context::hydrated(function (Repository $context) {
        if ($context->hasHidden('locale')) {
            Config::set('app.locale', $context->getHidden('locale'));
        }
    });
}
```

> [!NOTE]
> 您不应该在 `hydrated` 回调中使用 `Context` facade，确保您只对传递给回调的存储库进行更改。
