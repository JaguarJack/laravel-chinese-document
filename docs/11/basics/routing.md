---
title: Laravel 路由
---

# 路由

[[toc]]

## 基本路由

Laravel 最基本的路由接受一个 URI 和一个闭包，为定义路由和行为提供了一种非常简单和表达性的方法，不需要复杂的路由配置文件：

```php
use Illuminate\Support\Facades\Route;

Route::get('/greeting', function () {
    return 'Hello World';
});
```

### 默认的路由文件 {#the-default-route-files}

所有 Laravel 路由都是在你的路由文件中定义的，这些文件位于 `routes` 目录。它们会被 Laravel 自动加载，具体配置在你应用程序的 `bootstrap/app.php` 文件中。`routes/web.php` 文件定义了你的 web 界面的路由。这些路由被分配给 `web` 中间件群组，它提供了会话状态和 CSRF 保护等功能。

对于大多数应用程序，你将会从 `routes/web.php` 文件中开始定义路由。在 `routes/web.php` 文件中定义的路由可以通过在浏览器中输入定义的路由 URL 来访问。例如，你可以通过在浏览器中导航到 `http://example.com/user` 来访问以下路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user', [UserController::class, 'index']);
```

#### API 路由 {#api-routes}

如果你的应用程序还将提供一个无状态的 API，你可以使用 `install:api` Artisan 命令启用 API 路由：

```shell
php artisan install:api
```

`install:api` 命令安装了 [Laravel Sanctum](/docs/11/packages/sanctum)，它为认证第三方 API 消费者、SPA 或移动应用程序提供了一个强大而简单的 API 令牌身份验证守护程序。此外，`install:api` 命令还创建了 `routes/api.php` 文件：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

`routes/api.php` 中的路由是无状态的，并被分配到 `api` 中间件群组。此外，`/api` URI 前缀会自动应用到这些路由上，所以你不需要手动将它应用到文件中的每一个路由上。你可以通过修改应用程序的 `bootstrap/app.php` 文件来更改前缀：

```php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: 'api/admin',
    // ...
)
```

#### 可用的路由方法 {#available-router-methods}

路由器允许你注册响应任何 HTTP 动词的路由：

```php
Route::get($uri, $callback);
Route::post($uri, $callback);
Route::put($uri, $callback);
Route::patch($uri, $callback);
Route::delete($uri, $callback);
Route::options($uri, $callback);
```

有时你可能需要注册一个对多个 HTTP 动词响应的路由。你可以使用 `match` 方法来做到这一点。或者，你甚至可以使用 `any` 方法注册一个对所有 HTTP 动词响应的路由：

```php
Route::match(['get', 'post'], '/', function () {
    // ...
});

Route::any('/', function () {
    // ...
});
```

> [!NOTE]  
> 当定义多个共享同一 URI 的路由时，使用 `get`，`post`，`put`，`patch`，`delete` 和 `options` 方法的路由应在使用 `any`，`match` 和 `redirect` 方法的路由之前定义。这确保了传入的请求与正确的路由匹配。

#### 依赖注入 {#dependency-injection}

你可以在你的路由的回调签名中键入提示任何路由所需的依赖项。声明的依赖项将自动被 Laravel [服务容器](/docs/11/architecture-concepts/container)解析并注入到回调中。例如，你可以键入提示 `Illuminate\Http\Request` 类以自动将当前的 HTTP 请求注入到你的路由回调中：

```php
use Illuminate\Http\Request;

