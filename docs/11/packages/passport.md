# Larvel Passowrd

[[toc]]

## 引言

[Laravel Passport](https://github.com/laravel/passport) 为你的 Laravel 应用程序提供了一个完整的 OAuth2 服务器实现，只需要几分钟。Passport 是建立在 [League OAuth2 服务器](https://github.com/thephpleague/oauth2-server) 之上，该服务器由 Andy Millington 和 Simon Hamp 维护。

> [!WARNING]  
> 本文档假设你已经熟悉 OAuth2。如果你对 OAuth2 一无所知，请考虑在继续之前先熟悉 OAuth2 的一般[术语](https://oauth2.thephpleague.com/terminology/)和特性。

### Passport 还是 Sanctum？

在开始之前，你可能希望确定你的应用程序是采用 Laravel Passport 还是 [Laravel Sanctum](/docs/11/packages/sanctum)。如果你的应用程序绝对需要支持 OAuth2，那么应该使用 Laravel Passport。

然而，如果你正在尝试认证单页应用程序、移动应用程序，或者发行 API 令牌，则应该使用 [Laravel Sanctum](/docs/11/packages/sanctum)。Laravel Sanctum 不支持 OAuth2；然而，它提供了一个更简单的 API 认证开发体验。

## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Passport：

```shell
php artisan install:api --passport
```

此命令将发布并运行数据库迁移，这是创建你的应用程序需要存储 OAuth2 客户端和访问令牌的表格所必需的。该命令还将创建生成安全访问令牌所需的加密密钥。

此外，此命令将询问是否希望使用 UUID 作为 Passport `Client` 模型的主键值，而不是自动递增的整数。

在运行了 `install:api` 命令之后，添加 `Laravel\Passport\HasApiTokens` 特性(trait)到你的 `App\Models\User` 模型。这个特性为你的模型提供了一些辅助方法，允许你检查经过认证用户的令牌和权限：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

最后，在你的应用程序的 `config/auth.php` 配置文件中，你应该定义一个 `api` 认证守卫(guard)并设置 `driver` 选项为 `passport`。这将指导你的应用程序在认证传入的 API 请求时使用 Passport 的 `TokenGuard`：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],
```

### 部署 Passport

当你第一次将 Passport 部署到你的应用程序服务器时，你可能需要运行 `passport:keys` 命令。这个命令生成 Passport 生成访问令牌所需的加密密钥。生成的密钥通常不保存在源代码管理中：

```shell
php artisan passport:keys
```

如果需要，你可以定义 Passport 密钥应该从哪个路径加载。你可以使用 `Passport::loadKeysFrom` 方法来实现这一点。通常，这个方法应该在你的应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::loadKeysFrom(__DIR__.'/../secrets/oauth');
}
```

#### 从环境加载密钥

或者，你可以使用 `vendor:publish` Artisan 命令来发布 Passport 的配置文件：

```shell
php artisan vendor:publish --tag=passport-config
```

配置文件发布后，你可以通过将它们定义为环境变量来加载你的应用程序的加密密钥：

```ini
PASSPORT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<private key here>
-----END RSA PRIVATE KEY-----"

PASSPORT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<public key here>
-----END PUBLIC KEY-----"
```

### 升级 Passport

当升级到 Passport 的一个新的主要版本时，你需要仔细查看[升级指南](https://github.com/laravel/passport/blob/master/UPGRADE.md)。

## 配置

### 客户端密钥散列

如果你希望在数据库中存储时对你的客户端的密钥进行散列处理，你应该在你的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `Passport::hashClientSecrets` 方法：

```php
use Laravel\Passport\Passport;

Passport::hashClientSecrets();
```

启用后，所有的客户端密钥仅在创建后立即显示给用户。由于纯文本客户端密钥值从未存储在数据库中，如果丢失密钥值，将无法恢复。

### 令牌生命周期

默认情况下，Passport 发布的是长期有效的访问令牌，一年后到期。如果你想配置一个更长/更短的令牌生命周期，你可以使用 `tokensExpireIn`、`refreshTokensExpireIn` 和 `personalAccessTokensExpireIn` 方法。这些方法应该在你的应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::tokensExpireIn(now()->addDays(15));
    Passport::refreshTokensExpireIn(now()->addDays(30));
    Passport::personalAccessTokensExpireIn(now()->addMonths(6));
}
```

> [!WARNING]  
> Passport 数据库表上的 `expires_at` 列是只读的，仅用于显示。在发放令牌时，Passport 在签名和加密的令牌内存储到期信息。如果需要使令牌无效，你应该[撤销它](#revoking-tokens)。

### 覆盖默认模型

你可以通过定义你自己的模型并扩展相应的 Passport 模型来自由扩展 Passport 内部使用的模型：

```php
use Laravel\Passport\Client as PassportClient;

class Client extends PassportClient
{
    // ...
}
```

在定义了模型之后，你可以通过 `Laravel\Passport\Passport` 类来指示 Passport 使用你的自定义模型。通常，你应该在你的应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中通知 Passport 有关你的自定义模型：

```php
use App\Models\Passport\AuthCode;
use App\Models\Passport\Client;
use App\Models\Passport\PersonalAccessClient;
use App\Models\Passport\RefreshToken;
use App\Models\Passport\Token;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::useTokenModel(Token::class);
    Passport::useRefreshTokenModel(RefreshToken::class);
    Passport::useAuthCodeModel(AuthCode::class);
    Passport::useClientModel(Client::class);
    Passport::usePersonalAccessClientModel(PersonalAccessClient::class);
}
```

### 覆盖路由

有时候你可能希望自定义 Passport 定义的路由。为此，你首先需要通过在你的应用程序的 `AppServiceProvider` 的 `register` 方法中添加 `Passport::ignoreRoutes` 来忽略 Passport 注册的路由：

```php
use Laravel\Passport\Passport;

