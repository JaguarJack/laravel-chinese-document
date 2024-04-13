# Laravel Pennant

[[toc]]

## 引言

Laravel Pennant 是一个简单轻量的功能标志包 - 没有多余的东西。功能标志让你能够逐步自信地推出新的应用功能，A/B 测试新的界面设计，补充基于主干的开发策略，以及更多。

## 安装

首先，使用 Composer 包管理器将 Pennant 安装到你的项目中：

```shell
composer require laravel/pennant
```

接下来，你应该使用 `vendor:publish` Artisan 命令发布 Pennant 配置和迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

最后，你应该运行你的应用数据库迁移。这将创建一个 `features` 表，Pennant 用它来提供其 `database` 驱动力：

```shell
php artisan migrate
```

## 配置

发布 Pennant 资源后，它的配置文件将位于 `config/pennant.php`。此配置文件允许你指定默认存储机制，Pennant 将用它来存储已解析的功能标志值。

Pennant 支持通过 `array` 驱动器在内存数组中存储已解析的功能标志值。或者，Pennant 可以通过 `database` 驱动器在关系型数据库中持久存储已解析的功能标志值，这是 Pennant 默认使用的存储机制。

## 定义功能

要定义一个功能，你可以使用 `Feature` facade 提供的 `define` 方法。你需要为功能提供一个名称，以及一个将被调用以解析功能初始值的闭包。

通常，在服务提供者中使用 `Feature` facade 来定义功能。闭包将接收功能检查的"作用域"。最常见的，作用域是当前认证的用户。在这个例子中，我们将为逐步推出新 API 的应用程序用户定义一个功能：

```php
<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Lottery;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::define('new-api', fn (User $user) => match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        });
    }
}
```

如你所见，我们为我们的功能定义了以下规则：

- 所有内部团队成员应该使用新 API。
- 任何高流量客户不应使用新 API。
- 否则，功能应该有 1/100 的机会随机分配给用户，并激活。

对于给定用户首次检查 `new-api` 功能时，闭包的结果将由存储驱动器存储。下次针对同一用户检查该功能时，值将从存储中检索，并且不会调用闭包。

为方便起见，如果功能定义只返回一个彩票，你可以完全省略闭包：

```php
Feature::define('site-redesign', Lottery::odds(1, 1000));
```

### 基于类的功能

Pennant 还允许你定义基于类的功能。与基于闭包的功能定义不同，不需要在服务提供者中注册基于类的功能。要创建一个基于类的功能，你可以调用 `pennant:feature` Artisan 命令。默认情况下，功能类将放置在你的应用程序的 `app/Features` 目录中：

```shell
php artisan pennant:feature NewApi
```

编写功能类时，你只需要定义一个 `resolve` 方法，它将被调用以解析给定作用域的功能初始值。同样，作用域通常是当前认证的用户：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * Resolve the feature's initial value.
     */
    public function resolve(User $user): mixed
    {
        return match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        };
    }
}
```

 > [!Note]功能类通过 [容器](/docs/11/architecture-concepts/container) 解析，因此你可以根据需要将依赖项注入到功能类的构造函数中。

#### 自定义存储的功能名称

默认情况下，Pennant 将存储功能类的完全限定类名。如果你想将存储的功能名称与应用程序的内部结构解耦，你可以在功能类上指定一个 `$name` 属性。此属性的值将替换类名存储：

```php
<?php

namespace App\Features;

class NewApi
{
    /**
     * The stored name of the feature.
     *
     * @var string
     */
    public $name = 'new-api';

    // ...
}
```

## 检查功能

要确定功能是否处于活动状态，你可以使用 `Feature` facade 上的 `active` 方法。默认情况下，功能会针对当前认证的用户进行检查：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Feature::active('new-api')
                ? $this->resolveNewApiResponse($request)
                : $this->resolveLegacyApiResponse($request);
    }

    // ...
}
```

