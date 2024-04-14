---
title: Laravel Eloquent 关联关系
---

# Eloquent：关系

[[toc]]

## 简介

数据库表通常相互关联。例如，博客文章可能有很多评论，或者订单可能与下单的用户相关。Eloquent 让管理和使用这些关系变得容易，并支持多种常见的关系：

- [一对一](#one-to-one)
- [一对多](#one-to-many)
- [多对多](#many-to-many)
- [通过一对一](#has-one-through)
- [通过一对多](#has-many-through)
- [一对一 (多态)](#one-to-one-polymorphic-relations)
- [一对多 (多态)](#one-to-many-polymorphic-relations)
- [多对多 (多态)](#many-to-many-polymorphic-relations)

## 定义关联

Eloquent 关系是在 Eloquent 模型类中作为方法定义的。由于关系同时也是强大的查询构建器，将关系定义为方法可以提供强大的方法链和查询能力。例如，我们可以在这个 `posts` 关系上链式添加额外的查询约束：

```php
$user->posts()->where('active', 1)->get();
```

但在深入研究使用关系之前，让我们学习如何定义 Eloquent 所支持的每一种类型的关系。

### 一对一

一对一关系是数据库关系中的一种非常基础的类型。例如，一个 `User` 模型可能与一个 `Phone` 模型相关联。要定义这种关系，我们将在 `User` 模型上放置一个 `phone` 方法。`phone` 方法应该调用 `hasOne` 方法并返回其结果。 `hasOne` 方法通过模型的 `Illuminate\Database\Eloquent\Model` 基类提供给你的模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /**
     * 获取与用户关联的电话。
     */
    public function phone(): HasOne
    {
        return $this->hasOne(Phone::class);
    }
}
```

传递给 `hasOne` 方法的第一个参数是相关模型类的名称。一旦定义了关系，我们可以使用 Eloquent 的动态属性检索相关记录。动态属性允许您访问关系方法，就好像它们是在模型上定义的属性：

```php
$phone = User::find(1)->phone;
```

Eloquent 根据父模型名称确定关系的外键。在这种情况下，自动假设 `Phone` 模型有一个 `user_id` 外键。如果您希望覆盖此约定，您可以向 `hasOne` 方法传递第二个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key');
```

此外，Eloquent 假定外键应当有一个值与父模型的主键列匹配。换句话说，Eloquent 将寻找 `user_id` 列中用户 `id` 值的 `Phone` 记录。如果您希望关系使用 `id` 之外的主键值或您模型的 `$primaryKey` 属性，则可以向 `hasOne` 方法传递第三个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key', 'local_key');
```

#### 定义关系的反向

现在我们可以从 `User` 模型访问 `Phone` 模型。接下来，让我们在 `Phone` 模型上定义一个关系，让我们可以访问拥有该电话的用户。我们可以使用 `belongsTo` 方法定义 `hasOne` 关系的反向：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Phone extends Model
{
    /**
     * 获取拥有电话的用户。
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

当调用 `user` 方法时，Eloquent 将尝试找到一个 `User` 模型，该模型具有一个与 `Phone` 模型上的 `user_id` 列匹配的 `id`。

Eloquent 根据关系方法的名称确定外键名。所以在这种情况下，Eloquent 会认为 `Phone` 模型上的外键列是 `user_id`。然而，如果 `Phone` 模型上的外键不是 `user_id`，您可以向 `belongsTo` 方法传递一个自定义键名作为第二个参数：

```php
/**
 * 获取拥有电话的用户。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key');
}
```

如果父模型没有使用 `id` 作为其主键，或者您希望使用不同的列找到关联模型，您可以传递第三个参数给 `belongsTo` 方法，指定父表的自定义键：

```php
/**
 * 获取拥有电话的用户。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key', 'owner_key');
}
```

### 一对多

一对多关系用于定义单个模型作为一个或多个子模型的父模型的关系。例如，一篇博客文章可能有无数条评论。和所有其他 Eloquent 关系一样，通过在您的 Eloquent 模型上定义一个方法来定义一对多关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * 获取博客文章的评论。
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
```

请记住，顾名思义，Eloquent 将自动确定 `Comment` 模型的正确外键列。Eloquent 会取父模型的"蛇形命名"名称，并在其后加上 `_id`。所以，在这个例子中，Eloquent 会假设 `Comment` 模型上的外键列是 `post_id`。

定义了关系方法后，我们可以通过访问 `comments` 属性访问相关评论的集合。记住，由于 Eloquent 提供了“动态关系属性”，我们可以将关系方法访问为模型上定义的属性：

```php
use App\Models\Post;

$comments = Post::find(1)->comments;

foreach ($comments as $comment) {
    // ...
}
```

由于所有关系也作为查询构建器，您可以通过调用 `comments` 方法并继续在查询上链式条件来添加更多约束到关系查询中：

```php
$comment = Post::find(1)->comments()
                    ->where('title', 'foo')
                    ->first();
```

像 `hasOne` 方法一样，您也可以通过向 `hasMany` 方法传递额外的参数来覆盖外键和本地键：

```php
return $this->hasMany(Comment::class, 'foreign_key');

return $this->hasMany(Comment::class, 'foreign_key', 'local_key');
```

### 一对多（反向）/ 属于

现在我们可以访问所有文章的评论，让我们定义一个关系，允许一条评论访问它的父文章。要定义 `hasMany` 关系的反向，定义一个在子模型上调用 `belongsTo` 方法的关系方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    /**
     * 获取拥有评论的文章。
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

一旦定义了关系，我们可以通过访问 `post` “动态关系属性”检索评论的父文章：

```php
use App\Models\Comment;

$comment = Comment::find(1);

return $comment->post->title;
```

在上面的例子中，Eloquent 将尝试查找一个 `Post` 模型，其 `id` 与 `Comment` 模型上的 `post_id` 列相匹配。

Eloquent 通过检查关系方法的名称，并以方法名加上下划线和父模型的主键列名作为后缀来确定默认的外键名。所以，在这个例子中，Eloquent 将假设 `Post` 模型在 `comments` 表上的外键是 `post_id`。

然而，如果你的关系外键不遵循这些约定，你可以将一个自定义的外键名作为第二个参数传递给 `belongsTo` 方法：

```php
/**
 * Get the post that owns the comment.
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key');
}
```

如果你的父模型没有使用 `id` 作为其主键，或者你希望使用一个不同的列来找到关联模型，你可以传递一个第三个参数给 `belongsTo` 方法来指定父表的自定义键：

```php
/**
 * Get the post that owns the comment.
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key', 'owner_key');
}
```

#### 默认模型

`belongsTo`、`hasOne`、`hasOneThrough` 和 `morphOne` 关系允许你定义一个默认模型，如果给定的关系是 `null`，则返回该模型。这种模式通常被称为 [Null Object pattern](https://en.wikipedia.org/wiki/Null_Object_pattern) 并且可以帮助在代码中去除条件检查。在下面的例子中，如果 `Post` 模型没有关联到用户，则 `user` 关系将返回一个空的 `App\Models\User` 模型：

```php
/**
 * Get the author of the post.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault();
}
```

要用属性填充默认模型，你可以将一个数组或闭包传递给 `withDefault` 方法：

```php
/**
 * Get the author of the post.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Guest Author',
    ]);
}
```

```php
/**
 * Get the author of the post.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault(function (User $user, Post $post) {
        $user->name = 'Guest Author';
    });
}
```

#### 查询属于关系

当查询 "belongs to" 关系的子模型时，你可能需要手动构建 `where` 子句来检索相应的 Eloquent 模型：

```php
use App\Models\Post;

$posts = Post::where('user_id', $user->id)->get();
```

然而，你可能会发现使用 `whereBelongsTo` 方法更方便，这个方法会自动确定给定模型的适当关系和外键：

```php
$posts = Post::whereBelongsTo($user)->get();
```

你也可以向 `whereBelongsTo` 方法提供一个 [collection](/docs/11/eloquent/eloquent-collections) 实例。这样做时，Laravel 将检索属于集合内任意一个父模型的模型：

```php
$users = User::where('vip', true)->get();

$posts = Post::whereBelongsTo($users)->get();
```

默认情况下，Laravel 会根据模型的类名来确定与给定模型相关联的关系；然而，你可以通过将它作为第二个参数传递给 `whereBelongsTo` 方法来手动指定关系名称：

```php
$posts = Post::whereBelongsTo($user, 'author')->get();
```

### 一对多关系

有时一个模型可能有许多相关的模型，但你想要方便地检索关系中的 "最新" 或 "最老" 的相关模型。例如，一个 `User` 模型可能与许多 `Order` 模型相关，但你想定义一个便捷的方式来与用户下的最新订单进行交互。你可以使用 `hasOne` 关系类型结合 `ofMany` 方法来达成这一目的：

```php
/**
 * Get the user's most recent order.
 */
public function latestOrder(): HasOne
{
    return $this->hasOne(Order::class)->latestOfMany();
}
```

同样地，你可以定义一个方法来检索关系中的 "最老"，或第一个相关模型：

```php
/**
 * Get the user's oldest order.
 */
public function oldestOrder(): HasOne
{
    return $this->hasOne(Order::class)->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法会根据模型的主键（必须是可排序的）来检索最新或最老的相关模型。然而，有时你可能希望使用不同的排序标准从更大的关系中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户的最昂贵订单。`ofMany` 方法接受排序列作为其第一个参数以及在查询相关模型时要应用的聚合函数（`min` 或 `max`）：

```php
/**
 * Get the user's largest order.
 */
public function largestOrder(): HasOne
{
    return $this->hasOne(Order::class)->ofMany('price', 'max');
}
```

> [!WARNING]  
> 由于 PostgreSQL 不支持对 UUID 列执行 `MAX` 函数，因此目前无法与 PostgreSQL UUID 列结合使用 one-of-many 关系。

#### 转换 `一对多` 关系为 `一对一` 关系

通常，当使用 `latestOfMany`、`oldestOfMany` 或 `ofMany` 方法检索单个模型时，你已经为同一模型定义了一个 "has many" 关系。为方便起见，Laravel 允许你通过在关系上调用 `one` 方法，轻松地将此关系转换为 "has one" 关系：

```php
/**
 * Get the user's orders.
 */
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}

/**
 * Get the user's largest order.
 */
public function largestOrder(): HasOne
{
    return $this->orders()->one()->ofMany('price', 'max');
}
```

#### 高级 Has One of Many 关系

可以构造更高级的 "has one of many" 关系。例如，一个 `Product` 模型可能有许多相关的 `Price` 模型，即使在新定价发布后这些价格模型也仍然保留在系统中。此外，新的产品定价数据可以提前发布，以便在未来的某个日期通过 `published_at` 列生效。

因此，总结来说，我们需要检索最新发布的定价，其中发布日期不是未来的。此外，如果两个价格有相同的发布日期，我们将偏好 ID 更大的价格。为了实现这一点，我们必须传递一个数组给 `ofMany` 方法，该数组包含确定最新价格的可排序列。另外，一个闭包将作为 `ofMany` 方法的第二个参数提供。这个闭包将负责向关系查询中添加额外的发布日期约束：

```php
/**
 * Get the current pricing for the product.
 */
public function currentPricing(): HasOne
{
    return $this->hasOne(Price::class)->ofMany([
        'published_at' => 'max',
        'id' => 'max',
    ], function (Builder $query) {
        $query->where('published_at', '<', now());
    });
}
```

### 远程一对一

"has-one-through" 关系定义了与另一个模型的一对一关系。然而，这种关系指出声明模型可以匹配到另一个模型的一个实例，通过 _通过_ 第三个模型。

例如，在一个车辆修理店应用程序中，每个 `Mechanic` 模型可能与一个 `Car` 模型相关联，每个 `Car` 模型可能与一个 `Owner` 模型相关联。虽然技工与车主在数据库中没有直接关系，但技工可以 _通过_ `Car` 模型访问车主。让我们来看看定义这种关系所需的表结构：

```
mechanics
    id - integer
    name - string

cars
    id - integer
    model - string
    mechanic_id - integer

owners
    id - integer
    name - string
    car_id - integer
```

现在我们已经检查了关系的表结构，让我们在 `Mechanic` 模型上定义关系：

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Mechanic extends Model
{
    /**
     * Get the car's owner.
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(Owner::class, Car::class);
    }
}
```

传递给 `hasOneThrough` 方法的第一个参数是我们希望访问的最终模型的名称，第二个参数是中间模型的名称。

或者，如果相关关系已经在关系中的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称，流畅地定义一个 "has-one-through" 关系。例如，如果 `Mechanic` 模型有一个 `cars` 关系，并且 `Car` 模型有一个 `owner` 关系，你可以这样定义一个连接技工和车主的 "has-one-through" 关系：

```php
// 基于字符串的语法...
return $this->through('cars')->has('owner');

// 动态语法...
return $this->throughCars()->hasOwner();
```

#### 键名约定

执行关系查询时，将使用典型的 Eloquent 外键约定。如果你想自定义关系的键，你可以将它们作为第三个和第四个参数传递给 `hasOneThrough` 方法。第三个参数是中间模型上的外键名，第四个参数是最终模型上的外键名。第五个参数是本地键，第六个参数是中间模型的本地键：

```php
class Mechanic extends Model
{
    /**
     * Get the car's owner.
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(
            Owner::class,
            Car::class,
            'mechanic_id', // 在 cars 表上的外键...
            'car_id', // 在 owners 表上的外键...
            'id', // 在 mechanics 表上的本地键...
            'id' // 在 cars 表上的本地键...
        );
    }
}
```

或者，如前所述，如果相关的关系已经在所有涉及的模型上定义，你可以流畅地定义一个 "has-one-through" 关系，方法是调用 `through` 方法并提供这些关系的名称。这种方法的优势在于可以重用已经在现有关系上定义的键约定：

```php
// 基于字符串的语法...
return $this->through('cars')->has('owner');

// 动态语法...
return $this->throughCars()->hasOwner();
```

### 远程一对多

"has-many-through" 关系提供了通过中间关系访问远程关系的便捷方式。例如，假设我们正在构建一个类似于 [Laravel Vapor](https://vapor.laravel.com) 的部署平台。一个 `Project` 模型可能通过一个中间的 `Environment` 模型访问多个 `Deployment` 模型。使用这个例子，你可以很容易地为给定的项目收集所有部署。让我们来看看定义这种关系所需的表结构：

```
projects
    id - integer
    name - string

environments
    id - integer
    project_id - integer
    name - string

deployments
    id - integer
    environment_id - integer
    commit_hash - string
```

现在我们已经检查了关系的表结构，让我们在 `Project` 模型上定义关系：

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Project extends Model
{
    /**
     * Get all of the deployments for the project.
     */
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(Deployment::class, Environment::class);
    }
}
```

传递给 `hasManyThrough` 方法的第一个参数是我们希望访问的最终模型的名称，第二个参数是中间模型的名称。

或者，如果相关的关系已在所有涉及的模型上定义，你可以流畅地定义一个 "has-many-through" 关系，方法是调用 `through` 方法并提供这些关系的名称。例如，如果 `Project` 模型有一个 `environments` 关系，并且 `Environment` 模型有一个 `deployments` 关系，你可以这样定义连接项目和部署的 "has-many-through" 关系：

```php
// 基于字符串的语法...
return $this->through('environments')->has('deployments');

// 动态语法...
return $this->throughEnvironments()->hasDeployments();
```

尽管 `Deployment` 模型的表中不包含 `project_id` 列，但 `hasManyThrough` 关系通过 `$project->deployments` 提供了访问项目部署的方法。为了检索这些模型，Eloquent 会检查中间 `Environment` 模型表上的 `project_id` 列。找到相关的环境 ID 后，它们被用来查询 `Deployment` 模型表。

#### 键名约定

执行关系查询时，将使用典型的 Eloquent 外键约定。如果你想自定义关系的键，你可以将它们作为第三个和第四个参数传递给 `hasManyThrough` 方法。第三个参数是中间模型上的外键名，第四个参数是最终模型上的外键名。第五个参数是本地键，第六个参数是中间模型的本地键：

```php
class Project extends Model
{
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Deployment::class,
            Environment::class,
            'project_id', // 在 environments 表上的外键...
            'environment_id', // 在 deployments 表上的外键...
            'id', // 在 projects 表上的本地键...
            'id' // 在 environments 表上的本地键...
        );
    }
}
```

或者，如前所述，如果相关的关系已在所有涉及的模型上定义，你可以流畅地定义一个 "has-many-through" 关系，方法是调用 `through` 方法并提供这些关系的名称。这种方法的优势在于可以重用已经在现有关系上定义的键约定：

```php
// 基于字符串的语法...
return $this->through('environments')->has('deployments');

// 动态语法...
return $this->throughEnvironments()->hasDeployments();
```

## 多对多关系

多对多关系比 `hasOne` 和 `hasMany` 关系稍微复杂一些。多对多关系的一个例子是一个用户有多个角色，而这些角色也被应用中的其他用户共享。例如，一个用户可以被分配到 "作者" 和 "编辑" 角色；然而，这些角色也可以被分配给其他用户。所以，一个用户有多个角色，一个角色有多个用户。

#### 表结构

要定义这种关系，需要三张数据库表：`users`、`roles` 和 `role_user`。`role_user` 表是从相关模型名称的字母顺序得出的，并包含 `user_id` 和 `role_id` 列。这张表用作连接用户和角色的中间表。

记住，由于角色可以属于多个用户，我们不能在 `roles` 表上简单地放置一个 `user_id` 列。这意味着一个角色只能属于一个用户。为了支持角色被分配给多个用户，需要 `role_user` 表。我们可以这样总结关系的表结构：

```
users
    id - integer
    name - string

roles
    id - integer
    name - string

role_user
    user_id - integer
    role_id - integer
```

#### 模型结构

多对多关系是通过编写返回 `belongsToMany` 方法结果的方法来定义的。`belongsToMany` 方法由所有应用的 Eloquent 模型所使用的 `Illuminate\Database\Eloquent\Model` 基类提供。例如，让我们在我们的 `User` 模型上定义一个 `roles` 方法。传递给这个方法的第一个参数是相关模型类的名称：

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    /**
     * The roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
```

一旦定义了关系，你可以使用 `roles` 动态关系属性访问用户的角色：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    // ...
}
```

因为所有关系也可以作为查询构造器，你可以通过调用 `roles` 方法并继续在查询上链式调用条件来添加关系查询的进一步约束：

```php
$roles = User::find(1)->roles()->orderBy('name')->get();
```

为了确定关系中间表的表名，Eloquent 会按字母顺序连接两个相关模型的名称。然而，你可以自由地覆盖这个约定。你可以通过向 `belongsToMany` 方法传递第二个参数来实现这一点：

```php
return $this->belongsToMany(Role::class, 'role_user');
```

除了自定义中间表的名称，通过向 `belongsToMany` 方法传递额外的参数，你还可以自定义表上键的列名。第三个参数是你正在定义关系的模型的外键名，而第四个参数是你要连接的模型的外键名：

```php
return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
```

#### 定义关系的逆向

为了定义多对多关系的“逆向”，你应当在相关模型上定义一个也会返回 `belongsToMany` 方法结果的方法。来完成我们的用户/角色示例，让我们在 `Role` 模型上定义 `users` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * 属于该角色的用户。
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
```

如你所见，这个关系的定义与它在 `User` 模型上的定义几乎完全相同，不同之处在于引用了 `App\Models\User` 模型。由于我们重新使用了 `belongsToMany` 方法，定义“逆向”多对多关系时，所有通常的表和键自定义选项都是可用的。

### 检索中间表列

正如你已经学到的，处理多对多关系需要一个中间表的存在。Eloquent 提供了一些非常有用的方法来与这个表进行交互。例如，假设我们的 `User` 模型有很多它相关的 `Role` 模型。在访问了这个关系之后，我们可以使用模型上的 `pivot` 属性来访问中间表：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    echo $role->pivot->created_at;
}
```

注意，我们检索到的每个 `Role` 模型都自动被分配了一个 `pivot` 属性。这个属性包含了表示中间表的模型。

默认情况下，只有模型键会出现在 `pivot` 模型上。如果你的中间表包含了额外的属性，你必须在定义关系时指定它们：

```php
return $this->belongsToMany(Role::class)->withPivot('active', 'created_by');
```

如果你希望你的中间表有 `created_at` 和 `updated_at` 时间戳，并且这些时间戳由 Eloquent 自动维护，调用 `withTimestamps` 方法定义关系：

```php
return $this->belongsToMany(Role::class)->withTimestamps();
```

> [!WARNING]  
> 使用 Eloquent 自动维护的时间戳的中间表需要同时具有 `created_at` 和 `updated_at` 时间戳列。

#### 自定义 `pivot` 属性名

如前所述，中间表的属性可以通过 `pivot` 属性在模型上访问。然而，你可以自由地自定义这个属性的名称，以更好地反映它在你的应用程序中的作用。

例如，如果你的应用程序包含可以订阅播客的用户，你可能有用户和播客之间的多对多关系。如果是这样，你可能希望将中间表属性重命名为 `subscription` 而不是 `pivot`。在定义关系时，可以使用 `as` 方法来完成这个操作：

```php
return $this->belongsToMany(Podcast::class)
                ->as('subscription')
                ->withTimestamps();
```

一旦指定了自定义的中间表属性，你可以使用自定义的名称来访问中间表数据：

```php
$users = User::with('podcasts')->get();

foreach ($users->flatMap->podcasts as $podcast) {
    echo $podcast->subscription->created_at;
}
```

### 通过中间表列过滤查询

在定义关系时，你也可以使用 `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull` 和 `wherePivotNotNull` 方法过滤 `belongsToMany` 关系查询返回的结果：

```php
return $this->belongsToMany(Role::class)
                ->wherePivot('approved', 1);

return $this->belongsToMany(Role::class)
                ->wherePivotIn('priority', [1, 2]);

return $this->belongsToMany(Role::class)
                ->wherePivotNotIn('priority', [1, 2]);

return $this->belongsToMany(Podcast::class)
                ->as('subscriptions')
                ->wherePivotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);

return $this->belongsToMany(Podcast::class)
                ->as('subscriptions')
                ->wherePivotNotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);

return $this->belongsToMany(Podcast::class)
                ->as('subscriptions')
                ->wherePivotNull('expired_at');

return $this->belongsToMany(Podcast::class)
                ->as('subscriptions')
                ->wherePivotNotNull('expired_at');
```

### 通过中间表列排序查询

你可以使用 `orderByPivot` 方法排序 `belongsToMany` 关系查询返回的结果。在下面的例子中，我们将检索用户的所有最新勋章：

```php
return $this->belongsToMany(Badge::class)
                ->where('rank', 'gold')
                ->orderByPivot('created_at', 'desc');
```

### 定义自定义的中间表模型

如果你想定义一个自定义模型来表示你的多对多关系的中间表，你可以在定义关系时调用 `using` 方法。自定义的 pivot 模型为你提供了在 pivot 模型上定义额外行为的机会，例如方法和类型转换。

自定义的多对多 pivot 模型应该扩展 `Illuminate\Database\Eloquent\Relations\Pivot` 类，而自定义的多态多对多 pivot 模型应该扩展 `Illuminate\Database\Eloquent\Relations\MorphPivot` 类。例如，我们可以定义一个使用自定义 `RoleUser` pivot 模型的 `Role` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * 属于该角色的用户。
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->using(RoleUser::class);
    }
}
```

在定义 `RoleUser` 模型时，你应当扩展 `Illuminate\Database\Eloquent\Relations\Pivot` 类：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
{
    // ...
}
```

> [!WARNING]  
> Pivot 模型不能使用 `SoftDeletes` trait。如果你需要软删除 pivot 记录，考虑将你的 pivot 模型转换为实际的 Eloquent 模型。

#### 自定义 Pivot 模型和自增 ID

如果你定义了使用自定义 pivot 模型的多对多关系，并且该 pivot 模型有一个自增主键，你应该确保你的自定义 pivot 模型类定义了一个设置为 `true` 的 `incrementing` 属性。

```php
/**
 * 指示 ID 是否自动增长。
 *
 * @var bool
 */
public $incrementing = true;
```

## 多态关系

多态关系允许子模型通过单一关联属于多种类型的模型。例如，假设你正在构建一个应用程序，允许用户分享博客帖子和视频。在这样的应用程序中，`Comment` 模型可能属于 `Post` 和 `Video` 模型。

### 一对一（多态）

#### 表结构

一对一多态关系类似于典型的一对一关系；然而，子模型可以使用单一关联属于多于一种类型的模型。例如，一个博客 `Post` 和一个 `User` 可能与一个 `Image` 模型共享多态关系。使用一对一多态关系允许你有一个唯一图像的单一表格，这些图像可能与帖子和用户相关联。首先，让我们看看构建这种关系所需的表结构：

```php
posts
    id - integer
    name - string

users
    id - integer
    name - string

images
    id - integer
    url - string
    imageable_id - integer
    imageable_type - string
```

注意 `images` 表上的 `imageable_id` 和 `imageable_type` 列。`imageable_id` 列将包含帖子或用户的 ID 值，而 `imageable_type` 列将包含父模型的类名。Eloquent 使用 `imageable_type` 列来确定访问 `imageable` 关系时返回哪种类型的父模型。在这种情况下，该列将包含 `App\Models\Post` 或 `App\Models\User`。

#### 模型结构

接下来，让我们检查构建这一关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Image extends Model
{
    /**
     * 获取父级可被图像化的模型（用户或帖子）。
     */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Post extends Model
{
    /**
     * 获取帖子的图像。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class User extends Model
{
    /**
     * 获取用户的图像。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

#### 检索关系

一旦您的数据库表和模型定义完毕，您就可以通过模型访问关系。例如，要检索帖子的图像，我们可以访问 `image` 动态关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

$image = $post->image;
```

您可以通过访问执行 `morphTo` 调用的方法的名称来检索多态模型的父级。在这种情况下，就是 `Image` 模型上的 `imageable` 方法。因此，我们将使用该方法作为动态关系属性访问：

```php
use App\Models\Image;

$image = Image::find(1);

$imageable = $image->imageable;
```

`Image` 模型上的 `imageable` 关系将根据拥有图像的模型类型，返回 `Post` 或 `User` 实例。

#### 键名约定

如有必要，您可以指定您的多态子模型所使用的 "id" 和 "type" 列的名称。如果您这么做，请确保始终将关系名称作为第一个参数传递给 `morphTo` 方法。通常，此值应与方法名称相匹配，因此您可以使用 PHP 的 `__FUNCTION__` 常量：

```php
/**
 * 获取图片所属的模型。
 */
public function imageable(): MorphTo
{
    return $this->morphTo(__FUNCTION__, 'imageable_type', 'imageable_id');
}
```

### 一对多（多态）

#### 表结构

一对多的多态关系与典型的一对多关系类似；然而，子模型可以属于使用单一关联的多种类型的模型。例如，假设您的应用程序允许用户对帖子和视频进行 "评论"。使用多态关系，您可以使用单一的 `comments` 表来包含帖子和视频的评论。首先，让我们检查构建此关系所需的表结构：

```php
posts
    id - integer
    title - string
    body - text

videos
    id - integer
    title - string
    url - string

comments
    id - integer
    body - text
    commentable_id - integer
    commentable_type - string
```

#### 模型结构

接下来，让我们检查构建这一关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Comment extends Model
{
    /**
     * 获取父级可评论的模型（帖子或视频）。
     */
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    /**
     * 获取帖子的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Video extends Model
{
    /**
     * 获取视频的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

#### 检索关系

一旦您的数据库表和模型定义完毕，您就可以通过模型的动态关系属性访问关系。例如，要访问某个帖子的所有评论，我们可以使用 `comments` 动态属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->comments as $comment) {
    // ...
}
```

您还可以通过访问执行 `morphTo` 调用的方法名称来检索多态子模型的父模型。在这种情况下，就是 `Comment` 模型上的 `commentable` 方法。因此，我们将使用该方法作为动态关系属性访问，以此来访问评论的父模型：

```php
use App\Models\Comment;

$comment = Comment::find(1);

$commentable = $comment->commentable;
```

#### 模型结构

接下来，我们来看一下构建这种关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Image extends Model
{
    /**
     * 获取 imageable 模型（用户或帖子）的父模型。
     */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Post extends Model
{
    /**
     * 获取帖子的图片。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class User extends Model
{
    /**
     * 获取用户的图片。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

#### 获取关系

一旦定义了数据库表和模型，就可以通过模型访问关系。例如，要获取一篇帖子的图片，我们可以访问 `image` 动态关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

$image = $post->image;
```

您可以通过访问执行 `morphTo` 调用的方法名称来检索多态模型的父模型。在这个例子中，就是 `Image` 模型上的 `imageable` 方法。因此，我们将作为动态关系属性访问该方法：

```php
use App\Models\Image;

$image = Image::find(1);

$imageable = $image->imageable;
```

`Image` 模型上的 `imageable` 关系将返回 `Post` 或 `User` 实例，具体取决于哪种类型的模型拥有该图片。

#### 关键习惯用法

如果需要，您可以指定多态子模型使用的“id”和“type”列的名称。如果这样做，请确保始终将关系名称作为第一个参数传递给 `morphTo` 方法。通常，这个值应该与方法名匹配，因此您可以使用 PHP 的 `__FUNCTION__` 常量：

```php
/**
 * 获取图片所属的模型。
 */
public function imageable(): MorphTo
{
    return $this->morphTo(__FUNCTION__, 'imageable_type', 'imageable_id');
}
```

### 一对多（多态）

#### 表结构

一对多多态关系与典型的一对多关系类似；但是，子模型可以使用单个关联属于多种类型的模型。例如，假设应用程序的用户可以对帖子和视频进行“评论”。使用多态关系，您可以使用单个 `comments` 表来包含帖子和视频的评论。首先，让我们来看一下建立这种关系所需的表结构：

```
posts
    id - integer
    title - string
    body - text

videos
    id - integer
    title - string
    url - string

comments
    id - integer
    body - text
    commentable_id - integer
    commentable_type - string
```

#### 模型结构

接下来，我们来看一下构建这种关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Comment extends Model
{
    /**
     * 获取 commentable 的父模型（帖子或视频）。
     */
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    /**
     * 获取帖子的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Video extends Model
{
    /**
     * 获取视频的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

#### 获取关系

一旦定义了数据库表和模型，就可以通过模型的动态关系属性来访问关系。例如，要访问一篇帖子的所有评论，我们可以使用 `comments` 动态属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->comments as $comment) {
    // ...
}
```

您还可以通过访问执行 `morphTo` 调用的方法名称来检索多态子模型的父模型。在这种情况下，就是 `Comment` 模型上的 `commentable` 方法。因此，我们将作为动态关系属性访问该方法：

```php
use App\Models\Comment;

$comment = Comment::find(1);

$commentable = $comment->commentable;
```

`Comment` 模型上的 `commentable` 关系将返回 `Post` 或 `Video` 实例，具体取决于评论的父模型是哪种类型。

### 多中的一（多态）

有时，一个模型可能有很多相关的模型，但您想要轻松检索关系中的“最新”或“最早”的相关模型。例如，一个 `User` 模型可能与许多 `Image` 模型相关联，但您想定义一种方便的方法来与用户上传的最新图片进行交互。您可以使用 `morphOne` 关系类型结合 `ofMany` 方法来实现这一点：

```php
/**
 * 获取用户最新上传的图片。
 */
public function latestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->latestOfMany();
}
```

同样，您可以定义一个方法来检索关系中的“最早”或第一个相关模型：

```php
/**
 * 获取用户最早上传的图片。
 */
public function oldestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法将根据模型的主键检索最新或最早的相关模型，该主键必须是可排序的。但有时您可能希望使用不同的排序标准从更大的关系中检索单个模型。

例如，使用 `ofMany` 方法，您可以检索用户最受“喜欢”的图片。`ofMany` 方法接受可排序列作为其第一个参数，以及查询相关模型时应用的哪个聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户最受欢迎的图片。
 */
public function bestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->ofMany('likes', 'max');
}
```

> [!Note]  
> 可以构建更高级的“多中的一”关系。有关更多信息，请查阅 has one of many 文档。

### 多对多（多态）

#### 表结构

多对多多态关系比“morph one”和“morph many”关系稍微复杂些。例如，`Post`模型和`Video`模型都可以与`Tag`模型有一个多态关系。在这种情况下，使用多对多多态关系将允许您的应用程序有一个唯一标签的单表，这些标签可以与帖子或视频关联。首先，让我们检查构建这种关系所需的表结构：

```
posts
    id - integer
    name - string

videos
    id - integer
    name - string

tags
    id - integer
    name - string

taggables
    tag_id - integer
    taggable_id - integer
    taggable_type - string
```

> [!NOTE]  
> 在深入了解多对多多态关系之前，您可能会从阅读有关典型[多对多关系](#many-to-many)的文档中受益。

#### 模型结构

接下来，我们准备在模型上定义关系。`Post`和`Video`模型都将包含一个调用基本 Eloquent 模型类提供的`morphToMany`方法的`tags`方法。

`morphToMany`方法接受相关模型的名称以及“关系名称”。基于我们为中间表名称及其包含的键指定的名称，我们将关系称为“taggable”：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Post extends Model
{
    /**
     * 获取帖子的所有标签。
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

#### 定义关系的逆向

接下来，在`Tag`模型上，您应该为它的每个可能的父模型定义一个方法。因此，在这个例子中，我们将定义一个`posts`方法和一个`videos`方法。这些方法都应该返回`morphedByMany`方法的结果。

`morphedByMany`方法接受相关模型的名称以及“关系名称”。基于我们为中间表名称及其包含的键指定的名称，我们将关系称为“taggable”：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    /**
     * 获取分配了这个标签的所有帖子。
     */
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    /**
     * 获取分配了这个标签的所有视频。
     */
    public function videos(): MorphToMany
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}
```

#### 检索关系

一旦定义了数据库表和模型，您就可以通过模型访问关系。例如，要访问帖子的所有标签，您可以使用`tags`动态关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->tags as $tag) {
    // ...
}
```

您可以通过访问执行调用`morphedByMany`方法的方法的名称，从多态子模型中检索多态关系的父模型。在这种情况下，就是`Tag`模型上的`posts`或`videos`方法：

```php
use App\Models\Tag;

$tag = Tag::find(1);

foreach ($tag->posts as $post) {
    // ...
}

foreach ($tag->videos as $video) {
    // ...
}
```

### 自定义多态类型

默认情况下，Laravel 将使用完全限定类名来存储相关模型的“类型”。例如，考虑到上面的一对多关系示例，其中`Comment`模型可以属于`Post`或`Video`模型，`commentable_type`的默认值将分别是`App\Models\Post`或`App\Models\Video`。然而，您可能希望将这些值与应用程序的内部结构解耦。

例如，我们可以使用简单的字符串，如`post`和`video`，而不是使用模型名称作为“类型”。如此一来，即使模型重命名，我们数据库中的多态“类型”列值也将保持有效：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);
```

您可以在您的`App\Providers\AppServiceProvider`类的`boot`方法中调用`enforceMorphMap`方法，或者如果您愿意，可以创建一个单独的服务提供者。

您可以使用模型的`getMorphClass`方法在运行时确定给定模型的 morph 别名。反过来，您可以使用`Relation::getMorphedModel`方法确定与 morph 别名相关的完全限定类名：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

$alias = $post->getMorphClass();

$class = Relation::getMorphedModel($alias);
```

> [!WARNING]  
> 当在现有应用程序中添加“morph 映射”时，数据库中仍包含完全限定类的每个多态\*type 字段值都需要转换为其“映射”名称。

### 动态关系

您可以使用`resolveRelationUsing`方法在运行时定义 Eloquent 模型之间的关系。虽然通常不推荐在正常应用程序开发中使用，但在开发 Laravel 包时偶尔可能会有所帮助。

`resolveRelationUsing`方法接受所需关系名称作为其第一个参数。传递给方法的第二个参数应该是一个闭包，它接受模型实例并返回一个有效的 Eloquent 关系定义。通常，您应该在[服务提供者](/docs/11/architecture-concepts/providers)的 boot 方法中配置动态关系：

```php
use App\Models\Order;
use App\Models\Customer;

Order::resolveRelationUsing('customer', function (Order $orderModel) {
    return $orderModel->belongsTo(Customer::class, 'customer_id');
});
```

> [!WARNING]  
> 在定义动态关系时，始终为 Eloquent 关系方法提供明确的键名参数。

## 查询关系

由于所有的 Eloquent 关系都是通过方法定义的，你可以调用这些方法来获取关系的一个实例，而无需实际执行查询来加载相关模型。此外，所有类型的 Eloquent 关系也可以作为[查询构造器](/docs/11/database/queries)，允许您在最终对数据库执行 SQL 查询之前继续将限制条件串联到关系查询上。

例如，想象一个博客应用程序，其中`User`模型有许多关联的`Post`模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * 获取用户的所有帖子。
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

您可以查询`posts`关系并添加额外的约束到关系中，如下所示：

```php
use App\Models\User;

$user = User::find(1);

$user->posts()->where('active', 1)->get();
```

你可以在关系上使用 Laravel 的任何 [查询构建器](/docs/11/database/queries) 方法，所以请确保查看查询构建器文档，了解所有可用的方法。

#### 在关系后链式添加 `orWhere` 子句

如上例所示，查询它们时你可以自由地为关系添加额外的约束。然而，当在关系上链式添加 `orWhere` 子句时请小心，因为 `orWhere` 子句会被逻辑分组到与关系约束相同的级别：

```php
$user->posts()
        ->where('active', 1)
        ->orWhere('votes', '>=', 100)
        ->get();
```

上面的例子将生成以下 SQL。如你所见，`or` 子句指示查询返回任何投票数大于 100 的帖子。查询不再限制于特定用户：

```sql
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

在大多数情况下，你应该使用 [逻辑组](/docs/11/database/queries#logical-grouping) 将条件检查分组到括号中：

```php
use Illuminate\Database\Eloquent\Builder;

$user->posts()
        ->where(function (Builder $query) {
            return $query->where('active', 1)
                         ->orWhere('votes', '>=', 100);
        })
        ->get();
```

上面的例子将产生以下 SQL。请注意，逻辑组正确地分组了约束，查询仍然限制于特定用户：

```sql
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

### 关系方法与动态属性

如果你不需要向 Eloquent 关系查询添加额外的约束，你可以像访问属性一样访问关系。例如，继续使用我们的 `User` 和 `Post` 示例模型，我们可以这样访问用户的所有帖子：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->posts as $post) {
    // ...
}
```

动态关系属性执行“延迟加载”，意味着只有在你实际访问它们时才会加载其关系数据。因此，开发人员通常使用 [预加载](#eager-loading) 来预加载他们知道在加载模型后会访问的关系。预加载在必须执行的 SQL 查询中提供了显著的减少，以加载模型的关系。

### 查询关系存在

当检索模型记录时，你可能希望根据关系的存在限制你的结果。例如，想象你想检索所有至少有一个评论的博客帖子。为此，你可以将关系的名称传递给 `has` 和 `orHas` 方法：

```php
use App\Models\Post;

// 检索所有至少有一个评论的帖子...
$posts = Post::has('comments')->get();
```

你还可以指定操作符和计数值来进一步自定义查询：

```php
// 检索所有至少有三个评论的帖子...
$posts = Post::has('comments', '>=', 3)->get();
```

可以使用“点”表示法构造嵌套的 `has` 语句。例如，你可以检索所有至少有一个具有至少一张图片的评论的帖子：

```php
// 检索至少有一个含有图片的评论的帖子...
$posts = Post::has('comments.images')->get();
```

如果你需要更强大的功能，你可以使用 `whereHas` 和 `orWhereHas` 方法在 `has` 查询上定义额外的查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

// 检索至少有一个含有类似 code% 词汇的评论的帖子...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();

// 检索至少有十个含有类似 code% 词汇的评论的帖子...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
}, '>=', 10)->get();
```

> [!WARNING]
> Eloquent 目前不支持跨数据库查询关系存在。关系必须存在于同一个数据库中。

#### 内嵌关系存在查询

如果你希望通过单个简单的 where 条件查询关系的存在，你可能会发现使用 `whereRelation`、`orWhereRelation`、`whereMorphRelation` 和 `orWhereMorphRelation` 方法更为方便。例如，我们可以查询所有有未批准评论的帖子：

```php
use App\Models\Post;

$posts = Post::whereRelation('comments', 'is_approved', false)->get();
```

当然，像调用查询构建器的 `where` 方法一样，你也可以指定一个操作符：

```php
$posts = Post::whereRelation(
    'comments', 'created_at', '>=', now()->subHour()
)->get();
```

### 查询关系缺失

当检索模型记录时，你可能希望根据关系的缺失限制你的结果。例如，想象你想检索所有**没有**任何评论的博客帖子。为此，你可以将关系的名称传递给 `doesntHave` 和 `orDoesntHave` 方法：

```php
use App\Models\Post;

$posts = Post::doesntHave('comments')->get();
```

如果你需要更强大的功能，你可以使用 `whereDoesntHave` 和 `orWhereDoesntHave` 方法在 `doesntHave` 查询上添加额外的查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();
```

你可以使用“点”表示法对嵌套关系执行查询。例如，以下查询将检索所有没有评论的帖子；然而，帖子如果有未被禁止的作者的评论将包括在结果中：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments.author', function (Builder $query) {
    $query->where('banned', 0);
})->get();
```

### 查询 Morph To 关系

要查询“morph to”关系的存在，你可以使用 `whereHasMorph` 和 `whereDoesntHaveMorph` 方法。这些方法接受关系的名称作为它们的第一个参数。接下来，方法接受你希望包含在查询中的相关模型的名称。最后，你可以提供一个自定义关系查询的闭包：

```php
use App\Models\Comment;
use App\Models\Post;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;

// 检索与帖子或视频关联的评论，标题类似 code%...
$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();

// 检索与帖子关联的评论，标题不类似 code%...
$comments = Comment::whereDoesntHaveMorph(
    'commentable',
    Post::class,
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();
```

你偶尔可能需要根据相关多态模型的“类型”添加查询约束。传递给 `whereHasMorph` 方法的闭包可能会接收到一个 `$type` 值作为它的第二个参数。这个参数允许你检查正在构建的查询的“类型”：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query, string $type) {
        $column = $type === Post::class ? 'content' : 'title';

        $query->where($column, 'like', 'code%');
    }
)->get();
```

#### 查询所有 Morph To 相关模型

而不是传递一组可能的多态模型，你可以提供 `*` 作为通配符值。这将指示 Laravel 从数据库检索所有可能的多态类型。Laravel 将执行额外的查询以执行此操作：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph('commentable', '*', function (Builder $query) {
    $query->where('title', 'like', 'foo%');
})->get();
```

