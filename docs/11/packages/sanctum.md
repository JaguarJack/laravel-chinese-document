# Laravel Sanctum

[[toc]]

## 引言

Laravel Sanctum 提供了一个轻量级的身份验证系统，供单页应用程序（SPA）、移动应用程序和基于简单令牌的 API 使用。Sanctum 允许应用程序的每个用户为他们的帐户生成多个 API 令牌。这些令牌可以被授予权限/范围，这指定了令牌允许执行的操作。

### 它是如何工作的

Laravel Sanctum 旨在解决两个分开的问题。在深入了解这个库之前，让我们讨论一下每个问题。

#### API 令牌

首先，Sanctum 是一个简单的包，您可以使用它为您的用户发行 API 令牌，无需涉及 OAuth 的复杂性。这个功能受到了 GitHub 和其他应用程序的启发，这些应用程序发行了“个人访问令牌”。例如，想象一下您的应用程序中的“账户设置”页面，用户可以在该页面为他们的账户生成一个 API 令牌。您可以使用 Sanctum 来生成和管理这些令牌。这些令牌通常具有非常长的过期时间（数年），但用户可以随时手动吊销。

Laravel Sanctum 通过在单一数据库表中存储用户 API 令牌并通过 `Authorization` 头来认证传入的 HTTP 请求（应包含有效的 API 令牌）来提供这项功能。

#### 单页应用程序身份验证

其次，Sanctum 存在是为了为需要与 Laravel 驱动的 API 通信的单页应用程序（SPA）提供一种简单的身份验证方式。这些 SPA 可能存在于与您的 Laravel 应用程序相同的存储库中，也可能是一个完全独立的存储库，如使用 Vue CLI 创建的 SPA 或 Next.js 应用程序。

对于这项功能，Sanctum 根本不使用任何类型的令牌。相反，Sanctum 使用 Laravel 的内置基于 cookie 的会话认证服务。通常，Sanctum 使用 Laravel 的 `web` 认证守卫来完成这项任务。这提供了 CSRF 保护、会话认证的好处，以及防止通过 XSS 泄漏认证凭证。

Sanctum 只有在传入请求来自您自己的 SPA 前端时，才会尝试使用 cookie 进行认证。当 Sanctum 检查传入的 HTTP 请求时，它会首先检查是否存在身份认证 cookie，如果没有，Sanctum 将检查 `Authorization` 头中的有效 API 令牌。

> 提示  
> 仅使用 Sanctum 进行 API 令牌认证或者仅用于 SPA 认证是完全可行的。使用 Sanctum 并不意味着您必须使用它提供的两项功能。

## 安装

您可以通过以下 `install:api` Artisan 命令安装 Laravel Sanctum：

```shell
php artisan install:api
```