尽管功能默认是针对当前认证的用户进行检查的，你可以轻松地针对另一个用户或[作用域](#scope)检查功能。要实现这一点，请使用 `Feature` facade 提供的 `for` 方法：

```php
return Feature::for($user)->active('new-api')
        ? $this->resolveNewApiResponse($request)
        : $this->resolveLegacyApiResponse($request);
```

Pennant 还提供了一些额外的便利方法，当确定功能是否处于活动状态时可能会有所帮助：

```php
// 确定所有给定的功能是否处于活动状态...
Feature::allAreActive(['new-api', 'site-redesign']);

// 确定任何给定的功能是否处于活动状态...
Feature::someAreActive(['new-api', 'site-redesign']);

// 确定一个功能是否处于非活动状态...
Feature::inactive('new-api');

// 确定所有给定的功能是否处于非活动状态...
Feature::allAreInactive(['new-api', 'site-redesign']);

// 确定任何给定的功能是否处于非活动状态...
Feature::someAreInactive(['new-api', 'site-redesign']);
```

> [!NOTE]  
> 当在 HTTP 上下文之外使用 Pennant，如在 Artisan 命令或排队的 job 中时，你通常应该[明确指定功能的作用域](#specifying-the-scope)。或者，你可以定义一个[默认作用域](#default-scope)，它涵盖了经过认证的 HTTP 上下文和未认证的上下文。

#### 检查基于类的功能

对于基于类的功能，你应该在检查功能时提供类名：

```php
<?php

namespace App\Http\Controllers;

use App\Features\NewApi;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Feature::active(NewApi::class)
                ? $this->resolveNewApiResponse($request)
                : $this->resolveLegacyApiResponse($request);
    }

    // ...
}
```

### 条件执行

`when` 方法可用于流畅地执行一个给定的闭包，如果功能处于活动状态。此外，可以提供第二个闭包，如果功能不活跃时将被执行：

```php
<?php

namespace App\Http\Controllers;

use App\Features\NewApi;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Feature::when(NewApi::class,
            fn () => $this->resolveNewApiResponse($request),
            fn () => $this->resolveLegacyApiResponse($request),
        );
    }

    // ...
}
```

`unless` 方法作为 `when` 方法的逆函数，如果功能不活跃时执行第一个闭包：

```php
return Feature::unless(NewApi::class,
    fn () => $this->resolveLegacyApiResponse($request),
    fn () => $this->resolveNewApiResponse($request),
);
```

### `HasFeatures` Trait

Pennant 的 `HasFeatures` trait 可以添加到你的应用程序的 `User` 模型（或任何其他具有功能的模型）中，以提供一种流畅、方便的方式，直接从模型检查功能：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Pennant\Concerns\HasFeatures;

class User extends Authenticatable
{
    use HasFeatures;

    // ...
}
```

一旦将 trait 添加到你的模型中，你可以通过调用 `features` 方法轻松检查功能：

```php
if ($user->features()->active('new-api')) {
    // ...
}
```

当然，`features` 方法提供了很多其他便利的方法来进行功能交互：

```php
// Values...
$value = $user->features()->value('purchase-button')
$values = $user->features()->values(['new-api', 'purchase-button']);

// State...
$user->features()->active('new-api');
$user->features()->allAreActive(['new-api', 'server-api']);
$user->features()->someAreActive(['new-api', 'server-api']);

$user->features()->inactive('new-api');
$user->features()->allAreInactive(['new-api', 'server-api']);
$user->features()->someAreInactive(['new-api', 'server-api']);

// Conditional execution...
$user->features()->when('new-api',
    fn () => /* ... */,
    fn () => /* ... */,
);

$user->features()->unless('new-api',
    fn () => /* ... */,
    fn () => /* ... */,
);
```

### Blade 指令

为了在 Blade 中无缝检查功能，Pennant 提供了一个 `@feature` 指令：

```blade
@feature('site-redesign')
    <!-- 'site-redesign' 是活动的 -->
@else
    <!-- 'site-redesign' 是非活动的 -->
@endfeature
```

### 中间件

Pennant 还包括一个[中间件](/docs/11/basics/middleware)，可用于在路由被调用之前验证当前认证用户是否有权访问功能。你可以将中间件分配给路由，并指定需要访问路由的功能。如果指定的任何功能对当前认证用户不活跃，路由将返回 `400 Bad Request` HTTP 响应。多个功能可以传递给静态 `using` 方法。

```php
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/api/servers', function () {
    // ...
})->middleware(EnsureFeaturesAreActive::using('new-api', 'servers-api'));
```

#### 自定义响应

如果你想要自定义中间件返回的响应，当列出的某个功能不活跃时，你可以使用 `EnsureFeaturesAreActive` 中间件提供的 `whenInactive` 方法。通常，此方法应在应用程序的服务提供者之一的 `boot` 方法中调用：

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    EnsureFeaturesAreActive::whenInactive(
        function (Request $request, array $features) {
            return new Response(status: 403);
        }
    );

    // ...
}
```