## 聚合关联模型

### 计数关联模型

有时你可能想要计算给定关系的相关模型数量，而不实际加载模型。为此，你可以使用 `withCount` 方法。`withCount` 方法将在结果模型上放置一个 `{relation}_count` 属性：

```php
use App\Models\Post;

$posts = Post::withCount('comments')->get();

foreach ($posts as $post) {
    echo $post->comments_count;
}
```

通过向 `withCount` 方法传递一个数组，你可以添加多个关系的“计数”，以及为查询添加额外的约束：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount(['votes', 'comments' => function (Builder $query) {
    $query->where('content', 'like', 'code%');
}])->get();

echo $posts[0]->votes_count;
echo $posts[0]->comments_count;
```

你还可以为关系计数结果指定别名，允许对同一关系进行多次计数：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount([
    'comments',
    'comments as pending_comments_count' => function (Builder $query) {
        $query->where('approved', false);
    },
])->get();

echo $posts[0]->comments_count;
echo $posts[0]->pending_comments_count;
```

#### 延迟计数加载

使用 `loadCount` 方法，你可以在父模型已被检索后加载关系计数：

```php
$book = Book::first();

$book->loadCount('genres');
```

如果你需要在计数查询上设置额外的查询约束，你可以传递一个由你希望计数的关系键入的数组。数组值应该是接收查询构建器实例的闭包：

