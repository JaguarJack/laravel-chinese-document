---
title: Laravel 数据库查询生成器
---

# 数据库：查询生成器

[[toc]]

## 引言

Laravel 的数据库查询构建器提供了一个方便、流畅的接口来创建和运行数据库查询。它可以用来执行你的应用程序中的大多数数据库操作，并完美地与 Laravel 支持的所有数据库系统一起工作。

Laravel 查询构建器使用 PDO 参数绑定来保护你的应用程序免受 SQL 注入攻击。你不需要清理或净化传递给查询构建器的字符串，因为查询绑定已经足够安全。

> [!WARNING]  
> PDO 不支持绑定列名。因此，你绝不应该允许用户输入控制你的查询引用的列名，包括 "order by" 列。

## 运行数据库查询

#### 从表中检索所有行

你可以使用 `DB` 门面提供的 `table` 方法来开始一个查询。`table` 方法为给定的表返回一个流畅的查询构建器实例，允许你将更多的约束添加到查询中，然后使用 `get` 方法最终检索查询的结果：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示应用程序中所有用户的列表。
     */
    public function index(): View
    {
        $users = DB::table('users')->get();

        return view('user.index', ['users' => $users]);
    }
}
```

`get` 方法返回一个 `Illuminate\Support\Collection` 实例，包含查询的结果，每个结果都是 PHP `stdClass` 对象的实例。你可以通过访问对象的属性来获取每个列的值：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->get();

foreach ($users as $user) {
    echo $user->name;
}
```

[!NOTE]

> Laravel 集合提供了用于映射和减少数据的极其强大的方法。要了解更多关于 Laravel 集合的信息，请查看[集合文档](/docs/11/digging-deeper/collections)。

#### 从表中检索单个行/列

如果你只需要从数据库表中检索单个行，你可以使用 `DB` 门面的 `first` 方法。此方法将返回单个 `stdClass` 对象：

```php
$user = DB::table('users')->where('name', 'John')->first();

return $user->email;
```

如果你不需要一整行，你可以使用 `value` 方法从记录中提取单个值。此方法将直接返回列的值：

```php
$email = DB::table('users')->where('name', 'John')->value('email');
```

要通过 `id` 列值检索单个行，使用 `find` 方法：

```php
$user = DB::table('users')->find(3);
```

#### 检索列值列表

如果你想检索包含单个列值的 `Illuminate\Support\Collection` 实例，你可以使用 `pluck` 方法。在这个例子中，我们将检索用户标题的集合：

```php
use Illuminate\Support\Facades\DB;

$titles = DB::table('users')->pluck('title');

foreach ($titles as $title) {
    echo $title;
}
```

你可以通过提供第二个参数给 `pluck` 方法来指定结果集合应使用的列作为其键：

```php
$titles = DB::table('users')->pluck('title', 'name');

foreach ($titles as $name => $title) {
    echo $title;
}
```

### 分块结果

如果需要处理成千上万的数据库记录，可以考虑使用 `DB` 门面提供的 `chunk` 方法。这个方法一次检索一小块结果，并将每个块输入到闭包中进行处理。例如，让我们一次检索 100 条 `users` 表的记录：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    foreach ($users as $user) {
        // ...
    }
});
```

你可以通过从闭包返回 `false` 来停止进一步的块处理：

```php
DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    // 处理记录...

    return false;
});
```

如果你在分块结果时更新数据库记录，你的分块结果可能会以意想不到的方式改变。如果你打算在分块时更新检索到的记录，最好总是使用 `chunkById` 方法。这个方法将根据记录的主键自动分页结果：

```php
DB::table('users')->where('active', false)
    ->chunkById(100, function (Collection $users) {
        foreach ($users as $user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update(['active' => true]);
        }
    });
```

> [!WARNING]  
> 在分块回调中更新或删除记录时，任何对主键或外键的更改都可能影响分块查询。这可能会导致某些记录不包括在分块结果中。

### 懒加载结果流

`lazy` 方法的工作方式类似于[分块方法](#chunking-results)，因为它按块执行查询。然而，`lazy()` 方法不是将每个块传递给一个回调，而是返回一个 [`LazyCollection`](/docs/11/digging-deeper/collections#lazy-collections)，这让你可以像处理单个流一样与结果进行交互：

```php
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->lazy()->each(function (object $user) {
    // ...
});
```

再一次，如果你打算在迭代检索的记录时更新它们，最好使用 `lazyById` 或 `lazyByIdDesc` 方法。这些方法将根据记录的主键自动分页结果：

```php
DB::table('users')->where('active', false)
    ->lazyById()->each(function (object $user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['active' => true]);
    });
