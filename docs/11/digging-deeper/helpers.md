---
title: Laravel 助手函数
---

# 助手函数

[[toc]]

## 介绍

Laravel 包含了多种全局的助手 PHP 函数。这些函数中的许多被框架本身使用；然而，如果你觉得它们方便，你也可以在你自己的应用程序中自由使用它们。

## 数组 & 对象

#### `Arr::accessible()`

`Arr::accessible` 方法判断给定值是否可作为数组访问：

```php
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

$isAccessible = Arr::accessible(['a' => 1, 'b' => 2]);

// true

$isAccessible = Arr::accessible(new Collection);

// true

$isAccessible = Arr::accessible('abc');

// false

$isAccessible = Arr::accessible(new stdClass);

// false
```

#### `Arr::add()`

`Arr::add` 方法如果给定键不存在于数组中或者设置为 `null`，则将给定的键值对添加到数组：

```php
use Illuminate\Support\Arr;

$array = Arr::add(['name' => 'Desk'], 'price', 100);

// ['name' => 'Desk', 'price' => 100]

$array = Arr::add(['name' => 'Desk', 'price' => null], 'price', 100);

// ['name' => 'Desk', 'price' => 100]
```

#### `Arr::collapse()`

`Arr::collapse` 方法将一个数组的数组折叠成一个单一数组：

```php
use Illuminate\Support\Arr;

$array = Arr::collapse([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);

// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

#### `Arr::crossJoin()`

`Arr::crossJoin` 方法交叉连接给定的数组，返回所有可能排列组合的笛卡尔积：

```php
use Illuminate\Support\Arr;

$matrix = Arr::crossJoin([1, 2], ['a', 'b']);

/*
    [
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
    ]
*/

$matrix = Arr::crossJoin([1, 2], ['a', 'b'], ['I', 'II']);

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

#### `Arr::divide()`

`Arr::divide` 方法返回两个数组：一个包含键，另一个包含给定数组的值：

```php
use Illuminate\Support\Arr;

[$keys, $values] = Arr::divide(['name' => 'Desk']);

// $keys: ['name']

// $values: ['Desk']
```

#### `Arr::dot()`

`Arr::dot` 方法将多维数组展平为单级数组，使用 "点" 表示法表示深度：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

$flattened = Arr::dot($array);

// ['products.desk.price' => 100]
```

#### `Arr::except()`

`Arr::except` 方法从数组中移除给定的键值对：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Desk', 'price' => 100];

$filtered = Arr::except($array, ['price']);

// ['name' => 'Desk']
```

#### `Arr::exists()`

`Arr::exists` 方法检查给定的键是否存在于提供的数组中：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'John Doe', 'age' => 17];

$exists = Arr::exists($array, 'name');

// true

$exists = Arr::exists($array, 'salary');

// false
```

#### `Arr::first()`

`Arr::first` 方法返回数组的第一个元素，该元素通过给定的真实测试：

```php
use Illuminate\Support\Arr;

$array = [100, 200, 300];

$first = Arr::first($array, function (int $value, int $key) {
    return $value >= 150;
});

// 200
```

也可以将默认值作为方法的第三个参数传递。如果没有值通过真实测试，将返回这个值：

```php
use Illuminate\Support\Arr;

$first = Arr::first($array, $callback, $default);
```

#### `Arr::flatten()`

`Arr::flatten` 方法将多维数组展平为单级数组：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'languages' => ['PHP', 'Ruby']];

$flattened = Arr::flatten($array);

// ['Joe', 'PHP', 'Ruby']
```

#### `Arr::forget()`

`Arr::forget` 方法使用 "点" 表示法从深层嵌套数组中移除给定的键值对：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

Arr::forget($array, 'products.desk');

// ['products' => []]
```

#### `Arr::get()`

`Arr::get` 方法使用 "点" 表示法从深层嵌套数组中检索值：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

$price = Arr::get($array, 'products.desk.price');

// 100
```

`Arr::get` 方法也接受一个默认值，如果指定的键不在数组中，将返回这个默认值：

```php
use Illuminate\Support\Arr;

$discount = Arr::get($array, 'products.desk.discount', 0);

// 0
```

#### `Arr::has()`

`Arr::has` 方法使用 "点" 表示法检查给定的项或项是否存在于数组中：

```php
use Illuminate\Support\Arr;

$array = ['product' => ['name' => 'Desk', 'price' => 100]];

$contains = Arr::has($array, 'product.name');

// true

$contains = Arr::has($array, ['product.price', 'product.discount']);

// false
```

#### `Arr::hasAny()`

`Arr::hasAny` 方法使用 "点" 表示法检查给定集合中的任何项是否存在于数组中：

```php
use Illuminate\Support\Arr;

$array = ['product' => ['name' => 'Desk', 'price' => 100]];

$contains = Arr::hasAny($array, 'product.name');

// true

$contains = Arr::hasAny($array, ['product.name', 'product.discount']);

// true

$contains = Arr::hasAny($array, ['category', 'product.discount']);

// false
```

#### `Arr::isAssoc()`

`Arr::isAssoc` 方法如果给定数组是关联数组则返回 `true`。如果数组没有从零开始的连续数字键，则被认为是 "关联的"：

```php
use Illuminate\Support\Arr;

$isAssoc = Arr::isAssoc(['product' => ['name' => 'Desk', 'price' => 100]]);

// true

$isAssoc = Arr::isAssoc([1, 2, 3]);

// false
```

#### `Arr::isList()`

`Arr::isList` 方法如果给定数组的键是从零开始的连续整数，则返回 `true`：

```php
use Illuminate\Support\Arr;

$isList = Arr::isList(['foo', 'bar', 'baz']);

// true

$isList = Arr::isList(['product' => ['name' => 'Desk', 'price' => 100]]);

// false
```

#### `Arr::join()`

`Arr::join` 方法用字符串连接数组元素。使用这个方法的第二个参数，你还可以指定数组最后一个元素的连接字符串：

```php
use Illuminate\Support\Arr;

$array = ['Tailwind', 'Alpine', 'Laravel', 'Livewire'];

$joined = Arr::join($array, ', ');

// Tailwind, Alpine, Laravel, Livewire

$joined = Arr::join($array, ', ', ' and ');

// Tailwind, Alpine, Laravel and Livewire
```

#### `Arr::keyBy()`

`Arr::keyBy` 方法用给定键键数组。如果多个项具有相同的键，只有最后一个将出现在新数组中：

```php
use Illuminate\Support\Arr;

$array = [
    ['product_id' => 'prod-100', 'name' => 'Desk'],
    ['product_id' => 'prod-200', 'name' => 'Chair'],
];

$keyed = Arr::keyBy($array, 'product_id');

/*
    [
        'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
        'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]
*/
```

#### `Arr::last()`

`Arr::last` 方法返回数组的最后一个元素，该元素通过给定的真实测试：

```php
use Illuminate\Support\Arr;

$array = [100, 200, 300, 110];

$last = Arr::last($array, function (int $value, int $key) {
    return $value >= 150;
});

// 300
```

也可以将默认值作为方法的第三个参数传递。如果没有值通过真实测试，将返回这个值：

```php
use Illuminate\Support\Arr;

$last = Arr::last($array, $callback, $default);
```

#### `Arr::map()`

`Arr::map` 方法遍历数组并将每个值和键传递给给定的回调。数组值被回调返回的值替换：

```php
use Illuminate\Support\Arr;

$array = ['first' => 'james', 'last' => 'kirk'];

$mapped = Arr::map($array, function (string $value, string $key) {
    return ucfirst($value);
});

// ['first' => 'James', 'last' => 'Kirk']
```

#### `Arr::mapSpread()`

`Arr::mapSpread` 方法遍历数组，将每个嵌套项值传递到给定的闭包。闭包可以自由修改项并返回它，从而形成一个新的修改后的项数组：

```php
use Illuminate\Support\Arr;

$array = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
];

$mapped = Arr::mapSpread($array, function (int $even, int $odd) {
    return $even + $odd;
});

/*
    [1, 5, 9, 13, 17]
*/
```

#### `Arr::mapWithKeys()`

`Arr::mapWithKeys` 方法遍历数组并将每个值传递给给定的回调。回调应返回包含单个键值对的关联数组：

```php
use Illuminate\Support\Arr;

$array = [
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
];

$mapped = Arr::mapWithKeys($array, function (array $item, int $key) {
    return [$item['email'] => $item['name']];
});

/*
    [
        'john@example.com' => 'John',
        'jane@example.com' => 'Jane',
    ]
*/
```