```php
$book->loadCount(['reviews' => function (Builder $query) {
    $query->where('rating', 5);
}])
```

#### 关系计数和自定义选择语句

如果你正在将 `withCount` 与 `select` 语句结合使用，请确保在 `select` 方法后调用 `withCount`：

```php
$posts = Post::select(['title', 'body'])
                ->withCount('comments')
                ->get();
```

### 其他聚合功能

除了 `withCount` 方法，Eloquent 还提供了 `withMin`、`withMax`、`withAvg`、`withSum` 和 `withExists` 方法。这些方法将在你的结果模型上放置一个 `{relation}_{function}_{column}` 属性：

```php
use App\Models\Post;

$posts = Post::withSum('comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->comments_sum_votes;
}
```

如果你希望使用另一个名称访问聚合函数的结果，你可以指定自己的别名：

```php
$posts = Post::withSum('comments as total_comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->total_comments;
}
```

像 `loadCount` 方法一样，这些方法的延迟版本也可用。这些额外的聚合操作可以对已经检索的 Eloquent 模型执行：

```php
$post = Post::first();

$post->loadSum('comments', 'votes');
```

如果你正在将这些聚合方法与 `select` 语句结合使用，请确保在 `select` 方法后调用聚合方法：

```php
$posts = Post::select(['title', 'body'])
                ->withExists('comments')
                ->get();
```