### 内存中的缓存

当检查一个功能时，Pennant 将创建一个内存中的结果缓存。如果你正在使用 `database` 驱动，这意味着在单个请求中重新检查相同的功能标志将不会触发额外的数据库查询。这也确保了该功能在请求持续期间具有一致的结果。

如果你需要手动清除内存中的缓存，你可以使用 `Feature` facade 提供的 `flushCache` 方法：

```php
Feature::flushCache();
```

## 作用域

### 指定作用域

如前所述，功能通常是针对当前认证的用户检查的。然而，这可能并不总是适合你的需求。因此，有可能通过 `Feature` facade 的 `for` 方法指定你想要检查给定功能的作用域：

```php
return Feature::for($user)->active('new-api')
        ? $this->resolveNewApiResponse($request)
        : $this->resolveLegacyApiResponse($request);
```

当然，功能作用域不限于“用户”。假设你已经构建了一个新的计费体验，并且正在向整个团队推出，而不是个别用户。也许你希望最老的团队比较新的团队有更慢的推出速度。你的功能解析闭包可能看起来像这样：

```php
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Support\Lottery;
use Laravel\Pennant\Feature;

Feature::define('billing-v2', function (Team $team) {
    if ($team->created_at->isAfter(new Carbon('1st Jan, 2023'))) {
        return true;
    }

    if ($team->created_at->isAfter(new Carbon('1st Jan, 2019'))) {
        return Lottery::odds(1 / 100);
    }

    return Lottery::odds(1 / 1000);
});
```

你会注意到我们定义的闭包不是期望一个 `User`，而是期望一个 `Team` 模型。要确定这个功能对用户的团队是否活跃，你应该将团队传递给 `Feature` facade 提供的 `for` 方法：

```php
if (Feature::for($user->team)->active('billing-v2')) {
    return redirect()->to('/billing/v2');
}

// ...
```

### 默认作用域

也可以自定义 Pennant 用来检查功能的默认作用域。例如，也许你所有的功能都是根据当前认证用户的团队来检查的，而不是用户。你不必每次检查一个功能时都调用 `Feature::for($user->team)`，而是可以指定团队作为默认作用域。通常，这应该在应用程序的服务提供者之一中完成：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::resolveScopeUsing(fn ($driver) => Auth::user()?->team);

        // ...
    }
}
```

如果没有通过 `for` 方法显式提供作用域，功能检查现在将使用当前认证用户的团队作为默认作用域：

```php
Feature::active('billing-v2');

// 现在等同于...

Feature::for($user->team)->active('billing-v2');
```

### 可空的作用域

如果在检查功能时提供的作用域为 `null`，并且功能的定义不支持通过一个可空类型或通过在联合类型中包括 `null` 来支持 `null`，Pennant 将自动返回 `false` 作为功能的结果值。

因此，如果你传递给功能的作用域可能是 `null`，并且你希望调用功能的值解析器，则应该在功能的定义中考虑到这一点。如果你在 Artisan 命令、排队的 job 或未经认证的路由中检查一个功能，可能会出现 `null` 作用域。由于在这些上下文中通常没有认证的用户，所以默认的作用域将是 `null`。

如果你不总是[明确指定你的功能作用域](#指定作用域)，那么你应该确保作用域的类型是“可空的”并且在你的功能定义逻辑中处理 `null` 作用域值：

```php
use App\Models\User;
use Illuminate\Support\Lottery;
use Laravel\Pennant\Feature;

