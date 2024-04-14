---
title: Laravel 限流器 速率限制
---

# 速率限制

[[toc]]

## 简介

Laravel 包含了一个简单易用的速率限制抽象，在与您应用的[缓存](cache)结合使用时，它提供了一种简单的方法来限制在指定时间窗口内的任何操作。

[!NOTE]

> 如果您对限制传入 HTTP 请求的速率感兴趣，请参阅[速率限制器中间件文档](/docs/11/basics/routing#rate-limiting)。

### 缓存配置

通常，速率限制器使用您在应用的 `cache` 配置文件中定义的 `default` 键指定的默认应用缓存。不过，您可以在应用的 `cache` 配置文件中定义一个 `limiter` 键来指定速率限制器应使用哪个缓存驱动：

```php
'default' => env('CACHE_STORE', 'database'),

'limiter' => 'redis',
```

## 基本使用

可以使用 `Illuminate\Support\Facades\RateLimiter` facade 来与速率限制器进行交互。速率限制器提供的最简单方法是 `attempt` 方法，它可以限制在给定的秒数内对给定回调的速率。

当回调没有剩余尝试次数可用时，`attempt` 方法返回 `false`；否则，`attempt` 方法将返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是速率限制器的 "key"，它可以是代表被限制操作的任何字符串：

```php
use Illuminate\Support\Facades\RateLimiter;

$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perMinute = 5,
    function() {
        // 发送消息...
    }
);

if (! $executed) {
  return '发送消息太频繁了！';
}
```

如果需要，您可以向 `attempt` 方法提供第四个参数，即 "衰退率"，或者直到可用尝试次数重置的秒数。例如，我们可以修改上面的示例，以允许每两分钟进行五次尝试：

```php
$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perTwoMinutes = 5,
    function() {
        // 发送消息...
    },
    $decayRate = 120,
);
```

### 手动增加尝试次数

如果你想手动与速率限制器交互，有多种其他方法可用。例如，您可以调用 `tooManyAttempts` 方法来确定给定的速率限制器 key 是否超过了它每分钟允许的最大尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return '尝试次数过多！';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息...
```

或者，您可以使用 `remaining` 方法来检索一个给定 key 的剩余尝试次数。如果一个给定的 key 还有剩余的重试次数，您可以调用 `increment` 方法来增加总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::increment('send-message:'.$user->id);

    // 发送消息...
}
```

如果您想为给定的速率限制器 key 增加的值超过一个，您可以提供所需的数量给 `increment` 方法：

```php
RateLimiter::increment('send-message:'.$user->id, amount: 5);
```

#### 确定限制器的可用性

当一个 key 没有更多的尝试次数剩余时，`availableIn` 方法返回直到更多尝试次数可用的秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return '您可以在 '.$seconds.' 秒后再试。';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息...
```

### 清除尝试次数

您可以使用 `clear` 方法重置给定速率限制器 key 的尝试次数。例如，当给定消息被接收者阅读时，您可以重置尝试次数：

```php
use App\Models\Message;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 标记消息为已读。
 */
public function read(Message $message): Message
{
    $message->markAsRead();

    RateLimiter::clear('send-message:'.$message->user_id);

    return $message;
}
```