```

> [!WARNING]  
> 在迭代时更新或删除记录时，任何对主键或外键的更改都可能影响分块查询。这可能会导致某些记录不包括在结果中。

### 聚合

查询构建器还提供了一系列方法来检索 `count`、`max`、`min`、`avg` 和 `sum` 等聚合值。你可以在构建查询后调用这些方法中的任何一个：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->count();

$price = DB::table('orders')->max('price');
```

当然，你可以将这些方法与其他子句组合使用，以微调你的聚合值是如何计算的：

```php
$price = DB::table('orders')
                ->where('finalized', 1)
                ->avg('price');
```

#### 确定记录是否存在

你不需要使用 `count` 方法来确定是否存在与查询约束条件匹配的任何记录，你可以使用 `exists` 和 `doesntExist` 方法：

```php
if (DB::table('orders')->where('finalized', 1)->exists()) {
    // ...
}

if (DB::table('orders')->where('finalized', 1)->doesntExist()) {
    // ...
}
```

## Select 语句

#### 指定 Select 子句

你可能不会总是想从数据库表中选择所有列。使用 `select` 方法，你可以为查询指定一个自定义的 "select" 子句：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
            ->select('name', 'email as user_email')
            ->get();
```

`distinct` 方法允许你强制查询返回不同的结果：

```php
$users = DB::table('users')->distinct()->get();
```

如果你已经有一个查询构建器实例，你希望向其现有的 select 子句添加一个列，你可以使用 `addSelect` 方法：

```php
$query = DB::table('users')->select('name');

$users = $query->addSelect('age')->get();
```

## Raw 表达式

有时你可能需要将任意字符串插入查询中。要创建一个原始字符串表达式，可以使用 `DB` 门面提供的 `raw` 方法：

```php
$users = DB::table('users')
             ->select(DB::raw('count(*) as user_count, status'))
             ->where('status', '<>', 1)
             ->groupBy('status')
             ->get();
```

> [!WARNING]  
> 原始语句将作为字符串插入查询中，所以你应该非常小心以避免创建 SQL 注入漏洞。

### Raw 方法

除了使用 `DB::raw` 方法，你还可以使用下面的方法将原始表达式插入查询的不同部分。**记住，Laravel 不能保证使用原始表达式的任何查询都受到 SQL 注入漏洞的保护。**

#### `selectRaw`

`selectRaw` 方法可以代替 `addSelect(DB::raw(/* ... */))` 使用。此方法接受一个可选的绑定数组作为其第二个参数：

```php
$orders = DB::table('orders')
                ->selectRaw('price * ? as price_with_tax', [1.0825])
                ->get();
```

#### `whereRaw / orWhereRaw`

`whereRaw` 和 `orWhereRaw` 方法可以用来注入原始的 "where" 子句到你的查询中。这些方法接受一个可选的绑定数组作为它们的第二个参数：

```php
$orders = DB::table('orders')
                ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
                ->get();
```

#### `havingRaw / orHavingRaw`

`havingRaw` 和 `orHavingRaw` 方法可用于提供原始字符串作为 "having" 子句的值。这些方法接受一个可选的绑定数组作为它们的第二个参数：

```php
$orders = DB::table('orders')
                ->select('department', DB::raw('SUM(price) as total_sales'))
                ->groupBy('department')
                ->havingRaw('SUM(price) > ?', [2500])
                ->get();
```

#### `orderByRaw`

`orderByRaw` 方法可以用来提供原始字符串作为 "order by" 子句的值：

```php
$orders = DB::table('orders')
                ->orderByRaw('updated_at - created_at DESC')
                ->get();
```

### `groupByRaw`

`groupByRaw` 方法可以用来提供原始字符串作为 `group by` 子句的值：

```php
$orders = DB::table('orders')
                ->select('city', 'state')
                ->groupByRaw('city, state')
                ->get();
```

## Joins

#### 内连接子句

查询构建器也可以用来向你的查询中添加 join 子句。要执行一个基本的 "inner join"，你可以在查询构建器实例上使用 `join` 方法。传递给 `join` 方法的第一个参数是你需要加入的表的名称，其余参数指定了 join 的列约束。你甚至可以在单个查询中加入多个表：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
            ->join('contacts', 'users.id', '=', 'contacts.user_id')
            ->join('orders', 'users.id', '=', 'orders.user_id')
            ->select('users.*', 'contacts.phone', 'orders.price')
            ->get();
```

#### 左连接/右连接子句

