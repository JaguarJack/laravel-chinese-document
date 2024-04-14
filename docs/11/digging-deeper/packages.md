---
title: Laravel 包开发
---

# 包开发

[[toc]]

## 介绍

包是向 Laravel 添加功能的主要方式。包可以是任何东西，从处理日期的好方法例如 [Carbon](https://github.com/briannesbitt/Carbon)，到允许您将文件与 Eloquent 模型关联的包，比如 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary)。

有不同类型的包。有些包是独立的，意味着它们适用于任何 PHP 框架。Carbon 和 Pest 就是独立包的例子。这些包通过在 `composer.json` 文件中要求它们，可以被用于 Laravel。

另一方面，有些包是专门为 Laravel 使用而设计的。这些包可能有专门旨在增强 Laravel 应用程序的路由、控制器、视图和配置。本指南主要涵盖那些特定于 Laravel 的包的开发。

### 关于 Facades 的说明

当编写 Laravel 应用程序时，通常不重要您是使用 contracts 还是 facades，因为两者都提供基本相等的可测试性级别。然而，当编写包时，您的包通常无法访问 Laravel 的所有测试助手。如果您想能够编写测试，就像包是安装在典型的 Laravel 应用程序中一样，您可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 包。

## 包发现

Laravel 应用程序的 `bootstrap/providers.php` 文件包含应当被 Laravel 加载的服务提供者列表。然而，代替要求用户手动将您的服务提供者添加到列表中，你可以在包的 `composer.json` 文件的 `extra` 部分定义提供者，这样它就会被 Laravel 自动加载。除了服务提供者外，你还可以列出任何你想要注册的 [facades](/docs/11/architecture-concepts/facades)：

```json
"extra": {
    "laravel": {
        "providers": [
            "Barryvdh\\Debugbar\\ServiceProvider"
        ],
        "aliases": {
            "Debugbar": "Barryvdh\\Debugbar\\Facade"
        }
    }
},
```

一旦您的包配置为可被发现，当它被安装时 Laravel 将自动注册它的服务提供者和 facades，为您的包用户创造一个方便的安装体验。

#### 选择退出包发现

如果你是一个包的消费者，并想禁用某个包的包发现，你可以在应用程序的 `composer.json` 文件的 `extra` 部分列出该包的名称：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

您可以使用 `*` 字符禁用应用程序的 `dont-discover` 指令中的所有包发现：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "*"
        ]
    }
},
```

## 服务提供者

[服务提供者](/docs/11/architecture-concepts/providers)是您的包与 Laravel 连接的点。服务提供者负责将事物绑定到 Laravel 的 [服务容器](/docs/11/architecture-concepts/container)，并告知 Laravel 从何处加载包资源，如视图、配置和语言文件。

服务提供者继承 `Illuminate\Support\ServiceProvider` 类，并包含两个方法：`register` 和 `boot`。基础 `ServiceProvider` 类位于 `illuminate/support` Composer 包中，您应该将它添加到您自己包的依赖中。要了解更多关于服务提供者的结构和用途，请查看 [它们的文档](/docs/11/architecture-concepts/providers)。

## 资源

### 配置

通常，您需要将包的配置文件发布到应用程序的 `config` 目录。这将允许您的包用户轻松覆盖您的默认配置选项。要允许您的配置文件被发布，请在您的服务提供者的 `boot` 方法中调用 `publishes` 方法：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/courier.php' => config_path('courier.php'),
    ]);
}
```

现在，当您的包用户执行 Laravel 的 `vendor:publish` 命令时，您的文件将被复制到指定的发布位置。一旦您的配置被发布，其值可以像任何其他配置文件一样被访问：

```php
$value = config('courier.option');
```

> [!WARNING]  
> 您不应在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，它们无法被正确序列化。

#### 默认包配置

您还可以将您自己的包配置文件与应用程序的已发布副本合并。这将允许您的用户仅定义他们实际想要在配置文件的已发布副本中覆盖的选项。要合并配置文件的值，请在服务提供者的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法接受您包的配置文件的路径作为其第一个参数，以及应用程序拷贝配置文件的名称作为其第二个参数：

```php
/**
 * 注册任何应用服务。
 */
public function register(): void
{
    $this->mergeConfigFrom(
        __DIR__.'/../config/courier.php', 'courier'
    );
}
```

> [!WARNING]  
> 此方法仅合并配置数组的第一级别。如果您的用户部分定义了多维配置数组，缺失的选项将不会被合并。

### 路由

如果您的包包含路由，您可以使用 `loadRoutesFrom` 方法来加载它们。这个方法会自动确定应用程序的路由是否已缓存，并且如果路由已经被缓存了就不会加载您的路由文件：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

### 迁移

如果您的包包含 [数据库迁移](/docs/11/database/migrations)，您可以使用 `publishesMigrations` 方法通知 Laravel 给定的目录或文件包含迁移。当 Laravel 发布这些迁移时，它将自动更新其文件名中的时间戳以反映当前的日期和时间：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishesMigrations([
        __DIR__.'/../database/migrations' => database_path('migrations'),
    ]);
}
```

### 语言文件

如果您的包包含 [语言文件](/docs/11/digging-deeper/localization)，您可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果您的包名为 `courier`，您应在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

包翻译行使用 `package::file.line` 语法约定引用。因此，一旦您的视图路径在服务提供者中注册，您就可以这样加载 `courier` 包的 `messages` 文件中的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

您可以使用 `loadJsonTranslationsFrom` 方法为您的包注册 JSON 翻译文件。此方法接受包含包的 JSON 翻译文件的目录的路径：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadJsonTranslationsFrom(__DIR__.'/../lang');
}
```

