---
title: Laravel 重置密码
---

# 重置密码

[[toc]]

## 简介

大多数网络应用程序提供了一种让用户重置他们忘记密码的方式。为了避免你创建每一个应用程序时都需要手动重新实施这一功能，Laravel 提供了便捷的服务来发送密码重置链接和安全地重置密码。

> [!NOTE]
> 想要快速开始吗？在一个新的 Laravel 应用程序中安装 Laravel [应用程序启动工具包](/docs/11/getting-started/starter-kits)。Laravel 的启动工具包将帮你搭建整个认证系统的脚手架，包括重置忘记的密码。

### 模型准备

在使用 Laravel 的密码重置功能之前，你的应用程序的 `App\Models\User` 模型必须使用 `Illuminate\Notifications\Notifiable` trait。通常，这个 trait 已经包含在新 Laravel 应用程序创建的默认 `App\Models\User` 模型中。

接下来，验证你的 `App\Models\User` 模型是否实现了 `Illuminate\Contracts\Auth\CanResetPassword` 契约。框架中已包含的 `App\Models\User` 模型已经实现了这个接口，并使用 `Illuminate\Auth\Passwords\CanResetPassword` trait 包含实现该接口所需的方法。

### 数据库准备

必须创建一个表来存储应用程序的密码重置令牌。通常，这已包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

### 配置可信主机

默认情况下，Laravel 会响应它收到的所有请求，不管 HTTP 请求的 `Host` 头部内容如何。此外，在网络请求期间生成应用程序绝对 URL 时将使用 `Host` 头部的值。

通常，你应该配置你的网络服务器，比如 Nginx 或 Apache，只发送与给定主机名匹配的请求给你的应用程序。然而，如果你没有权限直接自定义你的网络服务器，并且需要指导 Laravel 只响应某些主机名，你可以通过在应用程序的 `bootstrap/app.php` 文件中使用 `trustHosts` 中间件方法来做到这一点。当你的应用程序提供密码重置功能时，这一点尤为重要。