/**
 * Register any application services.
 */
public function register(): void
{
    Passport::ignoreRoutes();
}
```

然后，你可以将 Passport 的 [路由文件](https://github.com/laravel/passport/blob/11.x/routes/web.php) 中定义的路由复制到你的应用程序的 `routes/web.php` 文件，并根据自己的喜好修改它们：

```php
Route::group([
    'as' => 'passport.',
    'prefix' => config('passport.path', 'oauth'),
    'namespace' => '\Laravel\Passport\Http\Controllers',
], function () {
    // Passport 路由...
});
```

## 发行访问令牌

通过授权码使用 OAuth2 是大多数开发者熟悉的 OAuth2 方式。在使用授权码的情况下，客户端应用程序会将用户重定向到你的服务器，在那里他们将批准或拒绝向客户端发放访问令牌的请求。

### 管理客户端

首先，需要与你的应用程序的 API 交互的开发人员将需要通过创建一个 “客户端” 来注册他们的应用程序。通常，这包括提供他们的应用程序名称和一个 URL，你的应用程序可以在用户批准他们的授权请求后重定向到该 URL。

#### `passport:client` 命令

创建客户端最简单的方法是使用 `passport:client` Artisan 命令。此命令可用于创建自己的客户端以测试你 OAuth2 功能。当你运行 `client` 命令时，Passport 将提示你提供有关客户端的更多信息，并将为你提供客户端 ID 和密钥：

```shell
php artisan passport:client
```

**重定向 URLs**

如果你想要为你的客户端允许多个重定向 URLs，你可以在 `passport:client` 命令提示你输入 URL 时，使用逗号分隔的列表来指定它们。任何包含逗号的 URLs 应该使用 URL 编码：

```shell
http://example.com/callback,http://examplefoo.com/callback
```

#### JSON API

由于你的应用程序的用户无法使用 `client` 命令，Passport 提供了一个 JSON API，你可以使用它来创建客户端。这避免了你必须手动编写用于创建、更新和删除客户端的控制器的麻烦。

然而，你需要将 Passport 的 JSON API 与你自己的前端相配合，为你的用户提供一个管理其客户端的仪表盘。下面，我们将回顾管理客户端的所有 API 端点。为方便起见，我们将使用 Axios 来演示发出对端点的 HTTP 请求。

JSON API 受到 `web` 和 `auth` 中间件的保护；因此，它只能从你自己的应用程序调用。它不能从外部来源调用。

#### `GET /oauth/clients`

此路由返回认证用户的所有客户端。这主要用于列出用户的所有客户端，以便他们可以编辑或删除它们：

```js
axios.get('/oauth/clients').then((response) => {
  console.log(response.data)
})
```

#### `POST /oauth/clients`

该路由用于创建新客户端。它需要两个数据：客户端的 `name` 和 `redirect` URL。`redirect` URL 是用户在批准或拒绝授权请求后将被重定向到的位置。

当创建客户端时，它将被发放客户端 ID 和客户端密钥。在向应用程序请求访问令牌时将使用这些值。客户端创建路由将返回新的客户端实例：

```js
const data = {
  name: 'Client Name',
  redirect: 'http://example.com/callback'
}

axios
  .post('/oauth/clients', data)
  .then((response) => {
    console.log(response.data)
  })
  .catch((response) => {
    // List errors on response...
  })
```

#### `PUT /oauth/clients/{client-id}`

此路由用于更新客户端。它要求两个数据：客户端的 `name` 和 `redirect` URL。`redirect` URL 是用户在批准或拒绝授权请求后将被重定向到的位置。该路由将返回更新后的客户端实例：

```js
const data = {
  name: 'New Client Name',
  redirect: 'http://example.com/callback'
}

axios
  .put('/oauth/clients/' + clientId, data)
  .then((response) => {
    console.log(response.data)
  })
  .catch((response) => {
    // List errors on response...
  })
