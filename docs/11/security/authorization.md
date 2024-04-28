---
title: Laravel 授权
---

# 授权

[[toc]]

## 介绍

除了内置的[认证](/docs/11/security/authentication)服务外，Laravel 还提供了一种简单的方法来授权用户对给定资源的操作。例如，尽管用户已通过认证，但他们可能没有授权更新或删除应用程序托管的某些 Eloquent 模型或数据库记录。Laravel 的授权功能提供了一种简单、有组织的管理这类授权检查的方式。

Laravel 提供两种主要的授权操作方法：[gates](#gates) 和 [policies](#creating-policies)。可以将 gates 和 policies 视为路由和控制器。Gates 提供了一种简单的基于闭包的授权方法，而 policies 就像控制器一样，围绕特定模型或资源组织逻辑。在本文档中，我们将先探讨 gates ，然后再检查 policies。

在构建应用程序时，无需在只使用 gates 或只使用 policies 之间做出选择。大多数应用程序很可能包含 gates 和 policies 的某种组合，这是完全正常的！Gates 最适用于不涉及任何模型或资源的操作，例如查看管理员仪表板。相比之下，当您希望针对特定模型或资源授权操作时，应使用 policies。

## Gates

### 编写 Gates

> [!WARNING]  
> Gates 是学习 Laravel 授权功能的基础，然而，在构建健壮的 Laravel 应用时，你应该考虑使用 [policies](#creating-policies) 来组织你的授权规则。

Gates 是判断用户是否有权执行给定操作的闭包。通常，gates 在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Gate` facade 来定义。Gates 总是接收一个用户实例作为它们的第一个参数，并且可以可选地接收额外参数，例如相关的 Eloquent 模型。

在这个例子中，我们将定义一个 gate 来确定用户是否可以更新给定的 `App\Models\Post` 模型。gate 将通过比较用户的 `id` 和创建帖子的用户的 `user_id` 来完成这一任务：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

像控制器一样，gates 也可以使用类回调数组来定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

### 授权动作

要使用 gates 授权操作，应使用 `Gate` facade 提供的 `allows` 或 `denies` 方法。注意，您不需要将当前认证的用户传递给这些方法。Laravel 会自动处理将用户传递到 gate 闭包中。通常，在应用程序的控制器中调用 gate 授权方法是很典型的，这是在执行需要授权的操作之前：

```php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定的帖子。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if (! Gate::allows('update-post', $post)) {
            abort(403);
        }

        // 更新帖子...

        return redirect('/posts');
    }
}
```

如果您希望确定其他用户是否有权执行操作，而不仅仅是当前认证用户，您可以使用 `Gate` facade 上的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 用户可以更新帖子...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 用户不能更新帖子...
}
```

您可能会使用 `any` 或 `none` 方法同时授权多个操作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 用户可以更新或删除帖子...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 用户无法更新或删除帖子...
}
```

#### 授权或抛出异常

如果您希望尝试授权操作，并且如果用户不允许执行给定操作，则自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，您可以使用 `Gate` facade 的 `authorize` 方法。`AuthorizationException` 的实例会自动被 Laravel 转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 动作被授权...
```

#### 提供额外的上下文

授权能力的 gate 方法（`allows`, `denies`, `check`, `any`, `none`, `authorize`, `can`, `cannot`）和授权 [Blade 指令](#via-blade-templates)（`@can`, `@cannot`, `@canany`）可以在它们的第二个参数收到数组。这些数组元素作为参数传递给 gate 闭包，并可用于在做出授权决策时提供额外的上下文：

```php
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::define('create-post', function (User $user, Category $category, bool $pinned) {
    if (! $user->canPublishToGroup($category->group)) {
        return false;
    } elseif ($pinned && ! $user->canPinPosts()) {
        return false;
    }

    return true;
});

if (Gate::check('create-post', [$category, $pinned])) {
    // 用户可以创建帖子...
}
```

### 网关响应

到目前为止，我们只检查了返回简单布尔值的网关。然而，有时你可能希望返回一个更详细的响应，包括错误消息。为此，你可以从网关返回一个 `Illuminate\Auth\Access\Response`：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
                ? Response::allow()
                : Response::deny('你必须是管理员。');
});
```

即使你从网关返回了一个授权响应，`Gate::allows` 方法仍然会返回一个简单布尔值；然而，你可以使用 `Gate::inspect` 方法来获取网关返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 操作被授权...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法时，如果操作未被授权，它将抛出一个 `AuthorizationException`，授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('edit-settings');

// 操作被授权...
```

