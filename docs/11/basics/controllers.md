---
title: Laravel 控制器
---

# 控制器

[[toc]]

## 介绍

与其将所有的请求处理逻辑定义为路由文件中的闭包，你可能希望使用“控制器（controller）”类来组织这些行为。控制器可以将相关的请求处理逻辑组织到单个类中。例如，一个 `UserController` 类可能会处理所有与用户相关的传入请求，包括显示、创建、更新和删除用户。默认情况下，控制器被存储在 `app/Http/Controllers` 目录中。

## 编写控制器

### 基础控制器

要快速生成一个新的控制器，你可以运行 `make:controller` Artisan 命令。默认情况下，你的应用程序所有的控制器都存储在 `app/Http/Controllers` 目录:

```shell
php artisan make:controller UserController
```

让我们看一个基础控制器的例子。一个控制器可以有任意数量的公共方法来响应传入的 HTTP 请求:

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show the profile for a given user.
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

一旦你编写了一个控制器类和方法，你可以这样定义一个路由到控制器方法:

```php
use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
```

当传入请求匹配指定的路由 URI 时，`App\Http\Controllers\UserController` 类上的 `show` 方法将会被调用，并且路由参数将被传递给该方法。

> [!NOTE]
> 控制器**不必**继承基类。然而，有时候通过继承一个包含了应该被你的所有控制器共享的方法的基控制器类是方便的。

### 单一操作控制器

如果一个控制器动作特别复杂，你会发现将整个控制器类专用于那个单一动作是方便的。要实现这一点，你可以在控制器中定义一个单一的 `__invoke` 方法:

```php
<?php

namespace App\Http\Controllers;

class ProvisionServer extends Controller
{
    /**
     * Provision a new web server.
     */
    public function __invoke()
    {
        // ...
    }
}
```

在注册单一操作控制器的路由时，你不需要指定控制器方法。相反，你可以简单地将控制器的名称传递给路由器:

```php
use App\Http\Controllers\ProvisionServer;

Route::post('/server', ProvisionServer::class);
```

你可以使用 `make:controller` Artisan 命令的 `--invokable` 选项来生成一个可调用的控制器:

```shell
php artisan make:controller ProvisionServer --invokable
```

> [!NOTE]
> 控制器存根可以通过 [存根发布](/docs/11/digging-deeper/artisan#stub-customization) 自定义。

## 控制器中间件

[中间件](/docs/11/basics/middleware) 可以在你的路由文件中被分配给控制器的路由:

```php
Route::get('profile', [UserController::class, 'show'])->middleware('auth');
```

或者，你可能会发现在控制器类中指定中间件是方便的。要这样做，你的控制器应该实现 `HasMiddleware` 接口，这个接口规定控制器应该有一个静态的 `middleware` 方法。从这个方法，你可以返回一个数组，包含应用于控制器动作的中间件:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('log', only: ['index']),
            new Middleware('subscribed', except: ['store']),
        ];
    }

    // ...
}
```

你还可以将控制器中间件定义为闭包，这提供了一种在不编写完整的中间件类的情况下定义内联中间件的便捷方式:

```php
use Closure;
use Illuminate\Http\Request;

/**
 * Get the middleware that should be assigned to the controller.
 */
public static function middleware(): array
{
    return [
        function (Request $request, Closure $next) {
            return $next($request);
        },
    ];
}
```

## 资源控制器

如果你将应用程序中的每个 Eloquent 模型视为一个“资源”，通常会针对每个资源执行相同的一组动作。例如，想象你的应用程序包含一个 `Photo` 模型和一个 `Movie` 模型。用户很可能可以创建、读取、更新或删除这些资源。

因为这个常见的用例，Laravel 资源路由将典型的创建、读取、更新和删除（"CRUD"）路由分配给一个控制器，只需一行代码。要开始，我们可以使用 `make:controller` Artisan 命令的 `--resource` 选项来快速创建一个处理这些动作的控制器:

```shell
php artisan make:controller PhotoController --resource
```

这个命令将在 `app/Http/Controllers/PhotoController.php` 生成一个控制器。控制器将包含每个可用资源操作的方法。接下来，你可以注册一个指向该控制器的资源路由:

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class);
```

