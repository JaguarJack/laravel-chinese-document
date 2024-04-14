---
title: Laravel 认证
---

# 认证

[[toc]]

## 介绍

许多网络应用程序提供了用户用于验证和“登录”的方式。在网络应用程序中实施这项功能可能是一个复杂且潜在风险的过程。因此，Laravel 力求为您提供所需的工具以快速、安全、轻松地实现验证功能。

Laravel 的身份验证功能核心由“守卫”和“提供者”组成。守卫定义了如何为每个请求验证用户。例如，Laravel 自带一个 `session` 守卫，它使用会话存储和 cookies 来维护状态。

提供者定义了如何从您持续的存储中检索用户。Laravel 自带支持使用 [Eloquent](/docs/11/eloquent/eloquent) 和数据库查询构造器检索用户。然而，您可以根据应用程序的需要自由定义额外的提供者。

您的应用程序的身份验证配置文件位于 `config/auth.php`。此文件包含几个记录良好的选项，用于调整 Laravel 身份验证服务的行为。

> [!NOTE]  
> 守卫和提供者不应与“角色”和“权限”混淆。要了解更多关于通过权限授权用户操作的信息，请参考 [授权](/docs/11/security/authorization)文档。

### 入门套件

想要快速开始？在新的 Laravel 应用程序中安装 [Laravel 应用程序入门套件](/docs/11/getting-started/starter-kits)。在迁移您的数据库之后，将您的浏览器导航到 `/register` 或分配给您应用程序的任何其他 URL。入门套件将负责为您搭建整个身份验证系统！