Route::get('/users', function (Request $request) {
    // ...
});
```

#### CSRF 保护 {#csrf-protection}

记住，指向在 `web` 路由文件中定义的 `POST`，`PUT`，`PATCH` 或 `DELETE` 路由的任何 HTML 表单都应该包含一个 CSRF 令牌字段。否则，请求将被拒绝。你可以在 [CSRF 文档](/docs/11/basics/csrf) 中阅读更多关于 CSRF 保护的信息：

```html
<form method="POST" action="/profile">@csrf ...</form>
```

### 重定向路由 {#redirect-routes}

如果你正在定义一个重定向到另一个 URI 的路由，你可以使用 `Route::redirect` 方法。这个方法提供了一个方便的快捷方式，这样你就不必定义一个完整的路由或控制器来执行一个简单的重定向：

```php
Route::redirect('/here', '/there');
```

默认情况下，`Route::redirect` 返回一个 `302` 状态码。你可以使用可选的第三个参数自定义状态码：

```php
Route::redirect('/here', '/there', 301);
```

或者，你可以使用 `Route::permanentRedirect` 方法来返回一个 `301` 状态码：

```php
Route::permanentRedirect('/here', '/there');
```

> [!WARNING]  
> 在重定向路由中使用路由参数时，以下参数是由 Laravel 保留的，不能被使用：`destination` 和 `status`。

### 视图路由

如果您的路由只需要返回一个视图，您可以使用 `Route::view` 方法。这个方法就像 `redirect` 方法一样，提供了一个简单的快捷方式，这样您就不必定义完整的路由或控制器。`view` 方法接受一个 URI 作为它的第一个参数，和一个视图名称作为它的第二个参数。此外，您可以提供一个数据数组作为可选的第三个参数来传递给视图：

```php
Route::view('/welcome', 'welcome');

Route::view('/welcome', 'welcome', ['name' => 'Taylor']);
```

::: warning
当在视图路由中使用路由参数时，以下参数被 Laravel 保留，不能使用：`view`、`data`、`status` 和 `headers`。
:::

### 列出您的路由

`route:list` Artisan 命令可以轻松地提供您的应用程序定义的所有路由的概览：

```shell
php artisan route:list
```

默认情况下，分配给每个路由的中间件不会显示在 `route:list` 输出中；但是，您可以通过添加 `-v` 选项到命令中，来指示 Laravel 显示路由中间件和中间件组名称：

```shell
php artisan route:list -v

# 展开中间件组...
php artisan route:list -vv
```

您还可以指示 Laravel 仅显示以特定 URI 开头的路由：

```shell
php artisan route:list --path=api
```

此外，您可以通过在执行 `route:list` 命令时提供 `--except-vendor` 选项来指示 Laravel 隐藏由第三方包定义的任何路由：

```shell
php artisan route:list --except-vendor
```

同样，您也可以指示 Laravel 仅显示由第三方包定义的路由，通过在执行 `route:list` 命令时提供 `--only-vendor` 选项：

```shell
php artisan route:list --only-vendor
```

### 路由自定义

默认情况下，您应用程序的路由是由 `bootstrap/app.php` 文件配置和加载的：

```php
<?php

use Illuminate\Foundation\Application;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )->create();
```

但是，有时您可能想要定义一个全新的文件来包含应用程序的路由子集。为此，您可以提供一个 `then` 闭包到 `withRouting` 方法中。在这个闭包内，您可以注册应用程序所需的任何附加路由：

```php
use Illuminate\Support\Facades\Route;

->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
    then: function () {
        Route::middleware('api')
            ->prefix('webhooks')
            ->name('webhooks.')
            ->group(base_path('routes/webhooks.php'));
    },
)
```

或者，您甚至可以通过向 `withRouting` 方法提供一个 `using` 闭包来完全控制路由注册。当这个参数传递时，框架不会注册任何 HTTP 路由，您需要手动注册所有路由：

```php
use Illuminate\Support\Facades\Route;

->withRouting(
    commands: __DIR__.'/../routes/console.php',
    using: function () {
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        Route::middleware('web')
            ->group(base_path('routes/web.php'));
    },
)
```

## 路由参数

### 必填参数

有时您需要在路由中捕获 URI 的片段。例如，您可能需要从 URL 中捕获用户的 ID。您可以通过定义路由参数来实现：

```php
Route::get('/user/{id}', function (string $id) {
    return 'User '.$id;
});
```

您可以根据路由的需要定义任意多个路由参数：

```php
Route::get('/posts/{post}/comments/{comment}', function (string $postId, string $commentId) {
    // ...
});
```

路由参数总是被包裹在 `{}` 括号内，并且应该由字母字符组成。下划线（`_`）在路由参数名称中也是可以接受的。路由参数是根据它们的顺序被注入到路由回调 / 控制器中 - 路由回调 / 控制器参数的名称并不重要。

#### 参数和依赖注入

如果您的路由具有您希望 Laravel 服务容器自动注入到您路由的回调中的依赖，则您应该在依赖后列出您的路由参数：

```php
use Illuminate\Http\Request;

