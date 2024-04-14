---
title: Laravel 服务容器
---

# 服务容器

[[toc]]

## 简介

Laravel 服务容器是管理类依赖和执行依赖注入的强大工具。依赖注入是一个花哨的术语，本质上意味着：类依赖通过构造函数或在某些情况下通过“setter”方法“注入”到类中。

让我们看一个简单的例子：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Repositories\UserRepository;
use App\Models\User;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 创建一个新的控制器实例。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}

    /**
     * 显示给定用户的个人资料。
     */
    public function show(string $id): View
    {
        $user = $this->users->find($id);

        return view('user.profile', ['user' => $user]);
    }
}
```

在这个例子中，`UserController` 需要从数据源检索用户。因此，我们将**注入**能够检索用户的服务。在这个上下文中，我们的 `UserRepository` 很可能使用 [Eloquent](/docs/11/eloquent/eloquent) 从数据库检索用户信息。然而，由于存储库是注入的，我们可以轻松地将其替换为另一个实现。当测试我们的应用程序时，我们也可以轻松地“模拟”或创建 `UserRepository` 的虚拟实现。

深入了解 Laravel 服务容器对于构建强大的大型应用程序以及为 Laravel 核心本身做出贡献至关重要。

### 零配置解析

如果一个类没有依赖或只依赖于其他具体类（而非接口），容器不需要被指导如何解析该类。例如，您可以在 `routes/web.php` 文件中放置以下代码：

```php
<?php

class Service
{
    // ...
}

Route::get('/', function (Service $service) {
    die($service::class);
});
```

在这个例子中，访问应用程序的 `/` 路由将自动解析 `Service` 类并将其注入到路由的处理程序中。这是改变游戏规则的。这意味着您可以在不担心臃肿配置文件的情况下开发应用程序并利用依赖注入。

幸运的是，当构建 Laravel 应用程序时，许多您将编写的类会自动通过容器接收它们的依赖，包括[控制器](/docs/11/basics/controllers)、[事件监听器](/docs/11/digging-deeper/events)、[中间件](/docs/11/basics/middleware)等。此外，您可以在[队列作业](/docs/11/digging-deeper/queues)的 `handle` 方法中类型提示依赖。一旦您体验到自动和零配置依赖注入的力量，就感觉没有它无法开发。

### 何时使用容器

由于零配置解析，您经常可以在路由、控制器、事件监听器和其他地方类型提示依赖，而无需手动与容器交互。例如，您可能会在路由定义上类型提示 `Illuminate\Http\Request` 对象，以便轻松访问当前请求。尽管我们从不需要与容器交互来编写这段代码，但它在幕后管理这些依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在许多情况下，由于自动依赖注入和[门面](/docs/11/architecture-concepts/facades)，您可以在**从未**手动绑定或从容器解析任何东西的情况下构建 Laravel 应用程序。**那么，您什么时候会手动与容器交互呢？** 让我们看看两种情况。

首先，如果您编写了一个实现接口的类，并且希望在路由或类构造函数中类型提示该接口，您必须[告诉容器如何解析该接口](#binding-interfaces-to-implementations)。其次，如果您[编写 Laravel 包](/docs/11/digging-deeper/packages)并计划与其他 Laravel 开发者共享，您可能需要将包的服务绑定到容器中。

## 绑定

### 绑定基础

#### 简单绑定

几乎所有的服务容器绑定都将在[服务提供者](/docs/11/architecture-concepts/providers)中注册，因此这些示例大多将展示在该上下文中使用容器。

在服务提供者中，您总是可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法注册一个绑定，传递我们希望注册的类或接口名称以及返回类实例的闭包：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

请注意，我们接收到容器本身作为解析器的参数。然后我们可以使用容器来解析我们正在构建的对象的子依赖。

如前所述，您通常会在服务提供者中与容器交互；然而，如果您希望在服务提供者之外的代码位置与容器交互，您可以通过 `App` [门面](/docs/11/architecture-concepts/facades)进行：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function (Application $app) {
    // ...
});
```

如果您希望仅在给定类型尚未注册绑定时注册容器绑定，您可以使用 `bindIf` 方法：