**即使您最终选择不在 Laravel 应用程序中使用入门套件，安装 [Laravel Breeze](/docs/11/getting-started/starter-kits#laravel-breeze) 入门套件也是学习如何在实际 Laravel 项目中实施 Laravel 的所有身份验证功能的绝佳机会。** 由于 Laravel Breeze 为您创建了身份验证控制器、路由和视图，您可以检查这些文件中的代码，了解 Laravel 的身份验证功能如何实现。

### 数据库考虑

默认情况下，在您的 `app/Models` 目录中，Laravel 包含了一个 `App\Models\User` [Eloquent 模型](/docs/11/eloquent/eloquent)。此模型可以与默认的 Eloquent 身份验证驱动程序一起使用。如果您的应用程序没有使用 Eloquent，您可以使用 `database` 身份验证提供者，它使用 Laravel 查询构建器。

在为 `App\Models\User` 模型构建数据库模式时，请确保密码字段至少有 60 个字符长度。当然，新 Laravel 应用程序中默认包含的 `users` 表迁移已经创建了一个超出此长度的列。

另外，您应该验证您的 `users`（或等效的）表是否包含一个可为空的、字符串类型的 `remember_token` 列，长度为 100 个字符。这个列将用于存储选择了在登录到您的应用程序时选择“记住我”选项的用户的令牌。同样，新 Laravel 应用程序所包含的默认 `users` 表迁移也已经包含了这个列。

### 生态系统概览

Laravel 提供了许多与身份验证相关的包。在继续之前，我们将回顾 Laravel 中的一般身份验证生态系统，并讨论每个包的预期用途。

首先，考虑身份验证是如何工作的。当使用网络浏览器时，用户通过登录表单提供他们的用户名和密码。如果这些凭证正确，应用程序将在用户的 [会话](/docs/11/basics/session) 中存储有关已验证用户的信息。浏览器发出的 cookie 包含会话 ID，以便应用程序可以根据会话 ID 关联用户与正确的会话。在收到会话 cookie 后，应用程序将根据会话 ID 检索会话数据，注意到已经在会话中存储了认证信息，并将用户视为“已认证”。

当远程服务需要认证以访问 API 时，通常不会使用 cookie 进行认证，因为没有网页浏览器。相反，远程服务在每次请求时向 API 发送一个 API 令牌。应用程序可以验证传入的令牌是否与有效 API 令牌表中的一个相匹配，并“认证”请求是由与该 API 令牌相关联的用户执行的。

#### Laravel 的内置浏览器身份验证服务

Laravel 包含内置的身份验证和会话服务，通常可以通过 `Auth` 和 `Session` facades 来访问。这些功能提供了基于 cookie 的验证，用于从网络浏览器发起的请求。它们提供了允许您验证用户凭证和验证用户的方法。此外，这些服务将自动在用户的会话中存储适当的身份验证数据，并向用户发出会话 cookie。这份文档中包含了如何使用这些服务的讨论。

**应用入门套件**

如本文档所讨论的，您可以手动与这些身份验证服务交互，以构建应用程序自己的身份验证层。然而，为了帮助您更快地入门，我们发布了 [免费包](/docs/11/getting-started/starter-kits)，它为整个身份验证层提供了稳健、现代化的脚手架。这些包是 [Laravel Breeze](/docs/11/getting-started/starter-kits#laravel-breeze)，[Laravel Jetstream](/docs/11/getting-started/starter-kits#laravel-jetstream) 和 [Laravel Fortify](/docs/11/packages/fortify)。

_Laravel Breeze_ 是 Laravel 所有身份验证功能的简单、最小实现，包括登录、注册、密码重置、电子邮件验证和密码确认。Laravel Breeze 的视图层由简单的 [Blade 模板](/docs/11/basics/blade) 组成，并配有 [Tailwind CSS](https://tailwindcss.com) 样式。要开始，请查看有关 Laravel 的 [应用程序入门套件](/docs/11/getting-started/starter-kits) 的文档。

_Laravel Fortify_ 是 Laravel 的无头身份验证后端，实现了许多在本文档中找到的功能，包括基于 cookie 的认证以及其他功能，如双因素认证和电子邮件验证。Fortify 为 Laravel Jetstream 提供身份验证后端，或者可以独立使用，结合 [Laravel Sanctum](/docs/11/packages/sanctum) 为需要与 Laravel 进行验证的 SPA 提供身份验证。

_[Laravel Jetstream](https://jetstream.laravel.com)_ 是一个健壮的应用程序入门套件，它通过使用 [Tailwind CSS](https://tailwindcss.com)，[Livewire](https://livewire.laravel.com)，和/或 [Inertia](https://inertiajs.com) 所提供的漂亮、现代化 UI 来消费和公开 Laravel Fortify 的身份验证服务。Laravel Jetstream 包括可选的双因素认证、团队支持、浏览器会话管理、个人资料管理和与 [Laravel Sanctum](/docs/11/packages/sanctum) 的内置集成来提供 API 令牌认证的支持。Laravel 的 API 身份验证服务将在下文中讨论。

#### Laravel 的 API 身份验证服务

Laravel 提供了两个可选包以帮助您管理 API 令牌和使用 API 令牌进行身份验证的请求：[Passport](/docs/11/packages/passport) 和 [Sanctum](/docs/11/packages/sanctum)。请注意，这些库和 Laravel 内置的基于 cookie 的身份验证库不是互斥的。这些库主要专注于 API 令牌身份验证，而内置的身份验证服务专注于基于浏览器的 cookie 身份验证。许多应用程序将使用 Laravel 的内置基于 cookie 的身份验证服务和 Laravel 的一个 API 身份验证包。

**Passport**

Passport 是一个 OAuth2 身份验证提供者，提供多种 OAuth2 "授权类型"，允许您发行各种类型的令牌。一般来说，这是一个健壮且复杂的 API 身份验证软件包。然而，大多数应用程序并不需要 OAuth2 规范提供的复杂功能，这些功能对用户和开发人员都可能造成困惑。此外，开发人员一直对如何使用像 Passport 这样的 OAuth2 身份验证提供者对 SPA 应用程序或移动应用程序进行身份验证感到困惑。

**Sanctum**

为了回应 OAuth2 的复杂性和开发人员的困惑，我们着手构建了一个更简单、更直接的认证包，可以处理来自网络浏览器的第一方网络请求和通过令牌进行的 API 请求。这个目标通过发布 [Laravel Sanctum](/docs/11/packages/sanctum) 实现，Sanctum 应被视为将为第一方网络 UI 提供服务的应用程序、将由后端 Laravel 应用程序支持的单页应用程序 (SPA) 或提供移动客户端的应用程序的首选和推荐的身份验证包。

Laravel Sanctum 是一个可以管理应用程序整个身份验证过程的混合网络 / API 身份验证包。这是可能的，因为当 Sanctum 基础上的应用程序接收到请求时，Sanctum 将首先确定请求是否包含引用已认证会话的会话 cookie。Sanctum 通过调用我们前面讨论过的 Laravel 内置的身份验证服务来完成这一点。如果请求不是通过会话 cookie 进行身份验证的，Sanctum 将检查请求以查找 API 令牌。如果存在 API 令牌，Sanctum 将使用该令牌验证请求。要了解有关此过程的更多信息，请查阅 Sanctum 的 ["如何工作"](/docs/11/packages/sanctum#how-it-works) 文档。

我们选择将 Laravel Sanctum 与 [Laravel Jetstream](https://jetstream.laravel.com) 应用程序入门套件一起包含，因为我们相信它最适合大多数网络应用程序的身份验证需求。

#### 总结和选择您的技术堆栈

总而言之，如果您的应用程序将通过浏览器访问，并且您正在构建一个单体 Laravel 应用程序，那么您的应用程序将使用 Laravel 的内置身份验证服务。

接下来，如果您的应用程序提供将由第三方消费的 API，您将在 [Passport](/docs/11/packages/passport) 或 [Sanctum](/docs/11/packages/sanctum) 中选择一个，为您的应用程序提供 API 令牌认证。一般来说，当可能的时候，应该优先选择 Sanctum 因为它是一个简单、完整的 API 身份验证、SPA 身份验证和移动认证解决方案，包括对“范围”或“能力”的支持。

如果您正在构建一个将由 Laravel 后端提供支持的单页应用程序 (SPA)，那么您应该使用 [Laravel Sanctum](/docs/11/packages/sanctum)。使用 Sanctum 时，您将需要 [手动实现自己的后端身份验证路由](#authenticating-users) 或使用 [Laravel Fortify](/docs/11/packages/fortify) 作为无头身份验证后端服务，该服务提供注册、密码重置、电子邮件验证等功能的路由和控制器。

当您的应用程序绝对需要 OAuth2 规范提供的所有功能时，可以选择 Passport。

而且，如果您希望快速入门，我们很高兴推荐 [Laravel Breeze](/docs/11/getting-started/starter-kits#laravel-breeze) 作为快速启动新 Laravel 应用程序的方法，已经使用我们首选的身份验证技术栈，包括 Laravel 的内置身份验证服务和 Laravel Sanctum。

## 身份验证快速入门

> [!WARNING]  
> 本文档的这一部分讨论了通过 [Laravel 应用程序入门套件](/docs/11/getting-started/starter-kits) 来验证用户，它包括 UI 脚手架以帮助您快速入门。如果您想要直接集成 Laravel 的身份验证系统，请查看 [手动认证用户](#authenticating-users) 的文档。

### 安装入门套件

首先，您应该 [安装一个 Laravel 应用程序入门套件](/docs/11/getting-started/starter-kits)。我们当前的入门套件，Laravel Breeze 和 Laravel Jetstream，提供了将身份验证集成到新的 Laravel 应用程序的设计精美的起点。

Laravel Breeze 是 Laravel 所有身份验证功能的最小、简单实现，包括登录、注册、密码重置、电子邮件验证和密码确认。Laravel Breeze 的视图层由简单的 [Blade 模板](/docs/11/basics/blade) 组成，配有 [Tailwind CSS](https://tailwindcss.com) 样式。此外，Breeze 提供了基于 [Livewire](https://livewire.laravel.com) 或 [Inertia](https://inertiajs.com) 的脚手架选择，可以选择 Vue 或 React 来进行 Inertia 脚手架。

[Laravel Jetstream](https://jetstream.laravel.com) 是一个更健壮的应用程序入门套件，它包括支持使用 [Livewire](https://livewire.laravel.com) 或 [Inertia 和 Vue](https://inertiajs.com) 脚手架您的应用程序。此外，Jetstream 提供了两因素认证、团队、资料管理、浏览器会话管理、API 支持通过 [Laravel Sanctum](/docs/11/packages/sanctum)、账户删除等可选支持。

### 获取已认证用户

在安装了身份认证启动套件，并允许用户注册并与您的应用程序进行身份认证之后，您经常需要与当前认证的用户进行交互。在处理传入请求时，您可以通过 `Auth` 门面的 `user` 方法访问已认证用户：

```php
use Illuminate\Support\Facades\Auth;

// 获取当前已认证的用户...
$user = Auth::user();

// 获取当前已认证用户的 ID...
$id = Auth::id();
```

另外，一旦用户通过认证，您可以通过 `Illuminate\Http\Request` 实例访问已认证用户。请记住，类型提示的类将自动注入到您的控制器方法中。通过对 `Illuminate\Http\Request` 对象进行类型提示，您可以从应用程序中任何控制器方法通过请求的 `user` 方法方便地访问已认证用户：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 为现有航班更新航班信息。
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        // ...

        return redirect('/flights');
    }
}
```

#### 确定当前用户是否已认证

要确定发起传入 HTTP 请求的用户是否已认证，您可以使用 `Auth` 门面上的 `check` 方法。如果用户已认证，此方法将返回 `true`：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::check()) {
    // 用户已登录...
}
```

> [!NOTE]
> 虽然可以使用 `check` 方法确定用户是否已认证，但您通常会使用中间件来验证用户在允许访问某些路由/控制器之前是否已认证。要了解更多关于此的信息，请查看有关[保护路由](/docs/11/security/authentication#protecting-routes)的文档。

### 保护路由

[路由中间件](/docs/11/basics/middleware)可用于仅允许经过身份验证的用户访问给定路由。Laravel 带有一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的[中间件别名](/docs/11/basics/middleware#middleware-alias)。由于这个中间件已经在 Laravel 内部别名化，所以您需要做的只是将中间件附加到路由定义上：

```php
Route::get('/flights', function () {
    // 只有经过身份验证的用户才能访问此路由...
})->middleware('auth');
```

#### 重定向未认证用户

当 `auth` 中间件检测到未认证用户时，它将会将用户重定向到 `login` [命名路由](/docs/11/basics/routing#named-routes)。您可以在应用程序的 `bootstrap/app.php` 文件中使用 `redirectGuestsTo` 方法来修改此行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware) {
    $middleware->redirectGuestsTo('/login');

    // 使用闭包...
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```

#### 指定守卫

在将 `auth` 中间件附加到路由时，您还可以指定用于认证用户的“守卫”。指定的守卫应该对应于您 `auth.php` 配置文件中 `guards` 数组的一个键：

```php
Route::get('/flights', function () {
    // 只有经过身份验证的用户才能访问此路由...
})->middleware('auth:admin');
```

### 登录限制

如果您使用的是 Laravel Breeze 或 Laravel Jetstream [入门套件](/docs/11/getting-started/starter-kits)，登录尝试将自动应用速率限制。默认情况下，如果用户在多次尝试后未能提供正确的凭据，用户将无法登录一分钟。节流是根据用户的用户名/电子邮件地址和他们的 IP 地址独特的。

> [!NOTE]
> 如果您想在应用程序中对其他路由进行限速，请查看[限速文档](/docs/11/basics/routing#rate-limiting)。

## 手动用户认证

您无需使用 Laravel 的[应用程序入门套件](/docs/11/getting-started/starter-kits)中包含的身份认证脚手架。如果您选择不使用此脚手架，您将需要直接使用 Laravel 身份认证类管理用户身份认证。别担心，这很简单！

我们将通过 `Auth` [门面](/docs/11/architecture-concepts/facades)来访问 Laravel 的身份认证服务，因此我们需要确保在类的顶部导入 `Auth` 门面。接下来，让我们看下 `attempt` 方法。`attempt` 方法通常用于处理应用程序“登录”表单的身份认证尝试。如果认证成功，您应当重新生成用户的[会话](/docs/11/basics/session)以防止 [会话固定](https://en.wikipedia.org/wiki/Session_fixation)：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * 处理身份认证尝试。
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}
```

`attempt` 方法的第一个参数接受一个键/值对数组。数组中的值将用于在您的数据库表中查找用户。所以，在上面的示例中，用户将通过 `email` 列的值检索。如果找到用户，数据库中存储的散列密码将与通过数组传递给方法的 `password` 值进行比较。您不应该对传入请求的 `password` 值进行散列，因为框架会在将值与数据库中的散列密码进行比较之前自动对其进行散列处理。如果两个散列密码匹配，则将为该用户启动经过认证的会话。

请记住，Laravel 的身份认证服务将基于您的身份认证守卫的“提供者”配置从数据库检索用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示其在检索用户时使用 `App\Models\User` 模型。根据应用程序的需求，您可以在配置文件中更改这些值。

如果身份认证成功，`attempt` 方法将返回 `true`。否则，将返回 `false`。

Laravel 重定向器提供的 `intended` 方法将重定向用户到他们试图访问的 URL，然后被身份认证中间件拦截。可以给此方法提供一个回退 URI，以防预期的目的地不可用。

#### 指定额外条件

如果您愿意，除了用户的电子邮件和密码外，还可以向身份认证查询中添加额外的查询条件。为此，我们可以简单地将查询条件添加到传递给 `attempt` 方法的数组中。例如，我们可以验证用户是否被标记为“活跃”：

```php
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
    // 认证成功...
}
```

对于复杂的查询条件，您可以在凭据数组中提供一个闭包。该闭包将被传递给查询实例，允许您根据应用程序的需求自定义查询：

```php
use Illuminate\Database\Eloquent\Builder;

if (Auth::attempt([
    'email' => $email,
    'password' => $password,
    fn (Builder $query) => $query->has('activeSubscription'),
])) {
    // 认证成功...
}
```

> [!WARNING]
> 在这些例子中，`email` 不是一个必需的选项，它只是一个例子。您应使用与数据库表中的“用户名”对应的列名。

`attemptWhen` 方法在其第二个参数接收一个闭包，可用于在实际身份认证用户之前对潜在用户进行更广泛的检查。闭包接收潜在的用户，并应返回 `true` 或 `false` 来指示用户是否可以认证：

```php
if (Auth::attemptWhen([
    'email' => $email,
    'password' => $password,
], function (User $user) {
    return $user->isNotBanned();
})) {
    // 认证成功...
}
```

#### 访问特定的守卫实例

通过 `Auth` 门面的 `guard` 方法，您可以指定在认证用户时想要使用的守卫实例。这允许您使用完全独立的可验证模型或用户表来管理应用程序不同部分的认证。

传递给 `guard` 方法的守卫名称应对应于您 `auth.php` 配置文件中配置的守卫：

```php
if (Auth::guard('admin')->attempt($credentials)) {
    // ...
}
```

### 记住用户

许多网络应用程序在其登录表单上提供“记住我”复选框。如果您希望在您的应用程序中提供“记住我”功能，您可以将一个布尔值作为 `attempt` 方法的第二个参数。

当此值为 `true` 时，Laravel 会使用户无限期地保持认证状态，或直到他们手动登出。您的 `users` 表必须包括字符串 `remember_token` 列，它将用于存储“记住我”令牌。新 Laravel 应用程序附带的 `users` 表迁移文件已经包括了这个列：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
    // 用户将被记住...
}
```

如果您的应用程序提供了“记住我”功能，您可以使用 `viaRemember` 方法来确定当前认证的用户是否使用“记住我”cookie 认证的：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::viaRemember()) {
    // ...
}
```

### 其他身份认证方法

#### 对用户实例进行认证

如果您需要将已有的用户实例设置为当前认证的用户，您可以将用户实例传递给 `Auth` 门面的 `login` 方法。给定的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [合约](/docs/11/digging-deeper/contracts)的一个实现。Laravel 中附带的 `App\Models\User` 模型已经实现了这个接口。在用户使用应用程序注册后立即，这种认证方法是很有用的：

```php
use Illuminate\Support\Facades\Auth;

Auth::login($user);
```

在调用 `login` 方法时，您可以将布尔值作为第二个参数传递。此值指示是否需要认证会话的“记住我”功能。记住，这意味着会话将无限期地进行认证，或直到用户手动退出应用程序：

```php
Auth::login($user, $remember = true);
```

如果需要，您可以在调用 `login` 方法前指定一个身份认证守卫：

```php
Auth::guard('admin')->login($user);
```

#### 通过 ID 对用户进行认证

要使用他们数据库记录的主键对用户进行认证，您可以使用 `loginUsingId` 方法。此方法接受您希望建立认证的用户的主键：

```php
Auth::loginUsingId(1);
```

您可以将布尔值作为 `loginUsingId` 方法的第二个参数传递。此值指示是否需要认证会话的“记住我”功能。记住，这意味着会话将无限期地进行认证，或直到用户手动退出应用程序：

```php
Auth::loginUsingId(1, $remember = true);
```

#### 一次性对用户进行认证

您可以使用 `once` 方法一次性地对用户进行应用程序身份认证。调用此方法时不会使用会话或 cookie：

```php
if (Auth::once($credentials)) {
    // ...
}
```

## HTTP 基本认证

[HTTP 基本认证](https://en.wikipedia.org/wiki/Basic_access_authentication) 提供了一种快速的方式来认证你的应用用户，而不需要设置专门的“登录”页面。要开始，只需要将 `auth.basic` [中间件](/docs/11/basics/middleware)附加到一个路由上。`auth.basic` 中间件已包含在 Laravel 框架内，因此你不需要定义它：

```php
Route::get('/profile', function () {
    // 只有认证用户才能访问此路由...
})->middleware('auth.basic');
```

一旦中间件被附加到路由上，当你在浏览器中访问该路由时，系统会自动提示你输入凭证。默认情况下，`auth.basic` 中间件会假设你的 `users` 数据库表中的 `email` 列是用户的“用户名”。

#### 关于 FastCGI 的说明

如果你使用 PHP FastCGI 和 Apache 来服务你的 Laravel 应用程序，HTTP 基本认证可能无法正常工作。为了纠正这些问题，可以在应用程序的 `.htaccess` 文件中添加以下行：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

### 无状态 HTTP 基本认证

你也可以使用 HTTP 基本认证，而不在会话中设置用户标识符 cookie。如果你选择使用 HTTP 认证来认证应用程序的 API 请求，这主要是有帮助的。要做到这一点，[定义一个中间件](/docs/11/basics/middleware)并调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回响应，请求可以进一步传递到应用程序中：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateOnceWithBasicAuth
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return Auth::onceBasic() ?: $next($request);
    }
}
```

接下来，将中间件附加到路由：

```php
Route::get('/api/user', function () {
    // 只有认证用户才能访问此路由...
})->middleware(AuthenticateOnceWithBasicAuth::class);
```

## 登出

为了手动将用户从你的应用程序中登出，你可以使用 `Auth` facade 提供的 `logout` 方法。这将从用户的会话中移除认证信息，这样后续请求就不会被认证。

除了调用 `logout` 方法外，建议你使用户的会话无效并重新生成他们的 [CSRF 令牌](/docs/11/basics/csrf)。在用户登出后，你通常会将用户重定向到应用程序的根路由：

```php
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * 将用户从应用程序中登出。
 */
public function logout(Request $request): RedirectResponse
{
    Auth::logout();

    $request->session()->invalidate();

    $request->session()->regenerateToken();

    return redirect('/');
}
```

### 在其他设备上使会话无效

Laravel 还提供了一种机制，在当前设备上不使会话无效的情况下，使用户在其他设备上的会话无效并“登出”。当用户更改或更新他们的密码时，通常使用这项功能，并且你希望在当前设备保持认证的同时，在其他设备上使会话无效。

在开始之前，你应该确保 `Illuminate\Session\Middleware\AuthenticateSession` 中间件包含在应该接收会话认证的路由上。通常，你应该将这个中间件放到路由组定义中，这样它就可以应用于应用程序的大多数路由。默认情况下，`AuthenticateSession` 中间件可以使用 `auth.session` [中间件别名](/docs/11/basics/middleware#middleware-alias)附加到路由：

```php
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/', function () {
        // ...
    });
});
```

然后，你可以使用 `Auth` facade 提供的 `logoutOtherDevices` 方法。这个方法要求用户确认他们当前的密码，你的应用程序应该通过输入表单接受这个密码：

```php
use Illuminate\Support\Facades\Auth;

Auth::logoutOtherDevices($currentPassword);
```

当调用 `logoutOtherDevices` 方法时，用户的其他会话将被完全无效，这意味着他们将从之前认证的所有防护装置中“登出”。

## 密码确认

在构建应用程序时，你可能会偶尔遇到某些操作需要用户在执行操作或在用户被重定向到应用程序的敏感区域之前确认他们的密码。Laravel 包含内置的中间件，使这个过程变得非常简单。实现这个功能将要求你定义两个路由：一个路由来显示一个要求用户确认密码的视图，另一个路由来确认密码的有效性并将用户重定向到他们打算前往的目的地。

> [!NOTE]  
> 下面的文档讨论如何直接与 Laravel 的密码确认功能集成；但是，如果你希望建立得更快，[Laravel 应用程序入门套件](/docs/11/getting-started/starter-kits)包括支持这项功能！

### 配置

确认密码后，用户不会被再次要求确认密码，时间长达三个小时。但是，你可以通过更改应用程序的 `config/auth.php` 配置文件中的 `password_timeout` 配置值来配置在用户被重新提示输入他们的密码之前的时间长度。

### 路由

#### 密码确认表单

首先，我们将定义一个路由来显示一个视图，该视图请求用户确认他们的密码：

```php
Route::get('/confirm-password', function () {
    return view('auth.confirm-password');
})->middleware('auth')->name('password.confirm');
```

就像你所预期的那样，这个路由返回的视图应该有一个包含 `password` 字段的表单。另外，你可以在视图中添加文本，解释用户正在进入应用程序的受保护区域，并必须确认他们的密码。

#### 确认密码

接下来，我们将定义一个路由来处理来自“确认密码”视图的表单请求。这个路由将负责验证密码并将用户重定向到他们打算前往的目的地：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;

Route::post('/confirm-password', function (Request $request) {
    if (! Hash::check($request->password, $request->user()->password)) {
        return back()->withErrors([
            'password' => ['提供的密码与我们的记录不符。']
        ]);
    }

    $request->session()->passwordConfirmed();

    return redirect()->intended();
})->middleware(['auth', 'throttle:6,1']);
```

在继续之前，让我们更详细地研究这个路由。首先，请求的 `password` 字段必须真正与认证用户的密码相匹配。如果密码有效，我们需要通知 Laravel 的会话用户已经确认了他们的密码。`passwordConfirmed` 方法将在用户的会话中设置一个时间戳，Laravel 可以使用它来确定用户最后一次确认密码的时间。最后，我们可以将用户重定向到他们打算前往的目的地。

### 保护路由

您应该确保任何执行需要最近密码确认的操作的路由都分配了 `password.confirm` 中间件。这个中间件随 Laravel 的默认安装一起提供，并会自动在会话中存储用户的意图目的地，以便在用户确认密码后能够将用户重定向到该位置。在会话中存储用户的意图目的地后，中间件将重定向用户到 `password.confirm` [命名路由](/docs/11/basics/routing#named-routes)：

```php
Route::get('/settings', function () {
    // ...
})->middleware(['password.confirm']);

Route::post('/settings', function () {
    // ...
})->middleware(['password.confirm']);
```

## 添加自定义守卫

您可以使用 `Auth` facade 的 `extend` 方法定义自己的身份认证守卫。您应该将对 `extend` 方法的调用放在一个 [服务提供者](/docs/11/architecture-concepts/providers) 中。由于 Laravel 已经附带了一个 `AppServiceProvider`，我们可以把代码放在那个提供者中：

```php
<?php

namespace App\Providers;

use App\Services\Auth\JwtGuard;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * 启动任何应用服务。
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config) {
            // 返回 Illuminate\Contracts\Auth\Guard 的实例...

            return new JwtGuard(Auth::createUserProvider($config['provider']));
        });
    }
}
```

正如上面的示例所示，传递给 `extend` 方法的回调函数应该返回 `Illuminate\Contracts\Auth\Guard` 的实现。这个接口包含了您需要实现的一些方法来定义一个自定义守卫。一旦您的自定义守卫定义完毕，您可以在 `auth.php` 配置文件的 `guards` 配置中引用守卫：

```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

### 闭包请求守卫

实现自定义的 HTTP 请求基身份验证系统的最简单方法是使用 `Auth::viaRequest` 方法。这个方法允许您通过单个闭包快速定义您的认证过程。

要开始，请在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest` 方法。`viaRequest` 方法接受认证驱动名称作为其第一个参数。这个名称可以是任何描述您自定义守卫的字符串。传递给该方法的第二个参数应该是一个闭包，它接收传入的 HTTP 请求并返回一个用户实例或者如果认证失败则返回 `null`：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Auth::viaRequest('custom-token', function (Request $request) {
        return User::where('token', (string) $request->token)->first();
    });
}
```

定义完自定义的身份验证驱动后，您可以在 `auth.php` 配置文件的 `guards` 配置中将其配置为驱动：

```php
'guards' => [
    'api' => [
        'driver' => 'custom-token',
    ],
],
```

最后，分配认证中间件到路由时，可以引用这个守卫：

```php
Route::middleware('auth:api')->group(function () {
    // ...
});
```

## 添加自定义用户提供者

如果您不是使用传统的关系型数据库来存储用户的，那么您将需要使用您自己的用户认证提供者来扩展 Laravel。我们将使用 `Auth` facade 的 `provider` 方法来定义自定义的用户提供者。用户提供者解析器应该返回 `Illuminate\Contracts\Auth\UserProvider` 的实现：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoUserProvider;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * 启动任何应用服务。
     */
    public function boot(): void
    {
        Auth::provider('mongo', function (Application $app, array $config) {
            // 返回 Illuminate\Contracts\Auth\UserProvider 的实例...

            return new MongoUserProvider($app->make('mongo.connection'));
        });
    }
}
```

使用 `provider` 方法注册提供者后，您可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动的 `provider`：

```php
'providers' => [
    'users' => [
        'driver' => 'mongo',
    ],
],
```

最后，您可以在 `guards` 配置中引用此提供者：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
],
```

### 用户提供者合约

`Illuminate\Contracts\Auth\UserProvider` 的实现负责从持久存储系统（例如 MySQL、MongoDB 等）中获取 `Illuminate\Contracts\Auth\Authenticatable` 的实现。这两个接口允许 Laravel 的身份验证机制继续工作，无论用户数据如何存储或使用什么类型的类来表示认证用户：

我们来看一下 `Illuminate\Contracts\Auth\UserProvider` 合约：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface UserProvider
{
    public function retrieveById($identifier);
    public function retrieveByToken($identifier, $token);
    public function updateRememberToken(Authenticatable $user, $token);
    public function retrieveByCredentials(array $credentials);
    public function validateCredentials(Authenticatable $user, array $credentials);
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false);
}
```

`retrieveById` 函数通常接收代表用户的键，例如 MySQL 数据库中的自增 ID。方法应检索并返回匹配 ID 的 `Authenticatable` 实现。

`retrieveByToken` 函数通过他们独特的 `$identifier` 和 "记住我" `$token`（通常存储在如 `remember_token` 的数据库字段中）来检索用户。与前面的方法一样，这个方法应该返回一个拥有匹配 token 值的 `Authenticatable` 实现。

`updateRememberToken` 方法使用新的 `$token` 更新 `$user` 实例的 `remember_token`。成功的 "记住我" 认证尝试或用户注销时会分配一个新的 token 给用户。

`retrieveByCredentials` 方法接收传递给 `Auth::attempt` 方法的凭证数组，尝试使用应用进行认证时。方法然后应该 "查询" 底层持久存储中匹配这些凭证的用户。通常，这个方法会执行带有 "where" 条件的查询，搜索一个 "username" 匹配 `$credentials['username']` 值的用户记录。方法应返回一个 `Authenticatable` 的实现。**这个方法不应该尝试做任何密码验证或认证。**

`validateCredentials` 方法应比较给定的 `$user` 与 `$credentials` 以认证用户。例如，通常这个方法会使用 `Hash::check` 方法比较 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值。这个方法应返回 `true` 或 `false` 表明密码是否有效。

`rehashPasswordIfRequired` 方法应该在需要时重新散列给定的 `$user` 的密码（如果支持）。例如，通常这个方法会使用 `Hash::needsRehash` 方法确定 `$credentials['password']` 的值是否需要重新散列。如果密码需要重新散列，方法应使用 `Hash::make` 方法重新散列密码，并更新底层持久存储中的用户记录。

### Authenticatable 合约

既然我们已经探讨了 `UserProvider` 上的每个方法，让我们看一下 `Authenticatable` 合约。请记住，用户提供者应从 `retrieveById`, `retrieveByToken`, 和 `retrieveByCredentials` 方法中返回这个接口的实现：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface Authenticatable
{
    public function getAuthIdentifierName();
    public function getAuthIdentifier();
    public function getAuthPasswordName();
    public function getAuthPassword();
    public function getRememberToken();
    public function setRememberToken($value);
    public function getRememberTokenName();
}
```

这个接口很简单。`getAuthIdentifierName` 方法应返回用户的 "主键" 列的名称，而 `getAuthIdentifier` 方法应返回用户的 "主键"。使用 MySQL 后端时，这通常是分配给用户记录的自增主键。`getAuthPasswordName` 方法应返回用户密码列的名称。`getAuthPassword` 方法应返回用户的哈希密码。

这个接口可以让身份验证系统与任何 "user" 类工作，无论您使用什么 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中包含一个实现了这个接口的 `App\Models\User` 类。

## 自动密码重新散列

Laravel 的默认密码散列算法是 bcrypt。可以通过应用程序的 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量来调整 bcrypt 哈希的 "工作因子"。

通常，随着 CPU / GPU 处理能力的增加，bcrypt 的工作因子应该随时间增加。如果您提高了应用程序的 bcrypt 工作因子，Laravel 将优雅地并自动地重新散列用户密码，因为用户通过 Laravel 的启动工具包或在您通过 `attempt` 方法手动认证用户时进行认证。

通常，自动密码重新散列不应干扰您的应用程序；然而，您可以通过发布 `hashing` 配置文件来禁用此行为：

```shell
php artisan config:publish hashing
```

一旦配置文件被发布，您可以将 `rehash_on_login` 配置值设置为 `false`：

```php
'rehash_on_login' => false,
```

## 事件

在认证过程中，Laravel 会调度各种 [事件](/docs/11/digging-deeper/events)。您可以为以下任何事件[定义侦听器](/docs/11/digging-deeper/events)：

| 事件名称                                     |
| -------------------------------------------- |
| `Illuminate\Auth\Events\Registered`          |
| `Illuminate\Auth\Events\Attempting`          |
| `Illuminate\Auth\Events\Authenticated`       |
| `Illuminate\Auth\Events\Login`               |
| `Illuminate\Auth\Events\Failed`              |
| `Illuminate\Auth\Events\Validated`           |
| `Illuminate\Auth\Events\Verified`            |
| `Illuminate\Auth\Events\Logout`              |
| `Illuminate\Auth\Events\CurrentDeviceLogout` |
| `Illuminate\Auth\Events\OtherDeviceLogout`   |
| `Illuminate\Auth\Events\Lockout`             |
| `Illuminate\Auth\Events\PasswordReset`       |