Route::get('/user/{id}', function (Request $request, string $id) {
    return 'User '.$id;
});
```

### 可选参数

有时您可能需要指定一个路由参数，它可能并不总是出现在 URI 中。您可以通过在参数名称后放置一个 `?` 标记来执行此操作。确保为路由的对应变量提供一个默认值：

```php
Route::get('/user/{name?}', function (?string $name = null) {
    return $name;
});

Route::get('/user/{name?}', function (?string $name = 'John') {
    return $name;
});
```

### 正则表达式约束

您可以使用路由实例上的 `where` 方法对路由参数的格式进行约束。`where` 方法接受参数的名称和定义参数应如何受到约束的正则表达式：

```php
Route::get('/user/{name}', function (string $name) {
    // ...
})->where('name', '[A-Za-z]+');

Route::get('/user/{id}', function (string $id) {
    // ...
})->where('id', '[0-9]+');

Route::get('/user/{id}/{name}', function (string $id, string $name) {
    // ...
})->where(['id' => '[0-9]+', 'name' => '[a-z]+']);
```

为方便起见，一些常用的正则表达式模式有助手方法，允许您快速向您的路由添加模式约束：

```php
Route::get('/user/{id}/{name}', function (string $id, string $name) {
    // ...
})->whereNumber('id')->whereAlpha('name');

Route::get('/user/{name}', function (string $name) {
    // ...
})->whereAlphaNumeric('name');

Route::get('/user/{id}', function (string $id) {
    // ...
})->whereUuid('id');

Route::get('/user/{id}', function (string $id) {
    //
})->whereUlid('id');

Route::get('/category/{category}', function (string $category) {
    // ...
})->whereIn('category', ['movie', 'song', 'painting']);
```

如果传入的请求不匹配路由模式约束，将返回 404 HTTP 响应。

#### 全局约束

如果您希望路由参数始终受到给定正则表达式的约束，您可以使用 `pattern` 方法。您应该在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义这些模式：

```php
use Illuminate\Support\Facades\Route;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Route::pattern('id', '[0-9]+');
}
```

一旦定义了模式，它将自动应用于所有使用该参数名称的路由：

```php
Route::get('/user/{id}', function (string $id) {
    // 只在 {id} 是数字的情况下执行...
});
```

#### 编码的正斜杠

Laravel 路由组件允许路由参数值中存在除 `/` 之外的所有字符。您必须使用 `where` 条件正则表达式明确允许 `/` 成为您的占位符的一部分：

```php
Route::get('/search/{search}', function (string $search) {
    return $search;
})->where('search', '.*');
```

::: warning
编码的正斜杠仅在最后一个路由段内受支持。
:::

## 命名路由

命名路由允许方便地生成特定路由的 URL 或重定向。您可以通过在路由定义中链接 `name` 方法为路由指定一个名称：

```php
Route::get('/user/profile', function () {
    // ...
})->name('profile');
```

您也可以为控制器动作指定路由名称：

```php
Route::get(
    '/user/profile',
    [UserProfileController::class, 'show']
)->name('profile');
```

::: warning
路由名称应始终是唯一的。
:::

#### 生成指向命名路由的 URLs

一旦为给定路由分配了名称，您就可以在通过 Laravel 的 `route` 和 `redirect` 帮助函数生成 URLs 或重定向时使用路由的名称：

```php
// 生成 URLs...
$url = route('profile');

// 生成重定向...
return redirect()->route('profile');

return to_route('profile');
```

如果命名路由定义了参数，您可以将参数作为第二个参数传递给 `route` 函数。给定参数将自动按正确位置插入生成的 URL 中：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1]);
```

如果您在数组中传递了额外的参数，这些键/值对将自动添加到生成的 URL 的查询字符串中：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1, 'photos' => 'yes']);

