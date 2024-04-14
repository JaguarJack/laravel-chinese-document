---
title: Laravel Eloquent
---

# Eloquent：入门

[[toc]]

## 介绍

Laravel 包括 Eloquent，这是一个对象关系映射器（ORM），使得与数据库交互变得更加愉快。使用 Eloquent 时，每个数据库表都有一个对应的“模型”，用于与表进行交互。除了从数据库表中检索记录，Eloquent 模型还允许你从表中插入、更新和删除记录。

> [!NOTE]  
> 在开始之前，请确保在应用程序的 `config/database.php` 配置文件中配置了数据库连接。有关配置数据库的更多信息，请查看[数据库配置文档](/docs/11/database/database#configuration)。

#### Laravel 训练营

如果你是 Laravel 新手，随时可以加入 [Laravel 训练营](https://bootcamp.laravel.com)。Laravel 训练营将引导你使用 Eloquent 构建你的第一个 Laravel 应用程序。这是一种了解 Laravel 和 Eloquent 所提供一切的好方法。

## 生成模型类

首先，让我们创建一个 Eloquent 模型。模型通常位于 `app\Models` 目录并扩展 `Illuminate\Database\Eloquent\Model` 类。你可以使用 `make:model` [Artisan 命令](/docs/11/digging-deeper/artisan)来生成一个新模型：

```shell
php artisan make:model Flight
```

如果你想在生成模型时生成一个[数据库迁移](/docs/11/database/migrations)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

在生成模型时，你可以生成各种其他类型的类，如工厂、填充器、策略、控制器和表单请求。此外，这些选项可以组合在一起一次创建多个类：

```shell
# 生成模型和 FlightFactory 类...
php artisan make:model Flight --factory
php artisan make:model Flight -f

# 生成模型和 FlightSeeder 类...
php artisan make:model Flight --seed
php artisan make:model Flight -s

# 生成模型和 FlightController 类...
php artisan make:model Flight --controller
php artisan make:model Flight -c

# 生成模型、FlightController 资源类和表单请求类...
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# 生成模型和 FlightPolicy 类...
php artisan make:model Flight --policy

# 生成模型和迁移、工厂、填充器和控制器...
php artisan make:model Flight -mfsc

# 快捷方式生成一个模型、迁移、工厂、填充器、策略、控制器和表单请求...
php artisan make:model Flight --all
php artisan make:model Flight -a

# 生成一个枢纽模型...
php artisan make:model Member --pivot
php artisan make:model Member -p
```

#### 模型检查

有时候，仅仅通过浏览其代码很难确定模型的所有可用属性和关系。相反，尝试使用 `model:show` Artisan 命令，它能方便地概览模型的所有属性和关系：

```shell
php artisan model:show Flight
```

## Eloquent 模型约定

`make:model` 命令生成的模型将放置在 `app/Models` 目录中。让我们检查一个基本模型类并讨论一些 Eloquent 的关键约定：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    // ...
}
```

### 表名

看完上面的示例后，你可能已经注意到，我们没有告诉 Eloquent `Flight` 模型对应的是哪个数据库表。按照惯例，类的 "snake case"、复数名称将被用作表名，除非明确指定了另一个名称。因此，在本例中，Eloquent 将假设 `Flight` 模型存储记录在 `flights` 表中，而 `AirTrafficController` 模型则会存储记录在 `air_traffic_controllers` 表中。

如果你的模型对应的数据库表不符合此约定，你可以通过在模型上定义一个 `table` 属性来手动指定模型的表名：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 与模型关联的表。
     *
     * @var string
     */
    protected $table = 'my_flights';
}
```

### 主键

Eloquent 还会假设每个模型的对应数据库表都有一个名为 `id` 的主键列。如果必要，你可以在你的模型上定义一个受保护的 `$primaryKey` 属性，以指定一个不同的列作为模型的主键：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 与表关联的主键。
     *
     * @var string
     */
    protected $primaryKey = 'flight_id';
}
```

此外，Eloquent 认为主键是一个递增的整数值，这意味着 Eloquent 将自动将主键转换为整数。如果你希望使用非递增或非数字主键，你必须在模型上定义一个公共的 `$incrementing` 属性，并将之设置为 `false`：

```php
<?php

class Flight extends Model
{
    /**
     * 表明模型的 ID 是否自增。
     *
     * @var bool
     */
    public $incrementing = false;
}
```

如果模型的主键不是整数，你应该在模型上定义一个受保护的 `$keyType` 属性。此属性应该具有 `string` 的值：

```php
<?php

class Flight extends Model
{
    /**
     * 主键 ID 的数据类型。
     *
     * @var string
     */
    protected $keyType = 'string';
}
```

#### “复合”主键

Eloquent 要求每个模型至少有一个唯一标识的“ID”，可以作为其主键。Eloquent 模型不支持“复合”主键。不过，你可以在数据库表中添加额外的多列唯一索引，作为表的唯一识别主键。

### UUID 和 ULID 键

你可能选择使用 UUID 而不是自增整数作为 Eloquent 模型的主键。UUID 是全球唯一的字母数字标识符，长度为 36 个字符。

如果你希望模型使用 UUID 键而不是自增整数键，你可以在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` trait。当然，你应该确保模型有一个[相当于 UUID 的主键列](/docs/11/database/migrations#column-method-uuid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUuids;

    // ...
}

$article = Article::create(['title' => '前往欧洲']);

$article->id; // "8f8e8478-9035-4d23-b9a7-62f4d2612ce5"
```

默认情况下，`HasUuids` trait 将为你的模型生成["有序" UUID](/docs/11/digging-deeper/strings#method-str-ordered-uuid)。这些 UUID 对于索引数据库存储更有效，因为它们可以按字典顺序排序。

你可以通过在模型上定义一个 `newUniqueId` 方法来覆盖给定模型的 UUID 生成过程。此外，你可以通过在模型上定义一个 `uniqueIds` 方法来指定哪些列应接收 UUID：

```php
use Ramsey\Uuid\Uuid;

