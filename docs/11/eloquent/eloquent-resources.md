---
title: Laravel Eloquent API 资源
---

# Eloquent：API 资源

[[toc]]

## 简介

当构建 API 时，您可能需要一个转换层，它位于 Eloquent 模型和实际返回给应用程序用户的 JSON 响应之间。例如，您可能希望为某些用户显示特定的属性而不是其他用户，或者您可能希望始终在模型的 JSON 表示中包括某些关系。Eloquent 的资源类允许您表达并轻松将模型和模型集合转换为 JSON。

当然，您可以随时使用 Eloquent 模型或集合的 `toJson` 方法将其转换为 JSON；但是，Eloquent 资源提供了更细粒度和健壮的控制，以便更好地控制模型及其关系的 JSON 序列化。

## 生成资源

要生成资源类，您可以使用 `make:resource` Artisan 命令。默认情况下，资源将放置在应用程序的 `app/Http/Resources` 目录中。资源扩展了 `Illuminate\Http\Resources\Json\JsonResource` 类：

```shell
php artisan make:resource UserResource
```

#### 资源集合

除了生成转换单个模型的资源外，您还可以生成负责转换模型集合的资源。这允许您的 JSON 响应包括与整个资源集合相关的链接和其他元信息。

要创建资源集合，您应该在创建资源时使用 `--collection` 标志。或者，资源名称中包含单词 `Collection` 将表明 Laravel 应该创建一个集合资源。集合资源扩展了 `Illuminate\Http\Resources\Json\ResourceCollection` 类：

```shell
php artisan make:resource User --collection

php artisan make:resource UserCollection
```

## 概念概述

> [!NOTE]  
> 这是资源和资源集合的高层次概述。强烈鼓励您阅读本文档的其他部分，了解资源提供给您的定制化和力量。

在深入研究编写资源时可用的所有选项之前，让我们先来看看 Laravel 中资源是如何被使用的。资源类代表需要转换成 JSON 结构的单个模型。例如，这里有一个简单的 `UserResource` 资源类：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

每个资源类都定义了一个 `toArray` 方法，该方法返回应该在资源作为响应从路由或控制器方法返回时转换为 JSON 的属性数组。

注意我们可以直接从 `$this` 变量访问模型属性。这是因为资源类会自动将属性和方法访问代理到底层模型，以方便访问。一旦定义了资源，它可以从路由或控制器返回。资源通过其构造函数接受底层模型实例：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return new UserResource(User::findOrFail($id));
});
```

### 资源集合

如果您要返回资源集合或分页响应，您应该在从路由或控制器创建资源实例时使用资源类提供的 `collection` 方法：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all());
});
```

请注意，这不允许添加可能需要与集合一起返回的任何自定义元数据。如果您想自定义资源集合响应，您可以创建一个专用资源来表示集合：

```shell
php artisan make:resource UserCollection
```

一旦生成了资源集合类，您就可以轻松地定义应该包括在响应中的任何元数据：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }
}
```

在定义了资源集合后，它可以从路由或控制器返回：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

#### 保留集合键

当从路由返回资源集合时，Laravel 会重置集合的键使其按数字顺序排列。然而，你可以在资源类中添加一个 `preserveKeys` 属性，以指示是否应该保留集合的原键：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 指示是否应保留资源的集合键。
     *
     * @var bool
     */
    public $preserveKeys = true;
}
```

当 `preserveKeys` 属性被设置为 `true` 时，从路由或控制器返回集合时将保留集合键：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all()->keyBy->id);
});
```

#### 自定义底层资源类

通常情况下，资源集合的 `$this->collection` 属性会自动填充为将集合中每个项目映射到其单一资源类的结果。假设单一资源类是集合类名称不带 `Collection` 后缀的部分。此外，根据你个人的偏好，单一资源类可能会或不会以 `Resource` 为后缀。

例如，`UserCollection` 将尝试将给定的用户实例映射到 `UserResource` 资源。为了自定义此行为，你可以覆盖资源集合的 `$collects` 属性：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 此资源收集的资源。
     *
     * @var string
     */
    public $collects = Member::class;
}
```

