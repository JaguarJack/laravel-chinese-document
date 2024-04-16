---
title: Laravel HTTP 测试
---

# HTTP 测试

[[toc]]

## 介绍

Laravel 提供了一个非常流畅的 API 来对你的应用程序进行 HTTP 请求并检查响应。例如，请看下面定义的特性测试：

```php
<?php

test('the application returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

`get` 方法向应用程序发出一个 `GET` 请求，而 `assertStatus` 方法断言返回的响应应该具有给定的 HTTP 状态代码。除了这个简单的断言之外，Laravel 还包含了各种断言，用于检查响应头、内容、JSON 结构等。

## 发起请求

要对你的应用程序发起请求，你可以在测试中调用 `get`、`post`、`put`、`patch` 或 `delete` 方法。这些方法实际上并不向你的应用程序发出 "真正的" HTTP 请求。相反，整个网络请求在内部被模拟执行。

这些测试请求方法返回的不是 `Illuminate\Http\Response` 实例，而是 `Illuminate\Testing\TestResponse` 实例，提供了 [多种有用的断言](#available-assertions)，允许你检查应用程序的响应：

```php
<?php

test('basic request', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_a_basic_request(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

通常，你的每个测试应该只向你的应用程序发出一个请求。如果在一个测试方法内执行多个请求，可能会发生意外行为。

> [!NOTE]
> 为了方便，当运行测试时 CSRF 中间件会自动被禁用。

### 自定义请求头

你可以使用 `withHeaders` 方法在请求发送到应用程序之前自定义请求头。这个方法允许你向请求中添加任何自定义头：

```php
<?php

test('interacting with headers', function () {
    $response = $this->withHeaders([
        'X-Header' => 'Value',
    ])->post('/user', ['name' => 'Sally']);

    $response->assertStatus(201);
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的功能测试示例。
     */
    public function test_interacting_with_headers(): void
    {
        $response = $this->withHeaders([
            'X-Header' => 'Value',
        ])->post('/user', ['name' => 'Sally']);

        $response->assertStatus(201);
    }
}
```

### Cookies

你可以使用 `withCookie` 或 `withCookies` 方法在发出请求之前设置 cookie 值。`withCookie` 方法接受一个 cookie 名称和值作为它的两个参数，而 `withCookies` 方法接受一个名称/值对数组：

```php
<?php

test('interacting with cookies', function () {
    $response = $this->withCookie('color', 'blue')->get('/');

    $response = $this->withCookies([
        'color' => 'blue',
        'name' => 'Taylor',
    ])->get('/');

    //
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_interacting_with_cookies(): void
    {
        $response = $this->withCookie('color', 'blue')->get('/');

        $response = $this->withCookies([
            'color' => 'blue',
            'name' => 'Taylor',
        ])->get('/');

        //
    }
}
```

### 会话和认证

Laravel 提供了几个助手方法，用于在 HTTP 测试期间与会话交互。首先，你可以使用 `withSession` 方法将会话数据设置到给定数组。在向应用程序发出请求之前用数据加载会话是很有用的：

```php
<?php

test('interacting with the session', function () {
    $response = $this->withSession(['banned' => false])->get('/');

    //
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_interacting_with_the_session(): void
    {
        $response = $this->withSession(['banned' => false])->get('/');

        //
    }
}
```

Laravel 的会话通常用于维持当前认证用户的状态。因此，`actingAs` 辅助方法提供了一种简单的方式来认证给定用户作为当前用户。例如，我们可以使用 [模型工厂](/docs/11/eloquent/eloquent-factories) 生成并认证一个用户：

```php
<?php

use App\Models\User;

test('an action that requires authentication', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
                     ->withSession(['banned' => false])
                     ->get('/');

    //
});
```

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_an_action_that_requires_authentication(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
                         ->withSession(['banned' => false])
                         ->get('/');

        //
    }
}
```

你还可以指定使用哪个守卫来认证给定用户，只需将守卫名称作为第二个参数传递给 `actingAs` 方法。提供给 `actingAs` 方法的守卫也将成为测试期间的默认守卫：

```php
$this->actingAs($user, 'web')
```

### 调试响应

在向应用程序发送测试请求后，可以使用 `dump`、`dumpHeaders` 和 `dumpSession` 方法来检查和调试响应内容：

```php
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->dumpHeaders();

    $response->dumpSession();

    $response->dump();
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->dumpHeaders();

        $response->dumpSession();

        $response->dump();
    }
}
```

或者，你可以使用 `dd`、`ddHeaders` 和 `ddSession` 方法来打印有关响应的信息，然后停止执行：

```php
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->ddHeaders();

    $response->ddSession();

    $response->dd();
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->ddHeaders();

        $response->ddSession();

        $response->dd();
    }
}
```

### 异常处理

有时你可能想测试你的应用程序是否抛出了特定的异常。为了确保异常不会被 Laravel 的异常处理器捕获并返回为 HTTP 响应，你可以在发出请求之前调用 `withoutExceptionHandling` 方法：

```php
$response = $this->withoutExceptionHandling()->get('/');
```

此外，如果你想确保你的应用程序没有使用 PHP 语言或应用程序正在使用的库已经弃用的功能，你可以在发出请求之前调用 `withoutDeprecationHandling` 方法。当禁用弃用处理时，弃用警告将转换为异常，从而使你的测试失败：

```php
$response = $this->withoutDeprecationHandling()->get('/');
```

`assertThrows` 方法可用于断言给定闭包中的代码是否抛出了指定类型的异常：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    OrderInvalid::class
);
```