// /user/1/profile?photos=yes
```

::: note
有时，您可能希望为 URL 参数指定请求范围的默认值，例如当前的区域设置。为此，您可以使用 [`URL::defaults` 方法](/docs/11/basics/urls#default-values)。
:::

#### 检查当前路由

如果您想确定当前请求是否路由到给定的命名路由，您可以在 Route 实例上使用 `named` 方法。例如，您可以从路由中间件检查当前路由名称：

```php
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Handle an incoming request.
 *
 * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
 */
public function handle(Request $request, Closure $next): Response
{
    if ($request->route()->named('profile')) {
        // ...
    }

    return $next($request);
}
```

## 路由组

路由组允许您在大量路由上共享路由属性，例如中间件，而不需要在每个单独的路由上定义那些属性。

嵌套组会尝试智能地将属性与它们的父组合并。中间件和 `where` 条件被合并，而名称和前缀被附加。命名空间分隔符和 URI 前缀中的斜杠在适当的时候自动添加。

### 中间件

要将 [中间件](/docs/11/basics/middleware) 分配给组内的所有路由，您可以在定义组之前使用 `middleware` 方法。中间件按照数组中列出的顺序执行：

```php
Route::middleware(['first', 'second'])->group(function () {
    Route::get('/', function () {
        // 使用 first & second 中间件...
    });

    Route::get('/user/profile', function () {
        // 使用 first & second 中间件...
    });
});
```

### 控制器

如果一组路由都利用同一个 [控制器](/docs/11/basics/controllers)，您可以使用 `controller` 方法为组内的所有路由定义公共控制器。然后，在定义路由时，您只需要提供它们调用的控制器方法：

```php
use App\Http\Controllers\OrderController;

Route::controller(OrderController::class)->group(function () {
    Route::get('/orders/{id}', 'show');
    Route::post('/orders', 'store');
});
```

### 子域名路由

路由组也可以用来处理子域名路由。子域名可以像路由 URI 一样分配路由参数，允许您捕获子域名的一部分以用于您的路由或控制器。通过在定义组之前调用 `domain` 方法来指定子域名：

```php
Route::domain('{account}.example.com')->group(function () {
    Route::get('user/{id}', function (string $account, string $id) {
        // ...
    });
});
```

::: warning
为了确保您的子域路由可达，请在注册根域路由之前注册子域路由。这将防止具有相同 URI 路径的根域路由覆盖子域路由。
:::

### 路由前缀

`prefix` 方法可以用来为组中的每个路由添加给定的 URI 前缀。例如，您可能希望为组内的所有路由 URI 添加 `admin` 前缀：

```php
Route::prefix('admin')->group(function () {
    Route::get('/users', function () {
        // 匹配 "/admin/users" URL
    });
});
```

### 路由名称前缀

`name` 方法可用于为组中的每个路由名称添加一个给定的字符串前缀。例如，您可能希望为组中所有路由的名称添加 `admin` 前缀。指定的字符串会被精确地添加到路由名称中，因此我们会确保在前缀中提供后缀 `.` 字符：

```php
Route::name('admin.')->group(function () {
    Route::get('/users', function () {
        // 路由被分配名称 "admin.users"...
    })->name('users');
});
```

### 路由模型绑定

当向路由或控制器动作注入模型 ID 时，您通常会查询数据库以检索与该 ID 对应的模型。Laravel 路由模型绑定提供了一种方便的方式，可以自动将模型实例直接注入到您的路由中。例如，您可以注入整个 `User` 实例来代替注入用户的 ID。

### 隐式绑定

Laravel 会自动解析在路由或控制器动作中定义的 Eloquent 模型，这些模型的类型提示变量名与路由段名称匹配。例如：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
});
```

因为 `$user` 变量被类型提示为 `App\Models\User` Eloquent 模型，并且变量名与 `{user}` URI 段匹配，Laravel 会自动注入具有匹配请求 URI 中相应值的 ID 的模型实例。如果没有找到数据库中匹配的模型实例，将自动生成 404 HTTP 响应。

当然，当使用控制器方法时，也可以进行隐式绑定。同样，请注意 `{user}` URI 段与控制器中包含 `App\Models\User` 类型提示的 `$user` 变量相匹配：