Feature::define('new-api', fn (User|null $user) => match (true) {
    $user === null => true,
    $user->isInternalTeamMember() => true,
    $user->isHighTrafficCustomer() => false,
    default => Lottery::odds(1 / 100),
});
```

### 确定作用域

Pennant 的内置 `array` 和 `database` 存储驱动知道如何为所有 PHP 数据类型以及 Eloquent 模型正确存储作用域标识符。然而，如果你的应用程序使用了第三方 Pennant 驱动，那么该驱动可能不知道如何为 Eloquent 模型或应用程序中的其他自定义类型正确存储标识符。

鉴于此，Pennant 允许你通过在应用程序中用作 Pennant 作用域的对象上实现 `FeatureScopeable` 契约来格式化存储的作用域值。

例如，假设你在单个应用程序中使用两个不同的功能驱动：内置的 `database` 驱动和第三方的 "Flag Rocket" 驱动。"Flag Rocket" 驱动不知道如何正确存储 Eloquent 模型。相反，它需要一个 `FlagRocketUser` 实例。通过实现 `FeatureScopeable` 契约定义的 `toFeatureIdentifier`，我们可以自定义为应用程序使用的每个驱动提供的可存储的作用域值：

```php
<?php

namespace App\Models;

use FlagRocket\FlagRocketUser;
use Illuminate\Database\Eloquent\Model;
use Laravel\Pennant\Contracts\FeatureScopeable;

class User extends Model implements FeatureScopeable
{
    /**
     * Cast the object to a feature scope identifier for the given driver.
     */
    public function toFeatureIdentifier(string $driver): mixed
    {
        return match($driver) {
            'database' => $this,
            'flag-rocket' => FlagRocketUser::fromId($this->flag_rocket_id),
        };
    }
}
```

### 序列化作用域

默认情况下，Pennant 将使用完整限定的类名来存储与 Eloquent 模型关联的功能。如果你已经在服务提供者中定义了 [Eloquent 变形图](/docs/11/eloquent/eloquent-relationships#custom-polymorphic-types)，你可能会选择让 Pennant 也使用变形图来解耦存储的功能和你的应用程序结构。

为了实现这一点，在定义 Eloquent 变形图之后，你可以调用 `Feature` facade 的 `useMorphMap` 方法：

```php
use Illuminate\Database\Eloquent\Relations\Relation;
use Laravel\Pennant\Feature;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);

Feature::useMorphMap();
```

## 丰富的功能值

到目前为止，我们主要展示的功能是处于二元状态，意思是它们要么“活动”，要么“不活动”，但 Pennant 也允许你存储丰富的值。

例如，想象你正在为应用程序的“立即购买”按钮测试三种新的颜色。代替从功能定义返回 `true` 或 `false`，你可以返回一个字符串：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn (User $user) => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

你可以使用 `value` 方法检索 `purchase-button` 功能的值：

```php
$color = Feature::value('purchase-button');
```

Pennant 包含的 Blade 指令也使根据功能当前值有条件地渲染内容变得容易：

```blade
@feature('purchase-button', 'blue-sapphire')
    <!-- 'blue-sapphire' 是活动的 -->
@elsefeature('purchase-button', 'seafoam-green')
    <!-- 'seafoam-green' 是活动的 -->
@elsefeature('purchase-button', 'tart-orange')
    <!-- 'tart-orange' 是活动的 -->