## 测试 JSON API

Laravel 还提供了几个助手方法用于测试 JSON API 及其响应。例如，`json`、`getJson`、`postJson`、`putJson`、`patchJson`、`deleteJson` 和 `optionsJson` 方法可以用于以各种 HTTP 动词发出 JSON 请求。你也可以轻松地向这些方法传递数据和头信息。开始吧，让我们编写一个测试，向 `/api/user` 发起 `POST` 请求，并断言返回了预期的 JSON 数据：

```php
<?php

test('making an api request', function () {
    $response = $this->postJson('/api/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertJson([
            'created' => true,
         ]);
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的功能测试示例。
     */
    public function test_making_an_api_request(): void
    {
        $response = $this->postJson('/api/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertJson([
                'created' => true,
            ]);
    }
}
```

此外，JSON 响应数据可以作为数组变量在响应中访问，使你方便地检查 JSON 响应中返回的单个值：

```php
expect($response['created'])->toBeTrue();
```

```php
$this->assertTrue($response['created']);
```

> [!NOTE]

> `assertJson` 方法将响应转换为数组，并使用 `PHPUnit::assertArraySubset` 验证给定数组是否存在于应用程序返回的 JSON 响应中。因此，即使 JSON 响应中还有其他属性，此测试仍会通过，只要存在给定的片段。

#### 断言精确的 JSON 匹配

如前所述，`assertJson` 方法可以用来断言 JSON 响应中存在 JSON 片段。如果你想验证给定数组**完全匹配**应用程序返回的 JSON，你应该使用 `assertExactJson` 方法：

```php
<?php

test('asserting an exact json match', function () {
    $response = $this->postJson('/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertExactJson([
            'created' => true,
        ]);
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的功能测试示例。
     */
    public function test_asserting_an_exact_json_match(): void
    {
        $response = $this->postJson('/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertExactJson([
                'created' => true,
            ]);
    }
}
```

#### 断言 JSON 路径

如果你想验证 JSON 响应在指定路径包含给定数据，你应该使用 `assertJsonPath` 方法：

```php
<?php

test('asserting a json path value', function () {
    $response = $this->postJson('/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertJsonPath('team.owner.name', 'Darian');
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的功能测试示例。
     */
    public function test_asserting_a_json_paths_value(): void
    {
        $response = $this->postJson('/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertJsonPath('team.owner.name', 'Darian');
    }
}
```

`assertJsonPath` 方法还接受一个闭包，该闭包可以用来动态确定断言应该通过：

```php
$response->assertJsonPath('team.owner.name', fn (string $name) => strlen($name) >= 3);
```

### 流畅的 JSON 测试

Laravel 还提供了一种漂亮的方式来流畅地测试应用程序的 JSON 响应。开始，将一个闭包传递给 `assertJson` 方法。这个闭包将会调用一个 `Illuminate\Testing\Fluent\AssertableJson` 的实例，这可以用来对应用程序返回的 JSON 进行断言。`where` 方法可以用于对 JSON 的特定属性作出断言，而 `missing` 方法可以用于断言 JSON 中缺少特定的属性：

```php
use Illuminate\Testing\Fluent\AssertableJson;

test('fluent json', function () {
    $response = $this->getJson('/users/1');

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->where('id', 1)
                 ->where('name', 'Victoria Faith')
                 ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                 ->whereNot('status', 'pending')
                 ->missing('password')
                 ->etc()
        );
});
```

```php
use Illuminate\Testing\Fluent\AssertableJson;

/**
 * 一个基本的功能测试示例。
 */
public function test_fluent_json(): void
{
    $response = $this->getJson('/users/1');

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->where('id', 1)
                 ->where('name', 'Victoria Faith')
                 ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                 ->whereNot('status', 'pending')
                 ->missing('password')
                 ->etc()
        );
}
```