```

#### `DELETE /oauth/clients/{client-id}`

此路由用于删除客户端：

```js
axios.delete('/oauth/clients/' + clientId).then((response) => {
  // ...
})
```

### 请求令牌

#### 授权重定向

一旦客户端被创建，开发人员可以使用他们的客户端 ID 和密钥请求你应用程序的授权码和访问令牌。首先，消费应用程序应该向你的应用程序的 `/oauth/authorize` 路由发出重定向请求，如下所示：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Str;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => '',
        'state' => $state,
        // 'prompt' => '', // "none", "consent", or "login"
    ]);

    return redirect('http://passport-app.test/oauth/authorize?'.$query);
});
```

可以使用 `prompt` 参数来指定 Passport 应用程序的认证行为。

如果 `prompt` 的值是 `none`，如果用户没有已经通过 Passport 应用程序认证，Passport 将总是抛出一个认证错误。如果该值是 `consent`，即使所有范围以前已被授予消费应用程序，Passport 也将总是显示授权批准屏幕。当该值是 `login` 时，即使他们已经有一个现有的会话，Passport 应用程序也将总是提示用户重新登录应用程序。

如果没有提供 `prompt` 值，只有在他们之前没有为请求的范围授权给消费应用程序时，用户才会被提示授权。

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已经由 Passport 定义。你无需手动定义此路由。

#### 批准请求

当接收到授权请求时，Passport 将根据 `prompt` 参数的值（如果存在）自动响应，并可能向用户显示一个模板，让他们批准或拒绝授权请求。如果他们批准了请求，他们将被重定向回消费应用程序指定的 `redirect_uri`。`redirect_uri` 必须与创建客户端时指定的 `redirect` URL 匹配。

如果你想要自定义授权批准屏幕，可以使用 `vendor:publish` Artisan 命令发布 Passport 的视图。发布的视图将被放置在 `resources/views/vendor/passport` 目录中：

```shell
php artisan vendor:publish --tag=passport-views
```

有时你可能希望跳过授权提示，比如在授权第一方客户端时。你可以通过扩展 `Client` 模型并定义一个 `skipsAuthorization` 方法来实现。如果 `skipsAuthorization` 返回 `true`，则客户端将获得批准，并且用户将立即被重定向回 `redirect_uri`，除非消费应用程序在重定向以请求授权时明确设置了 `prompt` 参数：

```php
namespace App\Models\Passport;

use Laravel\Passport\Client as BaseClient;

class Client extends BaseClient
{
    /**
     * 确定客户端是否应该跳过授权提示。
     */
    public function skipsAuthorization(): bool
    {
        return $this->firstParty();
    }
}
```

#### 将授权码转换为访问令牌

如果用户批准了授权请求，他们将被重定向回消费应用程序。消费者应首先根据重定向前存储的值验证 `state` 参数。如果状态参数匹配，则消费者应向你的应用程序发出 `POST` 请求以请求访问令牌。请求应包含用户批准授权请求时你的应用程序发出的授权码：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/callback', function (Request $request) {
    $state = $request->session()->pull('state');

    throw_unless(
        strlen($state) > 0 && $state === $request->state,
        InvalidArgumentException::class,
        '无效的 state 值。'
    );

    $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => 'client-id',
        'client_secret' => 'client-secret',
        'redirect_uri' => 'http://third-party-app.com/callback',
        'code' => $request->code,
    ]);

    return $response->json();
});
```

此 `/oauth/token` 路由将返回一个包含 `access_token`、`refresh_token` 及 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌到期的秒数。

> [!NOTE]
> 像 `/oauth/authorize` 路径一样，`/oauth/token` 路径由 Passport 为你定义。无需手动定义此路由。

#### JSON API

Passport 还包含用于管理授权访问令牌的 JSON API。你可以将其与你自己的前端相配合，为用户提供一个管理访问令牌的仪表板。为方便起见，我们将使用 Axios 来演示发送 HTTP 请求到端点的方式。JSON API 受 `web` 和 `auth` 中间件的保护；因此，它只能从你自己的应用程序调用。

#### `GET /oauth/tokens`

此路由返回已认证用户创建的所有授权访问令牌。这主要用于列出用户的所有令牌，以便他们可以撤销它们：

```js
axios.get('/oauth/tokens').then((response) => {
  console.log(response.data)
})
```

#### `DELETE /oauth/tokens/{token-id}`

此路由可用于撤销授权访问令牌及其相关的刷新令牌：

```js
axios.delete('/oauth/tokens/' + tokenId)
```

### 刷新令牌

如果你的应用程序发放的访问令牌的有效期很短，那么用户将需要通过他们在发放访问令牌时提供的刷新令牌来刷新他们的访问令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('http://passport-app.test/oauth/token', [
    'grant_type' => 'refresh_token',
    'refresh_token' => 'the-refresh-token',
    'client_id' => 'client-id',
    'client_secret' => 'client-secret',
    'scope' => '',
]);

return $response->json();
```

此 `/oauth/token` 路由将返回一个包含 `access_token`、`refresh_token` 及 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌到期的秒数。