#### 自定义 HTTP 响应状态

当通过网关拒绝操作时，将返回一个 `403` HTTP 响应；然而，返回一个不同的 HTTP 状态码有时可能会有所帮助。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数来自定义失败授权检查返回的 HTTP 状态码：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
                ? Response::allow()
                : Response::denyWithStatus(404);
});
```

由于通过 `404` 响应来隐藏资源是 Web 应用程序的常见模式，因此提供了 `denyAsNotFound` 方法以方便使用：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
                ? Response::allow()
                : Response::denyAsNotFound();
});
```

### 拦截器网关检查

有时，你可能希望给特定用户授予所有权限。你可以使用 `before` 方法定义一个在所有其他授权检查之前运行的闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回一个非空的结果，该结果将被视为授权检查的结果。

你可以使用 `after` 方法定义一个闭包，在所有其他授权检查之后执行：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

与 `before` 方法类似，如果 `after` 闭包返回一个非空的结果，该结果将被视为授权检查的结果。

### 内联授权

偶尔，你可能希望确定当前认证的用户是否被授权执行给定的操作，而无需编写对应该操作的专用网关。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这些"内联"授权检查。内联授权不会执行任何已定义的 ["before" 或 "after" 授权钩子](#intercepting-gate-checks)：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果操作未被授权或当前没有用户被认证，Laravel 将自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。`AuthorizationException` 实例会自动由 Laravel 的异常处理器转换为 403 HTTP 响应。

## 创建策略

### 生成策略

策略是围绕特定模型或资源组织授权逻辑的类。例如，如果你的应用程序是博客，你可能有一个 `App\Models\Post` 模型和相应的 `App\Policies\PostPolicy` 来授权用户操作，如创建或更新帖子。

你可以使用 `make:policy` Artisan 命令来生成一个策略。生成的策略将放置在 `app/Policies` 目录。如果你的应用程序中不存在这个目录，Laravel 会为你创建它：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令将生成一个空的策略类。如果你希望生成一个带有示例策略方法的类，这些方法涉及到查看、创建、更新和删除资源，当执行命令时，你可以提供一个 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

### 注册策略

#### 策略发现

默认情况下，只要模型和策略遵循标准的 Laravel 命名约定，Laravel 自动发现策略。具体来说，策略必须位于 `Policies` 目录中，该目录位于包含模型的目录的上方或同级。因此，例如，模型可以放在 `app/Models` 目录中，而策略可能放在 `app/Policies` 目录中。在这种情况下，Laravel 将检查 `app/Models/Policies` 然后是 `app/Policies` 中的策略。此外，策略名称必须与模型名称匹配并有一个 `Policy` 后缀。因此，一个 `User` 模型对应一个 `UserPolicy` 策略类。

如果你想定义你自己的策略发现逻辑，你可以使用 `Gate::guessPolicyNamesUsing` 方法注册一个自定义策略发现回调。通常，这个方法应该在你的应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // 返回给定模型的策略类名称...
});
```

#### 手动注册策略

使用 `Gate` 门面，你可以在应用程序的 `AppServiceProvider` 的 `boot` 方法中手动注册策略及其对应的模型：

```php
use App\Models\Order;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
}
```

## 编写策略

### 策略方法

一旦注册了策略类，你就可以为它授权的每个动作添加方法。例如，让我们在 `PostPolicy` 上定义一个 `update` 方法，用于确定特定的 `App\Models\User` 是否能够更新特定的 `App\Models\Post` 实例。

`update` 方法将接收一个 `User` 和一个 `Post` 实例作为其参数，并应返回 `true` 或 `false` 指示用户是否有权限更新给定的 `Post`。所以，在这个例子中，我们将验证用户的 `id` 是否与帖子上的 `user_id` 匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定给定的帖子是否能由用户更新。
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

你可能需要为授权的各种动作继续在策略上定义额外的方法。例如，你可能会定义 `view` 或 `delete` 方法来授权与 `Post` 相关的各种动作，但请记住，你可以自由地为策略方法取任何你喜欢的名称。

如果你在通过 Artisan 控制台生成策略时使用了 `--model` 选项，它将已经包含 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 动作的方法。

> [!NOTE]
> 所有策略都通过 Laravel [服务容器](/docs/11/architecture-concepts/container)解析，允许你在策略的构造函数中键入提示所需的依赖项，以便它们被自动注入。

### 策略响应

到目前为止，我们只检查了返回简单布尔值的策略方法。然而，有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从策略方法返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定的帖子是否能由用户更新。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
                ? Response::allow()
                : Response::deny('你不拥有这篇帖子。');
}
```

