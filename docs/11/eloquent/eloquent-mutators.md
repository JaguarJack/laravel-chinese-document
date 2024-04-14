---
title: Laravel Eloquent 修改器与类型转换
---

# Eloquent: 修改器与类型转换

[[toc]]

## 简介

访问器、修改器和属性类型转换允许你在从模型实例上检索或设置属性值时转换 Eloquent 的属性值。例如，你可能想要使用 [Laravel 加密器](/docs/11/security/encryption)在数据库中存储值的同时进行加密，并在从 Eloquent 模型上访问该属性时自动解密该属性。或者，你可能想要将存储在数据库中的 JSON 字符串在通过 Eloquent 模型访问时转换为数组。

## 访问器和修改器

### 定义访问器

访问器在访问 Eloquent 的属性值时进行转换。要定义访问器，需要在模型上创建一个受保护的方法来表示可访问的属性。该方法名称应该对应于真实的底层模型属性/数据库列的“驼峰式”表示，如果适用的话。

在这个例子中，我们将定义一个访问器 `first_name`。当尝试检索 `first_name` 属性的值时，Eloquent 会自动调用访问器。所有的属性访问器/修改器方法都必须声明返回类型为 `Illuminate\Database\Eloquent\Casts\Attribute`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取用户的名字。
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
        );
    }
}
```

所有的访问器方法都返回一个 `Attribute` 实例，定义了如何访问属性，可选的，如何修改它。在这个例子中，我们只定义了如何访问属性。为此，我们向 `Attribute` 类构造器提供了 `get` 参数。

正如你所看到的，列的原始值会传递给访问器，允许你操作并返回值。为了访问访问器的值，你可以简单地访问模型实例上的 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$firstName = $user->first_name;
```

> 如果你希望这些计算出的值能够添加到模型的数组/JSON 表示中，请[您将需要追加它们](/docs/11/eloquent/eloquent-serialization#appending-values-to-json)。

#### 从多个属性构建值对象

有时候你的访问器可能需要将多个模型属性转换成一个单一的“值对象”。为此，你的 `get` 闭包可以接受第二个参数为 `$attributes`，该参数将被自动提供给闭包，并将包含模型所有当前属性的数组：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址互动。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    );
}
```

#### 访问器缓存

当从访问器返回值对象时，对值对象进行的任何更改都会在模型保存之前自动同步回模型。这是可能的，因为 Eloquent 保留了访问器返回的实例，以便每次调用访问器时都返回相同的实例：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = '更新的地址行1值';
$user->address->lineTwo = '更新的地址行2值';

$user->save();
```

然而，有时你可能希望为原始值（如字符串和布尔值）启用缓存，特别是如果它们是计算密集型的。为此，你可以在定义访问器时调用 `shouldCache` 方法：

```php
protected function hash(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => bcrypt(gzuncompress($value)),
    )->shouldCache();
}
```

如果你想要禁用属性的对象缓存行为，你可以在定义属性时调用 `withoutObjectCaching` 方法：

```php
/**
 * 与用户的地址互动。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    )->withoutObjectCaching();
}
```

### 定义修改器

修改器在设置 Eloquent 属性值时进行转换。要定义修改器，你可以在定义属性时提供 `set` 参数。让我们为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，这个修改器将自动被调用：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 与用户的名字互动。
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower($value),
        );
    }
}
```

修改器闭包将接收正在设置在属性上的值，允许你操作该值并返回操作后的值。要使用我们的修改器，我们只需要在 Eloquent 模型上设置 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$user->first_name = 'Sally';
```

在这个例子中，`set` 回调将被调用并传递值 `Sally`。然后修改器将应用 `strtolower` 函数到名字上，并将其结果值设置在模型的内部 `$attributes` 数组中。

#### 修改多个属性