### 在 Morph To 关系上计数关联模型

如果你想要预加载“morph to”关系，以及为可能返回的各种实体关系计数，你可以使用 `with` 方法与 `morphTo` 关系的 `morphWithCount` 方法结合使用。

在这个示例中，让我们假设 `Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。我们将假设 `ActivityFeed` 模型定义了一个名为 `parentable` 的“morph to”关系，该关系允许我们检索给定 `ActivityFeed` 实例的父 `Photo` 或 `Post` 模型。此外，让我们假设 `Photo` 模型“有多个”`Tag` 模型和 `Post` 模型“有多个”`Comment` 模型。

现在，让我们想象我们想要检索 `ActivityFeed` 实例并为每个 `ActivityFeed` 实例预加载 `parentable` 父模型。此外，我们想要检索与每个父照片关联的标签数量和与每个父帖子关联的评论数量：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$activities = ActivityFeed::with([
    'parentable' => function (MorphTo $morphTo) {
        $morphTo->morphWithCount([
            Photo::class => ['tags'],
            Post::class => ['comments'],
        ]);
    }])->get();
```

#### Morph To 的延迟计数加载

假设我们已经检索了一组 `ActivityFeed` 模型，现在我们想要为与活动提要关联的各种 `parentable` 模型加载嵌套关系计数。你可以使用 `loadMorphCount` 方法来完成这个操作：

