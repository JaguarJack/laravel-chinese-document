---
title: Laravel 请求
---

# HTTP 请求

[[toc]]

## 介绍

Laravel 的 `Illuminate\Http\Request` 类提供了一种面向对象的方式来与您的应用程序当前正在处理的 HTTP 请求进行交互，以及检索提交的输入、cookies 和文件。

## 与请求进行交互

### 访问请求

要通过依赖注入获得当前 HTTP 请求的实例，您应该在路由闭包或控制器方法中类型提示 `Illuminate\Http\Request` 类。来访请求实例将由 Laravel [服务容器](/docs/11/architecture-concepts/container)自动注入：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储一个新用户。
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->input('name');

        // 存储用户...

        return redirect('/users');
    }
}
```

如上所述，您也可以在路由闭包上类型提示 `Illuminate\Http\Request` 类。服务容器将在执行闭包时自动将来访请求注入其中：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

#### 依赖注入和路由参数

如果您的控制器方法还期望从路由参数中获取输入，则应该在其他依赖之后列出您的路由参数。例如，如果您的路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

您仍然可以在控制器方法中类型提示 `Illuminate\Http\Request` 并通过如下定义您的控制器方法来访问您的 `id` 路由参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新指定的用户。
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 更新用户...

        return redirect('/users');
    }
}
```

### 请求路径、主机和方法

`Illuminate\Http\Request` 实例提供了多种方法来检查传入的 HTTP 请求，并扩展了 `Symfony\Component\HttpFoundation\Request` 类。我们将讨论下面一些最重要的方法。

#### 检索请求路径

`path` 方法返回请求的路径信息。因此，如果传入的请求针对 `http://example.com/foo/bar`，`path` 方法将返回 `foo/bar`：

```php
$uri = $request->path();
```

#### 检查请求路径/路由

`is` 方法允许您验证传入的请求路径与给定模式是否匹配。使用此方法时，您可以将 `*` 字符用作通配符：

```php
if ($request->is('admin/*')) {
    // ...
}
```