```php
use App\Http\Controllers\UserController;
use App\Models\User;

// 路由定义...
Route::get('/users/{user}', [UserController::class, 'show']);

// 控制器方法定义...
public function show(User $user)
{
    return view('user.profile', ['user' => $user]);
}
```

#### 软删除模型

通常情况下，隐式模型绑定不会检索已经 [软删除的](/docs/11/eloquent/eloquent#软删除) 模型。然而，您可以通过在路由定义时链接 `withTrashed` 方法，来指示隐式绑定检索这些模型：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
})->withTrashed();
```

#### 自定义键

有时您可能希望使用 `id` 以外的列来解析 Eloquent 模型。为此，您可以在路由参数定义中指定列：

```php
use App\Models\Post;

Route::get('/posts/{post:slug}', function (Post $post) {
    return $post;
});
```

如果您希望模型绑定在检索给定模型类时始终使用 `id` 以外的数据库列，您可以重写 Eloquent 模型上的 `getRouteKeyName` 方法：

```php
/**
 * 获取模型的路由键。
 */
public function getRouteKeyName(): string
{
    return 'slug';
}
```

#### 自定义键和范围

当在单个路由定义中隐式绑定多个 Eloquent 模型时，您可能希望对第二个 Eloquent 模型进行范围化，以保证它必须是前一个 Eloquent 模型的子模型。例如，考虑到此路由定义，它为特定用户检索通过 slug 获取的博客帖子：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
});
```

当在路由中使用自定义键的隐式绑定时，Laravel 将自动将查询范围化为通过父级检索子模型。在这种情况下，会假定 `User` 模型有一个名为 `posts` 的关系（路由参数名称的复数形式），可以用来检索 `Post` 模型。

如果您愿意，您可以在没有提供自定义键的情况下告诉 Laravel 范围化“子”绑定。为此，您可以在定义路由时调用 `scopeBindings` 方法：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    return $post;
})->scopeBindings();
```

或者，您可以指示一整组路由定义使用范围化的绑定：

```php
Route::scopeBindings()->group(function () {
    Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
        return $post;
    });
});
```

同样，您可以明确告诉 Laravel 通过调用 `withoutScopedBindings` 方法不进行范围化绑定：

```php
Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
})->withoutScopedBindings();
```

#### 自定义缺失模型行为

通常如果未找到隐式绑定的模型，则会生成 404 HTTP 响应。但是，您可以通过在定义路由时调用 `missing` 方法来自定义此行为。`missing` 方法接受一个闭包，如果未找到隐式绑定的模型，将调用该闭包：

```php
use App\Http\Controllers\LocationsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

Route::get('/locations/{location:slug}', [LocationsController::class, 'show'])
        ->name('locations.view')
        ->missing(function (Request $request) {
            return Redirect::route('locations.index');
        });
```

### 隐式枚举绑定

PHP 8.1 引入了对[枚举](https://www.php.net/manual/en/language.enumerations.backed.php)的支持。为了补充这个特性，Laravel 允许你在路由定义中对 [具备字符串支持的枚举](https://www.php.net/manual/en/language.enumerations.backed.php) 进行类型提示，并且 Laravel 只有在该路由片段对应一个有效的枚举值时才会调用路由。否则，将自动返回一个 404 HTTP 响应。例如，给定以下枚举：

```php
<?php

namespace App\Enums;

enum Category: string
{
    case Fruits = 'fruits';
    case People = 'people';
}
```

你可以定义一个路由，只有当 `{category}` 路由片段为 `fruits` 或 `people` 时才会被调用。否则，Laravel 会返回一个 404 HTTP 响应：

```php
use App\Enums\Category;
use Illuminate\Support\Facades\Route;

Route::get('/categories/{category}', function (Category $category) {
    return $category->value;
});
```

### 显式绑定

您不需要使用 Laravel 的隐式、基于约定的模型解析来使用模型绑定。你也可以显式定义路由参数如何对应模型。要注册一个显式绑定，请使用路由器的 `model` 方法为给定参数指定类。你应该在 `AppServiceProvider` 类的 `boot` 方法开始时定义你的显式模型绑定：

```php
use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Route::model('user', User::class);
}
```

接下来，定义一个包含 `{user}` 参数的路由：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    // ...
});
```