### 撤销令牌

你可以通过在 `Laravel\Passport\TokenRepository` 上使用 `revokeAccessToken` 方法来撤销令牌。你可以使用 `Laravel\Passport\RefreshTokenRepository` 上的 `revokeRefreshTokensByAccessTokenId` 方法撤销令牌的刷新令牌。这些类可以通过 Laravel 的[服务容器](/docs/11/architecture-concepts/container)解析：

```php
use Laravel\Passport\TokenRepository;
use Laravel\Passport\RefreshTokenRepository;

$tokenRepository = app(TokenRepository::class);
$refreshTokenRepository = app(RefreshTokenRepository::class);

// 撤销访问令牌...
$tokenRepository->revokeAccessToken($tokenId);

// 撤销所有相关的刷新令牌...
$refreshTokenRepository->revokeRefreshTokensByAccessTokenId($tokenId);
```

### 清除令牌

当令牌被撤销或过期时，你可能会希望从数据库中清除它们。Passport 包含的 `passport:purge` Artisan 命令可以帮你完成这个任务：

```shell
# 清除已撤销和已过期的令牌和授权码...
php artisan passport:purge

# 仅清除超过 6 小时的过期令牌...
php artisan passport:purge --hours=6

# 仅清除已撤销的令牌和授权码...
php artisan passport:purge --revoked

# 仅清除已过期的令牌和授权码...
php artisan passport:purge --expired
```

你也可以在你的应用程序的 `routes/console.php` 文件中配置一个[定时任务](/docs/11/digging-deeper/scheduling)，以便自动按计划清理你的令牌：

```php
use Laravel\Support\Facades\Schedule;

Schedule::command('passport:purge')->hourly();
```

## 带 PKCE 的授权码授权

带 "代码交换证明密钥" (PKCE) 的授权码授权是一种安全的方式，用于验证单页应用程序或原生应用程序以访问你的 API。当你无法保证客户端密钥将被保密地存储，或者为了减少授权码被攻击者截获的威胁时，应该使用此授权。在交换授权码以获取访问令牌时，"代码验证器" 和 "代码挑战" 的组合替代了客户端密钥。

### 创建客户端

在你的应用程序可以通过 PKCE 授权代码授权发放令牌之前，你需要创建一个启用了 PKCE 的客户端。你可以使用带有 `--public` 选项的 `passport:client` Artisan 命令来完成这个操作：

```shell
php artisan passport:client --public
```

### 请求令牌

#### 代码验证器和代码挑战

由于此授权授权不提供客户端密钥，开发者将需要生成代码验证器和代码挑战的组合来请求一个令牌。

代码验证器应该是一个由 43 至 128 个字符组成的随机字符串，包含字母、数字以及 `"-"`、`"."`、`"_"`、`"~"` 字符，如 [RFC 7636 规范](https://tools.ietf.org/html/rfc7636) 中定义的。

代码挑战应该是一个 Base64 编码的字符串，带有 URL 和文件名安全字符。结尾的 `'='` 字符应该被移除，且没有换行符、空格或其他附加字符存在。

```php
$encoded = base64_encode(hash('sha256', $code_verifier, true));

$codeChallenge = strtr(rtrim($encoded, '='), '+/', '-_');
```

#### 重定向以请求授权

一旦客户端被创建，你可以使用客户端 ID 和生成的代码验证器以及代码挑战从你的应用程序请求一个授权码和访问令牌。首先，消费应用程序应该向你的应用程序的 `/oauth/authorize` 路由发出重定向请求：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Str;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $request->session()->put(
        'code_verifier', $code_verifier = Str::random(128)
    );

    $codeChallenge = strtr(rtrim(
        base64_encode(hash('sha256', $code_verifier, true))
    , '='), '+/', '-_');

    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => '',
        'state' => $state,
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256',
        // 'prompt' => '', // "none", "consent", or "login"
    ]);

    return redirect('http://passport-app.test/oauth/authorize?'.$query);
});
```

#### 将授权码转换为访问令牌

如果用户批准了授权请求，他们将被重定向回消费应用程序。消费者应根据重定向前存储的值验证 `state` 参数，如标准授权码授权所示。

如果状态参数匹配，消费者应向你的应用程序发起一个 `POST` 请求以请求访问令牌。该请求应包含用户批准授权请求时你的应用程序发出的授权码以及最初生成的代码验证器：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/callback', function (Request $request) {
    $state = $request->session()->pull('state');

    $codeVerifier = $request->session()->pull('code_verifier');

    throw_unless(
        strlen($state) > 0 && $state === $request->state,
        InvalidArgumentException::class
    );

    $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => 'client-id',
        'redirect_uri' => 'http://third-party-app.com/callback',
        'code_verifier' => $codeVerifier,
        'code' => $request->code,
    ]);

    return $response->json();
});
```

## 密码授权令牌