#### `Arr::only()`

`Arr::only` 方法仅从给定数组中返回指定的键值对：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Desk', 'price' => 100, 'orders' => 10];

$slice = Arr::only($array, ['name', 'price']);

// ['name' => 'Desk', 'price' => 100]
```

#### `Arr::pluck()`

`Arr::pluck` 方法从数组中提取给定键的所有值：

```php
use Illuminate\Support\Arr;

$array = [
    ['developer' => ['id' => 1, 'name' => 'Taylor']],
    ['developer' => ['id' => 2, 'name' => 'Abigail']],
];

$names = Arr::pluck($array, 'developer.name');

// ['Taylor', 'Abigail']
```

你也可以指定你希望结果列表如何键定：

```php
use Illuminate\Support\Arr;

$names = Arr::pluck($array, 'developer.name', 'developer.id');

// [1 => 'Taylor', 2 => 'Abigail']
```

#### `Arr::prepend()`

`Arr::prepend` 方法会将一个元素推到数组的开头：

```php
use Illuminate\Support\Arr;

$array = ['one', 'two', 'three', 'four'];

$array = Arr::prepend($array, 'zero');

// ['zero', 'one', 'two', 'three', 'four']
```

如果需要，你可以指定用于值的键：

```php
use Illuminate\Support\Arr;

$array = ['price' => 100];

$array = Arr::prepend($array, 'Desk', 'name');

// ['name' => 'Desk', 'price' => 100]
```

#### `Arr::prependKeysWith()`

`Arr::prependKeysWith` 方法用给定前缀预置关联数组的所有键名：

```php
use Illuminate\Support\Arr;

$array = [
    'name' => 'Desk',
    'price' => 100,
];

$keyed = Arr::prependKeysWith($array, 'product.');

/*
    [
        'product.name' => 'Desk',
        'product.price' => 100,
    ]
*/
```

#### `Arr::pull()`

`Arr::pull` 方法返回并移除数组中的一个键值对：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Desk', 'price' => 100];

$name = Arr::pull($array, 'name');

// $name: Desk

// $array: ['price' => 100]
```

也可以将默认值作为方法的第三个参数传递。如果键不存在，将返回这个值：

```php
use Illuminate\Support\Arr;

$value = Arr::pull($array, $key, $default);
```

#### `Arr::query()`

`Arr::query` 方法将数组转换为查询字符串：

```php
use Illuminate\Support\Arr;

$array = [
    'name' => 'Taylor',
    'order' => [
        'column' => 'created_at',
        'direction' => 'desc'
    ]
];

Arr::query($array);

// name=Taylor&order[column]=created_at&order[direction]=desc
```

#### `Arr::random()`

`Arr::random` 方法从数组中返回一个随机值：

```php
use Illuminate\Support\Arr;

$array = [1, 2, 3, 4, 5];

$random = Arr::random($array);

// 4 - （随机获取）
```

你也可以指定作为可选第二个参数返回的项数。注意，即使只需要一个项，提供这个参数也将返回一个数组：

```php
use Illuminate\Support\Arr;

$items = Arr::random($array, 2);

// [2, 5] - （随机获取）
```

#### `Arr::set()`

`Arr::set` 方法使用 "点" 表示法在深度嵌套的数组中设置值：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

Arr::set($array, 'products.desk.price', 200);

// ['products' => ['desk' => ['price' => 200]]]
```

#### `Arr::shuffle()`

`Arr::shuffle` 方法随机地打乱数组中的项：

```php
use Illuminate\Support\Arr;

$array = Arr::shuffle([1, 2, 3, 4, 5]);

// [3, 2, 5, 1, 4] - （随机生成）
```

#### `Arr::sort()`

`Arr::sort` 方法按值对数组进行排序：

```php
use Illuminate\Support\Arr;

$array = ['Desk', 'Table', 'Chair'];

$sorted = Arr::sort($array);

// ['Chair', 'Desk', 'Table']
```

你也可以通过给定闭包的结果排序数组：

```php
use Illuminate\Support\Arr;

$array = [
    ['name' => 'Desk'],
    ['name' => 'Table'],
    ['name' => 'Chair'],
];

$sorted = array_values(Arr::sort($array, function (array $value) {
    return $value['name'];
}));

/*
    [
        ['name' => 'Chair'],
        ['name' => 'Desk'],
        ['name' => 'Table'],
    ]
*/
```

#### `Arr::sortDesc()`

`Arr::sortDesc` 方法按值对数组进行降序排序：

```php
use Illuminate\Support\Arr;

$array = ['Desk', 'Table', 'Chair'];

$sorted = Arr::sortDesc($array);

// ['Table', 'Desk', 'Chair']
```

你也可以通过给定闭包的结果对数组进行排序：

```php
use Illuminate\Support\Arr;

$array = [
    ['name' => 'Desk'],
    ['name' => 'Table'],
    ['name' => 'Chair'],
];

$sorted = array_values(Arr::sortDesc($array, function (array $value) {
    return $value['name'];
}));

/*
    [
        ['name' => 'Table'],
        ['name' => 'Desk'],
        ['name' => 'Chair'],
    ]
*/
```

#### `Arr::sortRecursive()`

`Arr::sortRecursive` 方法使用 `sort` 函数对数组的数值索引子数组进行递归排序，并使用 `ksort` 函数对关联子数组进行排序：

```php
use Illuminate\Support\Arr;

$array = [
    ['Roman', 'Taylor', 'Li'],
    ['PHP', 'Ruby', 'JavaScript'],
    ['one' => 1, 'two' => 2, 'three' => 3],
];

$sorted = Arr::sortRecursive($array);

/*
    [
        ['JavaScript', 'PHP', 'Ruby'],
        ['one' => 1, 'three' => 3, 'two' => 2],
        ['Li', 'Roman', 'Taylor'],
    ]
*/
```

如果你希望结果降序排序，你可以使用 `Arr::sortRecursiveDesc` 方法。

```php
$sorted = Arr::sortRecursiveDesc($array);
```

#### `Arr::take()`

`Arr::take` 方法返回一个新数组，其中包含指定数量的项：

```php
use Illuminate\Support\Arr;

$array = [0, 1, 2, 3, 4, 5];

$chunk = Arr::take($array, 3);

// [0, 1, 2]
```

你也可以传递一个负整数，以从数组的末尾取出指定数量的项：

```php
$array = [0, 1, 2, 3, 4, 5];

$chunk = Arr::take($array, -2);

// [4, 5]
```

#### `Arr::toCssClasses()`

`Arr::toCssClasses` 方法有条件地编译 CSS 类字符串。该方法接受一个键值数组，其中数组键包含你希望添加的类，而值是一个布尔表达式。如果数组元素有数字键，它将始终包括在渲染的类列表中：

```php
use Illuminate\Support\Arr;

$isActive = false;
$hasError = true;

$array = ['p-4', 'font-bold' => $isActive, 'bg-red' => $hasError];

$classes = Arr::toCssClasses($array);

/*
    'p-4 bg-red'
*/
```

#### `Arr::toCssStyles()`

`Arr::toCssStyles` 方法有条件地编译 CSS 样式字符串。该方法接受一个键值数组，其中数组键包含你希望添加的类，而值是一个布尔表达式。如果数组元素有数字键，它将始终包括在渲染的类列表中：

```php
use Illuminate\Support\Arr;

$hasColor = true;

$array = ['background-color: blue', 'color: blue' => $hasColor];

$classes = Arr::toCssStyles($array);

/*
    'background-color: blue; color: blue;'
*/
```

这个方法实现了 Laravel 的功能，允许[与 Blade 组件的属性包合并类](/docs/11/basics/blade#conditionally-merge-classes)以及 `@class` [Blade 指令](/docs/11/basics/blade#conditional-classes)。

#### `Arr::undot()`

`Arr::undot` 方法将使用 "点" 表示法的单维数组展开为多维数组：

```php
use Illuminate\Support\Arr;

$array = [
    'user.name' => 'Kevin Malone',
    'user.occupation' => 'Accountant',
];

$array = Arr::undot($array);

// ['user' => ['name' => 'Kevin Malone', 'occupation' => 'Accountant']]
```

#### `Arr::where()`

`Arr::where` 方法使用给定的闭包过滤数组：

```php
use Illuminate\Support\Arr;

$array = [100, '200', 300, '400', 500];

$filtered = Arr::where($array, function (string|int $value, int $key) {
    return is_string($value);
});