当从策略返回授权响应时，`Gate::allows` 方法仍将返回一个简单的布尔值；然而，你可以使用 `Gate::inspect` 方法获取网关返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 动作被授权...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法时，如果动作未被授权，将抛出一个 `AuthorizationException` 异常，授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('update', $post);

// 动作被授权...
```

#### 自定义 HTTP 响应状态

当通过策略方法拒绝某个动作时，将返回一个 `403` HTTP 响应；然而，有时返回一个替代的 HTTP 状态码可能会有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数来自定义失败的授权检查返回的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定的帖子是否能由用户更新。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
                ? Response::allow()
                : Response::denyWithStatus(404);
}
```

因为通过 `404` 响应隐藏资源是 Web 应用程序的常见模式，因此出于方便考虑，提供了 `denyAsNotFound` 方法：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定的帖子是否能由用户更新。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
                ? Response::allow()
                : Response::denyAsNotFound();
}
```

### 不涉及模型的方法

某些政策方法只接收当前认证用户的实例。这种情况最常见的是授权 `create` 动作。例如，如果你正在创建一个博客，你可能希望确定一个用户是否有权创建任何帖子。在这些情况下，你的政策方法只需期望收到一个用户实例：

```php
/**
 * 确定给定的用户是否可以创建帖子。
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

### 访客用户

默认情况下，如果传入的 HTTP 请求不是由认证用户启动的，所有网关和策略会自动返回 `false`。然而，你可以通过声明一个“可选”的类型提示或为用户参数定义提供一个 `null` 默认值，允许这些授权检查通过到你的网关和策略：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定给定的帖子是否能由用户更新。
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

### 策略过滤器

在某些情况下，您可能希望授权给定策略中的所有操作。为此，可以在策略上定义一个 `before` 方法。`before` 方法将在策略的其他任何方法之前执行，这给您提供了一个机会，在实际调用预期的策略方法之前授权该操作。这个功能最常用于授权应用程序管理员执行任何操作：

```php
use App\Models\User;

/**
 * 执行预授权检查。
 */
public function before(User $user, string $ability): bool|null
{
    if ($user->isAdministrator()) {
        return true;
    }

    return null;
}
```

如果您想要拒绝某种类型的用户的所有授权检查，那么可以从 `before` 方法中返回 `false`。如果返回了 `null`，授权检查将会通往策略方法。

> [!WARNING]  
> 如果类中不包含与正在检查的权限名称匹配的方法，那么策略类的 `before` 方法将不会被调用。

## 使用策略授权操作

### 通过用户模型

Laravel 应用程序附带的 `App\Models\User` 用户模型包含了两个有用的方法来授权操作：`can` 和 `cannot`。`can` 和 `cannot` 方法接受您希望授权的操作的名称和相关模型。例如，让我们确定一个用户是否被授权更新给定的 `App\Models\Post` 模型。通常，这会在控制器方法内完成：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定的文章。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if ($request->user()->cannot('update', $post)) {
            abort(403);
        }

        // 更新文章...

        return redirect('/posts');
    }
}
```

如果为给定模型注册了[策略](#registering-policies)，`can` 方法将自动调用相应的策略并返回布尔结果。如果没有为模型注册策略，`can` 方法将试图调用匹配给定操作名称的基于闭包的 Gate。

#### 不需要模型的操作

请记住，有些操作可能对应于不需要模型实例的策略方法，如 `create`。在这些情况下，您可以将类名传递给 `can` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建文章。
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->cannot('create', Post::class)) {
            abort(403);
        }

        // 创建文章...

        return redirect('/posts');
    }
}
```

### 通过 `Gate` Facade

除了 `App\Models\User` 模型提供的有用方法，您始终可以通过 `Gate` facade 的 `authorize` 方法授权操作。

与 `can` 方法一样，这个方法接受您希望授权的操作的名称和相关模型。如果操作未被授权，`authorize` 方法将抛出一个 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 异常处理器将自动将其转换为带有 403 状态码的 HTTP 响应：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定的博客文章。
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        // 当前用户可以更新博客文章...

        return redirect('/posts');
    }
}
```