> [!WARNING]
> 我们不再推荐使用密码授权令牌。相反，你应该选择目前由 OAuth2 服务器推荐的[授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

OAuth2 密码授权允许你的其他第一方客户端，例如移动应用程序，使用邮箱地址/用户名和密码获取访问令牌。这允许你安全地向你的第一方客户端发放访问令牌，无需要求你的用户经历整个 OAuth2 授权码重定向流程。

要启用密码授权，调用你的应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中的 `enablePasswordGrant` 方法：

```php
/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

### 创建密码授权客户端

在你的应用程序可以通过密码授权发放令牌之前，你需要创建一个密码授权客户端。你可以使用带有 `--password` 选项的 `passport:client` Artisan 命令来实现。**如果你已经运行过 `passport:install` 命令，你不需要再运行这个命令：**

```shell
php artisan passport:client --password
```

### 请求令牌

一旦你创建了一个密码授权客户端，你可以通过向 `/oauth/token` 路由发起 `POST` 请求并提供用户的邮箱地址和密码来请求访问令牌。记住，这个路由已经由 Passport 注册，所以无需手动定义它。如果请求成功，你将从服务器收到一个 JSON 响应，其中包含 `access_token` 和 `refresh_token`：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('http://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'client-id',
    'client_secret' => 'client-secret',
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => '',
]);

return $response->json();
```

> [!NOTE]
> 记住，默认情况下，访问令牌的寿命很长。然而，如果需要，你可以自由地[配置最长访问令牌寿命](#configuration)。

### 请求所有作用域

当使用密码授权或客户端凭据授权时，你可能希望授权令牌访问你的应用程序支持的所有作用域。你可以通过请求 `*` 作用域来做到这一点。如果你请求了 `*` 作用域，令牌实例上的 `can` 方法将总是返回 `true`。只有使用 `password` 或 `client_credentials` 授权发放的令牌才能分配此作用域：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('http://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'client-id',
    'client_secret' => 'client-secret',
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => '*',
]);
```

### 自定义用户提供者

如果你的应用程序使用了多个[身份验证用户提供者](/docs/11/security/authentication#introduction)，你可以在通过 `artisan passport:client --password` 命令创建客户端时提供一个 `--provider` 选项，指定密码授权客户端使用哪个用户提供者。提供的提供者名称应匹配你的应用程序 `config/auth.php` 配置文件中定义的有效提供者。然后你可以[使用中间件保护你的路由](#via-middleware)，以确保只有来自指定提供者守卫的用户被授权。

### 自定义用户名字段

使用密码授权进行身份验证时，Passport 将使用你的可身份验证模型的 `email` 属性作为 "用户名"。然而，你可以通过在你的模型上定义一个 `findForPassport` 方法来自定义此行为：

```php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * 查找给定用户名的用户实例。
     */
    public function findForPassport(string $username): User
    {
        return $this->where('username', $username)->first();
    }
}
```

### 自定义密码验证

当使用密码授权（password grant）进行认证时，Passport 将使用您的模型中的 `password` 属性来验证所给的密码。如果您的模型没有 `password` 属性或您希望自定义密码验证逻辑，您可以在您的模型上定义一个 `validateForPassportPasswordGrant` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * 验证用户对于 Passport 密码授权的密码。
     */
    public function validateForPassportPasswordGrant(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}
```

## 隐式授权令牌 (Implicit Grant Tokens)

> [!WARNING]  
> 我们不再推荐使用隐式授权令牌。相反，您应该选择 [OAuth2 服务器当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

隐式授权与授权码授权类似；但是，令牌会直接返回给客户端，而不用交换一个授权码。这种授权类型最常用于 JavaScript 或移动应用程序，这些应用程序中客户端凭据无法安全存储。要启用此授权，可以在您应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enableImplicitGrant` 方法：

```php
/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Passport::enableImplicitGrant();
}
```

一旦授权开启，开发人员可以使用他们的客户端 ID 从您的应用请求访问令牌。消费应用应该像这样对您应用的 `/oauth/authorize` 路径进行重定向请求：

```php
use Illuminate\Http\Request;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://third-party-app.com/callback',
        'response_type' => 'token',
        'scope' => '',
        'state' => $state,
        // 'prompt' => '', // "none", "consent", or "login"
    ]);

    return redirect('http://passport-app.test/oauth/authorize?'.$query);
});
```

> [!NOTE]  
> 记住，`/oauth/authorize` 路径已经由 Passport 定义。您不需要手动定义这个路径。

## 客户端凭据授权令牌 (Client Credentials Grant Tokens)

客户端凭据授权适合于机器到机器之间的认证。例如，您可能在执行维护 API 的计划任务的定时作业中使用这种授权。

在您的应用可以通过客户端凭据授权发放令牌之前，您需要创建一个客户端凭据授权客户端。您可以使用 `passport:client` Artisan 命令的 `--client` 选项来完成这个操作：

```shell
php artisan passport:client --client
```

接下来，要使用这种授权类型，为 `CheckClientCredentials` 中间件注册一个中间件别名。您可以在您的应用的 `bootstrap/app.php` 文件中定义中间件别名：

```php
use Laravel\Passport\Http\Middleware\CheckClientCredentials;