#### 理解 `etc` 方法

在上面的示例中，你可能已经注意到我们在断言链的最后调用了 `etc` 方法。这个方法告诉 Laravel JSON 对象中可能存在其他属性。如果不使用 `etc` 方法，测试会失败，因为在 JSON 对象上存在你没有进行断言的其他属性。

这背后的意图是通过强制你对属性进行显式断言或通过 `etc` 方法显式允许额外的属性，来保护你不会无意中在 JSON 响应中暴露敏感信息。

然而，你应该意识到，在你的断言链中不包括 `etc` 方法并不能确保不会向 JSON 对象中嵌套的数组添加额外的属性。`etc` 方法只确保在调用 `etc` 方法的嵌套级别上不存在额外的属性。

#### 断言属性存在/缺失

要断言属性是否存在或缺失，你可以使用 `has` 和 `missing` 方法：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->has('data')
         ->missing('message')
);
```

此外，`hasAll` 和 `missingAll` 方法允许同时断言多个属性的存在或缺失：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->hasAll(['status', 'data'])
         ->missingAll(['message', 'code'])
);
```

你可以使用 `hasAny` 方法确定给定列表中至少有一个属性存在：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->has('status')
         ->hasAny('data', 'message', 'code')
);
```

#### 断言 JSON 集合

通常，你的路由将返回一个包含多个项目的 JSON 响应，例如多个用户：

```php
Route::get('/users', function () {
    return User::all();
});
```

在这些情况下，我们可以使用流畅 JSON 对象的 `has` 方法对响应中包含的用户进行断言。例如，让我们断言 JSON 响应包含三个用户。接下来，我们将使用 `first` 方法对集合中的第一个用户进行一些断言。`first` 方法接受一个闭包，该闭包接收另一个可断言的 JSON 字符串，我们可以用它来断言 JSON 集合中的第一个对象：

```php
$response
    ->assertJson(fn (AssertableJson $json) =>
        $json->has(3)
             ->first(fn (AssertableJson $json) =>
                $json->where('id', 1)
                     ->where('name', 'Victoria Faith')
                     ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                     ->missing('password')
                     ->etc()
             )
    );
```

#### 范围 JSON 集合断言

有时，你的应用程序的路由将返回分配了名字的 JSON 集合：

```php
Route::get('/users', function () {
    return [
        'meta' => [...],
        'users' => User::all(),
    ];
})
```

测试这些路由时，你可以使用 `has` 方法对集合中的项目数量进行断言。此外，你可以使用 `has` 方法来范围断言链：

```php
$response
    ->assertJson(fn (AssertableJson $json) =>
        $json->has('meta')
             ->has('users', 3)
             ->has('users.0', fn (AssertableJson $json) =>
                $json->where('id', 1)
                     ->where('name', 'Victoria Faith')
                     ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                     ->missing('password')
                     ->etc()
             )
    );
```

然而，与其使用两次 `has` 方法对 `users` 集合进行断言，不如一次调用 `has` 方法，并提供一个闭包作为第三个参数。这样做时，闭包将自动被调用并限定在集合的第一项：

```php
$response
    ->assertJson(fn (AssertableJson $json) =>
        $json->has('meta')
             ->has('users', 3, fn (AssertableJson $json) =>
                $json->where('id', 1)
                     ->where('name', 'Victoria Faith')
                     ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                     ->missing('password')
                     ->etc()
             )
    );
```

#### 断言 JSON 类型

你可能只想断言 JSON 响应中的属性是某种类型。`Illuminate\Testing\Fluent\AssertableJson` 类提供了 `whereType` 和 `whereAllType` 方法来做到这一点：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->whereType('id', 'integer')
         ->whereAllType([
            'users.0.name' => 'string',
            'meta' => 'array'
        ])
);
```

你可以使用 `|` 字符指定多个类型，或者将类型数组作为第二个参数传递给 `whereType` 方法。如果响应值是列出的任何类型，断言将成功：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->whereType('name', 'string|null')
         ->whereType('id', ['string', 'integer'])
);
```

`whereType` 和 `whereAllType` 方法认识以下类型：`string`、`integer`、`double`、`boolean`、`array` 和 `null`。

## 测试文件上传

`Illuminate\Http\UploadedFile` 类提供了一个 `fake` 方法，可以用来为测试生成假文件或图像。这与 `Storage` facade 的 `fake` 方法相结合，大大简化了文件上传的测试。例如，你可以将这两个功能结合起来轻松地测试头像上传表单：

```php
<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('avatars can be uploaded', function () {
    Storage::fake('avatars');

    $file = UploadedFile::fake()->image('avatar.jpg');

    $response = $this->post('/avatar', [
        'avatar' => $file,
    ]);

    Storage::disk('avatars')->assertExists($file->hashName());
});
```

```php
<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_avatars_can_be_uploaded(): void
    {
        Storage::fake('avatars');

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->post('/avatar', [
            'avatar' => $file,
        ]);

        Storage::disk('avatars')->assertExists($file->hashName());
    }
}
```

如果你想断言某个文件不存在，可以使用 `Storage` facade 提供的 `assertMissing` 方法：

```php
Storage::fake('avatars');