如果你想执行 "left join" 或 "right join" 而不是 "inner join"，请使用 `leftJoin` 或 `rightJoin` 方法。这些方法具有与 `join` 方法相同的签名：

```php
$users = DB::table('users')
            ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
            ->get();

$users = DB::table('users')
            ->rightJoin('posts', 'users.id', '=', 'posts.user_id')
            ->get();
```

#### 交叉连接子句

你可以使用 `crossJoin` 方法执行 "cross join"。交叉连接在第一个表和被连接表之间生成笛卡尔积：

```php
$sizes = DB::table('sizes')
            ->crossJoin('colors')
            ->get();
```

#### 高级 join 子句

你也可以指定更高级的 join 子句。要开始，请将闭包作为第二个参数传递给 `join` 方法。闭包将接收一个 `Illuminate\Database\Query\JoinClause` 实例，它允许你指定对 "join" 子句的约束：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')->orOn(/* ... */);
    })
    ->get();
```

如果你想在 join 上使用 "where" 子句，你可以使用 `JoinClause` 实例提供的 `where` 和 `orWhere` 方法。与比较两个列不同，这些方法将列与一个值进行比较：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')
             ->where('contacts.user_id', '>', 5);
    })
    ->get();
```

#### 子查询 joins

你可以使用 `joinSub`、`leftJoinSub` 和 `rightJoinSub` 方法将查询与子查询连接起来。这些方法各接受三个参数：子查询、它的表别名以及定义相关列的闭包。在这个例子中，我们将检索用户的集合，每个用户记录还包含用户最近发布的博客帖子的 `created_at` 时间戳：

```php
$latestPosts = DB::table('posts')
                     ->select('user_id', DB::raw('MAX(created_at) as last_post_created_at'))
                     ->where('is_published', true)
                     ->groupBy('user_id');

$users = DB::table('users')
        ->joinSub($latestPosts, 'latest_posts', function (JoinClause $join) {
            $join->on('users.id', '=', 'latest_posts.user_id');
        })->get();
```

#### Lateral Joins

> [!WARNING]  
> 横向连接目前只有 PostgreSQL、MySQL >= 8.0.14 和 SQL Server 支持。

你可以使用 `joinLateral` 和 `leftJoinLateral` 方法使用子查询执行 "lateral join"。这些方法各接受两个参数：子查询和它的表别名。连接条件应该在给定子查询的 `where` 子句中指定。横向连接对每一行进行评估，并可以引用子查询之外的列。

在这个例子中，我们将检索用户集合以及用户的三篇最近博客帖子。每个用户可以在结果集中产生最多三行数据：每篇最近的博客帖子一行。连接条件在子查询中用 `whereColumn` 子句指定，参照当前的用户行：

```php
$latestPosts = DB::table('posts')
                     ->select('id as post_id', 'title as post_title', 'created_at as post_created_at')
                     ->whereColumn('user_id', 'users.id')
                     ->orderBy('created_at', 'desc')
                     ->limit(3);

$users = DB::table('users')
            ->joinLateral($latestPosts, 'latest_posts')
            ->get();
```

## Unions

查询构建器还提供了一种方便的方法来 "union" 两个或更多的查询。例如，你可以创建一个初始查询，然后使用 `union` 方法将它与更多的查询合并：

```php
use Illuminate\Support\Facades\DB;

$first = DB::table('users')
            ->whereNull('first_name');

$users = DB::table('users')
            ->whereNull('last_name')
            ->union($first)
            ->get();
```

除了 `union` 方法，查询构建器还提供了一个 `unionAll` 方法。使用 `unionAll` 方法组合的查询不会移除它们的重复结果。`unionAll` 方法的方法签名与 `union` 方法相同。

## 基本 Where 子句

### Where 子句

你可以使用查询构建器的 `where` 方法向查询中添加 "where" 子句。`where` 方法最简单的调用需要三个参数。第一个参数是列的名称。第二个参数是操作符，可以是数据库支持的任何操作符。第三个参数是要与列的值进行比较的值。

例如，以下查询会检索 `votes` 列的值等于 `100` 并且 `age` 列的值大于 `35` 的用户：

```php
$users = DB::table('users')
                ->where('votes', '=', 100)
                ->where('age', '>', 35)
                ->get();
```

为了方便，如果你想验证某个列是 `=` 给定值，你可以将值作为第二个参数传递给 `where` 方法。Laravel 将会假设你想要使用 `=` 操作符：

```php
$users = DB::table('users')->where('votes', 100)->get();
```

如前所述，你可以使用数据库系统支持的任何操作符：

