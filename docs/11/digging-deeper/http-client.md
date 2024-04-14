---
title: Laravel HTTP 客户端
---

# HTTP 客户端

[[toc]]

## 简介

Laravel 提供了一个表达性强、最小化的 API 来封装 [Guzzle HTTP 客户端](http://docs.guzzlephp.org/en/stable/)，允许你快速地进行外部 HTTP 请求以与其他网络应用通信。Laravel 对 Guzzle 的封装集中在最常见的用例和卓越的开发体验上。

## 发起请求

为了发起请求，你可以使用 `Http` facade 提供的 `head`、`get`、`post`、`put`、`patch` 和 `delete` 方法。首先，让我们看看如何发起一个基本的 `GET` 请求到另一个 URL：

```php
use Illuminate\Support\Facades\Http;

$response = Http::get('http://example.com');
```

`get` 方法返回一个 `Illuminate\Http\Client\Response` 的实例，该实例提供了多种方法来检查响应：

```php
$response->body() : string;
$response->json($key = null, $default = null) : array|mixed;
$response->object() : object;
$response->collect($key = null) : Illuminate\Support\Collection;
$response->status() : int;
$response->successful() : bool;
$response->redirect(): bool;
$response->failed() : bool;
$response->clientError() : bool;
$response->serverError() : bool;
$response->header($header) : string;
$response->headers() : array;
```

`Illuminate\Http\Client\Response` 对象还实现了 PHP 的 `ArrayAccess` 接口，允许你直接在响应上访问 JSON 响应数据：

```php
return Http::get('http://example.com/users/1')['name'];
```

除了上面列出的响应方法之外，以下方法可以用来确定响应是否有给定的状态码：

```php
$response->ok() : bool;                  // 200 OK
$response->created() : bool;             // 201 Created
$response->accepted() : bool;            // 202 Accepted
$response->noContent() : bool;           // 204 No Content
$response->movedPermanently() : bool;    // 301 Moved Permanently
$response->found() : bool;               // 302 Found
$response->badRequest() : bool;          // 400 Bad Request
$response->unauthorized() : bool;        // 401 Unauthorized
$response->paymentRequired() : bool;     // 402 Payment Required
$response->forbidden() : bool;           // 403 Forbidden
$response->notFound() : bool;            // 404 Not Found
$response->requestTimeout() : bool;      // 408 Request Timeout
$response->conflict() : bool;            // 409 Conflict
$response->unprocessableEntity() : bool; // 422 Unprocessable Entity
$response->tooManyRequests() : bool;     // 429 Too Many Requests
$response->serverError() : bool;         // 500 Internal Server Error
```

#### URI 模板

HTTP 客户端还允许你使用 [URI 模板规范](https://www.rfc-editor.org/rfc/rfc6570) 构建请求 URL。如果要通过 URI 模板展开 URL 参数，可以使用 `withUrlParameters` 方法：

```php
Http::withUrlParameters([
    'endpoint' => 'https://laravel.com',
    'page' => 'docs',
    'version' => '11.x',
    'topic' => 'validation',
])->get('{+endpoint}/{page}/{version}/{topic}');
```

#### 转储请求

如果你想在发送前转储出站请求实例并终止脚本执行，你可以在请求定义开始时添加 `dd` 方法：

```php
return Http::dd()->get('http://example.com');
```

### 请求数据

当然，在发起 `POST`、`PUT` 和 `PATCH` 请求时常见的做法是发送附加数据。这些方法接受作为其第二个参数的数据数组。默认情况下，数据将使用 `application/json` 内容类型发送：

```php
use Illuminate\Support\Facades\Http;

$response = Http::post('http://example.com/users', [
    'name' => 'Steve',
    'role' => 'Network Administrator',
]);
```

#### GET 请求查询参数

在发起 `GET` 请求时，你可以直接在 URL 上附加查询字符串，或者作为第二个参数向 `get` 方法传递键/值对数组：

```php
$response = Http::get('http://example.com/users', [
    'name' => 'Taylor',
    'page' => 1,
]);
```

或者，你可以使用 `withQueryParameters` 方法：

```php
Http::retry(3, 100)->withQueryParameters([
    'name' => 'Taylor',
    'page' => 1,
])->get('http://example.com/users')
```

#### 发送格式为 URL 编码的表单请求

如果你想使用 `application/x-www-form-urlencoded` 内容类型发送数据，你应该在发出请求前调用 `asForm` 方法：

```php
$response = Http::asForm()->post('http://example.com/users', [
    'name' => 'Sara',
    'role' => 'Privacy Consultant',
]);
```

#### 发送原始请求体

如果你想在发出请求时提供原始请求体，可以使用 `withBody` 方法。内容类型可通过方法的第二个参数提供：

```php
$response = Http::withBody(
    base64_encode($photo), 'image/jpeg'
)->post('http://example.com/photo');
```

#### 多部分请求

如果你想发送文件作为多部分请求，你应该在发出请求前调用 `attach` 方法。此方法接受文件的名称及其内容。如有必要，你可以提供第三个参数，该参数将被视为文件的文件名，而第四个参数可用于提供与文件相关的头信息：

```php
$response = Http::attach(
    'attachment', file_get_contents('photo.jpg'), 'photo.jpg', ['Content-Type' => 'image/jpeg']
)->post('http://example.com/attachments');
```

除了传递文件的原始内容外，你还可以传递一个流资源：

```php
$photo = fopen('photo.jpg', 'r');

$response = Http::attach(
    'attachment', $photo, 'photo.jpg'
)->post('http://example.com/attachments');
```

### 头信息

使用 `withHeaders` 方法可以向请求添加头信息。这个 `withHeaders` 方法接受键/值对数组：

```php
$response = Http::withHeaders([
    'X-First' => 'foo',
    'X-Second' => 'bar'
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

你可以使用 `accept` 方法指定期望的内容类型以响应你的请求：

```php
$response = Http::accept('application/json')->get('http://example.com/users');
```

为了方便起见，你可以使用 `acceptJson` 方法快速指定期望以响应你的请求的内容类型为 `application/json`：

```php
$response = Http::acceptJson()->get('http://example.com/users');
```

`withHeaders` 方法会将新头信息合并到请求的现有头信息中。如果需要，你可以使用 `replaceHeaders` 方法完全替换所有头信息：

```php
$response = Http::withHeaders([
    'X-Original' => 'foo',
])->replaceHeaders([
    'X-Replacement' => 'bar',
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

### 认证

你可以使用 `withBasicAuth` 和 `withDigestAuth` 方法分别指定基本和摘要认证凭据：

```php
// 基本认证...
$response = Http::withBasicAuth('taylor@laravel.com', 'secret')->post(/* ... */);

// 摘要认证...
$response = Http::withDigestAuth('taylor@laravel.com', 'secret')->post(/* ... */);
```

#### 持有者令牌

如果你想要快速地将持有者令牌添加到请求的 `Authorization` 头信息中，你可以使用 `withToken` 方法：

```php
$response = Http::withToken('token')->post(/* ... */);
```

### 超时

你可以使用 `timeout` 方法指定等待响应的最大秒数。默认情况下，HTTP 客户端将在 30 秒后超时：

```php
$response = Http::timeout(3)->get(/* ... */);
```

如果超过给定的超时时间，将会抛出 `Illuminate\Http\Client\ConnectionException` 的实例。

你可以使用 `connectTimeout` 方法指定尝试连接服务器时等待的最大秒数：

```php
$response = Http::connectTimeout(3)->get(/* ... */);
```

### 重试

如果你想要 HTTP 客户端在发生客户端或服务器错误时自动重试请求，你可以使用 `retry` 方法。`retry` 方法接受请求应该尝试的最大次数和 Laravel 在尝试之间应该等待的毫秒数：

```php
$response = Http::retry(3, 100)->post(/* ... */);
```

如果你想要手动计算尝试之间睡眠的毫秒数，你可以将闭包作为第二个参数传递给 `retry` 方法：

```php
use Exception;

$response = Http::retry(3, function (int $attempt, Exception $exception) {
    return $attempt * 100;
})->post(/* ... */);
```

为了方便起见，你也可以为 `retry` 方法的第一个参数提供一个数组。这个数组将被用来决定在后续尝试之间睡眠多少毫秒：

```php
$response = Http::retry([100, 200])->post(/* ... */);
```

如果需要的话，你可以传递一个第三个参数给 `retry` 方法。第三个参数应该是一个可调用的，用于决定是否真的应该尝试重试。例如，如果初始请求遇到了 `ConnectionException`，你可能只希望重试请求：

```php
use Exception;
use Illuminate\Http\Client\PendingRequest;

$response = Http::retry(3, 100, function (Exception $exception, PendingRequest $request) {
    return $exception instanceof ConnectionException;
})->post(/* ... */);
```

如果一个请求尝试失败了，你可能希望在进行新尝试之前对请求做出改变。你可以通过修改提供给 `retry` 方法闭包的请求参数来实现这一点。例如，如果第一次尝试返回了一个认证错误，你可能希望用一个新的授权令牌重试请求：

```php
use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;

$response = Http::withToken($this->getToken())->retry(2, 0, function (Exception $exception, PendingRequest $request) {
    if (! $exception instanceof RequestException || $exception->response->status() !== 401) {
        return false;
    }

    $request->withToken($this->getNewToken());

    return true;
})->post(/* ... */);
```

如果所有的请求都失败了，将会抛出一个 `Illuminate\Http\Client\RequestException` 实例。如果你想要禁用这种行为，可以提供一个值为 `false` 的 `throw` 参数。当禁用时，客户端收到的最后一个响应将在所有重试尝试之后被返回：

```php
$response = Http::retry(3, 100, throw: false)->post(/* ... */);
```

> [!WARNING]  
> 如果所有的请求都因为连接问题失败了，即使 `throw` 参数被设置为 `false`，`Illuminate\Http\Client\ConnectionException` 依然会被抛出。

### 错误处理

与 Guzzle 的默认行为不同，Laravel 的 HTTP 客户端包装器在客户端或服务器错误（服务器返回的 `400` 和 `500` 级响应）时不会抛出异常。你可以使用 `successful`、`clientError` 或 `serverError` 方法来确定是否返回了这些错误之一：

```php
// 判断状态码是否 >= 200 且 < 300...
$response->successful();

// 判断状态码是否 >= 400...
$response->failed();

// 判断响应是否有一个 400 级状态码...
$response->clientError();

// 判断响应是否有一个 500 级状态码...
$response->serverError();

// 如果发生了客户端或服务器错误，立即执行给定的回调...
$response->onError(callable $callback);
```

#### 抛出异常

如果你有一个响应实例，并希望如果响应状态码指示客户端或服务器错误时抛出一个 `Illuminate\Http\Client\RequestException` 实例，你可以使用 `throw` 或 `throwIf` 方法：

```php
use Illuminate\Http\Client\Response;

$response = Http::post(/* ... */);

// 如果客户端或服务器错误发生，抛出异常...
$response->throw();

// 如果错误发生并且给定条件为真，抛出异常...
$response->throwIf($condition);

// 如果错误发生并且给定闭包解析为真，抛出异常...
$response->throwIf(fn (Response $response) => true);

// 如果错误发生并且给定条件为假，抛出异常...
$response->throwUnless($condition);

// 如果错误发生并且给定闭包解析为假，抛出异常...
$response->throwUnless(fn (Response $response) => false);

// 如果响应有特定的状态码，抛出异常...
$response->throwIfStatus(403);

// 除非响应有特定的状态码，否则抛出异常...
$response->throwUnlessStatus(200);

return $response['user']['id'];
```

`Illuminate\Http\Client\RequestException` 实例有一个公共的 `$response` 属性，允许你检查返回的响应。

如果没有发生错误，`throw` 方法会返回响应实例，允许你将其他操作链式调用到 `throw` 方法上：

```php
return Http::post(/* ... */)->throw()->json();
```

如果你想要在抛出异常之前执行一些附加逻辑，你可以传递一个闭包给 `throw` 方法。闭包被调用后，异常将自动被抛出，所以你不需要在闭包内重新抛出异常：

```php
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;

return Http::post(/* ... */)->throw(function (Response $response, RequestException $e) {
    // ...
})->json();
```

### Guzzle 中间件

由于 Laravel 的 HTTP 客户端由 Guzzle 提供支持，你可以利用 [Guzzle 中间件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html)来操作正在进行的请求或检查传入的响应。要操作正在进行的请求，通过 `withRequestMiddleware` 方法注册一个 Guzzle 中间件：

```php
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\RequestInterface;

$response = Http::withRequestMiddleware(
    function (RequestInterface $request) {
        return $request->withHeader('X-Example', 'Value');
    }
)->get('http://example.com');
```

同样，你可以通过注册 `withResponseMiddleware` 方法的中间件来检查传入的 HTTP 响应：

```php
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\ResponseInterface;

$response = Http::withResponseMiddleware(
    function (ResponseInterface $response) {
        $header = $response->getHeader('X-Example');

        // ...

        return $response;
    }
)->get('http://example.com');
```

#### 全局中间件

有时，你可能希望注册一个适用于每个正在进行的请求和传入响应的中间件。为此，你可以使用 `globalRequestMiddleware` 和 `globalResponseMiddleware` 方法。通常，这些方法应该在你的应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

Http::globalRequestMiddleware(fn ($request) => $request->withHeader(
    'User-Agent', 'Example Application/1.0'
));

Http::globalResponseMiddleware(fn ($response) => $response->withHeader(
    'X-Finished-At', now()->toDateTimeString()
));
```

### Guzzle 选项

你可以使用 `withOptions` 方法为正在进行的请求指定额外的 [Guzzle 请求选项](http://docs.guzzlephp.org/en/stable/request-options.html)。`withOptions` 方法接受一个键值对数组：

```php
$response = Http::withOptions([
    'debug' => true,
])->get('http://example.com/users');
```

#### 全局选项

要为每个正在进行的请求配置默认选项，你可以使用 `globalOptions` 方法。通常，该方法应该从你的应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Http::globalOptions([
        'allow_redirects' => false,
    ]);
}
```

## 并发请求

有时，你可能希望同时进行多个 HTTP 请求。换句话说，你希望同时派发几个请求，而不是顺序地发出请求。这在与慢速 HTTP API 交互时可以带来显著的性能提升。

幸运的是，你可以使用 `pool` 方法来实现这一点。`pool` 方法接受一个闭包，该闭包接收一个 `Illuminate\Http\Client\Pool` 实例，允许你轻松地向请求池添加请求以进行派发：

```php
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

$responses = Http::pool(fn (Pool $pool) => [
    $pool->get('http://localhost/first'),
    $pool->get('http://localhost/second'),
    $pool->get('http://localhost/third'),
]);

return $responses[0]->ok() &&
       $responses[1]->ok() &&
       $responses[2]->ok();
```

如你所见，每个响应实例都可以根据它被加入池的顺序访问。如果你愿意，可以使用 `as` 方法为请求命名，这样可以按名称访问对应的响应：

```php
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

$responses = Http::pool(fn (Pool $pool) => [
    $pool->as('first')->get('http://localhost/first'),
    $pool->as('second')->get('http://localhost/second'),
    $pool->as('third')->get('http://localhost/third'),
]);

return $responses['first']->ok();
```

#### 自定义并发请求

`pool` 方法不能与其他 HTTP 客户端方法（例如 `withHeaders` 或 `middleware` 方法）链式调用。如果你想要将自定义头或中间件应用于池中的请求，应该在池中的每个请求上配置这些选项：

```php
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

$headers = [
    'X-Example' => 'example',
];

$responses = Http::pool(fn (Pool $pool) => [
    $pool->withHeaders($headers)->get('http://laravel.test/test'),
    $pool->withHeaders($headers)->get('http://laravel.test/test'),
    $pool->withHeaders($headers)->get('http://laravel.test/test'),
]);
```

````markdown
## Macros

Laravel HTTP 客户端允许你定义“宏”，它可以作为一个流畅的、富有表现力的机制来配置常见的请求路径和头信息，当与整个应用中的服务交云时使用。开始使用宏，你可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义：

```php
use Illuminate\Support\Facades\Http;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Http::macro('github', function () {
        return Http::withHeaders([
            'X-Example' => 'example',
        ])->baseUrl('https://github.com');
    });
}
```
````

一旦你的宏配置好了，你可以在应用中的任何地方调用它来创建一个带有指定配置的待处理请求：

```php
$response = Http::github()->get('/');
```

## 测试

许多 Laravel 服务提供了帮助你轻松且有表现力地编写测试的功能，Laravel 的 HTTP 客户端也不例外。`Http` facade 的 `fake` 方法允许你指导 HTTP 客户端在请求时返回桩响应/虚拟响应。

### 模拟响应

例如，要指导 HTTP 客户端对每个请求返回空的 `200` 状态码响应，你可以不带参数地调用 `fake` 方法：

```php
use Illuminate\Support\Facades\Http;

Http::fake();

$response = Http::post(/* ... */);
```

#### 针对特定 URL 模拟

或者，你可以向 `fake` 方法传递一个数组。数组的键应该代表你希望模拟的 URL 模式及其关联的响应。`*` 字符可用作通配符。对于没有被模拟的 URL 发出的任何请求都会被实际执行。你可以使用 `Http` facade 的 `response` 方法为这些端点构建桩/虚拟响应：

```php
Http::fake([
    // 为 GitHub 端点模拟一个 JSON 响应...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, $headers),

    // 为 Google 端点模拟一个字符串响应...
    'google.com/*' => Http::response('Hello World', 200, $headers),
]);
```

如果你想指定一个回退 URL 模式，将模拟所有未匹配的 URL，你可以使用单个 `*` 字符：

```php
Http::fake([
    // 为 GitHub 端点模拟一个 JSON 响应...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, ['Headers']),

    // 为所有其他端点模拟一个字符串响应...
    '*' => Http::response('Hello World', 200, ['Headers']),
]);
```

#### 模拟响应序列

有时你可能需要指定一个单一 URL 应该按照特定顺序返回一系列假响应。你可以使用 `Http::sequence` 方法来构建响应来实现这一点：

```php
Http::fake([
    // 为 GitHub 端点模拟一系列响应...
    'github.com/*' => Http::sequence()
                            ->push('Hello World', 200)
                            ->push(['foo' => 'bar'], 200)
                            ->pushStatus(404),
]);
```

当一个响应序列中的所有响应都被消费后，任何进一步的请求都会导致响应序列抛出异常。如果你想指定当序列为空时应该返回的默认响应，你可以使用 `whenEmpty` 方法：

```php
Http::fake([
    // 为 GitHub 端点模拟一系列响应...
    'github.com/*' => Http::sequence()
                            ->push('Hello World', 200)
                            ->push(['foo' => 'bar'], 200)
                            ->whenEmpty(Http::response()),
]);
```

如果你想模拟响应序列，但不需要指定应该被模拟的特定 URL 模式，你可以使用 `Http::fakeSequence` 方法：

```php
Http::fakeSequence()
        ->push('Hello World', 200)
        ->whenEmpty(Http::response());
```

#### 模拟回调

如果你需要更复杂的逻辑来确定对某些端点返回什么响应，你可以将一个闭包传递给 `fake` 方法。这个闭包将接收一个 `Illuminate\Http\Client\Request` 实例并应返回一个响应实例。在你的闭包中，你可以执行任何必要的逻辑来确定返回哪种类型的响应：

```php
use Illuminate\Http\Client\Request;

Http::fake(function (Request $request) {
    return Http::response('Hello World', 200);
});
```

### 防止错误请求

如果你想确保通过 HTTP 客户端发送的所有请求都在你的个别测试或完整测试套件中被模拟过，你可以调用 `preventStrayRequests` 方法。调用这个方法后，任何没有相应假响应的请求都会抛出异常，而不是进行实际的 HTTP 请求：

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();

Http::fake([
    'github.com/*' => Http::response('ok'),
]);

// 返回 "ok" 响应...
Http::get('https://github.com/laravel/framework');

// 抛出异常...
Http::get('https://laravel.com');
```

### 检查请求

当你伪造响应时，你可能偶尔希望检查客户端接收到的请求，以确保你的应用程序正在发送正确的数据或头部。你可以在调用 `Http::fake` 后通过调用 `Http::assertSent` 方法来完成这个操作。

`assertSent` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个布尔值，表明请求是否符合你的预期。为了使测试通过，至少必须发出一个与给定预期相匹配的请求：

```php
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

Http::fake();

Http::withHeaders([
    'X-First' => 'foo',
])->post('http://example.com/users', [
    'name' => 'Taylor',
    'role' => 'Developer',
]);

Http::assertSent(function (Request $request) {
    return $request->hasHeader('X-First', 'foo') &&
           $request->url() == 'http://example.com/users' &&
           $request['name'] == 'Taylor' &&
           $request['role'] == 'Developer';
});
```

如果需要，你可以使用 `assertNotSent` 方法来断言特定的请求没有被发送：

```php
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

Http::fake();

Http::post('http://example.com/users', [
    'name' => 'Taylor',
    'role' => 'Developer',
]);

Http::assertNotSent(function (Request $request) {
    return $request->url() === 'http://example.com/posts';
});
```

你可以使用 `assertSentCount` 方法来断言在测试期间“发送”的请求数量：

```php
Http::fake();

Http::assertSentCount(5);
```

或者，你也可以使用 `assertNothingSent` 方法来断言在测试期间没有发送任何请求：

```php
Http::fake();

Http::assertNothingSent();
```

#### 记录请求 / 响应

你可以使用 `recorded` 方法来收集所有请求及其对应的响应。`recorded` 方法返回一个包含 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例的数组集合：

```php
Http::fake([
    'https://laravel.com' => Http::response(status: 500),
    'https://nova.laravel.com/' => Http::response(),
]);

Http::get('https://laravel.com');
Http::get('https://nova.laravel.com/');

$recorded = Http::recorded();

[$request, $response] = $recorded[0];
```

此外，`recorded` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例和一个 `Illuminate\Http\Client\Response` 实例，并且可以用来根据你的预期过滤请求 / 响应对：

```php
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\Response;

Http::fake([
    'https://laravel.com' => Http::response(status: 500),
    'https://nova.laravel.com/' => Http::response(),
]);

Http::get('https://laravel.com');
Http::get('https://nova.laravel.com/');

$recorded = Http::recorded(function (Request $request, Response $response) {
    return $request->url() !== 'https://laravel.com' &&
           $response->successful();
});
```

## 事件

在发送 HTTP 请求的过程中，Laravel 会触发三个事件。`RequestSending` 事件在请求发送之前触发，而 `ResponseReceived` 事件在接收到给定请求的响应后触发。如果没有收到给定请求的响应，则会触发 `ConnectionFailed` 事件。

`RequestSending` 和 `ConnectionFailed` 事件都包含一个公共的 `$request` 属性，你可以使用它来检查 `Illuminate\Http\Client\Request` 实例。同样地，`ResponseReceived` 事件包含一个 `$request` 属性以及一个 `$response` 属性，可用于检查 `Illuminate\Http\Client\Response` 实例。你可以为你的应用程序中的这些事件创建事件监听器：

```php
use Illuminate\Http\Client\Events\RequestSending;

class LogRequest
{
    /**
     * 处理给定的事件。
     */
    public function handle(RequestSending $event): void
    {
        // $event->request ...
    }
}
```