/**
 * 为模型生成一个新的 UUID。
 */
public function newUniqueId(): string
{
    return (string) Uuid::uuid4();
}

/**
 * 获取应该接收唯一标识符的列。
 *
 * @return array<int, string>
 */
public function uniqueIds(): array
{
    return ['id', 'discount_code'];
}
```

如果你愿意，你可以选择使用 "ULID" 而不是 UUID。ULID 与 UUID 类似；但是，它们只有 26 个字符长。像有序 UUID 一样，ULID 对于数据库索引来说也是按字典顺序可排序的。要使用 ULID，应该在你的模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` trait。你还应该确保模型具有[相当于 ULID 的主键列](/docs/11/database/migrations#column-method-ulid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUlids;

    // ...
}

$article = Article::create(['title' => '前往亚洲']);

$article->id; // "01gd4d3tgrrfqeda94gdbtdk5c"
```

### 时间戳

默认情况下，Eloquent 期望在您的模型对应的数据库表中存在 `created_at` 和 `updated_at` 列。当模型被创建或更新时，Eloquent 将自动设置这些列的值。如果您不希望这些列由 Eloquent 自动管理，您应该在模型上定义一个值为 `false` 的 `$timestamps` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 表示模型是否应该被打上时间戳。
     *
     * @var bool
     */
    public $timestamps = false;
}
```

如果需要自定义模型时间戳的格式，请在模型上设置 `$dateFormat` 属性。此属性决定了日期属性在数据库中的存储格式，以及模型被序列化为数组或 JSON 时的格式：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型日期列的存储格式。
     *
     * @var string
     */
    protected $dateFormat = 'U';
}
```

如果您需要自定义用于存储时间戳的列名，您可以在模型上定义 `CREATED_AT` 和 `UPDATED_AT` 常量：

```php
<?php

class Flight extends Model
{
    const CREATED_AT = 'creation_date';
    const UPDATED_AT = 'updated_date';
}
```

如果您希望在模型进行操作时不修改其 `updated_at` 时间戳，您可以在提供给 `withoutTimestamps` 方法的闭包内对模型进行操作：

```php
Model::withoutTimestamps(fn () => $post->increment(['reads']));
```

### 数据库连接

默认情况下，所有 Eloquent 模型将使用为您的应用程序配置的默认数据库连接。如果您想指定与特定模型交互时应当使用的不同连接，则应该在模型上定义一个 `$connection` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 应由模型使用的数据库连接。
     *
     * @var string
     */
    protected $connection = 'mysql';
}
```

### 默认属性值

默认情况下，新实例化的模型实例不会包含任何属性值。如果您想为模型的某些属性定义默认值，您可以在您的模型上定义一个 `$attributes` 属性。放置在 `$attributes` 数组中的属性值应该是它们刚从数据库中读取出来时的原始“可存储”格式：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型属性的默认值。
     *
     * @var array
     */
    protected $attributes = [
        'options' => '[]',
        'delayed' => false,
    ];
}
```

### 配置 Eloquent 严格性

Laravel 提供了几种方法，允许您在各种情况下配置 Eloquent 的行为和“严格性”。

首先，`preventLazyLoading` 方法接受一个可选的布尔参数，指示是否应防止懒加载。例如，您可能希望只在非生产环境中禁用懒加载，以便您的生产环境即使在生产代码中意外出现懒加载关系也能正常运作。通常，此方法应在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

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

此外，您还可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充无法填充的属性时抛出异常。这可以在本地开发时帮助防止意外错误，因为这时您可能尝试设置尚未添加到模型的 `fillable` 数组中的属性：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

## 检索模型

一旦您创建了一个模型及其关联的数据库表，您就可以开始从您的数据库中检索数据。您可以将每个 Eloquent 模型视为一个强大的查询构建器，允许您流畅地查询与模型关联的数据库表。模型的 `all` 方法将检索模型关联的数据库表中的所有记录：

```php
use App\Models\Flight;

foreach (Flight::all() as $flight) {
    echo $flight->name;
}
```

#### 构建查询

Eloquent 的 `all` 方法会返回模型表中的所有结果。但是，由于每个 Eloquent 模型都作为查询构建器，您可以对查询添加额外的约束，然后调用 `get` 方法来检索结果：

```php
$flights = Flight::where('active', 1)
               ->orderBy('name')
               ->take(10)
               ->get();
```

> [!NOTE]  
> 由于 Eloquent 模型是查询构建器，因此您应查看 Laravel 的所有提供的查询构建器方法。当编写您的 Eloquent 查询时，您可以使用这些方法中的任何一个。

#### 刷新模型

如果您已有一个从数据库检索出的 Eloquent 模型的实例，您可以使用 `fresh` 和 `refresh` 方法“刷新”模型。`fresh` 方法将从数据库重新检索模型。现有的模型实例不会受到影响：

```php
$flight = Flight::where('number', 'FR 900')->first();

$freshFlight = $flight->fresh();
```

`refresh` 方法将使用数据库中的新数据重新填充现有模型，并且还将刷新其所有加载的关系：

```php
$flight = Flight::where('number', 'FR 900')->first();

$flight->number = 'FR 456';

$flight->refresh();