// [1 => '200', 3 => '400']
```

#### `Arr::whereNotNull()`

`Arr::whereNotNull` 方法从给定数组中移除所有 `null` 值：

```php
use Illuminate\Support\Arr;

$array = [0, null];

$filtered = Arr::whereNotNull($array);

// [0 => 0]
```

#### `Arr::wrap()`

`Arr::wrap` 方法将给定值包装在一个数组中。如果给定的值已经是数组，它将不加修改地返回：

```php
use Illuminate\Support\Arr;

$string = 'Laravel';

$array = Arr::wrap($string);

// ['Laravel']
```

如果给定的值是 `null`，将返回一个空数组：

```php
use Illuminate\Support\Arr;

$array = Arr::wrap(null);

// []
```

#### `data_fill()`

`data_fill` 函数使用 "点" 符号在嵌套数组或对象中设置缺失的值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_fill($data, 'products.desk.price', 200);

// ['products' => ['desk' => ['price' => 100]]]

data_fill($data, 'products.desk.discount', 10);

// ['products' => ['desk' => ['price' => 100, 'discount' => 10]]]
```

此函数还接受星号作为通配符，并将相应地填充目标：

```php
$data = [
    'products' => [
        ['name' => 'Desk 1', 'price' => 100],
        ['name' => 'Desk 2'],
    ],
];

data_fill($data, 'products.*.price', 200);

/*
    [
        'products' => [
            ['name' => 'Desk 1', 'price' => 100],
            ['name' => 'Desk 2', 'price' => 200],
        ],
    ]
*/
```

#### `data_get()`

`data_get` 函数使用 "点" 符号从嵌套数组或对象中检索值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

$price = data_get($data, 'products.desk.price');

// 100
```

`data_get` 函数还接受默认值，如果找不到指定的键，则返回这个默认值：

```php
$discount = data_get($data, 'products.desk.discount', 0);

// 0
```

函数也接受使用星号的通配符，可以针对数组或对象的任何键：

```php
$data = [
    'product-one' => ['name' => 'Desk 1', 'price' => 100],
    'product-two' => ['name' => 'Desk 2', 'price' => 150],
];

data_get($data, '*.name');

// ['Desk 1', 'Desk 2'];
```

可以使用 `{first}` 和 `{last}` 占位符获取数组的第一个或最后一个项：

```php
$flight = [
    'segments' => [
        ['from' => 'LHR', 'departure' => '9:00', 'to' => 'IST', 'arrival' => '15:00'],
        ['from' => 'IST', 'departure' => '16:00', 'to' => 'PKX', 'arrival' => '20:00'],
    ],
];

data_get($flight, 'segments.{first}.arrival');

// 15:00
```

#### `data_set()`

`data_set` 函数使用 "点" 符号在嵌套数组或对象中设置值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_set($data, 'products.desk.price', 200);

// ['products' => ['desk' => ['price' => 200]]]
```

此函数也接受使用星号的通配符，并相应地在目标上设置值：

```php
$data = [
    'products' => [
        ['name' => 'Desk 1', 'price' => 100],
        ['name' => 'Desk 2', 'price' => 150],
    ],
];

data_set($data, 'products.*.price', 200);

/*
    [
        'products' => [
            ['name' => 'Desk 1', 'price' => 200],
            ['name' => 'Desk 2', 'price' => 200],
        ],
    ]
*/
```

默认情况下，任何现有值都将被覆盖。如果你希望仅在值不存在时设置它，可以将 `false` 作为函数的第四个参数传递：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_set($data, 'products.desk.price', 200, overwrite: false);

// ['products' => ['desk' => ['price' => 100]]]
```

#### `data_forget()`

`data_forget` 函数使用 "点" 符号从嵌套数组或对象中移除值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_forget($data, 'products.desk.price');

// ['products' => ['desk' => []]]
```

此函数也接受使用星号的通配符，并相应地在目标上移除值：

```php
$data = [
    'products' => [
        ['name' => 'Desk 1', 'price' => 100],
        ['name' => 'Desk 2', 'price' => 150],
    ],
];

data_forget($data, 'products.*.price');

/*
    [
        'products' => [
            ['name' => 'Desk 1'],
            ['name' => 'Desk 2'],
        ],
    ]
*/
```

#### `head()`

`head` 函数返回给定数组中的第一个元素：

```php
$array = [100, 200, 300];

$first = head($array);

// 100
```

#### `last()`

`last` 函数返回给定数组中的最后一个元素：

```php
$array = [100, 200, 300];

$last = last($array);

// 300
```

## 数字

#### `Number::abbreviate()`

`Number::abbreviate` 方法返回所提供数值的人类可读格式，并用缩写表示单位：

```php
use Illuminate\Support\Number;

$number = Number::abbreviate(1000);

// 1K

$number = Number::abbreviate(489939);

// 490K

$number = Number::abbreviate(1230000, precision: 2);

// 1.23M
```

#### `Number::clamp()`

`Number::clamp` 方法确保给定数字保持在指定范围内。如果数字低于最小值，则返回最小值。如果数字高于最大值，则返回最大值：

```php
use Illuminate\Support\Number;

$number = Number::clamp(105, min: 10, max: 100);

// 100

$number = Number::clamp(5, min: 10, max: 100);

// 10

$number = Number::clamp(10, min: 10, max: 100);

// 10

$number = Number::clamp(20, min: 10, max: 100);

// 20
```

#### `Number::currency()`

`Number::currency` 方法将给定值作为字符串返回货币表示：

```php
use Illuminate\Support\Number;

$currency = Number::currency(1000);

// $1,000

$currency = Number::currency(1000, in: 'EUR');

// €1,000

$currency = Number::currency(1000, in: 'EUR', locale: 'de');

// 1.000 €
```

#### `Number::fileSize()`

`Number::fileSize` 方法将给定字节值作为字符串返回文件大小表示：

```php
use Illuminate\Support\Number;

$size = Number::fileSize(1024);

// 1 KB

$size = Number::fileSize(1024 * 1024);

// 1 MB

$size = Number::fileSize(1024, precision: 2);

// 1.00 KB
```

#### `Number::forHumans()`

`Number::forHumans` 方法返回所提供数值的人类可读格式：

```php
use Illuminate\Support\Number;

$number = Number::forHumans(1000);

// 1 thousand

$number = Number::forHumans(489939);

// 490 thousand

$number = Number::forHumans(1230000, precision: 2);

// 1.23 million
```

#### `Number::format()`

`Number::format` 方法将给定数字格式化为特定区域的字符串：

```php
use Illuminate\Support\Number;

$number = Number::format(100000);

// 100,000

$number = Number::format(100000, precision: 2);

// 100,000.00

$number = Number::format(100000.123, maxPrecision: 2);

// 100,000.12

$number = Number::format(100000, locale: 'de');

// 100.000
```

#### `Number::ordinal()`

`Number::ordinal` 方法返回数字的序数表示：

```php
use Illuminate\Support\Number;

$number = Number::ordinal(1);

// 1st

$number = Number::ordinal(2);

// 2nd

$number = Number::ordinal(21);

// 21st
```

#### `Number::percentage()`

`Number::percentage` 方法将给定值作为字符串返回百分比表示：

```php
use Illuminate\Support\Number;

$percentage = Number::percentage(10);

// 10%

$percentage = Number::percentage(10, precision: 2);

// 10.00%

$percentage = Number::percentage(10.123, maxPrecision: 2);

// 10.12%

$percentage = Number::percentage(10, precision: 2, locale: 'de');

// 10,00%
```

#### `Number::spell()`

`Number::spell` 方法将给定数字转换为字词字符串：

```php
use Illuminate\Support\Number;

$number = Number::spell(102);

// one hundred and two

$number = Number::spell(88, locale: 'fr');

// quatre-vingt-huit
```

`after` 参数允许你指定在哪个值之后所有数字都应该拼写出来：

```php
$number = Number::spell(10, after: 10);

// 10

$number = Number::spell(11, after: 10);

// eleven
```

`until` 参数允许你指定在哪个值之前所有数字都应该拼写出来：

```php
$number = Number::spell(5, until: 10);

// five

$number = Number::spell(10, until: 10);

// 10
```

#### `Number::useLocale()`

`Number::useLocale` 方法全局设置默认数字区域设置，这影响了 `Number` 类方法后续调用时数字和货币的格式化方式：

```php
use Illuminate\Support\Number;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Number::useLocale('de');
}
```

#### `Number::withLocale()`