->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'client' => CheckClientCredentials::class
    ]);
})
```

然后，将该中间件附加到一个路由上：

```php
Route::get('/orders', function (Request $request) {
    ...
})->middleware('client');
```

为了限制特定作用域的访问权限，您可以在附加 `client` 中间件到路由时提供所需作用域的逗号分隔列表：

```php
Route::get('/orders', function (Request $request) {
    ...
})->middleware('client:check-status,your-scope');
```

### 检索令牌

要使用这种授权类型检索一个令牌，请向 `oauth/token` 端点发出请求：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('http://passport-app.test/oauth/token', [
    'grant_type' => 'client_credentials',
    'client_id' => 'client-id',
    'client_secret' => 'client-secret',
    'scope' => 'your-scope',
]);

return $response->json()['access_token'];
```

## 个人访问令牌 (Personal Access Tokens)

有时，您的用户可能希望在不通过典型的授权码重定向流程的情况下为自己颁发访问令牌。允许用户通过您的应用界面为自己颁发令牌，对于允许用户尝试您的 API 可能很有用，或者可能作为一般颁发访问令牌的更简单方法。

> [!NOTE]  
> 如果您的应用主要使用 Passport 来颁发个人访问令牌，您可以考虑使用 [Laravel Sanctum](/docs/11/packages/sanctum)，这是 Laravel 用于颁发 API 访问令牌的轻量级第一方库。

### 创建个人访问客户端

在您的应用可以颁发个人访问令牌之前，您需要创建一个个人访问客户端。您可以通过执行带有 `--personal` 选项的 `passport:client` Artisan 命令来完成这个操作。如果您已经运行了 `passport:install` 命令，您不需要运行此命令：

```shell
php artisan passport:client --personal
```

在创建了您的个人访问客户端后，请将客户端的 ID 和纯文本密钥值放置在您的应用的 `.env` 文件中：

```ini
PASSPORT_PERSONAL_ACCESS_CLIENT_ID="client-id-value"
PASSPORT_PERSONAL_ACCESS_CLIENT_SECRET="unhashed-client-secret-value"
```

### 管理个人访问令牌

