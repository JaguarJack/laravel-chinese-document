# Laravel Fortify

[[toc]]

## 简介

[Laravel Fortify](https://github.com/laravel/fortify) 是一个与前端框架无关的 Laravel 认证后端实现。Fortify 注册了实现 Laravel 所有认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。安装 Fortify 后，您可以运行 `route:list` Artisan 命令来查看 Fortify 注册的路由。

由于 Fortify 不提供自己的用户界面，它旨在与您自己的用户界面配合使用，该用户界面会向它注册的路由发起请求。我们将在本文档的其余部分详细讨论如何向这些路由发起请求。

> [!NOTE]  
> 请记住，Fortify 是一个旨在帮助您快速实现 Laravel 认证功能的包。**您不必使用它。** 您始终可以通过遵循 [authentication](/docs/11/security/authentication), [password reset](/docs/11/security/passwords), 和 [email verification](/docs/11/security/verification) 文档中的说明，手动与 Laravel 的认证服务进行交互。

### 什么是 Fortify？

如前所述，Laravel Fortify 是一个与前端框架无关的 Laravel 认证后端实现。Fortify 注册了实现 Laravel 所有认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。

**您不需要使用 Fortify 就可以使用 Laravel 的认证功能。** 您始终可以通过遵循 [authentication](/docs/11/security/authentication), [password reset](/docs/11/security/passwords), 和 [email verification](/docs/11/security/verification) 文档中的说明，手动与 Laravel 的认证服务进行交互。

如果您是 Laravel 的新手，您可能会希望在尝试使用 Laravel Fortify 之前探索 [Laravel Breeze](/docs/11/getting-started/starter-kits) 应用启动器。Laravel Breeze 为您的应用提供了一个认证脚手架，其中包括使用 [Tailwind CSS](https://tailwindcss.com) 构建的用户界面。与 Fortify 不同，Breeze 将其路由和控制器直接发布到您的应用程序中。这允许您在由 Laravel Fortify 为您实现这些功能之前，研究并熟悉 Laravel 的认证功能。

Laravel Fortify 实质上采用了 Laravel Breeze 的路由和控制器，并将它们作为一个不包含用户界面的包提供。这允许您仍然能够快速搭建应用程序认证层的后端实现，而不依赖于任何特定的前端观点。

### 何时应该使用 Fortify？

您可能想知道何时适合使用 Laravel Fortify。首先，如果您正在使用 Laravel 的 [应用启动器](/docs/11/getting-started/starter-kits) 之一，那么您无需安装 Laravel Fortify，因为所有的 Laravel 应用启动器已经提供了完整的认证实现。

如果您没有使用应用启动器，并且您的应用需要认证功能，那么您有两个选择：手动实现您的应用认证功能或使用 Laravel Fortify 提供这些功能的后端实现。

如果您选择安装 Fortify，您的用户界面将向本文档中详述的 Fortify 的认证路由发出请求，以进行用户认证和注册。

如果您选择手动与 Laravel 的认证服务交互而不使用 Fortify，您可以通过遵循 [authentication](/docs/11/security/authentication), [password reset](/docs/11/security/passwords), 和 [email verification](/docs/11/security/verification) 文档中的说明进行操作。

#### Laravel Fortify 和 Laravel Sanctum

一些开发人员对于 [Laravel Sanctum](/docs/11/packages/sanctum) 和 Laravel Fortify 之间的区别感到困惑。因为这两个包解决了两个不同但相关的问题，Laravel Fortify 和 Laravel Sanctum 并不相互排斥或竞争。

Laravel Sanctum 仅关注管理 API 令牌和使用会话 cookie 或令牌对现有用户进行认证。Sanctum 不提供处理用户注册、密码重置等的路由。

如果您正在尝试为提供 API 或用作单页应用程序后端的应用程序手动构建认证层，那么您很可能会同时使用 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（API 令牌管理、会话认证）。

## 安装

要开始使用，请使用 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `fortify:install` Artisan 命令发布 Fortify 的资源：

```shell
php artisan fortify:install
```

该命令将发布 Fortify 的动作到您的 `app/Actions` 目录，如果该目录不存在，将会创建它。此外，`FortifyServiceProvider`、配置文件和所有必要的数据库迁移都将被发布。

接下来，您应该迁移您的数据库：

```shell
php artisan migrate
```

### Fortify 功能

`fortify` 配置文件包含一个 `features` 配置数组。此数组定义了 Fortify 将默认公开哪些后端路由/功能。如果您没有与 [Laravel Jetstream](https://jetstream.laravel.com) 结合使用 Fortify，我们建议您仅启用以下功能，这些是大多数 Laravel 应用程序提供的基本认证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

### 禁用视图

默认情况下，Fortify 定义了旨在返回视图的路由，例如登录屏幕或注册屏幕。然而，如果您正在构建一个由 JavaScript 驱动的单页应用程序，您可能不需要这些路由。因此，您可以通过在应用程序的 `config/fortify.php` 配置文件中将 `views` 配置值设置为 `false` 来完全禁用这些路由：

```php
'views' => false,
```

#### 禁用视图和密码重置

如果您选择禁用 Fortify 的视图，并且您将为您的应用程序实施密码重置功能，您仍应定义一个名为 `password.reset` 的路由，负责显示您的应用程序的"重置密码"视图。这是必要的，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知将通过 `password.reset` 命名路由生成密码重置 URL。

## 认证

要开始，我们需要指导 Fortify 如何返回我们的“登录”视图。请记住，Fortify 是一个无头认证库。如果您想要一个已经为您完成的 Laravel 认证功能的前端实现，您应该使用[应用启动工具包](/docs/11/getting-started/starter-kits)。

所有关于认证视图呈现逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，您应该从应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法。Fortify 将负责定义返回此视图的 `/login` 路由：

```php
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Fortify::loginView(function () {
        return view('auth.login');
    });

    // ...
}
```

您的登录模板应该包括一个发送 POST 请求到 `/login` 的表单。`/login` 端点期望接收一个字符串 `email` / `username` 和一个 `password`。电子邮件 / 用户名字段的名称应该与 `config/fortify.php` 配置文件中的 `username` 值匹配。此外，还可以提供一个布尔型 `remember` 字段，以指示用户希望使用 Laravel 提供的 "记住我" 功能。

如果登录尝试成功，Fortify 将重定向您到应用程序的 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是一个 XHR 请求，则将返回一个 200 HTTP 响应。

如果请求不成功，用户将被重定向回登录屏幕，并且通过共享的 `$errors` [Blade 模板变量](/docs/11/basics/validation#quick-displaying-the-validation-errors)，您可以取得验证错误。或者，在 XHR 请求的情况下，验证错误将以 422 HTTP 响应返回。

### 自定义用户认证

Fortify 会自动根据提供的凭据和为您的应用程序配置的认证守卫来检索和认证用户。然而，有时您可能希望完全自定义如何认证登录凭据和检索用户。幸运的是，Fortify 允许您使用 `Fortify::authenticateUsing` 方法轻松完成此操作。

该方法接受一个闭包，该闭包接收传入的 HTTP 请求。闭包负责验证请求附加的登录凭据并返回相关用户实例。如果凭据无效或未找到用户，则应由闭包返回 `null` 或 `false`。通常，应在 `FortifyServiceProvider` 的 `boot` 方法中调用此方法：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Fortify::authenticateUsing(function (Request $request) {
        $user = User::where('email', $request->email)->first();

        if ($user &&
            Hash::check($request->password, $user->password)) {
            return $user;
        }
    });

    // ...
}
```

#### 认证守卫

您可以在应用程序的 `fortify` 配置文件中自定义 Fortify 使用的认证守卫。然而，您应确保配置的守卫是 `Illuminate\Contracts\Auth\StatefulGuard` 的实现。如果您正试图使用 Laravel Fortify 来认证 SPA，那么您应结合使用 Laravel 的默认 `web` 守卫和 [Laravel Sanctum](https://laravel.com/docs/sanctum)。

### 自定义认证流水线

Laravel Fortify 通过一系列可调用的类验证登录请求。如果您愿意，您可以定义一个自定义的应该通过的类的流水线来处理登录请求。每个类都应该有一个 `__invoke` 方法，该方法接收传入的 `Illuminate\Http\Request` 实例，并且，像[中间件](/docs/11/basics/middleware)一样，有一个 `$next` 变量，该变量被调用以将请求传递给流水线中的下一个类。

要定义您的自定义流水线，您可以使用 `Fortify::authenticateThrough` 方法。该方法接受一个闭包，应该返回登录请求要通过的类数组。通常，应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这个方法。

下面的示例包含了您在进行自己的修改时可以用作起点的默认流水线定义：

```php
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

Fortify::authenticateThrough(function (Request $request) {
    return array_filter([
            config('fortify.limiters.login') ? null : EnsureLoginIsNotThrottled::class,
            Features::enabled(Features::twoFactorAuthentication()) ? RedirectIfTwoFactorAuthenticatable::class : null,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
    ]);
});
```

### 自定义重定向

如果登录尝试成功，Fortify 将重定向您到应用程序的 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是一个 XHR 请求，将返回一个 200 HTTP 响应。用户注销应用程序后，将被重定向到 `/` URI。

如果您需要高级自定义该行为，您可以绑定实现了 `LoginResponse` 和 `LogoutResponse` 契约的实现到 Laravel [服务容器](/docs/11/architecture-concepts/container)。通常，这应该在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `register` 方法中完成：

```php
use Laravel\Fortify\Contracts\LogoutResponse;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    $this->app->instance(LogoutResponse::class, new class implements LogoutResponse {
        public function toResponse($request)
        {
            return redirect('/');
        }
    });
}
```

## 两因素认证

启用 Fortify 的两因素认证功能时，用户在认证过程中需要输入六位数的数字令牌。此令牌使用基于时间的一次性密码 (TOTP) 生成，可以从任何兼容 TOTP 的移动认证应用程序中检索，例如 Google Authenticator。

在开始之前，您应确保应用程序的 `App\Models\User` 模型使用了 `Laravel\Fortify\TwoFactorAuthenticatable` 特性：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use Notifiable, TwoFactorAuthenticatable;
}
```

接下来，您应该在应用程序中构建一个屏幕，用户可以在其中管理他们的两因素认证设置。此屏幕应允许用户启用和禁用两因素认证以及重新生成他们的两因素认证恢复代码。

> 默认情况下，`fortify` 配置文件的 `features` 数组指示 Fortify 在修改两因素认证设置之前需要密码确认。因此，您的应用程序应在继续之前实施 Fortify 的[密码确认](#password-confirmation)功能。

### 启用两因素认证

要开始启用两因素认证，您的应用程序应向 Fortify 定义的 `/user/two-factor-authentication` 端点发送 POST 请求。如果请求成功，用户将被重定向回之前的 URL，并且 `status` 会话变量将设置为 `two-factor-authentication-enabled`。您可以在模板中检测这个 `status` 会话变量以显示适当的成功消息。如果请求是一个 XHR 请求，将返回一个 200 HTTP 响应。

在选择启用两因素认证后，用户仍必须通过提供有效的两因素认证代码来“确认”他们的两因素认证配置。所以，您的"成功"消息应该指导用户两因素认证确认仍然是必需的：

```html
@if (session('status') == 'two-factor-authentication-enabled')
<div class="mb-4 text-sm font-medium">Please finish configuring two factor authentication below.</div>
@endif
```

接下来，您应该为用户显示两因素认证 QR 码，以便用户扫描到他们的验证器应用程序中。如果您使用 Blade 来渲染应用程序的前端，您可以使用用户实例上的 `twoFactorQrCodeSvg` 方法检索 QR 码 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果您正在构建一个由 JavaScript 驱动的前端，您可以向 `/user/two-factor-qr-code` 端点发送一个 XHR GET 请求来检索用户的两因素认证 QR 码。此端点将返回一个包含 `svg` 键的 JSON 对象。

#### 确认两因素认证

除了显示用户的两因素认证 QR 码外，您还应该提供一个文本输入框，用户可以在其中提供有效的认证码来“确认”他们的两因素认证配置。此代码应通过发送 POST 请求到 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点提供给 Laravel 应用程序。

如果请求成功，用户将被重定向回之前的 URL，并且 `status` 会话变量将设置为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
<div class="mb-4 text-sm font-medium">Two factor authentication confirmed and enabled successfully.</div>
@endif
```

如果对两因素认证确认端点的请求是通过 XHR 请求进行的，则将返回一个 200 HTTP 响应。

#### 显示恢复代码

您还应该显示用户的两因素恢复代码。这些恢复代码允许用户在失去对其移动设备的访问时进行身份验证。如果您使用 Blade 来渲染应用程序的前端，您可以通过已认证的用户实例访问恢复代码：

```php
(array) $request->user()->recoveryCodes();
```

如果您正在构建一个由 JavaScript 驱动的前端，您可以对 `/user/two-factor-recovery-codes` 端点发起一个 XHR GET 请求。此端点将返回一个包含用户恢复代码的 JSON 数组。

要重新生成用户的恢复代码，您的应用程序应该对 `/user/two-factor-recovery-codes` 端点发送一个 POST 请求。

### 使用两因素认证进行认证

在认证过程中，Fortify 将自动将用户重定向到您应用程序的两因素认证挑战屏幕。然而，如果您的应用程序正在进行一个 XHR 登录请求，那么在成功认证尝试之后返回的 JSON 响应将包含一个具有 `two_factor` 布尔属性的 JSON 对象。您应检查此值以了解是否应将用户重定向到应用程序的两因素认证挑战屏幕。

要开始实现两因素认证功能，我们需要指导 Fortify 如何返回我们的两因素认证挑战视图。所有关于 Fortify 认证视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法自定义。通常，您应该在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用程序服务。
 */
public function boot(): void
{
    Fortify::twoFactorChallengeView(function () {
        return view('auth.two-factor-challenge');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/two-factor-challenge` 路由。您的 `two-factor-challenge` 模板应包含一个向 `/two-factor-challenge` 端点发起 POST 请求的表单。`/two-factor-challenge` 行为期望一个包含有效 TOTP 令牌或包含用户某个恢复代码的 `recovery_code` 字段。

如果登录尝试成功，Fortify 将重定向用户到您应用程序的 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是一个 XHR 请求，则会返回一个 204 HTTP 响应。

如果请求不成功，用户将被重定向回两因素挑战屏幕，并且您可以通过共享 `$errors` [Blade 模板变量](/docs/11/basics/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误将以一个 422 HTTP 响应返回。

### 禁用两因素认证

要禁用两因素认证，您的应用程序应该对 `/user/two-factor-authentication` 端点发送一个 DELETE 请求。请记住，在调用 Fortify 的两因素认证端点之前需要 [密码确认](#password-confirmation)。

## 注册

为了开始实现我们应用程序的注册功能，我们需要指导 Fortify 如何返回我们的“注册”视图。请记住，Fortify 是一个无头认证库。如果您想要一个已为您完成的 Laravel 认证功能的前端实现，您应该使用[应用启动工具包](/docs/11/getting-started/starter-kits)。

所有关于 Fortify 认证视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法自定义。通常，您应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Fortify::registerView(function () {
        return view('auth.register');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/register` 路由。您的 `register` 模板应包含一个向由 Fortify 定义的 `/register` 端点发起 POST 请求的表单。

`/register` 端点期待一个字符串 `name`，字符串电子邮件地址 / 用户名，`password` 和 `password_confirmation` 字段。电子邮件 / 用户名字段的名称应与您的应用程序的 `fortify` 配置文件中定义的 `username` 配置值匹配。

如果注册尝试成功，Fortify 将重定向用户到您应用程序的 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果请求是一个 XHR 请求，则返回一个 201 HTTP 响应。

如果请求不成功，用户将被重定向回注册屏幕，并且您可以通过共享 `$errors` [Blade 模板变量](/docs/11/basics/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误将以一个 422 HTTP 响应返回。

### 自定义注册

用户验证和创建过程可以通过修改在安装 Laravel Fortify 时生成的 `App\Actions\Fortify\CreateNewUser` 动作来自定义。

## 密码重置

### 请求密码重置链接

为了开始实现我们应用程序的密码重置功能，我们需要指导 Fortify 如何返回我们的“忘记密码”视图。请记住，Fortify 是一个无头认证库。如果您想要一个已为您完成的 Laravel 认证功能的前端实现，您应该使用[应用启动工具包](/docs/11/getting-started/starter-kits)。

所有关于 Fortify 认证视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法自定义。通常，您应在您的应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Fortify::requestPasswordResetLinkView(function () {
        return view('auth.forgot-password');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/forgot-password` 端点。您的 `forgot-password` 模板应包含一个向 `/forgot-password` 端点发起 POST 请求的表单。

`/forgot-password` 端点期待一个字符串 `email` 字段。此字段 / 数据库列的名称应与您的应用程序的 `fortify` 配置文件中的 `email` 配置值匹配。

#### 处理密码重置链接请求响应

如果密码重置链接请求成功，Fortify 将将用户重定向回 `/forgot-password` 端点，并向用户发送包含安全链接的电子邮件，用户可以使用该链接重置其密码。如果请求是一个 XHR 请求，则返回一个 200 HTTP 响应。

在成功请求后被重定向回 `/forgot-password` 端点后，`status` 会话变量可用于显示密码重置链接请求尝试的状态。

`$status` 会话变量的值将与您应用程序的 `passwords` [语言文件](//docs/11/digging-deeper/localization)中定义的翻译字符串之一匹配。如果您想自定义此值，并且尚未发布 Laravel 的语言文件，您可以通过 `lang:publish` Artisan 命令来执行：

```html
@if (session('status'))
<div class="mb-4 text-sm font-medium text-green-600">{{ session('status') }}</div>
@endif
```

如果请求不成功，用户将被重定向回请求密码重置链接屏幕，并且您可以通过共享 `$errors` [Blade 模板变量](/docs/11/basics/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误将以一个 422 HTTP 响应返回。

### 重置密码

为了完成我们应用程序的密码重置功能，我们需要指导 Fortify 如何返回我们的“重置密码”视图。

所有关于 Fortify 视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法自定义。通常，您应该在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Fortify::resetPasswordView(function (Request $request) {
        return view('auth.reset-password', ['request' => $request]);
    });

    // ...
}
```

Fortify 将负责定义显示此视图的路由。您的 `reset-password` 模板应包含一个向 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点期待一个字符串 `email` 字段，一个 `password` 字段，一个 `password_confirmation` 字段，以及一个名为 `token` 的隐藏字段，包含 `request()->route('token')` 的值。"email" 字段 / 数据库列的名称应与您的应用程序的 `fortify` 配置文件中定义的 `email` 配置值匹配。

#### 处理密码重置响应

如果密码重置请求成功，Fortify 将重定向回 `/login` 路由，以便用户可以使用他们的新密码登录。此外，将设置一个 `status` 会话变量，以便您可以在登录屏幕上显示重置的成功状态：

```blade
@if (session('status'))
    <div class="mb-4 text-sm font-medium text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是一个 XHR 请求，将返回一个 200 HTTP 响应。

如果请求不成功，用户将被重定向回重置密码屏幕，并且您可以通过共享的 `$errors` [Blade 模板变量](/docs/11/basics/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误将以 422 HTTP 响应返回。

### 自定义密码重置

密码重置过程可以通过修改当您安装 Laravel Fortify 时生成的 `App\Actions\ResetUserPassword` 动作来自定义。

## 邮箱验证

在注册之后，您可能希望用户验证他们的电子邮件地址，然后才能继续访问您的应用程序。首先，确保在 `fortify` 配置文件的 `features` 数组中启用了 `emailVerification` 功能。接下来，您应确保您的 `App\Models\User` 类实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两个设置步骤后，新注册的用户将收到一封电子邮件，提示他们验证他们的电子邮件地址所有权。然而，我们需要通知 Fortify 如何显示电子邮件验证屏幕，告知用户他们需要点击电子邮件中的验证链接。

所有关于 Fortify 视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法自定义。通常，您应该在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Fortify::verifyEmailView(function () {
        return view('auth.verify-email');
    });

    // ...
}
```

Fortify 将负责在用户被 Laravel 内建的 `verified` 中间件重定向到 `/email/verify` 端点时显示此视图的路由。

您的 `verify-email` 模板应包含一个信息性消息，指导用户点击发送到他们电子邮件地址的电子邮件验证链接。

#### 重新发送电子邮件验证链接

如果您愿意，您可以在应用程序的 `verify-email` 模板中添加一个触发 POST 请求到 `/email/verification-notification` 端点的按钮。当此端点收到请求时，将向用户发送一封新的验证电子邮件链接，如果之前的链接被意外删除或丢失，允许用户获得新的验证链接。

如果重新发送验证链接电子邮件的请求成功，Fortify 将重定向用户回到 `/email/verify` 端点，并附带一个 `status` 会话变量，允许您向用户显示操作成功的信息性消息。如果请求是一个 XHR 请求，将返回一个 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 text-sm font-medium text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

### 保护路由

要指定路由或一组路由需要用户已验证其电子邮件地址，您应该将 Laravel 内建的 `verified` 中间件附加到路由上。`verified` 中间件别名由 Laravel 自动注册，并充当 `Illuminate\Routing\Middleware\ValidateSignature` 中间件的别名：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

## 密码确认

在构建您的应用程序时，您可能偶尔会有一些动作，这些动作应该要求用户在执行操作之前确认他们的密码。通常，这些路由受到 Laravel 内建的 `password.confirm` 中间件的保护。

为了开始实现密码确认功能，我们需要指导 Fortify 如何返回我们应用程序的“密码确认”视图。请记住，Fortify 是一个无头认证库。如果您想要一个已为您完成的 Laravel 认证功能的前端实现，您应该使用[应用启动工具包](/docs/11/getting-started/starter-kits)。

所有关于 Fortify 视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法自定义。通常，您应该在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 初始化任何应用程序服务。
 */
public function boot(): void
{
    Fortify::confirmPasswordView(function () {
        return view('auth.confirm-password');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/user/confirm-password` 端点。您的 `confirm-password` 模板应包含一个向 `/user/confirm-password` 端点发起 POST 请求的表单。`/user/confirm-password` 端点期待一个包含用户当前密码的 `password` 字段。

如果密码与用户当前密码匹配，Fortify 将重定向用户到他们试图访问的路由。如果请求是一个 XHR 请求，将返回一个 201 HTTP 响应。

如果请求不成功，用户将被重定向回确认密码屏幕，并且您可以通过共享的 `$errors` Blade 模板变量获取验证错误。或者，在 XHR 请求的情况下，验证错误将以 422 HTTP 响应返回。