```php
$activities = ActivityFeed::with('parentable')->get();

$activities->loadMorphCount('parentable', [
    Photo::class => ['tags'],
    Post::class => ['comments'],
]);
```

## 预加载

当作为属性访问 Eloquent 关系时，相关模型是“延迟加载”的。这意味着关系数据实际上在你首次访问属性时才加载。然而，Eloquent 可以在查询父模型时“预加载”关系。预加载缓解了“N + 1”查询问题。为了说明 N + 1 查询问题，考虑一个 `Book` 模型“属于”一个 `Author` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * 获取写这本书的作者。
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }
}
```

现在，让我们检索所有书籍及其作者：

```php
use App\Models\Book;

$books = Book::all();

foreach ($books as $book) {
    echo $book->author->name;
}
```

这个循环将执行一个查询来检索数据库表中的所有书籍，然后对每本书执行另一个查询以检索该书的作者。因此，如果我们有 25 本书，上面的代码将运行 26 个查询：一个用于原始的书，以及额外的 25 个查询来检索每本书的作者。

幸运的是，我们可以使用预加载将此操作减少到仅两个查询。在构建查询时，你可以使用 `with` 方法指定应该预加载哪些关系：

```php
$books = Book::with('author')->get();

foreach ($books as $book) {
    echo $book->author->name;
}
```

对于此操作，只会执行两个查询 - 一个查询来检索所有书籍和一个查询来检索所有书籍的作者：

```sql
select * from books