一旦您创建了一个个人访问客户端，您可以使用 `App\Models\User` 模型实例上的 `createToken` 方法为给定用户发放令牌。`createToken` 方法接受令牌的名称作为其第一个参数，可选的 [作用域](#token-scopes) 数组作为其第二个参数：

```php
use App\Models\User;

$user = User::find(1);

// 创建一个没有作用域的令牌...
$token = $user->createToken('Token Name')->accessToken;

// 创建一个有作用域的令牌...
$token = $user->createToken('My Token', ['place-orders'])->accessToken;
```

#### JSON API

Passport 还包含了一个用于管理个人访问令牌的 JSON API。您可以与您自己的前端配合使用，为您的用户提供一个个人访问令牌管理仪表板。下面，我们将回顾所有用于管理个人访问令牌的 API 端点。为了方便，我们将使用 [Axios](https://github.com/mzabriskie/axios) 来展示如何向端点发送 HTTP 请求。

JSON API 受 `web` 和 `auth` 中间件保护；因此，它只能从您自己的应用调用。它无法从外部来源调用。

#### `GET /oauth/scopes`

此路由返回您的应用定义的所有 [作用域](#token-scopes)。您可以使用此路由列出用户可以指派给个人访问令牌的作用域：

```js
axios.get('/oauth/scopes').then((response) => {
  console.log(response.data)
})
```

#### `GET /oauth/personal-access-tokens`

此路由返回已认证用户创建的所有个人访问令牌。这主要用于列出用户的所有令牌，以便他们可以编辑或撤销它们：

```js
axios.get('/oauth/personal-access-tokens').then((response) => {
  console.log(response.data)
})
```

#### `POST /oauth/personal-access-tokens`

此路由创建新的个人访问令牌。它需要两条数据：令牌的 `name` 和应分配给令牌的 `scopes`：

```js
const data = {
  name: 'Token Name',
  scopes: []
}

axios
  .post('/oauth/personal-access-tokens', data)
  .then((response) => {
    console.log(response.data.accessToken)
  })
  .catch((response) => {
    // List errors on response...
  })
```

#### `DELETE /oauth/personal-access-tokens/{token-id}`

此路由可用于撤销个人访问令牌：

```js
axios.delete('/oauth/personal-access-tokens/' + tokenId)
```

## 保护路由

### 通过中间件

Passport 包含一个 [认证守卫](/docs/11/security/authentication#adding-custom-guards)，它将在传入请求上验证访问令牌。一旦您已将 `api` 守卫配置为使用 `passport` 驱动，您只需要在任何应该需要有效访问令牌的路由上指定 `auth:api` 中间件：

```php
Route::get('/user', function () {
    // ...
})->middleware('auth:api');
```

> [!WARNING]  
> 如果您正在使用 [客户端凭据授权](#client-credentials-grant-tokens)，您应该使用 [the `client` 中间件](#client-credentials-grant-tokens) 来保护您的路由，而不是 `auth:api` 中间件。

#### 多重认证守卫

如果您的应用认证了使用不同的 Eloquent 模型的不同类型的用户，您可能需要为您应用中的每种用户提供者类型定义一个守卫配置。这允许您保护仅面向特定用户提供者的请求。例如，考虑到 `config/auth.php` 配置文件中的以下守卫配置：

```php
'api' => [
    'driver' => 'passport',
    'provider' => 'users',
],

'api-customers' => [
    'driver' => 'passport',
    'provider' => 'customers',
],
```

以下路由将使用 `api-customers` guard，它使用 `customers` 用户提供者来验证传入请求：

```php
Route::get('/customer', function () {
    // ...
})->middleware('auth:api-customers');
```

> [!NOTE]  
> 欲了解如何在 Passport 中使用多用户提供者，请查阅密码授权文档。

### 传递访问令牌

当调用受 Passport 保护的路由时，您的应用程序的 API 消费者应该在请求的 `Authorization` 头部中将他们的访问令牌指定为 `Bearer` 令牌。例如，当使用 Guzzle HTTP 库时：

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'Accept' => 'application/json',
    'Authorization' => 'Bearer '.$accessToken,
])->get('https://passport-app.test/api/user');

return $response->json();
```

## 令牌作用域

作用域允许您的 API 客户端在请求授权访问账户时请求特定权限集。例如，如果您正在构建一个电子商务应用程序，不是所有的 API 消费者都需要下订单的能力。相反，您可以允许消费者仅请求授权以访问订单发货状态。换句话说，作用域允许您的应用程序用户限制第三方应用程序代表他们执行的操作。

### 定义作用域

您可以使用 `App\Providers\AppServiceProvider` 类中 `boot` 方法的 `Passport::tokensCan` 方法来定义您的 API 的作用域。`tokensCan` 方法接收一个作用域名称和作用域描述的数组。作用域描述可以是您希望的任何内容，并将在授权批准屏幕上显示给用户：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::tokensCan([
        'place-orders' => 'Place orders',
        'check-status' => 'Check order status',
    ]);
}
```

### 默认作用域

如果客户端未请求任何特定作用域，则可以使用 `setDefaultScope` 方法配置您的 Passport 服务器以将默认作用域附加到令牌上。通常，您应该从应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Passport\Passport;

Passport::tokensCan([
    'place-orders' => 'Place orders',
    'check-status' => 'Check order status',
]);

Passport::setDefaultScope([
    'check-status',
    'place-orders',
]);
```

> [!NOTE]  
> Passport 的默认作用域不适用于由用户生成的个人访问令牌。

### 将作用域分配给令牌

#### 请求授权码时

使用授权码授权请求访问令牌时，消费者应将其所需的作用域指定为查询字符串参数 `scope`。`scope` 参数应该是以空格分隔的作用域列表：

```php
Route::get('/redirect', function () {
    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://example.com/callback',
        'response_type' => 'code',
        'scope' => 'place-orders check-status',
    ]);

    return redirect('http://passport-app.test/oauth/authorize?'.$query);
});
```

#### 发行个人访问令牌时

如果您使用 `App\Models\User` 模型的 `createToken` 方法发行个人访问令牌，您可以将所需作用域的数组作为第二个参数传递给该方法：

```php
$token = $user->createToken('My Token', ['place-orders'])->accessToken;
```

### 检查作用域

Passport 包含了两个中间件，可用于验证传入请求是否使用具有给定作用域的访问令牌进行了验证。首先，在您的应用程序的 `bootstrap/app.php` 文件中定义以下中间件别名：

```php
use Laravel\Passport\Http\Middleware\CheckForAnyScope;
use Laravel\Passport\Http\Middleware\CheckScopes;

->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'scopes' => CheckScopes::class,
        'scope' => CheckForAnyScope::class,
    ]);
})
```

#### 检查全部作用域

`scopes` 中间件可以分配给路由以验证传入请求的访问令牌是否具有所有列出的作用域：

```php
Route::get('/orders', function () {
    // 访问令牌拥有 "check-status" 和 "place-orders" 作用域...
})->middleware(['auth:api', 'scopes:check-status,place-orders']);
```

#### 检查任何作用域

`scope` 中间件可以分配给路由以验证传入请求的访问令牌是否至少具有列出的一个作用域：

```php
Route::get('/orders', function () {
    // 访问令牌拥有 "check-status" 或 "place-orders" 作用域...
})->middleware(['auth:api', 'scope:check-status,place-orders']);
```

#### 在令牌实例上检查作用域

一旦访问令牌经过验证的请求进入了您的应用程序，您仍然可以使用认证的 `App\Models\User` 实例上的 `tokenCan` 方法来检查令牌是否有特定的作用域：

```php
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    if ($request->user()->tokenCan('place-orders')) {
        // ...
    }
});
```

#### 附加的作用域方法

`scopeIds` 方法将返回所有定义的作用域 ID / 名称的数组：

```php
use Laravel\Passport\Passport;