```php
$this->app->bindIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

> [!NOTE]
> 如果它们不依赖于任何接口，就没有必要将类绑定到容器中。容器不需要被指导如何构建这些对象，因为它可以使用反射自动解析这些对象。

#### 绑定单例

`singleton` 方法绑定一个类或接口到容器中，该类或接口只应该被解析一次。一旦单例绑定被解析，后续对容器的调用将返回相同的对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->singleton(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

如果您希望仅在给定类型尚未注册绑定时注册单例容器绑定，您可以使用 `singletonIf` 方法：

```php
$this->app->singletonIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

#### 绑定实例

您还可以使用 `instance` 方法将现有对象实例绑定到容器中。给定的实例将在后续对容器的调用中始终返回：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

### 将接口绑定到实现

服务容器的一个非常强大的特性是其能够将接口绑定到给定的实现。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。一旦我们编写了这个接口的 `RedisEventPusher` 实现，我们可以这样将它注册到服务容器中：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

这个语句告诉容器，当一个类需要 `EventPusher` 的实现时，它应该注入 `RedisEventPusher`。现在我们可以在需要 `EventPusher` 实现的类的构造函数中类型提示 `EventPusher` 接口。记住，控制器、事件监听器、中间件和 Laravel 应用程序中的各种其他类型的类总是通过容器解析的：

```php
use App\Contracts\EventPusher;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected EventPusher $pusher
) {}
```

### 上下文绑定

有时您可能有两个类使用相同的接口，但您希望向每个类注入不同的实现。例如，两个控制器可能依赖于 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/docs/11/digging-deeper/contracts) 的不同实现。Laravel 提供了一个简单、流畅的接口来定义这种行为：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\VideoController;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

$this->app->when(PhotoController::class)
          ->needs(Filesystem::class)
          ->give(function () {
              return Storage::disk('local');
          });

$this->app->when([VideoController::class, UploadController::class])
          ->needs(Filesystem::class)
          ->give(function () {
              return Storage::disk('s3');
          });
```

### 绑定基本类型

有时您可能有一个类接收一些注入的类，但也需要注入一个基本值，如一个整数。您可以轻松地使用上下文绑定为您的类注入它可能需要的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
          ->needs('$variableName')
          ->give($value);
```