接下来，如果您打算使用 Sanctum 来认证 SPA，请参阅本文档中的 [SPA 认证](#spa-authentication) 部分。

## 配置

### 重写默认模型

尽管通常不需要，但您可以自由扩展 Sanctum 内部使用的 `PersonalAccessToken` 模型：

```php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
```

然后，您可以通过 Sanctum 提供的 `usePersonalAccessTokenModel` 方法指导 Sanctum 使用您的自定义模型。通常，您应该在应用程序的 `AppServiceProvider` 文件的 `boot` 方法中调用此方法：

```php
use App\Models\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
}
```

## API 令牌认证

> 提示  
> 您不应使用 API 令牌来认证您自己的第一方 SPA。相反，请使用 Sanctum 内置的 [SPA 认证功能](#spa-authentication)。

### 发行 API 令牌

Sanctum 允许您发行 API 令牌/个人访问令牌，这些令牌可用于认证对您的应用程序的 API 请求。使用 API 令牌发出请求时，应将令牌包含在 `Authorization` 头中作为一个 `Bearer` 令牌。

要开始为用户发行令牌，您的用户模型应使用 `Laravel\Sanctum\HasApiTokens` trait：

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

要发行令牌，您可以使用 `createToken` 方法。`createToken` 方法返回一个 `Laravel\Sanctum\NewAccessToken` 实例。在存储到数据库之前，API 令牌使用 SHA-256 哈希进行散列，但您可以通过 `NewAccessToken` 实例的 `plainTextToken` 属性访问令牌的明文值。在创建令牌后，您应该立即向用户显示此值：

```php
use Illuminate\Http\Request;

Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
});
```

您可以使用 `HasApiTokens` trait 提供的 `tokens` Eloquent 关系访问用户的所有令牌：

```php
foreach ($user->tokens as $token) {
    // ...
}
```

### 令牌能力

Sanctum 允许您为令牌分配“能力”。能力的作用类似于 OAuth 的“范围”。您可以将字符串能力的数组作为第二个参数传递给 `createToken` 方法：

```php
return $user->createToken('token-name', ['server:update'])->plainTextToken;
```

在处理经 Sanctum 认证的传入请求时，您可以使用 `tokenCan` 方法判断令牌是否有给定的能力：

```php
if ($user->tokenCan('server:update')) {
    // ...
}
```

#### 令牌能力中间件

Sanctum 还包括两个中间件，您可以使用它们来验证传入请求是否使用了授予给定能力的令牌进行了认证。要开始，请在您的应用程序的 `bootstrap/app.php` 文件中定义以下中间件别名：

```php
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'abilities' => CheckAbilities::class,
        'ability' => CheckForAnyAbility::class,
    ]);
})
```

`abilities` 中间件可以分配给一个路由，以验证传入请求的令牌是否具有所有列出的能力：

```php
Route::get('/orders', function () {
    // 令牌具有 "check-status" 和 "place-orders" 能力...
})->middleware(['auth:sanctum', 'abilities:check-status,place-orders']);
```

`ability` 中间件可以分配给一个路由，以验证传入请求的令牌是否至少具有列出的能力之一：

```php
Route::get('/orders', function () {
    // 令牌具有 "check-status" 或 "place-orders" 能力...
})->middleware(['auth:sanctum', 'ability:check-status,place-orders']);
```

#### 发起自第一方 UI 的请求

为了方便起见，如果传入的认证请求来自于您第一方的 SPA，且您正在使用 Sanctum 内置的 [SPA 认证](#spa-authentication)，那么 `tokenCan` 方法将始终返回 `true`。

然而，这并不一定意味着您的应用程序必须允许用户执行该操作。通常，应用程序的 [授权策略](/docs/11/security/authorization#creating-policies) 将决定令牌是否被授权执行能力以及检查用户实例自身是否应该被允许执行该操作。

例如，如果我们设想一个管理服务器的应用程序，这可能意味着检查令牌是否被授权更新服务器**并且**服务器属于用户：

```php
return $request->user()->id === $server->user_id &&
       $request->user()->tokenCan('server:update')
```

起初，允许调用 `tokenCan` 方法并始终为第一方 UI 发起的请求返回 `true` 可能会看起来奇怪；然而，能够始终假设 API 令牌是可用的，并且可以通过 `tokenCan` 方法进行检查是方便的。采取这种方法，您可以始终在应用程序的授权策略中调用 `tokenCan` 方法，而不用担心请求是由应用程序的 UI 触发的还是由您的 API 的第三方消费者发起的。

### 保护路由

为了保护路由，以确保所有传入的请求都必须经过认证，您应该将 `sanctum` 认证守卫附加到您在 `routes/web.php` 和 `routes/api.php` 路由文件中的受保护路由中。这个守卫将确保传入的请求被认证为有状态的、使用 cookie 认证的请求，或者如果请求来自第三方，则包含有效的 API 令牌头。

您可能想知道为什么我们建议使用 `sanctum` 守卫来认证应用程序 `routes/web.php` 文件中的路由。记住，Sanctum 首先会尝试使用 Laravel 的典型会话认证 cookie 来认证传入的请求。如果 cookie 不存在，那么 Sanctum 将尝试使用请求的 `Authorization` 头中的令牌来认证。此外，使用 Sanctum 认证所有请求确保我们可能总是在当前经过认证的用户实例上调用 `tokenCan` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

### 撤销令牌

您可以通过在数据库中删除令牌来“撤销”令牌，这可以通过使用 `Laravel\Sanctum\HasApiTokens` trait 提供的 `tokens` 关系完成：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销用于认证当前请求的令牌...
$request->user()->currentAccessToken()->delete();

// 撤销特定的令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

### 令牌过期

默认情况下，Sanctum 令牌永不过期，只能通过[撤销令牌](#revoking-tokens)来使其失效。然而，如果您想为应用程序的 API 令牌配置一个过期时间，您可以通过在应用程序的 `sanctum` 配置文件中定义的 `expiration` 配置选项来实现。这个配置选项定义了发行的令牌被认为过期的分钟数：

```php
'expiration' => 525600,
```

如果您希望独立指定每个令牌的过期时间，您可以通过将过期时间作为第三个参数提供给 `createToken` 方法来实现：

```php
return $user->createToken(
    'token-name', ['*'], now()->addWeek()
)->plainTextToken;
```

如果您为应用程序配置了令牌过期时间，您可能还希望[安排一个任务](/docs/11/digging-deeper/scheduling)来清除应用程序的过期令牌。幸运的是，Sanctum 包含一个 `sanctum:prune-expired` Artisan 命令，您可以使用它来完成这项工作。例如，您可以配置一个定时任务来删除所有已过期至少 24 小时的过期令牌数据库记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

## 单页面应用认证

Sanctum 还提供了一种用于认证单页面应用（SPAs）的简单方法，这些应用需要与 Laravel 支持的 API 进行通信。这些 SPA 可能与你的 Laravel 应用在同一个仓库中，也可能是完全独立的仓库。

对于此功能，Sanctum 根本不使用任何种类的令牌。相反，Sanctum 使用 Laravel 内置的基于 cookie 的会话认证服务。这种认证方法提供了 CSRF 保护、会话认证的好处，同时也防止了通过 XSS 泄露认证凭据。

> [!WARNING]
> 为了进行认证，您的 SPA 和 API 必须共享相同的顶级域名。不过，它们可以放置在不同的子域上。另外，您应确保在您的请求中发送 `Accept: application/json` 头，以及 `Referer` 或 `Origin` 头之一。

### 配置

#### 配置您的一方域

首先，您应该配置你的 SPA 将从哪些域进行请求。您可以使用 `sanctum` 配置文件中的 `stateful` 配置选项来配置这些域。此配置设置决定了在向 API 发出请求时，哪些域将维护基于 Laravel 会话 cookie 的“有状态”认证。

> [!WARNING]
> 如果您通过包含端口号的 URL（例如 `127.0.0.1:8000`）访问您的应用程序，您应确保在域中包含端口号。

#### Sanctum 中间件

接下来，您应该指导 Laravel 来自您的 SPA 的传入请求可以使用 Laravel 的会话 cookie 进行认证，同时仍然允许第三方或移动应用程序的请求使用 API 令牌进行认证。通过在应用程序的 `bootstrap/app.php` 文件中调用 `statefulApi` 中间件方法可以轻松完成此操作：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
});
```

#### CORS 和 Cookies

如果您在尝试从执行在另一个子域上的 SPA 对应用程序进行认证时遇到问题，您可能配置错误了 CORS（跨源资源共享）或会话 cookie 设置。

`config/cors.php` 配置文件默认情况下不会发布。如果您需要自定义 Laravel 的 CORS 选项，您应该使用 `config:publish` Artisan 命令发布完整的 `cors` 配置文件：

```bash
php artisan config:publish cors
```

接下来，您应该确保您的应用程序的 CORS 配置返回带有值为 `True` 的 `Access-Control-Allow-Credentials` 头。这可以通过在应用程序的 `config/cors.php` 配置文件中将 `supports_credentials` 选项设置为 `true` 来完成。

此外，您应该在全局 `axios` 实例上启用 `withCredentials` 和 `withXSRFToken` 选项。通常，这应该在您的 `resources/js/bootstrap.js` 文件中执行。如果您不使用 Axios 从前端发出 HTTP 请求，则应在自己的 HTTP 客户端上执行相应的配置：

```js
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
```

最后，您应确保您的应用程序的会话 cookie 域配置支持根域的任何子域。通过在应用程序的 `config/session.php` 配置文件中为域名前加上前导 `.`，您可以完成这一操作：

```php
'domain' => '.domain.com',
```

### 认证

#### CSRF 保护

要对您的 SPA 进行认证，您的 SPA 的 "登录" 页面应首先向 `/sanctum/csrf-cookie` 端点发出请求，以初始化应用程序的 CSRF 保护：

```js
axios.get('/sanctum/csrf-cookie').then((response) => {
  // 登录...
})
```

在此请求期间，Laravel 将设置包含当前 CSRF 令牌的 `XSRF-TOKEN` cookie。然后，在后续请求中，这个令牌应在 `X-XSRF-TOKEN` 头中传递，一些 HTTP 客户端库，比如 Axios 和 Angular HttpClient 会为您自动完成。如果您的 JavaScript HTTP 库没有为您设置该值，您将需要手动将 `X-XSRF-TOKEN` 头的值设置为此路由设置的 `XSRF-TOKEN` cookie 的值。

#### 登录

一旦启用了 CSRF 保护，您应对 Laravel 应用程序的 `/login` 路径发出 `POST` 请求。这个 `/login` 路由可以是[手动实现](/docs/11/security/authentication#authenticating-users)的，也可以使用无头认证包，如 [Laravel Fortify](/docs/11/packages/fortify)。

如果登录请求成功，您将被认证，并且后续对应用程序路由的请求将通过 Laravel 应用程序发给您的客户端的会话 cookie 自动认证。此外，由于您的应用程序已经向 `/sanctum/csrf-cookie` 路径发出请求，因此只要您的 JavaScript HTTP 客户端在 `X-XSRF-TOKEN` 头中发送 `XSRF-TOKEN` cookie 的值，后续请求应自动获得 CSRF 保护。

当然，如果用户的会话因缺乏活动而过期，后续对 Laravel 应用程序的请求可能会收到 401 或 419 HTTP 错误响应。在这种情况下，您应将用户重定向到 SPA 的登录页面。

> [!WARNING]
> 您可以编写自己的 `/login` 端点；但是，您应确保它使用 Laravel 提供的标准、[基于会话的认证服务](/docs/11/security/authentication#authenticating-users)来认证用户。通常，这意味着使用 `web` 认证守卫。

### 保护路由

要保护路由以确保所有传入请求必须被认证，您应该将 `sanctum` 认证守卫附加到在 `routes/api.php` 文件中的 API 路由上。这个守卫将确保传入请求要么是从您的 SPA 进行有状态认证，要么如果请求来自第三方，则包含有效的 API 令牌头：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

### 授权私人广播频道

如果您的 SPA 需要对[私人/出席广播频道](/docs/11/digging-deeper/broadcasting#authorizing-channels)进行认证，您应该从应用程序的 `bootstrap/app.php` 文件中删除带 `withRouting` 方法的 `channels` 条目。相反，您应该调用 `withBroadcasting` 方法，以便为您的应用程序的广播路由指定正确的中间件：

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // ...
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['auth:sanctum']],
    );
```

接下来，为了使 Pusher 的授权请求成功，您将需要在初始化 [Laravel Echo](/docs/11/digging-deeper/broadcasting#client-side-installation) 时提供自定义 Pusher `authorizer`。这允许您的应用程序配置 Pusher 以使用[正确配置用于跨域请求](#cors-and-cookies)的 `axios` 实例：

```js
window.Echo = new Echo({
  broadcaster: 'pusher',
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  encrypted: true,
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        axios
          .post('/api/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name
          })
          .then((response) => {
            callback(false, response.data)
          })
          .catch((error) => {
            callback(true, error)
          })
      }
    }
  }
})
```

## 移动应用程序认证

您也可以使用 Sanctum 令牌来认证移动应用程序对 API 的请求。认证移动应用程序请求的过程类似于认证第三方 API 请求；但是，在如何为请求发放 API 令牌方面有些许差异。

### 发放 API 令牌

首先，创建一个接受用户的电子邮件/用户名、密码和设备名称的路由，然后交换这些凭据以获得新的 Sanctum 令牌。提供给此端点的“设备名称”仅用于信息目的，可以是任何您希望的值。一般来说，设备名称的值应该是用户认可的名称，例如“Nuno's iPhone 12”。

通常，您会从移动应用程序的 "登录" 屏幕上向令牌端点发出请求。端点将返回纯文本 API 令牌，然后可以将其存储在移动设备上，并用来发出额外的 API 请求：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::post('/sanctum/token', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'device_name' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return $user->createToken($request->device_name)->plainTextToken;
});
```

当移动应用程序使用令牌向您的应用程序发出 API 请求时，它应该在 `Authorization` 头中将令牌作为 `Bearer` 令牌传递。

> [!NOTE]
> 在为移动应用程序发放令牌时，您也可以指定[令牌能力](#token-abilities)。

### 保护路由

如前所述，您可以保护路由，以确保所有传入请求都必须经过认证，方法是将 `sanctum` 认证守卫附加到路由上：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

### 撤销令牌

为了允许用户撤销发给移动设备的 API 令牌，你可以在你的网络应用程序的 "账户设置" 部分列出它们的名称，并提供一个 "撤销" 按钮。当用户点击 "撤销" 按钮时，你可以从数据库中删除该令牌。请记住，你可以通过 `Laravel\Sanctum\HasApiTokens` trait 提供的 `tokens` 关系来访问用户的 API 令牌：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销特定的令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

## 测试

在测试中，`Sanctum::actingAs` 方法可用来对用户进行认证并指定应授予其令牌的能力：

```php
// Pest 测试框架
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('任务列表可以被检索', function () {
    Sanctum::actingAs(
        User::factory()->create(),
        ['view-tasks']
    );

    $response = $this->get('/api/task');

    $response->assertOk();
});
```

```php
// PHPUnit 测试框架
use App\Models\User;
use Laravel\Sanctum\Sanctum;

public function test_task_list_can_be_retrieved(): void
{
    Sanctum::actingAs(
        User::factory()->create(),
        ['view-tasks']
    );

    $response = $this->get('/api/task');

    $response->assertOk();
}
```

如果你想授予令牌所有能力，你应该在提供给 `actingAs` 方法的能力列表中包含 `*`：

```php
Sanctum::actingAs(
    User::factory()->create(),
    ['*']
);
```