select * from authors where id in (1, 2, 3, 4, 5, ...)
```

#### 预加载多个关联

有时你可能需要预加载几个不同的关联。要做到这一点，只需向 `with` 方法传递一个关联数组即可：

```php
$books = Book::with(['author', 'publisher'])->get();
```

#### 嵌套预加载

要预加载关联的关联，你可以使用“点”语法。例如，让我们预加载所有书的作者以及所有作者的个人联系方式：

```php
$books = Book::with('author.contacts')->get();
```

或者，你可以通过向 `with` 方法提供一个嵌套数组来指定嵌套预加载关系，这在预加载多个嵌套关系时非常方便：

```php
$books = Book::with([
    'author' => [
        'contacts',
        'publisher',
    ],
])->get();
```

#### 嵌套预加载 `morphTo` 关联

如果你想预加载一个 `morphTo` 关联，以及可能被该关联返回的各种实体上的嵌套关联，你可以结合使用 `with` 方法和 `morphTo` 关联的 `morphWith` 方法。为了帮助说明这个方法，让我们考虑以下模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * 获取活动订阅记录的父类。
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在这个例子中，让我们假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。另外，让我们假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，以及 `Post` 模型属于 `Author` 模型。

使用这些模型定义和关系，我们可以检索 `ActivityFeed` 模型实例并预加载所有 `parentable` 模型及其各自的嵌套关系：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$activities = ActivityFeed::query()
    ->with(['parentable' => function (MorphTo $morphTo) {
        $morphTo->morphWith([
            Event::class => ['calendar'],
            Photo::class => ['tags'],
            Post::class => ['author'],
        ]);
    }])->get();
```