@endfeature
```

 > [!Note]使用丰富值时，重要的是要知道，当功能具有任何非 `false` 的值时，就被认为是“活动”的。

当调用[有条件的 `when`](#条件执行) 方法时，功能的丰富值将提供给第一个闭包：

```php
Feature::when('purchase-button',
        fn ($color) => /* ... */,
        fn () => /* ... */,
    );
```

同样地，在调用条件性的 `unless` 方法时，如果提供了第二个可选闭包，则会将特性的丰富值提供给该闭包：

```php
Feature::unless('purchase-button',
    fn () => /* ... */,
    fn ($color) => /* ... */,
);
```

## 检索多个特性

`values` 方法允许为给定的作用域检索多个特性：

```php
Feature::values(['billing-v2', 'purchase-button']);

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
// ]
```

或者，您可以使用 `all` 方法来检索给定作用域中所有定义特性的值：

```php
Feature::all();

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

然而，基于类的特性是动态注册的，Pennant 在它们被明确检查之前不知道它们。这意味着，如果在当前请求期间尚未检查您应用程序的基于类的特性，那么它们可能不会出现在 `all` 方法返回的结果中。

如果您想要确保在使用 `all` 方法时总是包含特性类，您可以使用 Pennant 的特性发现功能。要开始使用，在您应用程序的一个服务提供者中调用 `discover` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        Feature::discover();

        // ...
    }
}
```

`discover` 方法将注册您应用程序 `app/Features` 目录中的所有特性类。现在，不管它们在当前请求期间是否已经被检查过，`all` 方法现在都会在其结果中包含这些类：

```php
Feature::all();

// [
//     'App\Features\NewApi' => true,
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

## 预加载

尽管 Pennant 在单个请求中保留了所有已解析特性的内存缓存，但仍然可能遇到性能问题。为了缓解这种情况，Pennant 提供了预加载特性值的能力。

为了说明这一点，假设我们在循环中检查一个特性是否处于激活状态：

```php
use Laravel\Pennant\Feature;

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

假设我们使用的是数据库驱动程序，这段代码将为循环中的每个用户执行一个数据库查询——执行潜在上百个查询。然而，使用 Pennant 的 `load` 方法，我们可以通过预加载用户集合或作用域的特性值来消除这个潜在的性能瓶颈：

```php
Feature::for($users)->load(['notifications-beta']);

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

要在尚未加载的情况下加载特性值，可以使用 `loadMissing` 方法：

```php
Feature::for($users)->loadMissing([
    'new-api',
    'purchase-button',
    'notifications-beta',
]);
```

## 更新值

当一个特性的值首次被解析时，底层驱动程序会将结果存储起来。这往往是必要的，以确保您的用户跨请求的一致体验。然而，有时，您可能想要手动更新存储的特性值。

为了达到这个目的，您可以使用 `activate` 和 `deactivate` 方法来切换特性的 "on" 或 "off" 状态：

```php
use Laravel\Pennant\Feature;

// 为默认作用域激活特性...
Feature::activate('new-api');

// 为给定作用域停用特性...
Feature::for($user->team)->deactivate('billing-v2');
```

通过向 `activate` 方法提供第二个参数，也可以手动设置特性的丰富值：

```php
Feature::activate('purchase-button', 'seafoam-green');
```

要指导 Pennant 忘记特性的存储值，可以使用 `forget` 方法。当再次检查该特性时，Pennant 将从其特性定义中解析该特性的值：

```php
Feature::forget('purchase-button');
```

### 批量更新

要批量更新存储的特性值，您可以使用 `activateForEveryone` 和 `deactivateForEveryone` 方法。

例如，假设您对 `new-api` 特性的稳定性很有信心，并且已经确定了结账流程中 `purchase-button` 的最佳颜色，您可以相应地为所有用户更新存储值：

```php
use Laravel\Pennant\Feature;

Feature::activateForEveryone('new-api');

Feature::activateForEveryone('purchase-button', 'seafoam-green');
```

或者，您可以停用所有用户的特性：

```php
Feature::deactivateForEveryone('new-api');
```