这个单一的路由声明创建了多个路由来处理资源的各种动作。生成的控制器已经为这些动作预设了方法。记住，你总是可以通过运行 `route:list` Artisan 命令来快速概览你的应用程序路由。

你甚至可以通过向 `resources` 方法传递一个数组来一次注册多个资源控制器:

```php
Route::resources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

#### 资源控制器处理的动作

| 动词      | URI                    | 动作    | 路由名称       |
| --------- | ---------------------- | ------- | -------------- |
| GET       | `/photos`              | index   | photos.index   |
| GET       | `/photos/create`       | create  | photos.create  |
| POST      | `/photos`              | store   | photos.store   |
| GET       | `/photos/{photo}`      | show    | photos.show    |
| GET       | `/photos/{photo}/edit` | edit    | photos.edit    |
| PUT/PATCH | `/photos/{photo}`      | update  | photos.update  |
| DELETE    | `/photos/{photo}`      | destroy | photos.destroy |

#### 自定义缺失模型行为

如果隐式绑定的资源模型未找到，通常会生成一个 404 HTTP 响应。然而，你可以通过在定义资源路由时调用 `missing` 方法来自定义此行为。如果任何资源的路由无法找到隐式绑定的模型，`missing` 方法接受的闭包将被调用:

```php
use App\Http\Controllers\PhotoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

Route::resource('photos', PhotoController::class)
        ->missing(function (Request $request) {
            return Redirect::route('photos.index');
        });
```

#### 软删除模型

通常情况下，隐式模型绑定不会检索已经[软删除](/docs/11/eloquent/eloquent#soft-deleting)的模型，并且会返回一个 404 HTTP 响应。然而，你可以在定义资源路由时调用 `withTrashed` 方法来指示框架允许软删除的模型:

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->withTrashed();
```

如果没有参数调用 `withTrashed`，那么软删除的模型将对 `show`、`edit` 和 `update` 资源路由有效。你可以通过传递一个数组给 `withTrashed` 方法来指定这些路由的子集:

```php
Route::resource('photos', PhotoController::class)->withTrashed(['show']);
```

#### 指定资源模型