#### 预加载特定列

你可能并不总是需要从你正在检索的关联中获取每一列。因此，Eloquent 允许你指定你想检索的关联列：

```php
$books = Book::with('author:id,name,book_id')->get();
```

> [!WARNING]  
> 使用此功能时，你应该始终包含 `id` 列和列表中任何相关的外键列，你希望检索。

#### 默认预加载

有时你可能想在检索模型时总是加载一些关系。为此，你可以在模型上定义一个 `$with` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * 应该始终被加载的关系。
     *
     * @var array
     */
    protected $with = ['author'];

    /**
     * 获取编写书籍的作者。
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * 获取书籍的类型。
     */
    public function genre(): BelongsTo
    {
        return $this->belongsTo(Genre::class);
    }
}
```

如果你想要为单个查询从 `$with` 属性中移除一个项，你可以使用 `without` 方法：

```php
$books = Book::without('author')->get();
```

如果你想要为单个查询覆盖 `$with` 属性中的所有项，你可以使用 `withOnly` 方法：

```php
$books = Book::withOnly('genre')->get();
```

#### 限制预加载

有时你可能希望预加载一个关系，但同时为预加载查询指定额外的查询条件。你可以通过将关系作为数组传递给 `with` 方法来实现这一点，数组键是关系名称，数组值是一个闭包，该闭包为预加载查询添加额外的限制：

```php
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;

$users = User::with(['posts' => function (Builder $query) {
    $query->where('title', 'like', '%code%');
}])->get();
```

在这个例子中，Eloquent 只会预加载标题列中包含单词“code”的帖子。你可以调用其他 [查询构造器](/docs/11/database/queries) 方法以进一步定制预加载操作：

```php
$users = User::with(['posts' => function (Builder $query) {
    $query->orderBy('created_at', 'desc');
}])->get();
```

#### 限制 `morphTo` 关系的预加载

如果你正在预加载一个 `morphTo` 关系，Eloquent 将运行多个查询来获取每种类型的相关模型。你可以使用 `MorphTo` 关系的 `constrain` 方法给每个这些查询添加额外的约束：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$comments = Comment::with(['commentable' => function (MorphTo $morphTo) {
    $morphTo->constrain([
        Post::class => function ($query) {
            $query->whereNull('hidden_at');
        },
        Video::class => function ($query) {
            $query->where('type', 'educational');
        },
    ]);
}])->get();
```

#### 使用关系存在性限制预加载

有时你可能会发现自己需要在同时基于相同条件加载关系的同时检查关系的存在性。例如，你可能希望只检索有符合给定查询条件的子 `Post` 模型的 `User` 模型，同时也实现预加载匹配的帖子。你可以使用 `withWhereHas` 方法来实现这一点：

```php
use App\Models\User;

$users = User::withWhereHas('posts', function ($query) {
    $query->where('featured', true);
})->get();
```

#### 懒惰预加载（Lazy Eager Loading）

有时在已经检索到父模型后，你可能需要预加载关系。例如，这在你需要动态决定是否加载相关模型时很有用：

```php
use App\Models\Book;

$books = Book::all();

if ($someCondition) {
    $books->load('author', 'publisher');
}
```

如果您需要在急切加载（eager loading）查询中设置其他查询约束，则可以传递一个以您希望加载的关系为键的数组。数组的值应该是接收查询实例的闭包实例：

```php
$author->load(['books' => function (Builder $query) {
    $query->orderBy('published_date', 'asc');
}]);
```

如果只在关系尚未加载时才加载关系，请使用 `loadMissing` 方法：

```php
$book->loadMissing('author');
```

#### 嵌套惰性急切加载和 `morphTo`

如果您想要急切加载一个 `morphTo` 关系以及可能由该关系返回的各种实体的嵌套关系，您可以使用 `loadMorph` 方法。

这个方法接受 `morphTo` 关系的名称作为其第一个参数，以及一个模型/关系对的数组作为其第二个参数。为了帮助说明这个方法，让我们考虑以下模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * 获取活动记录的上级。
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在这个例子中，让我们假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，假设 `Event` 模型属于一个 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，而 `Post` 模型属于一个 `Author` 模型。

使用这些模型定义和关系，我们可以检索 `ActivityFeed` 模型实例并急切加载所有的 `parentable` 模型及其各自的嵌套关系：

```php
$activities = ActivityFeed::with('parentable')
    ->get()
    ->loadMorph('parentable', [
        Event::class => ['calendar'],
        Photo::class => ['tags'],
        Post::class => ['author'],
    ]);
```

### 阻止惰性加载

如之前所讨论的，急切加载关系通常可以为您的应用程序提供显著的性能优势。因此，如果您愿意，可以指示 Laravel 始终阻止关系的惰性加载。为此，您可以调用基础 Eloquent 模型类提供的 `preventLazyLoading` 方法。通常情况下，您应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用此方法。

`preventLazyLoading` 方法接受一个可选的布尔参数，该参数表示是否应防止惰性加载。例如，你可能希望仅在非生产环境中禁用惰性加载，这样即使生产代码中偶然存在惰性加载的关系，您的生产环境也会正常运行：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

