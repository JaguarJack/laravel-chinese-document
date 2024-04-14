---
title: Laravel 生成 URL
---

# 生成 URL

[[toc]]

## 介绍

Laravel 提供了几个助手函数来帮助你为应用程序生成 URL。这些助手在构建模板和 API 响应中的链接，或生成重定向响应到应用程序的另一部分时尤其有用。

## 基础

### 生成 URL

`url` 助手可以用来生成应用程序的任意 URL。生成的 URL 将自动使用当前请求处理中的协议（HTTP 或 HTTPS）和主机：

```php
$post = App\Models\Post::find(1);

echo url("/posts/{$post->id}");

// http://example.com/posts/1
```

### 访问当前 URL

如果没有向 `url` 助手提供路径，则返回一个 `Illuminate\Routing\UrlGenerator` 实例，允许你访问当前 URL 的信息：

```php
// 获取当前不包含查询字符串的 URL...
echo url()->current();

// 获取当前包含查询字符串的 URL...
echo url()->full();

// 获取上一次请求的完整 URL...
echo url()->previous();
```

这些方法也可以通过 `URL` [facade](/docs/11/architecture-concepts/facades) 访问：

```php
use Illuminate\Support\Facades\URL;

echo URL::current();
```

## 命名路由 URL

可以使用 `route` 助手生成 [命名路由](/docs/11/basics/routing#named-routes) 的 URL。命名路由允许你在不依赖于路由上实际定义的 URL 的情况下生成 URL。因此，如果路由的 URL 发生变化，不需要对 `route` 函数的调用进行任何更改。例如，假设你的应用程序包含如下定义的路由：

```php
Route::get('/post/{post}', function (Post $post) {
    // ...
})->name('post.show');
```

要生成此路由的 URL，你可以像这样使用 `route` 助手：

```php
echo route('post.show', ['post' => 1]);

// http://example.com/post/1
```

当然，`route` 助手也可用于生成具有多个参数的路由的 URL：

```php
Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
    // ...
})->name('comment.show');

echo route('comment.show', ['post' => 1, 'comment' => 3]);

// http://example.com/post/1/comment/3
```

任何不对应于路由定义参数的额外数组元素都将被添加到 URL 的查询字符串中：

```php
echo route('post.show', ['post' => 1, 'search' => 'rocket']);

// http://example.com/post/1?search=rocket
```

#### Eloquent 模型

你经常会使用 [Eloquent 模型](/docs/11/eloquent/eloquent) 的路由键（通常是主键）生成 URL。因此，你可以将 Eloquent 模型作为参数值传递。`route` 助手会自动提取模型的路由键：

```php
echo route('post.show', ['post' => $post]);
```

### 签名 URL

Laravel 允许你轻松创建命名路由的“签名” URL。这些 URL 有一个附加在查询字符串上的“签名”散列，允许 Laravel 验证自创建 URL 以来 URL 未被修改。签名 URL 特别适用于那些公开可访问但需要保护以防止 URL 操纵的路由。

例如，你可能会使用签名 URL 实现公开的“取消订阅”链接，通过邮件发送给你的客户。要创建到命名路由的签名 URL，请使用 `URL` facade 的 `signedRoute` 方法：

```php
use Illuminate\Support\Facades\URL;

return URL::signedRoute('unsubscribe', ['user' => 1]);
```

你可以向 `signedRoute` 方法提供 `absolute` 参数来排除签名 URL 散列中的域名：

```php
return URL::signedRoute('unsubscribe', ['user' => 1], absolute: false);
```

如果你想要生成一个在指定时间后过期的临时签名路由 URL，你可以使用 `temporarySignedRoute` 方法。当 Laravel 验证临时签名路由 URL 时，它将确保编码到签名 URL 中的过期时间戳未过期：

```php
use Illuminate\Support\Facades\URL;

return URL::temporarySignedRoute(
    'unsubscribe', now()->addMinutes(30), ['user' => 1]
);
```

#### 验证签名路由请求

要验证传入请求是否具有有效的签名，你应该在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

```php
use Illuminate\Http\Request;

Route::get('/unsubscribe/{user}', function (Request $request) {
    if (! $request->hasValidSignature()) {
        abort(401);
    }

    // ...
})->name('unsubscribe');
```

有时，你可能需要允许应用程序的前端向签名 URL 追加数据，例如在客户端分页时执行此操作。因此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在验证签名 URL 时应该忽略的请求查询参数。请记住，忽略参数允许任何人修改请求上的这些参数：

```php
if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
    abort(401);
}
```

你可以将 `signed`（`Illuminate\Routing\Middleware\ValidateSignature`）[中间件](/docs/11/basics/middleware) 分配给路由，而不是使用传入请求实例验证签名 URL。如果传入请求没有有效的签名，中间件将自动返回 `403` HTTP 响应：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed');
```

如果你的签名 URL 不包含 URL 散列中的域名，则应对中间件提供 `relative` 参数：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed:relative');
```

#### 响应无效签名路由

当有人访问已过期的签名 URL 时，他们将收到 `403` HTTP 状态码的通用错误页面。然而，你可以通过在应用程序的 `bootstrap/app.php` 文件中为 `InvalidSignatureException` 异常定义一个自定义的“渲染”闭包来定制此行为：

```php
use Illuminate\Routing\Exceptions\InvalidSignatureException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (InvalidSignatureException $e) {
        return response()->view('error.link-expired', [], 403);
    });
})
```

## 控制器动作 URL

`action` 函数生成给定控制器动作的 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果控制器方法接受路由参数，你可以将一个关联数组的路由参数作为第二个参数传递给函数：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

## 默认值

对于某些应用程序，你可能希望为特定 URL 参数指定请求范围的默认值。例如，假设你的许多路由定义了一个 `{locale}` 参数：

```php
Route::get('/{locale}/posts', function () {
    // ...
})->name('post.index');
```

每次调用 `route` 助手时总是传递 `locale` 是很麻烦的。因此，你可以使用 `URL::defaults` 方法为此参数定义一个默认值，这个值将在当前请求期间始终应用。你可能希望从[路由中间件](/docs/11/basics/middleware#assigning-middleware-to-routes)中调用此方法，这样你就可以访问当前请求：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetDefaultLocaleForUrls
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        URL::defaults(['locale' => $request->user()->locale]);

        return $next($request);
    }
}
```

一旦为 `locale` 参数设置了默认值，你在使用 `route` 助手生成 URL 时就不再需要传递其值。

#### URL 默认值和中间件优先级

设置 URL 默认值可能会干扰 Laravel 的隐式模型绑定处理。因此，你应该[优先执行](/docs/11/basics/middleware#sorting-middleware)设置 URL 默认值的中间件，确保它们在 Laravel 自己的 `SubstituteBindings` 中间件之前被执行。你可以使用应用程序 `bootstrap/app.php` 文件中的 `priority` 中间件方法来完成这一点：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class,
        \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
        \Illuminate\Session\Middleware\AuthenticateSession::class,
        \App\Http\Middleware\SetDefaultLocaleForUrls::class, // [tl! add]
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \Illuminate\Auth\Middleware\Authorize::class,
    ]);
})
```