## 编写资源

> [!NOTE]
> 如果你没有阅读 [概念概述](#concept-overview)，那么强烈建议你在继续阅读本文档之前先阅读它。

资源仅需要将给定模型转换为数组。所以，每个资源都包含一个 `toArray` 方法，该方法将模型的属性转换为可从应用程序的路由或控制器返回的对 API 友好的数组：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为一个数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

一旦定义了资源，就可以直接从路由或控制器返回：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return new UserResource(User::findOrFail($id));
});
```

#### 关联关系

如果你希望在响应中包含相关资源，你可以将它们添加到资源的 `toArray` 方法返回的数组中。在这个例子中，我们将使用 `PostResource` 资源的 `collection` 方法将用户的博客文章添加到资源响应中：

```php
use App\Http\Resources\PostResource;
use Illuminate\Http\Request;

/**
 * 将资源转换为一个数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->posts),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

> [!NOTE]
> 如果你希望仅在它们已经被加载时才包含关系，请查看 [条件关联](#conditional-relationships) 的文档。

#### 资源集合

资源转换单个模型为数组，而资源集合转换模型的集合为数组。然而，并非绝对需要为你的每个模型定义一个资源集合类，因为所有资源都提供了一个 `collection` 方法来生成“即兴”资源集合：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all());
});
```

然而，如果你需要自定义随集合一起返回的元数据，那么你需要定义自己的资源集合：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为一个数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }
}
```

像单一资源一样，资源集合可以直接从路由或控制器返回：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

### 数据包装

默认情况下，当响应资源转换为 JSON 时，最外层资源将被包装在 `data` 键中。例如，典型的资源集合响应如下所示：

```json
{
  "data": [
    {
      "id": 1,
      "name": "Eladio Schroeder Sr.",
      "email": "therese28@example.com"
    },
    {
      "id": 2,
      "name": "Liliana Mayert",
      "email": "evandervort@example.com"
    }
  ]
}
```

如果你想禁用最外层资源的包装，你应该调用基础 `Illuminate\Http\Resources\Json\JsonResource` 类的 `withoutWrapping` 方法。通常，你应该从你的 `AppServiceProvider` 或其他在你的应用程序每个请求上加载的[服务提供者](/docs/11/architecture-concepts/providers)调用此方法：

```php
<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 启动任何应用服务。
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();
    }
}
```

> [!WARNING] > `withoutWrapping` 方法只影响最外层响应，不会移除你自己的资源集合手动添加的 `data` 键。

#### 包装嵌套资源

你完全自由决定你的资源关联如何包装。如果你希望所有资源集合无论嵌套级别如何都包装在 `data` 键中，你应该为每个资源定义一个资源集合类并在 `data` 键中返回集合。

你可能会想知道，这是否会导致你的最外层资源被包装在两个 `data` 键中。不用担心，Laravel 永远不会让你的资源被意外双重包装，所以你不需要担心你正在转换的资源集合的嵌套级别：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class CommentsCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为一个数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return ['data' => $this->collection];
    }
}
```

#### 数据包装和分页

当通过资源响应返回分页集合时，即使已经调用了 `withoutWrapping` 方法，Laravel 仍将在 `data` 键中包装你的资源数据。这是因为分页响应总是包含有关分页器状态的 `meta` 和 `links` 键：

```json
{
  "data": [
    {
      "id": 1,
      "name": "Eladio Schroeder Sr.",
      "email": "therese28@example.com"
    },
    {
      "id": 2,
      "name": "Liliana Mayert",
      "email": "evandervort@example.com"
    }
  ],
  "links": {
    "first": "http://example.com/users?page=1",
    "last": "http://example.com/users?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "http://example.com/users",
    "per_page": 15,
    "to": 10,
    "total": 10
  }
}
```

### 分页

你可以将 Laravel 分页器实例传递给资源的 `collection` 方法或自定义资源集合：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::paginate());
});
```

分页响应总是包含有关分页器状态的 `meta` 和 `links` 键：

```json
{
  "data": [
    {
      "id": 1,
      "name": "Eladio Schroeder Sr.",
      "email": "therese28@example.com"
    },
    {
      "id": 2,
      "name": "Liliana Mayert",
      "email": "evandervort@example.com"
    }
  ],
  "links": {
    "first": "http://example.com/users?page=1",
    "last": "http://example.com/users?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "http://example.com/users",
    "per_page": 15,
    "to": 10,
    "total": 10
  }
}
```

#### 自定义分页信息

如果你想要在分页响应的 `links` 或 `meta` 键中自定义信息，你可以在资源类上定义一个 `paginationInformation` 方法。此方法将接收 `$paginated` 数据和 `$default` 信息的数组，这个数组包含 `links` 和 `meta` 键：

```php
/**
 * 自定义资源的分页信息。
 *
 * @param  \Illuminate\Http\Request  $request
 * @param  array $paginated
 * @param  array $default
 * @return array
 */