$flight->number; // "FR 900"
```

### 集合

正如我们所见，像 `all` 和 `get` 这样的 Eloquent 方法检索数据库中的多条记录。但是，这些方法并不返回普通的 PHP 数组。相反，它们返回 `Illuminate\Database\Eloquent\Collection` 的实例。

Eloquent 的 `Collection` 类扩展了 Laravel 的基础 `Illuminate\Support\Collection` 类，为与数据集合交互提供了多种有用的方法。例如，`reject` 方法可用于基于调用的闭包的结果移除集合中的模型：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function (Flight $flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法外，Eloquent 集合类还提供了一些额外的方法，这些方法专门用于与 Eloquent 模型的集合交互。

由于所有的 Laravel 集合都实现了 PHP 的可迭代接口，您可以像循环数组一样循环集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

### 分块结果

如果您尝试通过 `all` 或 `get` 方法加载成千上万的 Eloquent 记录，您的应用程序可能会耗尽内存。不是使用这些方法，可以使用 `chunk` 方法更高效地处理大量模型。

`chunk` 方法将检索 Eloquent 模型的一个子集，并将它们传递给闭包进行处理。由于一次只检索当前的 Eloquent 模型块，`chunk` 方法在处理大量模型时将显著减少内存使用：

```php
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

Flight::chunk(200, function (Collection $flights) {
    foreach ($flights as $flight) {
        // ...
    }
});
```

传递给 `chunk` 方法的第一个参数是您希望每个“块”接收的记录数量。作为第二个参数传递的闭包将被调用，并检索从数据库中检索的每个块。将执行数据库查询来检索传递给闭包的每个记录块。

如果您是根据您也将在迭代结果时更新的列来过滤 `chunk` 方法的结果，您应该使用 `chunkById` 方法。在这些情况下使用 `chunk` 方法可能会导致意外和不一致的结果。内部上，`chunkById` 方法将始终检索 `id` 列大于前一个块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->chunkById(200, function (Collection $flights) {
        $flights->each->update(['departed' => false]);
    }, $column = 'id');
```

### 使用懒惰集合分块

`lazy` 方法在工作方式上类似于 [the `chunk` 方法](#chunking-results)，在幕后，它通过分块执行查询。但是，与其将每个块直接传递给回调，不如 `lazy` 方法返回一个扁平化的 [`LazyCollection`](/docs/11/eloquent/eloquent-collections#lazy-collections) 的 Eloquent 模型，让您可以将结果作为单一流进行交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    // ...
}
```

如果您是根据您也将在迭代结果时更新的列来过滤 `lazy` 方法的结果，您应该使用 `lazyById` 方法。内部上，`lazyById` 方法将始终检索 `id` 列大于前一个块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->lazyById(200, $column = 'id')
    ->each->update(['departed' => false]);
```

您可以使用 `lazyByIdDesc` 方法根据 `id` 的降序来过滤结果。

### Cursors（游标）

与 `lazy` 方法类似，`cursor` 方法可用于在迭代数以万计的 Eloquent 模型记录时显著降低应用程序的内存消耗。

`cursor` 方法将只执行一次数据库查询；然而，各个 Eloquent 模型将在实际迭代时才被填充实例化。因此，在迭代游标时，一次只保持一个 Eloquent 模型在内存中。

