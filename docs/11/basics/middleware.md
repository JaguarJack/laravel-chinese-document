---
title: Laravel 中间件
---

# 中间件

[[toc]]

## 介绍

中间件提供了一种便捷的机制，用于检查和过滤进入应用程序的 HTTP 请求。例如，Laravel 包含了一个验证应用程序用户是否通过身份验证的中间件。如果用户没有通过身份验证，中间件将用户重定向到应用程序的登录屏幕。然而，如果用户已通过身份验证，则中间件将允许请求进一步进入应用程序。

除了身份验证之外，还可以编写其他中间件来执行各种任务。例如，一个日志中间件可能会记录应用程序的所有传入请求。Laravel 包含了多种中间件，包括用于身份验证和 CSRF 保护的中间件；然而，所有自定义中间件通常位于应用程序的 `app/Http/Middleware` 目录中。

## 定义中间件

要创建一个新的中间件，请使用 `make:middleware` Artisan 命令：

```shell
php artisan make:middleware EnsureTokenIsValid
```

该命令将在你的 `app/Http/Middleware` 目录中创建一个新的 `EnsureTokenIsValid` 类。在这个中间件中，我们只允许在提供的 `token` 输入匹配指定值时才可以访问路由。否则，我们将用户重定向回 `home` URI:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->input('token') !== 'my-secret-token') {
            return redirect('home');
        }

        return $next($request);
    }
}
```

如你所见，如果给定的 `token` 不匹配我们的密钥，中间件将向客户端返回一个 HTTP 重定向；否则，请求将传递进入应用程序。为了传递请求进入应用程序的更深层次（允许中间件 "通过"），你应该用 `$request` 调用 `$next` 回调。

最好将中间件设想为 HTTP 请求在击中你的应用程序之前必须经过的一系列 "层"。每一层都可以检查请求甚至完全拒绝它。

:::info
所有中间件通过 [服务容器](/docs/11/architecture-concepts/container) 解析，因此你可以在中间件的构造函数中提示任何你需要的依赖。
:::

#### 中间件和响应

当然，中间件可以在请求传入应用程序之前或之后执行任务。例如，以下中间件将在请求被应用程序处理**之前**执行某些任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BeforeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 执行操作

        return $next($request);
    }
}
```

但是，此中间件将在请求被应用程序处理**之后**执行其任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 执行操作

        return $response;
    }
}
```

## 注册中间件

### 全局中间件

如果你希望中间件在每个 HTTP 请求到你的应用程序时运行，你可以将它附加到应用程序的 `bootstrap/app.php` 文件中的全局中间件栈：

```php
use App\Http\Middleware\EnsureTokenIsValid;

->withMiddleware(function (Middleware $middleware) {
     $middleware->append(EnsureTokenIsValid::class);
})
```

提供给 `withMiddleware` 闭包的 `$middleware` 对象是 `Illuminate\Foundation\Configuration\Middleware` 的实例，负责管理分配给应用程序路由的中间件。`append` 方法将中间件添加到全局中间件列表的末尾。如果你想将一个中间件添加到列表的开始，你应该使用 `prepend` 方法。

#### 手动管理 Laravel 的默认全局中间件

如果你想手动管理 Laravel 的全局中间件栈，你可以使用 `use` 方法提供 Laravel 的默认全局中间件栈。然后，你可以根据需要调整默认的中间件栈：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->use([
        // \Illuminate\Http\Middleware\TrustHosts::class,
        \Illuminate\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Http\Middleware\ValidatePostSize::class,
        \Illuminate\Foundation\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ]);
})
```

### 将中间件分配给路由

如果你想将中间件分配给特定路由，你可以在定义路由时调用 `middleware` 方法：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::get('/profile', function () {
    // ...
})->middleware(EnsureTokenIsValid::class);
```

你可以通过向 `middleware` 方法传递中间件名称的数组来为路由分配多个中间件：

```php
Route::get('/', function () {
    // ...
})->middleware([First::class, Second::class]);
```

#### 排除中间件

在将中间件分配给一组路由时，你可能偶尔需要防止中间件被应用到组内的单个路由。你可以使用 `withoutMiddleware` 方法实现这一点：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::middleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/', function () {
        // ...
    });

    Route::get('/profile', function () {
        // ...
    })->withoutMiddleware([EnsureTokenIsValid::class]);
});
```