有时你的修改器可能需要在底层模型上设置多个属性。为此，你可以从 `set` 闭包返回一个数组。数组中的每个键都应该对应模型关联的底层属性/数据库列：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址互动。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
        set: fn (Address $value) => [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ],
    );
}
```

## 属性类型转换

属性类型转换提供了类似于访问器和修改器的功能，而无需在模型上定义任何额外的方法。相反，你的模型的 `casts` 方法提供了一种方便的方式将属性转换为常见的数据类型。

`casts` 方法应该返回一个数组，其中键是被转换的属性名称，值是你希望转换的列类型。支持的转换类型如下：

- `array`
- `AsStringable::class`
- `boolean`
- `collection`
- `date`
- `datetime`
- `immutable_date`
- `immutable_datetime`
- `decimal:<precision>`
- `double`
- `encrypted`
- `encrypted:array`
- `encrypted:collection`
- `encrypted:object`
- `float`
- `hashed`
- `integer`
- `object`
- `real`
- `string`
- `timestamp`
  为了演示属性类型转换，让我们将数据库中以整数（`0` 或 `1`）形式存储的 `is_admin` 属性转换为布尔值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取需要被类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
        ];
    }
}
```

定义类型转换后，即使 `is_admin` 属性在数据库中存储为整数，当你访问它时也总是会被转换为布尔值：

```php
$user = App\Models\User::find(1);

if ($user->is_admin) {
    // ...
}
```

如果你需要在运行时添加一个新的、临时的类型转换，你可以使用 `mergeCasts` 方法。这些类型转换的定义将被添加到模型上已经定义的任何类型转换中：

```php
$user->mergeCasts([
    'is_admin' => 'integer',
    'options' => 'object',
]);
```

> [!WARNING]  
> 属性值为 `null` 的时候不会进行类型转换。此外，你永远不应该定义一个与关系同名的类型转换（或属性），也不应该为模型的主键分配类型转换。

#### Stringable 类型转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 类型转换类将模型属性转换为一个 [流畅的 `Illuminate\Support\Stringable` 对象](/docs/11/digging-deeper/strings#fluent-strings-method-list)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取需要被类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'directory' => AsStringable::class,
        ];
    }
}
```

### 数组和 JSON 类型转换

`array` 类型转换在处理存储为序列化 JSON 的列时特别有用。例如，如果你的数据库有一个包含序列化 JSON 的 `JSON` 或 `TEXT` 字段类型，为该属性添加 `array` 类型转换将自动在你通过 Eloquent 模型访问时将属性反序列化为 PHP 数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取需要被类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }
}
```

定义类型转换后，你可以访问 `options` 属性，它会自动从 JSON 反序列化成 PHP 数组。当你设置 `options` 属性的值时，给定的数组会自动序列化回 JSON 进行存储：

```php
use App\Models\User;

$user = User::find(1);

$options = $user->options;

$options['key'] = 'value';

$user->options = $options;

$user->save();
```

