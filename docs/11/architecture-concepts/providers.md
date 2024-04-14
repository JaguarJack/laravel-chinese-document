---
title: Laravel 服务提供者
---

# 服务提供者

- [简介](#introduction)
- [编写服务提供者](#writing-service-providers)
  - [注册方法](#the-register-method)
  - [启动方法](#the-boot-method)
- [注册提供者](#registering-providers)
- [延迟提供者](#deferred-providers)

## 简介

服务提供者是所有 Laravel 应用程序引导的中心地点。您自己的应用程序以及 Laravel 的所有核心服务都通过服务提供者进行引导。

但是，我们所说的“引导”是什么意思？一般来说，我们的意思是**注册**事物，包括注册服务容器绑定、事件监听器、中间件，甚至路由。服务提供者是配置应用程序的中心地点。

Laravel 内部使用数十个服务提供者来引导其核心服务，如邮件发送器、队列、缓存等。其中许多提供者是“延迟”提供者，意味着它们不会在每个请求上加载，而只有在实际需要提供的服务时才加载。

所有用户定义的服务提供者都在 `bootstrap/providers.php` 文件中注册。在接下来的文档中，您将学习如何编写自己的服务提供者并将它们注册到您的 Laravel 应用程序中。

## 编写服务提供者

所有服务提供者都扩展了 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含一个 `register` 方法和一个 `boot` 方法。在 `register` 方法中，您应该**只将事物绑定到[服务容器](/docs/11/architecture-concepts/container)** 中。您永远不应该尝试在 `register` 方法中注册任何事件监听器、路由或任何其他功能。

Artisan CLI 可以通过 `make:provider` 命令生成一个新的提供者：

```shell
php artisan make:provider RiakServiceProvider
```

### 注册方法

如前所述，在 `register` 方法中，您应该只将事物绑定到[服务容器](/docs/11/architecture-concepts/container)。您永远不应该尝试在 `register` 方法中注册任何事件监听器、路由或任何其他功能。否则，您可能会意外地使用一个由尚未加载的服务提供者提供的服务。

让我们看一个基本的服务提供者。在任何服务提供者方法中，您始终可以通过 `$app` 属性访问服务容器：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection(config('riak'));
        });
    }
}
```

这个服务提供者只定义了一个 `register` 方法，并使用该方法在服务容器中定义 `App\Services\Riak\Connection` 的实现。如果您还不熟悉 Laravel 的服务容器，请查看[其文档](/docs/11/architecture-concepts/container)。

### 启动方法

那么，如果我们需要在服务提供者中注册一个[视图组件](/docs/11/basics/views#view-composers)该怎么办？这应该在 `boot` 方法中完成。**这个方法是在所有其他服务提供者注册之后调用的**，这意味着您可以访问框架注册的所有其他服务：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ComposerServiceProvider extends ServiceProvider
{
    /**
     * 启动任何应用服务。
     */
    public function boot(): void
    {
        View::composer('view', function () {
            // ...
        });
    }
}
```

### 启动方法依赖注入

您可以为服务提供者的 `boot` 方法类型提示依赖项。[服务容器](/docs/11/architecture-concepts/container) 将自动注入您需要的任何依赖项：

```php
use Illuminate\Contracts\Routing\ResponseFactory;

/**
 * 启动任何应用服务。
 */
public function boot(ResponseFactory $response): void
{
    $response->macro('serialized', function (mixed $value) {
        // ...
    });
}
```

## 注册提供者

所有服务提供者都在 `bootstrap/providers.php` 配置文件中注册。这个文件返回包含应用程序服务提供者类名的数组：

```php
<?php

// 这个文件是由 Laravel 自动生成的...

return [
    App\Providers\AppServiceProvider::class,
];
```

当您调用 `make:provider` Artisan 命令时，Laravel 将自动将生成的提供者添加到 `bootstrap/providers.php` 文件中。然而，如果您手动创建了提供者类，您应该手动将提供者类添加到数组中：

```php
<?php

// 这个文件是由 Laravel 自动生成的...

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\ComposerServiceProvider::class, // [tl! add]
];
```

## 延迟提供者

如果您的提供者**只**在[服务容器](/docs/11/architecture-concepts/container)中注册绑定，您可以选择在实际需要注册的绑定时再延迟其注册。推迟加载这样的提供者将提高您的应用程序性能，因为它不会在每个请求上从文件系统中加载。

Laravel 编译并存储了由延迟服务提供者提供的所有服务的列表，以及其服务提供者类的名称。然后，只有当您尝试解析这些服务之一时，Laravel 才会加载服务提供者。

为了延迟提供者的加载，实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口并定义一个 `provides` 方法。`provides` 方法应返回提供者注册的服务容器绑定：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider implements DeferrableProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection($app['config']['riak']);
        });
    }

    /**
     * 获取提供者提供的服务。
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [Connection::class];
    }
}
```