public function paginationInformation($request, $paginated, $default)
{
    $default['links']['custom'] = 'https://example.com';

    return $default;
}
```

### 条件属性

有时你可能希望只在满足给定条件时才在资源响应中包含一个属性。例如，你可能希望仅当当前用户是“管理员”时才包括值。Laravel 提供了多种辅助方法来协助你处理这种场景。`when` 方法可以用来有条件地向资源响应添加一个属性：

```php
/**
 * 将资源转换为一个数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret' => $this->when($request->user()->isAdmin(), 'secret-value'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在这个例子中，只有当认证用户的 `isAdmin` 方法返回 `true` 时，最终的资源响应才会返回 `secret` 键。如果该方法返回 `false`，`secret` 键会在响应发送给客户端之前从资源响应中删除。`when` 方法让你可以在构建数组时不用使用条件语句就能表现力地定义你的资源。

`when` 方法也接受一个闭包作为它的第二个参数，允许你仅在给定条件为 `true` 时计算结果值：

```php
'secret' => $this->when($request->user()->isAdmin(), function () {
    return 'secret-value';
}),
```

`whenHas` 方法可用于当底层模型上实际存在属性时包括属性：

```php
'name' => $this->whenHas('name'),
```

此外，`whenNotNull` 方法可用于在属性非空时包含资源响应中的属性：

```php
'name' => $this->whenNotNull($this->name),
```

#### 合并条件属性

有时你可能会有几个属性基于相同的条件只应包含在资源响应中。在这种情况下，你可以使用 `mergeWhen` 方法在给定条件为 `true` 时将属性包含在响应中：

```php
/**
 * 将资源转换为一个数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        $this->mergeWhen($request->user()->isAdmin(), [
            'first-secret' => 'value',
            'second-secret' => 'value',
        ]),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

同样，如果给定的条件为 `false`，这些属性将在响应发送给客户端之前从资源响应中移除。

> [!WARNING]
> 不应在混合使用字符串和数字键的数组中使用 `mergeWhen` 方法。此外，也不应在数字键不是连续排序的数组中使用它。

### 条件关系

除了有条件地加载属性外，你还可以基于模型上是否已经加载了关系来有条件地在你的资源响应中包含关系。这允许你的控制器决定应该在模型上加载哪些关系，而你的资源可以在它们实际被加载时轻松包含它们。最终，这使得避免资源中的“N+1”查询问题更容易。

可使用 `whenLoaded` 方法有条件地加载关系。为了避免不必要地加载关系，此方法接受关系名称而不是关系本身：

```php
use App\Http\Resources\PostResource;

/**
 * 将资源转换为一个数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在这个例子中，如果关系没有被加载，`posts` 键将在响应发送给客户端之前从资源响应中移除。

#### 条件关系计数

除了有条件地包含关系外，如果模型上加载了关系的计数，则可有条件地在资源响应中包含关系“计数”：

```php
new UserResource($user->loadCount('posts'));
```

`whenCounted` 方法可用于在资源响应中有条件地包括关系的计数。如果关系的计数不存在，此方法避免不必要地包含属性：

```php
/**
 * 将资源转换为一个数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts_count' => $this->whenCounted('posts'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在这个例子中，如果没有加载 `posts` 关系的计数，`posts_count` 键将在响应发送给客户端之前从资源响应中移除。

使用 `whenAggregated` 方法也可以条件性地加载其他类型的聚合，如 `avg`、`sum`、`min` 和 `max`：

```php
'words_avg' => $this->whenAggregated('posts', 'words', 'avg'),
'words_sum' => $this->whenAggregated('posts', 'words', 'sum'),
'words_min' => $this->whenAggregated('posts', 'words', 'min'),
'words_max' => $this->whenAggregated('posts', 'words', 'max'),
```

#### 条件化中间表信息

除了有条件地包含在资源响应中的关系信息，你还可以使用 `whenPivotLoaded` 方法根据模型上是否可用来有条件地包含来自多对多关系中间表的数据。`whenPivotLoaded` 方法接受中间表名称作为其第一个参数。第二个参数应该是一个闭包，它返回如果中间表信息在模型上可用时将被返回的值：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'expires_at' => $this->whenPivotLoaded('role_user', function () {
            return $this->pivot->expires_at;
        }),
    ];
}
```

如果你的关系使用了[自定义中间表模型](/docs/11/eloquent/eloquent-relationships#defining-custom-intermediate-table-models)，你可以将中间表模型的实例作为 `whenPivotLoaded` 方法的第一个参数：

```php
'expires_at' => $this->whenPivotLoaded(new Membership, function () {
    return $this->pivot->expires_at;
}),
```

如果你的中间表使用了一个不同于 `pivot` 的访问器，你可以使用 `whenPivotLoadedAs` 方法：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'expires_at' => $this->whenPivotLoadedAs('subscription', 'role_user', function () {
            return $this->subscription->expires_at;
        }),
    ];
}
```

### 添加元数据

一些 JSON API 标准要求在资源和资源集合响应中添加元数据。这通常包括指向资源或相关资源的 `links`，或关于资源本身的元数据。如果你需要返回关于资源的额外元数据，请在 `toArray` 方法中包含它。例如，当转换资源集合时，你可能包含 `link` 信息：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'data' => $this->collection,
        'links' => [
            'self' => 'link-value',
        ],
    ];
}
```

当从你的资源中返回额外的元数据时，你永远不必担心意外地覆盖 Laravel 在返回分页响应时自动添加的 `links` 或 `meta` 键。你定义的任何额外 `links` 将与分页器提供的链接合并。

#### 顶层元数据

有时，你可能只想在资源是返回的最外层资源时，才包扩特定的元数据。通常，这包括有关整个响应的元信息。要定义此元数据，请在资源类中添加 `with` 方法。此方法应返回一个数组，该数组包含仅当资源是正在转换的最外层资源时才包含的元数据：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }

    /**
     * 获取额外的数据，这些数据应该与资源数组一起返回。
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'key' => 'value',
            ],
        ];
    }
}
```

#### 构建资源时添加元数据

你还可以在路由或控制器中构建资源实例时添加顶层数据。所有资源都可用的 `additional` 方法接受一个数组，该数组应添加到资源响应中：

```php
return (new UserCollection(User::all()->load('roles')))
                ->additional(['meta' => [
                    'key' => 'value',
                ]]);
```

## 资源响应

如你所读，资源可以直接从路由和控制器返回：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return new UserResource(User::findOrFail($id));
});
```

然而，有时你可能需要在发送给客户端之前自定义传出的 HTTP 响应。有两种方法可以做到这一点。首先，你可以链式调用资源上的 `response` 方法。这个方法将返回一个 `Illuminate\Http\JsonResponse` 实例，让你完全控制响应的头部：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user', function () {
    return (new UserResource(User::find(1)))
                ->response()
                ->header('X-Value', 'True');
});
```

或者，你可以在资源内部定义一个 `withResponse` 方法。当资源作为响应中的最外层资源返回时，将调用此方法：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
        ];
    }

    /**
     * 自定义资源的出站响应。
     */
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->header('X-Value', 'True');
    }
}
```