要了解更多关于这个中间件方法的信息，请参阅 [`TrustHosts` 中间件文档](/docs/11/basics/requests#configuring-trusted-hosts)。

## 路由

为了正确实现支持用户重置密码，我们需要定义几个路由。首先，我们需要一对路由来处理用户通过电子邮件地址请求密码重置链接。其次，我们需要一对路由来处理在用户点击电子邮件中的密码重置链接并完成密码重置表单后实际重置密码的情况。

### 请求密码重置链接

#### 密码重置链接请求表单

首先，我们将定义请求密码重置链接所需的路由。开始时，我们将定义一个路由，该路由返回一个带有密码重置链接请求表单的视图：

```php
Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->middleware('guest')->name('password.request');
```

该路由返回的视图应该有一个包含 `email` 字段的表单，用户可以通过该字段为给定的电子邮件地址请求一个密码重置链接。

#### 处理表单提交

接下来，我们将定义一个路由来处理“忘记密码”视图的表单提交请求。此路由负责验证电子邮件地址并将密码重置请求发送给相应的用户：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

Route::post('/forgot-password', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::RESET_LINK_SENT
                ? back()->with(['status' => __($status)])
                : back()->withErrors(['email' => __($status)]);
})->middleware('guest')->name('password.email');
```

继续之前，让我们更详细地检查这个路由。首先，验证请求的 `email` 属性。接下来，我们将使用 Laravel 内置的“密码代理”（通过 `Password` facade）给用户发送一个密码重置链接。密码代理将负责通过给定的字段（在这个例子中，是电子邮件地址）检索用户，并通过 Laravel 内置的[通知系统](/docs/11/digging-deeper/notifications)向用户发送密码重置链接。

`sendResetLink` 方法返回一个“状态”简写。这个状态可以通过 Laravel 的[本地化](/docs/11/digging-deeper/localization)助手来翻译，以便向用户显示他们请求状态的用户友好消息。密码重置状态的翻译由应用程序的 `lang/{lang}/passwords.php` 语言文件确定。状态简写的每一个可能值的条目都位于 `passwords` 语言文件中。

> [!NOTE]
> 默认情况下，Laravel 应用程序框架不包括 `lang` 目录。如果你想自定义 Laravel 的语言文件，你可以通过 `lang:publish` Artisan 命令发布它们。

你可能想知道当调用 `Password` facade 的 `sendResetLink` 方法时，Laravel 如何知道如何从应用程序的数据库中检索用户记录。Laravel 密码代理利用你的认证系统的“用户提供者”来检索数据库记录。在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置密码代理使用的用户提供者。要了解更多关于编写自定义用户提供者的信息，请查阅[认证文档](/docs/11/security/authentication#adding-custom-user-providers)。

> [!NOTE]
> 当你手动实现密码重置时，你需要自己定义视图和路由的内容。如果你希望获得包括所有必要的认证和验证逻辑的脚手架，请查看 [Laravel 应用程序启动工具包](/docs/11/getting-started/starter-kits)。

### 重置密码

#### 密码重置表单

接下来，我们将定义在用户点击电子邮件中的密码重置链接并提供新密码后实际上重置密码所需的路由。首先，让我们定义显示密码重置表单的路由，该表单在用户点击重置密码链接时显示。这个路由将接收一个 `token` 参数，我们稍后将使用它来验证密码重置请求：

```php
Route::get('/reset-password/{token}', function (string $token) {
    return view('auth.reset-password', ['token' => $token]);
})->middleware('guest')->name('password.reset');
```

该路由返回的视图应该显示一个包含 `email` 字段，`password` 字段，`password_confirmation` 字段和一个隐藏的 `token` 字段的表单，这个隐藏字段应该包含我们路由接收到的秘密 `$token` 的值。

#### 处理表单提交

当然，我们需要定义一个路由来实际处理密码重置表单提交。这条路由负责验证传入的请求并在数据库中更新用户的密码：

```php
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password)
            ])->setRememberToken(Str::random(60));

            $user->save();

            event(new PasswordReset($user));
        }
    );

    return $status === Password::PASSWORD_RESET
                ? redirect()->route('login')->with('status', __($status))
                : back()->withErrors(['email' => [__($status)]]);
})->middleware('guest')->name('password.update');
```

继续之前，让我们更详细地检查这个路由。首先，验证请求的 `token`，`email` 和 `password` 属性。接下来，我们将使用 Laravel 内置的“密码代理”（通过 `Password` facade）来验证密码重置请求的凭据。

如果提供给密码代理的令牌、电子邮件地址和密码有效，那么传递给 `reset` 方法的闭包将被调用。在这个闭包中，接收到用户实例和传递给密码重置表单的明文密码，我们可以在数据库中更新用户的密码。

`reset` 方法返回一个“状态”简写。这个状态可以通过 Laravel 的[本地化](/docs/11/digging-deeper/localization)助手来翻译，以便向用户显示他们请求状态的用户友好消息。密码重置状态的翻译由应用程序的 `lang/{lang}/passwords.php` 语言文件确定。状态简写的每一个可能值的条目都位于 `passwords` 语言文件中。如果你的应用程序不包含 `lang` 目录，你可以使用 `lang:publish` Artisan 命令来创建它。

继续之前，你可能想知道当调用 `Password` facade 的 `reset` 方法时，Laravel 如何知道如何从应用程序的数据库中检索用户记录。Laravel 密码代理利用你的认证系统的“用户提供者”来检索数据库记录。在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置密码代理使用的用户提供者。要了解更多关于编写自定义用户提供者的信息，请查阅[认证文档](/docs/11/security/authentication#adding-custom-user-providers)。

## 删除过期令牌

密码重置令牌在过期后仍然会存在于数据库中。然而，你可以很容易地使用 `auth:clear-resets` Artisan 命令来删除这些记录：

```shell
php artisan auth:clear-resets
```

如果你想要自动化这个过程，可以考虑将命令添加到你应用程序的[调度器](/docs/11/digging-deeper/scheduling)中：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('auth:clear-resets')->everyFifteenMinutes();
```

## 自定义

#### 重置链接自定义

你可以使用 `ResetPassword` 通知类提供的 `createUrlUsing` 方法来自定义密码重置链接的 URL。此方法接受一个闭包，该闭包接收正在接收通知的用户示例以及密码重置链接令牌。通常，你应该在你的 `App\Providers\AppServiceProvider` 服务提供商的 `boot` 方法中调用此方法：

```php
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    ResetPassword::createUrlUsing(function (User $user, string $token) {
        return 'https://example.com/reset-password?token='.$token;
    });
}
```

#### 重置电子邮件自定义

你可以很容易地修改用于发送密码重置链接给用户的通知类。要开始，请在你的 `App\Models\User` 模型上覆盖 `sendPasswordResetNotification` 方法。在这个方法中，你可以使用任何你自己创建的[通知类](/docs/11/digging-deeper/notifications)发送通知给用户。密码重置的 `$token` 是方法接收的第一个参数。你可以使用这个 `$token` 构建你选择的密码重置 URL 并向用户发送通知：

```php
use App\Notifications\ResetPasswordNotification;

/**
 * 给用户发送一个密码重置通知。
 *
 * @param  string  $token
 */
public function sendPasswordResetNotification($token): void
{
    $url = 'https://example.com/reset-password?token='.$token;

    $this->notify(new ResetPasswordNotification($url));
}
```