由于我们已将所有 `{user}` 参数绑定到 `App\Models\User` 模型，所以该类的实例会被注入到路由中。所以，例如，一个对 `users/1` 的请求会注入数据库中 ID 为 `1` 的 `User` 实例。

如果在数据库中未找到匹配的模型实例，将自动生成 404 HTTP 响应。

#### 自定义解析逻辑

如果你希望定义自己的模型绑定解析逻辑，你可以使用 `Route::bind` 方法。你传递给 `bind` 方法的闭包将接收 URI 片段的值，并应返回应该注入到路由中的类的实例。同样，这个自定义应该在应用程序的 `AppServiceProvider` 的 `boot` 方法中进行：

```php
use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Route::bind('user', function (string $value) {
        return User::where('name', $value)->firstOrFail();
    });
}
```

或者，你可以重写 Eloquent 模型上的 `resolveRouteBinding` 方法。该方法将接收 URI 片段的值，并应该返回应该注入到路由中的类的实例：

```php
/**
 * 为绑定的值检索模型。
 *
 * @param  mixed  $value
 * @param  string|null  $field
 * @return \Illuminate\Database\Eloquent\Model|null
 */
public function resolveRouteBinding($value, $field = null)
{
    return $this->where('name', $value)->firstOrFail();
}
```

如果路由使用[隐式绑定范围化](#implicit-model-binding-scoping)，那么 `resolveChildRouteBinding` 方法将用于解析父模型的子绑定：

```php
/**
 * 为绑定值检索子模型。
 *
 * @param  string  $childType
 * @param  mixed  $value
 * @param  string|null  $field
 * @return \Illuminate\Database\Eloquent\Model|null
 */
public function resolveChildRouteBinding($childType, $value, $field)
{
    return parent::resolveChildRouteBinding($childType, $value, $field);
}
```

### 备用路由

使用 `Route::fallback` 方法，你可以定义一个路由，当没有其他路由匹配传入请求时将执行这个路由。通常，未处理的请求会通过应用程序的异常处理器自动渲染 "404" 页面。然而，由于你通常会在 `routes/web.php` 文件中定义 `fallback` 路由，所以所有 `web` 中间件组中的中间件都将应用于该路由。你可以根据需要为此路由添加额外的中间件：

```php
Route::fallback(function () {
    // ...
});
```

::: warning
fallback 路由应该始终是应用程序注册的最后一个路由。
:::

### 速率限制

#### 定义限速器

Laravel 包含强大且可定制的限速服务，你可以使用它来限制给定路由或一组路由的流量量。要开始，请为你的应用程序定义满足需求的限速器配置。

限速器可以在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Bootstrap any application services.
 */
protected function boot(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}
```

限速器是使用 `RateLimiter` 门面的 `for` 方法定义的。`for` 方法接受一个限速器名称和一个返回应应用于分配给限速器的路由的限制配置的闭包。限制配置是 `Illuminate\Cache\RateLimiting\Limit` 类的实例。这个类包含有用的 "构建器" 方法，这样你可以快速定义你的限制。限速器名称可以是任何你希望的字符串：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Bootstrap any application services.
 */
protected function boot(): void
{
    RateLimiter::for('global', function (Request $request) {
        return Limit::perMinute(1000);
    });
}
```

如果传入请求超过指定的速率限制，Laravel 将自动返回一个带有 429 HTTP 状态码的响应。如果你想定义在限速时应该返回的自定义响应，你可以使用 `response` 方法：

```php
RateLimiter::for('global', function (Request $request) {
    return Limit::perMinute(1000)->response(function (Request $request, array $headers) {
        return response('Custom response...', 429, $headers);
    });
});
```

由于限速器回调接收传入的 HTTP 请求实例，你可以基于传入请求或认证用户动态构建适当的速率限制：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
                ? Limit::none()
                : Limit::perMinute(100);
});
```

#### 分段速率限制

有时你可能希望根据某些任意值对速率限制进行分段。例如，你可能希望允许用户每分钟每个 IP 地址 100 次访问特定路由。为了实现这一点，你可以在构建速率限制时使用 `by` 方法：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
                ? Limit::none()
                : Limit::perMinute(100)->by($request->ip());
});
```