```php
$users = DB::table('users')
                ->where('votes', '>=', 100)
                ->get();

$users = DB::table('users')
                ->where('votes', '<>', 100)
                ->get();

$users = DB::table('users')
                ->where('name', 'like', 'T%')
                ->get();
```

你也可以将条件数组传递给 `where` 函数。数组的每个元素应该是通常传递给 `where` 方法的三个参数的数组：

```php
$users = DB::table('users')->where([
    ['status', '=', '1'],
    ['subscribed', '<>', '1'],
])->get();
```

> [!WARNING]  
> PDO 不支持绑定列名。因此，你绝不应该允许用户输入决定你的查询引用的列名，包括 "order by" 列。

### 或者 Where 子句

当串联调用查询构建器的 `where` 方法时，"where" 子句将使用 `and` 操作符连接在一起。然而，你可以使用 `orWhere` 方法通过 `or` 操作符将子句连接到查询中。`orWhere` 方法接受与 `where` 方法相同的参数：

```php
$users = DB::table('users')
                ->where('votes', '>', 100)
                ->orWhere('name', 'John')
                ->get();
```

如果你需要将 "or" 条件分组放在括号里，你可以将闭包作为第一个参数传递给 `orWhere` 方法：

```php
$users = DB::table('users')
            ->where('votes', '>', 100)
            ->orWhere(function (Builder $query) {
                $query->where('name', 'Abigail')
                      ->where('votes', '>', 50);
            })
            ->get();
```

上面的例子会产生以下 SQL：

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> [!WARNING]  
> 你应该始终对 `orWhere` 调用进行分组，以避免全局作用域应用时出现预期之外的行为。

### Where Not 子句

`whereNot` 和 `orWhereNot` 方法可以用来否定一组给定的查询约束。例如，下面的查询排除了正在清仓的产品或价格低于十块的产品：

```php
$products = DB::table('products')
                ->whereNot(function (Builder $query) {
                    $query->where('clearance', true)
                          ->orWhere('price', '<', 10);
                })
                ->get();
```

### Where Any / All 子句

有时你可能需要将相同的查询约束应用于多个列。例如，你可能想检索所有记录，其中任意一个给定列表中的列都像给定值。你可以使用 `whereAny` 方法来实现：

```php
$users = DB::table('users')
            ->where('active', true)
            ->whereAny([
                'name',
                'email',
                'phone',
            ], 'LIKE', 'Example%')
            ->get();
```

上面的查询将产生以下 SQL：

```sql
SELECT *
FROM users
WHERE active = true AND (
    name LIKE 'Example%' OR
    email LIKE 'Example%' OR
    phone LIKE 'Example%'
)
```

相似地，`whereAll` 方法可用于检索所有给定列都符合给定约束的记录：

```php
$posts = DB::table('posts')
            ->where('published', true)
            ->whereAll([
                'title',
                'content',
            ], 'LIKE', '%Laravel%')
            ->get();
```

上面的查询将产生以下 SQL：

```sql
SELECT *
FROM posts
WHERE published = true AND (
    title LIKE '%Laravel%' AND
    content LIKE '%Laravel%'
)
```

### JSON Where 子句

