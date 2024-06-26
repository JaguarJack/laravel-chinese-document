---
title: Laravel 验证 表单验证
---

# 表单验证

[[toc]]

## 介绍

Laravel 提供了几种不同的方法来验证你的应用程序的传入数据。最常见的做法是使用所有传入 HTTP 请求上可用的 `validate` 方法。然而，我们也会讨论其他的验证方法。

Laravel 包含了广泛的便利验证规则，你可以应用到数据上，甚至提供了验证值是否在给定数据库表中唯一的能力。我们将详细介绍每一个验证规则，以便你熟悉 Laravel 的所有验证功能。

## 验证快速入门

为了了解 Laravel 强大的验证功能，让我们看一个完整的例子，了解如何验证一个表单并向用户显示错误消息。通过阅读这个高层次的概述，你将能够获得一个很好的一般性理解，了解如何使用 Laravel 验证传入的请求数据：

### 定义路由

首先，假设我们在 `routes/web.php` 文件中定义了以下路由：

```php
use App\Http\Controllers\PostController;

Route::get('/post/create', [PostController::class, 'create']);
Route::post('/post', [PostController::class, 'store']);
```

`GET` 路由将显示一个表单，供用户创建新的博客帖子，而 `POST` 路由将把新的博客帖子存储到数据库中。

### 创建控制器

接下来，让我们看一个简单的控制器，它处理传入这些路由的请求。我们暂时把 `store` 方法留空：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PostController extends Controller
{
    /**
     * 显示创建新博客帖子的表单。
     */
    public function create(): View
    {
        return view('post.create');
    }

    /**
     * 存储新的博客帖子。
     */
    public function store(Request $request): RedirectResponse
    {
        // 验证并存储博客帖子...

        $post = /** ... */

        return to_route('post.show', ['post' => $post->id]);
    }
}
```

### 编写验证逻辑

现在我们准备好用验证新博客帖子的逻辑来填充我们的 `store` 方法。为此，我们将使用 `Illuminate\Http\Request` 对象提供的 `validate` 方法。如果验证规则通过，你的代码将正常执行；然而，如果验证失败，将抛出一个 `Illuminate\Validation\ValidationException` 异常，并且将自动向用户发送正确的错误响应。

如果在传统的 HTTP 请求中验证失败，将生成一个重定向回上一个 URL 的响应。如果传入请求是 XHR 请求，将返回包含验证错误消息的 [JSON 响应](#validation-error-response-format)。

为了更好地理解 `validate` 方法，让我们回到 `store` 方法中：

```php
/**
 * 存储新的博客帖子。
 */
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ]);

    // 博客帖子是有效的...

    return redirect('/posts');
}
```

如你所见，验证规则被传入了 `validate` 方法。不用担心 - 所有可用的验证规则都有[文档](#available-validation-rules)。再次说明，如果验证失败，将自动生成正确的响应。如果验证通过，我们的控制器将继续正常执行。

此外，还可以将验证规则指定为规则数组，而不是单一的 `|` 分隔的字符串：

```php
$validatedData = $request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

另外，你可以使用 `validateWithBag` 方法验证一个请求，并将任何错误消息存储在一个[命名错误包](#named-error-bags)中：

```php
$validatedData = $request->validateWithBag('post', [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

#### 在第一个验证失败时停止

有时你可能希望在属性的第一个验证失败后停止运行验证规则。为此，将 `bail` 规则分配给该属性：

```php
$request->validate([
    'title' => 'bail|required|unique:posts|max:255',
    'body' => 'required',
]);
```

在这个例子中，如果 `title` 属性上的 `unique` 规则失败，将不会检查 `max` 规则。规则将按照分配它们的顺序进行验证。

#### 关于嵌套属性的说明

如果传入的 HTTP 请求包含“嵌套”的字段数据，你可以使用“点”语法在验证规则中指定这些字段：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'author.name' => 'required',
    'author.description' => 'required',
]);
```

另一方面，如果你的字段名包含一个实际的句号，你可以通过反斜杠明确阻止这个被解释为“点”语法：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'v1\.0' => 'required',
]);
```

### 显示验证错误

那么，如果传入的请求字段没有通过给定的验证规则会怎样呢？如前所述，Laravel 将自动将用户重定向回他们之前的位置。此外，验证错误和[请求输入](/docs/11/basics/requests#retrieving-old-input)将自动被[闪存到会话](/docs/11/basics/session#flash-data)中。

`Illuminate\View\Middleware\ShareErrorsFromSession` 中间件（由 `web` 中间件组提供）将一个 `$errors` 变量共享给你的应用程序的所有视图。当这个中间件被应用时，一个 `$errors` 变量将始终在你的视图中可用，允许你便捷地假设 `$errors` 变量总是被定义并且可以安全使用。`$errors` 变量将是 `Illuminate\Support\MessageBag` 的一个实例。有关使用这个对象的更多信息，[请查看它的文档](#working-with-error-messages)。

因此，在我们的例子中，当验证失败时，用户将被重定向到我们控制器的 `create` 方法，允许我们在视图中显示错误信息：

```blade
<!-- /resources/views/post/create.blade.php -->

<h1>创建博客帖子</h1>

