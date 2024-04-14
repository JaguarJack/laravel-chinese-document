---
title: Laravel 视图
---

# 视图

[[toc]]

## 介绍

当然，直接从你的路由和控制器返回整个 HTML 文档字符串是不实际的。幸好，视图提供了一种方便的方式，可以将所有的 HTML 放在单独的文件中。

视图将你的控制器/应用程序逻辑与你的展示逻辑分离，并存储在 `resources/views` 目录中。在使用 Laravel 时，视图模板通常使用 [Blade 模板语言](/docs/11/basics/blade) 编写。一个简单的视图可能看起来像这样：

```blade
<!-- View stored in resources/views/greeting.blade.php -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于这个视图存储在 `resources/views/greeting.blade.php`，我们可以使用全局的 `view` 辅助函数返回它，如下所示：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

> [!NOTE]
> 想要获取更多关于如何编写 Blade 模板的信息吗？查看完整的 [Blade 文档](/docs/11/basics/blade) 来开始。

### 用 React/Vue 编写视图

与其通过 Blade 使用 PHP 编写前端模板，许多开发者更愿意使用 React 或 Vue 来编写模板。Laravel 使这变得轻而易举，感谢 [Inertia](https://inertiajs.com/)，一个能轻松将你的 React/Vue 前端与 Laravel 后端绑定起来的库，而无需构建 SPA 的典型复杂性。

我们的 Breeze 和 Jetstream [起始套件](/docs/11/getting-started/starter-kits) 为你的下一个使用 Inertia 驱动的 Laravel 应用程序提供了一个很好的起点。此外，[Laravel Bootcamp](https://bootcamp.laravel.com) 提供了使用 Inertia 构建 Laravel 应用程序的完整演示，包括 Vue 和 React 中的示例。

## 创建和渲染视图

你可以通过在应用程序的 `resources/views` 目录中放置一个带有 `.blade.php` 扩展名的文件，或者使用 `make:view` Artisan 命令来创建视图：

```shell
php artisan make:view greeting
```

`.blade.php` 扩展名告诉框架该文件包含 [Blade 模板](/docs/11/basics/blade)。Blade 模板包含 HTML 和 Blade 指令，可以让你轻松输出值、创建 "if" 语句、遍历数据等。

一旦你创建了视图，你可以使用全局 `view` 辅助函数从你的应用程序的路由或控制器返回它：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

视图也可以使用 `View` facade 返回：

```php
use Illuminate\Support\Facades\View;

return View::make('greeting', ['name' => 'James']);
```

正如你所看到的，传递给 `view` 辅助函数的第一个参数对应于 `resources/views` 目录中的视图文件的名称。第二个参数是一个数据数组，该数据应当提供给视图。在本例中，我们正在传递 `name` 变量，它使用 [Blade 语法](/docs/11/basics/blade) 在视图中显示。

### 嵌套视图目录

视图也可以嵌套在 `resources/views` 目录的子目录中。"点" 符号可用于引用嵌套视图。例如，如果你的视图存储在 `resources/views/admin/profile.blade.php`，你可以从应用程序的一个路由/控制器返回它，如下所示：

```php
return view('admin.profile', $data);
```

> [!WARNING]
> 视图目录名称不应包含 `.` 字符。

### 创建第一个可用的视图

使用 `View` facade 的 `first` 方法，你可以创建在给定视图数组中存在的第一个视图。如果你的应用程序或包允许视图被自定义或覆盖，这可能会很有用：

```php
use Illuminate\Support\Facades\View;

return View::first(['custom.admin', 'admin'], $data);
```

### 确定视图是否存在

如果你需要确定视图是否存在，你可以使用 `View` facade。`exists` 方法将在视图存在时返回 `true`：

```php
use Illuminate\Support\Facades\View;

if (View::exists('admin.profile')) {
    // ...
}
```

## 向视图传递数据

正如你在前面的示例中看到的，你可以向视图传递一个数据数组，以使该数据可用于视图：

```php
return view('greetings', ['name' => 'Victoria']);
```

传递数据时，数据应该是键/值对的数组。在向视图提供数据后，你可以在视图中使用数据的键来访问每个值，例如 `<?php echo $name; ?>`。

作为替代方法，你可以使用 `view` 辅助函数的 `with` 方法向视图添加单独的数据片段。`with` 方法返回视图对象的实例，因此你可以在返回视图之前继续链式调用方法：

```php
return view('greeting')
            ->with('name', 'Victoria')
            ->with('occupation', 'Astronaut');