`Number::withLocale` 方法在指定区域设置中执行给定闭包，然后在回调执行后恢复原始区域设置：

```php
use Illuminate\Support\Number;

$number = Number::withLocale('de', function () {
    return Number::format(1500);
});
```

## 路径

#### `app_path()`

`app_path` 函数返回您应用程序的 `app` 目录的完整路径。你也可以使用 `app_path` 函数生成相对于应用程序目录的文件的完整路径：

```php
$path = app_path();

$path = app_path('Http/Controllers/Controller.php');
```

#### `base_path()`

`base_path` 函数返回应用程序的根目录的完整路径。你还可以使用 `base_path` 函数生成相对于项目根目录的给定文件的完整路径：

```php
$path = base_path();

$path = base_path('vendor/bin');
```

#### `config_path()`

`config_path` 函数返回您应用程序的 `config` 目录的完整路径。你也可以使用 `config_path` 函数生成应用程序配置目录中给定文件的完整路径：

```php
$path = config_path();

$path = config_path('app.php');
```

#### `database_path()`

`database_path` 函数返回您应用程序的 `database` 目录的完整路径。你还可以使用 `database_path` 函数生成数据库目录中给定文件的完整路径：

```php
$path = database_path();

$path = database_path('factories/UserFactory.php');
```

#### `lang_path()`

`lang_path` 函数返回您应用程序的 `lang` 目录的完整路径。你也可以使用 `lang_path` 函数生成目录中给定文件的完整路径：

```php
$path = lang_path();

$path = lang_path('en/messages.php');
```

> [!NOTE]
> 默认情况下，Laravel 应用程序骨架不包括 `lang` 目录。如果您希望自定义 Laravel 的语言文件，则可以通过 `lang:publish` Artisan 命令发布它们。

#### `mix()`

`mix` 函数返回到 [版本化的 Mix 文件](/docs/11/packages/mix) 的路径：

```php
$path = mix('css/app.css');
```

#### `public_path()`

`public_path` 函数返回应用程序的 `public` 目录的完全限定路径。你还可以使用 `public_path` 函数生成公共目录中给定文件的完全限定路径：

```php
$path = public_path();

$path = public_path('css/app.css');
```

#### `resource_path()`

`resource_path` 函数返回应用程序的 `resources` 目录的完全限定路径。你还可以使用 `resource_path` 函数生成资源目录中给定文件的完全限定路径：

```php
$path = resource_path();

$path = resource_path('sass/app.scss');
```

#### `storage_path()`

`storage_path` 函数返回应用程序的 `storage` 目录的完全限定路径。你还可以使用 `storage_path` 函数生成存储目录中给定文件的完全限定路径：

```php
$path = storage_path();

$path = storage_path('app/file.txt');
```

## URLs

#### `action()`

`action` 函数生成给定控制器动作的 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果方法接受路由参数，你可以将它们作为第二个参数传递给方法：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

#### `asset()`

`asset` 函数使用当前请求的方案 (HTTP 或 HTTPS) 生成资产的 URL：

```php
$url = asset('img/photo.jpg');
```

你可以通过在 `.env` 文件中设置 `ASSET_URL` 变量来配置资产 URL 主机。如果你在像 Amazon S3 或其他 CDN 这样的外部服务上托管你的资产，这会很有用：

```php
// ASSET_URL=http://example.com/assets

$url = asset('img/photo.jpg'); // http://example.com/assets/img/photo.jpg
```

#### `route()`

