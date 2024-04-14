---
title: Laravel 集合
---

# 集合

[[toc]]

## 简介

`Illuminate\Support\Collection` 类为处理数据数组提供了流利、便利的封装。例如，请查看以下代码。我们将使用 `collect` 辅助函数从数组创建新的 collection 实例，对每个元素运行 `strtoupper` 函数，然后移除所有空元素：

```php
$collection = collect(['taylor', 'abigail', null])->map(function (?string $name) {
    return strtoupper($name);
})->reject(function (string $name) {
    return empty($name);
});
```

如您所见，`Collection` 类允许您链式调用其方法，以流畅地映射和简化底层数组。一般来说，collections 是不可变的，这意味着每个 `Collection` 方法都返回全新的 `Collection` 实例。

## 创建 Collections

正如上面提到的，`collect` 辅助函数为给定数组返回新的 `Illuminate\Support\Collection` 实例。因此，创建一个 collection 就像这样简单：

```php
$collection = collect([1, 2, 3]);
```

> [!NOTE] > [Eloquent](/docs/11/eloquent/eloquent) 查询的结果始终返回为 `Collection` 实例。

## 扩展 Collections

Collections 是“可宏编程的”，这允许您在运行时向 `Collection` 类添加附加方法。`Illuminate\Support\Collection` 类的 `macro` 方法接受一个闭包，该闭包在调用宏时将被执行。宏闭包可以通过 `$this` 访问 collection 的其他方法，就好像它是 collection 类的一个真实方法。例如，以下代码向 `Collection` 类添加了一个 `toUpper` 方法：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

Collection::macro('toUpper', function () {
    return $this->map(function (string $value) {
        return Str::upper($value);
    });
});

$collection = collect(['first', 'second']);

$upper = $collection->toUpper();

// ['FIRST', 'SECOND']
```

通常，您应该在 [服务提供者](/docs/11/architecture-concepts/providers) 的 `boot` 方法中声明 collection 宏。

### 宏参数

如果需要，您可以定义接受额外参数的宏：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Lang;

Collection::macro('toLocale', function (string $locale) {
    return $this->map(function (string $value) use ($locale) {
        return Lang::get($value, [], $locale);
    });
});

$collection = collect(['first', 'second']);

$translated = $collection->toLocale('es');
```

## 方法列表

#### `all()`

`all` 方法返回由 collection 表示的底层数组：

```php
collect([1, 2, 3])->all();

// [1, 2, 3]
```

#### `average()`

`average()` 方法的别名。

#### `avg()`

`avg` 方法返回给定键的[平均值](https://en.wikipedia.org/wiki/Average)：

```php
$average = collect([
    ['foo' => 10],
    ['foo' => 10],
    ['foo' => 20],
    ['foo' => 40]
])->avg('foo');

// 20

$average = collect([1, 1, 2, 4])->avg();

// 2
```

#### `chunk()`

`chunk` 方法将 collection 分解成多个更小的 collection，每个指定大小：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7]);

$chunks = $collection->chunk(4);

$chunks->all();

// [[1, 2, 3, 4], [5, 6, 7]]
```

此方法在使用如 [Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/) 这样的网格系统的 [views](/docs/11/basics/views) 中特别有用。例如，想象你有一组 [Eloquent](/docs/11/eloquent/eloquent) 模型，你想在网格中显示：

```blade
@foreach ($products->chunk(3) as $chunk)
    <div class="row">
        @foreach ($chunk as $product)
            <div class="col-xs-4">{{ $product->name }}</div>
        @endforeach
    </div>
@endforeach
```

#### `chunkWhile()`

`chunkWhile` 方法基于给定回调的评估将 collection 分解成多个更小的 collection。传递给闭包的 `$chunk` 变量可用于检查前一个元素：

```php
$collection = collect(str_split('AABBCCCD'));

$chunks = $collection->chunkWhile(function (string $value, int $key, Collection $chunk) {
    return $value === $chunk->last();
});

$chunks->all();

// [['A', 'A'], ['B', 'B'], ['C', 'C', 'C'], ['D']]
```

#### `collapse()`

`collapse` 方法将数组的 collection 折叠成一个平坦的单一 collection：

```php
$collection = collect([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]);

$collapsed = $collection->collapse();

$collapsed->all();

// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

#### `collect()`

`collect` 方法使用当前 collection 中的项目返回一个新的 `Collection` 实例：

```php
$collectionA = collect([1, 2, 3]);

$collectionB = $collectionA->collect();

$collectionB->all();

// [1, 2, 3]
```