@if ($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<!-- 创建博客帖子表单 -->
```

#### 自定义错误消息

Laravel 内置的每个验证规则都有一个错误消息，位于你的应用程序的 `lang/en/validation.php` 文件中。如果你的应用程序没有 `lang` 目录，你可以指示 Laravel 使用 `lang:publish` Artisan 命令创建它。

在 `lang/en/validation.php` 文件中，你会找到每个验证规则的翻译条目。根据你的应用程序的需要，你可以自由更改或修改这些消息。

此外，你可以复制这个文件到另一个语言目录来翻译你的应用程序的语言的消息。要了解更多关于 Laravel 本地化的信息，请查看完整的[本地化文档](/docs/11/digging-deeper/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用程序框架不包括 `lang` 目录。如果你想自定义 Laravel 的语言文件，你可以通过 `lang:publish` Artisan 命令发布它们。

#### XHR 请求和验证

在这个例子中，我们使用了传统表单向应用发送数据。然而，许多应用程序从由 JavaScript 驱动的前端接收 XHR 请求。在 XHR 请求中使用 `validate` 方法时，Laravel 不会生成重定向响应。相反，Laravel 会生成一个包含所有验证错误的 [JSON 响应](#validation-error-response-format)。这个 JSON 响应会以 422 HTTP 状态码发送。

#### `@error` 指令

你可以使用 `@error` [Blade](/docs/11/basics/blade) 指令快速确定某个属性是否存在验证错误消息。在 `@error` 指令内部，你可以回显 `$message` 变量来显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">文章标题</label>

<input id="title"
    type="text"
    name="title"
    class="@error('title') is-invalid @enderror">

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

如果你使用 [命名错误包](#named-error-bags)，你可以将错误包的名称作为第二个参数传递给 `@error` 指令：

```blade
<input ... class="@error('title', 'post') is-invalid @enderror">
```

### 重新填充表单

当 Laravel 因验证错误而生成重定向响应时，框架将自动 [将所有请求的输入数据闪存到会话中](/docs/11/basics/session#flash-data)。这样做是为了方便你在下一个请求期间访问输入数据，并重新填充用户尝试提交的表单。

要从上一个请求中检索闪存的输入，调用 `Illuminate\Http\Request` 实例上的 `old` 方法。`old` 方法将从 [会话](/docs/11/basics/session) 中提取之前闪存的输入数据：

```php
$title = $request->old('title');
```

Laravel 还提供了一个全局的 `old` 帮助函数。如果你在 [Blade 模板](/docs/11/basics/blade) 中显示旧输入，使用 `old` 帮助函数重新填充表单会更方便。如果给定字段没有旧输入，将返回 `null`：

```blade
<input type="text" name="title" value="{{ old('title') }}">
```

### 关于可选字段的说明

Laravel 默认在应用程序的全局中间件堆栈中包括 `TrimStrings` 和 `ConvertEmptyStringsToNull` 中间件。因此，你通常需要将你的“可选”请求字段标记为 `nullable`，如果你不希望验证器将 `null` 值视为无效。例如：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
    'publish_at' => 'nullable|date',
]);
```

在这个例子中，我们指定 `publish_at` 字段可以是 `null` 或有效的日期表示。如果 `nullable` 修饰符没有添加到规则定义中，验证器将认为 `null` 是无效的日期。

### 验证错误响应格式

当你的应用程序抛出 `Illuminate\Validation\ValidationException` 异常，并且传入的 HTTP 请求期望一个 JSON 响应时，Laravel 将自动为你格式化错误消息，并返回 `422 Unprocessable Entity` HTTP 响应。

下面，你可以查看验证错误的 JSON 响应格式示例。注意嵌套错误键会被展平成“点”记法格式：

```json
{
  "message": "The team name must be a string. (and 4 more errors)",
  "errors": {
    "team_name": ["The team name must be a string.", "The team name must be at least 1 characters."],
    "authorization.role": ["The selected authorization.role is invalid."],
    "users.0.email": ["The users.0.email field is required."],
    "users.2.email": ["The users.2.email must be a valid email address."]
  }
}
```

## 表单请求验证

### 创建表单请求

对于更复杂的验证场景，你可能希望创建一个“表单请求”。表单请求是封装了它们自己的验证和授权逻辑的自定义请求类。要创建表单请求类，你可以使用 `make:request` Artisan 命令行接口命令：

```shell
php artisan make:request StorePostRequest
```

生成的表单请求类将被放置在 `app/Http/Requests` 目录下。如果这个目录不存在，运行 `make:request` 命令时将创建它。Laravel 生成的每个表单请求都有两个方法：`authorize` 和 `rules`。

正如你可能已经猜到的，`authorize` 方法负责决定当前认证的用户是否可以执行表示该请求的操作，而 `rules` 方法返回应用于请求数据的验证规则：

```php
/**
 * 获取适用于请求的验证规则。
 *
 * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
 */
public function rules(): array
{
    return [
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ];
}
```

> [!NOTE]
> 你可以在 `rules` 方法的签名中类型提示任何你需要的依赖项。它们将通过 Laravel [服务容器](/docs/11/architecture-concepts/container) 自动被解析。

那么，验证规则是如何被评估的呢？你只需要在你的控制器方法上类型提示这个请求。在控制器方法被调用之前，传入表单请求已经通过验证，这意味着你不需要用任何验证逻辑填充你的控制器：

```php
/**
 * 存储新的博客帖子。
 */
public function store(StorePostRequest $request): RedirectResponse
{
    // 传入的请求是有效的...

    // 检索经过验证的输入数据...
    $validated = $request->validated();

    // 检索一部分经过验证的输入数据...
    $validated = $request->safe()->only(['name', 'email']);
    $validated = $request->safe()->except(['name', 'email']);

    // 存储博客帖子...

    return redirect('/posts');
}
```

如果验证失败，将生成一个重定向响应，将用户发送回他们之前的位置。错误也将闪存到会话中，以便展示。如果请求是 XHR 请求，将返回一个包括 [验证错误的 JSON 表示形式](#validation-error-response-format) 的 422 状态码的 HTTP 响应。

> [!NOTE]
> 需要为你的 Inertia 驱动的 Laravel 前端添加实时表单请求验证吗？查看 [Laravel Precognition](/docs/11/packages/precognition)。

#### 执行额外的验证

有时在完成初始验证后，你需要执行额外的验证。您可以使用表单请求的 `after` 方法来完成这项工作。

`after` 方法应返回一组可调用的方法或闭包，这些方法或闭包将在验证完成后调用。给定的可调用项将接收 `Illuminate\Validation\Validator` 实例，允许你根据需要提出额外的错误消息：

```php
use Illuminate\Validation\Validator;

/**
 * 获取请求的 "after" 验证可调用项。
 */
public function after(): array
{
    return [
        function (Validator $validator) {
            if ($this->somethingElseIsInvalid()) {
                $validator->errors()->add(
                    'field',
                    'Something is wrong with this field!'
                );
            }
        }
    ];
}
```

如前所述，`after` 方法返回的数组也可以包含可调用的类。这些类的 `__invoke` 方法将接收 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;
use Illuminate\Validation\Validator;

/**
 * 获取请求的 "after" 验证可调用项。
 */
public function after(): array
{
    return [
        new ValidateUserStatus,
        new ValidateShippingTime,
        function (Validator $validator) {
            //
        }
    ];
}
```

#### 第一个验证规则失败后停止

通过在请求类中添加一个 `stopOnFirstFailure` 属性，你可以告知验证器一旦发生单个验证失败就应停止验证所有属性：

```php
/**
 * 指示验证器是否应在第一条规则失败后停止。
 *
 * @var bool
 */
protected $stopOnFirstFailure = true;
```

#### 自定义重定向位置

如前所述，当表单请求验证失败时，将生成一个重定向响应将用户重定向回他们之前的位置。然而，你可以自由定制这个行为。要做到这一点，在你的表单请求中定义一个 `$redirect` 属性：

```php
/**
 * 验证失败时，用户应被重定向到的 URI。
 *
 * @var string
 */
protected $redirect = '/dashboard';
```

或者，如果你想将用户重定向到一个命名路由，你可以定义一个 `$redirectRoute` 属性：

```php
/**
 * 验证失败时，用户应被重定向到的路由。
 *
 * @var string
 */
protected $redirectRoute = 'dashboard';
```

### 授权表单请求

表单请求类还包含一个 `authorize` 方法。在这个方法中，你可以确定当前认证的用户是否真的有权限更新给定的资源。例如，你可以确定用户是否真的拥有他们试图更新的博客评论。你很可能会在这个方法内与你的 [授权门和策略](/docs/11/security/authorization) 交互：

```php
use App\Models\Comment;

/**
 * 确定用户是否被授权进行此请求。
 */
public function authorize(): bool
{
    $comment = Comment::find($this->route('comment'));

    return $comment && $this->user()->can('update', $comment);
}
```

由于所有表单请求都扩展了基础 Laravel 请求类，我们可以使用 `user` 方法来访问当前认证的用户。另外，注意以上示例中对 `route` 方法的调用。这个方法允许你访问定义在被调用路由上的 URI 参数，例如下面示例中的 `{comment}` 参数：

```php
Route::post('/comment/{comment}');
```

因此，如果你的应用程序利用了 [路由模型绑定](/docs/11/basics/routing#route-model-binding)，你的代码可以通过访问请求的解析模型属性来使其更加简洁：

```php
return $this->user()->can('update', $this->comment);
```

如果 `authorize` 方法返回 `false`，一个带有 403 状态码的 HTTP 响应将自动被返回，你的控制器方法将不会执行。

如果你计划在应用程序的其他部分处理请求的授权逻辑，你可以完全移除 `authorize` 方法，或简单地返回 `true`：

```php
/**
 * 确定用户是否被授权进行此请求。
 */
public function authorize(): bool
{
    return true;
}
```

> [!NOTE]
> 你可以在 `authorize` 方法的签名中类型提示任何你需要的依赖。它们将通过 Laravel [服务容器](/docs/11/architecture-concepts/container) 自动被解析。

### 自定义错误消息

你可以通过重写 `messages` 方法来自定义表单请求中使用的错误消息。这个方法应该返回一个属性 / 规则对及其相应的错误消息数组：

```php
/**
 * 获取定义的验证规则的错误消息。
 *
 * @return array<string, string>
 */
public function messages(): array
{
    return [
        'title.required' => '标题必填',
        'body.required' => '消息内容必填',
    ];
}
```

#### 自定义验证属性名称

Laravel 的内置验证规则错误消息中的 `:attribute` 占位符。如果你希望将验证消息的 `:attribute` 占位符替换为自定义属性名称，你可以通过重写 `attributes` 方法来指定自定义名称。这个方法应该返回一个属性 / 名称对数组：

```php
/**
 * 获取验证错误的自定义属性。
 *
 * @return array<string, string>
 */
public function attributes(): array
{
    return [
        'email' => '邮箱地址',
    ];
}
```

### 为验证准备输入

如果你需要在应用验证规则之前准备或清理请求中的任何数据，你可以使用 `prepareForValidation` 方法：

```php
use Illuminate\Support\Str;

/**
 * 为验证准备数据。
 */
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->slug),
    ]);
}
```

同样，如果你需要在验证完成后规范化任何请求数据，你可以使用 `passedValidation` 方法：

```php
/**
 * 处理验证通过的尝试。
 */
protected function passedValidation(): void
{
    $this->replace(['name' => 'Taylor']);
}
```

## 手动创建验证器

如果你不想在请求上使用 `validate` 方法，你可以使用 `Validator` [facade](/docs/11/architecture-concepts/facades) 手动创建一个验证器实例。facade 上的 `make` 方法生成一个新的验证器实例：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
    /**
     * 存储新的博客帖子。
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|unique:posts|max:255',
            'body' => 'required',
        ]);

        if ($validator->fails()) {
            return redirect('post/create')
                        ->withErrors($validator)
                        ->withInput();
        }

        // 检索经过验证的输入数据...
        $validated = $validator->validated();

        // 检索一部分经过验证的输入数据...
        $validated = $validator->safe()->only(['name', 'email']);
        $validated = $validator->safe()->except(['name', 'email']);

        // 存储博客帖子...

        return redirect('/posts');
    }
}
```

传递给 `make` 方法的第一个参数是待验证的数据。第二个参数是应用于数据的验证规则的数组。

在确定请求验证失败后，你可以使用 `withErrors` 方法将错误消息闪存到会话。使用这个方法时，`$errors` 变量将自动在重定向后与你的视图共享，允许你轻松地将它们展示回用户。`withErrors` 方法接受验证器、`MessageBag` 或 PHP `数组`。

#### 第一次验证失败停止

`stopOnFirstFailure` 方法会通知验证器一旦发生单个验证失败就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

### 自动重定向