#### 发布语言文件

如果您想将包的语言文件发布到应用程序的 `lang/vendor` 目录，您可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个包路径数组及其期望的发布位置。例如，要发布 `courier` 包的语言文件，您可以执行以下操作：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');

    $this->publishes([
        __DIR__.'/../lang' => $this->app->langPath('vendor/courier'),
    ]);
}
```

现在，当您的包用户执行 Laravel 的 `vendor:publish` Artisan 命令时，您包的语言文件将被发布到指定的发布位置。

### 视图

要向 Laravel 注册您包的 [视图](/docs/11/basics/views)，您需要告知 Laravel 视图的位置。您可以使用服务提供者的 `loadViewsFrom` 方法来实现这一点。`loadViewsFrom` 方法接受两个参数：视图模板的路径和包的名称。例如，如果您的包名称是 `courier`，您将在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

包视图使用 `package::view` 语法约定引用。因此，一旦您的视图路径在服务提供者中注册，您可以这样加载 `courier` 包的 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

### 替换包视图

当您使用 `loadViewsFrom` 方法时，Laravel 实际上会注册您的视图的两个位置：应用程序的 `resources/views/vendor` 目录和您指定的目录。例如，使用 `courier` 包为例，Laravel 首先会检查开发者是否已经在 `resources/views/vendor/courier` 目录中放置了视图的自定义版本。然后，如果视图尚未进行自定义，Laravel 将搜索您在调用 `loadViewsFrom` 时指定的包视图目录。这样，包的用户很容易自定义/替换您的包视图。

#### 发布视图

如果您想要使视图可被发布到应用程序的 `resources/views/vendor` 目录，您可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个包视图路径和其期望的发布位置的数组：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');

    $this->publishes([
        __DIR__.'/../resources/views' => resource_path('views/vendor/courier'),
    ]);
}
```

现在，当您的包用户运行 Laravel 的 `vendor:publish` Artisan 命令时，您的包的视图将被复制到指定的发布位置。

### 视图组件

如果您正在构建一个使用 Blade 组件的包，或者在非常规目录中放置组件，您将需要手动注册您的组件类和其 HTML 标签别名，以便 Laravel 知道在哪里找到组件。您通常应该在包的服务提供者的 `boot` 方法中注册您的组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

注册组件后，可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，您可以使用 `componentNamespace` 方法通过惯例自动加载组件类。例如，一个 `Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 组件，它们位于 `Nightshade\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过 `package-name::` 语法使用包组件的供应商命名空间：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 将自动检测与此组件链接的类，通过转换组件名称的大写驼峰命名。还支持使用“点”表示法的子目录。

#### 匿名组件

如果您的包包含匿名组件，必须将它们放在包的“视图”目录（如 [`loadViewsFrom` 方法](#views) 所指定）的 `components` 目录中。然后，您可以通过在组件名称前加上包的视图命名空间来渲染它们：

```blade
<x-courier::alert />
```

### "关于" Artisan 命令

Laravel 内置的 `about` Artisan 命令提供了应用程序环境和配置的概览。包可以通过 `AboutCommand` 类将额外信息推送到该命令的输出中。通常，这些信息可以从包服务提供者的 `boot` 方法中添加：

```php
use Illuminate\Foundation\Console\AboutCommand;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    AboutCommand::add('我的包', fn () => ['版本' => '1.0.0']);
}
```

## 命令

要在 Laravel 中注册包的 Artisan 命令，您可以使用 `commands` 方法。此方法期望一个命令类名数组。注册命令后，您可以使用 [Artisan CLI](/docs/11/digging-deeper/artisan) 执行它们：

```php
use Courier\Console\Commands\InstallCommand;
use Courier\Console\Commands\NetworkCommand;

/**
 * 引导任何包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->commands([
            InstallCommand::class,
            NetworkCommand::class,
        ]);
    }
}
```

## 前端公共资源

您的包可能有如 JavaScript、CSS 和图像之类的前端资源。要将这些资源发布到应用程序的 `public` 目录，请使用服务提供者的 `publishes` 方法。在此示例中，我们还将添加一个 `public` 资源组标签，该标签可以用于轻松发布相关资源组：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../public' => public_path('vendor/courier'),
    ], 'public');
}
```

现在，当您的包用户运行 `vendor:publish` 命令时，您的资产将被复制到指定的发布位置。由于用户通常需要每次更新包时覆盖资源，您可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

## 发布文件组

您可能想要分别发布包资产和资源组。例如，您可能希望允许用户发布包的配置文件而不强迫发布包的资产。当从包的服务提供者调用 `publishes` 方法时，您可以通过“标记”它们来实现这一点。例如，让我们在包服务提供者的 `boot` 方法中使用标签为 `courier` 包定义两个发布组（`courier-config` 和 `courier-migrations`）：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/package.php' => config_path('package.php')
    ], 'courier-config');

    $this->publishesMigrations([
        __DIR__.'/../database/migrations/' => database_path('migrations')
    ], 'courier-migrations');
}
```

现在，您的用户可以通过在执行 `vendor:publish` 命令时引用其标签，分别发布这些组：

```shell
php artisan vendor:publish --tag=courier-config
```