> [!WARNING]  
> 由于 `cursor` 方法一次只会在内存中保持单个 Eloquent 模型，因此它不能急切加载关联关系。如果您需要急切加载关联，请考虑使用 [`lazy` 方法](#chunking-using-lazy-collections)。

在内部，`cursor` 方法使用 PHP [生成器](https://www.php.net/manual/en/language.generators.overview.php)来实现该功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    // ...
}
```

`cursor` 方法返回一个 `Illuminate\Support\LazyCollection` 实例。[懒惰集合](/docs/11/digging-deeper/collections#lazy-collections)允许您在一次只加载单个模型到内存的同时，使用在典型 Laravel 集合上可用的许多集合方法：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

尽管 `cursor` 方法的内存使用量远低于常规查询（因为每次只保留一个 Eloquent 模型在内存中），但最终仍会耗尽内存。这是[由于 PHP 的 PDO 驱动在其缓冲区内部缓存所有原始查询结果](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果您处理的是非常大量的 Eloquent 记录，请考虑使用 [`lazy` 方法](#chunking-using-lazy-collections)。

### Advanced Subqueries（高级子查询）

#### Subquery Selects（子查询选择）

Eloquent 还提供高级子查询支持，允许您在单个查询中从相关表中提取信息。例如，假设我们有一个飞行 `destinations` 的表和一个到达目的地的 `flights` 表。`flights` 表包含一个 `arrived_at` 列，指示飞机到达目的地的时间。

使用查询构造器的 `select` 和 `addSelect` 方法可用的子查询功能，我们可以选择所有 `destinations` 以及最近到达该目的地的航班的名称，使用单个查询：

```php
use App\Models\Destination;
use App\Models\Flight;

return Destination::addSelect(['last_flight' => Flight::select('name')
    ->whereColumn('destination_id', 'destinations.id')
    ->orderByDesc('arrived_at')
    ->limit(1)
])->get();
```

#### Subquery Ordering（子查询排序）

此外，查询构造器的 `orderBy` 函数支持子查询。继续使用我们的飞行示例，我们可以使用此功能对所有目的地进行排序，基于最后一次航班到达目的地的时间。再次，这可以在执行单个数据库查询的同时完成：

```php
return Destination::orderByDesc(
    Flight::select('arrived_at')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
)->get();
```

## Retrieving Single Models / Aggregates（检索单个模型/聚合）

除了根据给定查询检索所有匹配的记录之外，您还可以使用 `find`、`first` 或 `firstWhere` 方法检索单个记录。这些方法不是返回模型集合，而是返回单个模型实例：

```php
use App\Models\Flight;

// 根据主键检索模型...
$flight = Flight::find(1);

// 检索与查询条件匹配的第一个模型...
$flight = Flight::where('active', 1)->first();

// 替代检索与查询条件匹配的第一个模型...
$flight = Flight::firstWhere('active', 1);
```

有时候您可能希望在没有找到结果时执行一些其他动作。`findOr` 和 `firstOr` 方法将返回单个模型实例，或者如果没有找到结果，执行给定的闭包。闭包返回的值将被视为方法的结果：

```php
$flight = Flight::findOr(1, function () {
    // ...
});

$flight = Flight::where('legs', '>', 3)->firstOr(function () {
    // ...
});
```

#### Not Found Exceptions（未找到的例外情况）

有时候您可能希望在找不到模型时抛出异常。这在路由或控制器中特别有用。`findOrFail` 和 `firstOrFail` 方法将检索查询的第一个结果；但是，如果没有找到结果，将抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

```php
$flight = Flight::findOrFail(1);

$flight = Flight::where('legs', '>', 3)->firstOrFail();
```

如果未捕获 `ModelNotFoundException`，将自动向客户端发送 404 HTTP 响应：

```php
use App\Models\Flight;

Route::get('/api/flights/{id}', function (string $id) {
    return Flight::findOrFail($id);
});
```

### Retrieving or Creating Models（检索或创建模型）

`firstOrCreate` 方法将尝试使用给定的列/值对定位数据库记录。如果在数据库中找不到模型，则将插入合并第一个数组参数与可选的第二个数组参数的属性的记录：

与 `firstOrCreate` 方法类似，`firstOrNew` 方法将尝试定位与给定属性匹配的数据库记录。但是，如果没有找到模型，则会返回一个新的模型实例。请注意，`firstOrNew` 返回的模型尚未持久化到数据库。您需要手动调用 `save` 方法来持久化它：

```php
use App\Models\Flight;

// 检索名为“London to Paris”的航班或在不存在时创建它...
$flight = Flight::firstOrCreate([
    'name' => 'London to Paris'
]);

// 检索名为“London to Paris”的航班或使用名称、delayed 和 arrival_time 属性创建它...
$flight = Flight::firstOrCreate(
    ['name' => 'London to Paris'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);

// 检索名为“London to Paris”的航班或实例化一个新的 Flight 实例...
$flight = Flight::firstOrNew([
    'name' => 'London to Paris'
]);

// 检索名为“Tokyo to Sydney”的航班或实例化一个新的 Flight 实例，并带有名称、delayed 和 arrival_time 属性...
$flight = Flight::firstOrNew(
    ['name' => 'Tokyo to Sydney'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);
```

### Retrieving Aggregates（检索聚合）

在与 Eloquent 模型交互时，您还可以使用 `count`、`sum`、`max` 和其他 [聚合方法](/docs/11/database/queries#aggregates)提供的 Laravel [query builder](/docs/11/database/queries)。正如您所期望的，这些方法返回一个标量值而不是 Eloquent 模型实例：

```php
$count = Flight::where('active', 1)->count();

$max = Flight::where('active', 1)->max('price');
```

## Inserting and Updating Models（插入和更新模型）

### Inserts（插入）

当然，使用 Eloquent 时，我们不仅需要从数据库中检索模型。我们还需要插入新的记录。幸运的是，Eloquent 使其变得简单。要将新记录插入到数据库中，您应该实例化一个新的模型实例并设置模型的属性。然后，在模型实例上调用 `save` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * Store a new flight in the database.
     */
    public function store(Request $request): RedirectResponse
    {
        // Validate the request...

        $flight = new Flight;

        $flight->name = $request->name;

        $flight->save();

        return redirect('/flights');
    }
}
```

在此示例中，我们将传入的 HTTP 请求的 `name` 字段分配给 `App\Models\Flight` 模型实例的 `name` 属性。当我们调用 `save` 方法时，将在数据库中插入一条记录。在调用 `save` 方法时，模型的 `created_at` 和 `updated_at` 时间戳将自动设置，因此无需手动设置它们。

或者，您可以使用 `create` 方法通过单个 PHP 语句“保存”新模型。`create` 方法将返回插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

但是，在使用 `create` 方法之前，您需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为所有 Eloquent 模型默认受到大规模赋值漏洞的保护。要了解有关大规模赋值的更多信息，请参阅 [大规模赋值文档](#mass-assignment)。

### Updates（更新）

`save` 方法也可用来更新已存在于数据库中的模型。要更新模型，您应该检索它并设置您希望更新的任何属性。然后，应该调用模型的 `save` 方法。同样，`updated_at` 时间戳将自动更新，因此无需手动设置其值：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->name = 'Paris to London';

$flight->save();
```

有时，您可能需要更新现有模型或在没有匹配模型存在时创建新模型。与 `firstOrCreate` 方法类似，`updateOrCreate` 方法持久化模型，因此不需要手动调用 `save` 方法。

在下面的示例中，如果存在一个从 `Oakland` 出发到 `San Diego` 目的地的航班，它的 `price` 和 `discounted` 列将被更新。如果没有这样的航班存在，则将创建一个具有合并第一个参数数组与第二个参数数组的属性的新航班：

```php
$flight = Flight::updateOrCreate(
    ['departure' => 'Oakland', 'destination' => 'San Diego'],
    ['price' => 99, 'discounted' => 1]
);
```

### 批量更新

您也可以对匹配给定查询的模型进行更新。在这个例子中，所有被标记为活跃（`active`）且目的地为 `San Diego` 的航班将被标记为延误：

```php
Flight::where('active', 1)
      ->where('destination', 'San Diego')
      ->update(['delayed' => 1]);
```

`update` 方法期望一个由列名和值对组成的数组，表示应该更新的列。`update` 方法返回受影响的行数。

> [!WARNING]  
> 通过 Eloquent 进行批量更新时，`saving`、`saved`、`updating` 和 `updated` 模型事件不会为更新的模型触发。这是因为执行批量更新时，模型实际上从未被检索过。

### 检查属性变化

Eloquent 提供了 `isDirty`、`isClean` 和 `wasChanged` 方法来检查模型的内部状态，并确定自模型最初检索以来其属性的变化。

`isDirty` 方法确定自从模型被检索以来，模型的任何属性是否发生了变化。您可以传递一个具体的属性名称或一组属性到 `isDirty` 方法，以确定任何属性是否 "脏"。`isClean` 方法将确定自模型被检索以来，一个属性是否保持不变。这个方法也接受一个可选的属性参数：

```php
use App\Models\User;

$user = User::create([
    'first_name' => 'Taylor',
    'last_name' => 'Otwell',
    'title' => 'Developer',
]);

$user->title = 'Painter';

$user->isDirty(); // true
$user->isDirty('title'); // true
$user->isDirty('first_name'); // false
$user->isDirty(['first_name', 'title']); // true

$user->isClean(); // false
$user->isClean('title'); // false
$user->isClean('first_name'); // true
$user->isClean(['first_name', 'title']); // false

$user->save();

$user->isDirty(); // false
$user->isClean(); // true
```

`wasChanged` 方法确定当模型在当前请求周期内最后一次保存时，其属性是否被更改。如果需要，您可以传递一个属性名来查看特定属性是否有变化：

```php
$user = User::create([
    'first_name' => 'Taylor',
    'last_name' => 'Otwell',
    'title' => 'Developer',
]);

$user->title = 'Painter';

$user->save();

$user->wasChanged(); // true
$user->wasChanged('title'); // true
$user->wasChanged(['title', 'slug']); // true
$user->wasChanged('first_name'); // false
$user->wasChanged(['first_name', 'title']); // true
```

`getOriginal` 方法返回一个数组，包含模型原始属性，不管从检索起模型是否发生了任何变化。如果需要，您可以传递一个特定的属性名来获取特定属性的原始值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->name = "Jack";
$user->name; // Jack

$user->getOriginal('name'); // John
$user->getOriginal(); // 原始属性的数组...
```

### 批量赋值

您可以使用 `create` 方法通过一个 PHP 语句来 "保存" 一个新模型。插入的模型实例将由方法返回给您：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

然而，在使用 `create` 方法之前，您需要在模型类上指定一个 `fillable` 或 `guarded` 属性。这些属性是必需的，因为所有 Eloquent 模型默认都被保护免受大量赋值漏洞的影响。

大量赋值漏洞发生在用户通过 HTTP 请求传递一个非预期字段，而该字段则改变了您数据库中未预期的列。例如，恶意用户可能通过 HTTP 请求发送一个 `is_admin` 参数，然后被传递给模型的 `create` 方法，允许用户将自己升级为管理员。

因此，要开始使用，您应该定义哪些模型属性想要使其可大量赋值。您可以使用模型上的 `$fillable` 属性来实现这一点。例如，让我们使 `Flight` 模型的 `name` 属性可大量赋值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 可大量赋值的属性。
     *
     * @var array
     */
    protected $fillable = ['name'];
}
```

一旦您指定了哪些属性可大量赋值，您可以使用 `create` 方法来在数据库中插入新记录。`create` 方法返回新创建的模型实例：

```php
$flight = Flight::create(['name' => 'London to Paris']);
```

如果您已有一个模型实例，您可以使用 `fill` 方法来用一个属性数组填充它：

```php
$flight->fill(['name' => 'Amsterdam to Frankfurt']);
```

### 大量赋值和 JSON 列

在赋值 JSON 列时，每个列的可大量赋值键必须在模型的 `$fillable` 数组中指定。出于安全性考虑，当使用 `guarded` 属性时，Laravel 不支持更新嵌套的 JSON 属性：

```php
/**
 * 可大量赋值的属性。
 *
 * @var array
 */
protected $fillable = [
    'options->enabled',
];
```

#### 允许大量赋值

如果您希望使所有的属性都可以被大量赋值，您可以将模型的 `$guarded` 属性定义为一个空数组。如果您选择不保护您的模型，您应特别小心，始终手工制作传递给 Eloquent 的 `fill`、`create` 和 `update` 方法的数组：

```php
/**
 * 不是大量赋值的属性。
 *
 * @var array
 */
protected $guarded = [];
```

#### 大量赋值异常

默认情况下，在进行大量赋值操作时，不在 `$fillable` 数组中的属性会被默默地丢弃。在生产环境中，这是预期的行为；然而，在本地开发过程中，模型更改不生效可能导致混淆。

如果您愿意，您可以指示 Laravel 在尝试填充一个不可填充的属性时抛出异常，通过调用 `preventSilentlyDiscardingAttributes` 方法。通常，这个方法应该在您应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
}
```

### Upserts

Eloquent 的 `upsert` 方法可用于在单个原子操作中更新或创建记录。该方法的第一个参数包含要插入或更新的值，第二个参数列出在关联表中唯一标识记录的列。该方法的第三个也是最后一个参数是一个数组，它包含如果数据库中已存在匹配的记录时应更新的列。如果在模型上启用了时间戳，`upsert` 方法会自动设置 `created_at` 和 `updated_at` 时间戳：

```php
Flight::upsert([
    ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
    ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
], uniqueBy: ['departure', 'destination'], update: ['price']);
```

> [!WARNING]  
> 除了 SQL Server 外的所有数据库要求 `upsert` 方法第二个参数中的列必须具有“主”或“唯一”索引。此外，MySQL 数据库驱动程序会忽略 `upsert` 方法的第二个参数，并始终使用表的“主”和“唯一”索引来检测现有记录。

### 删除模型

要删除一个模型，您可以在模型实例上调用 `delete` 方法：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->delete();
```

您可以调用 `truncate` 方法来删除与模型相关联的所有数据库记录。`truncate` 操作也会重置模型相关表上的任何自增 ID：

```php
Flight::truncate();
```

#### 删除模型实例通过其主键

在上面的例子中，我们从数据库中检索模型然后调用 `delete` 方法。然而，如果你知道模型的主键，你可以不用明确检索它就通过调用 `destroy` 方法来删除该模型。 `destroy` 方法除了接受单一的主键外，还可以接受多个主键、一个主键数组或一组主键的[集合](/docs/11/digging-deeper/collections)：

```php
Flight::destroy(1);

Flight::destroy(1, 2, 3);

Flight::destroy([1, 2, 3]);

Flight::destroy(collect([1, 2, 3]));
```

> [!WARNING]  
> `destroy` 方法会逐个加载每个模型并调用 `delete` 方法，这样才能正确地为每个模型触发 `deleting` 和 `deleted` 事件。

#### 使用查询删除模型

当然，你可以构建一个 Eloquent 查询来删除符合你查询条件的所有模型。在此例中，我们将删除所有被标记为不活跃的航班。与批量更新类似，批量删除不会为被删除的模型触发模型事件：

```php
$deleted = Flight::where('active', 0)->delete();
```

> [!WARNING]  
> 通过 Eloquent 执行批量删除语句时，不会为被删除模型触发 `deleting` 和 `deleted` 模型事件。这是因为执行删除语句时，模型实际上从未被检索。

### 软删除

除了从数据库中实际移除记录外，Eloquent 还可以对模型执行"软删除"。当模型被软删除时，它们实际上并没有从数据库中移除。相反，在模型上设置了 `deleted_at` 属性，标明模型被"删除"的日期和时间。要为模型启用软删除，请在模型中添加 `Illuminate\Database\Eloquent\SoftDeletes` trait：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Flight extends Model
{
    use SoftDeletes;
}
```

> [!NOTE]  
> `SoftDeletes` trait 会自动将 `deleted_at` 属性转换成一个 `DateTime` / `Carbon` 实例。

你应该还要在你的数据库表中添加 `deleted_at` 列。Laravel [模式构建器](/docs/11/database/migrations) 包含一个助手方法来创建此列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('flights', function (Blueprint $table) {
    $table->softDeletes();
});

Schema::table('flights', function (Blueprint $table) {
    $table->dropSoftDeletes();
});
```

现在，当你对模型调用 `delete` 方法时，`deleted_at` 列将设为当前日期和时间。然而，模型的数据库记录将保留在表中。查询使用软删除的模型时，软删除的模型将会自动从所有查询结果中排除。

要确定给定模型实例是否已被软删除，你可以使用 `trashed` 方法：

```php
if ($flight->trashed()) {
    // ...
}
```

#### 恢复软删除的模型

有时你可能想要"撤销删除"一个软删除的模型。要恢复一个软删除的模型，你可以在模型实例上调用 `restore` 方法。`restore` 方法将模型的 `deleted_at` 列设置为 `null`：

```php
$flight->restore();
```

你还可以在查询中使用 `restore` 方法来恢复多个模型。同样，像其他"批量"操作一样，这不会为恢复的模型触发任何模型事件：

```php
Flight::withTrashed()
        ->where('airline_id', 1)
        ->restore();
```

`restore` 方法也能用于构建[关系](/docs/11/eloquent/eloquent-relationships)查询时：

```php
$flight->history()->restore();
```

#### 永久删除模型

有时你可能需要从数据库中真正移除一个模型。你可以使用 `forceDelete` 方法从数据库表中永久删除一个软删除的模型：

```php
$flight->forceDelete();
```

在构建 Eloquent 关系查询时也可以使用 `forceDelete` 方法：

```php
$flight->history()->forceDelete();
```

### 查询软删除的模型

#### 包括软删除的模型

如上所述，软删除的模型在查询结果中会自动排除。然而，你可以通过在查询上调用 `withTrashed` 方法来强制包含软删除的模型在查询结果中：

```php
use App\Models\Flight;

$flights = Flight::withTrashed()
                ->where('account_id', 1)
                ->get();
```

在构建[关系](/docs/11/eloquent/eloquent-relationships)查询时，也可以调用 `withTrashed` 方法：

```php
$flight->history()->withTrashed()->get();
```

#### 只检索软删除的模型

`onlyTrashed` 方法将检索**仅限**软删除的模型：

```php
$flights = Flight::onlyTrashed()
                ->where('airline_id', 1)
                ->get();
```

## 清理模型

有时你可能需要定期删除不再需要的模型。为此，你可以为你希望定期清理的模型添加 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` trait。在为模型添加了其中一个 trait 后，实现一个返回 Eloquent 查询构建器的 `prunable` 方法，用于解析不再需要的模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class Flight extends Model
{
    use Prunable;

    /**
     * 获取可清理模型查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subMonth());
    }
}
```

当将模型标记为 `Prunable` 时，你还可以在模型上定义一个 `pruning` 方法。在删除模型之前，该方法将被调用。在模型从数据库中被永久移除之前，此方法可用于删除与模型相关联的任何其他资源，如存储的文件：

```php
/**
 * 为清理准备模型。
 */
protected function pruning(): void
{
    // ...
}
```

在为你可清理的模型配置好之后，你应该在应用程序的 `routes/console.php` 文件中安排 `model:prune` Artisan 命令。你可以自由选择合适的间隔运行此命令：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('model:prune')->daily();
```

在幕后，`model:prune` 命令将自动侦测应用的 `app/Models` 目录中的 "Prunable" 模型。如果你的模型位置不同，你可以使用 `--model` 选项来指定模型类名：

```php
Schedule::command('model:prune', [
    '--model' => [Address::class, Flight::class],
])->daily();
```

如果你希望在清理所有其他检测到的模型时排除某些模型，你可以使用 `--except` 选项：

```php
Schedule::command('model:prune', [
    '--except' => [Address::class, Flight::class],
])->daily();
```

你可以执行带有 `--pretend` 选项的 `model:prune` 命令来测试你的 `prunable` 查询。当仿真时，`model:prune` 命令将只报告如果命令实际运行，将清理多少记录：

```shell
php artisan model:prune --pretend
```

> [!WARNING]  
> 如果软删除的模型符合可清理查询，则将被永久删除（`forceDelete`）。

#### 批量清理

当模型使用 `Illuminate\Database\Eloquent\MassPrunable` trait 标记时，模型将通过使用批量删除查询从数据库中删除。因此，不会调用 `pruning` 方法，也不会触发 `deleting` 和 `deleted` 模型事件。这是因为在删除前模型从未被检索，使得清理过程更加高效：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\MassPrunable;

class Flight extends Model
{
    use MassPrunable;

    /**
     * 获取可清理模型查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subMonth());
    }
}
```

## 复制模型

你可以使用 `replicate` 方法创建一个现有模型实例的未保存副本。当你有很多共享许多相同属性的模型实例时，此方法特别有用：

```php
use App\Models\Address;

$shipping = Address::create([
    'type' => 'shipping',
    'line_1' => '123 Example Street',
    'city' => 'Victorville',
    'state' => 'CA',
    'postcode' => '90001',
]);

$billing = $shipping->replicate()->fill([
    'type' => 'billing'
]);

$billing->save();
```

要排除一个或多个属性，不被复制到新模型，你可以传递一个数组给 `replicate` 方法：

```php
$flight = Flight::create([
    'destination' => 'LAX',
    'origin' => 'LHR',
    'last_flown' => '2020-03-04 11:00:00',
    'last_pilot_id' => 747,
]);

$flight = $flight->replicate([
    'last_flown',
    'last_pilot_id'
]);
```

## 查询作用域

### 全局作用域

全局作用域允许你为给定模型的所有查询添加约束。Laravel 自己的[软删除](#软删除)功能使用全局作用域来只从数据库中检索“非删除”的模型。编写你自己的全局作用域可以提供一种方便的方式，确保给定模型的每个查询都接受某些约束。

#### 生成作用域

要生成一个新的全局作用域，你可以调用 `make:scope` Artisan 命令，生成的作用域将放置在你的应用程序的 `app/Models/Scopes` 目录中：

```shell
php artisan make:scope AncientScope
```

#### 编写全局作用域

编写全局作用域很简单。首先，使用 `make:scope` 命令生成一个实现 `Illuminate\Database\Eloquent\Scope` 接口的类。`Scope` 接口要求你实现一个方法：`apply`。`apply` 方法可以根据需要向查询添加 `where` 约束或其他类型的子句：

```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AncientScope implements Scope
{
    /**
     * 将作用域应用到给定的 Eloquent 查询构建器。
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('created_at', '<', now()->subYears(2000));
    }
}
```

> [!NOTE]  
> 如果你的全局作用域正在向查询的 select 子句中添加列，你应该使用 `addSelect` 方法而不是 `select`。这样可以防止无意中替换查询现有的 select 子句。

````php
#### 应用全局作用域

要给模型分配一个全局作用域，可以简单地在模型上使用 `ScopedBy` 属性：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;

#[ScopedBy([AncientScope::class])]
class User extends Model
{
    //
}
````

或者，你可以通过覆盖模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法来手动注册全局作用域。`addGlobalScope` 方法接受作用域实例作为唯一参数：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new AncientScope);
    }
}
```

在上面的例子中，给 `App\Models\User` 模型添加了作用域之后，调用 `User::all()` 方法将执行以下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

#### 匿名全局作用域

Eloquent 也允许你使用闭包定义全局作用域，这对于不需要单独类的简单作用域来说特别有用。当使用闭包定义全局作用域时，应该在 `addGlobalScope` 方法的第一个参数传递一个你自己选择的作用域名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope('ancient', function (Builder $builder) {
            $builder->where('created_at', '<', now()->subYears(2000));
        });
    }
}
```

#### 移除全局作用域

如果你想为给定查询移除一个全局作用域，可以使用 `withoutGlobalScope` 方法。此方法接受全局作用域的类名称作为唯一参数：

```php
User::withoutGlobalScope(AncientScope::class)->get();
```

或者，如果你是使用闭包定义的全局作用域，应该传递你指定给全局作用域的字符串名称：

```php
User::withoutGlobalScope('ancient')->get();
```

如果你想移除查询的一个或多个甚至所有全局作用域，可以使用 `withoutGlobalScopes` 方法：

```php
// 移除所有全局作用域...
User::withoutGlobalScopes()->get();

// 移除一些全局作用域...
User::withoutGlobalScopes([
    FirstScope::class, SecondScope::class
])->get();
```

### 本地作用域

本地作用域允许你定义可在应用中简单重用的常见查询约束集合。例如，你可能经常需要检索所有被认为是 "popular" 的用户。要定义作用域，请在 Eloquent 模型方法前添加 `scope` 前缀。

作用域应该总是返回相同的查询构建器实例或 `void`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 作用域一个查询以只包括热门用户。
     */
    public function scopePopular(Builder $query): void
    {
        $query->where('votes', '>', 100);
    }

    /**
     * 作用域一个查询以只包括活跃用户。
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('active', 1);
    }
}
```

#### 使用本地作用域

定义作用域后，你可能会在查询模型时调用作用域方法。但是，在调用方法时不应包含 `scope` 前缀。你甚至可以连锁调用各种作用域：

```php
use App\Models\User;

$users = User::popular()->active()->orderBy('created_at')->get();
```

通过 `or` 查询运算符结合多个 Eloquent 模型作用域可能需要使用闭包来实现正确的[逻辑分组](/docs/11/database/queries#logical-grouping)：

```php
$users = User::popular()->orWhere(function (Builder $query) {
    $query->active();
})->get();
```

然而，由于这可能很麻烦，Laravel 提供了 "高阶" `orWhere` 方法，允许你流畅地将作用域链在一起，无需使用闭包：

```php
$users = User::popular()->orWhere->active()->get();
```

#### 动态作用域

有时你可能希望定义一个接受参数的作用域。首先，只需向你的作用域方法签名中添加额外的参数。作用域参数应在 `$query` 参数之后定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 作用域一个查询以只包含特定类型的用户。
     */
    public function scopeOfType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }
}
```

添加了预期参数到作用域方法签名后，你可以在调用作用域时传递参数：

```php
$users = User::ofType('admin')->get();
```

## 比较模型

````
有时你可能需要确定两个模型是否是 "相同" 的。`is` 和 `isNot` 方法可用于快速验证两个模型是否具有相同的主键、表和数据库连接：

```php
if ($post->is($anotherPost)) {
    // ...
}

if ($post->isNot($anotherPost)) {
    // ...
}
````

当你使用 `belongsTo`, `hasOne`, `morphTo`, 和 `morphOne` [关系](/docs/11/eloquent/eloquent-relationships)时，`is` 和 `isNot` 方法也可以使用。当你想要比较相关模型而不发出查询来检索模型时，这个方法特别有用：

```php
if ($post->author()->is($user)) {
    // ...
}
```

## 事件

> [!NOTE]
> 想直接将 Eloquent 事件广播到你的客户端应用？查看 Laravel 的 [模型事件广播](/docs/11/digging-deeper/broadcasting#model-broadcasting)。

Eloquent 模型触发了几个事件，允许你挂接到模型生命周期的以下时刻：`retrieved`, `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, `trashed`, `forceDeleting`, `forceDeleted`, `restoring`, `restored`, 和 `replicating`。

当从数据库检索现有的模型时，会触发 `retrieved` 事件。当第一次保存新模型时，将触发 `creating` 和 `created` 事件。当现有模型被修改并且调用 `save` 方法时，将会触发 `updating` / `updated` 事件。当创建或更新模型时，即使模型的属性没有被更改，也会触发 `saving` / `saved` 事件。以 `-ing` 结尾的事件名称在对模型所做的更改被持久化之前被调度，而以 `-ed` 结尾的事件 在更改被持久化到模型之后触发。

要开始监听模型事件，请在你的 Eloquent 模型上定义一个 `$dispatchesEvents` 属性。这个属性将 Eloquent 模型的生命周期的各个点映射到你自己的[事件类](/docs/11/packages/sail)。每个模型事件类都应该期望通过其构造函数接收受影响模型的实例：

```php
<?php

namespace App\Models;

use App\Events\UserDeleted;
use App\Events\UserSaved;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 模型的事件映射。
     *
     * @var array<string, string>
     */
    protected $dispatchesEvents = [
        'saved' => UserSaved::class,
        'deleted' => UserDeleted::class,
    ];
}
```

在定义并映射你的 Eloquent 事件后，你可以使用[事件监听器](/docs/11/packages/sail#defining-listeners)来处理事件。

> [!WARNING]
> 当通过 Eloquent 发起大规模更新或删除查询时，不会为受影响的模型调度 `saved`, `updated`, `deleting`, 和 `deleted` 模型事件。这是因为在执行大规模更新或删除时，模型根本不会被检索。

### 使用闭包

如果需要在多个模型事件被触发时执行操作，可以注册闭包。通常，这些闭包应该在模型的 `booted` 方法中注册：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // ...
        });
    }
}
```

如有需要，当注册模型事件时，可以使用 [可排队的匿名事件监听器](/docs/11/packages/sail#queuable-anonymous-event-listeners)。这会指示 Laravel 使用应用程序的 [队列](/docs/11/digging-deeper/queues) 在后台执行模型事件监听器：

```php
use function Illuminate\Events\queueable;

static::created(queueable(function (User $user) {
    // ...
}));
```

### 观察者

#### 定义观察者

如果监听给定模型的许多事件，可以使用观察者将所有监听器分组到一个类中。观察者类的方法名反映了您想要监听的 Eloquent 事件。这些方法中的每一个都将受影响的模型作为唯一参数。`make:observer` Artisan 命令是创建新的观察者类最简单的方式：

```shell
php artisan make:observer UserObserver --model=User
```

该命令会将新的观察者放在 `app/Observers` 目录中。如果此目录不存在，Artisan 会为您创建它。您的新观察者看起来如下：

```php
<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * 处理 User "created" 事件。
     */
    public function created(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "updated" 事件。
     */
    public function updated(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "deleted" 事件。
     */
    public function deleted(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "restored" 事件。
     */
    public function restored(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "forceDeleted" 事件。
     */
    public function forceDeleted(User $user): void
    {
        // ...
    }
}
```

要注册观察者，可以将 `ObservedBy` 属性放在相应的模型上：

```php
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    //
}
```

或者，您可以通过在模型上调用 `observe` 方法来手动注册一个观察者。你可以在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册观察者：

```php
use App\Models\User;
use App\Observers\UserObserver;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

#### 观察者和数据库事务

当模型在数据库事务中创建时，您可能希望指示观察者仅在数据库事务提交后执行其事件处理程序。您可以通过在观察者上实现 `ShouldHandleEventsAfterCommit` 接口来实现这一点。如果没有正在进行的数据库事务，事件处理程序将立即执行：

```php
<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class UserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * 处理 User "created" 事件。
     */
    public function created(User $user): void
    {
        // ...
    }
}
```

### 静默事件

您可能偶尔需要临时“静默”模型触发的所有事件。您可以使用 `withoutEvents` 方法来实现。`withoutEvents` 方法接受一个闭包作为唯一参数。在此闭包内执行的任何代码都不会触发模型事件，闭包返回的任何值将由 `withoutEvents` 方法返回：

```php
use App\Models\User;

$user = User::withoutEvents(function () {
    User::findOrFail(1)->delete();

    return User::find(2);
});
```

#### 不触发事件地保存单个模型

有时你可能希望“保存”特定模型而不触发任何事件。你可以使用 `saveQuietly` 方法来完成这项操作：

```php
$user = User::findOrFail(1);

$user->name = 'Victoria Faith';

$user->saveQuietly();
```

你也可以不触发任何事件地进行“更新”、“删除”、“软删除”、“恢复”和“复制”特定模型：

```php
$user->deleteQuietly();
$user->forceDeleteQuietly();
$user->restoreQuietly();
```
