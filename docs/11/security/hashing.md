# 散列

[[toc]]

## 介绍

Laravel 的 `Hash` 提供了安全的 Bcrypt 和 Argon2 散列功能，用于存储用户密码。如果您使用的是 [Laravel 应用启动工具包](/docs/11/getting-started/starter-kits)之一，默认会使用 Bcrypt 进行注册和验证。

Bcrypt 是散列密码的一个很好的选择，因为它的“工作因子”是可调的，这意味着随着硬件算力的增强，生成散列值的时间可以增加。散列密码时，慢是好事，算法散列密码的时间越长，恶意用户生成可能用于对应用程序进行暴力攻击的所有可能字符串散列值的“彩虹表”的时间就越长。

## 配置

默认情况下，当对数据进行散列时，Laravel 使用 `bcrypt` 散列驱动。然而，还支持其他几种散列驱动，包括 [`argon`](https://en.wikipedia.org/wiki/Argon2) 和 [`argon2id`](https://en.wikipedia.org/wiki/Argon2)。

您可以使用 `HASH_DRIVER` 环境变量来指定应用程序的散列驱动。但是，如果您想自定义 Laravel 的所有散列驱动选项，您应该使用 `config:publish` Artisan 命令发布完整的 `hashing` 配置文件：

```bash
php artisan config:publish hashing
```

## 基本用法

### 散列密码

您可以通过调用 `Hash` facade 的 `make` 方法来散列密码：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    /**
     * 更新用户的密码。
     */
    public function update(Request $request): RedirectResponse
    {
        // 验证新密码长度...

        $request->user()->fill([
            'password' => Hash::make($request->newPassword)
        ])->save();

        return redirect('/profile');
    }
}
```

#### 调整 Bcrypt 工作因子

如果您正在使用 Bcrypt 算法，`make` 方法允许您使用 `rounds` 选项管理算法的工作因子；然而，Laravel 管理的默认工作因子对于大多数应用程序来说是可接受的：

```php
$hashed = Hash::make('password', [
    'rounds' => 12,
]);
```

#### 调整 Argon2 工作因子

如果您正在使用 Argon2 算法，`make` 方法允许您使用 `memory`、`time` 和 `threads` 选项管理算法的工作因子；然而，Laravel 管理的默认值对于大多数应用程序来说是可接受的：

```php
$hashed = Hash::make('password', [
    'memory' => 1024,
    'time' => 2,
    'threads' => 2,
]);
```

> [!NOTE]  
> 关于这些选项的更多信息，请参考 [官方 PHP 文档关于 Argon 散列的内容](https://secure.php.net/manual/en/function.password-hash.php)。

### 验证密码是否与散列匹配

`Hash` facade 提供的 `check` 方法允许您验证给定的纯文本字符串是否对应一个给定的散列：

```php
if (Hash::check('plain-text', $hashedPassword)) {
    // 密码匹配...
}
```

### 判断密码是否需要重新散列

`Hash` facade 提供的 `needsRehash` 方法允许您确定自密码被散列以来哈希算法的工作因子是否发生了变化。一些应用程序选择在应用程序的认证过程中执行此检查：

```php
if (Hash::needsRehash($hashed)) {
    $hashed = Hash::make('plain-text');
}
```