// ...

Storage::disk('avatars')->assertMissing('missing.jpg');
```

#### 伪造文件自定义

在使用 `UploadedFile` 类提供的 `fake` 方法创建文件时，你可以指定图像的宽度、高度和大小（以千字节为单位），以便更好地测试应用程序的验证规则：

```php
UploadedFile::fake()->image('avatar.jpg', $width, $height)->size(100);
```

除了创建图像，你还可以使用 `create` 方法创建任何其他类型的文件：

```php
UploadedFile::fake()->create('document.pdf', $sizeInKilobytes);
```

如果需要，你可以将 `$mimeType` 参数传递给该方法，以明确定义文件应返回的 MIME 类型：

```php
UploadedFile::fake()->create(
    'document.pdf', $sizeInKilobytes, 'application/pdf'
);
```

## 测试视图

Laravel 还允许你在不进行模拟 HTTP 请求到应用程序的情况下渲染视图。要完成此操作，你可以在测试中调用 `view` 方法。`view` 方法接受视图名称和可选的数据数组。该方法返回一个 `Illuminate\Testing\TestView` 的实例，提供了几种方便的方法来断言视图内容：

```php
<?php

test('a welcome view can be rendered', function () {
    $view = $this->view('welcome', ['name' => 'Taylor']);

    $view->assertSee('Taylor');
});
```

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_a_welcome_view_can_be_rendered(): void
    {
        $view = $this->view('welcome', ['name' => 'Taylor']);

        $view->assertSee('Taylor');
    }
}
```

`TestView` 类提供了以下断言方法：`assertSee`、`assertSeeInOrder`、`assertSeeText`、`assertSeeTextInOrder`、`assertDontSee` 和 `assertDontSeeText`。

如有需要，你可以通过将 `TestView` 实例转换为字符串来获取原始的渲染视图内容：

```php
$contents = (string) $this->view('welcome');
```

#### 分享错误