Laravel 还支持查询那些提供了支持 JSON 列类型数据库上的 JSON 列。目前，这包括 MySQL 8.0+、PostgreSQL 12.0+、SQL Server 2017+ 和 SQLite 3.39.0+（带有 [JSON1 extension](https://www.sqlite.org/json1.html)）。要查询一个 JSON 列，使用 `->` 运算符：

```php
$users = DB::table('users')
                ->where('preferences->dining->meal', 'salad')
                ->get();
```

你可以使用 `whereJsonContains` 来查询 JSON 数组：

```php
$users = DB::table('users')
                ->whereJsonContains('options->languages', 'en')
                ->get();
```

如果你的应用使用 MySQL 或 PostgreSQL 数据库，你可以向 `whereJsonContains` 方法传递一个值数组：

```php
$users = DB::table('users')
                ->whereJsonContains('options->languages', ['en', 'de'])
                ->get();
```

你可以使用 `whereJsonLength` 方法通过它们的长度来查询 JSON 数组：

```php
$users = DB::table('users')
                ->whereJsonLength('options->languages', 0)
                ->get();

$users = DB::table('users')
                ->whereJsonLength('options->languages', '>', 1)
                ->get();
```

### 额外的 Where 子句

**whereBetween / orWhereBetween**

`whereBetween` 方法验证一个列的值是否在两个值之间：

```php
$users = DB::table('users')
               ->whereBetween('votes', [1, 100])
               ->get();
```

**whereNotBetween / orWhereNotBetween**

`whereNotBetween` 方法验证一个列的值是否位于两个值之外：

```php
$users = DB::table('users')
                ->whereNotBetween('votes', [1, 100])
                ->get();
```

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

`whereBetweenColumns` 方法验证一个列的值是否在表同一行的两列之间：

```php
$patients = DB::table('patients')
               ->whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
               ->get();
```

`whereNotBetweenColumns` 方法验证一个列的值是否在表同一行的两列之外：

```php
$patients = DB::table('patients')
               ->whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
               ->get();
```

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

`whereIn` 方法验证给定列的值是否包含在给定数组中：

```php
$users = DB::table('users')
                ->whereIn('id', [1, 2, 3])
                ->get();
```

`whereNotIn` 方法验证给定列的值是否不包含在给定数组中：

```php
$users = DB::table('users')
                ->whereNotIn('id', [1, 2, 3])
                ->get();
```

你也可以提供一个查询对象作为 `whereIn` 方法的第二个参数：

```php
$activeUsers = DB::table('users')->select('id')->where('is_active', 1);

$users = DB::table('comments')
                ->whereIn('user_id', $activeUsers)
                ->get();
```

上面的例子将产生以下 SQL：

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> [!WARNING]  
> 如果您的查询中需要添加大量整数绑定，可以使用 whereIntegerInRaw 或 whereIntegerNotInRaw 方法来大幅度减少内存的使用。
> **whereNull / whereNotNull / orWhereNull / orWhereNotNull**

`whereNull` 方法用于验证指定列的值是否为 `NULL`：

```php
$users = DB::table('users')
                ->whereNull('updated_at')
                ->get();
```

`whereNotNull` 方法用于验证列的值是否不为 `NULL`：

```php
$users = DB::table('users')
                ->whereNotNull('updated_at')
                ->get();
```

**whereDate / whereMonth / whereDay / whereYear / whereTime**

`whereDate` 方法用于比较某个列的值和一个日期：

```php
$users = DB::table('users')
                ->whereDate('created_at', '2016-12-31')
                ->get();
```

`whereMonth` 方法用于比较一个列的值和特定的月份：

```php
$users = DB::table('users')
                ->whereMonth('created_at', '12')
                ->get();
```

`whereDay` 方法用于比较一个列的值和特定的月份中的某一天：

```php
$users = DB::table('users')
                ->whereDay('created_at', '31')
                ->get();
```

`whereYear` 方法用于比较一个列的值和特定的年份：

```php
$users = DB::table('users')
                ->whereYear('created_at', '2016')
                ->get();
```

`whereTime` 方法用于比较一个列的值和特定的时间：

```php
$users = DB::table('users')
                ->whereTime('created_at', '=', '11:20:45')
                ->get();
```

**whereColumn / orWhereColumn**

`whereColumn` 方法用于验证两个列是否相等：

```php
$users = DB::table('users')
                ->whereColumn('first_name', 'last_name')
                ->get();
```

你也可以传递一个比较运算符给 `whereColumn` 方法：

```php
$users = DB::table('users')
                ->whereColumn('updated_at', '>', 'created_at')
                ->get();
```

你也可以传递一个数组给 `whereColumn` 方法去进行列比较。这些条件将会使用 `and` 运算符联结：

```php
$users = DB::table('users')
                ->whereColumn([
                    ['first_name', '=', 'last_name'],
                    ['updated_at', '>', 'created_at'],
                ])->get();
```

### 逻辑分组

有时你可能需要将几个 "where" 子句用括号分组，以达到查询逻辑上的特定要求。实际上，你通常应该总是将 `orWhere` 方法的调用用括号分组，以避免意料之外的查询行为。为了实现这一点，你可以把一个闭包传递给 `where` 方法：

```php
$users = DB::table('users')
           ->where('name', '=', 'John')
           ->where(function ($query) {
               $query->where('votes', '>', 100)
                     ->orWhere('title', '=', 'Admin');
           })
           ->get();
```

如你所见，把一个闭包传入 `where` 方法会指示查询构造器开始一个约束组。闭包将接收一个查询构造器实例，你可以用它来设置应该包含在圆括号组内的约束。上面的例子将产生以下 SQL:

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> [!WARNING]  
> 你应该始终分组 `orWhere` 调用以避免全局作用域应用时出现意外行为。

### 高级 Where 子句

### Where 存在子句

`whereExists` 方法允许你编写 "where exists" SQL 子句。`whereExists` 方法接收一个闭包，闭包会接收一个查询构造器实例，允许你定义应该放在 "exists" 子句中的查询：

```php
$users = DB::table('users')
           ->whereExists(function ($query) {
               $query->select(DB::raw(1))
                     ->from('orders')
                     ->whereColumn('orders.user_id', 'users.id');
           })
           ->get();
```

或者，你可以提供一个查询对象给 `whereExists` 方法，而不是闭包：

```php
$orders = DB::table('orders')
                ->select(DB::raw(1))
                ->whereColumn('orders.user_id', 'users.id');

$users = DB::table('users')
                    ->whereExists($orders)
                    ->get();
```

以上两个例子都会产生以下 SQL:

```sql
select * from users
where exists (
    select 1
    from orders
    where orders.user_id = users.id
)
```

### 子查询 Where 子句

有时你需要构造一个比较子查询结果和给定值的 "where" 子句。你可以通过向 `where` 方法传递一个闭包和一个值来完成这一点。例如，以下查询将检索所有拥有特定类型的最新 "membership" 的用户：

```php
$users = User::where(function ($query) {
    $query->select('type')
        ->from('membership')
        ->whereColumn('membership.user_id', 'users.id')
        ->orderByDesc('membership.start_date')
        ->limit(1);
}, 'Pro')->get();
```

或者，你需要构造一个 "where" 子句，将一个列与子查询的结果进行比较。你可以通过传递一个列，运算符和闭包给 `where` 方法来实现。例如，以下查询将检索所有金额小于平均值的收入记录：

```php
$incomes = Income::where('amount', '<', function ($query) {
    $query->selectRaw('avg(i.amount)')->from('incomes as i');
})->get();
```

### 全文本 Where 子句

> [!WARNING]  
> 全文本 where 子句目前由 MySQL 和 PostgreSQL 支持。

`whereFullText` 和 `orWhereFullText` 方法可用于在查询中添加全文本 "where" 子句，针对已经建立了[全文索引](/docs/11/database/migrations#available-index-types)的列。这些方法将会由 Laravel 转换为底层数据库系统适用的相应 SQL。例如，对于使用 MySQL 的应用程序，会生成一个 `MATCH AGAINST` 子句：

```php
$users = DB::table('users')
           ->whereFullText('bio', 'web developer')
           ->get();
```

## 排序、分组、限制和偏移

### 排序

#### `orderBy` 方法

`orderBy` 方法允许你按照给定列对查询结果进行排序。`orderBy` 方法接受的第一个参数是你希望排序的列，第二个参数决定了排序的方向，可以是 `asc` 或是 `desc`：

```php
$users = DB::table('users')
                ->orderBy('name', 'desc')
                ->get();
```

要根据多个列进行排序，你可以根据需要多次调用 `orderBy` 方法：

```php
$users = DB::table('users')
                ->orderBy('name', 'desc')
                ->orderBy('email', 'asc')
                ->get();
```

#### `latest` 和 `oldest` 方法

`latest` 和 `oldest` 方法允许你轻松地根据日期对结果进行排序。默认情况下，结果将按照表的 `created_at` 列进行排序。或者，你可以传递你希望排序的列名：

```php
$user = DB::table('users')
                ->latest()
                ->first();
```

#### 随机排序

`inRandomOrder` 方法可以用来将查询结果随机排序。例如，你可以使用这个方法获取一个随机用户：

```php
$randomUser = DB::table('users')
                    ->inRandomOrder()
                    ->first();
```

#### 移除现有排序

`reorder` 方法会移除已应用到查询的所有 "order by" 子句：

```php
$query = DB::table('users')->orderBy('name');

$unorderedUsers = $query->reorder()->get();
```

在调用 `reorder` 方法时，你也可以传递一个列和方向，以移除所有现有的 "order by" 子句，并为查询应用一个全新的排序：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorder('email', 'desc')->get();
```

### 分组

#### `groupBy` 和 `having` 方法

如你所料，`groupBy` 和 `having` 方法可以用来对查询结果进行分组。`having` 方法的签名与 `where` 方法类似：

```php
$users = DB::table('users')
                    ->groupBy('account_id')
                    ->having('account_id', '>', 100)
                    ->get();
```

你可以使用 `havingBetween` 方法来过滤给定范围内的结果：

```php
$report = DB::table('orders')
                    ->selectRaw('count(id) as number_of_orders, customer_id')
                    ->groupBy('customer_id')
                    ->havingBetween('number_of_orders', [5, 15])
                    ->get();
```

你可以传递多个参数给 `groupBy` 方法，以便按多个列进行分组：

```php
$users = DB::table('users')
                    ->groupBy('first_name', 'status')
                    ->having('account_id', '>', 100)
                    ->get();
```

要构建更高级的 `having` 语句，请参见 [`havingRaw`](#raw-methods) 方法。

### 限制和偏移

#### `skip` 和 `take` 方法

你可以使用 `skip` 和 `take` 方法来限制从查询返回的结果数量，或者跳过查询中的给定数量的结果：

```php
$users = DB::table('users')->skip(10)->take(5)->get();
```

或者，你也可以使用 `limit` 和 `offset` 方法。这些方法在功能上分别等同于 `take` 和 `skip` 方法：

```php
$users = DB::table('users')
                    ->offset(10)
                    ->limit(5)
                    ->get();
```

## 条件子句

有时你可能希望根据另一个条件，让某些查询子句适用于一个查询。例如，如果给定输入值存在于传入的 HTTP 请求中，你可能只想应用一个 `where` 语句。你可以使用 `when` 方法来完成这个操作：

```php
$role = $request->string('role');

$users = DB::table('users')
                    ->when($role, function (Builder $query, string $role) {
                        $query->where('role_id', $role);
                    })
                    ->get();
```

`when` 方法仅在第一个参数为 `true` 时执行给定的闭包。如果第一个参数为 `false`，闭包将不会被执行。因此，在上面的例子中，如果 `role` 字段存在于传入请求中并评估为 `true`，则只会调用传递给 `when` 方法的闭包。

你还可以传递另一个闭包作为 `when` 方法的第三个参数。这个闭包只有在第一个参数评估为 `false` 时才会执行。为了说明如何使用这个特性，我们将使用它来配置查询的默认排序：

```php
$sortByVotes = $request->boolean('sort_by_votes');

$users = DB::table('users')
                    ->when($sortByVotes, function (Builder $query, bool $sortByVotes) {
                        $query->orderBy('votes');
                    }, function (Builder $query) {
                        $query->orderBy('name');
                    })
                    ->get();
```

## 插入语句

查询构造器还提供了一个 `insert` 方法，可以用来插入记录到数据库表中。`insert` 方法接受一个列名和值的数组：

```php
DB::table('users')->insert([
    'email' => 'kayla@example.com',
    'votes' => 0
]);
```

你可以一次插入多条记录，通过传递一个数组的数组。每个数组代表应该插入表中的一条记录：

```php
DB::table('users')->insert([
    ['email' => 'picard@example.com', 'votes' => 0],
    ['email' => 'janeway@example.com', 'votes' => 0],
]);
```

`insertOrIgnore` 方法将在插入数据库记录时忽略错误。使用这个方法时，你应该知道重复记录错误将被忽略，其他类型的错误也可能根据数据库引擎被忽略。例如，`insertOrIgnore` 将[忽略 MySQL 的严格模式](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution)：

```php
DB::table('users')->insertOrIgnore([
    ['id' => 1, 'email' => 'sisko@example.com'],
    ['id' => 2, 'email' => 'archer@example.com'],
]);
```

`insertUsing` 方法将使用子查询来确定应该插入的数据，插入新记录到表中：

```php
DB::table('pruned_users')->insertUsing([
    'id', 'name', 'email', 'email_verified_at'
], DB::table('users')->select(
    'id', 'name', 'email', 'email_verified_at'
)->where('updated_at', '<=', now()->subMonth()));
```

#### 自动递增 ID

如果表有自动递增的 id，使用 `insertGetId` 方法插入一条记录然后检索 ID：

```php
$id = DB::table('users')->insertGetId(
    ['email' => 'john@example.com', 'votes' => 0]
);
```

> [!WARNING]  
> 使用 PostgreSQL 时，`insertGetId` 方法期望自动递增列被命名为 `id`。如果你想从不同的 "序列" 中检索 ID，你可以将列名作为第二个参数传递给 `insertGetId` 方法。

### 上插

`upsert` 方法将插入不存在的记录，并用你可能指定的新值更新已经存在的记录。方法的第一个参数由要插入或更新的值组成，第二个参数列出了唯一标识表中记录的列。方法的第三个也是最后一个参数是一个列数组，如果在数据库中已存在匹配记录，则应当更新这些列：

```php
DB::table('flights')->upsert(
    [
        ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
        ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
    ],
    ['departure', 'destination'],
    ['price']
);
```

在上面的例子中，Laravel 将尝试插入两条记录。如果一个记录已经存在于 `departure` 和 `destination` 列值相同，Laravel 将更新该记录的 `price` 列。

> [!WARNING]  
> 除了 SQL Server 之外的所有数据库都要求 `upsert` 方法的第二个参数中的列有一个 "primary" 或 "unique" 索引。此外，MySQL 数据库驱动忽略 `upsert` 方法的第二个参数，并总是使用表的 "primary" 和 "unique" 索引来检测现有记录。

## 更新语句

除了插入记录到数据库外，查询构造器还可以使用 `update` 方法更新现有记录。与 `insert` 方法一样，`update` 方法接受一个列和值对的数组，指示要更新的列。`update` 方法返回受影响的行数。你可以使用 `where` 子句约束 `update` 查询：

```php
$affected = DB::table('users')
              ->where('id', 1)
              ->update(['votes' => 1]);
```

#### 更新或插入

有时你可能想要更新数据库中的现有记录，如果没有匹配的记录存在，则创建它。在这种情况下，可以使用 `updateOrInsert` 方法。`updateOrInsert` 方法接受两个参数：一个由条件数组组成用来寻找记录，还有一个指示要更新的列的列和值对的数组。

`updateOrInsert` 方法将尝试使用第一个参数的列和值对来定位匹配的数据库记录。如果记录存在，它将用第二个参数的值进行更新。如果没有找到记录，将插入一条新记录，其属性是两个参数的合并属性：

```php
DB::table('users')
    ->updateOrInsert(
        ['email' => 'john@example.com', 'name' => 'John'],
        ['votes' => '2']
    );
```

### 更新 JSON 列

更新 JSON 列时，你应该使用 `->` 语法更新 JSON 对象中适当的键。这个操作在 MySQL 5.7+ 和 PostgreSQL 9.5+ 上得到支持：

```php
$affected = DB::table('users')
              ->where('id', 1)
              ->update(['options->enabled' => true]);
```

### 增加和减少

查询构造器还提供了方便的方法，用于增加或减少给定列的值。这两种方法都至少接受一个参数：要修改的列。第二个参数可以提供，以指定列应该增加或减少的数量：

```php
DB::table('users')->increment('votes');

DB::table('users')->increment('votes', 5);

DB::table('users')->decrement('votes');

DB::table('users')->decrement('votes', 5);
```

如果需要，在增加或减少操作期间，你还可以指定额外的列进行更新：

```php
DB::table('users')->increment('votes', 1, ['name' => 'John']);
```

此外，你可以一次性增加或减少多个列的值，使用 `incrementEach` 和 `decrementEach` 方法：

```php
DB::table('users')->incrementEach([
    'votes' => 5,
    'balance' => 100,
]);
```

## 删除语句

查询构造器的 `delete` 方法可以用来从表中删除记录。`delete` 方法返回受影响的行数。你可以在调用 `delete` 方法前通过添加 "where" 子句来约束 `delete` 语句：

```php
$deleted = DB::table('users')->delete();

$deleted = DB::table('users')->where('votes', '>', 100)->delete();
```

如果你希望清空整个表，将表中的所有记录删除并将自增 ID 重置为零，可以使用 `truncate` 方法：

```php
DB::table('users')->truncate();
```

#### 表清空和 PostgreSQL

当清空一个 PostgreSQL 数据库时，将应用 `CASCADE` 行为。这意味着其他表中所有与外键相关联的记录也将被删除。

## 悲观锁

查询构造器还包含了一些函数，以帮助你在执行 `select` 语句时实现 "悲观锁定"。要执行带有 "共享锁" 的语句，可以调用 `sharedLock` 方法。共享锁会阻止所选行在你的事务提交之前被修改：

```php
DB::table('users')
        ->where('votes', '>', 100)
        ->sharedLock()
        ->get();
```

或者，你也可以使用 `lockForUpdate` 方法。"for update" 锁会阻止所选择的记录被修改或者被其他共享锁选择：

```php
DB::table('users')
        ->where('votes', '>', 100)
        ->lockForUpdate()
        ->get();
```

## 调试

在构建查询时，你可以使用 `dd` 和 `dump` 方法来转储当前查询绑定和 SQL。`dd` 方法将显示调试信息，然后停止执行请求。`dump` 方法将显示调试信息，但允许请求继续执行：

```php
DB::table('users')->where('votes', '>', 100)->dd();

DB::table('users')->where('votes', '>', 100)->dump();
```

可以在查询上调用 `dumpRawSql` 和 `ddRawSql` 方法，以转储查询的 SQL，并且所有参数绑定均正确替换：

```php
DB::table('users')->where('votes', '>', 100)->dumpRawSql();

DB::table('users')->where('votes', '>', 100)->ddRawSql();
```