在防止惰性加载之后，当您的应用程序尝试惰性加载任何 Eloquent 关系时，Eloquent 将抛出 `Illuminate\Database\LazyLoadingViolationException` 异常。

您可以使用 `handleLazyLoadingViolationsUsing` 方法自定义惰性加载违规的行为。例如，您可以使用此方法指示惰性加载违规仅被记录，而不是中断应用程序执行抛出异常：

```php
Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
    $class = $model::class;

    info("Attempted to lazy load [{$relation}] on model [{$class}].");
});
```

## 插入和更新相关模型

### `save` 方法

Eloquent 提供了方便的方法，可将新模型添加到关系中。例如，您可能需要向帖子中添加新评论。您可以使用关系的 `save` 方法插入评论，而不是手动设置 `Comment` 模型上的 `post_id` 属性：

```php
use App\Models\Comment;
use App\Models\Post;

$comment = new Comment(['message' => 'A new comment.']);

$post = Post::find(1);

$post->comments()->save($comment);
```

请注意，我们没有将 `comments` 关系作为动态属性来访问。相反，我们调用了 `comments` 方法来获得关系的实例。`save` 方法将自动向新的 `Comment` 模型添加适当的 `post_id` 值。

如果您需要保存多个相关模型，您可以使用 `saveMany` 方法：

```php
$post = Post::find(1);

$post->comments()->saveMany([
    new Comment(['message' => 'A new comment.']),
    new Comment(['message' => 'Another new comment.']),
]);
```

`save` 和 `saveMany` 方法将保存给定的模型实例，但不会将新保存的模型添加到已经加载到父模型上的任何内存中的关系。如果您打算在使用 `save` 或 `saveMany` 方法之后访问关系，您可能希望使用 `refresh` 方法重新加载模型及其关系：

```php
$post->comments()->save($comment);

$post->refresh();

// 包括新保存的评论在内的所有评论...
$post->comments;
```

#### 递归保存模型及其关系

如果您想要 `save` 您的模型及其所有关联的关系，您可以使用 `push` 方法。在这个例子中，`Post` 模型将被保存，其评论和评论的作者也会被保存：

```php
$post = Post::find(1);

$post->comments[0]->message = 'Message';
$post->comments[0]->author->name = 'Author Name';

$post->push();
```

`pushQuietly` 方法可用于保存模型及其关联关系而不引发任何事件：

```php
$post->pushQuietly();
```

### `create` 方法

除了 `save` 和 `saveMany` 方法之外，您还可以使用 `create` 方法，它接受一个属性数组，创建一个模型并将其插入数据库。`save` 和 `create` 之间的区别在于 `save` 接受一个完整的 Eloquent 模型实例，而 `create` 接受一个纯 PHP `array`。新创建的模型将由 `create` 方法返回：

```php
use App\Models\Post;

$post = Post::find(1);

$comment = $post->comments()->create([
    'message' => 'A new comment.',
]);
```

您可能会使用 `createMany` 方法创建多个相关模型：

```php
$post = Post::find(1);

$post->comments()->createMany([
    ['message' => 'A new comment.'],
    ['message' => 'Another new comment.'],
]);
```

`createQuietly` 和 `createManyQuietly` 方法可用来创建模型(s) 而不分发任何事件：

```php
$user = User::find(1);

$user->posts()->createQuietly([
    'title' => 'Post title.',
]);

$user->posts()->createManyQuietly([
    ['title' => 'First post.'],
    ['title' => 'Second post.'],
]);
```

您还可以使用 `findOrNew`、`firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法在关系上[创建和更新模型](/docs/11/eloquent/eloquent#upserts)。

````
> [!NOTE]
> 在使用 `create` 方法之前，请务必阅读 [批量赋值](/docs/11/eloquent#mass-assignment) 文档。

### 属于关系

如果你想要给子模型分配一个新的父模型，你可以使用 `associate` 方法。在此示例中，`User` 模型定义了一个属于 `Account` 模型的 `belongsTo` 关系。这个 `associate` 方法将会在子模型上设置外键：

```php
use App\Models\Account;

$account = Account::find(10);

$user->account()->associate($account);

$user->save();
````

要从子模型中移除父模型，你可以使用 `dissociate` 方法。此方法会将关系的外键设置为 `null`：

```php
$user->account()->dissociate();

$user->save();
```

### 多对多关系

#### 附加 / 分离

Eloquent 也提供了一些方法来更方便地处理多对多关系。例如，假设用户可拥有多个角色，并且一个角色可以有多个用户。你可以使用 `attach` 方法通过在关系的中间表中插入记录来附加角色到用户：

```php
use App\Models\User;

$user = User::find(1);

$user->roles()->attach($roleId);
```

在附加关系到模型时，你还可以传递一个附加数据数组，将其插入中间表：

```php
$user->roles()->attach($roleId, ['expires' => $expires]);
```

有时可能需要从用户中移除一个角色。要移除多对多关系记录，使用 `detach` 方法。`detach` 方法将会从中间表中删除相应的记录；不过，两个模型仍然会留在数据库中：

```php
// 从用户中分离单个角色...
$user->roles()->detach($roleId);

// 从用户中分离所有角色...
$user->roles()->detach();
```

为了方便起见，`attach` 和 `detach` 也接受 ID 数组作为输入：

```php
$user = User::find(1);

$user->roles()->detach([1, 2, 3]);

$user->roles()->attach([
    1 => ['expires' => $expires],
    2 => ['expires' => $expires],
]);
```

#### 同步关联

你还可以使用 `sync` 方法来建立多对多关联。`sync` 方法接受一个 ID 数组来放在中间表中。不在给定数组中的任何 ID 将从中间表中移除。因此，这个操作完成后，给定数组中的 ID 将是中间表上唯一存在的：

```php
$user->roles()->sync([1, 2, 3]);
```

你也可以传递额外的中间表值与这些 ID：

```php
$user->roles()->sync([1 => ['expires' => true], 2, 3]);
```

如果你想要用每个同步模型 ID 插入相同的中间表值，你可以使用 `syncWithPivotValues` 方法：

```php
$user->roles()->syncWithPivotValues([1, 2, 3], ['active' => true]);
```

如果你不想分离给定数组中缺失的现有 ID，你可以使用 `syncWithoutDetaching` 方法：

```php
$user->roles()->syncWithoutDetaching([1, 2, 3]);
```

#### 切换关联

多对多关系还提供了一个 `toggle` 方法，它“切换”了给定相关模型 ID 的附加状态。如果给定 ID 目前是附加的，则将其分离。同样，如果它当前是分离的，它将被附加：

```php
$user->roles()->toggle([1, 2, 3]);
```

你也可传递额外的中间表值与这些 ID：

```php
$user->roles()->toggle([
    1 => ['expires' => true],
    2 => ['expires' => true],
]);
```

#### 更新中间表上的记录

如果你需要更新关系中间表上的现有行，你可以使用 `updateExistingPivot` 方法。这个方法接受中间记录外键和一个属性数组来进行更新：

```php
$user = User::find(1);

$user->roles()->updateExistingPivot($roleId, [
    'active' => false,
]);
```

## 触摸父时间戳

当一个模型定义了 `belongsTo` 或 `belongsToMany` 关系到另一个模型，如 `Comment` 属于 `Post` 时，有时在子模型更新时自动更新父模型的时间戳会很有帮助。

例如，当 `Comment` 模型被更新时，你可能想要自动“触摸”所属 `Post` 的 `updated_at` 时间戳，使其设置为当前日期和时间。为了完成这个目的，你可以在子模型中添加一个 `touches` 属性，其中包含了子模型更新时应当更新 `updated_at` 时间戳的关系名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    /**
     * 所有需要被触摸的关系名。
     *
     * @var array
     */
    protected $touches = ['post'];

    /**
     * 获取评论所属的帖子。
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

> [!WARNING]  
> 如果子模型使用 Eloquent 的 `save` 方法更新，父模型的时间戳才会被更新。