有些视图可能依赖于 Laravel 提供的[全局错误包](/docs/11/basics/validation#quick-displaying-the-validation-errors)中共享的错误。要使用错误信息填充错误包，你可以使用 `withViewErrors` 方法：

```php
$view = $this->withViewErrors([
    'name' => ['Please provide a valid name.']
])->view('form');

$view->assertSee('Please provide a valid name.');
```

### 渲染 Blade 和组件

如有必要，你可以使用 `blade` 方法来评估和渲染原始的 [Blade](//docs/11/basics/blade) 字符串。和 `view` 方法一样，`blade` 方法返回一个 `Illuminate\Testing\TestView` 实例：

```php
$view = $this->blade(
    '<x-component :name="$name" />',
    ['name' => 'Taylor']
);

$view->assertSee('Taylor');
```

你可以使用 `component` 方法来评估和渲染 [Blade 组件](//docs/11/basics/blade#components)。`component` 方法返回一个 `Illuminate\Testing\TestComponent` 实例：

```php
$view = $this->component(Profile::class, ['name' => 'Taylor']);

$view->assertSee('Taylor');
```

## 可用的断言

### 响应断言

Laravel 的 `Illuminate\Testing\TestResponse` 类提供了各种自定义断言方法，你可以在测试应用程序时使用这些断言。这些断言可以在由 `json`、`get`、`post`、`put` 和 `delete` 测试方法返回的响应上访问：

- assertAccepted
- assertBadRequest
- assertConflict
- assertCookie
- assertCookieExpired
- assertCookieNotExpired
- assertCookieMissing
- assertCreated
- assertDontSee
- assertDontSeeText
- assertDownload
- assertExactJson
- assertForbidden
- assertFound
- assertGone
- assertHeader
- assertHeaderMissing
- assertInternalServerError
- assertJson
- assertJsonCount
- assertJsonFragment
- assertJsonIsArray
- assertJsonIsObject
- assertJsonMissing
- assertJsonMissingExact
- assertJsonMissingValidationErrors
- assertJsonPath
- assertJsonMissingPath
- assertJsonStructure
- assertJsonValidationErrors
- assertJsonValidationErrorFor
- assertLocation
- assertMethodNotAllowed
- assertMovedPermanently
- assertContent
- assertNoContent
- assertStreamedContent
- assertNotFound
- assertOk
- assertPaymentRequired
- assertPlainCookie
- assertRedirect
- assertRedirectContains
- assertRedirectToRoute
- assertRedirectToSignedRoute
- assertRequestTimeout
- assertSee
- assertSeeInOrder
- assertSeeText
- assertSeeTextInOrder
- assertServerError
- assertServiceUnavailable
- assertSessionHas
- assertSessionHasInput
- assertSessionHasAll
- assertSessionHasErrors
- assertSessionHasErrorsIn
- assertSessionHasNoErrors
- assertSessionDoesntHaveErrors
- assertSessionMissing
- assertStatus
- assertSuccessful
- assertTooManyRequests
- assertUnauthorized
- assertUnprocessable
- assertUnsupportedMediaType
- assertValid
- assertInvalid
- assertViewHas
- assertViewHasAll
- assertViewIs
- assertViewMissing

````

#### assertBadRequest

断言响应具有错误请求（400）HTTP 状态码：

```php
$response->assertBadRequest();
````

#### assertAccepted

断言响应具有已接受（202）HTTP 状态码：

```php
$response->assertAccepted();
```

#### assertConflict

断言响应具有冲突（409）HTTP 状态码：

```php
$response->assertConflict();
```

#### assertCookie

断言响应包含给定的 cookie：

```php
$response->assertCookie($cookieName, $value = null);
```

#### assertCookieExpired

断言响应包含给定的 cookie 并且已经过期：

```php
$response->assertCookieExpired($cookieName);
```

#### assertCookieNotExpired

断言响应包含给定的 cookie 并且未过期：

```php
$response->assertCookieNotExpired($cookieName);
```

#### assertCookieMissing

断言响应不包含给定的 cookie：

```php
$response->assertCookieMissing($cookieName);
```

#### assertCreated

断言响应有一个 201 HTTP 状态码：

```php
$response->assertCreated();
```

#### assertDontSee

断言应用程序返回的响应中不包含给定字符串。除非传入第二个参数 `false`，否则此断言将自动转义给定字符串：

```php
$response->assertDontSee($value, $escaped = true);
```

#### assertDontSeeText

断言响应文本中不包含给定字符串。除非传入第二个参数 `false`，否则此断言将自动转义给定字符串。在进行断言之前，此方法会将响应内容通过 PHP 的 `strip_tags` 函数处理：

```php
$response->assertDontSeeText($value, $escaped = true);
```

#### assertDownload

断言响应是“下载”。通常，这意味着产生响应的调用路由返回了一个 `Response::download` 响应、`BinaryFileResponse` 或 `Storage::download` 响应：

```php
$response->assertDownload();
```

如果需要，你可以断言下载的文件被赋予了给定文件名：

```php
$response->assertDownload('image.jpg');
```

#### assertExactJson

断言响应包含完全匹配给定 JSON 数据的内容：

```php
$response->assertExactJson(array $data);
```

#### assertForbidden

断言响应具有禁止 (403) HTTP 状态码：

```php
$response->assertForbidden();
```

#### assertFound

断言响应具有已找到 (302) HTTP 状态码：

```php
$response->assertFound();
```

#### assertGone

断言响应具有已消失 (410) HTTP 状态码：

```php
$response->assertGone();
```

#### assertHeader

断言响应中存在给定的头部和值：

```php
$response->assertHeader($headerName, $value = null);
```

#### assertHeaderMissing

断言响应中不存在给定的头部：

```php
$response->assertHeaderMissing($headerName);
```

#### assertInternalServerError

断言响应具有"内部服务器错误" (500) HTTP 状态码：

```php
$response->assertInternalServerError();
```

#### assertJson

断言响应包含给定的 JSON 数据：

```php
$response->assertJson(array $data, $strict = false);
```

`assertJson` 方法将响应转换为一个数组，并利用 `PHPUnit::assertArraySubset` 来验证给定数组是否存在于应用程序返回的 JSON 响应中。因此，即使 JSON 响应中还有其他属性，只要包含了给定片段，此测试仍会通过。

#### assertJsonCount

断言响应 JSON 在给定键处有期望数量的项目组成的数组：

```php
$response->assertJsonCount($count, $key = null);
```

#### assertJsonFragment

断言响应中的任何位置包含给定的 JSON 数据：

```php
Route::get('/users', function () {
    return [
        'users' => [
            [
                'name' => 'Taylor Otwell',
            ],
        ],
    ];
});

$response->assertJsonFragment(['name' => 'Taylor Otwell']);
```

#### assertJsonIsArray

断言响应 JSON 是一个数组：

```php
$response->assertJsonIsArray();
```

#### assertJsonIsObject

断言响应 JSON 是一个对象：

```php
$response->assertJsonIsObject();
```

#### assertJsonMissing

断言响应不包含给定的 JSON 数据：

```php
$response->assertJsonMissing(array $data);
```

#### assertJsonMissingExact

断言响应不包含完全匹配的 JSON 数据：

```php
$response->assertJsonMissingExact(array $data);
```

#### assertJsonMissingValidationErrors

断言响应对于给定键没有 JSON 验证错误：

```php
$response->assertJsonMissingValidationErrors($keys);
```

> 请注意：
> 更通用的 [assertValid](#assert-valid) 方法可用于断言响应没有作为 JSON 返回的验证错误，并且没有错误被闪现到会话存储。

#### assertJsonPath

断言响应在指定路径包含给定的数据：

```php
$response->assertJsonPath($path, $expectedValue);
```

例如，如果应用程序返回以下 JSON 响应：

```json
{
  "user": {
    "name": "Steve Schoger"
  }
}
```

你可以断言 `user` 对象的 `name` 属性与给定值匹配，如下所示：

```php
$response->assertJsonPath('user.name', 'Steve Schoger');
```

#### assertJsonMissingPath

断言响应不包含给定的路径：

```php
$response->assertJsonMissingPath($path);
```

例如，如果应用程序返回以下 JSON 响应：

```json
{
  "user": {
    "name": "Steve Schoger"
  }
}
```

你可以断言它不包含 `user` 对象的 `email` 属性：

```php
$response->assertJsonMissingPath('user.email');
```

#### assertJsonStructure

断言响应具有给定的 JSON 结构：

```php
$response->assertJsonStructure(array $structure);
```

例如，如果应用程序返回的 JSON 响应包含以下数据：

```json
{
  "user": {
    "name": "Steve Schoger"
  }
}
```

你可以断言 JSON 结构符合你的预期，如下所示：

```php
$response->assertJsonStructure([
    'user' => [
        'name',
    ]
]);
```

有时，应用程序返回的 JSON 响应可能包含对象数组：

```json
{
  "user": [
    {
      "name": "Steve Schoger",
      "age": 55,
      "location": "Earth"
    },
    {
      "name": "Mary Schoger",
      "age": 60,
      "location": "Earth"
    }
  ]
}
```

在这种情况下，你可以使用 `*` 字符来针对数组中所有对象的结构进行断言：

```php
$response->assertJsonStructure([
    'user' => [
        '*' => [
             'name',
             'age',
             'location'
        ]
    ]
]);
```

#### assertJsonValidationErrors

断言响应包含给定键的给定 JSON 验证错误。当响应中的验证错误以 JSON 结构返回而不是闪现到会话时，应使用此方法：

```php
$response->assertJsonValidationErrors(array $data, $responseKey = 'errors');
```

> 请注意：
> 更通用的 [assertInvalid](#assert-invalid) 方法可用于断言响应有返回为 JSON 的验证错误，或者错误被闪现到会话存储。

#### assertJsonValidationErrorFor

断言响应对于给定键有任何 JSON 验证错误：

```php
$response->assertJsonValidationErrorFor(string $key, $responseKey = 'errors');
```

#### assertMethodNotAllowed

断言响应具有方法不允许 (405) HTTP 状态码：

```php
$response->assertMethodNotAllowed();
```

#### assertMovedPermanently

断言响应具有已永久移动 (301) HTTP 状态码：

```php
$response->assertMovedPermanently();
```

#### assertLocation

断言响应的 `Location` 头部具有给定的 URI 值：

```php
$response->assertLocation($uri);
```

#### assertContent

断言给定字符串与响应内容匹配：

```php
$response->assertContent($value);
```

#### assertNoContent

断言响应有给定的 HTTP 状态码和无内容：

```php
$response->assertNoContent($status = 204);
```

#### assertStreamedContent

断言给定字符串与流式响应内容匹配：

```php
$response->assertStreamedContent($value);
```

#### assertNotFound

断言响应具有未找到 (404) HTTP 状态码：

```php
$response->assertNotFound();
```

#### assertOk

断言响应具有 200 HTTP 状态码：

```php
$response->assertOk();
```

#### assertPaymentRequired

断言响应具有需要支付 (402) HTTP 状态码：

```php
$response->assertPaymentRequired();
```

#### assertPlainCookie

断言响应包含给定的未加密 cookie：

```php
$response->assertPlainCookie($cookieName, $value = null);
```

#### assertRedirect

断言响应是对给定 URI 的重定向：

```php
$response->assertRedirect($uri = null);
```

#### assertRedirectContains

断言响应是重定向到包含给定字符串的 URI：

```php
$response->assertRedirectContains($string);
```

#### assertRedirectToRoute

断言响应是重定向到给定[命名路由](/docs/11/basics/routing#named-routes)：

```php
$response->assertRedirectToRoute($name, $parameters = []);
```

#### assertRedirectToSignedRoute

断言响应是重定向到给定[签名路由](/docs/11/basics/urls#signed-urls)：

```php
$response->assertRedirectToSignedRoute($name = null, $parameters = []);
```

#### assertRequestTimeout

断言响应具有请求超时 (408) HTTP 状态码：

```php
$response->assertRequestTimeout();
```

#### assertSee

断言响应中包含给定字符串。除非传入第二个参数 `false`，否则此断言将自动转义给定字符串：

```php
$response->assertSee($value, $escaped = true);
```

````markdown
#### assertSeeInOrder

断言响应中包含按顺序给定的字符串数组。除非你传递第二个参数为 `false`，否则这个断言会自动转义给定的字符串：

```php
$response->assertSeeInOrder(array $values, $escaped = true);
```
````

#### assertSeeText

断言响应文本中包含给定的字符串。除非你传递第二个参数为 `false`，否则这个断言会自动转义给定的字符串。在进行断言之前，响应内容将通过 `strip_tags` PHP 函数处理：

```php
$response->assertSeeText($value, $escaped = true);
```

#### assertSeeTextInOrder

断言响应文本中按顺序包含给定的字符串数组。除非你传递第二个参数为 `false`，否则这个断言会自动转义给定的字符串。在进行断言之前，响应内容将通过 `strip_tags` PHP 函数处理：

```php
$response->assertSeeTextInOrder(array $values, $escaped = true);
```

#### assertServerError

断言响应具有服务器错误（>= 500 , < 600）的 HTTP 状态码：

```php
$response->assertServerError();
```

#### assertServiceUnavailable

断言响应具有 "服务不可用"（503）的 HTTP 状态码：

```php
$response->assertServiceUnavailable();
```

#### assertSessionHas

断言会话中包含给定的数据片段：

```php
$response->assertSessionHas($key, $value = null);
```

如果需要，可以为 `assertSessionHas` 方法的第二个参数提供一个闭包。如果闭包返回 `true`，则断言会通过：

```php
$response->assertSessionHas($key, function (User $value) {
    return $value->name === 'Taylor Otwell';
});
```

#### assertSessionHasInput

断言会话中在 [闪存输入数组](/docs/11/basics/responses#redirecting-with-flashed-session-data) 中有给定的值：

```php
$response->assertSessionHasInput($key, $value = null);
```

如果需要，可以为 `assertSessionHasInput` 方法的第二个参数提供一个闭包。如果闭包返回 `true`，则断言会通过：

```php
use Illuminate\Support\Facades\Crypt;

$response->assertSessionHasInput($key, function (string $value) {
    return Crypt::decryptString($value) === 'secret';
});
```

#### assertSessionHasAll

断言会话中包含给定的键值对数组：

```php
$response->assertSessionHasAll(array $data);
```

例如，如果你的应用的会话中包含 `name` 和 `status` 键，你可以断言它们都存在并且具有指定的值：

```php
$response->assertSessionHasAll([
    'name' => 'Taylor Otwell',
    'status' => 'active',
]);
```

#### assertSessionHasErrors

断言会话中包含给定 `$keys` 的错误。如果 `$keys` 是一个关联数组，则断言会话中为每个字段（键）包含特定的错误信息（值）。这个方法应该用于测试那些将验证错误信息闪存到会话中而不是作为 JSON 结构返回的路由：

```php
$response->assertSessionHasErrors(
    array $keys = [], $format = null, $errorBag = 'default'
);
```

例如，要断言 `name` 和 `email` 字段都有闪存在会话中的验证错误消息，你可以这样调用 `assertSessionHasErrors` 方法：

```php
$response->assertSessionHasErrors(['name', 'email']);
```

或者，你可以断言给定字段有特定的验证错误信息：

```php
$response->assertSessionHasErrors([
    'name' => 'The given name was invalid.'
]);
```

#### assertSessionHasErrorsIn

断言会话中包含在特定 [错误包](/docs/11/basics/validation#named-error-bags) 中给定 `$keys` 的错误。如果 `$keys` 是一个关联数组，则断言会话中为每个字段（键）包含特定的错误信息（值），在错误包中：

```php
$response->assertSessionHasErrorsIn($errorBag, $keys = [], $format = null);
```

#### assertSessionHasNoErrors

断言会话中没有验证错误：

```php
$response->assertSessionHasNoErrors();
```

#### assertSessionDoesntHaveErrors

断言会话中没有给定键的验证错误：

```php
$response->assertSessionDoesntHaveErrors($keys = [], $format = null, $errorBag = 'default');
```

#### assertSessionMissing

断言会话中不包含给定的键：

```php
$response->assertSessionMissing($key);
```

#### assertStatus

断言响应具有给定的 HTTP 状态码：

```php
$response->assertStatus($code);
```

#### assertSuccessful

断言响应具有成功（>= 200 和 < 300）的 HTTP 状态码：

```php
$response->assertSuccessful();
```

#### assertTooManyRequests

断言响应具有请求过多（429）的 HTTP 状态码：

```php
$response->assertTooManyRequests();
```

#### assertUnauthorized

断言响应具有未授权（401）的 HTTP 状态码：

```php
$response->assertUnauthorized();
```

#### assertUnprocessable

断言响应具有无法处理的实体（422）的 HTTP 状态码：

```php
$response->assertUnprocessable();
```

#### assertUnsupportedMediaType

断言响应具有不支持的媒体类型（415）的 HTTP 状态码：

```php
$response->assertUnsupportedMediaType();
```

#### assertValid

断言响应没有给定键的验证错误。该方法可用于针对返回 JSON 结构的验证错误的响应，或验证错误已闪存到会话：

```php
// 断言没有验证错误...
$response->assertValid();

// 断言给定键没有验证错误...
$response->assertValid(['name', 'email']);
```

#### assertInvalid

断言响应具有给定键的验证错误。该方法可用于针对返回 JSON 结构的验证错误或已闪存到会话的验证错误的响应：

```php
$response->assertInvalid(['name', 'email']);
```

你也可以断言给定键有特定的验证错误信息。在这样做时，你可以提供完整的信息或信息的一小部分：

```php
$response->assertInvalid([
    'name' => 'The name field is required.',
    'email' => 'valid email address',
]);
```

#### assertViewHas

断言响应视图包含给定的数据：

```php
$response->assertViewHas($key, $value = null);
```

如果将闭包作为 `assertViewHas` 方法的第二个参数提供，将允许你检查并对特定的视图数据进行断言：

```php
$response->assertViewHas('user', function (User $user) {
    return $user->name === 'Taylor';
});
```

此外，视图数据可作为数组变量直接访问响应，让你可以方便的检查它：

```php tab=Pest
expect($response['name'])->toBe('Taylor');
```

```php tab=PHPUnit
$this->assertEquals('Taylor', $response['name']);
```

#### assertViewHasAll

断言响应视图有给定的数据列表：

```php
$response->assertViewHasAll(array $data);
```

此方法可用于断言视图至少包含给定键的数据：

```php
$response->assertViewHasAll([
    'name',
    'email',
]);
```

或者，你可以断言视图数据存在，并具有特定的值：

```php
$response->assertViewHasAll([
    'name' => 'Taylor Otwell',
    'email' => 'taylor@example.com,',
]);
```

#### assertViewIs

断言给定的视图由路由返回：

```php
$response->assertViewIs($value);
```

#### assertViewMissing

断言响应视图不包含给定的数据键：

```php
$response->assertViewMissing($key);
```

````markdown
### 身份验证断言

Laravel 还提供了各种与身份验证相关的断言，您可以在应用程序的功能测试中使用这些断言。请注意，这些方法是在测试类本身中调用的，而不是由 `get` 和 `post` 等方法返回的 `Illuminate\Testing\TestResponse` 实例。

#### assertAuthenticated

断言用户已通过身份验证：

```php
$this->assertAuthenticated($guard = null);
```
````

#### assertGuest

断言用户未通过身份验证：

```php
$this->assertGuest($guard = null);
```

#### assertAuthenticatedAs

断言特定用户已通过身份验证：

```php
$this->assertAuthenticatedAs($user, $guard = null);
```

## 验证断言

Laravel 提供了两个主要的与验证相关的断言，您可以使用这些断言来确保您的请求中提供的数据是有效或无效的。

#### assertValid

断言响应对于给定键没有验证错误。当验证错误以 JSON 结构返回或验证错误已被闪存到会话时，可使用此方法进行断言：

```php
// 断言不存在验证错误...
$response->assertValid();

// 断言给定键没有验证错误...
$response->assertValid(['name', 'email']);
```

#### assertInvalid

断言响应存在给定键的验证错误。当验证错误以 JSON 结构返回或验证错误已被闪存到会话时，可使用此方法进行断言：

```php
$response->assertInvalid(['name', 'email']);
```

您还可以断言给定键具有特定的验证错误消息。这样做时，您可以提供完整的消息或仅消息的一小部分：

```php
$response->assertInvalid([
    'name' => 'The name field is required.',
    'email' => 'valid email address',
]);
```