#### 不需要模型的控制器操作

如前所述，有些策略方法如 `create` 不需要模型实例。在这些情况下，您应该将类名传递给 `authorize` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * 创建新的博客文章。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function create(Request $request): RedirectResponse
{
    Gate::authorize('create', Post::class);

    // 当前用户可以创建博客文章...

    return redirect('/posts');
}
```

### 通过中间件

Laravel 包含一个中间件，可以在请求到达您的路由或控制器之前就授权操作。默认情况下，`Illuminate\Auth\Middleware\Authorize` 中间件可以通过 Laravel 自动注册的 `can` 中间件别名附加到路由上。让我们探索一下使用 `can` 中间件授权用户可以更新文章的示例：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新文章...
})->middleware('can:update,post');
```

在这个例子中，我们传递了两个参数给 `can` 中间件。第一个是我们希望授权的操作的名称，第二个是我们希望传递给策略方法的路由参数。在这种情况下，由于我们使用的是[隐式模型绑定](/docs/11/basics/routing#implicit-binding)，一个 `App\Models\Post` 模型将被传递给策略方法。如果用户未被授权执行给定操作，中间件将返回带有 403 状态码的 HTTP 响应。

为了方便，您也可以使用 `can` 方法将 `can` 中间件附加到您的路由上：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新文章...
})->can('update', 'post');
```

#### 不需要模型的中间件操作

同样，有些策略方法如 `create` 不需要模型实例。在这些情况下，您可以将类名传递给中间件。类名将用于确定在授权操作时使用哪个策略：

```php
Route::post('/post', function () {
    // 当前用户可以创建文章...
})->middleware('can:create,App\Models\Post');
```

在字符串中间件定义中指定整个类名可能会变得很繁琐。为此，您可以选择使用 `can` 方法将 `can` 中间件附加到路由上：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建文章...
})->can('create', Post::class);
```

### 通过 Blade 模板

编写 Blade 模板时，如果用户被授权执行特定操作，您可能希望只显示页面的一部分。例如，如果用户真的可以更新文章，您可能希望显示一个博客文章的更新表单。在这种情况下，您可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新文章... -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新文章... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户不能更新文章... -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建新文章... -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的方便快捷方式。上面的 `@can` 和 `@cannot` 语句等同于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新文章... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户不能更新文章... -->
@endunless
```

您还可以确定用户是否被授权执行给定数组中的任何操作。为此，可以使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除文章... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcanany
```

#### 不需要模型的操作

像其他授权方法一样，如果操作不需要模型实例，您可以将类名传递给 `@can` 和 `@cannot` 指令：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建文章... -->
@endcannot
```

### 提供额外的上下文

使用策略授权操作时，您可以将数组作为各种授权函数和助手的第二个参数。数组中的第一个元素将用于确定应当调用哪个策略，而数组中的其余元素作为参数传递给策略方法，可以用于授权决策时的额外上下文。例如，考虑以下包含额外 `$category` 参数的 `PostPolicy` 方法定义：

```php
/**
 * 确定给定文章是否可以由用户更新。
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

当试图确定已认证用户是否可以更新给定文章时，我们可以这样调用这个策略方法：

```php
/**
 * 更新给定的博客文章。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post): RedirectResponse
{
    Gate::authorize('update', [$post, $request->category]);

    // 当前用户可以更新博客文章...

    return return redirect('/posts');
```

## 授权和 Inertia

尽管授权必须始终在服务器上处理，但是向前端应用程序提供授权数据以便正确渲染应用程序的用户界面常常很方便。Laravel 没有定义将授权信息暴露给 Inertia 驱动前端的必须约定。

然而，如果你使用的是 Laravel 的基于 Inertia 的[入门套件](/docs/11/getting-started/starter-kits)之一，你的应用程序已经包含一个`HandleInertiaRequests`中间件。在这个中间件的`share`方法中，你可以返回为应用程序中的所有 Inertia 页面提供的共享数据。此共享数据可以作为为用户定义授权信息的便捷位置：

```php
<?php

namespace App\Http\Middleware;

use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    // ...

    /**
     * 定义默认共享的属性。
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'permissions' => [
                    'post' => [
                        'create' => $request->user()->can('create', Post::class),
                    ],
                ],
            ],
        ];
    }
}
```