> [!NOTE] 这只会更新 Pennant 的存储驱动程序已存储的已解析特性值。您还需要更新应用程序中的特性定义。

### 清除特性

有时，从存储中清除整个特性是很有用的。如果您已从应用程序中移除该特性，或者您已对特性的定义进行了调整，您希望对所有用户进行推出，这通常是必要的。

您可以使用 `purge` 方法移除存储中的所有特性值：

```php
// 清除单个特性...
Feature::purge('new-api');

// 清除多个特性...
Feature::purge(['new-api', 'purchase-button']);
```

如果您想要清除存储中的 _所有_ 特性，可以不带任何参数调用 `purge` 方法：

```php
Feature::purge();
```

由于在应用程序的部署管道中清除特性可能很有用，Pennant 包括了一个 `pennant:purge` Artisan 命令，它会从存储中清除提供的特性：

```sh
php artisan pennant:purge new-api

php artisan pennant:purge new-api purchase-button
```

也有可能清除所有特性，_除了_ 给定特性列表中的特性。例如，假设您想要清除所有特性，但保留 "new-api" 和 "purchase-button" 特性的值在存储中。为此，您可以将这些特性名称传递给 `--except` 选项：

```sh
php artisan pennant:purge --except=new-api --except=purchase-button
```

为方便起见，`pennant:purge` 命令也支持一个 `--except-registered` 标志。这个标志表示应清除所有特性，除了那些在服务提供者中明确注册的特性：

```sh
php artisan pennant:purge --except-registered
```

## 测试

在测试涉及特性标志的代码时，控制测试中特性标志返回的值的最简单方法是简单地重新定义特性。例如，想象您在应用程序的一个服务提供者中定义了以下特性：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn () => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

要在测试中修改特性的返回值，您可以在测试开始时重新定义特性。以下测试总是会通过，尽管服务提供者中仍存在 `Arr::random()` 实现：

```php tab=Pest
use Laravel\Pennant\Feature;

test('it can control feature values', function () {
    Feature::define('purchase-button', 'seafoam-green');

    expect(Feature::value('purchase-button'))->toBe('seafoam-green');
});
```

```php tab=PHPUnit
use Laravel\Pennant\Feature;

public function test_it_can_control_feature_values()
{
    Feature::define('purchase-button', 'seafoam-green');

    $this->assertSame('seafoam-green', Feature::value('purchase-button'));
}
```

类似的方法可用于基于类的特性：

```php tab=Pest
use Laravel\Pennant\Feature;

test('it can control feature values', function () {
    Feature::define(NewApi::class, true);

    expect(Feature::value(NewApi::class))->toBeTrue();
});
```

```php tab=PHPUnit
use App\Features\NewApi;
use Laravel\Pennant\Feature;

public function test_it_can_control_feature_values()
{
    Feature::define(NewApi::class, true);

    $this->assertTrue(Feature::value(NewApi::class));
}
```