```

### 与所有视图共享数据

有时，你可能需要与你的应用程序渲染的所有视图共享数据。你可以使用 `View` facade 的 `share` 方法来做到这一点。通常，你应该在服务提供者的 `boot` 方法中放置对 `share` 方法的调用。你可以将它们添加到 `App\Providers\AppServiceProvider` 类，或者生成一个单独的服务提供者来容纳它们：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::share('key', 'value');
    }
}
```

## 视图合成器

视图合成器是在渲染视图时调用的回调或类方法。如果你有数据希望每次渲染视图时都绑定到视图上，视图合成器可以帮助你将该逻辑组织到一个位置。视图合成器在一些由应用程序内多个路由或控制器返回的相同视图并且始终需要特定数据的情况下尤其有用。

通常，视图合成器会在应用程序的[服务提供者](/docs/11/architecture-concepts/providers)中注册。在这个示例中，我们将假设 `App\Providers\AppServiceProvider` 将包含这个逻辑。

我们将使用 `View` facade 的 `composer` 方法注册视图合成器。Laravel 没有为基于类的视图合成器包括默认目录，因此你可以自由地按照你的愿望来组织它们。例如，你可以创建一个 `app/View/Composers` 目录来容纳你应用程序的所有视图合成器：

```php
<?php

namespace App\Providers;

use App\View\Composers\ProfileComposer;
use Illuminate\Support\Facades;
use Illuminate\Support\ServiceProvider;
use Illuminate\View\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 启动任何应用服务。
     */
    public function boot(): void
    {
        // 使用基于类的合成器...
        Facades\View::composer('profile', ProfileComposer::class);

        // 使用基于闭包的合成器...
        Facades\View::composer('welcome', function (View $view) {
            // ...
        });

        Facades\View::composer('dashboard', function (View $view) {
            // ...
        });
    }
}
```

现在我们已经注册了合成器，每次 `profile` 视图被渲染时，都会执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。让我们来看一个合成器类的示例：

```php
<?php

namespace App\View\Composers;

use App\Repositories\UserRepository;
use Illuminate\View\View;

class ProfileComposer
{
    /**
     * 创建一个新的 profile 合成器。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}

    /**
     * 将数据绑定到视图。
     */
    public function compose(View $view): void
    {
        $view->with('count', $this->users->count());
    }
}
```

如你所见，所有视图合成器都通过[服务容器](/docs/11/architecture-concepts/container)解析，因此你可以在合成器的构造函数中键入提示你所需要的任何依赖。

#### 将合成器附加到多个视图

你可以通过向 `composer` 方法的第一个参数传递一个视图数组，一次性将视图合成器附加到多个视图上：

```php
use App\Views\Composers\MultiComposer;
use Illuminate\Support\Facades\View;

View::composer(
    ['profile', 'dashboard'],
    MultiComposer::class
);
```

`composer` 方法也接受 `*` 字符作为通配符，允许你将合成器附加到所有视图：

```php
use Illuminate\Support\Facades;
use Illuminate\View\View;

Facades\View::composer('*', function (View $view) {
    // ...
});
```

### 视图创作者

视图“创作者”与视图合成器非常相似；然而，它们是在视图实例化后立即执行的，而不是等到视图即将渲染时执行。要注册视图创作者，请使用 `creator` 方法：

```php
use App\View\Creators\ProfileCreator;
use Illuminate\Support\Facades\View;

View::creator('profile', ProfileCreator::class);
```

## 优化视图

默认情况下，Blade 模板视图是按需编译的。当执行渲染视图的请求时，Laravel 将确定是否存在视图的已编译版本。如果文件存在，Laravel 然后会确定未编译的视图是否比编译过的视图更近期地被修改过。如果编译的视图不存在，或未编译的视图已被修改，Laravel 将重新编译视图。

在请求期间编译视图可能会对性能略有影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译你的应用程序使用的所有视图。为了提高性能，你可能希望将此命令作为你的部署过程的一部分：

```shell
php artisan view:cache
```

你可以使用 `view:clear` 命令清除视图缓存：

```shell
php artisan view:clear
```