`collect` 方法主要用于将[懒惰 collections](#lazy-collections) 转换为标准 `Collection` 实例：

```php
$lazyCollection = LazyCollection::make(function () {
    yield 1;
    yield 2;
    yield 3;
});

$collection = $lazyCollection->collect();

$collection::class;

// 'Illuminate\Support\Collection'

$collection->all();

// [1, 2, 3]
```

> [!NOTE]
> 当你有一个 `Enumerable` 实例且需要非懒惰的 collection 实例时，`collect` 方法特别有用。由于 `collect()` 是 `Enumerable` 合约的一部分，你可以安全地使用它来获取 `Collection` 实例。

#### `combine()`

`combine` 方法将 collection 的值作为键与另一个数组或 collection 的值结合：

```php
$collection = collect(['name', 'age']);

$combined = $collection->combine(['George', 29]);

$combined->all();

// ['name' => 'George', 'age' => 29]
```

#### `concat()`

`concat` 方法将给定 `array` 或 collection 的值附加到另一个 collection 的末尾：

```php
$collection = collect(['John Doe']);

$concatenated = $collection->concat(['Jane Doe'])->concat(['name' => 'Johnny Doe']);

$concatenated->all();

// ['John Doe', 'Jane Doe', 'Johnny Doe']
```

`concat` 方法为附加到原始 collection 的项目重新索引键。若要在关联 collections 中维护键，请参见 [merge](#method-merge) 方法。

#### `contains()`

`contains` 方法确定 collection 是否包含给定项目。您可以传递一个闭包给 `contains` 方法来确定 collection 中是否存在与给定真实测试匹配的元素：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->contains(function (int $value, int $key) {
    return $value > 5;
});

// false
```

或者，您可以传递一个字符串给 `contains` 方法来确定 collection 是否包含给定项目值：

```php
$collection = collect(['name' => 'Desk', 'price' => 100]);

$collection->contains('Desk');

// true

$collection->contains('New York');

// false
```

您也可以传递一个键/值对给 `contains` 方法，它将确定给定对是否存在于 collection 中：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->contains('product', 'Bookcase');

// false
```

`contains` 方法在检查项目值时使用“松散”比较，意味着具有整数值的字符串将被认为等于同一值的整数。使用 [`containsStrict`](#method-containsstrict) 方法使用“严格”比较进行筛选。

`contains` 的相反方法，参见 [doesntContain](#method-doesntcontain) 方法。

#### `containsOneItem()`

`containsOneItem` 方法确定 collection 是否仅包含一个项目：

```php
collect([])->containsOneItem();

// false

collect(['1'])->containsOneItem();

// true

collect(['1', '2'])->containsOneItem();

// false
```

#### `containsStrict()`

此方法与 [`contains`](#method-contains) 方法具有相同的签名；然而，所有值都使用“严格”比较进行比较。

> [!NOTE]
> 使用 [Eloquent Collections](/docs/11/eloquent/eloquent-collections#method-contains) 时，该方法的行为会有所不同。

#### `count()`

`count` 方法返回 collection 中项目的总数：

```php
$collection = collect([1, 2, 3, 4]);

$collection->count();

// 4
```

#### `countBy()`

`countBy` 方法计算 collection 中值的出现次数。默认情况下，该方法计算每个元素的出现次数，允许您计算 collection 中某些“类型”的元素：

```php
$collection = collect([1, 2, 2, 2, 3]);

$counted = $collection->countBy();

$counted->all();

// [1 => 1, 2 => 3, 3 => 1]
```

您通过闭包将闭包传递给 `countBy` 方法来按自定义值统计所有项目：

```php
$collection = collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com']);

$counted = $collection->countBy(function (string $email) {
    return substr(strrchr($email, "@"), 1);
});

$counted->all();

// ['gmail.com' => 2, 'yahoo.com' => 1]
```

#### `crossJoin()`

`crossJoin` 方法在给定的数组或 collections 中交叉连接 collection 的值，返回所有可能排列的笛卡尔积：

```php
$collection = collect([1, 2]);

$matrix = $collection->crossJoin(['a', 'b']);

$matrix->all();

/*
    [
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
    ]
*/

$collection = collect([1, 2]);

$matrix = $collection->crossJoin(['a', 'b'], ['I', 'II']);

$matrix->all();

/*
    [
        [1, 'a', 'I'],
        [1, 'a', 'II'],
        [1, 'b', 'I'],
        [1, 'b', 'II'],
        [2, 'a', 'I'],
        [2, 'a', 'II'],
        [2, 'b', 'I'],
        [2, 'b', 'II'],
    ]
*/
```

#### `dd()`

`dd` 方法打印 collection 的项目并结束脚本执行：

```php
$collection = collect(['John Doe', 'Jane Doe']);

$collection->dd();

/*
    Collection {
        #items: array:2 [
            0 => "John Doe"
            1 => "Jane Doe"
        ]
    }
*/
```

如果您不想在打印 collection 之后停止执行脚本，请改用 [`dump`](#method-dump) 方法。

#### `diff()`

`diff` 方法基于值将 collection 与另一个 collection 或纯 PHP `array` 进行比较。此方法将返回原始 collection 中未出现在给定 collection 中的值：

```php
$collection = collect([1, 2, 3, 4, 5]);

$diff = $collection->diff([2, 4, 6, 8]);

$diff->all();

// [1, 3, 5]
```

> [!NOTE]
> 使用 [Eloquent Collections](/docs/11/eloquent/eloquent-collections#method-diff) 时，此方法的行为会发生变化。

#### `diffAssoc()`

`diffAssoc` 方法基于键和值将 collection 与另一个 collection 或纯 PHP `array` 进行比较。此方法将返回原始 collection 中未出现在给定 collection 中的键值对：

```php
$collection = collect([
    'color' => 'orange',
    'type' => 'fruit',
    'remain' => 6,
]);

$diff = $collection->diffAssoc([
    'color' => 'yellow',
    'type' => 'fruit',
    'remain' => 3,
    'used' => 6,
]);

$diff->all();

// ['color' => 'orange', 'remain' => 6]
```

#### `diffAssocUsing()`

与 `diffAssoc` 不同，`diffAssocUsing` 接受一个由用户提供的回调函数用于索引比较：

```php
$collection = collect([
    'color' => 'orange',
    'type' => 'fruit',
    'remain' => 6,
]);

$diff = $collection->diffAssocUsing([
    'Color' => 'yellow',
    'Type' => 'fruit',
    'Remain' => 3,
], 'strnatcasecmp');

$diff->all();

// ['color' => 'orange', 'remain' => 6]
```

回调必须是一个返回小于、等于或大于零的整数的比较函数。有关更多信息，请参阅 PHP [`array_diff_uassoc`](https://www.php.net/array_diff_uassoc#refsect1-function.array-diff-uassoc-parameters) 文档，这是 `diffAssocUsing` 方法内部使用的 PHP 函数。

#### `diffKeys()`

`diffKeys` 方法基于键将 collection 与另一个 collection 或纯 PHP `array` 进行比较。此方法将返回原始 collection 中未出现在给定 collection 中的键值对：

```php
$collection = collect([
    'one' => 10,
    'two' => 20,
    'three' => 30,
    'four' => 40,
    'five' => 50,
]);

$diff = $collection->diffKeys([
    'two' => 2,
    'four' => 4,
    'six' => 6,
    'eight' => 8,
]);

$diff->all();

// ['one' => 10, 'three' => 30, 'five' => 50]
```

#### `doesntContain()`

`doesntContain` 方法确定 collection 是否不包含给定项目。您可以传递一个闭包给 `doesntContain` 方法来确定 collection 中是否不存在与给定真实测试匹配的元素：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->doesntContain(function (int $value, int $key) {
    return $value < 5;
});

// false
```

或者，您可以传递一个字符串给 `doesntContain` 方法来确定 collection 是否不包含给定项目值：

```php
$collection = collect(['name' => 'Desk', 'price' => 100]);

$collection->doesntContain('Table');

// true

$collection->doesntContain('Desk');

// false
```

您也可以传递一个键/值对给 `doesntContain` 方法，它将确定给定对是否不存在于 collection 中：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->doesntContain('product', 'Bookcase');

// true
```

`doesntContain` 方法在检查项目值时使用 "松散" 比较，意味着一个具有整数值的字符串将被认为等同于同一值的整数。

#### `dot()`

`dot` 方法将多维 collection 展平成单一层级 collection，使用 "点" 符号表示深度：

```php
$collection = collect(['products' => ['desk' => ['price' => 100]]]);

$flattened = $collection->dot();

$flattened->all();

// ['products.desk.price' => 100]
```

#### `dump()`

`dump` 方法打印 collection 的项目：

```php
$collection = collect(['John Doe', 'Jane Doe']);

$collection->dump();

/*
    Collection {
        #items: array:2 [
            0 => "John Doe"
            1 => "Jane Doe"
        ]
    }
*/
```

如果您想在打印 collection 后停止执行脚本，请改用 [`dd`](#method-dd) 方法。

#### `duplicates()`

`duplicates` 方法检索并返回 collection 中的重复值：

```php
$collection = collect(['a', 'b', 'a', 'c', 'b']);

$collection->duplicates();

// [2 => 'a', 4 => 'b']
```

如果 collection 包含数组或对象，您可以传递您希望检查重复值的属性的键：

```php
$employees = collect([
    ['email' => 'abigail@example.com', 'position' => 'Developer'],
    ['email' => 'james@example.com', 'position' => 'Designer'],
    ['email' => 'victoria@example.com', 'position' => 'Developer'],
]);

$employees->duplicates('position');

// [2 => 'Developer']
```

#### `duplicatesStrict()`

此方法与 [`duplicates`](#method-duplicates) 方法签名相同；然而，所有值都通过 "严格" 比较进行比较。

#### `each()`

`each` 方法迭代 collection 中的项目，并将每个项目传递给闭包：

```php
$collection = collect([1, 2, 3, 4]);

$collection->each(function (int $item, int $key) {
    // ...
});
```

如果您想停止迭代项目，您可以从闭包返回 `false`：

```php
$collection->each(function (int $item, int $key) {
    if (/* condition */) {
        return false;
    }
});
```

#### `eachSpread()`

`eachSpread` 方法迭代 collection 的项目，将每个嵌套的项目值传递给给定的回调：

```php
$collection = collect([['John Doe', 35], ['Jane Doe', 33]]);

$collection->eachSpread(function (string $name, int $age) {
    // ...
});
```

您可以通过从回调返回 `false` 来停止迭代项目：

```php
$collection->eachSpread(function (string $name, int $age) {
    return false;
});
```

#### `ensure()`

`ensure` 方法可用于验证 collection 的所有元素是否为给定类型或类型列表。否则，将抛出 `UnexpectedValueException`：

```php
return $collection->ensure(User::class);

return $collection->ensure([User::class, Customer::class]);
```

也可以指定 `string`、`int`、`float`、`bool` 和 `array` 等原始类型：

```php
return $collection->ensure('int');
```

> [!WARNING] > `ensure` 方法并不保证不会在随后的时间向 collection 中添加不同类型的元素。

#### `every()`

`every` 方法可用于验证 collection 的所有元素是否通过给定真实测试：

```php
collect([1, 2, 3, 4])->every(function (int $value, int $key) {
    return $value > 2;
});

// false
```

如果 collection 为空，`every` 方法将返回 true：

```php
$collection = collect([]);

$collection->every(function (int $value, int $key) {
    return $value > 2;
});

// true
```

#### `except()`

`except` 方法返回除具有指定键的所有项目以外的 collection 中的所有项目：

```php
$collection = collect(['product_id' => 1, 'price' => 100, 'discount' => false]);

$filtered = $collection->except(['price', 'discount']);

$filtered->all();

// ['product_id' => 1]
```

与 `except` 相反的方法，请参阅 [only](#method-only) 方法。

> [!NOTE]
> 使用 [Eloquent Collections](/docs/11/eloquent/eloquent-collections#method-except) 时，此方法的行为会发生变化。

#### `filter()`

`filter` 方法使用给定的回调过滤 collection，只保留通过给定真实测试的项目：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->filter(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [3, 4]
```

如果没有提供回调，所有等同于 `false` 的 collection 条目都将被移除：

```php
$collection = collect([1, 2, 3, null, false, '', 0, []]);

$collection->filter()->all();

// [1, 2, 3]
```

与 `filter` 相反的方法，请参阅 [reject](#method-reject) 方法。

#### `first()`

`first` 方法返回集合中通过给定真实测试的第一个元素：

```php
collect([1, 2, 3, 4])->first(function (int $value, int $key) {
    return $value > 2;
});

// 3
```

您也可以无需任何参数调用 `first` 方法来获取集合中的第一个元素。如果集合为空，则返回 `null`：

```php
collect([1, 2, 3, 4])->first();

// 1
```

#### `firstOrFail()`

`firstOrFail` 方法与 `first` 方法相同；然而，如果没有找到结果，则会抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
collect([1, 2, 3, 4])->firstOrFail(function (int $value, int $key) {
    return $value > 5;
});

// 抛出 ItemNotFoundException...
```

您也可以无需任何参数调用 `firstOrFail` 方法来获取集合中的第一个元素。如果集合为空，则抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
collect([])->firstOrFail();

// 抛出 ItemNotFoundException...
```

#### `firstWhere()`

`firstWhere` 方法返回集合中具有给定键/值对的第一个元素：

```php
$collection = collect([
    ['name' => 'Regena', 'age' => null],
    ['name' => 'Linda', 'age' => 14],
    ['name' => 'Diego', 'age' => 23],
    ['name' => 'Linda', 'age' => 84],
]);

$collection->firstWhere('name', 'Linda');

// ['name' => 'Linda', 'age' => 14]
```

您也可以使用比较运算符调用 `firstWhere` 方法：

```php
$collection->firstWhere('age', '>=', 18);

// ['name' => 'Diego', 'age' => 23]
```

像 [where](#method-where) 方法一样，您可以传递一个参数给 `firstWhere` 方法。在这种情况下，`firstWhere` 方法将返回第一个给定项键的值为 "真实" 的项：

```php
$collection->firstWhere('age');

// ['name' => 'Linda', 'age' => 14]
```

#### `flatMap()`

`flatMap` 方法遍历集合并将每个值传递给给定闭包。闭包可以自由修改项并返回它，从而形成一个新的修改过的项集合。然后，数组通过一层级展平：

```php
$collection = collect([
    ['name' => 'Sally'],
    ['school' => 'Arkansas'],
    ['age' => 28]
]);

$flattened = $collection->flatMap(function (array $values) {
    return array_map('strtoupper', $values);
});

$flattened->all();

// ['name' => 'SALLY', 'school' => 'ARKANSAS', 'age' => '28'];
```

#### `flatten()`

`flatten` 方法将多维集合展平为单一维度：

```php
$collection = collect([
    'name' => 'taylor',
    'languages' => [
        'php', 'javascript'
    ]
]);

$flattened = $collection->flatten();

$flattened->all();

// ['taylor', 'php', 'javascript'];
```

如有需要，您可以给 `flatten` 方法传递一个 "深度" 参数：

```php
$collection = collect([
    'Apple' => [
        [
            'name' => 'iPhone 6S',
            'brand' => 'Apple'
        ],
    ],
    'Samsung' => [
        [
            'name' => 'Galaxy S7',
            'brand' => 'Samsung'
        ],
    ],
]);

$products = $collection->flatten(1);

$products->values()->all();

/*
    [
        ['name' => 'iPhone 6S', 'brand' => 'Apple'],
        ['name' => 'Galaxy S7', 'brand' => 'Samsung'],
    ]
*/
```

在这个例子中，如果不提供深度调用 `flatten` 也会展平嵌套数组，结果为 `['iPhone 6S', 'Apple', 'Galaxy S7', 'Samsung']`。提供深度允许您指定将展平的嵌套数组的级别数。

#### `flip()`

`flip` 方法交换集合键与它们对应的值：

```php
$collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

$flipped = $collection->flip();

$flipped->all();

// ['taylor' => 'name', 'laravel' => 'framework']
```

#### `forget()`

`forget` 方法通过其键从集合中移除一个项：

```php
$collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

$collection->forget('name');

$collection->all();

// ['framework' => 'laravel']
```

> [!WARNING]
> 与大多数其它集合方法不同，`forget` 不返回一个新修改的集合；它修改的是它被调用的集合。

#### `forPage()`

`forPage` 方法返回一个新的集合，包含给定页面号码上应出现的项。该方法接受页面号码作为其第一个参数，以及每页显示的项数作为其第二个参数：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9]);

$chunk = $collection->forPage(2, 3);

$chunk->all();

// [4, 5, 6]
```

#### `get()`

`get` 方法返回给定键的项。如果键不存在，则返回 `null`：

```php
$collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

$value = $collection->get('name');

// taylor
```

您可以选择性地将默认值作为第二个参数传递：

```php
$collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

$value = $collection->get('age', 34);

// 34
```

您甚至可以将回调作为方法的默认值传递。如果指定的键不存在，将返回回调的结果：

```php
$collection->get('email', function () {
    return 'taylor@example.com';
});

// taylor@example.com
```

#### `groupBy()`

`groupBy` 方法将集合的项按给定的键分组：

```php
$collection = collect([
    ['account_id' => 'account-x10', 'product' => 'Chair'],
    ['account_id' => 'account-x10', 'product' => 'Bookcase'],
    ['account_id' => 'account-x11', 'product' => 'Desk'],
]);

$grouped = $collection->groupBy('account_id');

$grouped->all();

/*
    [
        'account-x10' => [
            ['account_id' => 'account-x10', 'product' => 'Chair'],
            ['account_id' => 'account-x10', 'product' => 'Bookcase'],
        ],
        'account-x11' => [
            ['account_id' => 'account-x11', 'product' => 'Desk'],
        ],
    ]
*/
```

而不是传递字符串 `key`，你可以传递一个回调。回调应该返回你希望键入分组的值：

```php
$grouped = $collection->groupBy(function (array $item, int $key) {
    return substr($item['account_id'], -3);
});

$grouped->all();

/*
    [
        'x10' => [
            ['account_id' => 'account-x10', 'product' => 'Chair'],
            ['account_id' => 'account-x10', 'product' => 'Bookcase'],
        ],
        'x11' => [
            ['account_id' => 'account-x11', 'product' => 'Desk'],
        ],
    ]
*/
```

可以将多个分组标准作为数组传递。每个数组元素将应用到多维数组中相应的级别：

```php
$data = new Collection([
    10 => ['user' => 1, 'skill' => 1, 'roles' => ['Role_1', 'Role_3']],
    20 => ['user' => 2, 'skill' => 1, 'roles' => ['Role_1', 'Role_2']],
    30 => ['user' => 3, 'skill' => 2, 'roles' => ['Role_1']],
    40 => ['user' => 4, 'skill' => 2, 'roles' => ['Role_2']],
]);

$result = $data->groupBy(['skill', function (array $item) {
    return $item['roles'];
}], preserveKeys: true);

/*
[
    1 => [
        'Role_1' => [
            10 => ['user' => 1, 'skill' => 1, 'roles' => ['Role_1', 'Role_3']],
            20 => ['user' => 2, 'skill' => 1, 'roles' => ['Role_1', 'Role_2']],
        ],
        'Role_2' => [
            20 => ['user' => 2, 'skill' => 1, 'roles' => ['Role_1', 'Role_2']],
        ],
        'Role_3' => [
            10 => ['user' => 1, 'skill' => 1, 'roles' => ['Role_1', 'Role_3']],
        ],
    ],
    2 => [
        'Role_1' => [
            30 => ['user' => 3, 'skill' => 2, 'roles' => ['Role_1']],
        ],
        'Role_2' => [
            40 => ['user' => 4, 'skill' => 2, 'roles' => ['Role_2']],
        ],
    ],
];
*/
```

#### `has()`

`has` 方法确定集合中是否存在给定的键：

```php
$collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

$collection->has('product');

// true

$collection->has(['product', 'amount']);

// true

$collection->has(['amount', 'price']);

// false
```

#### `hasAny()`

`hasAny` 方法确定集合中是否存在任何给定键：

```php
$collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

$collection->hasAny(['product', 'price']);

// true

$collection->hasAny(['name', 'price']);

// false
```

#### `implode()`

`implode` 方法连接集合中的项目。其参数取决于集合中项目的类型。如果集合包含数组或对象，则应传递你希望连接的属性键，以及你希望放置在值之间的“粘合”字符串：

```php
$collection = collect([
    ['account_id' => 1, 'product' => 'Desk'],
    ['account_id' => 2, 'product' => 'Chair'],
]);

$collection->implode('product', ', ');

// Desk, Chair
```

如果集合包含简单字符串或数值，你应该将“粘合”作为方法的唯一参数传递：

```php
collect([1, 2, 3, 4, 5])->implode('-');

// '1-2-3-4-5'
```

如果你想要格式化正在连接的值，你可以将一个闭包传递给 `implode` 方法：

```php
$collection->implode(function (array $item, int $key) {
    return strtoupper($item['product']);
}, ', ');

// DESK, CHAIR
```

#### `intersect()`

`intersect` 方法从原始集合中移除任何在给定的 `array` 或集合中不存在的值。生成的集合将保留原始集合的键：

```php
$collection = collect(['Desk', 'Sofa', 'Chair']);

$intersect = $collection->intersect(['Desk', 'Chair', 'Bookcase']);

$intersect->all();

// [0 => 'Desk', 2 => 'Chair']
```

> [!NOTE]
> 使用 [Eloquent Collections](/docs/11/eloquent/eloquent-collections#method-intersect) 时，此方法的行为会有所不同。

#### `intersectAssoc()`

`intersectAssoc` 方法根据原始集合与另一个集合或 `array` 进行比较，返回存在于所有给定集合中的键/值对：

```php
$collection = collect([
    'color' => 'red',
    'size' => 'M',
    'material' => 'cotton'
]);

$intersect = $collection->intersectAssoc([
    'color' => 'blue',
    'size' => 'M',
    'material' => 'polyester'
]);

$intersect->all();

// ['size' => 'M']
```

#### `intersectByKeys()`

`intersectByKeys` 方法从原始集合中移除任何在给定的 `array` 或集合中不存在的键及其对应的值：

```php
$collection = collect([
    'serial' => 'UX301', 'type' => 'screen', 'year' => 2009,
]);

$intersect = $collection->intersectByKeys([
    'reference' => 'UX404', 'type' => 'tab', 'year' => 2011,
]);

$intersect->all();

// ['type' => 'screen', 'year' => 2009]
```

#### `isEmpty()`

`isEmpty` 方法如果集合为空返回 `true`；否则，返回 `false`：

```php
collect([])->isEmpty();

// true
```

#### `isNotEmpty()`

`isNotEmpty` 方法如果集合不为空则返回 `true`；否则，返回 `false`：

```php
collect([])->isNotEmpty();

// false
```

#### `join()`

`join` 方法使用字符串连接集合中的值。使用这个方法的第二个参数，你还可以指定如何将最终元素附加到字符串上：

```php
collect(['a', 'b', 'c'])->join(', '); // 'a, b, c'
collect(['a', 'b', 'c'])->join(', ', ', and '); // 'a, b, and c'
collect(['a', 'b'])->join(', ', ' and '); // 'a and b'
collect(['a'])->join(', ', ' and '); // 'a'
collect([])->join(', ', ' and '); // ''
```

#### `keyBy()`

`keyBy` 方法根据给定键对集合进行键设置。如果多个项目有相同的键，只有最后一个会出现在新集合中：

```php
$collection = collect([
    ['product_id' => 'prod-100', 'name' => 'Desk'],
    ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$keyed = $collection->keyBy('product_id');

$keyed->all();

/*
    [
        'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
        'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]
*/
```

你也可以传递一个回调函数给这个方法。回调函数应该返回用于键设置集合的值：

```php
$keyed = $collection->keyBy(function (array $item, int $key) {
    return strtoupper($item['product_id']);
});

$keyed->all();

/*
    [
        'PROD-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
        'PROD-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]
*/
```

#### `keys()`

`keys` 方法返回集合的所有键：

```php
$collection = collect([
    'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
    'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$keys = $collection->keys();

$keys->all();

// ['prod-100', 'prod-200']
```

#### `last()`

`last` 方法返回集合中通过给定真理测试的最后一个元素：

```php
collect([1, 2, 3, 4])->last(function (int $value, int $key) {
    return $value < 3;
});

// 2
```

你也可以不带参数调用 `last` 方法来获取集合中的最后一个元素。如果集合为空，则返回 `null` ：

```php
collect([1, 2, 3, 4])->last();

// 4
```

#### `lazy()`

`lazy` 方法从底层的条目数组中返回一个新的 [`LazyCollection`](#lazy-collections) 实例：

```php
$lazyCollection = collect([1, 2, 3, 4])->lazy();

$lazyCollection::class;

// Illuminate\Support\LazyCollection

$lazyCollection->all();

// [1, 2, 3, 4]
```

当你需要对包含很多条目的巨大 `Collection` 执行转换时，这特别有用：

```php
$count = $hugeCollection
    ->lazy()
    ->where('country', 'FR')
    ->where('balance', '>', '100')
    ->count();
```

通过将集合转换为 `LazyCollection`，我们避免了分配大量额外的内存。尽管原始集合仍保持着它的值在内存中，但随后的过滤不会。因此，在过滤集合结果时几乎不会分配额外的内存。

#### `macro()`

静态 `macro` 方法允许你在运行时向 `Collection` 类添加方法。有关详细信息，请参阅关于 [扩展 collections](#extending-collections) 的文档。

#### `make()`

静态 `make` 方法创建一个新的集合实例。参见 [创建 Collections](#creating-collections) 部分。

#### `map()`

`map` 方法遍历集合并将每个值传递给给定的回调函数。回调函数可以自由地修改项目并返回它，从而形成一个新的修改后的项目集合：

```php
$collection = collect([1, 2, 3, 4, 5]);

$multiplied = $collection->map(function (int $item, int $key) {
    return $item * 2;
});

$multiplied->all();

// [2, 4, 6, 8, 10]
```

> [!WARNING]
> 像大多数其他集合方法一样，`map` 返回一个新的集合实例；它不修改调用它的集合。如果你想转换原始集合，请使用 [`transform`](#method-transform) 方法。

#### `mapInto()`

`mapInto()` 方法遍历集合，为给定的类的每个新实例创建一个新实例，通过将值传递给构造函数：

```php
class Currency
{
    /**
     * 创建一个新的 currency 实例。
     */
    function __construct(
        public string $code
    ) {}
}

$collection = collect(['USD', 'EUR', 'GBP']);

$currencies = $collection->mapInto(Currency::class);

$currencies->all();

// [Currency('USD'), Currency('EUR'), Currency('GBP')]
```

#### `mapSpread()`

`mapSpread` 方法遍历集合的项目，将每个嵌套的项目值传递给给定的闭包。闭包可以自由地修改项目并返回它，从而形成一个新的修改后的条目集合：

```php
$collection = collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

$chunks = $collection->chunk(2);

$sequence = $chunks->mapSpread(function (int $even, int $odd) {
    return $even + $odd;
});

$sequence->all();

// [1, 5, 9, 13, 17]
```

#### `mapToGroups()`

`mapToGroups` 方法根据给定的闭包对集合的条目进行分组。闭包应返回包含单个键/值对的关联数组，从而形成一个新的分组值集合：

```php
$collection = collect([
    [
        'name' => 'John Doe',
        'department' => 'Sales',
    ],
    [
        'name' => 'Jane Doe',
        'department' => 'Sales',
    ],
    [
        'name' => 'Johnny Doe',
        'department' => 'Marketing',
    ]
]);

$grouped = $collection->mapToGroups(function (array $item, int $key) {
    return [$item['department'] => $item['name']];
});

$grouped->all();

/*
    [
        'Sales' => ['John Doe', 'Jane Doe'],
        'Marketing' => ['Johnny Doe'],
    ]
*/

$grouped->get('Sales')->all();

// ['John Doe', 'Jane Doe']
```

#### `mapWithKeys()`

`mapWithKeys` 方法遍历集合并将每个值传递给给定的回调函数。回调函数应返回包含单个键/值对的关联数组：

```php
$collection = collect([
    [
        'name' => 'John',
        'department' => 'Sales',
        'email' => 'john@example.com',
    ],
    [
        'name' => 'Jane',
        'department' => 'Marketing',
        'email' => 'jane@example.com',
    ]
]);

$keyed = $collection->mapWithKeys(function (array $item, int $key) {
    return [$item['email'] => $item['name']];
});

$keyed->all();

/*
    [
        'john@example.com' => 'John',
        'jane@example.com' => 'Jane',
    ]
*/
```

#### `max()`

`max` 方法返回给定键的最大值：

```php
$max = collect([
    ['foo' => 10],
    ['foo' => 20]
])->max('foo');

// 20

$max = collect([1, 2, 3, 4, 5])->max();

// 5
```

#### `median()`

`median` 方法返回给定键的[中位数值](https://en.wikipedia.org/wiki/Median)：

```php
$median = collect([
    ['foo' => 10],
    ['foo' => 10],
    ['foo' => 20],
    ['foo' => 40]
])->median('foo');

// 15

$median = collect([1, 1, 2, 4])->median();

// 1.5
```

#### `merge()`

`merge` 方法将给定的数组或集合与原始集合合并。如果给定条目中的字符串键与原始集合中的字符串键匹配，则给定条目的值将覆盖原始集合中的值：

```php
$collection = collect(['product_id' => 1, 'price' => 100]);

$merged = $collection->merge(['price' => 200, 'discount' => false]);

$merged->all();

// ['product_id' => 1, 'price' => 200, 'discount' => false]
```

如果给定条目的键是数字，则值将附加到集合的末尾：

```php
$collection = collect(['Desk', 'Chair']);

$merged = $collection->merge(['Bookcase', 'Door']);

$merged->all();

// ['Desk', 'Chair', 'Bookcase', 'Door']
```

#### `mergeRecursive()`

`mergeRecursive` 方法将给定的数组或集合与原始集合递归合并。如果给定条目中的字符串键与原始集合中的字符串键匹配，则这些键的值将合并到一个数组中，这一操作是递归进行的：

```php
$collection = collect(['product_id' => 1, 'price' => 100]);

$merged = $collection->mergeRecursive([
    'product_id' => 2,
    'price' => 200,
    'discount' => false
]);

$merged->all();

// ['product_id' => [1, 2], 'price' => [100, 200], 'discount' => false]
```

#### `min()`

`min` 方法返回给定键的最小值：

```php
$min = collect([['foo' => 10], ['foo' => 20]])->min('foo');

// 10

$min = collect([1, 2, 3, 4, 5])->min();

// 1
```

#### `mode()`

`mode` 方法返回给定键的[众数值](<https://en.wikipedia.org/wiki/Mode_(statistics)>)：

```php
$mode = collect([
    ['foo' => 10],
    ['foo' => 10],
    ['foo' => 20],
    ['foo' => 40]
])->mode('foo');

// [10]

$mode = collect([1, 1, 2, 4])->mode();

// [1]

$mode = collect([1, 1, 2, 2])->mode();

// [1, 2]
```

#### `nth()`

`nth` 方法创建一个新的集合，包含每第 n 个元素：

```php
$collection = collect(['a', 'b', 'c', 'd', 'e', 'f']);

$collection->nth(4);

// ['a', 'e']
```

你可以可选地传递第二个参数作为开始的偏移量：

```php
$collection->nth(4, 1);

// ['b', 'f']
```

#### `only()`

`only` 方法返回集合中具有指定键的项：

```php
$collection = collect([
    'product_id' => 1,
    'name' => 'Desk',
    'price' => 100,
    'discount' => false
]);

$filtered = $collection->only(['product_id', 'name']);

$filtered->all();

// ['product_id' => 1, 'name' => 'Desk']
```

`only` 方法的逆过程，请参见 [`except`](#method-except) 方法。

> [!NOTE]
> 使用 [Eloquent Collections](/docs/11/eloquent/eloquent-collections#method-only) 时，这个方法的行为有所不同。

#### `pad()`

`pad` 方法将给定值填充到数组中，直到数组达到指定的大小。该方法的行为类似于 PHP 的 [array_pad](https://secure.php.net/manual/en/function.array-pad.php) 函数。

要向左填充，你应该指定一个负的大小。如果给定大小的绝对值小于或等于数组的长度，则不进行填充：

```php
$collection = collect(['A', 'B', 'C']);

$filtered = $collection->pad(5, 0);

$filtered->all();

// ['A', 'B', 'C', 0, 0]

$filtered = $collection->pad(-5, 0);

$filtered->all();

// [0, 0, 'A', 'B', 'C']
```

#### `partition()`

`partition` 方法可以与 PHP 数组解构结合使用，以将通过给定真理测试的元素与不通过的元素分隔开：

```php
$collection = collect([1, 2, 3, 4, 5, 6]);

[$underThree, $equalOrAboveThree] = $collection->partition(function (int $i) {
    return $i < 3;
});

$underThree->all();

// [1, 2]

$equalOrAboveThree->all();

// [3, 4, 5, 6]
```

#### `percentage()`

`percentage` 方法可用于快速确定集合中通过给定真理测试的项目的百分比：

```php
$collection = collect([1, 1, 2, 2, 2, 3]);

$percentage = $collection->percentage(fn ($value) => $value === 1);

// 33.33
```

默认情况下，百分比将四舍五入到两位小数。但是，你可以通过向方法提供第二个参数来自定义这个行为：

```php
$percentage = $collection->percentage(fn ($value) => $value === 1, precision: 3);

// 33.333
```

#### `pipe()`

`pipe` 方法将集合传递给给定闭包，并返回执行闭包的结果：

```php
$collection = collect([1, 2, 3]);

$piped = $collection->pipe(function (Collection $collection) {
    return $collection->sum();
});

// 6
```

#### `pipeInto()`

`pipeInto` 方法创建指定类的新实例，并将集合传入构造函数：

```php
class ResourceCollection
{
    /**
     * 创建一个新 ResourceCollection 实例。
     */
    public function __construct(
      public Collection $collection,
    ) {}
}

$collection = collect([1, 2, 3]);

$resource = $collection->pipeInto(ResourceCollection::class);

$resource->collection->all();

// [1, 2, 3]
```

#### `pipeThrough()`

`pipeThrough` 方法将集合传递给给定的闭包数组，并返回执行闭包的结果：

```php
use Illuminate\Support\Collection;

$collection = collect([1, 2, 3]);

$result = $collection->pipeThrough([
    function (Collection $collection) {
        return $collection->merge([4, 5]);
    },
    function (Collection $collection) {
        return $collection->sum();
    },
]);

// 15
```

#### `pluck()`

`pluck` 方法检索给定键的所有值：

```php
$collection = collect([
    ['product_id' => 'prod-100', 'name' => 'Desk'],
    ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$plucked = $collection->pluck('name');

$plucked->all();

// ['Desk', 'Chair']
```

你还可以指定如何希望结果集合被键设置：

```php
$plucked = $collection->pluck('name', 'product_id');

$plucked->all();

// ['prod-100' => 'Desk', 'prod-200' => 'Chair']
```

`pluck` 方法也支持使用“点”表示法检索嵌套值：

```php
$collection = collect([
    [
        'name' => 'Laracon',
        'speakers' => [
            'first_day' => ['Rosa', 'Judith'],
        ],
    ],
    [
        'name' => 'VueConf',
        'speakers' => [
            'first_day' => ['Abigail', 'Joey'],
        ],
    ],
]);

$plucked = $collection->pluck('speakers.first_day');

$plucked->all();

// [['Rosa', 'Judith'], ['Abigail', 'Joey']]
```

如果存在重复键，则最后一个匹配元素将被插入到取出的集合中：

```php
$collection = collect([
    ['brand' => 'Tesla',  'color' => 'red'],
    ['brand' => 'Pagani', 'color' => 'white'],
    ['brand' => 'Tesla',  'color' => 'black'],
    ['brand' => 'Pagani', 'color' => 'orange'],
]);

$plucked = $collection->pluck('color', 'brand');

$plucked->all();

// ['Tesla' => 'black', 'Pagani' => 'orange']
```

#### `pop()`

`pop` 方法移除并返回集合中的最后一个项目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->pop();

// 5

$collection->all();

// [1, 2, 3, 4]
```

你可以向 `pop` 方法传入一个整数来移除并返回集合末尾的多个项目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->pop(3);

// collect([5, 4, 3])

$collection->all();

// [1, 2]
```

#### `prepend()`

`prepend` 方法将一个项目添加到集合的开头：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->prepend(0);

$collection->all();

// [0, 1, 2, 3, 4, 5]
```

你也可以传递第二个参数来指定要添加项目的键：

```php
$collection = collect(['one' => 1, 'two' => 2]);

$collection->prepend(0, 'zero');

$collection->all();

// ['zero' => 0, 'one' => 1, 'two' => 2]
```

#### `pull()`

`pull` 方法通过其键移除并返回集合中的一个项目：

```php
$collection = collect(['product_id' => 'prod-100', 'name' => 'Desk']);

$collection->pull('name');

// 'Desk'

$collection->all();

// ['product_id' => 'prod-100']
```

#### `push()`

`push` 方法将一个项目追加到集合的末尾：

```php
$collection = collect([1, 2, 3, 4]);

$collection->push(5);

$collection->all();

// [1, 2, 3, 4, 5]
```

#### `put()`

`put` 方法在集合中设置给定的键和值：

```php
$collection = collect(['product_id' => 1, 'name' => 'Desk']);

$collection->put('price', 100);

$collection->all();

// ['product_id' => 1, 'name' => 'Desk', 'price' => 100]
```

#### `random()`

`random` 方法从集合中返回一个随机项目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->random();

// 4 - (随机获取)
```

你可以传递一个整数给 `random` 来指定你希望随机获取多少个项目。当明确传递希望接收的项目数量时，始终返回一个项目的集合：

```php
$random = $collection->random(3);

$random->all();

// [2, 4, 5] - (随机获取)
```

如果集合实例中的项目少于请求的数量，`random` 方法将抛出一个 `InvalidArgumentException` 异常。

`random` 方法也接受一个闭包，该闭包将接收当前集合实例：

```php
use Illuminate\Support\Collection;

$random = $collection->random(fn (Collection $items) => min(10, count($items)));

$random->all();

// [1, 2, 3, 4, 5] - (随机获取)
```

#### `range()`

`range` 方法返回一个包含指定范围内整数的集合：

```php
$collection = collect()->range(3, 6);

$collection->all();

// [3, 4, 5, 6]
```

#### `reduce()`

`reduce` 方法将集合简化为单个值，将每次迭代的结果传递到后续迭代：

```php
$collection = collect([1, 2, 3]);

$total = $collection->reduce(function (?int $carry, int $item) {
    return $carry + $item;
});

// 6
```

第一次迭代时 `$carry` 的值为 `null`；但是，你可以通过向 `reduce` 传递第二个参数来指定其初始值：

```php
$collection->reduce(function (int $carry, int $item) {
    return $carry + $item;
}, 4);

// 10
```

`reduce` 方法还会将关联集合中的数组键传递给给定的回调函数：

```php
$collection = collect([
    'usd' => 1400,
    'gbp' => 1200,
    'eur' => 1000,
]);

$ratio = [
    'usd' => 1,
    'gbp' => 1.37,
    'eur' => 1.22,
];

$collection->reduce(function (int $carry, int $value, int $key) use ($ratio) {
    return $carry + ($value * $ratio[$key]);
});

// 4264
```

#### `reduceSpread()`

`reduceSpread` 方法将集合简化为值数组，将每次迭代的结果传递到后续迭代。这个方法与 `reduce` 方法相似，但它可以接受多个初始值：

```php
[$creditsRemaining, $batch] = Image::where('status', 'unprocessed')
    ->get()
    ->reduceSpread(function (int $creditsRemaining, Collection $batch, Image $image) {
        if ($creditsRemaining >= $image->creditsRequired()) {
            $batch->push($image);

            $creditsRemaining -= $image->creditsRequired();
        }

        return [$creditsRemaining, $batch];
    }, $creditsAvailable, collect());
```

#### `reject()`

`reject` 方法使用给定的闭包对集合进行筛选。如果应该从结果集合中移除项，则闭包应该返回 `true` ：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->reject(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [1, 2]
```

`reject` 方法的逆过程，请参见 [`filter`](#method-filter) 方法。

#### `replace()`

`replace` 方法的行为类似于 `merge`；但是，除了覆盖具有字符串键的匹配项之外，`replace` 方法还将覆盖具有匹配数字键的集合中的项：

```php
$collection = collect(['Taylor', 'Abigail', 'James']);

$replaced = $collection->replace([1 => 'Victoria', 3 => 'Finn']);

$replaced->all();

// ['Taylor', 'Victoria', 'James', 'Finn']
```

#### `replaceRecursive()`

这个方法的工作原理类似于 `replace`，但它将递归到数组中，并将相同的替换过程应用于内部值：

```php
$collection = collect([
    'Taylor',
    'Abigail',
    [
        'James',
        'Victoria',
        'Finn'
    ]
]);

$replaced = $collection->replaceRecursive([
    'Charlie',
    2 => [1 => 'King']
]);

$replaced->all();

// ['Charlie', 'Abigail', ['James', 'King', 'Finn']]
```

#### `reverse()`

`reverse` 方法将集合中的项的顺序颠倒，保持原来的键：

```php
$collection = collect(['a', 'b', 'c', 'd', 'e']);

$reversed = $collection->reverse();

$reversed->all();

/*
    [
        4 => 'e',
        3 => 'd',
        2 => 'c',
        1 => 'b',
        0 => 'a',
    ]
*/
```

#### `search()`

`search` 方法在集合中搜索给定值，并在找到时返回其键。如果未找到项，则返回 `false` ：

```php
$collection = collect([2, 4, 6, 8]);

$collection->search(4);

// 1
```

搜索使用 "宽松" 比较，这意味着一个具有整数值的字符串将被认为等于同一值的整数。要使用 "严格" 比较，将 `true` 作为方法的第二个参数传递：

```php
collect([2, 4, 6, 8])->search('4', $strict = true);

// false
```

或者，你可以提供自己的闭包来搜索第一个通过给定真理测试的项：

```php
collect([2, 4, 6, 8])->search(function (int $item, int $key) {
    return $item > 5;
});

// 2
```

#### `select()`

`select` 方法从集合中选择给定键，类似于 SQL 的 `SELECT` 语句：

```php
$users = collect([
    ['name' => 'Taylor Otwell', 'role' => 'Developer', 'status' => 'active'],
    ['name' => 'Victoria Faith', 'role' => 'Researcher', 'status' => 'active'],
]);

$users->select(['name', 'role']);

/*
    [
        ['name' => 'Taylor Otwell', 'role' => 'Developer'],
        ['name' => 'Victoria Faith', 'role' => 'Researcher'],
    ],
*/
```

#### `shift()`

`shift` 方法移除并返回集合中的第一项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift();

// 1

$collection->all();

// [2, 3, 4, 5]
```

你可以向 `shift` 方法传递一个整数来移除并返回集合头部的多个项目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift(3);

// collect([1, 2, 3])

$collection->all();

// [4, 5]
```

#### `shuffle()`

`shuffle` 方法随机地打乱集合中的项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$shuffled = $collection->shuffle();

$shuffled->all();

// [3, 2, 5, 1, 4] - (随机生成)
```

#### `skip()`

`skip` 方法返回一个新的集合，从集合开始移除给定数量的元素：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$collection = $collection->skip(4);

$collection->all();

// [5, 6, 7, 8, 9, 10]
```

#### `skipUntil()`

`skipUntil` 方法从集合中跳过项，直到给定的回调函数返回 `true` ，然后将剩余的项作为一个新集合的实例返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [3, 4]
```

你还可以向 `skipUntil` 方法传递一个简单的值来跳过所有项，直到找到给定值：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(3);

$subset->all();

// [3, 4]
```

> [!WARNING]
> 如果未找到给定值或回调函数永远不返回 `true` ，`skipUntil` 方法将返回一个空的集合。

#### `skipWhile()`

`skipWhile` 方法在给定的回调函数返回 `true` 时跳过来自集合的项，然后将剩余的项作为一个新集合返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipWhile(function (int $item) {
    return $item <= 3;
});

$subset->all();

// [4]
```

> [!WARNING]
> 如果回调函数永远不返回 `false` ，`skipWhile` 方法将返回一个空的集合。

#### `slice()`

`slice` 方法返回从给定索引开始的集合切片：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$slice = $collection->slice(4);

$slice->all();

// [5, 6, 7, 8, 9, 10]
```

如果你想要限制返回的切片的大小，请将希望的大小作为第二个参数传递给方法：

```php
$slice = $collection->slice(4, 2);

$slice->all();

// [5, 6]
```

返回的切片默认会保持键。如果你不希望保留原始键，你可以使用 [`values`](#method-values) 方法重新索引它们。

#### `sliding()`

`sliding` 方法返回一个新的集合，其中包含代表集合中项目的“滑动窗口”视图的块：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(2);

$chunks->toArray();

// [[1, 2], [2, 3], [3, 4], [4, 5]]
```

这在搭配 [`eachSpread`](#method-eachspread) 方法使用时特别有用：

```php
$transactions->sliding(2)->eachSpread(function (Collection $previous, Collection $current) {
    $current->total = $previous->total + $current->amount;
});
```

你可以选择传递第二个“步长”值，这决定了每个块的第一个项目之间的距离：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(3, step: 2);

$chunks->toArray();

// [[1, 2, 3], [3, 4, 5]]
```

#### `sole()`

`sole` 方法返回集合中通过给定真理测试的第一个元素，但前提是真理测试只与一个元素相匹配：

```php
collect([1, 2, 3, 4])->sole(function (int $value, int $key) {
    return $value === 2;
});

// 2
```

你也可以传递一个键/值对给 `sole` 方法，它将返回集合中与给定对匹配的第一个元素，但前提是只有一个元素与之匹配：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->sole('product', 'Chair');

// ['product' => 'Chair', 'price' => 100]
```

或者，你也可以不带参数调用 `sole` 方法来获取集合中的第一个元素，如果集合中只有一个元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
]);

$collection->sole();

// ['product' => 'Desk', 'price' => 200]
```

如果集合中没有元素应该由 `sole` 方法返回，将抛出一个 `\Illuminate\Collections\ItemNotFoundException` 异常。如果有多个元素应该返回，将抛出一个 `\Illuminate\Collections\MultipleItemsFoundException` 异常。

#### `some()`

[`contains`](#method-contains) 方法的别名。

#### `sort()`

`sort` 方法对集合进行排序。排序后的集合保持原始数组键，所以在以下示例中我们将使用 [`values`](#method-values) 方法来重置键，使之成为连续编号的索引：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sort();

$sorted->values()->all();

// [1, 2, 3, 4, 5]
```

如果你的排序需求更高级，你可以传递一个具有自己算法的回调函数给 `sort` 。参考 PHP 的 [`uasort`](https://secure.php.net/manual/en/function.uasort.php#refsect1-function.uasort-parameters) 文档，这正是集合的 `sort` 方法内部调用的方法。

> [!NOTE]
> 如果你需要对嵌套数组或对象的集合进行排序，请参阅 [`sortBy`](#method-sortby) 和 [`sortByDesc`](#method-sortbydesc) 方法。

#### `sortBy()`

`sortBy` 方法按给定键对集合进行排序。排序后的集合保持原始数组键，所以在以下示例中我们将使用 [`values`](#method-values) 方法来重置键，使之成为连续编号的索引：

```php
$collection = collect([
    ['name' => 'Desk', 'price' => 200],
    ['name' => 'Chair', 'price' => 100],
    ['name' => 'Bookcase', 'price' => 150],
]);

$sorted = $collection->sortBy('price');

$sorted->values()->all();

/*
    [
        ['name' => 'Chair', 'price' => 100],
        ['name' => 'Bookcase', 'price' => 150],
        ['name' => 'Desk', 'price' => 200],
    ]
*/
```

`sortBy` 方法可以接受[排序标志](https://www.php.net/manual/en/function.sort.php)作为其第二个参数：

```php
$collection = collect([
    ['title' => 'Item 1'],
    ['title' => 'Item 12'],
    ['title' => 'Item 3'],
]);

$sorted = $collection->sortBy('title', SORT_NATURAL);

$sorted->values()->all();

/*
    [
        ['title' => 'Item 1'],
        ['title' => 'Item 3'],
        ['title' => 'Item 12'],
    ]
*/
```

或者，你可以传递你自己的闭包来确定怎么对集合的值进行排序：

```php
$collection = collect([
    ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
    ['name' => 'Chair', 'colors' => ['Black']],
    ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
]);

$sorted = $collection->sortBy(function (array $product, int $key) {
    return count($product['colors']);
});

$sorted->values()->all();

/*
    [
        ['name' => 'Chair', 'colors' => ['Black']],
        ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
        ['name' =>
```

#### `range()`

`range` 方法返回一个包含指定范围内整数的集合：

```php
$collection = collect()->range(3, 6);

$collection->all();

// [3, 4, 5, 6]
```

#### `reduce()`

`reduce` 方法将集合简化为单个值，将每次迭代的结果传递到后续迭代：

```php
$collection = collect([1, 2, 3]);

$total = $collection->reduce(function (?int $carry, int $item) {
    return $carry + $item;
});

// 6
```

第一次迭代时 `$carry` 的值为 `null`；但是，你可以通过向 `reduce` 传递第二个参数来指定其初始值：

```php
$collection->reduce(function (int $carry, int $item) {
    return $carry + $item;
}, 4);

// 10
```

`reduce` 方法还会将关联集合中的数组键传递给给定的回调函数：

```php
$collection = collect([
    'usd' => 1400,
    'gbp' => 1200,
    'eur' => 1000,
]);

$ratio = [
    'usd' => 1,
    'gbp' => 1.37,
    'eur' => 1.22,
];

$collection->reduce(function (int $carry, int $value, int $key) use ($ratio) {
    return $carry + ($value * $ratio[$key]);
});

// 4264
```

#### `reduceSpread()`

`reduceSpread` 方法将集合简化为值数组，将每次迭代的结果传递到后续迭代。这个方法与 `reduce` 方法相似，但它可以接受多个初始值：

```php
[$creditsRemaining, $batch] = Image::where('status', 'unprocessed')
    ->get()
    ->reduceSpread(function (int $creditsRemaining, Collection $batch, Image $image) {
        if ($creditsRemaining >= $image->creditsRequired()) {
            $batch->push($image);

            $creditsRemaining -= $image->creditsRequired();
        }

        return [$creditsRemaining, $batch];
    }, $creditsAvailable, collect());
```

#### `reject()`

`reject` 方法使用给定的闭包对集合进行筛选。如果应该从结果集合中移除项，则闭包应该返回 `true` ：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->reject(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [1, 2]
```

`reject` 方法的逆过程，请参见 [`filter`](#method-filter) 方法。

#### `replace()`

`replace` 方法的行为类似于 `merge`；但是，除了覆盖具有字符串键的匹配项之外，`replace` 方法还将覆盖具有匹配数字键的集合中的项：

```php
$collection = collect(['Taylor', 'Abigail', 'James']);

$replaced = $collection->replace([1 => 'Victoria', 3 => 'Finn']);

$replaced->all();

// ['Taylor', 'Victoria', 'James', 'Finn']
```

#### `replaceRecursive()`

这个方法的工作原理类似于 `replace`，但它将递归到数组中，并将相同的替换过程应用于内部值：

```php
$collection = collect([
    'Taylor',
    'Abigail',
    [
        'James',
        'Victoria',
        'Finn'
    ]
]);

$replaced = $collection->replaceRecursive([
    'Charlie',
    2 => [1 => 'King']
]);

$replaced->all();

// ['Charlie', 'Abigail', ['James', 'King', 'Finn']]
```

#### `reverse()`

`reverse` 方法将集合中的项的顺序颠倒，保持原来的键：

```php
$collection = collect(['a', 'b', 'c', 'd', 'e']);

$reversed = $collection->reverse();

$reversed->all();

/*
    [
        4 => 'e',
        3 => 'd',
        2 => 'c',
        1 => 'b',
        0 => 'a',
    ]
*/
```

#### `search()`

`search` 方法在集合中搜索给定值，并在找到时返回其键。如果未找到项，则返回 `false` ：

```php
$collection = collect([2, 4, 6, 8]);

$collection->search(4);

// 1
```

搜索使用 "宽松" 比较，这意味着一个具有整数值的字符串将被认为等于同一值的整数。要使用 "严格" 比较，将 `true` 作为方法的第二个参数传递：

```php
collect([2, 4, 6, 8])->search('4', $strict = true);

// false
```

或者，你可以提供自己的闭包来搜索第一个通过给定真理测试的项：

```php
collect([2, 4, 6, 8])->search(function (int $item, int $key) {
    return $item > 5;
});

// 2
```

#### `select()`

`select` 方法从集合中选择给定键，类似于 SQL 的 `SELECT` 语句：

```php
$users = collect([
    ['name' => 'Taylor Otwell', 'role' => 'Developer', 'status' => 'active'],
    ['name' => 'Victoria Faith', 'role' => 'Researcher', 'status' => 'active'],
]);

$users->select(['name', 'role']);

/*
    [
        ['name' => 'Taylor Otwell', 'role' => 'Developer'],
        ['name' => 'Victoria Faith', 'role' => 'Researcher'],
    ],
*/
```

#### `shift()`

`shift` 方法移除并返回集合中的第一项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift();

// 1

$collection->all();

// [2, 3, 4, 5]
```

你可以向 `shift` 方法传递一个整数来移除并返回集合头部的多个项目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift(3);

// collect([1, 2, 3])

$collection->all();

// [4, 5]
```

#### `shuffle()`

`shuffle` 方法随机地打乱集合中的项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$shuffled = $collection->shuffle();

$shuffled->all();

// [3, 2, 5, 1, 4] - (随机生成)
```

#### `skip()`

`skip` 方法返回一个新的集合，从集合开始移除给定数量的元素：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$collection = $collection->skip(4);

$collection->all();

// [5, 6, 7, 8, 9, 10]
```

#### `skipUntil()`

`skipUntil` 方法从集合中跳过项，直到给定的回调函数返回 `true` ，然后将剩余的项作为一个新集合的实例返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [3, 4]
```

你还可以向 `skipUntil` 方法传递一个简单的值来跳过所有项，直到找到给定值：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(3);

$subset->all();

// [3, 4]
```

> [!WARNING]
> 如果未找到给定值或回调函数永远不返回 `true` ，`skipUntil` 方法将返回一个空的集合。

#### `skipWhile()`

`skipWhile` 方法在给定的回调函数返回 `true` 时跳过来自集合的项，然后将剩余的项作为一个新集合返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipWhile(function (int $item) {
    return $item <= 3;
});

$subset->all();

// [4]
```

> [!WARNING]
> 如果回调函数永远不返回 `false` ，`skipWhile` 方法将返回一个空的集合。

#### `slice()`

`slice` 方法返回从给定索引开始的集合切片：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$slice = $collection->slice(4);

$slice->all();

// [5, 6, 7, 8, 9, 10]
```

如果你想要限制返回的切片的大小，请将希望的大小作为第二个参数传递给方法：

```php
$slice = $collection->slice(4, 2);

$slice->all();

// [5, 6]
```

返回的切片默认会保持键。如果你不希望保留原始键，你可以使用 [`values`](#method-values) 方法重新索引它们。

#### `sliding()`

`sliding` 方法返回一个新的集合，其中包含代表集合中项目的“滑动窗口”视图的块：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(2);

$chunks->toArray();

// [[1, 2], [2, 3], [3, 4], [4, 5]]
```

这在搭配 [`eachSpread`](#method-eachspread) 方法使用时特别有用：

```php
$transactions->sliding(2)->eachSpread(function (Collection $previous, Collection $current) {
    $current->total = $previous->total + $current->amount;
});
```

你可以选择传递第二个“步长”值，这决定了每个块的第一个项目之间的距离：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(3, step: 2);

$chunks->toArray();

// [[1, 2, 3], [3, 4, 5]]
```

#### `sole()`

`sole` 方法返回集合中通过给定真理测试的第一个元素，但前提是真理测试只与一个元素相匹配：

```php
collect([1, 2, 3, 4])->sole(function (int $value, int $key) {
    return $value === 2;
});

// 2
```

你也可以传递一个键/值对给 `sole` 方法，它将返回集合中与给定对匹配的第一个元素，但前提是只有一个元素与之匹配：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->sole('product', 'Chair');

// ['product' => 'Chair', 'price' => 100]
```

或者，你也可以不带参数调用 `sole` 方法来获取集合中的第一个元素，如果集合中只有一个元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
]);

$collection->sole();

// ['product' => 'Desk', 'price' => 200]
```

如果集合中没有元素应该由 `sole` 方法返回，将抛出一个 `\Illuminate\Collections\ItemNotFoundException` 异常。如果有多个元素应该返回，将抛出一个 `\Illuminate\Collections\MultipleItemsFoundException` 异常。

#### `some()`

[`contains`](#method-contains) 方法的别名。

#### `sort()`

`sort` 方法对集合进行排序。排序后的集合保持原始数组键，所以在以下示例中我们将使用 [`values`](#method-values) 方法来重置键，使之成为连续编号的索引：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sort();

$sorted->values()->all();

// [1, 2, 3, 4, 5]
```

如果你的排序需求更高级，你可以传递一个具有自己算法的回调函数给 `sort` 。参考 PHP 的 [`uasort`](https://secure.php.net/manual/en/function.uasort.php#refsect1-function.uasort-parameters) 文档，这正是集合的 `sort` 方法内部调用的方法。

> [!NOTE]
> 如果你需要对嵌套数组或对象的集合进行排序，请参阅 [`sortBy`](#method-sortby) 和 [`sortByDesc`](#method-sortbydesc) 方法。

#### `sortBy()`

`sortBy` 方法按给定键对集合进行排序。排序后的集合保持原始数组键，因此在下面的例子中我们将使用 [`values`](#method-values) 方法将键重置为连续编号的索引：

```php
$collection = collect([
    ['name' => 'Desk', 'price' => 200],
    ['name' => 'Chair', 'price' => 100],
    ['name' => 'Bookcase', 'price' => 150],
]);

$sorted = $collection->sortBy('price');

$sorted->values()->all();

/*
    [
        ['name' => 'Chair', 'price' => 100],
        ['name' => 'Bookcase', 'price' => 150],
        ['name' => 'Desk', 'price' => 200],
    ]
*/
```

`sortBy` 方法接受 [排序标志](https://www.php.net/manual/en/function.sort.php) 作为它的第二个参数：

```php
$collection = collect([
    ['title' => 'Item 1'],
    ['title' => 'Item 12'],
    ['title' => 'Item 3'],
]);

$sorted = $collection->sortBy('title', SORT_NATURAL);

$sorted->values()->all();

/*
    [
        ['title' => 'Item 1'],
        ['title' => 'Item 3'],
        ['title' => 'Item 12'],
    ]
*/
```

或者，你可以传递自己的闭包来决定如何对集合的值进行排序：

```php
$collection = collect([
    ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
    ['name' => 'Chair', 'colors' => ['Black']],
    ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
]);

$sorted = $collection->sortBy(function (array $product, int $key) {
    return count($product['colors']);
});

$sorted->values()->all();

/*
    [
        ['name' => 'Chair', 'colors' => ['Black']],
        ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
        ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
    ]
*/
```

如果你想根据多个属性对你的集合进行排序，你可以传递一个排序操作数组给 `sortBy` 方法。每个排序操作应该是一个包含你希望排序的属性和所需排序方向的数组：

```php
$collection = collect([
    ['name' => 'Taylor Otwell', 'age' => 34],
    ['name' => 'Abigail Otwell', 'age' => 30],
    ['name' => 'Taylor Otwell', 'age' => 36],
    ['name' => 'Abigail Otwell', 'age' => 32],
]);

$sorted = $collection->sortBy([
    ['name', 'asc'],
    ['age', 'desc'],
]);

$sorted->values()->all();

/*
    [
        ['name' => 'Abigail Otwell', 'age' => 32],
        ['name' => 'Abigail Otwell', 'age' => 30],
        ['name' => 'Taylor Otwell', 'age' => 36],
        ['name' => 'Taylor Otwell', 'age' => 34],
    ]
*/
```

在按多个属性对集合进行排序时，你也可以提供定义每个排序操作的闭包：

```php
$collection = collect([
    ['name' => 'Taylor Otwell', 'age' => 34],
    ['name' => 'Abigail Otwell', 'age' => 30],
    ['name' => 'Taylor Otwell', 'age' => 36],
    ['name' => 'Abigail Otwell', 'age' => 32],
]);

$sorted = $collection->sortBy([
    fn (array $a, array $b) => $a['name'] <=> $b['name'],
    fn (array $a, array $b) => $b['age'] <=> $a['age'],
]);

$sorted->values()->all();

/*
    [
        ['name' => 'Abigail Otwell', 'age' => 32],
        ['name' => 'Abigail Otwell', 'age' => 30],
        ['name' => 'Taylor Otwell', 'age' => 36],
        ['name' => 'Taylor Otwell', 'age' => 34],
    ]
*/
```

#### `sortByDesc()`

此方法与 [`sortBy`](#method-sortby) 方法具有相同的签名，但会以相反的顺序对集合进行排序。

#### `sortDesc()`

此方法将按与 [`sort`](#method-sort) 方法相反的顺序对集合进行排序：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sortDesc();

$sorted->values()->all();

// [5, 4, 3, 2, 1]
```

不像 `sort`，你不能向 `sortDesc` 传递一个闭包。相反，你应该使用 [`sort`](#method-sort) 方法并反转你的比较。

#### `sortKeys()`

`sortKeys` 方法按基础关联数组的键对集合进行排序：

```php
$collection = collect([
    'id' => 22345,
    'first' => 'John',
    'last' => 'Doe',
]);

$sorted = $collection->sortKeys();

$sorted->all();

/*
    [
        'first' => 'John',
        'id' => 22345,
        'last' => 'Doe',
    ]
*/
```

#### `sortKeysDesc()`

此方法与 [`sortKeys`](#method-sortkeys) 方法具有相同的签名，但会以相反的顺序对集合进行排序。

#### `sortKeysUsing()`

`sortKeysUsing` 方法使用回调按基础关联数组的键对集合进行排序：

```php
$collection = collect([
    'ID' => 22345,
    'first' => 'John',
    'last' => 'Doe',
]);

$sorted = $collection->sortKeysUsing('strnatcasecmp');

$sorted->all();

/*
    [
        'first' => 'John',
        'ID' => 22345,
        'last' => 'Doe',
    ]
*/
```

回调必须是一个比较函数，返回一个小于、等于或大于零的整数。有关更多信息，请参阅 PHP [`uksort`](https://www.php.net/manual/en/function.uksort.php#refsect1-function.uksort-parameters) 文档，`sortKeysUsing` 方法在内部使用了这个 PHP 函数。

#### `splice()`

`splice` 方法从指定索引开始移除并返回项目的一个切片：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2);

$chunk->all();

// [3, 4, 5]

$collection->all();

// [1, 2]
```

你可以传递第二个参数来限制结果集合的大小：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2, 1);

$chunk->all();

// [3]

$collection->all();

// [1, 2, 4, 5]
```

此外，你还可以传递第三个参数，包含新项目来替换从集合中移除的项目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2, 1, [10, 11]);

$chunk->all();

// [3]

$collection->all();

// [1, 2, 10, 11, 4, 5]
```

#### `split()`

`split` 方法将集合分成给定数量的组：

```php
$collection = collect([1, 2, 3, 4, 5]);

$groups = $collection->split(3);

$groups->all();

// [[1, 2], [3, 4], [5]]
```

#### `splitIn()`

`splitIn` 方法将集合分成给定数量的组，在为最后一组分配剩余部分之前完全填充非终端组：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$groups = $collection->splitIn(3);

$groups->all();

// [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
```

#### `sum()`

`sum` 方法返回集合中所有项目的总和：

```php
collect([1, 2, 3, 4, 5])->sum();

// 15
```

如果集合包含嵌套数组或对象，你应该传递一个键，将用于确定哪些值进行相加：

```php
$collection = collect([
    ['name' => 'JavaScript: The Good Parts', 'pages' => 176],
    ['name' => 'JavaScript: The Definitive Guide', 'pages' => 1096],
]);

$collection->sum('pages');

// 1272
```

此外，你可以传递自己的闭包来决定集合的哪些值要进行相加：

```php
$collection = collect([
    ['name' => 'Chair', 'colors' => ['Black']],
    ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
    ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
]);

$collection->sum(function (array $product) {
    return count($product['colors']);
});

// 6
```

#### `take()`

`take` 方法返回一个新集合，其中包含指定数量的项目：

```php
$collection = collect([0, 1, 2, 3, 4, 5]);

$chunk = $collection->take(3);

$chunk->all();

// [0, 1, 2]
```

你也可以传递一个负整数来从集合的末尾取指定数量的项目：

```php
$collection = collect([0, 1, 2, 3, 4, 5]);

$chunk = $collection->take(-2);

$chunk->all();

// [4, 5]
```

#### `takeUntil()`

`takeUntil` 方法返回集合中的项目，直到给定的回调返回 `true`：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [1, 2]
```

你也可以传递一个简单的值给 `takeUntil` 方法以获取找到给定值之前的所有项目：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeUntil(3);

$subset->all();

// [1, 2]
```

> [!WARNING]
> 如果未找到给定值或回调从未返回 `true`，`takeUntil` 方法将返回集合中的所有项目。

#### `takeWhile()`

`takeWhile` 方法返回集合中的项目，直到给定的回调返回 `false`：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeWhile(function (int $item) {
    return $item < 3;
});

$subset->all();

// [1, 2]
```

> [!WARNING]
> 如果回调从未返回 `false`，`takeWhile` 方法将返回集合中的所有项目。

#### `tap()`

`tap` 方法将集合传递给给定的回调，允许你在特定点"轻击"集合并对项目进行操作，同时不影响集合本身。然后通过 `tap` 方法返回集合：

```php
collect([2, 4, 3, 1, 5])
    ->sort()
    ->tap(function (Collection $collection) {
        Log::debug('Values after sorting', $collection->values()->all());
    })
    ->shift();

// 1
```

#### `times()`

静态 `times` 方法通过指定次数调用给定闭包来创建一个新集合：

```php
$collection = Collection::times(10, function (int $number) {
    return $number * 9;
});

$collection->all();

// [9, 18, 27, 36, 45, 54, 63, 72, 81, 90]
```

#### `toArray()`

`toArray` 方法将集合转换为一个普通的 PHP `array`。如果集合的值是 [Eloquent](/docs/11/eloquent/eloquent) 模型，模型也会被转换为数组：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toArray();

/*
    [
        ['name' => 'Desk', 'price' => 200],
    ]
*/
```

> [!WARNING] > `toArray` 还会将集合中的所有嵌套对象转换为数组，这些对象是 `Arrayable` 的实例。如果你想获取集合的底层原始数组，请使用 [`all`](#method-all) 方法。

#### `toJson()`

`toJson` 方法将集合转换为 JSON 序列化字符串：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toJson();

// '{"name":"Desk", "price":200}'
```

#### `transform()`

`transform` 方法迭代集合并将给定回调传递给集合中的每个项。集合中的项目将被回调返回的值所替换：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->transform(function (int $item, int $key) {
    return $item * 2;
});

$collection->all();

// [2, 4, 6, 8, 10]
```

> [!WARNING]
> 与大多数其它集合方法不同，`transform` 修改了集合本身。如果你希望创建一个新的集合，请使用 [`map`](#method-map) 方法。

#### `undot()`

`undot` 方法将使用“点”记法的单维集合展开为多维集合：

```php
$person = collect([
    'name.first_name' => 'Marie',
    'name.last_name' => 'Valentine',
    'address.line_1' => '2992 Eagle Drive',
    'address.line_2' => '',
    'address.suburb' => 'Detroit',
    'address.state' => 'MI',
    'address.postcode' => '48219'
]);

$person = $person->undot();

$person->toArray();

/*
    [
        "name" => [
            "first_name" => "Marie",
            "last_name" => "Valentine",
        ],
        "address" => [
            "line_1" => "2992 Eagle Drive",
            "line_2" => "",
            "suburb" => "Detroit",
            "state" => "MI",
            "postcode" => "48219",
        ],
    ]
*/
```

#### `union()`

`union` 方法将给定数组添加到集合中。如果给定数组包含原始集合中已经存在的键，则原始集合的值将被优先使用：

```php
$collection = collect([1 => ['a'], 2 => ['b']]);

$union = $collection->union([3 => ['c'], 1 => ['d']]);

$union->all();

// [1 => ['a'], 2 => ['b'], 3 => ['c']]
```

#### `unique()`

`unique` 方法返回集合中所有唯一的项目。返回的集合保持了原始数组键，所以在下面的例子中我们将使用 [`values`](#method-values) 方法将键重置为连续编号的索引：

```php
$collection = collect([1, 1, 2, 2, 3, 4, 2]);

$unique = $collection->unique();

$unique->values()->all();

// [1, 2, 3, 4]
```

处理嵌套数组或对象时，你可以指定用于确定唯一性的键：

```php
$collection = collect([
    ['name' => 'iPhone 6', 'brand' => 'Apple', 'type' => 'phone'],
    ['name' => 'iPhone 5', 'brand' => 'Apple', 'type' => 'phone'],
    ['name' => 'Apple Watch', 'brand' => 'Apple', 'type' => 'watch'],
    ['name' => 'Galaxy S6', 'brand' => 'Samsung', 'type' => 'phone'],
    ['name' => 'Galaxy Gear', 'brand' => 'Samsung', 'type' => 'watch'],
]);

$unique = $collection->unique('brand');

$unique->values()->all();

/*
    [
        ['name' => 'iPhone 6', 'brand' => 'Apple', 'type' => 'phone'],
        ['name' => 'Galaxy S6', 'brand' => 'Samsung', 'type' => 'phone'],
    ]
*/
```

你还可以将你自己的闭包传递给 `unique` 方法来指定应该确定项目唯一性的值：

```php
$unique = $collection->unique(function (array $item) {
    return $item['brand'].$item['type'];
});

$unique->values()->all();

/*
    [
        ['name' => 'iPhone 6', 'brand' => 'Apple', 'type' => 'phone'],
        ['name' => 'Apple Watch', 'brand' => 'Apple', 'type' => 'watch'],
        ['name' => 'Galaxy S6', 'brand' => 'Samsung', 'type' => 'phone'],
        ['name' => 'Galaxy Gear', 'brand' => 'Samsung', 'type' => 'watch'],
    ]
*/
```

`unique` 方法在检查项目值时使用“宽松”比较，这意味着具有整数值的字符串将被认为等同于同一值的整数。使用 [`uniqueStrict`](#method-uniquestrict) 方法进行“严格”比较来过滤。

> [!NOTE]
> 使用 [Eloquent Collections](/docs/11/eloquent/eloquent-collections#method-unique) 时，这个方法的行为有所不同。

#### `uniqueStrict()`

这个方法与 [`unique`](#method-unique) 方法有相同的签名；然而，所有的值都是使用“严格”比较来比较的。

#### `unless()`

`unless` 方法将在第一个给定的方法参数评估为 `true` 时执行给定的回调：

```php
$collection = collect([1, 2, 3]);

$collection->unless(true, function (Collection $collection) {
    return $collection->push(4);
});

$collection->unless(false, function (Collection $collection) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 5]
```

第二个回调可以传递给 `unless` 方法。当给 `unless` 方法的第一个参数评估为 `true` 时，将执行第二个回调：

```php
$collection = collect([1, 2, 3]);

$collection->unless(true, function (Collection $collection) {
    return $collection->push(4);
}, function (Collection $collection) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 5]
```

与 `unless` 相反的方法，请参见 [`when`](#method-when) 方法。

#### `unlessEmpty()`

[`whenNotEmpty`](#method-whennotempty) 方法的别名。

#### `unlessNotEmpty()`

[`whenEmpty`](#method-whenempty) 方法的别名。

#### `unwrap()`

静态的 `unwrap` 方法会在适用的情况下从给定值中返回集合的底层数组：

```php
Collection::unwrap(collect('John Doe'));

// ['John Doe']

Collection::unwrap(['John Doe']);

// ['John Doe']

Collection::unwrap('John Doe');

// 'John Doe'
```

#### `value()`

`value` 方法从集合的第一个元素中检索给定的值：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Speaker', 'price' => 400],
]);

$value = $collection->value('price');

// 200
```

#### `values()`

`values` 方法返回一个新的集合，其中的键被重置为连续的整数：

```php
$collection = collect([
    10 => ['product' => 'Desk', 'price' => 200],
    11 => ['product' => 'Desk', 'price' => 200],
]);

$values = $collection->values();

$values->all();

/*
    [
        0 => ['product' => 'Desk', 'price' => 200],
        1 => ['product' => 'Desk', 'price' => 200],
    ]
*/
```

#### `when()`

当给定的方法的第一个参数评估为 `true` 时，`when` 方法将执行给定的回调。集合实例和传递给 `when` 方法的第一个参数将提供给闭包：

```php
$collection = collect([1, 2, 3]);

$collection->when(true, function (Collection $collection, int $value) {
    return $collection->push(4);
});

$collection->when(false, function (Collection $collection, int $value) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 4]
```

第二个回调可传递给 `when` 方法。当给 `when` 方法的第一个参数评估为 `false` 时，将执行第二个回调：

```php
$collection = collect([1, 2, 3]);

$collection->when(false, function (Collection $collection, int $value) {
    return $collection->push(4);
}, function (Collection $collection) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 5]
```

与 `when` 相反的方法，请参见 [`unless`](#method-unless) 方法。

#### `whenEmpty()`

当集合为空时，`whenEmpty` 方法将执行给定的回调：

```php
$collection = collect(['Michael', 'Tom']);

$collection->whenEmpty(function (Collection $collection) {
    return $collection->push('Adam');
});

$collection->all();

// ['Michael', 'Tom']


$collection = collect();

$collection->whenEmpty(function (Collection $collection) {
    return $collection->push('Adam');
});

$collection->all();

// ['Adam']
```

第二个闭包可以传递给 `whenEmpty` 方法，当集合不为空时将执行该闭包：

```php
$collection = collect(['Michael', 'Tom']);

$collection->whenEmpty(function (Collection $collection) {
    return $collection->push('Adam');
}, function (Collection $collection) {
    return $collection->push('Taylor');
});

$collection->all();

// ['Michael', 'Tom', 'Taylor']
```

与 `whenEmpty` 相反的方法，请参见 [`whenNotEmpty`](#method-whennotempty) 方法。

#### `whenNotEmpty()`

当集合不为空时，`whenNotEmpty` 方法将执行给定的回调：

```php
$collection = collect(['michael', 'tom']);

$collection->whenNotEmpty(function (Collection $collection) {
    return $collection->push('adam');
});

$collection->all();

// ['michael', 'tom', 'adam']


$collection = collect();

$collection->whenNotEmpty(function (Collection $collection) {
    return $collection->push('adam');
});

$collection->all();

// []
```

第二个闭包可以传递给 `whenNotEmpty` 方法，当集合为空时将执行该闭包：

```php
$collection = collect();

$collection->whenNotEmpty(function (Collection $collection) {
    return $collection->push('adam');
}, function (Collection $collection) {
    return $collection->push('taylor');
});

$collection->all();

// ['taylor']
```

与 `whenNotEmpty` 相反的方法，请参见 [`whenEmpty`](#method-whenempty) 方法。

````php
#### `where()` {.collection-method}

`where` 方法通过给定的键值对过滤集合:

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->where('price', 100);

$filtered->all();

/*
    [
        ['product' => 'Chair', 'price' => 100],
        ['product' => 'Door', 'price' => 100],
    ]
*/
````

`where` 方法在检查项目值时使用了 "松散" 的比较，意味着字符串型的整数值会被认为等同于相同值的整数。如果想使用 "严格" 比较进行过滤，请使用 [`whereStrict`](#method-wherestrict) 方法。

你还可以选择性地传递比较运算符作为第二个参数。支持的运算符有: '===', '!==', '!=', '==', '=', '<>', '>', '<', '>=', 以及 '<=':

```php
$collection = collect([
    ['name' => 'Jim', 'deleted_at' => '2019-01-01 00:00:00'],
    ['name' => 'Sally', 'deleted_at' => '2019-01-02 00:00:00'],
    ['name' => 'Sue', 'deleted_at' => null],
]);

$filtered = $collection->where('deleted_at', '!=', null);

$filtered->all();

/*
    [
        ['name' => 'Jim', 'deleted_at' => '2019-01-01 00:00:00'],
        ['name' => 'Sally', 'deleted_at' => '2019-01-02 00:00:00'],
    ]
*/
```

#### `whereStrict()` {.collection-method}

此方法与 [`where`](#method-where) 方法有相同的签名，但所有值都会使用 "严格" 比较进行比较。

#### `whereBetween()` {.collection-method}

`whereBetween` 方法通过确定指定的项目值是否在给定的范围内来过滤集合:

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 80],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Pencil', 'price' => 30],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereBetween('price', [100, 200]);

$filtered->all();

/*
    [
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Bookcase', 'price' => 150],
        ['product' => 'Door', 'price' => 100],
    ]
*/
```

#### `whereIn()` {.collection-method}

`whereIn` 方法剔除集合中未包含在给定数组中的指定项目值的元素:

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereIn('price', [150, 200]);

$filtered->all();

/*
    [
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Bookcase', 'price' => 150],
    ]
*/
```

`whereIn` 方法在检查项目值时使用了 "松散" 的比较。如果想使用 "严格" 比较进行过滤，请使用 [`whereInStrict`](#method-whereinstrict) 方法。

#### `whereInStrict()` {.collection-method}

此方法与 [`whereIn`](#method-wherein) 方法有相同的签名，但所有值都会使用 "严格" 比较进行比较。

#### `whereInstanceOf()` {.collection-method}

`whereInstanceOf` 方法根据给定的类类型过滤集合:

```php
use App\Models\User;
use App\Models\Post;

$collection = collect([
    new User,
    new User,
    new Post,
]);

$filtered = $collection->whereInstanceOf(User::class);

$filtered->all();

// [App\Models\User, App\Models\User]
```

#### `whereNotBetween()` {.collection-method}

`whereNotBetween` 方法通过确定指定的项目值是否在给定范围外来过滤集合:

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 80],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Pencil', 'price' => 30],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereNotBetween('price', [100, 200]);

$filtered->all();

/*
    [
        ['product' => 'Chair', 'price' => 80],
        ['product' => 'Pencil', 'price' => 30],
    ]
*/
```

#### `whereNotIn()` {.collection-method}

`whereNotIn` 方法剔除集合中包含在给定数组中的指定项目值的元素:

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereNotIn('price', [150, 200]);

$filtered->all();

/*
    [
        ['product' => 'Chair', 'price' => 100],
        ['product' => 'Door', 'price' => 100],
    ]
*/
```

`whereNotIn` 方法在检查项目值时使用了 "松散" 的比较。如果想使用 "严格" 比较进行过滤，请使用 [`whereNotInStrict`](#method-wherenotinstrict) 方法。

#### `whereNotInStrict()` {.collection-method}

此方法与 [`whereNotIn`](#method-wherenotin) 方法有相同的签名，但所有值都会使用 "严格" 比较进行比较。

#### `whereNotNull()` {.collection-method}

`whereNotNull` 方法返回集合中给定键非 `null` 的条目:

```php
$collection = collect([
    ['name' => 'Desk'],
    ['name' => null],
    ['name' => 'Bookcase'],
]);

$filtered = $collection->whereNotNull('name');

$filtered->all();

/*
    [
        ['name' => 'Desk'],
        ['name' => 'Bookcase'],
    ]
*/
```

#### `whereNull()` {.collection-method}

`whereNull` 方法返回集合中给定键为 `null` 的条目:

```php
$collection = collect([
    ['name' => 'Desk'],
    ['name' => null],
    ['name' => 'Bookcase'],
]);

$filtered = $collection->whereNull('name');

$filtered->all();

/*
    [
        ['name' => null],
    ]
*/
```

#### `wrap()` {.collection-method}

当适用时，静态 `wrap` 方法会把给定值包裹在一个集合中:

```php
use Illuminate\Support\Collection;

$collection = Collection::wrap('John Doe');

$collection->all();

// ['John Doe']

$collection = Collection::wrap(['John Doe']);

$collection->all();

// ['John Doe']

$collection = Collection::wrap(collect('John Doe'));

$collection->all();

// ['John Doe']
```

#### `zip()` {.collection-method}

`zip` 方法将给定数组的值与原集合的值合并在它们对应的索引位置:

```php
$collection = collect(['Chair', 'Desk']);

$zipped = $collection->zip([100, 200]);

$zipped->all();

// [['Chair', 100], ['Desk', 200]]
```

## 高阶消息 {#higher-order-messages}

集合也提供了对"高阶消息"的支持，这些高阶消息是对集合常见操作的快捷方式。提供高阶消息的集合方法有: [`average`](#method-average), [`avg`](#method-avg), [`contains`](#method-contains), [`each`](#method-each), [`every`](#method-every), [`filter`](#method-filter), [`first`](#method-first), [`flatMap`](#method-flatmap), [`groupBy`](#method-groupby), [`keyBy`](#method-keyby), [`map`](#method-map), [`max`](#method-max), [`min`](#method-min), [`partition`](#method-partition), [`reject`](#method-reject), [`skipUntil`](#method-skipuntil), [`skipWhile`](#method-skipwhile), [`some`](#method-some), [`sortBy`](#method-sortby), [`sortByDesc`](#method-sortbydesc), [`sum`](#method-sum), [`takeUntil`](#method-takeuntil), [`takeWhile`](#method-takewhile), 以及 [`unique`](#method-unique)。

每个高阶消息都可以作为集合实例上的动态属性被访问。例如，我们使用 `each` 高阶消息在集合中的每个对象上调用一个方法:

```php
use App\Models\User;

$users = User::where('votes', '>', 500)->get();

$users->each->markAsVip();
```

同样，我们也可以使用 `sum` 高阶消息来聚合一组用户的 "votes" 总数:

```php
$users = User::where('group', 'Development')->get();

return $users->sum->votes;
```

## 惰性集合

### 简介

> [!WARNING]
> 在了解更多关于 Laravel 的惰性集合之前，请花些时间熟悉 [PHP 生成器](https://www.php.net/manual/en/language.generators.overview.php)。

为了补充已经相当强大的 `Collection` 类，`LazyCollection` 类利用了 PHP 的 [生成器](https://www.php.net/manual/en/language.generators.overview.php)，以允许你处理非常大的数据集合，同时保持低内存使用量。

例如，想象一下你的应用需要处理一个多 GB 的日志文件，同时利用 Laravel 的集合方法来解析日志。与其一次将整个文件读入内存，不如使用惰性集合来只在内存中保留文件的一小部分：

```php
use App\Models\LogEntry;
use Illuminate\Support\LazyCollection;

LazyCollection::make(function () {
    $handle = fopen('log.txt', 'r');

    while (($line = fgets($handle)) !== false) {
        yield $line;
    }
})->chunk(4)->map(function (array $lines) {
    return LogEntry::fromLines($lines);
})->each(function (LogEntry $logEntry) {
    // 处理日志条目...
});
```

或者，想象一下你需要遍历 10,000 个 Eloquent 模型。当使用传统的 Laravel 集合时，所有 10,000 个 Eloquent 模型必须同时加载到内存中：

```php
use App\Models\User;

$users = User::all()->filter(function (User $user) {
    return $user->id > 500;
});
```

然而，查询构造器的 `cursor` 方法返回一个 `LazyCollection` 实例。这允许你仍然只对数据库执行单次查询，但同时一次只在内存中保持一个 Eloquent 模型。在这个示例中，`filter` 回调不会执行，直到我们实际上逐个迭代每个用户，这样允许剧烈减少内存使用：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

### 创建惰性集合

要创建惰性集合实例，你应该将一个 PHP 生成器函数传递给集合的 `make` 方法：

```php
use Illuminate\Support\LazyCollection;

LazyCollection::make(function () {
    $handle = fopen('log.txt', 'r');

    while (($line = fgets($handle)) !== false) {
        yield $line;
    }
});
```

### Enumerable 合约

几乎所有在 `Collection` 类上可用的方法也都在 `LazyCollection` 类上可用。这两个类都实现了 `Illuminate\Support\Enumerable` 合约，该合约定义了以下方法：

- all
- average
- avg
- chunk
- ...
- zip

> [!WARNING]
> 在 `LazyCollection` 类上，会变更集合自身的方法（例如 `shift`、`pop`、`prepend` 等）是**不**可用的。

### 惰性集合方法

除了 `Enumerable` 合约定义的方法之外，`LazyCollection` 类还包含以下方法：

#### `takeUntilTimeout()` {.collection-method}

`takeUntilTimeout` 方法返回一个新的惰性集合，该集合将枚举值，直到指定的时间。之后，集合将停止枚举：

```php
$lazyCollection = LazyCollection::times(INF)
    ->takeUntilTimeout(now()->addMinute());

$lazyCollection->each(function (int $number) {
    dump($number);

    sleep(1);
});

// 1
// 2
// ...
// 58
// 59
```

为了说明这个方法的用途，想象一个应用程序，它使用游标从数据库提交发票。你可以定义一个 [计划任务](/docs/11/digging-deeper/scheduling) 每 15 分钟运行一次，并且最多只处理 14 分钟的发票：

```php
use App\Models\Invoice;
use Illuminate\Support\Carbon;

Invoice::pending()->cursor()
    ->takeUntilTimeout(
        Carbon::createFromTimestamp(LARAVEL_START)->add(14, 'minutes')
    )
    ->each(fn (Invoice $invoice) => $invoice->submit());
```

#### `tapEach()` {.collection-method}

虽然 `each` 方法会立即为集合中的每个项调用给定的回调，但 `tapEach` 方法只在项一个接一个地从列表中被取出时，调用给定的回调：

```php
// 到目前为止，还没有任何东西被转储...
$lazyCollection = LazyCollection::times(INF)->tapEach(function (int $value) {
    dump($value);
});

// 三个项被转储...
$array = $lazyCollection->take(3)->all();

// 1
// 2
// 3
```

#### `remember()` {.collection-method}

`remember` 方法返回一个新的惰性集合，它将记住已经被枚举过的任何值，并且在后续的集合枚举中不会再次检索它们：

```php
// 还没有执行任何查询...
$users = User::cursor()->remember();

// 执行了查询...
// 数据库中的前 5 个用户被填充...
$users->take(5)->all();

// 前 5 个用户来自于集合的缓存...
// 其余的从数据库中填充...
$users->take(20)->all();
```