如果你在使用[路由模型绑定](/docs/11/basics/routing#route-model-binding)，并且希望资源控制器的方法类型提示一个模型实例，你可以在生成控制器时使用 `--model` 选项:

```shell
php artisan make:controller PhotoController --model=Photo --resource
```

#### 生成表单请求

当生成资源控制器时，你可以提供 `--requests` 选项来指示 Artisan 为控制器的存储和更新方法生成[表单请求类](/docs/11/basics/validation#form-request-validation):

```shell
php artisan make:controller PhotoController --model=Photo --resource --requests
```

### 部分资源路由

声明资源路由时，你可以指定控制器应该处理的动作子集，而不是默认动作的全部集合:

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->only([
    'index', 'show'
]);

Route::resource('photos', PhotoController::class)->except([
    'create', 'store', 'update', 'destroy'
]);
```

#### API 资源路由

声明将被 API 使用的资源路由时，你通常会想要排除展示 HTML 模板的路由，如 `create` 和 `edit`。作为一种便利，你可以使用 `apiResource` 方法来自动排除这两个路由:

```php
use App\Http\Controllers\PhotoController;

Route::apiResource('photos', PhotoController::class);
```

你可以通过向 `apiResources` 方法传递一个数组来一次性注册多个 API 资源控制器:

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;

Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

要快速生成一个不包括 `create` 或 `edit` 方法的 API 资源控制器，可以在执行 `make:controller` 命令时使用 `--api` 开关:

```shell
php artisan make:controller PhotoController --api
```

### 嵌套资源

有时候你可能需要定义指向嵌套资源的路由。例如，一个照片资源可能有多个评论可以附加到照片上。要嵌套资源控制器，你可以在路由声明中使用“点”符号:

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class);
```

这个路由会注册一个嵌套的资源，可以通过如下 URI 访问:

```
/photos/{photo}/comments/{comment}
```

#### 限定嵌套资源

Laravel 的[隐式模型绑定](/docs/11/basics/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定，以确认解析的子模型属于父模型。通过在定义嵌套资源时使用 `scoped` 方法，你可以启用自动限定，同时指导 Laravel 应该通过哪个字段检索子资源。有关如何实现这一点的更多信息，请查看[限定资源路由](#restful-scoping-resource-routes)的文档。

#### 浅层嵌套

通常情况下，由于子 ID 已经是一个唯一标识符，因此在 URI 中不完全需要父 ID 和子 ID。当使用自增主键之类的唯一标识符来在 URI 段中识别模型时，你可能会选择使用“浅层嵌套”:

```php
use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
```

这个路由定义将定义以下路由:

| 动词      | URI                               | 动作    | 路由名称               |
| --------- | --------------------------------- | ------- | ---------------------- |
| GET       | `/photos/{photo}/comments`        | index   | photos.comments.index  |
| GET       | `/photos/{photo}/comments/create` | create  | photos.comments.create |
| POST      | `/photos/{photo}/comments`        | store   | photos.comments.store  |
| GET       | `/comments/{comment}`             | show    | comments.show          |
| GET       | `/comments/{comment}/edit`        | edit    | comments.edit          |
| PUT/PATCH | `/comments/{comment}`             | update  | comments.update        |
| DELETE    | `/comments/{comment}`             | destroy | comments.destroy       |

### 命名资源路由

默认情况下，所有资源控制器动作都有一个路由名称；然而，你可以通过传递一个含有你期望的路由名称 `names` 数组来覆盖这些名称:

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->names([
    'create' => 'photos.build'
]);
```

### 命名资源路由参数

默认情况下，`Route::resource` 会基于资源的名字的“单数形式”来创建你的资源路由的路由参数。你可以使用 `parameters` 方法轻松地覆盖每个资源的这一点。传递给 `parameters` 方法的数组应该是资源名和参数名的关联数组:

```php
use App\Http\Controllers\AdminUserController;

Route::resource('users', AdminUserController::class)->parameters([
    'users' => 'admin_user'
]);
```

上面的示例为资源的 `show` 路由生成以下 URI:

```
/users/{admin_user}
```

### 限定资源路由

Laravel 的[限定隐式模型绑定](/docs/11/basics/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定，以确认解析的子模型属于父模型。通过在定义嵌套资源时使用 `scoped` 方法，你可以启用自动限定，同时指导 Laravel 应该通过哪个字段检索子资源:

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class)->scoped([
    'comment' => 'slug',
]);
```

这个路由将注册一个限定的嵌套资源，可以通过如下 URI 访问:

```
/photos/{photo}/comments/{comment:slug}
```

当使用自定义键隐式绑定作为嵌套的路由参数时，Laravel 会自动限定查询以通过父模型上的约定猜测的关系名称来检索嵌套模型。在这种情况下，假设 `Photo` 模型有一个名为 `comments` 的关系（路由参数名的复数形式），可以用来检索 `Comment` 模型。

### 本地化资源 URIs

默认情况下，`Route::resource` 会使用英语动词和复数规则创建资源 URIs。如果你需要本地化 `create` 和 `edit` 动作动词，你可以使用 `Route::resourceVerbs` 方法。这可以在应用程序的 `App\Providers\AppServiceProvider` 中的 `boot` 方法开始时完成：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Route::resourceVerbs([
        'create' => 'crear',
        'edit' => 'editar',
    ]);
}
```

Laravel 的复数器支持[几种不同的语言，你可以根据需要进行配置](/docs/11/digging-deeper/localization#pluralization-language)。一旦动词和复数语言被定制化，比如 `Route::resource('publicacion', PublicacionController::class)` 的资源路由注册会生成如下 URIs：

```
/publicacion/crear

/publicacion/{publicaciones}/editar
```

### 补充资源控制器

如果你需要在资源控制器的默认资源路由集之外添加额外的路由，你应该在调用 `Route::resource` 方法之前定义那些路由；否则，由 `resource` 方法定义的路由可能会无意中优先于你的补充路由：

```php
use App\Http\Controller\PhotoController;

Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
```

> [!NOTE]
> 记得要保持你的控制器专注。如果你发现自己经常需要超出典型资源动作集外的方法，请考虑将你的控制器拆分成两个更小的控制器。

### 单例资源控制器

有时候，你的应用程序将有资源可能只有一个实例。例如，用户的“档案(profile)”可以被编辑或更新，但用户可能不会有多于一个的“档案”。同样的，一张图片可能有一个“缩略图(thumbnail)”。这些资源被称为“单例资源(singleton resources)”，意味着资源可能只存在一个实例。在这些场景中，你可以注册一个“单例”资源控制器：

```php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::singleton('profile', ProfileController::class);
```

上面的单例资源定义将注册以下路由。如你所见，对于单例资源不会注册“创建”路由，并且注册的路由不接受标识符，因为资源只能存在一个实例：

| 动词      | URI             | 动作   | 路由名称       |
| --------- | --------------- | ------ | -------------- |
| GET       | `/profile`      | show   | profile.show   |
| GET       | `/profile/edit` | edit   | profile.edit   |
| PUT/PATCH | `/profile`      | update | profile.update |

单例资源也可以嵌套在标准资源中：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class);
```

在这个例子中，`photos` 资源将获得所有[标准资源路由](#actions-handled-by-resource-controller)；然而，`thumbnail` 资源将是一个单例资源，带有如下路由：

| 动词      | URI                              | 动作   | 路由名称                |
| --------- | -------------------------------- | ------ | ----------------------- |
| GET       | `/photos/{photo}/thumbnail`      | show   | photos.thumbnail.show   |
| GET       | `/photos/{photo}/thumbnail/edit` | edit   | photos.thumbnail.edit   |
| PUT/PATCH | `/photos/{photo}/thumbnail`      | update | photos.thumbnail.update |

#### 可创建的单例资源

偶尔，你可能想要为单例资源定义创建和存储路由。为达到此目的，你可以在注册单例资源路由时调用 `creatable` 方法：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class)->creatable();
```

在这个例子中，将会注册以下路由。如你所见，对于可创建的单例资源也将注册一个 `DELETE` 路由：

| 动词      | URI                                | 动作    | 路由名称                 |
| --------- | ---------------------------------- | ------- | ------------------------ |
| GET       | `/photos/{photo}/thumbnail/create` | create  | photos.thumbnail.create  |
| POST      | `/photos/{photo}/thumbnail`        | store   | photos.thumbnail.store   |
| GET       | `/photos/{photo}/thumbnail`        | show    | photos.thumbnail.show    |
| GET       | `/photos/{photo}/thumbnail/edit`   | edit    | photos.thumbnail.edit    |
| PUT/PATCH | `/photos/{photo}/thumbnail`        | update  | photos.thumbnail.update  |
| DELETE    | `/photos/{photo}/thumbnail`        | destroy | photos.thumbnail.destroy |

如果你想让 Laravel 为单例资源注册 `DELETE` 路由，但不注册创建或存储路由，你可以使用 `destroyable` 方法：

```php
Route::singleton(...)->destroyable();
```

#### API 单例资源

`apiSingleton` 方法可以用来注册将通过 API 操作的单例资源，从而不必要的 `create` 和 `edit` 路径就变得不必要了：

```php
Route::apiSingleton('profile', ProfileController::class);
```

当然，API 单例资源也可以是 `creatable` 的，这将为资源注册 `store` 和 `destroy` 路由：

```php
Route::apiSingleton('photos.thumbnail', ProfileController::class)->creatable();
```

## 控制器和依赖注入

#### 构造函数注入

Laravel [服务容器](/docs/11/architecture-concepts/container) 用于解析所有 Laravel 控制器。因此，你可以在构造函数中为控制器可能需要的任何依赖进行类型提示。声明的依赖项将自动被解析并注入到控制器实例中：

```php
<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;

class UserController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected UserRepository $users,
    ) {}
}
```

#### 方法注入

除了构造函数注入，你还可以在控制器的方法上对依赖进行类型提示。方法注入的一个常见用例是将 `Illuminate\Http\Request` 实例注入到控制器方法中：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Store a new user.
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->name;

        // Store the user...

        return redirect('/users');
    }
}
```

如果你的控制器方法还期望来自路由参数的输入，则在你的其他依赖之后列出你的路由参数。例如，如果你的路由被定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍然可以为 `Illuminate\Http\Request` 打类型提示，并通过按照以下方式定义你的控制器方法来访问你的 `id` 参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Update the given user.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // Update the user...

        return redirect('/users');
    }
}
```