Passport::scopeIds();
```

`scopes` 方法将以 `Laravel\Passport\Scope` 实例的形式返回所有定义的作用域的数组：

```php
Passport::scopes();
```

`scopesFor` 方法将返回与给定 ID / 名称匹配的 `Laravel\Passport\Scope` 实例的数组：

```php
Passport::scopesFor(['place-orders', 'check-status']);
```

您可以使用 `hasScope` 方法来确定是否定义了给定的作用域：

```php
Passport::hasScope('place-orders');
```

## 使用 JavaScript 消费您的 API

在构建 API 时，能够从您的 JavaScript 应用程序消费自己的 API 是非常有用的。这种 API 开发方法允许您的应用程序消费与世界共享的相同 API。同一个 API 可以由您的网页应用程序、移动应用程序、第三方应用程序以及您可能在各种包管理器上发布的任何 SDK 消费。

通常，如果您想从您的 JavaScript 应用程序消费您的 API，您需要手动发送访问令牌到应用程序，并在对您的应用程序的每个请求中传递它。然而，Passport 包含了一个中间件可以为您处理这一点。您所需要做的就是在应用程序的 `bootstrap/app.php` 文件中将 `CreateFreshApiToken` 中间件添加到 `web` 中间件组：

```php
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        CreateFreshApiToken::class,
    ]);
})
```

> [!WARNING]  
> 您应确保 `CreateFreshApiToken` 中间件是您中间件堆栈中列出的最后一个中间件。

这个中间件会在您的响应中附加一个 `laravel_token` cookie。这个 cookie 包含一个加密的 JWT，Passport 将使用它来验证来自您的 JavaScript 应用程序的 API 请求。JWT 的生命周期等于您的 `session.lifetime` 配置值。现在，由于浏览器将自动发送 cookie，您可以在不明确传递访问令牌的情况下向应用程序的 API 发出请求：

```javascript
axios.get('/api/user').then((response) => {
  console.log(response.data)
})
```

#### 自定义 Cookie 名称

如果需要，您可以使用 `Passport::cookie` 方法自定义 `laravel_token` cookie 的名称。通常，这个方法应该从应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::cookie('custom_name');
}
```

#### CSRF 保护

在使用这种身份验证方法时，您需要确保在请求中包含一个有效的 CSRF 令牌头。Laravel 默认的 JavaScript 脚手架包含了一个 Axios 实例，它会自动使用加密的 `XSRF-TOKEN` cookie 值来发送 `X-XSRF-TOKEN` 头部，在同源请求上。

> [!NOTE]  
> 如果您选择发送 `X-CSRF-TOKEN` 头部而不是 `X-XSRF-TOKEN`，您将需要使用 `csrf_token()` 提供的未加密令牌。

## 事件

当发放访问令牌和刷新令牌时，Passport 会触发事件。您可以监听这些事件来修剪或撤销数据库中的其他访问令牌：

| 事件名称                                      |
| --------------------------------------------- |
| `Laravel\Passport\Events\AccessTokenCreated`  |
| `Laravel\Passport\Events\RefreshTokenCreated` |

## 测试

Passport 的 `actingAs` 方法可以用来指定当前认证的用户以及其作用域。传递给 `actingAs` 方法的第一个参数是用户实例，第二个是应该授予用户令牌的作用域数组：

```php tab=Pest
use App\Models\User;
use Laravel\Passport\Passport;

test('servers can be created', function () {
    Passport::actingAs(
        User::factory()->create(),
        ['create-servers']
    );

    $response = $this->post('/api/create-server');

    $response->assertStatus(201);
});
```

```php tab=PHPUnit
use App\Models\User;
use Laravel\Passport\Passport;

public function test_servers_can_be_created(): void
{
    Passport::actingAs(
        User::factory()->create(),
        ['create-servers']
    );

    $response = $this->post('/api/create-server');

    $response->assertStatus(201);
}
```

Passport 的 `actingAsClient` 方法可以用来指定当前认证的客户端以及其作用域。传递给 `actingAsClient` 方法的第一个参数是客户端实例，第二个是应该授予客户端令牌的作用域数组：

```php tab=Pest
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

test('orders can be retrieved', function () {
    Passport::actingAsClient(
        Client::factory()->create(),
        ['check-status']
    );

    $response = $this->get('/api/orders');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

public function test_orders_can_be_retrieved(): void
{
    Passport::actingAsClient(
        Client::factory()->create(),
        ['check-status']
    );

    $response = $this->get('/api/orders');

    $response->assertStatus(200);
}
```