你也可以从整个 [组](/docs/11/basics/routing#route-groups) 的路由定义中排除给定的一组中间件：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::withoutMiddleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/profile', function () {
        // ...
    });
});
```

`withoutMiddleware` 方法只能移除路由中间件，并不适用于 [全局中间件](#global-middleware)。

### 中间件组

有时你可能希望将几个中间件分组到一个单独的键下，以使它们更容易被分配给路由。你可以在应用程序的 `bootstrap/app.php` 文件中使用 `appendToGroup` 方法来实现这一点：

```php
use App\Http\Middleware\First;
use App\Http\Middleware\Second;

->withMiddleware(function (Middleware $middleware) {
    $middleware->appendToGroup('group-name', [
        First::class,
        Second::class,
    ]);

    $middleware->prependToGroup('group-name', [
        First::class,
        Second::class,
    ]);
})
```

中间件组可以使用与单个中间件相同的语法分配给路由和控制器动作：

```php
Route::get('/', function () {
    // ...
})->middleware('group-name');

Route::middleware(['group-name'])->group(function () {
    // ...
});
```

#### Laravel 默认的中间件组

Laravel 包含预定义的 `web` 和 `api` 中间件组，包含了你可能希望应用于 Web 和 API 路由的常用中间件。请记住，Laravel 自动将这些中间件组应用于相应的 `routes/web.php` 和 `routes/api.php` 文件：

| `web` 中间件组                                            |
| --------------------------------------------------------- |
| `Illuminate\Cookie\Middleware\EncryptCookies`             |
| `Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse` |
| `Illuminate\Session\Middleware\StartSession`              |
| `Illuminate\View\Middleware\ShareErrorsFromSession`       |
| `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` |
| `Illuminate\Routing\Middleware\SubstituteBindings`        |

| `api` 中间件组                                     |
| -------------------------------------------------- |
| `Illuminate\Routing\Middleware\SubstituteBindings` |

如果你想要将中间件附加到这些组中，可以在你的应用程序的 `bootstrap/app.php` 文件中使用 `web` 和 `api` 方法。`web` 和 `api` 方法是 `appendToGroup` 方法的便捷替代品：

```php
use App\Http\Middleware\EnsureTokenIsValid;
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        EnsureUserIsSubscribed::class,
    ]);

    $middleware->api(prepend: [
        EnsureTokenIsValid::class,
    ]);
})
```

你甚至可以用你自己的自定义中间件替换 Laravel 默认的中间件组入口之一：

```php
use App\Http\Middleware\StartCustomSession;
use Illuminate\Session\Middleware\StartSession;

$middleware->web(replace: [
    StartSession::class => StartCustomSession::class,
]);
```

或者，你可以完全移除一个中间件：

```php
$middleware->web(remove: [
    StartSession::class,
]);
```

#### 手动管理 Laravel 默认的中间件组

如果你希望手动管理 Laravel 默认的 `web` 和 `api` 中间件组中的所有中间件，你可以完全重新定义这些组。以下示例将用它们的默认中间件定义 `web` 和 `api` 中间件组，以便你根据需要自定义它们：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('web', [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        // \Illuminate\Session\Middleware\AuthenticateSession::class,
    ]);

    $middleware->group('api', [
        // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // 'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
})
```

:::info
默认情况下，`web` 和 `api` 中间件组会由 `bootstrap/app.php` 文件自动应用到你的应用程序相应的 `routes/web.php` 和 `routes/api.php` 文件。
:::

### 中间件别名

你可以在应用程序的 `bootstrap/app.php` 文件中为中间件分配别名。中间件别名允许你为给定的中间件类定义一个简短的别名，这对于类名很长的中间件特别有用：