`route` 函数生成给定 [命名路由](/docs/11/basics/routing#named-routes) 的 URL：

```php
$url = route('route.name');
```

如果路由接受参数，你可以将它们作为函数的第二个参数传递：

```php
$url = route('route.name', ['id' => 1]);
```

默认情况下，`route` 函数生成一个绝对 URL。如果你希望生成一个相对 URL，你可以将 `false` 作为函数的第三个参数传递：

```php
$url = route('route.name', ['id' => 1], false);
```

#### `secure_asset()`

`secure_asset` 函数使用 HTTPS 生成资产的 URL：

```php
$url = secure_asset('img/photo.jpg');
```

#### `secure_url()`

`secure_url` 函数生成到给定路径的完全限定 HTTPS URL。额外的 URL 段可以作为函数的第二个参数传递：

```php
$url = secure_url('user/profile');

$url = secure_url('user/profile', [1]);
```

#### `to_route()`

`to_route` 函数生成给定 [命名路由](/docs/11/basics/routing#named-routes) 的 [重定向 HTTP 响应](/docs/11/basics/responses#redirects)：

```php
return to_route('users.show', ['user' => 1]);
```

如果需要，你可以将应该分配给重定向的 HTTP 状态码和任何其他响应头作为 `to_route` 方法的第三和第四个参数传递：

```php
return to_route('users.show', ['user' => 1], 302, ['X-Framework' => 'Laravel']);
```

#### `url()`

`url` 函数生成到给定路径的完全限定 URL：

```php
$url = url('user/profile');

$url = url('user/profile', [1]);
```

如果没有提供路径，将返回一个 `Illuminate\Routing\UrlGenerator` 实例：

```php
$current = url()->current();

$full = url()->full();

$previous = url()->previous();
```

## 杂项

#### `abort()`

`abort` 函数抛出 [HTTP 异常](/docs/11/basics/errors#http-exceptions)，该异常将由 [异常处理器](/docs/11/basics/errors#the-exception-handler) 渲染：

```php
abort(403);
```

你也可以提供异常的消息和应该发送到浏览器的自定义 HTTP 响应头：

```php
abort(403, 'Unauthorized.', $headers);
```

#### `abort_if()`

`abort_if` 函数如果给定的布尔表达式评估为 `true` 则抛出 HTTP 异常：

```php
abort_if(! Auth::user()->isAdmin(), 403);
```

就像 `abort` 方法一样，你也可以将异常的响应文本作为第三个参数提供，并将自定义响应头的数组作为第四个参数传递给函数。

#### `abort_unless()`

`abort_unless` 函数如果给定的布尔表达式评估为 `false` 则抛出 HTTP 异常：

```php
abort_unless(Auth::user()->isAdmin(), 403);
```

就像 `abort` 方法一样，你也可以将异常的响应文本作为第三个参数提供，并将自定义响应头的数组作为第四个参数传递给函数。

#### `app()`

`app` 函数返回 [服务容器](/docs/11/architecture-concepts/container) 实例：

```php
$container = app();
```

你可以传递一个类或接口名称来从容器中解析它：

```php
$api = app('HelpSpot\API');
```

#### `auth()`

`auth` 函数返回一个 [认证器](/docs/11/security/authentication) 实例。你可以使用它作为 `Auth` facade 的替代品：

```php
$user = auth()->user();
```

如果需要，你可以指定你想要访问的哪一个守卫实例：

```php
$user = auth('admin')->user();
```

#### `back()`

`back` 函数生成 [重定向 HTTP 响应](/docs/11/basics/responses#redirects) 到用户的上一个位置：

```php
return back($status = 302, $headers = [], $fallback = '/');

return back();
```

#### `bcrypt()`

`bcrypt` 函数使用 Bcrypt [哈希](/docs/11/security/hashing) 给定的值。你可以使用这个函数作为 `Hash` facade 的替代品：

```php
$password = bcrypt('my-secret-password');
```

#### `blank()`

`blank` 函数确定给定的值是否 "空白"：

```php
blank('');
blank('   ');
blank(null);
blank(collect());

// true

blank(0);
blank(true);
blank(false);

// false
```

要查看 `blank` 的反义词，请参看 [`filled`](#method-filled) 方法。

#### `broadcast()`

`broadcast` 函数 [广播](/docs/11/digging-deeper/broadcasting) 给定的 [事件](/docs/11/digging-deeper/events) 到其监听器：

```php
broadcast(new UserRegistered($user));

broadcast(new UserRegistered($user))->toOthers();
```

#### `cache()`

`cache` 函数可用来从 [缓存](/docs/11/digging-deeper/cache) 中获取值。如果给定键在缓存中不存在，则返回一个可选的默认值：

```php
$value = cache('key');

$value = cache('key', 'default');
```

你可以通过向函数传递一个键值对数组来向缓存中添加项。你还应该传递缓存值应该有效的秒数或持续时间：

```php
cache(['key' => 'value'], 300);

cache(['key' => 'value'], now()->addSeconds(10));
```

#### `class_uses_recursive()`

`class_uses_recursive` 函数返回一个类使用的所有特性，包括其所有父类使用的特性：

```php
$traits = class_uses_recursive(App\Models\User::class);
```

#### `collect()`

`collect` 函数从给定值创建一个 [集合](/docs/11/digging-deeper/collections) 实例：

```php
$collection = collect(['taylor', 'abigail']);
```

#### `config()`

`config` 函数获取 [配置](/docs/11/getting-started/configuration) 变量的值。配置值可以使用 "点" 语法访问，其中包括文件的名称和你希望访问的选项。可以指定一个默认值，如果配置选项不存在，则返回该默认值：

```php
$value = config('app.timezone');

$value = config('app.timezone', $default);
```

你可以通过传递一个键值对数组来在运行时设置配置变量。但是，请注意，这个函数只影响当前请求的配置值，并不会更新你实际的配置值：

```php
config(['app.debug' => true]);
```

#### `mix`

`mix` 函数返回一个 [版本化的 Mix 文件](/docs/11/packages/mix) 的路径：

```php
$path = mix('css/app.css');
```

#### `public_path`

`public_path` 函数返回你应用程序的 `public` 目录的完全限定路径。你也可以使用 `public_path` 函数来生成公共目录中给定文件的完全限定路径：

```php
$path = public_path();

$path = public_path('css/app.css');
```

#### `resource_path`

`resource_path` 函数返回你应用程序的 `resources` 目录的完全限定路径。你也可以使用 `resource_path` 函数来生成资源目录中给定文件的完全限定路径：

```php
$path = resource_path();

$path = resource_path('sass/app.scss');
```

#### `storage_path`

`storage_path` 函数返回你应用程序的 `storage` 目录的完全限定路径。你也可以使用 `storage_path` 函数来生成存储目录中给定文件的完全限定路径：

```php
$path = storage_path();

$path = storage_path('app/file.txt');
```

## URLs

#### `action`

`action` 函数生成给定控制器动作的 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果方法接受路由参数，你可以将它们作为第二个参数传递给方法：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

#### `asset`

`asset` 函数使用当前请求的方案（HTTP 或 HTTPS）为资产生成 URL：

```php
$url = asset('img/photo.jpg');
```

你可以通过在 `.env` 文件中设置 `ASSET_URL` 变量来配置资产 URL 主机。如果你将资产托管在亚马逊 S3 或其他 CDN 等外部服务上，这可能会很有用：

```php
// ASSET_URL=http://example.com/assets

$url = asset('img/photo.jpg'); // http://example.com/assets/img/photo.jpg
```

#### `route`

`route` 函数为给定的 [命名路由](/docs/11/basics/routing#named-routes) 生成 URL：

```php
$url = route('route.name');
```

如果路由接受参数，你可以将它们作为第二个参数传给函数：

```php
$url = route('route.name', ['id' => 1]);
```

默认情况下，`route` 函数生成一个绝对 URL。如果你希望生成一个相对 URL，你可以将 `false` 作为第三个参数传给函数：

```php
$url = route('route.name', ['id' => 1], false);
```

#### `secure_asset`

`secure_asset` 函数使用 HTTPS 为资产生成 URL：

```php
$url = secure_asset('img/photo.jpg');
```

#### `secure_url`

`secure_url` 函数生成给定路径的完全限定 HTTPS URL。额外的 URL 段可以作为函数的第二个参数传递：

```php
$url = secure_url('user/profile');

$url = secure_url('user/profile', [1]);
```

#### `to_route`

`to_route` 函数为给定的 [命名路由](/docs/11/basics/routing#named-routes) 生成一个 [重定向 HTTP 响应](/docs/11/basics/responses#redirects)：

```php
return to_route('users.show', ['user' => 1]);
```

如果需要，可以将要分配给重定向的 HTTP 状态码和任何额外的响应头作为 `to_route` 方法的第三个和第四个参数传递：

```php
return to_route('users.show', ['user' => 1], 302, ['X-Framework' => 'Laravel']);
```

#### `url`

`url` 函数生成给定路径的完全限定 URL:

```php
$url = url('user/profile');

$url = url('user/profile', [1]);
```

如果没有提供路径，将返回一个 `Illuminate\Routing\UrlGenerator` 实例：

```php
$current = url()->current();

$full = url()->full();

$previous = url()->previous();
```

## 杂项

#### `abort`

`abort` 函数抛出 [一个 HTTP 异常](/docs/11/basics/errors#http-exceptions)，该异常将被 [异常处理程序](/docs/11/basics/errors#the-exception-handler) 渲染：

```php
abort(403);
```

你也可以提供异常的消息和应该发送到浏览器的自定义 HTTP 响应头：

```php
abort(403, 'Unauthorized.', $headers);
```

#### `abort_if`

`abort_if` 函数在给定布尔表达式计算为 `true` 时抛出一个 HTTP 异常：

```php
abort_if(! Auth::user()->isAdmin(), 403);
```

像 `abort` 方法一样，你也可以将异常的响应文本作为第三个参数提供，并将一组自定义响应头作为第四个参数传递给函数。

#### `abort_unless`

`abort_unless` 函数在给定布尔表达式计算为 `false` 时抛出 HTTP 异常：

```php
abort_unless(Auth::user()->isAdmin(), 403);
```

像 `abort` 方法一样，你也可以将异常的响应文本作为第三个参数提供，并将一组自定义响应头作为第四个参数传递给函数。

#### `app`

`app` 函数返回 [服务容器](/docs/11/architecture-concepts/container) 实例：

```php
$container = app();
```

你可以传递一个类或接口名称来从容器解析它：

```php
$api = app('HelpSpot\API');
```

#### `auth`

`auth` 函数返回一个 [认证器](/docs/11/security/authentication) 实例。你可以将它作为 `Auth` facade 的替代品：

```php
$user = auth()->user();
```

如果需要，你可以指定你想要访问的哨兵实例：

```php
$user = auth('admin')->user();
```

#### `back`

`back` 函数生成一个 [重定向 HTTP 响应](/docs/11/basics/responses#redirects) 到用户的前一个位置：

```php
return back($status = 302, $headers = [], $fallback = '/');

return back();
```

#### `bcrypt`

`bcrypt` 函数使用 Bcrypt [散列](/docs/11/security/hashing)给定值。你可以使用这个函数作为 `Hash` facade 的替代品：

```php
$password = bcrypt('my-secret-password');
```

#### `blank`

`blank` 函数确定给定的值是否为 "blank"：

```php
blank('');
blank('   ');
blank(null);
blank(collect());

// true

blank(0);
blank(true);
blank(false);

// false
```

See the inverse of `blank`, see the `filled` 方法。

#### `broadcast`

`broadcast` 函数 [广播](/docs/11/digging-deeper/broadcasting) 给定的 [事件](/docs/11/digging-deeper/events)到它的监听器：

```php
broadcast(new UserRegistered($user));

broadcast(new UserRegistered($user))->toOthers();
```

#### `cache`

`cache` 函数可用于从 [缓存](/docs/11/digging-deeper/cache) 中获取值。如果给定键在缓存中不存在，则返回一个可选的默认值：

```php
$value = cache('key');

$value = cache('key', 'default');
```

你可以通过传递键值对数组给函数来将项添加到缓存中。你还应该传递缓存值应该认为有效的秒数或持续时间：

```php
cache(['key' => 'value'], 300);

cache(['key' => 'value'], now()->addSeconds(10));
```

#### `class_uses_recursive`

`class_uses_recursive` 函数返回一个类使用的所有 traits，包括其所有父类使用的 traits：

```php
$traits = class_uses_recursive(App\Models\User::class);
```

#### `collect`

`collect` 函数从给定值创建一个 [集合](/docs/11/digging-deeper/collections) 实例：

```php
$collection = collect(['taylor', 'abigail']);
```

#### `config`

`config` 函数获取 [配置](/docs/11/getting-started/configuration) 变量的值。可以使用 "点" 语法访问配置变量，包括文件名称和你希望访问的选项名称。可以指定一个默认值，并且回如果配置选项不存在则返回它：

```php
$value = config('app.timezone');

$value = config('app.timezone', $default);
```

你可以通过传递键值对数组在运行时设置配置变量。但需要注意的是，这个函数只影响当前请求的配置值，并不会更新你的实际配置值：

```php
config(['app.debug' => true]);
```

#### `context`

`context` 函数从 [当前上下文](/docs/11/digging-deeper/context) 中获取值。默认值可以指定，并且回如果上下文键不存在则返回它：

```php
$value = context('trace_id');

$value = config('trace_id', $default);
```

你可以通过传递键值对数组来设置上下文值：

```php
use Illuminate\Support\Str;

context(['trace_id' => Str::uuid()->toString()]);
```

#### `cookie`

`cookie` 函数创建一个新的 [cookie](/docs/11/basics/requests#cookies) 实例：

```php
$cookie = cookie('name', 'value', $minutes);
```

#### `csrf_field`

`csrf_field` 函数生成一个 HTML `hidden` 输入字段，包含 CSRF 令牌的值。例如，使用 [Blade 语法](/docs/11/basics/blade)：

```php
{{ csrf_field() }}
```

#### `csrf_token`

`csrf_token` 函数检索当前 CSRF 令牌的值：

```php
$token = csrf_token();
```

#### `decrypt`

`decrypt` 函数 [解密](/docs/11/security/encryption) 给定值。你可以使用这个函数作为 `Crypt` facade 的替代品：

```php
$password = decrypt($value);
```

#### `dd`

`dd` 函数转储给定变量并结束脚本的执行：

```php
dd($value);

dd($value1, $value2, $value3, ...);
```

如果你不想在转储变量后中止脚本的执行，请使用 [`dump`](#method-dump) 函数。

#### `dispatch`

`dispatch` 函数将给定的 [作业](/docs/11/digging-deeper/queues#creating-jobs) 推送到 Laravel [作业队列](/docs/11/digging-deeper/queues)：

```php
dispatch(new App\Jobs\SendEmails);
```

#### `dispatch_sync`

`dispatch_sync` 函数将给定的作业推送到 [同步](/docs/11/digging-deeper/queues#synchronous-dispatching) 队列，以便立即处理：

```php
dispatch_sync(new App\Jobs\SendEmails);
```

#### `dump`

`dump` 函数转储给定变量：

```php
dump($value);

dump($value1, $value2, $value3, ...);
```

如果你想在转储变量后停止执行脚本，请使用 [`dd`](#method-dd) 函数。

#### `encrypt`

`encrypt` 函数 [加密](/docs/11/security/encryption) 给定值。你可以使用这个函数作为 `Crypt` facade 的替代品：

```php
$secret = encrypt('my-secret-value');
```

#### `env`

`env` 函数检索一个 [环境变量](/docs/11/getting-started/configuration#environment-configuration) 的值或返回一个默认值：

```php
$env = env('APP_ENV');

$env = env('APP_ENV', 'production');
```

> [!WARNING]
> 如果你在部署过程中执行了 `config:cache` 命令，请确保你只在配置文件中调用 `env` 函数。一旦配置被缓存，`.env` 文件不会被加载，并且所有调用 `env` 函数的地方都会返回 `null`。

#### `event`

`event` 函数将给定的 [事件](/docs/11/digging-deeper/events) 分发到它的监听器：

```php
event(new UserRegistered($user));
```

#### `fake`

`fake` 函数从容器中解析一个 [Faker](https://github.com/FakerPHP/Faker) 单例，这在创建模型工厂、数据库种子数据、测试以及原型视图中的假数据时非常有用：

```blade
@for($i = 0; $i < 10; $i++)
    <dl>
        <dt>Name</dt>
        <dd>{{ fake()->name() }}</dd>

        <dt>Email</dt>
        <dd>{{ fake()->unique()->safeEmail() }}</dd>
    </dl>
@endfor
```

默认情况下，`fake` 函数将使用 `config/app.php` 配置中的 `app.faker_locale` 配置选项。通常，这个配置项是通过 `APP_FAKER_LOCALE` 环境变量设置的。你也可以通过将 locale 传递给 `fake` 函数来指定 locale。每个 locale 都会解析一个单独的单例

#### `fake()` {.collection-method}

`fake` 方法从容器中解析出 [Faker](https://github.com/FakerPHP/Faker) 单例对象，这在创建模型工厂、数据库 seeding、测试和原型视图中的假数据时非常有用：

```blade
@for($i = 0; $i < 10; $i++)
    <dl>
        <dt>Name</dt>
        <dd>{{ fake()->name() }}</dd>

        <dt>Email</dt>
        <dd>{{ fake()->unique()->safeEmail() }}</dd>
    </dl>
@endfor
```

默认情况下，`fake` 函数将使用 `config/app.php` 配置中的 `app.faker_locale` 配置项。通常，此配置项通过 `APP_FAKER_LOCALE` 环境变量来设置。你也可以通过将 Locale 传递给 `fake` 方法来指定 Locale。每个 Locale 将解析出一个单独的单例对象：

```php
fake('nl_NL')->name()
```

#### `filled()` {.collection-method}

`filled` 函数用于判断给定值是否为 “非空”：

```php
filled(0);
filled(true);
filled(false);

// true

filled('');
filled('   ');
filled(null);
filled(collect());

// false
```

`filled` 的反函数，请参见 [`blank`](#method-blank) 方法。

#### `info()` {.collection-method}

`info` 函数将信息写入应用程序的 [日志](/docs/11/basics/logging)：

```php
info('Some helpful information!');

info('User login attempt failed.', ['id' => $user->id]);
```

#### `literal()` {.collection-method}

`literal` 函数使用给定的命名参数作为属性创建一个新的 [stdClass](https://www.php.net/manual/en/class.stdclass.php) 实例：

```php
$obj = literal(
    name: 'Joe',
    languages: ['PHP', 'Ruby'],
);

$obj->name; // 'Joe'
$obj->languages; // ['PHP', 'Ruby']
```

#### `logger()` {.collection-method}

`logger` 函数可用于向 [日志](/docs/11/basics/logging) 写入 `debug` 级别的信息：

```php
logger('Debug message');

logger('User has logged in.', ['id' => $user->id]);
```

如果没有传递值给函数，将返回 [logger](/docs/11/basics/errors#logging) 实例：

```php
logger()->error('You are not allowed here.');
```

#### `method_field()` {.collection-method}

`method_field` 函数生成一个 HTML `hidden` 输入字段，其中包含表单 HTTP 动词的伪造值。例如，使用 [Blade 语法](/docs/11/basics/blade)：

```html
<form method="POST">{{ method_field('DELETE') }}</form>
```

#### `now()` {.collection-method}

`now` 函数为当前时间创建一个新的 `Illuminate\Support\Carbon` 实例：

```php
$now = now();
```

#### `old()` {.collection-method}

`old` 函数 [检索](/docs/11/basics/requests#retrieving-input) 被闪存到 session 中的 [旧输入值](/docs/11/basics/requests#old-input)：

```php
$value = old('value');

$value = old('value', 'default');
```

由于 `old` 函数的第二个参数提供的 "默认值" 通常是 Eloquent 模型的属性，Laravel 允许你简单地将整个 Eloquent 模型作为 `old` 函数的第二个参数传递。这样做时，Laravel 将假定提供给 `old` 函数的第一个参数是应该被视为 "默认值" 的 Eloquent 属性名称：

```php
{{ old('name', $user->name) }}

// 等价于...

{{ old('name', $user) }}
```

#### `once()` {.collection-method}

`once` 函数执行给定回调并在请求期间将结果缓存在内存中。任何后续使用相同回调的 `once` 函数的调用将返回先前缓存的结果：

```php
function random(): int
{
    return once(function () {
        return random_int(1, 1000);
    });
}

random(); // 123
random(); // 123 (cached result)
random(); // 123 (cached result)
```

当 `once` 函数在对象实例内部执行时，缓存结果将唯一于该对象实例：

```php
class NumberService
{
    public function all(): array
    {
        return once(fn () => [1, 2, 3]);
    }
}

$service = new NumberService;

$service->all();
$service->all(); // (cached result)

$secondService = new NumberService;

$secondService->all();
$secondService->all(); // (cached result)
```

#### `optional()` {.collection-method}

`optional` 函数接受任意参数并允许你访问该对象上的属性或调用方法。如果给定的对象是 `null`，属性和方法将返回 `null` 而非引起错误：

```php
return optional($user->address)->street;

{!! old('name', optional($user)->name) !!}
```

`optional` 函数还接受闭包作为其第二个参数。如果第一个参数提供的值不是 null，则将调用闭包：

```php
return optional(User::find($id), function (User $user) {
    return $user->name;
});
```

#### `policy()` {.collection-method}

`policy` 方法检索给定类的 [policy](/docs/11/security/authorization#creating-policies) 实例：

```php
$policy = policy(App\Models\User::class);
```

#### `redirect()` {.collection-method}

`redirect` 函数返回 [重定向 HTTP 响应](/docs/11/basics/responses#redirects)，如果没有参数调用它，则返回重定向器实例：

```php
return redirect($to = null, $status = 302, $headers = [], $https = null);

return redirect('/home');

return redirect()->route('route.name');
```

#### `report()` {.collection-method}

`report` 函数将使用你的 [异常处理程序](/docs/11/basics/errors#the-exception-handler) 报告异常：

```php
report($e);
```

`report` 函数也接受字符串作为参数。当给函数传递字符串时，该函数将创建一个以给定字符串为消息的异常：

```php
report('Something went wrong.');
```

#### `report_if()` {.collection-method}

如果给定条件为 `true`，`report_if` 函数将使用你的 [异常处理程序](/docs/11/basics/errors#the-exception-handler) 报告异常：

```php
report_if($shouldReport, $e);

report_if($shouldReport, 'Something went wrong.');
```

#### `report_unless()` {.collection-method}

如果给定条件为 `false`，`report_unless` 函数将使用你的 [异常处理程序](/docs/11/basics/errors#the-exception-handler) 报告异常：

```php
report_unless($reportingDisabled, $e);

report_unless($reportingDisabled, 'Something went wrong.');
```

#### `request()` {.collection-method}

`request` 函数返回当前 [请求](/docs/11/basics/requests) 实例或从当前请求获取输入字段的值：

```php
$request = request();

$value = request('key', $default);
```

#### `rescue()` {.collection-method}

`rescue` 函数执行给定闭包并捕获执行期间发生的任何异常。所有捕获的异常都将发送到 [异常处理程序](/docs/11/basics/errors#the-exception-handler)；但是，请求将继续处理：

```php
return rescue(function () {
    return $this->method();
});
```

你可以向 `rescue` 函数传递第二个参数。此参数将是如果在执行闭包时发生异常应返回的“默认”值：

```php
return rescue(function () {
    return $this->method();
}, false);

return rescue(function () {
    return $this->method();
}, function () {
    return $this->failure();
});
```

可以提供 `report` 参数给 `rescue` 函数来决定是否通过 `report` 函数报告异常：

```php
return rescue(function () {
    return $this->method();
}, report: function (Throwable $throwable) {
    return $throwable instanceof InvalidArgumentException;
});
```

#### `resolve()` {.collection-method}

`resolve` 函数使用 [服务容器](/docs/11/architecture-concepts/container) 将给定的类或接口名解析为实例：

```php
$api = resolve('HelpSpot\API');
```

#### `response()` {.collection-method}

`response` 函数创建一个 [响应](/docs/11/basics/responses) 实例或获取响应工厂的实例：

```php
return response('Hello World', 200, $headers);

return response()->json(['foo' => 'bar'], 200, $headers);
```

#### `retry()` {.collection-method}

`retry` 函数尝试执行给定的回调，直到达到给定的最大尝试阈值。如果回调没有抛出异常，将返回它的返回值。如果回调抛出异常，它将自动被重试。如果超过最大尝试次数，将抛出异常：

```php
return retry(5, function () {
    // 尝试 5 次，每次尝试之间休息 100ms...
}, 100);
```

如果你希望手动计算尝试之间睡眠的毫秒数，你可以将闭包作为第三个参数传递给 `retry` 函数：

```php
use Exception;

return retry(5, function () {
    // ...
}, function (int $attempt, Exception $exception) {
    return $attempt * 100;
});
```

为了方便起见，你可以将数组作为 `retry` 函数的第一个参数提供。该数组将用于确定后续尝试之间的毫秒数：

```php
return retry([100, 200], function () {
    // 第一次重试睡眠 100ms，第二次重试睡眠 200ms...
});
```

要仅在特定条件下重试，你可以将闭包作为 `retry` 函数的第四个参数：

```php
use Exception;

return retry(5, function () {
    // ...
}, 100, function (Exception $exception) {
    return $exception instanceof RetryException;
});
```

#### `session()` {.collection-method}

`session` 函数可用于获取或设置 [session](/docs/11/basics/session) 值：

```php
$value = session('key');
```

你可以通过向函数传递键/值对数组来设置值：

```php
session(['chairs' => 7, 'instruments' => 3]);
```

如果没有传递值给函数，将返回 session store：

```php
$value = session()->get('key');

session()->put('key', $value);
```

#### `tap()` {.collection-method}

`tap` 函数接受两个参数：任意的 `$value` 和闭包。`$value` 将被传递给闭包，然后由 `tap` 函数返回。闭包的返回值不重要：

```php
$user = tap(User::first(), function (User $user) {
    $user->name = 'taylor';

    $user->save();
});
```

如果没有将闭包传递给 `tap` 函数，你可以调用给定 `$value` 上的任何方法。你调用的方法的返回值始终是 `$value`，不管这个方法在定义中实际返回什么。例如，Eloquent 的 `update` 方法通常返回一个整数。然而，我们可以通过 `tap` 函数链接 `update` 方法调用，强制该方法返回模型本身：

```php
$user = tap($user)->update([
    'name' => $name,
    'email' => $email,
]);
```

为了给类添加 `tap` 方法，你可以为类添加 `Illuminate\Support\Traits\Tappable` trait。这个 trait 的 `tap` 方法接受闭包作为其唯一的参数。对象实例本身将被传递给闭包，然后通过 `tap` 方法返回：

```php
return $user->tap(function (User $user) {
    // ...
});
```

#### `throw_if()` {.collection-method}

`throw_if` 函数如果给定的布尔表达式评估为 `true`，则抛出给定的异常：

```php
throw_if(! Auth::user()->isAdmin(), AuthorizationException::class);

throw_if(
    ! Auth::user()->isAdmin(),
    AuthorizationException::class,
    'You are not allowed to access this page.'
);
```

#### `throw_unless()` {.collection-method}

`throw_unless` 函数如果给定的布尔表达式评估为 `false`，则抛出给定的异常：

```php
throw_unless(Auth::user()->isAdmin(), AuthorizationException::class);

throw_unless(
    Auth::user()->isAdmin(),
    AuthorizationException::class,
    'You are not allowed to access this page.'
);
```

#### `today()` {.collection-method}

`today` 函数为当前日期创建一个新的 `Illuminate\Support\Carbon` 实例：

```php
$today = today();
```

#### `trait_uses_recursive()` {.collection-method}

`trait_uses_recursive` 函数返回一个 trait 使用的所有 traits：

```php
$traits = trait_uses_recursive(\Illuminate\Notifications\Notifiable::class);
```

#### `transform()` {.collection-method}

`transform` 函数在给定值不是 [blank](#method-blank) 的情况下对其执行闭包，然后返回闭包的返回值：

```php
$callback = function (int $value) {
    return $value * 2;
};

$result = transform(5, $callback);

// 10
```

第三个参数可以传递默认值或闭包给函数。如果给定值是 blank，将返回该值：

```php
$result = transform(null, $callback, 'The value is blank');

// The value is blank
```

#### `validator()` {.collection-method}

`validator` 函数使用给定的参数创建一个新的 [validator](/docs/11/basics/validation) 实例。你可以将它作为 `Validator` facade 的替代：

```php
$validator = validator($data, $rules, $messages);
```

#### `value()` {.collection-method}

`value` 函数返回它所接收到的值。但是，如果你传递一个闭包给该函数，闭包将被执行，并且其返回的值将被返回：

```php
$result = value(true);

// true

$result = value(function () {
    return false;
});

// false
```

可以向 `value` 函数传递额外的参数。如果第一个参数是闭包，则额外的参数将作为参数传递给闭包，否则它们将被忽略：

```php
$result = value(function (string $name) {
    return $name;
}, 'Taylor');

// 'Taylor'
```

#### `view()` {.collection-method}

`view` 函数用于检索 [视图](/docs/11/basics/views) 实例：

```php
return view('auth.login');
```

#### `with()` {.collection-method}

`with` 函数返回它被赋予的值。如果闭包作为该函数的第二个参数传递，则会执行闭包并返回其返回值：

```php
$callback = function (mixed $value) {
    return is_numeric($value) ? $value * 2 : 0;
};

$result = with(5, $callback);

// 10

$result = with(null, $callback);

// 0

$result = with(5, null);

// 5
```

## 其他实用工具

### 基准测试

有时您可能希望快速测试应用程序的某些部分的性能。在这些场合，您可以使用 `Benchmark` 支持类来测量完成给定回调所需的毫秒数：

```php
use App\Models\User;
use Illuminate\Support\Benchmark;

Benchmark::dd(fn () => User::find(1)); // 0.1 毫秒

Benchmark::dd([
    'Scenario 1' => fn () => User::count(), // 0.5 毫秒
    'Scenario 2' => fn () => User::all()->count(), // 20.0 毫秒
]);
```

默认情况下，给定的回调将被执行一次（一次迭代），其持续时间将在浏览器/控制台中显示。

要多次调用回调，您可以指定回调应该被调用的迭代次数作为方法的第二个参数。当多次执行回调时，`Benchmark` 类将返回执行回调所需的平均毫秒数：

```php
Benchmark::dd(fn () => User::count(), iterations: 10); // 0.5 毫秒
```

有时，您可能想要在测试回调的执行时仍然获得回调返回的值。`value` 方法将返回一个包含回调返回值和执行回调所花费毫秒数的元组：

```php
[$count, $duration] = Benchmark::value(fn () => User::count());
```

### 日期

Laravel 包含 [Carbon](https://carbon.nesbot.com/docs/)，一个强大的日期和时间操作库。要创建一个新的 `Carbon` 实例，您可以调用 `now` 函数。此函数在 Laravel 应用程序中全局可用：

```php
$now = now();
```

或者，您可以使用 `Illuminate\Support\Carbon` 类来创建一个新的 `Carbon` 实例：

```php
use Illuminate\Support\Carbon;

$now = Carbon::now();
```

有关 Carbon 及其功能的详尽讨论，请查阅 [官方 Carbon 文档](https://carbon.nesbot.com/docs/)。

### 抽奖

Laravel 的 lottery 类可以根据一组给定的赔率执行回调。当您只想为您的传入请求的一部分执行代码时，这特别有用：

```php
use Illuminate\Support\Lottery;

Lottery::odds(1, 20)
    ->winner(fn () => $user->won())
    ->loser(fn () => $user->lost())
    ->choose();
```

您可以将 Laravel 的抽奖类与其他 Laravel 功能结合使用。例如，您可能希望只向您的异常处理程序报告慢查询的一小部分。由于抽奖类是可调用的，我们可以将该类的实例传递给任何接受可调用对象的方法：

```php
use Carbon\CarbonInterval;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Lottery;

DB::whenQueryingForLongerThan(
    CarbonInterval::seconds(2),
    Lottery::odds(1, 100)->winner(fn () => report('Querying > 2 seconds.')),
);
```

#### 测试抽奖

Laravel 提供了一些简单的方法，让您可以轻松测试应用程序的抽奖调用：

```php
// 彩票将总是赢...
Lottery::alwaysWin();

// 彩票将总是输...
Lottery::alwaysLose();

// 彩票将赢然后输，最后恢复正常行为...
Lottery::fix([true, false]);

// 彩票将恢复正常行为...
Lottery::determineResultsNormally();
```

### 管道线

Laravel 的 `Pipeline` facade 提供了一种便捷方式来 "管道化" 给定输入通过一系列可调用的类、闭包或可调用对象，给每个类机会检查或修改输入并调用管道中的下一个可调用对象：

```php
use Closure;
use App\Models\User;
use Illuminate\Support\Facades\Pipeline;

$user = Pipeline::send($user)
            ->through([
                function (User $user, Closure $next) {
                    // ...

                    return $next($user);
                },
                function (User $user, Closure $next) {
                    // ...

                    return $next($user);
                },
            ])
            ->then(fn (User $user) => $user);
```

如您所见，管道中的每个可调用类或闭包都被赋予输入和一个 `$next` 闭包。调用 `$next` 闭包将调用管道中的下一个可调用对象。您可能已经注意到，这与 [中间件](/docs/11/basics/middleware) 非常相似。

当管道中的最后一个可调用对象调用 `$next` 闭包时，`then` 方法提供的可调用对象将被调用。通常，这个可调用对象只是简单地返回给定输入。

当然，正如之前讨论的，你不仅限于为你的管道提供闭包。您还可以提供可调用的类。如果提供了一个类名，该类将通过 Laravel 的[服务容器](/docs/11/architecture-concepts/container)实例化，允许将依赖项注入到可调用类中：

```php
$user = Pipeline::send($user)
            ->through([
                GenerateProfilePhoto::class,
                ActivateSubscription::class,
                SendWelcomeEmail::class,
            ])
            ->then(fn (User $user) => $user);
```

### 睡眠

Laravel 的 `Sleep` 类是围绕 PHP 原生 `sleep` 和 `usleep` 函数的轻量级封装，提供更高的可测试性，同时也为处理时间提供了一个对开发者友好的 API：

```php
use Illuminate\Support\Sleep;

$waiting = true;

while ($waiting) {
    Sleep::for(1)->second();

    $waiting = /* ... */;
}
```

`Sleep` 类提供了各种方法，允许您使用不同的时间单位：

```php
// 暂停执行 90 秒...
Sleep::for(1.5)->minutes();

// 暂停执行 2 秒...
Sleep::for(2)->seconds();

// 暂停执行 500 毫秒...
Sleep::for(500)->milliseconds();

// 暂停执行 5,000 微秒...
Sleep::for(5000)->microseconds();

// 暂停执行直到给定的时间...
Sleep::until(now()->addMinute());

// PHP 原生 "sleep" 函数的别名...
Sleep::sleep(2);

// PHP 原生 "usleep" 函数的别名...
Sleep::usleep(5000);
```

为了方便组合时间单位，您可以使用 `and` 方法：

```php
Sleep::for(1)->second()->and(10)->milliseconds();
```

#### 测试睡眠

当在测试中利用 `Sleep` 类或 PHP 原生的 sleep 函数时，您的测试将暂停执行。可以想象，这会使您的测试套件显著变慢。例如，假设您正在测试以下代码：

```php
$waiting = /* ... */;

$seconds = 1;

while ($waiting) {
    Sleep::for($seconds++)->seconds();

    $waiting = /* ... */;
}
```

通常，测试这段代码至少会花费一秒钟。幸运的是，`Sleep` 类允许我们 "伪造" 睡眠，使我们的测试套件保持快速：

```php
it('waits until ready', function () {
    Sleep::fake();

    // ...
});
```

当伪造了 `Sleep` 类时，实际的执行暂停被绕过，导致测试显著加快。

一旦 `Sleep` 类被伪造，就可以对在应用程序代码中应该发生的预期 "睡眠" 进行断言。为了说明这一点，让我们假设我们正在测试的代码会三次暂停执行，每次暂停的时间都会增加一秒。使用 `assertSequence` 方法，我们可以断言在保持测试速度的同时，代码 "睡眠" 的适当时间：

```php
it('checks if ready three times', function () {
    Sleep::fake();

    // ...

    Sleep::assertSequence([
        Sleep::for(1)->second(),
        Sleep::for(2)->seconds(),
        Sleep::for(3)->seconds(),
    ]);
});
```

当然，`Sleep` 类提供了许多其他的断言，您可以在测试时使用：

```php
use Carbon\CarbonInterval as Duration;
use Illuminate\Support\Sleep;

// 断言调用 sleep 函数 3 次...
Sleep::assertSleptTimes(3);

// 针对睡眠持续时间的断言...
Sleep::assertSlept(function (Duration $duration): bool {
    return /* ... */;
}, times: 1);

// 断言 Sleep 类从未被调用...
Sleep::assertNeverSlept();

// 断言，即使 Sleep 被调用，也不会发生执行暂停...
Sleep::assertInsomniac();
```

有时在应用程序代码中伪造睡眠发生时执行某个操作可能会很有用。要做到这一点，您可以提供一个回调给 `whenFakingSleep` 方法。在下面的例子中，我们使用 Laravel 的[时间操作帮助函数](/docs/11/testing/mocking#interacting-with-time)来即时进入每次睡眠的时间：

```php
use Carbon\CarbonInterval as Duration;

$this->freezeTime();

Sleep::fake();

Sleep::whenFakingSleep(function (Duration $duration) {
    // 进行时间进展，当伪造睡眠时...
    $this->travel($duration->totalMilliseconds)->milliseconds();
});
```

因为进入时间是一个常见需求，`fake` 方法接受 `syncWithCarbon` 参数，在睡眠测试中保持 Carbon 同步：

```php
Sleep::fake(syncWithCarbon: true);

$start = now();

Sleep::for(1)->second();

$start->diffForHumans(); // 1 秒前
```

Laravel 在其内部使用 `Sleep` 类，每当要暂停执行时。例如，[`retry`](#method-retry) 帮助器使用 `Sleep` 类进行睡眠，从而提高在使用该帮助器时的可测试性。
