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

那么，如果传入的请求字段没有通过给定的验证规则会怎样呢？如前所述，Laravel 将自动将用户重定向回他们之前的位置。此外，验证错误和[请求输入](/docs/{{version}}/requests#retrieving-old-input)将自动被[闪存到会话](/docs/{{version}}/session#flash-data)中。

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

此外，你可以复制这个文件到另一个语言目录来翻译你的应用程序的语言的消息。要了解更多关于 Laravel 本地化的信息，请查看完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用程序框架不包括 `lang` 目录。如果你想自定义 Laravel 的语言文件，你可以通过 `lang:publish` Artisan 命令发布它们。

#### XHR 请求和验证

在这个例子中，我们使用了传统表单向应用发送数据。然而，许多应用程序从由 JavaScript 驱动的前端接收 XHR 请求。在 XHR 请求中使用 `validate` 方法时，Laravel 不会生成重定向响应。相反，Laravel 会生成一个包含所有验证错误的 [JSON 响应](#validation-error-response-format)。这个 JSON 响应会以 422 HTTP 状态码发送。

#### `@error` 指令

你可以使用 `@error` [Blade](/docs/{{version}}/blade) 指令快速确定某个属性是否存在验证错误消息。在 `@error` 指令内部，你可以回显 `$message` 变量来显示错误消息：

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

当 Laravel 因验证错误而生成重定向响应时，框架将自动 [将所有请求的输入数据闪存到会话中](/docs/{{version}}/session#flash-data)。这样做是为了方便你在下一个请求期间访问输入数据，并重新填充用户尝试提交的表单。

要从上一个请求中检索闪存的输入，调用 `Illuminate\Http\Request` 实例上的 `old` 方法。`old` 方法将从 [会话](/docs/{{version}}/session) 中提取之前闪存的输入数据：

```php
$title = $request->old('title');
```

Laravel 还提供了一个全局的 `old` 帮助函数。如果你在 [Blade 模板](/docs/{{version}}/blade) 中显示旧输入，使用 `old` 帮助函数重新填充表单会更方便。如果给定字段没有旧输入，将返回 `null`：

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
> 你可以在 `rules` 方法的签名中类型提示任何你需要的依赖项。它们将通过 Laravel [服务容器](/docs/{{version}}/container) 自动被解析。

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
> 需要为你的 Inertia 驱动的 Laravel 前端添加实时表单请求验证吗？查看 [Laravel Precognition](/docs/{{version}}/precognition)。

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

表单请求类还包含一个 `authorize` 方法。在这个方法中，你可以确定当前认证的用户是否真的有权限更新给定的资源。例如，你可以确定用户是否真的拥有他们试图更新的博客评论。你很可能会在这个方法内与你的 [授权门和策略](/docs/{{version}}/authorization) 交互：

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

因此，如果你的应用程序利用了 [路由模型绑定](/docs/{{version}}/routing#route-model-binding)，你的代码可以通过访问请求的解析模型属性来使其更加简洁：

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
> 你可以在 `authorize` 方法的签名中类型提示任何你需要的依赖。它们将通过 Laravel [服务容器](/docs/{{version}}/container) 自动被解析。

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

如果你不想在请求上使用 `validate` 方法，你可以使用 `Validator` [facade](/docs/{{version}}/facades) 手动创建一个验证器实例。facade 上的 `make` 方法生成一个新的验证器实例：

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

如果你想将验证后的数据作为[集合](/docs/{{version}}/collections)实例获取，你可以调用 `collect` 方法：

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

此外，你可以将此文件复制到另一个语言目录以翻译应用程序的语言消息。要了解更多关于 Laravel 本地化信息，请查看完整的[本地化文档](/docs/{{version}}/localization)。

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

```none
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

```none
The credit card number field is required when payment type is credit card.
```

下面是所有可用的验证规则及其功能的列表：

````markdown
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
````

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

### current_password

验证的字段必须与认证用户的密码匹配。你可以使用规则的第一个参数指定一个 [认证守卫](/docs/{{version}}/authentication)：

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

> 警告：  
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
