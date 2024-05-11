# Laravel Folio

[[toc]]

## 简介

[Laravel Folio](https://github.com/laravel/folio) 是一个强大的基于页面的路由器，旨在简化 Laravel 应用程序中的路由。使用 Laravel Folio，在应用程序的 `resources/views/pages` 目录中创建一个 Blade 模板就能轻松生成路由。

例如，要创建一个可以通过 `/greeting` URL 访问的页面，只需在应用程序的 `resources/views/pages` 目录中创建一个 `greeting.blade.php` 文件：

```html
<div>Hello World</div>
```

## 安装

要开始使用 Folio，使用 Composer 包管理器将 Folio 安装到您的项目中：

```bash
composer require laravel/folio
```

安装 Folio 后，您可以执行 `folio:install` Artisan 命令，该命令将安装 Folio 的服务提供者到您的应用程序中。此服务提供者注册了 Folio 将搜索路由/页面的目录：

```bash
php artisan folio:install
```

### 页面路径/URIs

默认情况下，Folio 从您的应用程序的 `resources/views/pages` 目录提供页面，但您可以在 Folio 服务提供者的 `boot` 方法中自定义这些目录。

例如，有时在同一个 Laravel 应用程序中指定多个 Folio 路径可能更方便。您可能希望为应用程序的“管理”区域有一个单独的 Folio 页面目录，而使用另一个目录为应用程序的其余页面。

可以使用 `Folio::path` 和 `Folio::uri` 方法来完成这个操作。`path` 方法注册了 Folio 在路由传入 HTTP 请求时将扫描页面的目录，而 `uri` 方法指定该页面目录的“基本 URI”：

```php
use Laravel\Folio\Folio;

Folio::path(resource_path('views/pages/guest'))->uri('/');

Folio::path(resource_path('views/pages/admin'))
    ->uri('/admin')
    ->middleware([
        '*' => [
            'auth',
            'verified',

            // ...
        ],
    ]);
```

### 子域名路由

您也可以根据传入请求的子域名路由到页面。例如，您可能希望将 `admin.example.com` 的请求路由到与其他 Folio 页面不同的目录中。您可以通过在调用 `Folio::path` 方法后调用 `domain` 方法来完成此操作：

```php
use Laravel\Folio\Folio;

Folio::domain('admin.example.com')
    ->path(resource_path('views/pages/admin'));
```

`domain` 方法还允许您捕获域名或子域名的部分作为参数。这些参数将注入到您的页面模板中：

```php
use Laravel\Folio\Folio;

Folio::domain('{account}.example.com')
    ->path(resource_path('views/pages/admin'));
```

## 创建路由

您可以通过在任何已挂载 Folio 目录中的 Blade 模板创建 Folio 路由。默认情况下，Folio 挂载 `resources/views/pages` 目录，但您可以在 Folio 服务提供者的 `boot` 方法中自定义这些目录。

将 Blade 模板放在已挂载 Folio 目录中后，您可以立即通过浏览器访问它。例如，放置在 `pages/schedule.blade.php` 中的页面可以在浏览器中通过 `http://example.com/schedule` 访问。

要快速查看所有 Folio 页面/路由的列表，您可以调用 `folio:list` Artisan 命令：

```bash
php artisan folio:list
```

### 嵌套路由

您可以通过在 Folio 目录中的一个或多个目录中创建一个嵌套路由。例如，要创建一个可以通过 `/user/profile` 访问的页面，请在 `pages/user` 目录中创建一个 `profile.blade.php` 模板：

```bash
php artisan folio:page user/profile

# pages/user/profile.blade.php → /user/profile
```

### 索引路由

有时，您可能希望将给定页面作为目录的“索引”。通过在 Folio 目录中放置一个 `index.blade.php` 模板，任何对该目录根的请求都将路由到该页面：

```bash
php artisan folio:page index
# pages/index.blade.php → /

php artisan folio:page users/index
# pages/users/index.blade.php → /users
```

## 路由参数

通常，您需要将传入请求的 URL 中的片段注入到您的页面中，以便您可以与它们交互。例如，您可能需要访问正在显示其配置文件的用户的“ID”。为了实现这一点，您可以使用方括号将页面文件名的一段封装起来：

```bash
php artisan folio:page "users/[id]"

# pages/users/[id].blade.php → /users/1
```

在您的 Blade 模板中可以访问捕获的片段作为变量：

```html
<div>User {{ $id }}</div>
```

要捕获多个片段，您可以在封装的片段前加上三个点 `...`：

```bash
php artisan folio:page "users/[...ids]"

# pages/users/[...ids].blade.php → /users/1/2/3
```

当捕获多个片段时，捕获的片段将作为数组注入到页面：

```html
<ul>
  @foreach ($ids as $id)
  <li>User {{ $id }}</li>
  @endforeach
</ul>
```

## 路由模型绑定

如果页面模板的文件名中的通配符片段与应用程序的 Eloquent 模型之一相对应，Folio 将自动利用 Laravel 的路由模型绑定功能，并尝试将解析的模型实例注入到您的页面中：

```bash
php artisan folio:page "users/[User]"

# pages/users/[User].blade.php → /users/1
```

在您的 Blade 模板中可以访问捕获的模型作为变量。模型的变量名称将被转换为“驼峰式大小写”：

```html
<div>User {{ $user->id }}</div>
```

#### 自定义键

有时您可能希望使用 `id` 之外的其他列来解析绑定的 Eloquent 模型。为此，您可以在页面的文件名中指定列。例如，文件名为 `[Post:slug].blade.php` 的页面将尝试通过 `slug` 列而不是 `id` 列来解析绑定的模型。

在 Windows 上，您应使用 `-` 来分隔模型名称和键：`[Post-slug].blade.php`。

#### 模型位置

默认情况下，Folio 将在应用程序的 `app/Models` 目录下搜索您的模型。然而，如果需要，您可以在模板的文件名中指定模型的完全限定类名：

```bash
php artisan folio:page "users/[.App.Models.User]"

# pages/users/[.App.Models.User].blade.php → /users/1
```

### 软删除模型

默认情况下，在解析隐式模型绑定时不会检索已软删除的模型。然而，如果您希望，您可以通过在页面的模板中调用 `withTrashed` 函数来指示 Folio 检索软删除的模型：

```php
<?php

use function Laravel\Folio\{withTrashed};

withTrashed();
?>

<div>
    User {{ $user->id }}
</div>
```

## 渲染钩子

默认情况下，Folio 将返回页面的 Blade 模板内容作为对传入请求的响应。然而，您可以通过在页面的模板中调用 `render` 函数来自定义响应。

`render` 函数接受一个闭包，该闭包将接收到 Folio 渲染的 `View` 实例，允许您向视图添加额外的数据或自定义整个响应。除了接收 `View` 实例外，任何其他路由参数或模型绑定也会提供给 `render` 闭包：

```php
<?php

use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

use function Laravel\Folio\render;

render(function (View $view, Post $post) {
    if (! Auth::user()->can('view', $post)) {
        return response('Unauthorized', 403);
    }

    return $view->with('photos', $post->author->photos);
}); ?>

<div>
    {{ $post->content }}
</div>

<div>
    This author has also taken {{ count($photos) }} photos.
</div>
```

## 命名路由

您可以使用 `name` 函数为给定页面的路由指定一个名称：

```php
<?php

use function Laravel\Folio\name;

name('users.index');
```

就像 Laravel 的命名路由一样，您可以使用 `route` 函数生成指向已分配名称的 Folio 页面的 URL：

```php
<a href="{{ route('users.index') }}">
    All Users
</a>
```

如果页面有参数，您可以简单地将它们的值传递给 `route` 函数：

```php
route('users.show', ['user' => $user]);
```

## 中间件

您可以通过在页面的模板中调用 `middleware` 函数为特定页面应用中间件：

```php
<?php

use function Laravel\Folio\{middleware};

middleware(['auth', 'verified']);

?>

<div>
    Dashboard
</div>
```

或者，要为一组页面分配中间件，您可以在调用 `Folio::path` 方法后链式调用 `middleware` 方法。

为了指定中间件应用到哪些页面，中间件数组可以使用对应的页面应用到的 URL 模式作为键。字符 `*` 可用作通配符：

```php
use Laravel\Folio\Folio;

Folio::path(resource_path('views/pages'))->middleware([
    'admin/*' => [
        'auth',
        'verified',

        // ...
    ],
]);
```

您可以在中间件数组中包含闭包以定义内联的匿名中间件：

```php
use Closure;
use Illuminate\Http\Request;
use Laravel\Folio\Folio;

Folio::path(resource_path('views/pages'))->middleware([
    'admin/*' => [
        'auth',
        'verified',

        function (Request $request, Closure $next) {
            // ...

            return $next($request);
        },
    ],
]);
```

## 路由缓存

在使用 Folio 时，您应该始终利用 [Laravel 的路由缓存功能](/docs/11/basics/routing#route-caching)。Folio 监听 `route:cache` Artisan 命令，确保 Folio 页面定义和路由名称正确缓存，以最大限度地提高性能。