如果你想用更简洁的语法更新 JSON 属性的单个字段，你可以[使属性可以批量赋值](/docs/11/eloquent/eloquent#mass-assignment-json-columns)并在调用 `update` 方法时使用 `->` 运算符：

```php
$user = User::find(1);

$user->update(['options->key' => 'value']);
```

#### ArrayObject 和 Collection 类型转换

尽管标准的 `array` 类型转换对于许多应用来说已经足够使用，但它确实有一些缺点。由于 `array` 类型转换返回原始类型，因此无法直接修改数组的某个偏移。例如，以下代码将触发一个 PHP 错误：

```php
$user = User::find(1);

$user->options['key'] = $value;
```

为了解决这个问题，Laravel 提供了一个 `AsArrayObject` 类型转换，它将你的 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。该特性使用 Laravel 的[自定义类型转换](#custom-casts)实现，它允许 Laravel 智能地缓存和转换变化了的对象，以便可以修改单个偏移量而不触发 PHP 错误。要使用 `AsArrayObject` 类型转换，只需将它分配给一个属性：

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsArrayObject::class,
    ];
}
```

类似地，Laravel 提供了一个 `AsCollection` 类型转换，它将你的 JSON 属性转换为一个 Laravel [Collection](/docs/11/digging-deeper/collections) 实例：

```php
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::class,
    ];
}
```

如果你希望 `AsCollection` 类型转换实例化一个自定义的集合类，而不是 Laravel 的基础集合类，你可以提供集合类名作为类型转换参数：

```php
use App\Collections\OptionCollection;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::using(OptionCollection::class),
    ];
}
```

### 日期类型转换

默认情况下，Eloquent 会将 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 的实例，它扩展了 PHP 的 `DateTime` 类，并提供了一系列有用的方法。你可以通过在模型的 `casts` 方法中定义额外的日期类型转换来转换额外的日期属性。通常情况下，日期应该使用 `datetime` 或 `immutable_datetime` 类型转换。

定义 `date` 或 `datetime` 类型转换时，你还可以指定日期的格式。当[模型序列化为数组或 JSON](/docs/11/eloquent/eloquent-serialization)时，将使用此格式：

```php
/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'created_at' => 'datetime:Y-m-d',
    ];
}
```

当某个列被转换为日期时，你可以将对应的模型属性值设置为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串，或者 `DateTime` / `Carbon` 实例。日期的值将被正确转换并存储在数据库中。

你可以通过在模型上定义一个 `serializeDate` 方法来自定义模型所有日期的默认序列化格式。这个方法不会影响你的日期在数据库中的存储格式：

```php
/**
 * 准备一个日期进行数组 / JSON 序列化。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

要指定实际存储模型日期的格式，你应该在模型上定义一个 `$dateFormat` 属性：

```php
/**
 * 模型的日期列的存储格式。
 *
 * @var string
 */
protected $dateFormat = 'U';
```

#### 日期类型转换、序列化和时区

默认情况下，`date` 和 `datetime` 类型转换会将日期序列化为 UTC ISO-8601 日期字符串（`YYYY-MM-DDTHH:MM:SS.uuuuuuZ`），无论应用的 `timezone` 配置选项中指定的时区是什么。强烈鼓励你始终使用这种序列化格式，并且通过不更改应用的 `timezone` 配置选项从其默认的 `UTC` 值，让应用的日期始终使用 UTC 时区。一贯使用 UTC 时区将为你的应用提供与 PHP 和 JavaScript 中编写的其他日期操作库的最大兼容性。

如果应用了自定义格式到 `date` 或 `datetime` 类型转换，例如 `datetime:Y-m-d H:i:s`，在日期序列化时会使用 Carbon 实例的内部时区。通常情况下，这将是应用的 `timezone` 配置选项中指定的时区。

### Enum 类型转换

Eloquent 还允许你将属性值转换为 PHP [枚举](https://www.php.net/manual/en/language.enumerations.backed.php)。要做到这一点，你可以在模型的 `casts` 方法中指定你希望转换的属性和枚举：

```php
use App\Enums\ServerStatus;

