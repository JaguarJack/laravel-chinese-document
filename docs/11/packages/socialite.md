# Laravel Socialite

[[toc]]

## 简介

除了常规的基于表单的认证之外，Laravel 还提供了一种使用 [Laravel Socialite](https://github.com/laravel/socialite)通过 OAuth 提供商进行认证的简单、方便的方式。Socialite 目前支持通过 Facebook、Twitter、LinkedIn、Google、GitHub、GitLab、Bitbucket 和 Slack 进行认证。

> [!NOTE]  
> 社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 网站提供了其他平台的适配器。

## 安装

要开始使用 Socialite，请使用 Composer 包管理器将包添加到项目的依赖中:

```shell
composer require laravel/socialite
```

## 升级 Socialite

在升级到 Socialite 的一个新的主要版本时，你需要仔细审查[升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)。

## 配置

在使用 Socialite 之前，你需要为应用程序使用的 OAuth 提供商添加凭据。通常，这些凭据可以通过在你将要认证的服务的仪表板中创建“开发者应用”来检索。

这些凭证应该放置在你的应用程序的 `config/services.php` 配置文件中，并根据你的应用程序需要的提供商使用 `facebook`、`twitter` (OAuth 1.0)、`twitter-oauth-2` (OAuth 2.0)、`linkedin-openid`、`google`、`github`、`gitlab`、`bitbucket` 或 `slack` 等键：

```php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => 'http://example.com/callback-url',
],
```

> [!NOTE]  
> 如果 `redirect` 选项包含相对路径，它将自动解析为完全合格的 URL。

## 认证

### 路由

要使用 OAuth 提供商认证用户，你需要两个路由：一个用于将用户重定向到 OAuth 提供商，另一个用于在认证后接收来自提供商的回调。下面的示例路由显示了两个路由的实现：

```php
use Laravel\Socialite\Facades\Socialite;

Route::get('/auth/redirect', function () {
    return Socialite::driver('github')->redirect();
});

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // $user->token
});
```

`Socialite` 外观提供的 `redirect` 方法负责将用户重定向到 OAuth 提供商，而 `user` 方法将检查传入的请求并在他们批准认证请求后从提供商处检索用户的信息。

### 认证与存储

从 OAuth 提供商检索到用户后，你可以确定用户是否存在于你的应用程序数据库中并[认证用户](/docs/11/security/authentication#authenticate-a-user-instance)。如果用户不存在于你的应用程序数据库中，你通常会在数据库中创建一个新记录来代表该用户：

```php
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

Route::get('/auth/callback', function () {
    $githubUser = Socialite::driver('github')->user();

    $user = User::updateOrCreate([
        'github_id' => $githubUser->id,
    ], [
        'name' => $githubUser->name,
        'email' => $githubUser->email,
        'github_token' => $githubUser->token,
        'github_refresh_token' => $githubUser->refreshToken,
    ]);

    Auth::login($user);

    return redirect('/dashboard');
});
```

> [!NOTE]  
> 有关特定 OAuth 提供商提供的用户信息的更多信息，请查阅[获取用户详情](#retrieving-user-details)的文档。

### 访问范围

在将用户重定向之前，你可以使用 `scopes` 方法来指定应包含在认证请求中的“范围”。此方法将合并所有先前指定的范围与你指定的范围：

```php
use Laravel\Socialite\Facades\Socialite;

return Socialite::driver('github')
    ->scopes(['read:user', 'public_repo'])
    ->redirect();
```

你可以使用 `setScopes` 方法覆盖认证请求上的所有现有范围：

```php
return Socialite::driver('github')
    ->setScopes(['read:user', 'public_repo'])
    ->redirect();
```

### Slack 机器人范围

Slack 的 API 提供[不同类型的访问令牌](https://api.slack.com/authentication/token-types)，每种都有自己的[权限范围](https://api.slack.com/scopes)。Socialite 兼容以下两种类型的 Slack 访问令牌：

- 机器人（以 `xoxb-` 开头）
- 用户（以 `xoxp-` 开头）

默认情况下，`slack` 驱动将生成一个 `user` 令牌，并且调用驱动的 `user` 方法后将返回用户的详细信息。

如果你的应用程序将发送通知到其他由你的应用程序用户拥有的外部 Slack 工作区，机器人令牌主要是有用的。要生成机器人令牌，在将用户重定向到 Slack 进行认证之前调用 `asBotUser` 方法：

```php
return Socialite::driver('slack')
    ->asBotUser()
    ->setScopes(['chat:write', 'chat:write.public', 'chat:write.customize'])
    ->redirect();
```

此外，在 Slack 在认证后将用户重定向回你的应用程序后，在调用 `user` 方法之前，你必须调用 `asBotUser` 方法：

```php
$user = Socialite::driver('slack')->asBotUser()->user();
```

在生成机器人令牌时，`user` 方法仍将返回一个 `Laravel\Socialite\Two\User` 实例；但是，只有 `token` 属性将被水化。这个令牌可以被存储，以[发送通知到经过认证用户的 Slack 工作区](/docs/11/digging-deeper/notifications#notifying-external-slack-workspaces)。

### 可选参数

一些 OAuth 提供商在重定向请求上支持其他可选参数。要在请求中包含任何可选参数，请使用关联数组调用 `with` 方法：

```php
use Laravel\Socialite\Facades\Socialite;

return Socialite::driver('google')
    ->with(['hd' => 'example.com'])
    ->redirect();
```

> [!WARNING]  
> 使用 `with` 方法时，要小心不要传递任何保留关键字，例如 `state` 或 `response_type`。

## 获取用户详情

在用户被重定向回你的应用程序的认证回调路由后，你可以使用 Socialite 的 `user` 方法检索用户的详细信息。`user` 方法返回的用户对象提供了一系列属性和方法，你可以用它们将关于用户的信息存储在自己的数据库中。

根据你使用的 OAuth 提供商是支持 OAuth 1.0 还是 OAuth 2.0，这个对象上可用的不同属性和方法可能会有所不同：

```php
use Laravel\Socialite\Facades\Socialite;

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // OAuth 2.0 提供商...
    $token = $user->token;
    $refreshToken = $user->refreshToken;
    $expiresIn = $user->expiresIn;

    // OAuth 1.0 提供商...
    $token = $user->token;
    $tokenSecret = $user->tokenSecret;

    // 所有提供商...
    $user->getId();
    $user->getNickname();
    $user->getName();
    $user->getEmail();
    $user->getAvatar();
});
```

#### 从令牌获取用户详情 (OAuth2)

如果你已经有了用户的有效访问令牌，你可以使用 Socialite 的 `userFromToken` 方法检索他们的用户详细信息：

```php
use Laravel\Socialite\Facades\Socialite;

$user = Socialite::driver('github')->userFromToken($token);
```

#### 从令牌和密钥获取用户详情 (OAuth1)

如果你已经有了用户的有效令牌和密钥，你可以使用 Socialite 的 `userFromTokenAndSecret` 方法检索他们的用户详细信息：

```php
use Laravel\Socialite\Facades\Socialite;

$user = Socialite::driver('twitter')->userFromTokenAndSecret($token, $secret);
```

#### 无状态认证

`stateless` 方法可以用来禁用会话状态验证。当为不使用基于 cookie 的会话的无状态 API 添加社交认证时，这很有用：

```php
use Laravel\Socialite\Facades\Socialite;

return Socialite::driver('google')->stateless()->user();
```

> [!WARNING]  
> 无状态认证不适用于 Twitter OAuth 1.0 驱动。
