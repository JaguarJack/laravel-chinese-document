---
title: Laravel Eloquent 序列化
---

# Eloquent：序列化

[[toc]]

## 介绍

在使用 Laravel 构建 API 时，你经常需要将你的模型和关系转换为数组或 JSON。Eloquent 包含了便捷的方法来进行这些转换，以及控制哪些属性包含在你模型的序列化表示中。

> [!Note]  
> 有关处理 Eloquent 模型和集合 JSON 序列化的更加强大的方法，请查看 [Eloquent API 资源](/docs/11/eloquent/eloquent-resources)的文档。

## 序列化模型和集合

### 序列化为数组

要将模型及其加载的[关系](/docs/11/eloquent/eloquent-relationships)转换为数组，应使用 `toArray` 方法。此方法是递归的，因此所有属性和所有关系（包括关系的关系）都将被转换为数组：

```php
use App\Models\User;

$user = User::with('roles')->first();

return $user->toArray();
```

`attributesToArray` 方法可用于将模型的属性转换为数组，但不包括其关系：

```php
$user = User::first();

return $user->attributesToArray();
```

你也可以通过在集合实例上调用 `toArray` 方法将整个[集合](/docs/11/eloquent/eloquent-collections)的模型转换为数组：

```php
$users = User::all();

return $users->toArray();
```

### 序列化为 JSON

要将模型转换为 JSON，应该使用 `toJson` 方法。像 `toArray` 一样，`toJson` 方法是递归的，所以所有属性和关系都会被转换为 JSON。你还可以指定任何 [PHP 支持的](https://secure.php.net/manual/en/function.json-encode.php) JSON 编码选项：

```php
use App\Models\User;

$user = User::find(1);

return $user->toJson();

return $user->toJson(JSON_PRETTY_PRINT);
```

或者，你可以将模型或集合强制转换为字符串，这将自动调用模型或集合上的 `toJson` 方法：

```php
return (string) User::find(1);
```

由于模型和集合在转换为字符串时会被转换为 JSON，所以你可以直接从应用的路由或控制器返回 Eloquent 对象。Laravel 将自动将你的 Eloquent 模型和集合序列化为 JSON，当它们从路由或控制器返回时：

```php
Route::get('users', function () {
    return User::all();
});
```

#### 关系

当 Eloquent 模型被转换为 JSON 时，其加载的关系将自动作为属性包含在 JSON 对象上。此外，尽管 Eloquent 关系方法是使用“驼峰式”方法名称定义的，但关系的 JSON 属性将是“下划线式”。

## 从 JSON 中隐藏属性

有时你可能希望限制包含在模型的数组或 JSON 表示中的属性，例如密码。要做到这一点，请在你的模型中添加一个 `$hidden` 属性。在 `$hidden` 属性数组中列出的属性将不会包含在模型的序列化表示中：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 数组中应该被隐藏的属性。
     *
     * @var array
     */
    protected $hidden = ['password'];
}
```

> [!Note]  
> 要隐藏关系，请将关系的方法名添加到你的 Eloquent 模型的 `$hidden` 属性中。

或者，你可以使用 `visible` 属性来定义一个“允许列表”，其中包含应该包含在模型的数组和 JSON 表示中的属性。当模型被转换为数组或 JSON 时，所有未出现在 `$visible` 数组中的属性都将被隐藏：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 数组中应该可见的属性。
     *
     * @var array
     */
    protected $visible = ['first_name', 'last_name'];
}
```

#### 临时修改属性可见性

如果你希望在给定的模型实例上使一些通常隐藏的属性可见，你可以使用 `makeVisible` 方法。`makeVisible` 方法返回模型实例：

```php
return $user->makeVisible('attribute')->toArray();
```

同样地，如果你希望隐藏一些通常可见的属性，你可以使用 `makeHidden` 方法。

```php
return $user->makeHidden('attribute')->toArray();
```

如果你希望临时覆盖所有可见或隐藏的属性，你可以分别使用 `setVisible` 和 `setHidden` 方法：

```php
return $user->setVisible(['id', 'name'])->toArray();

return $user->setHidden(['email', 'password', 'remember_token'])->toArray();
```

## 向 JSON 添加值

偶尔，在将模型转换为数组或 JSON 时，你可能希望添加没有相应数据库列的属性。要做到这一点，首先为值定义一个[访问器](/docs/11/eloquent/eloquent-mutators)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 判断用户是否为管理员。
     */
    protected function isAdmin(): Attribute
    {
        return new Attribute(
            get: fn () => 'yes',
        );
    }
}
```

如果你希望访问器始终附加到模型的数组和 JSON 表示中，你可以将属性名称添加到模型的 `appends` 属性中。请注意，尽管访问器的 PHP 方法是使用“驼峰式”定义的，属性名称通常使用它们的“下划线式”序列化表示来引用：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 应该附加到模型数组形式的访问器。
     *
     * @var array
     */
    protected $appends = ['is_admin'];
}
```

一旦属性被添加到 `appends` 列表中，它就会被包含在模型的数组和 JSON 表示中。`appends` 数组中的属性还将遵循模型上配置的 `visible` 和 `hidden` 设置。

#### 运行时附加

运行时，你可以指示模型实例使用 `append` 方法附加额外的属性。或者，你可以使用 `setAppends` 方法覆盖给定模型实例的全部追加属性数组：

```php
return $user->append('is_admin')->toArray();

return $user->setAppends(['is_admin'])->toArray();
```

## 日期序列化

#### 自定义默认日期格式

你可以通过重写 `serializeDate` 方法来自定义默认的序列化格式。此方法不影响你的日期在数据库中存储的格式：

```php
/**
 * 为数组/JSON 序列化准备日期。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

#### 自定义每个属性的日期格式

你可以通过在模型的[强制类型转换声明](/docs/11/eloquent/eloquent-mutators#attribute-casting)中指定日期格式来自定义单个 Eloquent 日期属性的序列化格式：

```php
protected function casts(): array
{
    return [
        'birthday' => 'date:Y-m-d',
        'joined_at' => 'datetime:Y-m-d H:00',
    ];
}
```