如果您的特性返回的是一个 `Lottery` 实例，那么有一些有用的[测试助手可用](/docs/11/digging-deeper/helpers#testing-lotteries)。

#### 配置存储

您可以在应用程序的 `phpunit.xml` 文件中定义 `PENNANT_STORE` 环境变量，以配置 Pennant 在测试期间将使用的存储：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit colors="true">
    <!-- ... -->
    <php>
        <env name="PENNANT_STORE" value="array"/>
        <!-- ... -->
    </php>
</phpunit>
```

## 添加自定义 Pennant 驱动程序

#### 实现驱动程序

如果 Pennant 现有的存储驱动程序不符合您应用程序的需求，您可以编写自己的存储驱动程序。您的自定义驱动程序应该实现 `Laravel\Pennant\Contracts\Driver` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;

class RedisFeatureDriver implements Driver
{
    public function define(string $feature, callable $resolver): void {}
    public function defined(): array {}
    public function getAll(array $features): array {}
    public function get(string $feature, mixed $scope): mixed {}
    public function set(string $feature, mixed $scope, mixed $value): void {}
    public function setForAllScopes(string $feature, mixed $value): void {}
    public function delete(string $feature, mixed $scope): void {}
    public function purge(array|null $features): void {}
}
```

现在，我们只需要使用 Redis 连接来实现这些方法。想要了解如何实现这些方法的示例，可以查看 [Pennant 源代码](https://github.com/laravel/pennant/blob/1.x/src/Drivers/DatabaseDriver.php)中的 `Laravel\Pennant\Drivers\DatabaseDriver`。

> [!NOTE]  
> Laravel 没有附带用于包含您扩展的目录。您可以随意选择放置它们的位置。在此示例中，我们创建了一个 `Extensions` 目录来存放 `RedisFeatureDriver`。

#### 注册驱动程序

一旦实现了您的驱动程序，您就可以注册它到 Laravel 了。要向 Pennant 添加额外的驱动程序，您可以使用 `Feature` facade 提供的 `extend` 方法。您应该在应用程序的[服务提供者](/docs/11/architecture-concepts/providers)之一的 `boot` 方法中调用 `extend` 方法：

```php
<?php

namespace App\Providers;

use App\Extensions\RedisFeatureDriver;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        Feature::extend('redis', function (Application $app) {
            return new RedisFeatureDriver($app->make('redis'), $app->make('events'), []);
        });
    }
}
```

注册驱动程序后，您可以在应用程序的 `config/pennant.php` 配置文件中使用 `redis` 驱动程序：

```php
'stores' => [

    'redis' => [
        'driver' => 'redis',
        'connection' => null,
    ],

    // ...

],
```

## 事件

Pennant 分派了多种事件，这些事件在应用程序中跟踪特性标志时非常有用。

### `Laravel\Pennant\Events\FeatureRetrieved`

每次[检查特性](#checking-features)时，都会分派此事件。此事件在创建和跟踪应用程序中特性标志使用情况的指标时可能很有用。

### `Laravel\Pennant\Events\FeatureResolved`

特定作用域下首次解析特性的值时，将分派此事件。

### `Laravel\Pennant\Events\UnknownFeatureResolved`

首次为特定作用域解析未知特性时，将分派此事件。如果您打算移除一个特性标志，但在应用程序中意外留下了对它的零散引用，监听此事件可能有用：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnknownFeatureResolved;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        Event::listen(function (UnknownFeatureResolved $event) {
            Log::error("Resolving unknown feature [{$event->feature}].");
        });
    }
}
```

### `Laravel\Pennant\Events\DynamicallyRegisteringFeatureClass`

当[基于类的特性](#class-based-features)在请求期间首次被动态检查时，将分派此事件。

### `Laravel\Pennant\Events\UnexpectedNullScopeEncountered`

当将 `null` 作用域传递给不支持[可为 null 的作用域](#nullable-scope)的特性定义时，将分派此事件。

这种情况将被优雅地处理，并且特性将返回 `false`。然而，如果您想退出这个特性的默认优雅行为，可以在您的应用程序 `AppServiceProvider` 的 `boot` 方法中为此事件注册一个监听器：

```php
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnexpectedNullScopeEncountered;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    Event::listen(UnexpectedNullScopeEncountered::class, fn () => abort(500));
}
```

### `Laravel\Pennant\Events\FeatureUpdated`

在为作用域更新特性时，通常会分派此事件，通常是通过调用 `activate` 或 `deactivate`。

### `Laravel\Pennant\Events\FeatureUpdatedForAllScopes`

在为所有作用域更新特性时，通常会分派此事件，通常是通过调用 `activateForEveryone` 或 `deactivateForEveryone`。

### `Laravel\Pennant\Events\FeatureDeleted`

在为作用域删除特性时，通常会分派此事件，通常是通过调用 `forget`。

### `Laravel\Pennant\Events\FeaturesPurged`

当清除特定特性时，将分派此事件。

### `Laravel\Pennant\Events\AllFeaturesPurged`

当清除所有特性时，将分派此事件。