```php
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'subscribed' => EnsureUserIsSubscribed::class
    ]);
});
```

一旦在应用程序的 `bootstrap/app.php` 文件中定义了中间件别名，你就可以在分配中间件到路由时使用该别名：

```php
Route::get('/profile', function () {
    // ...
})->middleware('subscribed');
```

为方便起见，Laravel 的一些内置中间件默认就已经设置了别名。例如，`auth` 中间件是 `Illuminate\Auth\Middleware\Authenticate` 中间件的别名。以下是默认中间件别名列表：

| 别名               | 中间件                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `auth`             | `Illuminate\Auth\Middleware\Authenticate`                                                                     |
| `auth.basic`       | `Illuminate\Auth\Middleware\AuthenticateWithBasicAuth`                                                        |
| `auth.session`     | `Illuminate\Session\Middleware\AuthenticateSession`                                                           |
| `cache.headers`    | `Illuminate\Http\Middleware\SetCacheHeaders`                                                                  |
| `can`              | `Illuminate\Auth\Middleware\Authorize`                                                                        |
| `guest`            | `Illuminate\Auth\Middleware\RedirectIfAuthenticated`                                                          |
| `password.confirm` | `Illuminate\Auth\Middleware\RequirePassword`                                                                  |
| `precognitive`     | `Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests`                                            |
| `signed`           | `Illuminate\Routing\Middleware\ValidateSignature`                                                             |
| `subscribed`       | `\Spark\Http\Middleware\VerifyBillableIsSubscribed`                                                           |
| `throttle`         | `Illuminate\Routing\Middleware\ThrottleRequests` 或 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` |
| `verified`         | `Illuminate\Auth\Middleware\EnsureEmailIsVerified`                                                            |

### 中间件排序

在少数情况下，你可能需要你的中间件按特定顺序执行，但在分配给路由时你无法控制它们的顺序。在这种情况下，你可以使用应用程序中 `bootstrap/app.php` 文件的 `priority` 方法来指定中间件的优先级：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class,
        \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
        \Illuminate\Auth\Middleware\Authorize::class,
    ]);
})
```

## 中间件参数

中间件还可以接收额外的参数。例如，如果你的应用程序需要在执行特定操作之前验证已认证用户是否具有给定的 "角色"，你可以创建一个 `EnsureUserHasRole` 中间件，它接收角色名作为额外的参数。

额外的中间件参数将在 `$next` 参数之后传递给中间件：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()->hasRole($role)) {
            // 重定向...
        }

        return $next($request);
    }

}
```

在定义路由时，可以通过用 `:` 分隔中间件名称和参数来指定中间件参数：

```php
Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware('role:editor');
```

多个参数可以用逗号分隔：

```php
Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware('role:editor,publisher');
```

## 可终止的中间件

有时，中间件可能需要在 HTTP 响应发送给浏览器后执行一些工作。如果你在中间件上定义了一个 `terminate` 方法，并且你的 Web 服务器正在使用 FastCGI，那么在响应发送给浏览器后，将自动调用 `terminate` 方法：

```php
<?php

namespace Illuminate\Session\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TerminatingMiddleware
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * 处理响应发送给浏览器后的任务。
     */
    public function terminate(Request $request, Response $response): void
    {
        // ...
    }
}
```

`terminate` 方法应该接收请求和响应。一旦你定义了一个可终止的中间件，你应该将它添加到你的应用程序的 `bootstrap/app.php` 文件中的路由或全局中间件列表中。

当在你的中间件上调用 `terminate` 方法时，Laravel 会从[服务容器](/docs/11/architecture-concepts/container)中解析一个中间件的新实例。如果你希望在调用 `handle` 和 `terminate` 方法时使用相同的中间件实例，请使用容器的 `singleton` 方法将中间件注册到容器中。通常，这应该在你的 `AppServiceProvider` 中的 `register` 方法中完成：

```php
use App\Http\Middleware\TerminatingMiddleware;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    $this->app->singleton(TerminatingMiddleware::class);
}
```