/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'status' => ServerStatus::class,
    ];
}
```

一旦你在模型上定义了类型转换，当你与属性交互时，指定的属性就会自动被转换为枚举并从枚举转换回来：

```php
if ($server->status == ServerStatus::Provisioned) {
    $server->status = ServerStatus::Ready;

    $server->save();
}
```

#### 枚举数组的类型转换

有时你可能需要你的模型在单个列中存储一个枚举值数组。为了实现这一点，你可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 类型转换：

```php
use App\Enums\ServerStatus;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'statuses' => AsEnumCollection::of(ServerStatus::class),
    ];
}
```

### 加密类型转换

`encrypted` 类型转换将利用 Laravel 内置的 [加密功能](/docs/11/security/encryption) 来加密模型属性值。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 类型转换的工作方式与它们的非加密对应类型相似；不过，正如你所预料的，底层值在存储到数据库时是加密的。

由于加密文本的最终长度是不可预测的，并且比明文要长，确保相关的数据库列是 `TEXT` 类型或更大的类型。此外，由于值在数据库中是加密的，你将无法查询或搜索加密属性值。

#### 密钥轮换

如你所知，Laravel 使用你的应用 `app` 配置文件中指定的 `key` 配置值进行字符串加密。通常，这个值对应于 `APP_KEY` 环境变量的值。如果你需要轮换应用的加密密钥，则必须手动使用新密钥重新加密已加密的属性。

### 查询时类型转换

有时你可能需要在执行查询时应用类型转换，比如选择表格中的原始值时。例如，考虑以下查询：

```php
use App\Models\Post;
use App\Models\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
            ->whereColumn('user_id', 'users.id')
])->get();
```

此查询结果中的 `last_posted_at` 属性将是一个简单的字符串。如果我们可以在执行查询时对此属性应用 `datetime` 类型转换就太好了。幸好我们可以使用 `withCasts` 方法来实现这一点：

```php
$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
            ->whereColumn('user_id', 'users.id')
])->withCasts([
    'last_posted_at' => 'datetime'
])->get();
```

## 自定义类型转换

Laravel 有多种内置且有用的类型转换；然而，偶尔你可能需要定义自己的类型转换。要创建类型转换，请执行 `make:cast` Artisan 命令。新的类型转换类将被放置在你的 `app/Casts` 目录下：

```shell
php artisan make:cast Json
```

所有自定义类型转换类都实现了 `CastsAttributes` 接口。实现这个接口的类必须定义一个 `get` 方法和一个 `set` 方法。`get` 方法负责将数据库中的原始值转换为类型转换后的值，而 `set` 方法应该将类型转换后的值转换为可以存储在数据库中的原始值。作为示例，我们将重新实现内置的 `json` 类型转换为自定义类型转换：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class Json implements CastsAttributes
{
    /**
     * 转换给定的值。
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        return json_decode($value, true);
    }

    /**
     * 准备给定的值以便存储。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        return json_encode($value);
    }
}
```

定义了自定义类型转换后，你可以使用它的类名将其附加到模型属性上：

```php
<?php

namespace App\Models;

use App\Casts\Json;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取需要被类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => Json::class,
        ];
    }
}
```

### 值对象类型转换

你不仅限于将值转换为原始类型。你还可以将值转换为对象。定义将值转换为对象的自定义类型转换与转换为原始类型非常相似；不过 `set` 方法应返回一个键/值对数组，这些键/值对将用于在模型上设置原始的、可存储的值。

作为例子，我们将定义一个自定义类型转换类，它将多个模型值转换为单个 `Address` 值对象。我们假设 `Address` 值对象有两个公开属性：`lineOne` 和 `lineTwo`：

```php
<?php

namespace App\Casts;

use App\ValueObjects\Address as AddressValueObject;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class Address implements CastsAttributes
{
    /**
     * 转换给定的值。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): AddressValueObject
    {
        return new AddressValueObject(
            $attributes['address_line_one'],
            $attributes['address_line_two']
        );
    }

    /**
     * 准备给定的值以便存储。
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, string>
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (! $value instanceof AddressValueObject) {
            throw new InvalidArgumentException('The given value is not an Address instance.');
        }

        return [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ];
    }
}
```

进行值对象类型转换时，对值对象所做的任何更改都会在模型保存之前自动同步回模型：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = '更新的地址值';

$user->save();
```

> [!NOTE]  
> 如果你打算将包含值对象的 Eloquent 模型序列化为 JSON 或数组，那么你应该在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

#### 值对象缓存

当转换为值对象的属性被解析时，它们被 Eloquent 缓存。因此，如果再次访问该属性，则会返回相同的对象实例。

如果你想禁用自定义类型转换类的对象缓存行为，你可以在自定义类型转换类上声明一个公开的 `withoutObjectCaching` 属性：

```php
class Address implements CastsAttributes
{
    public bool $withoutObjectCaching = true;