用另一个例子来说明这个功能，我们可以限制路由到每分钟每个认证用户 ID 100 次或每个非注册用户的 IP 地址 10 次：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()
                ? Limit::perMinute(100)->by($request->user()->id)
                : Limit::perMinute(10)->by($request->ip());
});
```

#### 多重速率限制

如有必要，你可以为给定的限速器配置返回一组速率限制。每个速率限制将根据它们在数组中的顺序对路由进行评估：

```php
RateLimiter::for('login', function (Request $request) {
    return [
        Limit::perMinute(500),
        Limit::perMinute(3)->by($request->input('email')),
    ];
});
```

### 附加限速器到路由

限速器可以使用 `throttle` [中间件](/docs/11/basics/middleware) 附加到路由或路由组。throttle 中间件接受你希望分配给该路由的限速器名称：

```php
Route::middleware(['throttle:uploads'])->group(function () {
    Route::post('/audio', function () {
        // ...
    });

    Route::post('/video', function () {
        // ...
    });
});
```

#### 使用 Redis 进行限制

默认情况下，`throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequests` 类。然而，如果你使用 Redis 作为应用程序的缓存驱动，你可能希望指导 Laravel 使用 Redis 来管理速率限制。为此，你应该在应用程序的 `bootstrap/app.php` 文件中使用 `throttleWithRedis` 方法。这个方法将 `throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` 中间件类：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->throttleWithRedis();
    // ...
})
```

### 表单方法欺骗

HTML 表单不支持 `PUT`、`PATCH` 或 `DELETE` 动作。因此，当从 HTML 表单调用 `PUT`、`PATCH` 或 `DELETE` 路由时，你需要添加一个隐藏的 `_method` 字段到表单。与 `_method` 字段一起发送的值将被用作 HTTP 请求方法：

```html
<form action="/example" method="POST">
  <input type="hidden" name="_method" value="PUT" />
  <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

为了方便起见，你可以使用 `@method` [Blade 指令](/docs/11/basics/blade) 来生成 `_method` 输入字段：

```html
<form action="/example" method="POST">@method('PUT') @csrf</form>
```

### 访问当前路由

你可以使用 `Route` 门面上的 `current`、`currentRouteName` 和 `currentRouteAction` 方法访问处理传入请求的路由的信息：

```php
use Illuminate\Support\Facades\Route;

$route = Route::current(); // Illuminate\Routing\Route
$name = Route::currentRouteName(); // string
$action = Route::currentRouteAction(); // string
```

你可以参考 [Route facade 的底层类](https://laravel.com/api/{{version}}/Illuminate/Routing/Router.html) 和 [Route 实例](https://laravel.com/api/{{version}}/Illuminate/Routing/Route.html) 的 API 文档来查看 router 和 route 类上可用的所有方法。

### 跨源资源共享 (CORS)

Laravel 可以自动地使用你配置的值响应 CORS `OPTIONS` HTTP 请求。`OPTIONS` 请求将自动由自动包含在你应用程序全局中间件堆栈中的 `HandleCors` [中间件](/docs/11/basics/middleware) 处理。

有时，你可能需要为你的应用程序自定义 CORS 配置值。你可以通过使用 `config:publish` Artisan 命令来发布 `cors` 配置文件：

```shell
php artisan config:publish cors
```

这个命令会将 `cors.php` 配置文件放置在你的应用程序的 `config` 目录中。

::: note
有关 CORS 和 CORS 头的更多信息，请参考 [MDN web 文档关于 CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers)。
:::

### 路由缓存

当将你的应用程序部署到生产环境时，你应该利用 Laravel 的路由缓存。使用路由缓存将大大减少注册你的应用程序所有路由所需的时间。要生成路由缓存，请执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

执行此命令后，你的缓存路由文件将在每个请求中被加载。记住，如果你添加了任何新路由，你将需要生成一个新的路由缓存。因此，只有在你的项目部署过程中才应该运行 `route:cache` 命令。

你可以使用 `route:clear` 命令来清除路由缓存：

```shell
php artisan route:clear
```