使用 `routeIs` 方法，您可以确定传入的请求是否匹配了一个[命名路由](/docs/11/basics/routing#named-routes)：

```php
if ($request->routeIs('admin.*')) {
    // ...
}
```

#### 检索请求 URL

要检索传入请求的完整 URL，您可以使用 `url` 或 `fullUrl` 方法。`url` 方法将返回不带查询字符串的 URL，而 `fullUrl` 方法包括查询字符串：

```php
$url = $request->url();

$urlWithQueryString = $request->fullUrl();
```

如果您想将查询字符串数据附加到当前 URL，您可以调用 `fullUrlWithQuery` 方法。此方法将给定数组的查询字符串变量与当前查询字符串合并：

```php
$request->fullUrlWithQuery(['type' => 'phone']);
```

如果您想获取当前 URL 而不包含给定的查询字符串参数，您可以使用 `fullUrlWithoutQuery` 方法：

```php
$request->fullUrlWithoutQuery(['type']);
```

#### 检索请求主机

您可以通过 `host`、`httpHost` 和 `schemeAndHttpHost` 方法检索传入请求的 "host"：

```php
$request->host();
$request->httpHost();
$request->schemeAndHttpHost();
```

#### 检索请求方法

`method` 方法将返回请求的 HTTP 动词。可以使用 `isMethod` 方法验证 HTTP 动词是否匹配给定字符串：

```php
$method = $request->method();

if ($request->isMethod('post')) {
    // ...
}
```

### 请求头

你可以使用 `Illuminate\Http\Request` 实例的 `header` 方法来检索请求头。如果请求中不存在该头，则会返回 `null`。然而，如果请求中不存在该头，`header` 方法接受一个可选的第二个参数，该参数将被返回：

```php
$value = $request->header('X-Header-Name');

$value = $request->header('X-Header-Name', 'default');
```

`hasHeader` 方法可用来判断请求中是否包含给定的头：

```php
if ($request->hasHeader('X-Header-Name')) {
    // ...
}
```

为方便起见，可以使用 `bearerToken` 方法从 `Authorization` 头中检索承载令牌。如果没有这样的头，则会返回一个空字符串：

```php
$token = $request->bearerToken();
```

### 请求 IP 地址

`ip` 方法可用来检索发出请求到你的应用程序的客户端的 IP 地址：

```php
$ipAddress = $request->ip();
```

如果你想检索一个包含所有客户端 IP 地址的数组，包括所有代理转发的 IP 地址，你可以使用 `ips` 方法。"原始" 客户端 IP 地址将位于数组的末端：

```php
$ipAddresses = $request->ips();
```

通常，应该将 IP 地址视为不可信的、用户控制的输入，并仅出于信息目的使用。

### 内容协商

Laravel 提供了几个方法通过请求的 `Accept` 头来检查进来的请求的请求内容类型。首先，`getAcceptableContentTypes` 方法将返回一个数组，其中包含请求所接受的所有内容类型：

```php
$contentTypes = $request->getAcceptableContentTypes();
```

`accepts` 方法接受一个内容类型数组，并返回 `true` 如果请求接受任何内容类型。否则，将返回 `false` ：

```php
if ($request->accepts(['text/html', 'application/json'])) {
    // ...
}
```

你可以使用 `prefers` 方法来确定请求最倾向于给定数组中的哪种内容类型。如果请求不接受任何提供的内容类型，将返回 `null` ：

```php
$preferred = $request->prefers(['text/html', 'application/json']);
```

由于许多应用程序只服务 HTML 或 JSON，您可以使用 `expectsJson` 方法快速确定传入的请求是否期望 JSON 响应：

```php
if ($request->expectsJson()) {
    // ...
}
```

### PSR-7 请求

[PSR-7 标准](https://www.php-fig.org/psr/psr-7/) 指定了 HTTP 消息的接口，包括请求和响应。如果你希望获得 PSR-7 请求的实例而不是 Laravel 请求，你首先需要安装一些库。Laravel 使用 _Symfony HTTP Message Bridge_ 组件将典型的 Laravel 请求和响应转换为与 PSR-7 兼容的实现：

```shell
composer require symfony/psr-http-message-bridge
composer require nyholm/psr7
```

安装这些库后，你可以通过在路由闭包或控制器方法中类型提示请求接口来获得 PSR-7 请求：

```php
use Psr\Http\Message\ServerRequestInterface;

Route::get('/', function (ServerRequestInterface $request) {
    // ...
});
```

> [!NOTE]
> 如果你从路由或控制器返回一个 PSR-7 响应实例，它将自动被转换回 Laravel 响应实例并由框架显示。

## 输入

### 检索输入

#### 检索所有输入数据

你可以使用 `all` 方法作为 `array` 检索传入请求的所有输入数据。无论传入的请求是来自 HTML 表单还是 XHR 请求，此方法都可以使用：

```php
$input = $request->all();
```

使用 `collect` 方法，你可以将传入请求的所有输入数据检索为 [集合](/docs/11/digging-deeper/collections)：

```php
$input = $request->collect();
```

`collect` 方法也允许你检索请求输入的子集作为集合：

```php
$request->collect('users')->each(function (string $user) {
    // ...
});
```

#### 检索输入值

使用一些简单的方法，你可以访问你的 `Illuminate\Http\Request` 实例中的所有用户输入，而不用担心请求使用了哪个 HTTP 动词。不管 HTTP 动词如何，都可以使用 `input` 方法来检索用户输入：

```php
$name = $request->input('name');
```

你可以将默认值作为第二个参数传递给 `input` 方法。如果请求中没有该输入值，将返回此值：

```php
$name = $request->input('name', 'Sally');
```

处理包含数组输入的表单时，使用"点"表示法来访问数组：

```php
$name = $request->input('products.0.name');

$names = $request->input('products.*.name');
```

你可以不带任何参数地调用 `input` 方法，以便将所有输入值作为关联数组检索：

```php
$input = $request->input();
```

#### 从查询字符串检索输入

虽然 `input` 方法从整个请求有效负载（包括查询字符串）检索值，`query` 方法只从查询字符串检索值：

```php
$name = $request->query('name');
```

如果请求的查询字符串值数据不存在，此方法的第二个参数将被返回：

```php
$name = $request->query('name', 'Helen');
```

你可以不带任何参数地调用 `query` 方法，以便将所有查询字符串值作为关联数组检索：

```php
$query = $request->query();
```

#### 检索 JSON 输入值

当向你的应用程序发送 JSON 请求时，只要请求的 `Content-Type` 头正确设置为 `application/json`，就可以通过 `input` 方法访问 JSON 数据。你甚至可以使用"点"语法检索嵌套在 JSON 数组/对象中的值：

```php
$name = $request->input('user.name');
```

#### 检索 Stringable 输入值

你可以使用 `string` 方法而不是将请求输入数据作为原始 `string` 来检索，以将请求数据作为 [`Illuminate\Support\Stringable`](/docs/11/packages/reverb#fluent-strings) 实例检索：

```php
$name = $request->string('name')->trim();
```

#### 检索布尔输入值

处理 HTML 元素，如复选框时，你的应用程序可能会收到实际上是字符串的 "真实" 值。例如，"true" 或 "on"。为方便起见，你可以使用 `boolean` 方法以布尔值形式检索这些值。`boolean` 方法为 1, "1", true, "true", "on" 和 "yes" 返回 `true`。所有其他值将返回 `false`：

```php
$archived = $request->boolean('archived');
```

#### 检索日期输入值

为方便起见，使用 `date` 方法可以将包含日期/时间的输入值作为 Carbon 实例检索。如果请求中不包含一个具有给定名称的输入值，则会返回 `null`：

```php
$birthday = $request->date('birthday');
```

`date` 方法接受的第二个和第三个参数可用于分别指定日期的格式和时区：

```php
$elapsed = $request->date('elapsed', '!H:i', 'Europe/Madrid');
```

如果输入值存在但格式无效，将抛出一个 `InvalidArgumentException`；因此，建议您在调用 `date` 方法之前验证输入。

#### 检索枚举输入值

也可以从请求中检索对应 [PHP 枚举](https://www.php.net/manual/en/language.types.enumerations.php) 的输入值。如果请求中不包含具有给定名称的输入值，或者枚举没有与输入值匹配的支持值，则会返回 `null`。`enum` 方法接受输入值的名称和枚举类作为其第一和第二参数：

```php
use App\Enums\Status;

$status = $request->enum('status', Status::class);
```

#### 通过动态属性检索输入

你也可以使用 `Illuminate\Http\Request` 实例上的动态属性访问用户输入。例如，如果你的应用程序的一个表单包含一个 `name` 字段，你可以这样访问该字段的值：

```php
$name = $request->name;
```

使用动态属性时，Laravel 将首先在请求负载中查找参数的值。如果不存在，Laravel 将在匹配的路由的参数中搜索该字段。

#### 检索输入数据的一部分

如果需要检索输入数据的子集，您可以使用 `only` 和 `except` 方法。这两个方法都接受一个单一的 `array` 或动态参数列表：

```php
$input = $request->only(['username', 'password']);

$input = $request->only('username', 'password');

$input = $request->except(['credit_card']);

$input = $request->except('credit_card');
```

> [!WARNING] > `only` 方法返回所有您请求的键/值对；但是，它不会返回请求中不存在的键/值对。

### 输入存在性

您可以使用 `has` 方法判断请求中是否存在某个值。如果该值出现在请求中，`has` 方法会返回 `true`：

```php
if ($request->has('name')) {
    // ...
}
```

当给出一个数组时，`has` 方法会判断指定的所有值是否都存在：

```php
if ($request->has(['name', 'email'])) {
    // ...
}
```

`hasAny` 方法在指定的任一值存在时会返回 `true`：

```php
if ($request->hasAny(['name', 'email'])) {
    // ...
}
```

`whenHas` 方法将在请求中存在某个值时执行给定的闭包：

```php
$request->whenHas('name', function (string $input) {
    // ...
});
```

`whenHas` 方法允许传入第二个闭包，当请求中不存在指定值时将执行该闭包：

```php
$request->whenHas('name', function (string $input) {
    // "name" 的值存在...
}, function () {
    // "name" 的值不存在...
});
```

如果您需要判断请求中的值是否存在且不是空字符串，您可以使用 `filled` 方法：

```php
if ($request->filled('name')) {
    // ...
}
```

`anyFilled` 方法在指定的任一值不是空字符串时返回 `true`：

```php
if ($request->anyFilled(['name', 'email'])) {
    // ...
}
```

`whenFilled` 方法在请求中的值存在且不是空字符串时将执行给定的闭包：

```php
$request->whenFilled('name', function (string $input) {
    // ...
});
```

`whenFilled` 方法允许传入第二个闭包，当指定的值不是 "filled" 时将执行该闭包：

```php
$request->whenFilled('name', function (string $input) {
    // "name" 的值已填充...
}, function () {
    // "name" 的值未填充...
});
```

要判断请求中是否缺失某个键，你可以使用 `missing` 和 `whenMissing` 方法：

```php
if ($request->missing('name')) {
    // ...
}

$request->whenMissing('name', function (array $input) {
    // "name" 的值缺失...
}, function () {
    // "name" 的值存在...
});
```

### 合并额外输入

有时您可能需要手动将额外输入合并到请求的现有输入数据中。此时，您可以使用 `merge` 方法。如果请求中已存在给定的输入键，则会被 `merge` 方法提供的数据覆盖：

```php
$request->merge(['votes' => 0]);
```

如果请求的输入数据中不存在对应的键，则可以使用 `mergeIfMissing` 方法合并输入：

```php
$request->mergeIfMissing(['votes' => 0]);
```

### 旧输入

Laravel 允许您在下一个请求期间保留一个请求的输入。当在检测到验证错误后重新填充表单时，此功能特别有用。然而，如果您使用 Laravel 内置的[验证功能](/docs/11/basics/validation)，您可能不需要直接手动使用这些 session 输入闪存方法，因为 Laravel 的一些内置验证工具会自动调用它们。

#### 将输入闪存到 Session

`Illuminate\Http\Request` 类上的 `flash` 方法将当前输入闪存到 [session](/docs/11/basics/session) 中，以便它在用户下一次对应用程序的请求中可用：

```php
$request->flash();
```

您也可以使用 `flashOnly` 和 `flashExcept` 方法将部分请求数据闪存到 session 中。这些方法有助于将敏感信息，如密码，从 session 中保持出来：

```php
$request->flashOnly(['username', 'email']);

$request->flashExcept('password');
```

#### 闪存输入然后重定向

因为您经常需要将输入闪存到 session 然后重定向到前一个页面，您可以使用 `withInput` 方法将输入闪存链到重定向上：

```php
return redirect('form')->withInput();

return redirect()->route('user.create')->withInput();

return redirect('form')->withInput(
    $request->except('password')
);
```

#### 检索旧输入

要从前一个请求中检索闪存的输入，可以在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法将从 [session](/docs/11/basics/session) 中拉取先前闪存的输入数据：

```php
$username = $request->old('username');
```

Laravel 也提供了一个全局的 `old` 辅助函数。如果您在 [Blade 模板](/docs/11/basics/blade) 中显示旧输入，使用 `old` 辅助函数重新填充表单会更加方便。如果给定字段没有旧输入，则会返回 `null`：

```html
<input type="text" name="username" value="{{ old('username') }}" />
```

### Cookies

#### 从请求中检索 Cookies

Laravel 框架创建的所有 cookies 都是加密和签名的，这意味着如果客户端更改了它们，它们会被视为无效。要从请求中检索 cookie 值，请在 `Illuminate\Http\Request` 实例上使用 `cookie` 方法：

```php
$value = $request->cookie('name');
```

## 输入修剪和规范化

默认情况下，Laravel 在应用程序的全局中间件栈中包含了 `Illuminate\Foundation\Http\Middleware\TrimStrings` 和 `Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` 中间件。这些中间件会自动修剪请求上所有进入的字符串字段，并将任何空字符串字段转换为 `null`。这允许您在路由和控制器中不必担心这些标准化问题。

#### 禁用输入规范化

如果您想为所有请求禁用此行为，您可以通过在应用程序的 `bootstrap/app.php` 文件中调用 `$middleware->remove` 方法，从应用程序的中间件栈中移除这两个中间件：

```php
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;

->withMiddleware(function (Middleware $middleware) {
    $middleware->remove([
        ConvertEmptyStringsToNull::class,
        TrimStrings::class,
    ]);
})
```

如果您希望禁用部分请求的字符串修剪和空字符串转换，您可以在应用程序的 `bootstrap/app.php` 文件中使用 `trimStrings` 和 `convertEmptyStringsToNull` 中间件方法。这两个方法都接受一个闭包数组，该数组应该返回 `true` 或 `false` 来指示是否应该跳过输入规范化：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->convertEmptyStringsToNull(except: [
        fn (Request $request) => $request->is('admin/*'),
    ]);

    $middleware->trimStrings(except: [
        fn (Request $request) => $request->is('admin/*'),
    ]);
})
```

## 文件

### 检索上传文件

您可以使用 `file` 方法或使用动态属性从 `Illuminate\Http\Request` 实例检索上传的文件。`file` 方法返回 `Illuminate\Http\UploadedFile` 类的一个实例，该类扩展了 PHP 的 `SplFileInfo`类，并提供了多种与文件交云的方法：

```php
$file = $request->file('photo');

$file = $request->photo;
```

您可以使用 `hasFile` 方法确定请求中是否存在文件：

```php
if ($request->hasFile('photo')) {
    // ...
}
```

#### 验证成功的上传

除了检查文件是否存在外，您还可以通过 `isValid` 方法验证文件上传时是否没有问题：

```php
if ($request->file('photo')->isValid()) {
    // ...
}
```

#### 文件路径扩展名

`UploadedFile` 类还包含访问文件的完全限定路径和扩展名的方法。`extension` 方法将根据文件内容尝试猜测文件的扩展名。这个扩展名可能与客户端提供的扩展名不同：

```php
$path = $request->photo->path();

$extension = $request->photo->extension();
```

#### 其他文件方法

`UploadedFile` 实例还有多种其他方法。有关这些方法的更多信息，请查看类的 [API 文档](https://github.com/symfony/symfony/blob/6.0/src/Symfony/Component/HttpFoundation/File/UploadedFile.php)。

### 存储上传文件

要存储上传的文件，您通常会使用配置好的[文件系统](/docs/11/digging-deeper/filesystem)之一。`UploadedFile` 类拥有一个 `store` 方法，该方法会将上传的文件移动到您的磁盘之一，这可以是您本地文件系统上的位置，或者是亚马逊 S3 等云存储位置。

`store` 方法接受相对于文件系统配置的根目录的路径，用于存储文件。此路径不应包含文件名，因为系统会自动生成一个独特的 ID 来作为文件名。

`store` 方法还接受一个可选的第二个参数，指定应用于存储文件的磁盘名称。方法将返回文件相对于磁盘根目录的路径：

```php
$path = $request->photo->store('images');

$path = $request->photo->store('images', 's3');
```

如果您不希望自动生成一个文件名，您可以使用 `storeAs` 方法，该方法接受路径、文件名和磁盘名称作为其参数：

```php
$path = $request->photo->storeAs('images', 'filename.jpg');

$path = $request->photo->storeAs('images', 'filename.jpg', 's3');
```

> [!NOTE]  
> 有关 Laravel 中文件存储的更多信息，请查看完整的[文件存储文档](/docs/11/digging-deeper/filesystem)。

## 配置可信代理

在负载平衡器背后运行您的应用程序时，负载平衡器会终止 TLS / SSL 证书，您可能会注意到您的应用程序有时不会在使用 `url` 帮助器时生成 HTTPS 链接。通常，这是因为您的应用程序正在从负载平衡器上的 80 端口转发流量，并且不知道它应该生成安全链接。

为解决这问题，您可以启用 Laravel 应用程序中包含的 `Illuminate\Http\Middleware\TrustProxies` 中间件，它允许您快速定制应用程序应该信任的负载平衡器或代理。您的可信代理应通过应用程序的 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法指定：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: [
        '192.168.1.1',
        '192.168.1.2',
    ]);
})
```

除了配置可信代理外，您还可以配置应信任的代理头：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB
    );
})
```

> [!NOTE]  
> 如果您使用的是 AWS 弹性负载均衡，您的 `headers` 值应该是 `Request::HEADER_X_FORWARDED_AWS_ELB`。有关可以在 `headers` 值中使用的常量的更多信息，请查看 Symfony 关于[信任代理](https://symfony.com/doc/7.0/deployment/proxies.html)的文档。

#### 信任所有代理

如果您使用的是亚马逊 AWS 或其他“云”负载均衡器提供商，您可能不知道实际负载均衡器的 IP 地址。在这种情况下，您可以使用 `*` 信任所有代理：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: '*');
})
```

## 配置可信主机

默认情况下，Laravel 将响应其收到的所有请求，无论 HTTP 请求的 `Host` 头的内容如何。此外，生成 web 请求时，`Host` 头的值将用于生成应用程序的绝对 URL。

通常，您应该配置您的 web 服务器（如 Nginx 或 Apache），只将匹配给定主机名的请求发送到您的应用程序。然而，如果您无法直接自定义您的 web 服务器，并且需要指示 Laravel 只响应某些主机名，您可以通过启用应用程序的 `Illuminate\Http\Middleware\TrustHosts` 中间件来做到。

要启用 `TrustHosts` 中间件，您应该在应用程序的 `bootstrap/app.php` 文件中调用 `trustHosts`