    // ...
}
```

### 数组/JSON 序列化

当 Eloquent 模型通过 `toArray` 和 `toJson` 方法转换为数组或 JSON 时，通常你的自定义类型转换值对象也会被序列化，只要它们实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。然而，当使用第三方库提供的值对象时，你可能无法为对象添加这些接口。

因此，你可以指定你的自定义类型转换类将负责对值对象进行序列化。要做到这一点，你的自定义类型转换类应该实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。这个接口表明你的类应该包含一个 `serialize` 方法，它应该返回你的值对象的序列化形式：

```php
/**
 * 获取值的序列化表示。
 *
 * @param  array<string, mixed>  $attributes
 */
public function serialize(Model $model, string $key, mixed $value, array $attributes): string
{
    return (string) $value;
}
```

### 入站类型转换

偶尔，你可能需要编写一个仅转换在模型上设置的值并且在从模型检索属性时不执行任何操作的自定义类型转换类。

仅入站的自定义类型转换应该实现 `CastsInboundAttributes` 接口，它只要求定义一个 `set` 方法。可使用 `make:cast` Artisan 命令并带上 `--inbound` 选项来生成一个只入站的类型转换类：

```shell
php artisan make:cast Hash --inbound
```

一个经典的只入站类型转换的例子是 "哈希" 类型转换。例如，我们可以定义一个通过给定算法对入站值进行哈希处理的类型转换：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes;
use Illuminate\Database\Eloquent\Model;

class Hash implements CastsInboundAttributes
{
    /**
     * 创建一个新的类型转换类实例。
     */
    public function __construct(
        protected string|null $algorithm = null,
    ) {}

    /**
     * 准备给定的值以便存储。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        return is_null($this->algorithm)
                    ? bcrypt($value)
                    : hash($this->algorithm, $value);
    }
}
```

### 类型转换参数

当将自定义类型转换附加到模型时，可以通过使用 `:` 字符将参数从类名中分隔出来，并使用逗号分隔多个参数来指定类型转换参数。这些参数将被传递给类型转换类的构造函数：

```php
/**
 * 获取需要被类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'secret' => Hash::class.':sha256',
    ];
}
```

### 可类型转换的类

你可能希望你的应用中的值对象自己定义它们的自定义类型转换类。除了将自定义类型转换类附加到你的模型之外，你还可以附加实现了 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class,
    ];
}
```

实现了 `Castable` 接口的对象必须定义一个 `castUsing` 方法，该方法返回负责转换到/从 `Castable` 类的自定义转换器类的类名：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\Address as AddressCast;

class Address implements Castable
{
    /**
     * 获取用于转换到/从这个类型转换目标的转换器类名。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): string
    {
        return AddressCast::class;
    }
}
```

使用 `Castable` 类时，你仍然可以在 `casts` 方法定义中提供参数。这些参数将被传递给 `castUsing` 方法：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class.':argument',
    ];
}
```

#### 可类型转换的类与匿名类型转换类

通过将 "可类型转换的类" 与 PHP 的[匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php) 结合起来，你可以将值对象及其转换逻辑定义为一个单一的可类型转换对象。为了实现这一点，请从你的值对象 `castUsing` 方法中返回一个匿名类。匿名类应该实现 `CastsAttributes` 接口：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Address implements Castable
{
    // ...

    /**
     * 获取用于转换到/从这个类型转换目标的转换器类。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get(Model $model, string $key, mixed $value, array $attributes): Address
            {
                return new Address(
                    $attributes['address_line_one'],
                    $attributes['address_line_two']
                );
            }

            public function set(Model $model, string $key, mixed $value, array $attributes): array
            {
                return [
                    'address_line_one' => $value->lineOne,
                    'address_line_two' => $value->lineTwo,
                ];
            }
        };
    }
}
```
