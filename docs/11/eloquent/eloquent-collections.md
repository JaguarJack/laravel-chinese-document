---
title: Laravel Eloquent 集合
---

# Eloquent：集合

[[toc]]

## 简介

所有返回多个模型结果的 Eloquent 方法将会返回 `Illuminate\Database\Eloquent\Collection` 类的实例，包括通过 `get` 方法检索的结果或通过关系访问的结果。Eloquent 集合对象扩展了 Laravel 的[基础集合](/docs/11/digging-deeper/collections)，因此它自然继承了许多用于流畅处理底层 Eloquent 模型数组的方法。确保查看 Laravel 集合文档，了解这些有用的方法！

所有集合也充当迭代器，允许你像循环简单的 PHP 数组一样循环它们:

```php
use App\Models\User;

$users = User::where('active', 1)->get();

foreach ($users as $user) {
    echo $user->name;
}
```

然而，如前所述，集合比数组更强大，能够暴露各种 map / reduce 操作，这些操作可以使用直观的接口进行链式操作。例如，我们可以移除所有非活跃的模型，然后收集每个剩余用户的名字:

```php
$names = User::all()->reject(function (User $user) {
    return $user->active === false;
})->map(function (User $user) {
    return $user->name;
});
```

#### Eloquent 集合转换

虽然大多数 Eloquent 集合方法返回一个新的 Eloquent 集合实例，但 `collapse`、`flatten`、`flip`、`keys`、`pluck` 和 `zip` 方法返回基础集合实例。类似地，如果 `map` 操作返回的集合不包含任何 Eloquent 模型，它将转换为基础集合实例。

## 可用方法

所有 Eloquent 集合扩展了基础 [Laravel 集合](/docs/11/digging-deeper/collections#available-methods) 对象; 因此，它们继承了基础集合类提供的所有强大方法。

此外，`Illuminate\Database\Eloquent\Collection` 类提供了一组辅助管理模型集合的方法。 大多数方法返回 `Illuminate\Database\Eloquent\Collection` 实例; 然而，某些方法，如 `modelKeys`，返回一个 `Illuminate\Support\Collection` 实例。

#### `append($attributes)`

`append` 方法用于指示在集合中的每个模型上 [追加](/docs/11/eloquent/eloquent-serialization#appending-values-to-json) 属性。此方法接受一个属性数组或单个属性:

```php
$users->append('team');

$users->append(['team', 'is_admin']);
```

#### `contains($key, $operator = null, $value = null)`

`contains` 方法用于确定给定的模型实例是否包含在集合中。此方法接受一个主键或一个模型实例:

```php
$users->contains(1);

$users->contains(User::find(1));
```

#### `diff($items)`

`diff` 方法返回所有未出现在给定集合中的模型:

```php
use App\Models\User;

$users = $users->diff(User::whereIn('id', [1, 2, 3])->get());
```

#### `except($keys)`

`except` 方法返回所有没有给定主键的模型:

```php
$users = $users->except([1, 2, 3]);
```

#### `find($key)`

`find` 方法返回具有与给定键匹配的主键的模型。如果 `$key` 是一个模型实例，`find` 将尝试返回匹配主键的模型。如果 `$key` 是键数组，`find` 将返回所有具有给定数组中主键的模型:

```php
$users = User::all();

$user = $users->find(1);
```

#### `fresh($with = [])`

`fresh` 方法从数据库中检索集合中每个模型的新实例。此外，任何指定的关系都将被预先加载:

```php
$users = $users->fresh();

$users = $users->fresh('comments');
```

#### `intersect($items)`

`intersect` 方法返回所有也出现在给定集合中的模型:

```php
use App\Models\User;

$users = $users->intersect(User::whereIn('id', [1, 2, 3])->get());
```

#### `load($relations)`

`load` 方法为集合中的所有模型预先加载给定的关系:

```php
$users->load(['comments', 'posts']);

$users->load('comments.author');

$users->load(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

#### `loadMissing($relations)`

如果关系尚未加载，`loadMissing` 方法将为集合中的所有模型预先加载给定的关系:

```php
$users->loadMissing(['comments', 'posts']);

$users->loadMissing('comments.author');

$users->loadMissing(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

#### `modelKeys()`

`modelKeys` 方法返回集合中所有模型的主键:

```php
$users->modelKeys();

// [1, 2, 3, 4, 5]
```

#### `makeVisible($attributes)`

`makeVisible` 方法 [使属性变为可见](/docs/11/eloquent/eloquent-serialization#hiding-attributes-from-json)，这些属性通常在集合的每个模型上是 "隐藏" 的:

```php
$users = $users->makeVisible(['address', 'phone_number']);
```

#### `makeHidden($attributes)`

`makeHidden` 方法 [隐藏属性](/docs/11/eloquent/eloquent-serialization#hiding-attributes-from-json)，这些属性通常在集合的每个模型上是 "可见" 的:

```php
$users = $users->makeHidden(['address', 'phone_number']);
```

#### `only($keys)`

`only` 方法返回具有给定主键的所有模型:

```php
$users = $users->only([1, 2, 3]);
```

#### `setVisible($attributes)`

`setVisible` 方法 [临时覆盖](/docs/11/eloquent/eloquent-serialization#temporarily-modifying-attribute-visibility) 集合中每个模型上的所有可见属性:

```php
$users = $users->setVisible(['id', 'name']);
```

#### `setHidden($attributes)`

`setHidden` 方法 [临时覆盖](/docs/11/eloquent/eloquent-serialization#temporarily-modifying-attribute-visibility) 集合中每个模型上的所有隐藏属性:

```php
$users = $users->setHidden(['email', 'password', 'remember_token']);
```

#### `toQuery()`

`toQuery` 方法返回一个 Eloquent 查询构建器实例，其中包含对集合模型主键的 `whereIn` 约束:

```php
use App\Models\User;

$users = User::where('status', 'VIP')->get();

$users->toQuery()->update([
    'status' => 'Administrator',
]);
```

#### `unique($key = null, $strict = false)`

`unique` 方法返回集合中所有独特的模型。 集合中与另一个模型类型相同且主键相同的任何模型都被移除:

```php
$users = $users->unique();
```

## 自定义集合

如果你想在与给定模型交互时使用自定义的 `Collection` 对象，你可以在你的模型上定义一个 `newCollection` 方法:

```php
<?php

namespace App\Models;

use App\Support\UserCollection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 创建一个新的 Eloquent 集合实例。
     *
     * @param  array<int, \Illuminate\Database\Eloquent\Model>  $models
     * @return \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Database\Eloquent\Model>
     */
    public function newCollection(array $models = []): Collection
    {
        return new UserCollection($models);
    }
}
```

一旦你定义了一个 `newCollection` 方法，当 Eloquent 通常会返回一个 `Illuminate\Database\Eloquent\Collection` 实例时，你将收到一个自定义集合的实例。 如果你想要为你的应用中的每个模型使用自定义集合，你应该在一个基础模型类上定义 `newCollection` 方法，该基础模型类被应用中所有的模型扩展。