有时一个类可能依赖于一组[标记](#tagging)的实例数组。使用 `giveTagged` 方法，您可以轻松地注入该标记的所有容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$reports')
    ->giveTagged('reports');
```

如果您需要从应用程序的配置文件中注入一个值，您可以使用 `giveConfig` 方法：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$timezone')
    ->giveConfig('app.timezone');
```

### 绑定类型化可变参数

有时，您可能有一个类接收一个类型化对象数组作为可变构造函数参数：

```php
<?php

use App\Models\Filter;
use App\Services\Logger;

class Firewall
{
    /**
     * 过滤器实例数组。
     *
     * @var array
     */
    protected $filters;

    /**
     * 创建一个新的类实例。
     */
    public function __construct(
        protected Logger $logger,
        Filter ...$filters,
    ) {
        $this->filters = $filters;
    }
}
```

使用上下文绑定，您可以通过提供一个返回解析的 `Filter` 实例数组的闭包来解析此依赖：

```php
$this->app->when(Firewall::class)
          ->needs(Filter::class)
          ->give(function (Application $app) {
                return [
                    $app->make(NullFilter::class),
                    $app->make(ProfanityFilter::class),
                    $app->make(TooLongFilter::class),
                ];
          });
```

为了方便起见，您还可以直接提供一个类名数组，以便在 `Firewall` 需要 `Filter` 实例时由容器解析：

```php
$this->app->when(Firewall::class)
          ->needs(Filter::class)
          ->give([
              NullFilter::class,
              ProfanityFilter::class,
              TooLongFilter::class,
          ]);
```

### 标记

有时您可能需要解析某个“类别”的所有绑定。例如，您可能正在构建一个报告分析器，它接收许多不同的 `Report` 接口实现的数组。在注册 `Report` 实现后，您可以使用 `tag` 方法为它们分配一个标记：

```php
$this->app->bind(CpuReport::class, function () {
    // ...
});

$this->app->bind(MemoryReport::class, function () {
    // ...
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

一旦服务被标记，您可以通过容器的 `tagged` 方法轻松地解析它们所有：

```php
$this->app->bind(ReportAnalyzer::class, function (Application $app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

### 扩展绑定

`extend` 方法允许修改解析的服务。例如，当服务被解析时，您可以运行额外的代码来装饰或配置服务。`extend` 方法接受两个参数，您要扩展的服务类和应该返回修改后的服务的闭包。闭包接收正在解析的服务和容器实例：

```php
$this->app->extend(Service::class, function (Service $service, Application $app) {
    return new DecoratedService($service);
});
```

## 解析

### `make` 方法

您可以使用 `make` 方法从容器中解析一个类实例。`make` 方法接受您希望解析的类或接口的名称：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果您的类的一些依赖项无法通过容器解析，您可以将它们作为关联数组传递给 `makeWith` 方法。例如，我们可以手动传递 `Transistor` 服务所需的 `$id` 构造函数参数：

```php
use App\Services\Transistor;

$transistor = $this->app->makeWith(Transistor::class, ['id' => 1]);
```

`bound` 方法可用于确定是否已在容器中显式绑定了类或接口：

```php
if ($this->app->bound(Transistor::class)) {
    // ...
}
```

如果您在服务提供者之外的代码位置没有访问 `$app` 变量，您可以使用 `App` [门面](/docs/11/architecture-concepts/facades) 或 `app` [助手](/docs/11/packages/reverb#method-app) 从容器中解析类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果您希望在容器解析的类中注入 Laravel 容器实例本身，您可以在类的构造函数上类型提示 `Illuminate\Container\Container` 类：

```php
use Illuminate\Container\Container;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected Container $container
) {}
```

### 自动注入

或者，您可以在容器解析的类的构造函数中类型提示依赖，包括[控制器](/docs/11/basics/controllers)、[事件监听器](/docs/11/digging-deeper/events)、[中间件](/docs/11/basics/middleware) 等。此外，您还可以在 [队列作业](/docs/11/digging-deeper/queues) 的 `handle` 方法中类型提示依赖。实际上，这是大多数情况下您的对象应该被容器解析的方式。

例如，您可能在控制器的构造函数中类型提示您的应用程序定义的存储库。存储库将自动被解析并注入到类中：

```php
<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;
use App\Models\User;

class UserController extends Controller
{
    /**
     * 创建一个新的控制器实例。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}

    /**
     * 显示具有给定 ID 的用户。
     */
    public function show(string $id): User
    {
        $user = $this->users->findOrFail($id);

        return $user;
    }
}
```

## 方法调用和注入

有时，您可能希望在对象实例上调用方法，同时允许容器自动注入该方法的依赖项。例如，考虑以下类：

```php
<?php

namespace App;

use App\Repositories\UserRepository;

class UserReport
{
    /**
     * 生成一个新的用户报告。
     */
    public function generate(UserRepository $repository): array
    {
        return [
            // ...
        ];
    }
}
```

您可以通过容器调用 `generate` 方法，如下所示：

```php
use App\UserReport;
use Illuminate\Support\Facades\App;

$report = App::call([new UserReport, 'generate']);
```

`call` 方法接受任何 PHP 可调用类型。容器的 `call` 方法甚至可以用来调用闭包，同时自动注入其依赖项：

```php
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\App;

$result = App::call(function (UserRepository $repository) {
    // ...
});
```

## 容器事件

服务容器在解析对象时会触发事件。您可以使用 `resolving` 方法监听此事件：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;

$this->app->resolving(Transistor::class, function (Transistor $transistor, Application $app) {
    // 当容器解析类型为 "Transistor" 的对象时被调用...
});

$this->app->resolving(function (mixed $object, Application $app) {
    // 当容器解析任何类型的对象时被调用...
});
```

如您所见，被解析的对象将被传递给回调，允许您在对象被其消费者使用之前设置任何额外的属性。

## PSR-11

Laravel 的服务容器实现了 [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md) 接口。因此，您可以类型提示 PSR-11 容器接口以获取 Laravel 容器的实例：

```php
use App\Services\Transistor;
use Psr\Container\ContainerInterface;

Route::get('/', function (ContainerInterface $container) {
    $service = $container->get(Transistor::class);

    // ...
});
```

如果给定的标识符无法解析，将抛出异常。如果标识符从未绑定，则异常将是 `Psr\Container\NotFoundExceptionInterface` 的实例。如果标识符已绑定但无法解析，则将抛出 `Psr\Container\ContainerExceptionInterface` 的实例。
