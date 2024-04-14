---
title: Laravel 加密
---

# 加密

[[toc]]

## 介绍

Laravel 的加密服务提供了一个简单、便捷的接口，通过 OpenSSL 使用 AES-256 和 AES-128 加密来加密和解密文本。所有 Laravel 加密的值都使用消息认证码（MAC）签名，以确保一旦加密，它们的底层值就无法被修改或篡改。

## 配置

在使用 Laravel 的加密器之前，你必须在你的 `config/app.php` 配置文件中设置 `key` 配置选项。这个配置值由 `APP_KEY` 环境变量控制。你应该使用 `php artisan key:generate` 命令来生成这个变量的值，因为 `key:generate` 命令将使用 PHP 的安全随机字节生成器为你的应用程序构建一个密码学上安全的密钥。通常，在 [Laravel 的安装过程](/docs/11/getting-started/installation)中，`APP_KEY` 环境变量的值会为您自动生成。

### 优雅地轮换加密密钥

如果你更改了应用程序的加密密钥，所有经过身份验证的用户会话都将从你的应用程序中注销。这是因为 Laravel 加密了每个 cookie，包括会话 cookies。此外，任何使用你之前的加密密钥加密的数据也将无法再解密。

为了缓解这个问题，Laravel 允许你在应用程序的 `APP_PREVIOUS_KEYS` 环境变量中列出你之前的加密密钥。这个变量可以包含你以前所有加密密钥的逗号分隔列表：

```ini
APP_KEY="base64:J63qRTDLub5NuZvP+kb8YIorGS6qFYHKVo6u7179stY="
APP_PREVIOUS_KEYS="base64:2nLsGFGzyoae2ax3EF2Lyq/hH6QghBGLIq5uL+Gp8/w="
```

当你设置这个环境变量时，Laravel 总是会在加密值时使用“当前”的加密密钥。然而，在解密值时，Laravel 首先尝试使用当前密钥，如果用当前密钥解密失败，Laravel 将尝试所有之前的密钥，直到其中一个密钥能够解密该值。

即使你的加密密钥被轮换，这种优雅解密的方法也允许用户无间断地继续使用你的应用程序。

## 使用加密器

#### 加密一个值

你可以使用 `Crypt` 门面提供的 `encryptString` 方法来加密一个值。所有加密的值都是使用 OpenSSL 和 AES-256-CBC 密码来加密的。此外，所有加密的值都带有一个消息认证码（MAC）签名。集成的消息认证码将防止任何被恶意用户篡改的值被解密。

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class DigitalOceanTokenController extends Controller
{
    /**
     * 为用户存储一个 DigitalOcean API 令牌。
     */
    public function store(Request $request): RedirectResponse
    {
        $request->user()->fill([
            'token' => Crypt::encryptString($request->token),
        ])->save();

        return redirect('/secrets');
    }
}
```

#### 解密一个值

你可以使用 `Crypt` 门面提供的 `decryptString` 方法来解密一个值。如果无法正确解密该值，例如当消息认证码无效时，将抛出一个 `Illuminate\Contracts\Encryption\DecryptException` 异常：

```php
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

try {
    $decrypted = Crypt::decryptString($encryptedValue);
} catch (DecryptException $e) {
    // ...
}
```
