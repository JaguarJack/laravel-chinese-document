---
title: Laravel 邮箱验证
---

# 邮箱验证

[[toc]]

## 介绍

许多网络应用程序要求用户在使用应用程序之前验证他们的邮箱地址。Laravel 提供了内置便捷的服务，用于发送和验证邮箱验证请求，而不是让您手动为您创建的每个应用程序重新实现这个功能。

[!NOTE]

> 想要快速入门？在一个全新的 Laravel 应用程序中安装一个 [Laravel 应用程序起始套件](/docs/11/getting-started/starter-kits)。起始套件将会为您搭建包括邮箱验证支持在内的所有认证系统的框架。

### 模型准备

开始之前，验证您的 `App\Models\User` 模型是否实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use Notifiable;

    // ...
}
```

一旦模型添加了这个接口，新注册的用户将自动收到一封包含邮箱验证链接的邮件。这是因为 Laravel 会自动为 `Illuminate\Auth\Events\Registered` 事件注册 `Illuminate\Auth\Listeners\SendEmailVerificationNotification` [监听器](/docs/11/digging-deeper/events)。

如果您是在应用程序中手动实现注册，而不是使用 [起始套件](/docs/11/getting-started/starter-kits)，您应该确保在用户注册成功后调度 `Illuminate\Auth\Events\Registered` 事件：

```php
use Illuminate\Auth\Events\Registered;

event(new Registered($user));
```

### 数据库准备

接下来，您的 `users` 表必须包含一个 `email_verified_at` 列来存储用户邮箱地址验证的日期和时间。这通常在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中包含。

## 路由

为了正确实现邮箱验证，需要定义三个路由。首先，需要定义一个路由，提示用户他们应该点击 Laravel 在注册后发送给他们的验证邮件中的邮箱验证链接。

其次，需要定义一个路由来处理用户点击邮箱中的邮箱验证链接时生成的请求。

第三，如果用户意外地丢失了第一个验证链接，需要定义一个路由来重新发送验证链接。

### 邮箱验证通知

如前所述，应定义一个路由，该路由将返回一个视图，指示用户点击 Laravel 在注册后通过邮件发送给他们的邮箱验证链接。如果用户在首次验证他们的邮箱地址之前尝试访问应用程序的其他部分，将向用户显示此视图。只要您的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，链接就会自动通过邮件发送给用户：

```php
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
```

返回电子邮件验证通知的路由应命名为 `verification.notice`。确保路由被指定了这个确切的名称是非常重要的，因为 Laravel 包含的 `verified` 中间件如果用户没有验证他们的电子邮件地址，将自动重定向到此路由名称。

[!NOTE]

> 手动实现电子邮件验证时，您需要定义验证通知视图的内容。如果您想要一个包含所有必要的认证和验证视图的框架，请查看 [Laravel 应用程序起始套件](/docs/11/getting-started/starter-kits)。

### 邮箱验证处理器

接下来，我们需要定义一个路由，该路由将处理用户点击邮箱中的邮箱验证链接时生成的请求。此路由应命名为 `verification.verify` 并分配 `auth` 和 `signed` 中间件：

```php
use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('/home');
})->middleware(['auth', 'signed'])->name('verification.verify');
```

在继续之前，让我们仔细看看这个路由。首先，您会注意到我们正在使用 `EmailVerificationRequest` 请求类型，而不是典型的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 包含的一个 [表单请求](/docs/11/basics/validation#form-request-validation)，该请求将自动验证请求的 `id` 和 `hash` 参数。

接下来，我们可以直接调用请求上的 `fulfill` 方法。这个方法将调用经过身份验证的用户的 `markEmailAsVerified` 方法，并调度 `Illuminate\Auth\Events\Verified` 事件。`markEmailAsVerified` 方法透过 `Illuminate\Foundation\Auth\User` 基类，可用于默认的 `App\Models\User` 模型。一旦用户的邮箱地址被验证，您可以重定向他们到您希望的地方。

### 重新发送验证邮件

有时，用户可能会误放或意外删除邮箱地址验证邮件。为了解决这个问题，您可能希望建议定义一个路由，允许用户请求重新发送验证邮件。您可以通过在 [邮箱验证通知视图](#the-email-verification-notice) 中放置一个简单的表单提交按钮来请求此路由：

```php
use Illuminate\Http\Request;

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
```

### 路由保护

[路由中间件](/docs/11/basics/middleware) 可用于仅允许经过验证的用户访问给定的路由。Laravel 包含了 `verified` [中间件别名](/docs/11/basics/middleware#middleware-alias)，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件类的一个别名。由于这个别名已经由 Laravel 自动注册，您需要做的就是将 `verified` 中间件附加到路由定义上。通常，这个中间件与 `auth` 中间件配对使用：

```php
Route::get('/profile', function () {
    // 只有经过验证的用户才能访问此路由...
})->middleware(['auth', 'verified']);
```

如果未经验证的用户尝试访问已分配此中间件的路由，他们将自动被重定向到 `verification.notice` [命名路由](/docs/11/basics/routing#named-routes)。

## 自定义

#### 邮箱验证自定义

尽管默认的邮箱验证通知应该满足大多数应用程序的要求，但 Laravel 允许您自定义构造邮箱验证邮件消息的方式。

要开始，请将一个闭包传递给 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法。该闭包将接收接收通知的可通知模型实例以及用户必须访问的签名邮箱验证 URL 以验证他们的邮箱地址。闭包应返回 `Illuminate\Notifications\Messages\MailMessage` 的一个实例。通常，您应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

```php
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    // ...

    VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
        return (new MailMessage)
            ->subject('Verify Email Address')
            ->line('点击下面的按钮以验证您的邮箱地址。')
            ->action('Verify Email Address', $url);
    });
}
```

> [!NOTE]
> 要了解更多关于邮件通知的信息，请查阅 [邮件通知文档](/docs/11/digging-deeper/notifications#mail-notifications)。

## 事件

在使用 [Laravel 应用程序起始套件](/docs/11/getting-started/starter-kits) 时，Laravel 在邮箱验证过程中会派发一个 `Illuminate\Auth\Events\Verified` [事件](/docs/11/digging-deeper/events)。如果您手动处理应用程序的电子邮件验证，您可能希望在验证完成后手动派发这些事件。
