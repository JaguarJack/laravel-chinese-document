---
title: Laravel 响应
---

# HTTP 响应

[[toc]]

## 创建响应

#### 字符串和数组

所有路由和控制器都应该返回一个要发送回用户浏览器的响应。Laravel 提供了几种不同的返回响应的方式。最基本的响应是从路由或控制器返回字符串。框架会自动将字符串转换成完整的 HTTP 响应：

```php
Route::get('/', function () {
    return 'Hello World';
});
```

除了从路由和控制器返回字符串之外，你还可以返回数组。框架会自动将数组转换为 JSON 响应：

```php
Route::get('/', function () {
    return [1, 2, 3];
});
```

> [!NOTE]
> 你知道你也可以从路由或控制器返回 [Eloquent 集合](/docs/11/eloquent/eloquent-collections) 吗？它们将自动被转换为 JSON。试一试吧！

#### 响应对象

通常情况下，你不只是从路由动作返回简单的字符串或数组。相反，你将返回完整的 `Illuminate\Http\Response` 实例或 [视图](/docs/11/basics/views)。

返回完整的 `Response` 实例允许你自定义响应的 HTTP 状态码和头信息。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了各种方法来构建 HTTP 响应：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
                  ->header('Content-Type', 'text/plain');
});
```

#### Eloquent 模型和集合

你也可以直接从路由和控制器返回 [Eloquent ORM](/docs/11/eloquent/eloquent) 模型和集合。当你这样做时，Laravel 会自动将模型和集合转换为 JSON 响应，同时尊重模型的 [隐藏属性](/docs/11/eloquent/eloquent-serialization#hiding-attributes-from-json)：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

### 为响应附加头

请记住，大多数响应方法是可链式操作的，允许流畅地构建响应实例。例如，你可以使用 `header` 方法在将响应发回用户之前向响应中添加一系列头信息：

```php
return response($content)
            ->header('Content-Type', $type)
            ->header('X-Header-One', 'Header Value')
            ->header('X-Header-Two', 'Header Value');
```

或者，你可以使用 `withHeaders` 方法指定一个要添加到响应中的头信息数组：

```php
return response($content)
            ->withHeaders([
                'Content-Type' => $type,
                'X-Header-One' => 'Header Value',
                'X-Header-Two' => 'Header Value',
            ]);
```

#### 缓存控制中间件

Laravel 包括一个 `cache.headers` 中间件，可用于快速为一组路由设置 `Cache-Control` 头。指令应该使用相应的 cache-control 指令的 "蛇形命名(snake_case)" 等价物提供，并且应该用分号分隔。如果在指令列表中指定了 `etag`，将自动设置响应内容的 MD5 哈希值作为 ETag 标识符：

```php
Route::middleware('cache.headers:public;max_age=2628000;etag')->group(function () {
    Route::get('/privacy', function () {
        // ...
    });

    Route::get('/terms', function () {
        // ...
    });
});
```

### 为响应附加 Cookies

你可以使用 `cookie` 方法将 cookie 附加到 `Illuminate\Http\Response` 实例上。你应该向这个方法传递 cookie 的名称、值和 cookie 应该有效的分钟数：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法也接受一些较少使用的参数。通常，这些参数与 PHP 的原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法所需的参数具有相同的目的和含义：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果你想确保 cookie 随着即将发送的响应一起发送，但是你还没有该响应的实例，你可以使用 `Cookie` facade 的 `queue` 方法来"排队"cookie，以在发送响应时附加到它上。`queue` 方法接受创建 cookie 实例所需的参数。这些 cookies 将在将响应发送给浏览器之前附加到即将发出的响应上：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

#### 生成 Cookie 实例

如果你想生成一个 `Symfony\Component\HttpFoundation\Cookie` 实例，然后在之后的时间点附加到响应实例上，你可以使用全局的 `cookie` 帮助函数。除非将此 cookie 附加到响应实例上，否则不会将此 cookie 发送回客户端：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

#### 提前过期 Cookies

你可以通过 `withoutCookie` 方法来移除一个 cookie，该方法被用于通过响应实例的响应过期 cookie：

```php
return response('Hello World')->withoutCookie('name');
```

如果你还没有即将发送的响应的实例，你可以使用 `Cookie` facade 的 `expire` 方法来过期一个 cookie：

```php
Cookie::expire('name');
```

### Cookies 和加密

默认情况下，由于 `Illuminate\Cookie\Middleware\EncryptCookies` 中间件的原因，Laravel 生成的所有 cookie 都是加密和签名的，以便客户端无法修改或读取它们。如果你想要为你的应用程序生成的一部分 cookie 禁用加密，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `encryptCookies` 方法：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->encryptCookies(except: [
        'cookie_name',
    ]);
})
```

## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的正确头信息。有几种方法可以生成 `RedirectResponse` 实例。最简单的方法是使用全局的 `redirect` 辅助函数：

```php
Route::get('/dashboard', function () {
    return redirect('home/dashboard');
});
```

有时你可能希望将用户重定向到他们之前的位置，例如当提交的表单无效时。你可以通过使用全局的 `back` 辅助函数来这样做。由于该功能利用了 [会话](/docs/11/basics/session)，请确保调用 `back` 函数的路由正在使用 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // Validate the request...

    return back()->withInput();
});
```

### 重定向到命名路由

当你不带任何参数调用 `redirect` 帮助函数时，会返回一个 `Illuminate\Routing\Redirector` 实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成一个重定向到命名路由的 `RedirectResponse`，你可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果你的路由有参数，你可以将它们作为第二参数传递给 `route` 方法：

```php
// 对于一个如下 URI 的路由: /profile/{id}

