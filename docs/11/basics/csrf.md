---
title: Laravel CSRF
---

# CSRF 保护

[[toc]]

## 介绍

跨站请求伪造是一种恶意攻击类型，未经授权的命令在认证用户的名义下执行。幸运的是，Laravel 使得保护你的应用程序不受 [跨站请求伪造](https://en.wikipedia.org/wiki/Cross-site_request_forgery) (CSRF) 攻击变得很容易。

#### 漏洞的解释

如果你不熟悉跨站请求伪造，让我们讨论一个这种漏洞可能被利用的例子。想象一下，你的应用程序有一个 `/user/email` 路由，该路由接受 `POST` 请求来更改认证用户的电子邮件地址。这个路由很可能期望 `email` 输入字段包含用户希望开始使用的电子邮件地址。

如果没有 CSRF 保护，一个恶意的网站可以创建一个指向你的应用程序的 `/user/email` 路由的 HTML 表单，并提交恶意用户自己的电子邮件地址：

```blade
<form action="https://your-application.com/user/email" method="POST">
    <input type="email" value="malicious-email@example.com">
</form>

<script>
    document.forms[0].submit();
</script>
```

如果恶意网站在页面加载时自动提交表单，恶意用户只需要诱导你的应用程序的不知情用户访问他们的网站，他们的电子邮件地址将在你的应用程序中被更改。

为了防止这种漏洞，我们需要检查每个传入的 `POST`、`PUT`、`PATCH` 或 `DELETE` 请求是否有一个恶意应用程序无法访问的秘密会话值。

## 防止 CSRF 请求

Laravel 会为由应用程序管理的每个活跃的[用户会话](/docs/11/basics/session)自动生成一个 CSRF “token”。这个令牌用于验证认证的用户实际上是发出应用程序请求的人。由于这个令牌存储在用户的会话中，并且每次会话重新生成时都会更改，所以恶意应用程序无法访问它。

可以通过请求的会话或通过 `csrf_token` 助手函数访问当前会话的 CSRF 令牌。

```php
use Illuminate\Http\Request;

Route::get('/token', function (Request $request) {
    $token = $request->session()->token();

    $token = csrf_token();

    // ...
});
```

无论何时在应用程序中定义一个“POST”、“PUT”、“PATCH”或“DELETE” HTML 表单，你都应该在表单中包含一个隐藏的 CSRF `_token` 字段，以便 CSRF 保护中间件可以验证请求。为了方便，你可以使用 `@csrf` Blade 指令生成隐藏的令牌输入字段：

```blade
<form method="POST" action="/profile">
    @csrf

    <!-- 等价于... -->
    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

默认情况下包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` [中间件](/docs/11/basics/middleware) 将自动验证请求输入中的令牌与会话中存储的令牌是否匹配。当这两个令牌匹配时，我们知道发起请求的是认证用户。

### CSRF 令牌 & SPAs

如果你正在构建一个使用 Laravel 作为 API 后端的 SPA，你应该查阅 [Laravel Sanctum 文档](/docs/11/packages/sanctum)，了解如何与你的 API 进行认证以及防护 CSRF 漏洞的信息。

### 排除 CSRF 保护的 URIs

有时你可能希望从 CSRF 保护中排除一组 URIs。例如，如果你正在使用 [Stripe](https://stripe.com) 来处理支付并利用他们的 webhook 系统，你需要将 Stripe webhook 处理程序路由从 CSRF 保护中排除，因为 Stripe 不会知道发送什么 CSRF 令牌到你的路由。

通常，你应该将这种路由放在 Laravel 应用于 `routes/web.php` 文件中所有路由的 `web` 中间件组之外。不过，你还可以通过在应用程序的 `bootstrap/app.php` 文件中为 `validateCsrfTokens` 方法提供它们的 URIs 来排除特定路由：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: [
        'stripe/*',
        'http://example.com/foo/bar',
        'http://example.com/foo/*',
    ]);
})
```

> [!NOTE]
> 为方便起见，当[进行测试](/docs/11/testing/testing)时，CSRF 中间件会自动为所有路由禁用。

## X-CSRF-TOKEN

除了作为 POST 参数检查 CSRF 令牌外，默认包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` 中间件还将检查 `X-CSRF-TOKEN` 请求头。例如，你可以将令牌存储在 HTML `meta` 标签中：

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

然后，你可以指导类似 jQuery 的库在所有请求头中自动添加令牌。这为你的基于 AJAX 的应用程序提供了简单便捷的 CSRF 保护，适用于遗留的 JavaScript 技术：

```js
$.ajaxSetup({
  headers: {
    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
  }
})
```

## X-XSRF-TOKEN

Laravel 将当前的 CSRF 令牌存储在加密的 `XSRF-TOKEN` cookie 中，该 cookie 包含在框架生成的每个响应中。你可以使用 cookie 的值来设置 `X-XSRF-TOKEN` 请求头。

这个 cookie 主要是作为开发者的便利发送的，因为一些 JavaScript 框架和库，如 Angular 和 Axios，会在同源请求上自动在 `X-XSRF-TOKEN` 头中放置它的值。

> [!NOTE]
> 默认情况下，`resources/js/bootstrap.js` 文件包含了 Axios HTTP 库，它会自动为你发送 `X-XSRF-TOKEN` 头。