如果你想手动创建验证器实例，但仍想利用 HTTP 请求的 `validate` 方法提供的自动重定向，你可以在现有验证器实例上调用 `validate` 方法。如果验证失败，用户将自动被重定向或者，在 XHR 请求的情况下，[将返回 JSON 响应](#validation-error-response-format)：

```php
Validator::make($request->all(), [
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
])->validate();
```

如果验证失败，你可以使用 `validateWithBag` 方法将错误消息存储在[命名错误包](#named-error-bags)中：

```php
Validator::make($request->all(), [
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
])->validateWithBag('post');
```

### 命名错误包

如果你在一个页面上有多个表单，你可能希望命名包含验证错误的 `MessageBag`，这样你就可以检索特定表单的错误消息。为了实现这一点，向 `withErrors` 传递一个名称作为第二个参数：

```php
return redirect('register')->withErrors($validator, 'login');
```

你可以从 `$errors` 变量访问命名的 `MessageBag` 实例：

```blade
{{ $errors->login->first('email') }}
```

### 自定义错误消息

如果需要，你可以提供自定义错误消息，以代替 Laravel 提供的默认错误消息。有几种方法来指定自定义消息。首先，你可以将自定义消息作为第三个参数传递给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages = [
    'required' => 'The :attribute field is required.',
]);
```

在这个例子中，`:attribute` 占位符将被正在验证的字段的实际名称替换。你也可以在验证消息中使用其他占位符。例如：

```php
$messages = [
    'same' => 'The :attribute and :other must match.',
    'size' => 'The :attribute must be exactly :size.',
    'between' => 'The :attribute value :input is not between :min - :max.',
    'in' => 'The :attribute must be one of the following types: :values',
];
```

#### 为指定属性指定自定义消息

有时你可能想只为特定属性指定自定义错误消息。你可以使用“点”表示法来实现。首先指定属性的名称，然后是规则：

```php
$messages = [
    'email.required' => 'We need to know your email address!',
];
```

#### 规定自定义属性值

许多 Laravel 内置的错误消息包含一个 `:attribute` 占位符，该占位符会被替换为正在验证的字段或属性的名称。如果你想为特定字段定制替换占位符的值，你可以将自定义属性的数组作为第四个参数传递给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages, [
    'email' => 'email address',
]);
```

### 执行附加验证

有时你需要在初步验证完成后执行附加验证。你可以使用验证器的 `after` 方法来完成这项任务。`after` 方法接受一个闭包或一组可调用的方法，这些方法在验证完成后被调用。给定的可调用项将接收 `Illuminate\Validation\Validator` 实例，允许你根据需要引起额外的错误消息：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make(/* ... */);

$validator->after(function ($validator) {
    if ($this->somethingElseIsInvalid()) {
        $validator->errors()->add(
            'field', 'Something is wrong with this field!'
        );
    }
});

if ($validator->fails()) {
    // ...
}
```

如前所述，`after` 方法也接受一系列可调用的项，这在你的“验证后”逻辑被封装在可调用类中时特别方便，这些类将通过它们的 `__invoke` 方法接收一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;

$validator->after([
    new ValidateUserStatus,
    new ValidateShippingTime,
    function ($validator) {
        // ...
    },
]);
```

## 处理经过验证的输入

在使用表单请求或手动创建的验证器实例验证传入请求数据后，你可能希望检索实际经过验证的传入请求数据。这可以通过几种方法完成。首先，你可以在表单请求或验证器实例上调用 `validated` 方法。这个方法返回经过验证的数据的数组：

```php
$validated = $request->validated();

$validated = $validator->validated();
```

或者，你可以在表单请求或验证器实例上调用 `safe` 方法。这个方法返回 `Illuminate\Support\ValidatedInput` 实例。这个对象提供 `only`、`except` 和 `all` 方法来检索经过验证数据的子集或全部经过验证的数据数组：

```php
$validated = $request->safe()->only(['name', 'email']);

$validated = $request->safe()->except(['name', 'email']);

$validated = $request->safe()->all();
```

此外，`Illuminate\Support\ValidatedInput` 实例可以进行迭代和像数组那样访问：

```php
// 经过验证的数据可以被迭代...
foreach ($request->safe() as $key => $value) {
    // ...
}

// 经过验证的数据可以像数组那样访问...
$validated = $request->safe();

$email = $validated['email'];
```

如果你想向验证后的数据中添加额外字段，你可以调用 `merge` 方法：

```php
$validated = $request->safe()->merge(['name' => 'Taylor Otwell']);
```

如果你想将验证后的数据作为[集合](/docs/11/digging-deeper/collections)实例获取，你可以调用 `collect` 方法：

```php
$collection = $request->safe()->collect();
```

## 处理错误消息

在 `Validator` 实例上调用 `errors` 方法后，你将收到一个 `Illuminate\Support\MessageBag` 实例，它有各种方便的方法来处理错误消息。自动可用于所有视图的 `$errors` 变量也是 `MessageBag` 类的实例。

#### 为字段检索第一个错误消息

要检索给定字段的第一个错误消息，使用 `first` 方法：

```php
$errors = $validator->errors();

echo $errors->first('email');
```

#### 为字段检索所有错误消息

如果需要检索给定字段的所有消息数组，请使用 `get` 方法：

```php
foreach ($errors->get('email') as $message) {
    // ...
}
```

如果你正在验证数组表单字段，你可以使用 `*` 字符检索每个数组元素的所有消息：

```php
foreach ($errors->get('attachments.*') as $message) {
    // ...
}
```

#### 为所有字段检索所有错误消息

要检索所有字段的所有消息数组，请使用 `all` 方法：

```php
foreach ($errors->all() as $message) {
    // ...
}
```

#### 确定字段是否存在消息

`has` 方法可以用来确定给定字段是否存在任何错误消息：

```php
if ($errors->has('email')) {
    // ...
}
```

### 在语言文件中指定自定义消息

Laravel 内置的验证规则每个都有一个错误消息，位于应用程序的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，你可以使用 `lang:publish` Artisan 命令让 Laravel 创建它。

在 `lang/en/validation.php` 文件中，你会找到每个验证规则的翻译条目。根据应用程序的需求，你可以自由更改或修改这些消息。

此外，你可以将此文件复制到另一个语言目录以翻译应用程序的语言消息。要了解更多关于 Laravel 本地化信息，请查看完整的[本地化文档](/docs/11/digging-deeper/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用程序框架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，你可以通过 `lang:publish` Artisan 命令发布它们。

#### 为指定属性的自定义消息

你可以在应用程序的验证语言文件中为指定的属性和规则组合自定义错误消息。为此，在应用程序的 `lang/xx/validation.php` 语言文件的 `custom` 数组中增加你的自定义消息：

```php
'custom' => [
    'email' => [
        'required' => 'We need to know your email address!',
        'max' => 'Your email address is too long!'
    ],
],
```

### 在语言文件中指定属性

许多 Laravel 内置的错误消息包含一个 `:attribute` 占位符，该占位符会被正在验证的字段或属性的名称替换。如果你想将验证消息中的 `:attribute` 部分替换为自定义值，你可以在 `lang/xx/validation.php` 语言文件的 `attributes` 数组中指定自定义属性名称：

```php
'attributes' => [
    'email' => 'email address',
],
```

> [!WARNING]
> 默认情况下，Laravel 应用程序框架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，你可以通过 `lang:publish` Artisan 命令发布它们。

### 在语言文件中指定值

一些 Laravel 内置的验证规则错误消息包含一个 `:value` 占位符，该占位符会被请求属性的当前值替换。然而，你可能偶尔需要验证消息中的 `:value` 部分被替换为值的自定义表示。例如，考虑以下规则，它指定如果 `payment_type` 的值为 `cc`，则需要提供信用卡号：

```php
Validator::make($request->all(), [
    'credit_card_number' => 'required_if:payment_type,cc'
]);
```

如果此验证规则失败，它将产生以下错误消息：

```php
The credit card number field is required when payment type is cc.
```

Instead of displaying `cc` as the payment type value, you may specify a more user-friendly value representation in your `lang/xx/validation.php` language file by defining a `values` array:

```php
'values' => [
    'payment_type' => [
        'cc' => 'credit card'
    ],
],
```

> [!WARNING]
> By default, the Laravel application skeleton does not include the `lang` directory. If you would like to customize Laravel's language files, you may publish them via the `lang:publish` Artisan command.

在定义了这个值之后，验证规则将产生以下错误消息：

```php
The credit card number field is required when payment type is credit card.
```

下面是所有可用的验证规则及其功能的列表：

## 可用的验证规则

以下是所有可用的验证规则及其功能的列表：

- [Accepted](#accepted)
- [Accepted If](#accepted-if)
- [Active URL](#active-url)
- [After (Date)](#after-date)
- [After Or Equal (Date)](#after-or-equal-date)
- [Alpha](#alpha)
- [Alpha Dash](#alpha-dash)
- [Alpha Numeric](#alpha-numeric)
- [Array](#array)
- [Ascii](#ascii)
- [Bail](#bail)
- [Before (Date)](#before-date)
- [Before Or Equal (Date)](#before-or-equal-date)
- [Between](#between)
- [Boolean](#boolean)
- [Confirmed](#confirmed)
- [Current Password](#current-password)
- [Date](#date)
- [Date Equals](#date-equals)
- [Date Format](#date-format)
- [Decimal](#decimal)
- [Declined](#declined)
- [Declined If](#declined-if)
- [Different](#different)
- [Digits](#digits)
- [Digits Between](#digits-between)
- [Dimensions (Image Files)](#dimensions-image-files)
- [Distinct](#distinct)
- [Doesnt Start With](#doesnt-start-with)
- [Doesnt End With](#doesnt-end-with)
- [Email](#email)
- [Ends With](#ends-with)
- [Enum](#enum)
- [Exclude](#exclude)
- [Exclude If](#exclude-if)
- [Exclude Unless](#exclude-unless)
- [Exclude With](#exclude-with)
- [Exclude Without](#exclude-without)
- [Exists (Database)](#exists-database)
- [Extensions](#extensions)
- [File](#file)
- [Filled](#filled)
- [Greater Than](#greater-than)
- [Greater Than Or Equal](#greater-than-or-equal)
- [Hex Color](#hex-color)
- [Image (File)](#image-file)
- [In](#in)
- [In Array](#in-array)
- [Integer](#integer)
- [IP Address](#ip-address)
- [JSON](#json)
- [Less Than](#less-than)
- [Less Than Or Equal](#less-than-or-equal)
- [List](#list)
- [Lowercase](#lowercase)
- [MAC Address](#mac-address)
- [Max](#max)
- [Max Digits](#max-digits)
- [MIME Types](#mime-types)
- [MIME Type By File Extension](#mime-type-by-file-extension)
- [Min](#min)
- [Min Digits](#min-digits)
- [Missing](#missing)
- [Missing If](#missing-if)
- [Missing Unless](#missing-unless)
- [Missing With](#missing-with)
- [Missing With All](#missing-with-all)
- [Multiple Of](#multiple-of)
- [Not In](#not-in)
- [Not Regex](#not-regex)
- [Nullable](#nullable)
- [Numeric](#numeric)
- [Present](#present)
- [Present If](#present-if)
- [Present Unless](#present-unless)
- [Present With](#present-with)
- [Present With All](#present-with-all)
- [Prohibited](#prohibited)
- [Prohibited If](#prohibited-if)
- [Prohibited Unless](#prohibited-unless)
- [Prohibits](#prohibits)
- [Regular Expression](#regular-expression)
- [Required](#required)
- [Required If](#required-if)
- [Required If Accepted](#required-if-accepted)
- [Required Unless](#required-unless)
- [Required With](#required-with)
- [Required With All](#required-with-all)
- [Required Without](#required-without)
- [Required Without All](#required-without-all)
- [Required Array Keys](#required-array-keys)
- [Same](#same)
- [Size](#size)
- [Sometimes](#sometimes)
- [Starts With](#starts-with)
- [String](#string)
- [Timezone](#timezone)
- [Unique (Database)](#unique-database)
- [Uppercase](#uppercase)
- [URL](#url)
- [ULID](#ulid)
- [UUID](#uuid)

### accepted

验证的字段必须是 `"yes"`, `"on"`, `1`, `"1"`, `true`, 或者 `"true"`。这对于验证"服务条款"接受或类似字段很有用。

### accepted_if:anotherfield,value,...

如果另一个字段等于某个特定值，那么验证的字段必须是 `"yes"`, `"on"`, `1`, `"1"`, `true`, 或者 `"true"`。这对于验证"服务条款"接受或类似字段很有用。

### active_url

验证的字段必须具有根据 `dns_get_record` PHP 函数有效的 A 或 AAAA 记录。提供的 URL 的主机名将使用 `parse_url` PHP 函数提取，然后传递给 `dns_get_record`。

### after:date

验证的字段必须在给定日期之后的值。日期将被传递给 `strtotime` PHP 函数以转换为有效的 `DateTime` 实例：

```php
'start_date' => 'required|date|after:tomorrow'
```

除了传递一个由 `strtotime` 评估的日期字符串，您还可以指定另一个字段与日期进行比较：

```php
'finish_date' => 'required|date|after:start_date'
```

### after_or_equal:date

验证的字段必须是在给定日期之后或等于该日期的值。更多信息请参见 [after](#after-date) 规则。

### alpha

验证的字段必须全部为 Unicode 字母字符，包含在 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=) 和 [`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 中。

要将此验证规则限制在 ASCII 范围内的字符 (`a-z` 和 `A-Z`)，您可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha:ascii',
```

### alpha_dash

验证的字段必须全部为 Unicode 字母数字字符，包含在 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=), [`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=), [`\p{N}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中，以及 ASCII 中的破折号 (`-`) 和下划线 (`_`)。

要将此验证规则限制在 ASCII 范围内的字符 (`a-z` 和 `A-Z`)，您可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_dash:ascii',
```

### alpha_num

验证的字段必须全部为 Unicode 字母数字字符，包含在 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=), [`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 和 [`\p{N}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中。

要将此验证规则限制在 ASCII 范围内的字符 (`a-z` 和 `A-Z`)，您可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_num:ascii',
```

### array

验证的字段必须是 PHP `array`。

当提供额外的值给 `array` 规则时，输入数组中的每个键都必须出现在规则提供的值列表中。在下面的例子中，输入数组的 `admin` 键是无效的，因为它不包含在 `array` 规则提供的值列表中：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'user' => [
        'name' => 'Taylor Otwell',
        'username' => 'taylorotwell',
        'admin' => true,
    ],
];

Validator::make($input, [
    'user' => 'array:name,username',
]);
```

一般来说，你应该总是明确指定允许在你的数组中出现的键。

### ascii

验证的字段必须全部是 7-bit ASCII 字符。

### bail

在第一个验证失败后，停止该字段的后续验证规则。

虽然 `bail` 规则仅在遇到验证失败时停止验证特定字段，但 `stopOnFirstFailure` 方法将通知验证器，一旦发生单个验证失败，它应该停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

### before:date

验证的字段必须是一个在给定日期之前的值。日期将被传递至 PHP `strtotime` 函数以转换成有效的 `DateTime` 实例。此外，像 [`after`](#after-date) 规则一样，也可以提供一个正在验证的其他字段的名称作为 `date` 的值。

### before_or_equal:date

验证的字段必须是一个在给定日期之前或等于该日期的值。日期将被传递至 PHP `strtotime` 函数以转换成有效的 `DateTime` 实例。此外，像 [`after`](#after-date) 规则一样，也可以提供一个正在验证的其他字段的名称作为 `date` 的值。

### between:min,max

验证的字段必须在给定的最小值 _min_ 和最大值 _max_ 之间（含）。字符串、数字、数组和文件的评估方式与 [`size`](#size) 规则相同。

### boolean

验证的字段必须能够被转换为布尔值。接受的输入包括 `true`, `false`, `1`, `0`, `"1"`, 和 `"0"`。

### confirmed

验证的字段必须有一个匹配的 `{field}_confirmation` 字段。例如，如果正在验证的字段是 `password`，输入中必须存在一个匹配的 `password_confirmation` 字段。

#### contains:_foo_,_bar_,...

这个验证字段必须是一个数组，其中包含了所有给定的参数数值。

### current_password

验证的字段必须与认证用户的密码匹配。你可以使用规则的第一个参数指定一个 [认证守卫](/docs/11/security/authentication)：

```php
'password' => 'current_password:api'
```

### date

验证的字段必须是根据 `strtotime` PHP 函数的有效、非相对日期。

### date_equals:date

验证的字段必须等于给定的日期。日期将被传递至 PHP `strtotime` 函数以转换成有效的 `DateTime` 实例。

### date_format:format,...

验证的字段必须与给定 _格式_ 中的一个匹配。在验证字段时，您应该使用 `date` 或 `date_format` 其中之一，而不是同时使用。此验证规则支持 PHP 的 [DateTime](https://www.php.net/manual/en/class.datetime.php) 类支持的所有格式。

### decimal:min,max

验证的字段必须是数字并且必须包含指定数量的小数位：

```php
// 必须有两位小数 (9.99)...
'price' => 'decimal:2'

// 必须在2到4位小数之间...
'price' => 'decimal:2,4'
```

### declined

验证的字段必须是 `"no"`, `"off"`, `0`, `"0"`, `false` 或者 `"false"`。

### declined_if:anotherfield,value,...

如果另一个字段等于某个特定值，那么验证的字段必须是 `"no"`, `"off"`, `0`, `"0"`, `false` 或者 `"false"`。

### different:field

验证的字段必须与 _field_ 有不同的值。

### digits:value

整数验证必须精确的长度是 _value_。

### digits_between:min,max

整数验证的长度必须在给定最小值 _min_ 与最大值 _max_ 之间。

### dimensions

文件在验证时，必须是符合特定尺寸要求的图像，这些要求通过验证规则的参数指定：

```php
'avatar' => 'dimensions:min_width=100,min_height=200'
```

可用的约束包括：`min_width`，`max_width`，`min_height`，`max_height`，`width`，`height`，`ratio`。

`ratio` 约束应该表示为宽度除以高度。可以通过像 `3/2` 这样的分数或 `1.5` 这样的浮点数指定：

```php
'avatar' => 'dimensions:ratio=3/2'
```

由于此规则需要多个参数，因此您可以使用 `Rule::dimensions` 方法来流畅地构建规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'avatar' => [
        'required',
        Rule::dimensions()->maxWidth(1000)->maxHeight(500)->ratio(3 / 2),
    ],
]);
```

### distinct

在验证数组时，验证的字段不能有任何重复值：

```php
'foo.*.id' => 'distinct'
```

默认情况下，Distinct 使用松散变量比较。要使用严格比较，你可以添加 `strict` 参数到你的验证规则定义中：

```php
'foo.*.id' => 'distinct:strict'
```

您可以在验证规则的参数中添加 `ignore_case`，以使规则忽略大小写差异：

```php
'foo.*.id' => 'distinct:ignore_case'
```

### doesnt_start_with

验证的字段不能以任何给定的值开始。

```php
'domain' => 'doesnt_start_with:www,http'
```

### doesnt_end_with

验证的字段不能以任何给定的值结束。

```php
'email' => 'doesnt_end_with:example.com,example.net'
```

### email

在验证时，字段必须是格式化为电子邮件地址。这个验证规则使用 [`egulias/email-validator`](https://github.com/egulias/EmailValidator) 包来验证电子邮件地址。默认情况下，应用 `RFCValidation` 验证器，但您也可以应用其他验证样式：

```php
'email' => 'email:rfc,dns'
```

上面的例子会应用 `RFCValidation` 和 `DNSCheckValidation` 验证。下面是你可以应用的一整套验证样式列表：

- `rfc`: `RFCValidation`
- `strict`: `NoRFCWarningsValidation`
- `dns`: `DNSCheckValidation`
- `spoof`: `SpoofCheckValidation`
- `filter`: `FilterEmailValidation`
- `filter_unicode`: `FilterEmailValidation::unicode()`

`filter` 验证器使用 PHP 的 `filter_var` 函数，并在 Laravel 的 5.8 版本之前是 Laravel 默认的电子邮件验证行为。

> [!WARNING]  
> `dns` 和 `spoof` 验证器需要 PHP `intl` 扩展。

### enum

`Enum` 规则是一个基于类的规则，验证字段是否包含有效的枚举值。`Enum` 规则接受枚举的名称作为其唯一的构造函数参数。在验证基本值时，应向`Enum` 规则提供一个后台枚举：

```php
use App\Enums\ServerStatus;
use Illuminate\Validation\Rule;

$request->validate([
    'status' => [Rule::enum(ServerStatus::class)],
]);
```

`Enum` 规则的 `only` 和 `except` 方法可以用来限制哪些枚举情况应被视为有效：

```php
Rule::enum(ServerStatus::class)
    ->only([ServerStatus::Pending, ServerStatus::Active]);

Rule::enum(ServerStatus::class)
    ->except([ServerStatus::Pending, ServerStatus::Active]);
```

`when` 方法可以用来有条件地修改 `Enum` 规则：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

Rule::enum(ServerStatus::class)
    ->when(
        Auth::user()->isAdmin(),
        fn ($rule) => $rule->only(...),
        fn ($rule) => $rule->only(...),
    );
```

### exclude

在验证时，该字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

### exclude_if:anotherfield,value

如果 _anotherfield_ 字段等于 _value_，在验证时，该字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

如果需要复杂的条件排除逻辑，您可以使用 `Rule::excludeIf` 方法。此方法接受一个布尔值或一个闭包。提供闭包时，闭包应该返回 `true` 或 `false` 来指示是否应该排除正在验证的字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => Rule::excludeIf($request->user()->is_admin),
]);

Validator::make($request->all(), [
    'role_id' => Rule::excludeIf(fn () => $request->user()->is_admin),
]);
```

### exclude_unless:anotherfield,value

除非 _anotherfield_ 字段等于 _value_，否则在验证时，该字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。如果 _value_ 为 `null` (`exclude_unless:name,null`)，那么除非比较字段为 `null`，或比较字段在请求数据中丢失，否则将排除正在验证的字段。

### exclude_with:anotherfield

如果 _anotherfield_ 字段存在，那么在验证时，该字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

### exclude_without:anotherfield

如果 _anotherfield_ 字段不存在，那么在验证时，该字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

### exists:table,column

在验证时，该字段必须存在于给定的数据库表中。

### Basic Usage of Exists Rule

```php
'state' => 'exists:states'
```

如果没有指定 `column` 选项，将使用字段名。因此，在这种情况下，规则将验证 `states` 数据库表中是否包含一个记录，其 `state` 字段值与请求的 `state` 属性值匹配。

### Specifying a Custom Column Name

您可以明确指定应该由验证规则使用的数据库列名，方法是在数据库表名之后放置它：

```php
'state' => 'exists:states,abbreviation'
```

有时，您可能需要指定一个特定的数据库连接来执行 `exists` 查询。您可以通过在表名前加上连接名来完成这个操作：

```php
'email' => 'exists:connection.staff,email'
```

您可以指定应该用来确定表名的 Eloquent 模型，而不是直接指定表名：

```php
'user_id' => 'exists:App\Models\User,id'
```

如果您希望自定义验证规则执行的查询，您可以使用 `Rule` 类来流畅地定义规则。在这个例子中，我们还将把验证规则指定为数组，而不是使用 `|` 字符来分隔它们：

```php
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'email' => [
        'required',
        Rule::exists('staff')->where(function (Builder $query) {
            return $query->where('account_id', 1);
        }),
    ],
]);
```

您可以通过将列名作为第二个参数提供给 `Rule::exists` 方法，明确指定应该由 `exists` 规则使用的数据库列名：

```php
'state' => Rule::exists('states', 'abbreviation'),
```

### extensions:foo,bar,...

验证的文件必须具有与列出的扩展名之一对应的用户分配的扩展名：

```php
'photo' => ['required', 'extensions:jpg,png'],
```

> [!WARNING]
> 您永远不应该仅依靠其用户分配的扩展名来验证文件。这个规则通常应该总是与 [`mimes`](#rule-mimes) 或 [`mimetypes`](#rule-mimetypes) 规则结合使用。

### file

在验证时，该字段必须是成功上传的文件。

### filled

当字段存在时，它在验证时不得为空。

### gt:field

在验证时，字段必须大于给定的 _field_ 或 _value_。两个字段必须是相同的类型。字符串、数字、数组和文件的评估使用与 [`size`](#rule-size) 规则相同的约定。

### gte:field

在验证时，字段必须大于或等于给定的 _field_ 或 _value_。两个字段必须是相同的类型。字符串、数字、数组和文件的评估使用与 [`size`](#rule-size) 规则相同的约定。

### hex_color

在验证时，字段必须包含有效的[十六进制](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color)格式的颜色值。

### image

在验证时，文件必须是图像(jpg, jpeg, png, bmp, gif, svg, 或 webp)。

### in:foo,bar,...

在验证时，字段必须包含在给定值列表中。由于这个规则经常需要你将数组 `implode`，你可以用 `Rule::in` 方法流畅地构建规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'zones' => [
        'required',
        Rule::in(['first-zone', 'second-zone']),
    ],
]);
```

当 `in` 规则与 `array` 规则结合时，输入数组中的每个值都必须存在于提供给 `in` 规则的值列表中。在下面的例子中，输入数组中的 `LAS` 机场代码是无效的，因为它不包含在提供给 `in` 规则的机场列表中：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

$input = [
    'airports' => ['NYC', 'LAS'],
];

Validator::make($input, [
    'airports' => [
        'required',
        'array',
    ],
    'airports.*' => Rule::in(['NYC', 'LIT']),
]);
```

### in*array:anotherfield*.\*

在验证时，字段必须存在于 _anotherfield_ 的值中。

### integer

在验证时，字段必须是整数。

> [!WARNING]
> 这个验证规则不验证输入是否是 "integer" 变量类型，而只是验证输入是否是 PHP 的 `FILTER_VALIDATE_INT` 规则接受的类型。如果您需要验证输入是否为数字，请将此规则与 [numeric 验证规则](#rule-numeric) 结合使用。

### ip

在验证时，字段必须是 IP 地址。

### ipv4

在验证时，字段必须是 IPv4 地址。

### ipv6

在验证时，字段必须是 IPv6 地址。

### json

在验证时，字段必须是有效的 JSON 字符串。

### lt:field

在验证时，字段必须小于给定 _field_。两个字段必须是相同类型。字符串、数字、数组和文件使用与 [`size`](#rule-size) 规则相同的惯例评估。

### lte:field

在验证时，字段必须小于或等于给定 _field_。两个字段必须是相同类型。字符串、数字、数组和文件使用与 [`size`](#rule-size) 规则相同的惯例评估。

### lowercase

在验证时，字段必须是小写。

### list

在验证时，字段必须是一个数组，并且是一个列表。如果数组的键由连续数字组成，从 0 到 `count($array) - 1`，则该数组被视为列表。

### mac_address

在验证时，字段必须是 MAC 地址。

### max:value

在验证时，字段必须小于或等于最大 _value_。字符串、数字、数组和文件以与 [`size`](#rule-size) 规则相同的方式评估。

### max_digits:value

在验证时，整数必须有最大长度 _value_。

### mimetypes:text/plain,...

在验证时，文件必须匹配给定的 MIME 类型之一：

```php
'video' => 'mimetypes:video/avi,video/mpeg,video/quicktime'
```

为了确定上传文件的 MIME 类型，文件的内容将被读取，框架将尝试猜测 MIME 类型，这可能与客户端提供的 MIME 类型不同。

### mimes:foo,bar,...

在验证时，文件必须有一个与列出的扩展名对应的 MIME 类型：

```php
'photo' => 'mimes:jpg,bmp,png'
```

尽管您只需要指定扩展名，这个规则实际上通过阅读文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其相应扩展的完整列表可以在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

### MIME Types and Extensions

这个验证规则不验证文件的 MIME 类型和用户分配给文件的扩展名是否一致。例如，`mimes:png` 验证规则将认为包含有效 PNG 内容的文件是有效的 PNG 图片，即使该文件名为 `photo.txt`。如果您想验证文件的用户分配的扩展名，请使用 [`extensions`](#rule-extensions) 规则。

### min:value

在验证时，字段必须有一个最小 _value_。字符串、数字、数组和文件以与 [`size`](#rule-size) 规则相同的方式评估。

### min_digits:value

在验证时，整数必须有最小长度 _value_。

### multiple_of:value

在验证时，字段必须是 _value_ 的倍数。

### missing

在验证时，字段必须不在输入数据中出现。

### missing_if:anotherfield,value,...

如果 _anotherfield_ 字段等于任何 _value_，那么在验证时，字段必须不出现在输入中。

### missing_unless:anotherfield,value

除非 _anotherfield_ 字段等于任何 _value_，否则在验证时，字段必须不出现在输入中。

### missing_with:foo,bar,...

在验证时，只有当任何其他指定字段出现时，字段必须不出现在输入中。

### missing_with_all:foo,bar,...

在验证时，只有当所有其他指定字段都出现时，字段必须不出现在输入中。

### not_in:foo,bar,...

在验证时，字段不能包括在给定值列表中。可以使用 `Rule::notIn` 方法流畅地构建规则：

```php
use Illuminate\Validation\Rule;

Validator::make($data, [
    'toppings' => [
        'required',
        Rule::notIn(['sprinkles', 'cherries']),
    ],
]);
```

### not_regex:pattern

在验证时，字段不能匹配给定的正则表达式。

在内部，这个规则使用 PHP `preg_match` 函数。指定的模式应该遵守 `preg_match` 所要求的相同格式，因此也应该包括有效的分隔符。例如：`'email' => 'not_regex:/^.+$/i'`。

> [!WARNING]
> 使用 `regex` / `not_regex` 模式时，可能需要使用数组来指定验证规则，而不是使用 `|` 分隔符，尤其是当正则表达式包含 `|` 字符时。

### nullable

在验证时，该字段可为 `null`。

### numeric

在验证时，字段必须是[数值类型](https://www.php.net/manual/en/function.is-numeric.php)。

### present

在验证时，字段必须存在于输入数据中。

### present_if:anotherfield,value,...

当 _anotherfield_ 字段等于任何 _value_ 时，在验证时，该字段必须存在。

### present_unless:anotherfield,value

除非 _anotherfield_ 字段等于任何 _value_，在验证时，该字段必须存在。

### present_with:foo,bar,...

_只有在_ 任何其他指定字段存在且不为空时，在验证时，该字段必须存在且不为空。

### present_with_all:foo,bar,...

_只有在_ 所有其他指定字段都存在且不为空时，在验证时，该字段必须存在且不为空。

### prohibited

在验证时，该字段必须缺失或空。字段为 "空" 的情况如下：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

### prohibited_if:anotherfield,value,...

当 _anotherfield_ 字段等于任何 _value_ 时，在验证时，该字段必须缺失或空。字段为 "空" 的情况如下：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

如果需要复杂的条件禁用逻辑，可以使用 `Rule::prohibitedIf` 方法。此方法接受一个布尔值或闭包。使用闭包时，闭包应该返回 `true` 或 `false`，以指示是否禁止该字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => Rule::prohibitedIf($request->user()->is_admin),
]);

Validator::make($request->all(), [
    'role_id' => Rule::prohibitedIf(fn () => $request->user()->is_admin),
]);
```

### prohibited_unless:anotherfield,value,...

除非 _anotherfield_ 字段等于任何 _value_，在验证时，该字段必须缺失或空。字段为 "空" 的情况如下：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

### prohibits:anotherfield,...

如果验证字段未缺失或非空，则 _anotherfield_ 中的所有字段必须缺失或空。字段为 "空" 的情况如下：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

### regex:pattern

在验证时，字段必须匹配给定的正则表达式。

在内部，此规则使用 PHP 的 `preg_match` 函数。指定的模式应遵循 `preg_match` 所要求的格式，并包含有效的分隔符。例如：`'email' => 'regex:/^.+@.+$/i'`。

> [!WARNING]
> 当使用 `regex` / `not_regex` 模式时，可能需要使用数组而不是使用 `|` 分隔符来指定规则，尤其是当正则表达式包含 `|` 字符时。

### required

在验证时，字段必须存在于输入数据中且不为空。字段为 "空" 的情况如下：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 无路径的已上传文件。

### required_if:anotherfield,value,...

当 _anotherfield_ 字段等于任何 _value_ 时，在验证时，字段必须存在且不为空。

如果需要构建 `required_if` 规则的更复杂条件，您可以使用 `Rule::requiredIf` 方法。此方法接受一个布尔值或闭包。当传递闭包时，闭包应返回 `true` 或 `false` 以指示验证的字段是不是必须的：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => Rule::requiredIf($request->user()->is_admin),
]);

Validator::make($request->all(), [
    'role_id' => Rule::requiredIf(fn () => $request->user()->is_admin),
]);
```

### required_if_accepted:anotherfield,...

如果 _anotherfield_ 字段等于 `"yes"`, `"on"`, `1`, `"1"`, `true`, 或 `"true"`，在验证时，该字段必须存在且不为空。

### required_unless:anotherfield,value,...

除非 _anotherfield_ 字段等于任何 _value_，在验证时，字段必须存在且不为空。这也意味着 _anotherfield_ 必须存在于请求数据中，除非 _value_ 为 `null`。如果 _value_ 为 `null` (`required_unless:name,null`)，除非比较字段为 `null` 或者比较字段丢失于请求数据，否则验证的字段是必需的。

### required_with:foo,bar,...

_只有在_ 任何其他指定字段存在且不为空时，在验证时，该字段必须存在且不为空。

### required_with_all:foo,bar,...

_只有在_ 所有其他指定字段都存在且不为空时，在验证时，该字段必须存在且不为空。

### required_without:foo,bar,...

_只有在_ 任何其他指定字段为空或不存在时，在验证时，该字段必须存在且不为空。

### required_without_all:foo,bar,...

_只有在_ 所有其他指定字段为空或不存在时，在验证时，该字段必须存在且不为空。

### required_array_keys:foo,bar,...

在验证时，字段必须是一个数组并且至少包含指定的键。

### same:field

在验证时，给定的 _field_ 必须与验证字段匹配。

### size:value

在验证时，字段的大小必须匹配给定的 _value_。对于字符串数据，_value_ 对应字符数。对于数值数据，_value_ 对应一个给定的整数值（属性也必须有 `numeric` 或 `integer` 规则）。对于数组，_size_ 对应数组的 `count`。对于文件，_size_ 对应文件的大小，以千字节为单位。让我们来看一些例子：

```php
// 验证一个字符串是否恰好是 12 个字符长...
'title' => 'size:12';

// 验证一个提供的整数等于 10...
'seats' => 'integer|size:10';

// 验证一个数组是否恰好有 5 个元素...
'tags' => 'array|size:5';

// 验证一个上传的文件是否恰好是 512 千字节...
'image' => 'file|size:512';
```

### starts_with:foo,bar,...

在验证时，字段必须以给定值中的一个开始。

### string

在验证时，字段必须是一个字符串。如果您也想允许字段为 `null`，应将 `nullable` 规则分配给该字段。

### timezone

在验证时，字段必须是 `DateTimeZone::listIdentifiers` 方法根据的一个有效的时区标识符。

也可以将 [`DateTimeZone::listIdentifiers` 方法接受的参数](https://www.php.net/manual/en/datetimezone.listidentifiers.php) 提供给这个验证规则：

```php
'timezone' => 'required|timezone:all';

'timezone' => 'required|timezone:Africa';

'timezone' => 'required|timezone:per_country,US';
```

### unique:table,column

在验证时，该字段在给定数据库表中必须不存在。

**指定自定义表格/列名：**

您可以指定 Eloquent 模型来确定表名，而不是直接指定表名：

```php
'email' => 'unique:App\Models\User,email_address'
```

`column` 选项用于指定字段对应的数据库列。如果没有指定 `column` 选项，则会使用验证字段的名称。

```php
'email' => 'unique:users,email_address'
```

**指定自定义数据库连接**

偶尔，您可能需要为 Validator 执行的数据库查询设置自定义连接。为此，您可以在表名前加上连接名：

```php
'email' => 'unique:connection.users,email_address'
```

**要求唯一规则忽略给定 ID：**

有时，您可能希望在唯一性验证中忽略给定的 ID。例如，考虑一个包括用户姓名、电子邮件地址和位置的“更新个人信息”界面。您可能希望验证电子邮件地址的唯一性。但是，如果用户仅更改姓名字段而不是电子邮件字段，则您不希望因用户已经是该电子邮件地址的所有者而抛出验证错误。

为指导验证器忽略用户的 ID，我们将使用 `Rule` 类来流畅定义规则。在这个例子中，我们还将以数组形式指定验证规则，而不是使用 `|` 字符来界定规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'email' => [
        'required',
        Rule::unique('users')->ignore($user->id),
    ],
]);
```

> [!WARNING]
> 您不应将任何用户控制的请求输入传递到 `ignore` 方法中。相反，您应该只传递系统生成的唯一 ID，如 Eloquent 模型实例的自增 ID 或 UUID。否则，您的应用程序将容易受到 SQL 注入攻击。

您可以将整个模型实例而不是模型键的值传递给 `ignore` 方法。Laravel 将自动从模型中提取键：

```php
Rule::unique('users')->ignore($user)
```

如果您的表使用的主键列名不是 `id`，您可以在调用 `ignore` 方法时指定该列的名称：

```php
Rule::unique('users')->ignore($user->id, 'user_id')
```

默认情况下，`unique` 规则将检查与正在验证的属性名称相匹配的列的唯一性。但是，您可以将不同的列名作为第二个参数传递给 `unique` 方法：

```php
Rule::unique('users', 'email_address')->ignore($user->id)
```

**添加额外的 Where 子句：**

您可以通过使用 `where` 方法自定义查询来指定额外的查询条件。例如，让我们添加一个查询条件，将查询限定在只搜索 `account_id` 列值为 `1` 的记录：

```php
'email' => Rule::unique('users')->where(fn (Builder $query) => $query->where('account_id', 1))
```

### uppercase

在验证时，该字段必须为大写。

### url

在验证时，该字段必须是有效的 URL。

如果您想指定应该被视为有效的 URL 协议，您可以将协议作为验证规则参数传递：

```php
'url' => 'url:http,https',

'game' => 'url:minecraft,steam',
```

### ulid

在验证时，该字段必须是有效的 [Universally Unique Lexicographically Sortable Identifier](https://github.com/ulid/spec) (ULID，全局唯一按字典顺序可排序标识符)。

### uuid

在验证时，该字段必须是一个有效的 RFC 4122 (版本 1, 3, 4, 或 5) 通用唯一标识符 (UUID)。

## 根据条件添加规则

### 跳过验证某些字段的值时

有时您可能想在另一个字段具有给定值时不验证给定的字段。您可以使用 `exclude_if` 验证规则来实现这一点。在此示例中，如果 `has_appointment` 字段的值为 `false`，则不会验证 `appointment_date` 和 `doctor_name` 字段：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($data, [
    'has_appointment' => 'required|boolean',
    'appointment_date' => 'exclude_if:has_appointment,false|required|date',
    'doctor_name' => 'exclude_if:has_appointment,false|required|string',
]);
```

或者，您可以使用 `exclude_unless` 规则在另一个字段具有给定值时验证给定字段：

```php
$validator = Validator::make($data, [
    'has_appointment' => 'required|boolean',
    'appointment_date' => 'exclude_unless:has_appointment,true|required|date',
    'doctor_name' => 'exclude_unless:has_appointment,true|required|string',
]);
```

### 当存在时验证

在某些情况下，您可能希望 **仅当** 该字段存在于被验证的数据中时才对字段进行验证检查。要快速实现这一点，请将 `sometimes` 规则添加到您的规则列表中：

```php
$v = Validator::make($data, [
    'email' => 'sometimes|required|email',
]);
```

在上面的例子中，如果 `email` 字段存在于 `$data` 数组中，则只会验证该字段。

[!NOTE]

> 如果您正在尝试验证应始终存在但可能为空的字段，请查看[可选字段的注释](#a-note-on-optional-fields)。

### 复杂条件验证

有时您可能希望基于更复杂的条件逻辑添加验证规则。例如，如果另一个字段的值大于 100，您可能希望要求给定字段。或者，您可能需要两个字段在另一个字段存在时具有给定值。添加这些验证规则不必痛苦。首先，用您的 _静态规则_ 创建一个 `Validator` 实例，这些规则永远不会改变：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'email' => 'required|email',
    'games' => 'required|numeric',
]);
```

让我们假设我们的网站应用程序是为游戏收藏家设计的。如果游戏收藏家向我们的应用程序注册并拥有超过 100 个游戏，我们希望他们解释为什么拥有这么多游戏。例如，可能他们经营游戏转售店，或者他们只是喜欢收集游戏。要有条件地添加此要求，我们可以使用 `Validator` 实例上的 `sometimes` 方法。

```php
use Illuminate\Support\Fluent;

$validator->sometimes('reason', 'required|max:500', function (Fluent $input) {
    return $input->games >= 100;
});
```

传递给 `sometimes` 方法的第一个参数是我们正在有条件地验证的字段的名称。第二个参数是我们想要添加的规则列表。如果第三个参数传递的闭包返回 `true`，则将添加规则。此方法可以轻松构建复杂的条件验证。您甚至可以一次为多个字段添加条件性验证：

```php
$validator->sometimes(['reason', 'cost'], 'required', function (Fluent $input) {
    return $input->games >= 100;
});
```

[!NOTE]

> 传递给闭包的 `$input` 参数将是 `Illuminate\Support\Fluent` 的实例，可用于访问您正在验证的输入和文件。

### 复杂条件数组验证

有时您可能希望根据同一个嵌套数组中的另一个字段验证一个字段，而您不知道该字段的索引。在这些情况下，您可以让您的闭包接收第二个参数，这将是数组中当前正在验证的单个项目：

```php
$input = [
    'channels' => [
        [
            'type' => 'email',
            'address' => 'abigail@example.com',
        ],
        [
            'type' => 'url',
            'address' => 'https://example.com',
        ],
    ],
];

$validator->sometimes('channels.*.address', 'email', function (Fluent $input, Fluent $item) {
    return $item->type === 'email';
});

$validator->sometimes('channels.*.address', 'url', function (Fluent $input, Fluent $item) {
    return $item->type !== 'email';
});
```

与传递给闭包的 `$input` 参数一样，当属性数据是数组时，`$item` 参数是 `Illuminate\Support\Fluent` 的实例；否则，它是一个字符串。

## 验证数组

如[`array` 验证规则文档](#rule-array)中所讨论，`array` 规则接受允许的数组键列表。如果数组中存在任何其他键，验证将失败：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'user' => [
        'name' => 'Taylor Otwell',
        'username' => 'taylorotwell',
        'admin' => true,
    ],
];

Validator::make($input, [
    'user' => 'array:name,username',
]);
```

通常，您应始终指定允许出现在您数组中的键。否则，验证器的 `validate` 和 `validated` 方法将返回所有经过验证的数据，包括数组及其所有键，即使这些键未通过其他嵌套数组验证规则进行验证。

### 验证嵌套数组输入

验证基于嵌套数组的表单输入字段不必繁琐。您可以使用“点表示法”来验证数组内的属性。例如，如果传入的 HTTP 请求包含 `photos[profile]` 字段，您可以这样验证它：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'photos.profile' => 'required|image',
]);
```

您还可以验证数组的每个元素。例如，要验证给定数组输入字段中的每个电子邮件是否唯一，您可以执行以下操作：

```php
$validator = Validator::make($request->all(), [
    'person.*.email' => 'email|unique:users',
    'person.*.first_name' => 'required_with:person.*.last_name',
]);
```

同样，您可以在为基于数组的字段指定[语言文件中的自定义验证消息](#custom-messages-for-specific-attributes)时使用 `*` 字符，使得为基于数组的字段使用单个验证消息变得轻而易举：

```php
'custom' => [
    'person.*.email' => [
        'unique' => '每个人必须有一个唯一的电子邮件地址',
    ]
],
```

### 访问嵌套数组数据

有时您可能需要在为属性分配验证规则时访问给定嵌套数组元素的值。您可以使用 `Rule::forEach` 方法来实现这一点。`forEach` 方法接受一个闭包，该闭包将在验证的数组属性的每次迭代中被调用，并接收属性的值和明确的、完全展开的属性名称。闭包应返回分配给数组元素的一组规则：

```php
use App\Rules\HasPermission;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

$validator = Validator::make($request->all(), [
    'companies.*.id' => Rule::forEach(function (string|null $value, string $attribute) {
        return [
            Rule::exists(Company::class, 'id'),
            new HasPermission('manage-company', $value),
        ];
    }),
]);
```

### 错误消息索引和位置

在验证数组时，您可能希望在错误消息中引用验证失败的特定项的索引或位置。为了实现这一点，您可以在[自定义验证消息](#manual-customizing-the-error-messages)中包含 `:index`（从 `0` 开始）和 `:position`（从 `1` 开始）占位符：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'photos' => [
        [
            'name' => 'BeachVacation.jpg',
            'description' => 'A photo of my beach vacation!',
        ],
        [
            'name' => 'GrandCanyon.jpg',
            'description' => '',
        ],
    ],
];

Validator::validate($input, [
    'photos.*.description' => 'required',
], [
    'photos.*.description.required' => 'Please describe photo #:position.',
]);
```

根据上述示例，验证将失败，用户将收到以下错误信息：“Please describe photo #2.”

如有必要，您可以通过 `second-index`、`second-position`、`third-index`、`third-position` 等引用更深层次嵌套索引和位置。

```php
'photos.*.attributes.*.string' => 'Invalid attribute for photo #:second-position.',
```

## 验证文件

Laravel 提供了多种验证规则，可用于验证上传的文件，例如 `mimes`、`image`、`min` 和 `max`。虽然您可以在验证文件时单独指定这些规则，Laravel 还提供了一个灵活的文件验证规则构建器，您可能会觉得它很方便：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'attachment' => [
        'required',
        File::types(['mp3', 'wav'])
            ->min(1024)
            ->max(12 * 1024),
    ],
]);
```

如果您的应用程序接受用户上传的图像，您可以使用 `File` 规则的 `image` 构造函数方法来表明上传的文件应该是一张图像。此外，`dimensions` 规则可用于限制图像的尺寸：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'photo' => [
        'required',
        File::image()
            ->min(1024)
            ->max(12 * 1024)
            ->dimensions(Rule::dimensions()->maxWidth(1000)->maxHeight(500)),
    ],
]);
```

[!NOTE]

> 有关验证图像尺寸的更多信息，请参阅[尺寸规则文档](#rule-dimensions)。

### 文件大小

为了方便，最小和最大文件大小可以指定为带有表示文件大小单位的后缀的字符串。支持 `kb`、`mb`、`gb` 和 `tb` 后缀：

```php
File::image()
    ->min('1kb')
    ->max('10mb')
```

### 文件类型

尽管调用 `types` 方法时您只需要指定扩展名，这个方法实际上通过读取文件的内容和猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

## 验证密码

为确保密码具有足够的复杂性，您可以使用 Laravel 的 `Password` 规则对象：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

$validator = Validator::make($request->all(), [
    'password' => ['required', 'confirmed', Password::min(8)],
]);
```

`Password` 规则对象允许您轻松自定义应用程序的密码复杂性要求，比如指定密码需要至少一个字母、数字、符号或大小写混合字符：

```php
// 要求至少 8 个字符...
Password::min(8)

// 要求至少一个字母...
Password::min(8)->letters()

// 要求至少一个大写和小写字母...
Password::min(8)->mixedCase()

// 要求至少一个数字...
Password::min(8)->numbers()

// 要求至少一个符号...
Password::min(8)->symbols()
```

此外，您可以使用 `uncompromised` 方法确保密码在公开的密码数据泄露中未被泄露：

```php
Password::min(8)->uncompromised()
```

在内部，`Password` 规则对象使用 [k-Anonymity](https://en.wikipedia.org/wiki/K-anonymity) 模型通过 [haveibeenpwned.com](https://haveibeenpwned.com) 服务确定密码是否已泄露，而不损害用户的隐私或安全。

默认情况下，如果密码在数据泄漏中出现至少一次，则将被认为已经泄露。您可以使用 `uncompromised` 方法的第一个参数自定义此阈值：

```php
// 确保密码在相同数据泄露中出现少于 3 次...
Password::min(8)->uncompromised(3);
```

当然，您可以链式调用上述所有方法：

```php
Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
```

### 定义默认密码规则

您可能会发现在应用程序的单个位置指定密码的默认验证规则很方便。您可以使用 `Password::defaults` 方法轻松完成这项工作，该方法接受一个闭包。`defaults` 方法给出的闭包应返回密码规则的默认配置。通常，`defaults` 规则应在您的应用程序的服务提供者之一的 `boot` 方法中调用：

```php
use Illuminate\Validation\Rules\Password;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Password::defaults(function () {
        $rule = Password::min(8);

        return $this->app->isProduction()
                    ? $rule->mixedCase()->uncompromised()
                    : $rule;
    });
}
```

然后，当您希望将默认规则应用于正在验证的特定密码时，可以不带参数地调用 `defaults` 方法：

```php
'password' => ['required', Password::defaults()],
```

有时，您可能希望将额外的验证规则附加到默认的密码验证规则。您可以使用 `rules` 方法完成此操作：

```php
use App\Rules\ZxcvbnRule;

Password::defaults(function () {
    $rule = Password::min(8)->rules([new ZxcvbnRule]);

    // ...
});
```

## 自定义验证规则

### 使用规则对象

Laravel 提供了许多有用的验证规则；但是，您可能希望指定一些自己的规则。注册自定义验证规则的一种方法是使用规则对象。您可以使用 `make:rule` Artisan 命令生成新的规则对象。让我们使用这个命令生成一个验证字符串是否大写的规则。Laravel 会将新规则放在 `app/Rules` 目录中。如果该目录不存在，当您执行 Artisan 命令来创建您的规则时，Laravel 将创建它：

```shell
php artisan make:rule Uppercase
```

规则创建后，我们准备定义其行为。规则对象包含一个方法：`validate`。此方法接收属性名称、其值和一个回调，失败时应调用该回调以返回验证错误消息：

```php
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements ValidationRule
{
    /**
     * 运行验证规则。
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strtoupper($value) !== $value) {
            $fail('The :attribute must be uppercase.');
        }
    }
}
```

定义规则后，您可以通过将规则对象实例与其他验证规则一起传递来将其附加到验证器：

```php
use App\Rules\Uppercase;

$request->validate([
    'name' => ['required', 'string', new Uppercase],
]);
```

在 `$fail` 闭包中，您可以提供一个[翻译字符串键](/docs/11/digging-deeper/localization)，并指示 Laravel 翻译错误消息：

```php
if (strtoupper($value) !== $value) {
    $fail('validation.uppercase')->translate();
}
```

如果需要，您可以为 `translate` 方法的第一个和第二个参数提供占位符替代和首选语言：

```php
$fail('validation.location')->translate([
    'value' => $this->value,
], 'fr')
```

#### 访问额外数据

如果您的自定义验证规则类需要访问正在验证的所有其他数据，您的规则类可以实现 `Illuminate\Contracts\Validation\DataAwareRule` 接口。该接口要求您的类定义一个 `setData` 方法。在验证进行之前，Laravel 将自动通过所有验证数据调用此方法：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements DataAwareRule, ValidationRule
{
    /**
     * 正在验证的所有数据。
     *
     * @var array<string, mixed>
     */
    protected $data = [];

    // ...

    /**
     * 设置正在验证的数据。
     *
     * @param  array<string, mixed>  $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }
}
```

或者，如果您的验证规则需要访问执行验证的验证器实例，则您可以实现 `ValidatorAwareRule` 接口：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\ValidatorAwareRule;
use Illuminate\Validation\Validator;

class Uppercase implements ValidationRule, ValidatorAwareRule
{
    /**
     * 验证器实例。
     *
     * @var \Illuminate\Validation\Validator
     */
    protected $validator;

    // ...

    /**
     * 设置当前验证器。
     */
    public function setValidator(Validator $validator): static
    {
        $this->validator = $validator;

        return $this;
    }
}
```

### 使用闭包

如果您的应用程序中只需要自定义规则的功能一次，则可以使用闭包代替规则对象。闭包接收属性的名称、属性的值以及在验证失败时应调用的 `$fail` 回调：

```php
use Illuminate\Support\Facades\Validator;
use Closure;

$validator = Validator::make($request->all(), [
    'title' => [
        'required',
        'max:255',
        function (string $attribute, mixed $value, Closure $fail) {
            if ($value === 'foo') {
                $fail("The {$attribute} is invalid.");
            }
        },
    ],
]);
```

### 内含规则

默认情况下，当验证的属性不存在或包含空字符串时，普通验证规则（包括自定义规则）不会运行。例如，[`unique`](#rule-unique) 规则不会针对空字符串运行：

```php
use Illuminate\Support\Facades\Validator;

$rules = ['name' => 'unique:users,name'];

$input = ['name' => ''];

Validator::make($input, $rules)->passes(); // true
```

对于即使在属性为空时也要运行的自定义规则，该规则必须暗示该属性是必需的。要快速生成一个新的内含规则对象，您可以使用带有 `--implicit` 选项的 `make:rule` Artisan 命令：

```shell
php artisan make:rule Uppercase --implicit
```

> [!WARNING]  
> 一个"内含"规则只是 _暗示_ 该属性是必需的。它实际上是否会使缺失或空属性无效取决于你。