return redirect()->route('profile', ['id' => 1]);
```

#### 通过 Eloquent 模型填充参数

如果你正在重定向到一个填充了来自 Eloquent 模型的 "ID" 参数的路由，你可以传递模型本身。ID 将会自动提取：

```php
// 对于一个如下 URI 的路由: /profile/{id}

return redirect()->route('profile', [$user]);
```

如果你想自定义放置在路由参数中的值，你可以在路由参数定义中指定列（`/profile/{id:slug}`），或者你可以在你的 Eloquent 模型上覆盖 `getRouteKey` 方法：

```php
/**
 * Get the value of the model's route key.
 */
public function getRouteKey(): mixed
{
    return $this->slug;
}
```

### 重定向到控制器动作

你也可以生成重定向到 [控制器动作](/docs/11/basics/controllers) 的重定向。为此，将控制器和动作名称传递给 `action` 方法：

```php
use App\Http\Controllers\UserController;

return redirect()->action([UserController::class, 'index']);
```

如果你的控制器路由需要参数，你可以将它们作为第二参数传给 `action` 方法：

```php
return redirect()->action(
    [UserController::class, 'profile'], ['id' => 1]
);
```

### 重定向到外部域

有时你可能需要重定向到应用程序之外的域。你可以通过调用 `away` 方法实现，它创建一个 `RedirectResponse`，不进行任何额外的 URL 编码、验证或核实：

```php
return redirect()->away('https://www.google.com');
```

### 带闪存会话数据的重定向

重定向到新 URL 并[将数据闪存到会话](/docs/11/basics/session#flash-data)通常是同时进行的。通常，这在成功执行操作后完成，当你将成功信息闪存到会话中。为了方便起见，你可以创建一个 `RedirectResponse` 实例并在单个流畅的方法链中将数据闪存到会话：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向后，你可以从 [会话](/docs/11/basics/session) 中显示闪存的消息。例如，使用 [Blade 语法](/docs/11/basics/blade)：

```php
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

#### 带输入的重定向

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在将用户重定向到新位置之前将当前请求的输入数据闪存到会话中。这通常是在用户遇到验证错误时进行的。一旦输入被闪存到会话中，你可以在下一次请求中轻易地[检索它](/docs/11/basics/requests#retrieving-old-input)以重新填充表单：

```php
return back()->withInput();
```

## 其他响应类型

`response` 帮助函数可以用于生成其他类型的响应实例。当没有参数调用 `response` 帮助函数时，会返回 [合同](/docs/11/digging-deeper/contracts) 中的 `Illuminate\Contracts\Routing\ResponseFactory` 实现。这个合同提供了几个用于生成响应的有用方法。

### 视图响应

如果你需要控制响应的状态和头信息，但也需要将 [视图](/docs/11/basics/views) 返回为响应的内容，你应该使用 `view` 方法：

```php
return response()
            ->view('hello', $data, 200)
            ->header('Content-Type', $type);
```

当然，如果你不需要传递自定义的 HTTP 状态码或自定义头信息，你可以使用全局的 `view` 辅助函数。

### JSON 响应

`json` 方法会自动设置 `Content-Type` 头为 `application/json`，并使用 `json_encode` PHP 函数将给定数组转换为 JSON：

```php
return response()->json([
    'name' => 'Abigail',
    'state' => 'CA',
]);
```

如果你想创建一个 JSONP 响应，你可以将 `json` 方法与 `withCallback` 方法结合使用：

```php
return response()
            ->json(['name' => 'Abigail', 'state' => 'CA'])
            ->withCallback($request->input('callback'));
```

### 文件下载

`download` 方法可以用来生成一个响应，该响应使用户的浏览器强制下载给定路径的文件。`download` 方法接受一个文件名作为方法的第二个参数，该文件名将决定用户下载文件时看到的文件名。最后，你可以将 HTTP 头的数组作为方法的第三个参数：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> [!WARNING]
> 管理文件下载的 Symfony HttpFoundation 要求被下载的文件具有 ASCII 文件名。

#### 流式下载

有时你可能希望将某个操作的字符串响应转换成可下载的响应，而不需要将操作的内容写入磁盘。在这种场景下，你可以使用 `streamDownload` 方法。该方法接受一个回调、文件名和一个可选的头数组作为其参数：

```php
use App\Services\GitHub;

return response()->streamDownload(function () {
    echo GitHub::api('repo')
                ->contents()
                ->readme('laravel', 'laravel')['contents'];
}, 'laravel-readme.md');
```

### 文件响应

`file` 方法可用于直接在用户的浏览器中显示文件，例如图片或 PDF，而不是启动下载。这个方法接受文件的绝对路径作为它的第一个参数，以及头的数组作为它的第二个参数：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

## 响应宏

如果你想定义一个自定义响应，而且你可以在你的路由和控制器中重复使用，你可以在 `Response` facade 上使用 `macro` 方法。通常，你应该在你的应用程序的[服务提供者](/docs/11/architecture-concepts/providers)之一的 `boot` 方法中调用这个方法，比如 `App\Providers\AppServiceProvider` 服务提供者：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Response::macro('caps', function (string $value) {
            return Response::make(strtoupper($value));
        });
    }
}
```

`macro` 函数接收一个名称作为它的第一个参数，一个闭包作为它的第二个参数。当从 `ResponseFactory` 实现或 `response` 辅助函数调用宏名称时，将执行宏的闭包：

```php
return response()->caps('foo');
```
