---
title: Laravel 分页
---

# 数据库 分页

[[toc]]

## 简介

在其他框架中，分页可能非常痛苦。我们希望 Laravel 对分页的方法将会是一股清新之风。Laravel 的分页器与[查询构造器](/docs/11/database/queries)和[Eloquent ORM](/docs/11/eloquent/eloquent)集成，并提供了方便易用的数据库记录分页方法，无需任何配置。

默认情况下，分页器生成的 HTML 与[Tailwind CSS 框架](https://tailwindcss.com/)兼容；但同时，也提供了对 Bootstrap 分页的支持。

#### Tailwind JIT

如果你正在使用 Laravel 默认的 Tailwind 分页视图和 Tailwind JIT 引擎，则应该确保你的应用程序的 `tailwind.config.js` 文件的 `content` 键包含 Laravel 的分页视图，这样它们的 Tailwind 类不会被清除：

```js
content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.vue',
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
],
```

## 基本用法

### 分页查询构造器结果

有多种方式可以分页项目。最简单的方法是使用[查询构造器](/docs/11/database/queries)或[Eloquent 查询](/docs/11/eloquent/eloquent)的 `paginate` 方法。`paginate` 方法自动处理基于用户当前查看的页面设置查询的 "limit" 和 "offset"。默认情况下，当前页面是通过 HTTP 请求的 `page` 查询字符串参数的值来检测的。这个值由 Laravel 自动检测，并且自动插入到分页器生成的链接中。

在这个例子中，传递给 `paginate` 方法的唯一参数是你每页想要显示的项目数量。在这种情况下，让我们指定我们想要每页显示 `15` 个项目：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示所有应用用户。
     */
    public function index(): View
    {
        return view('user.index', [
            'users' => DB::table('users')->paginate(15)
        ]);
    }
}
```

#### 简单分页

`paginate` 方法在检索数据库记录之前会统计查询匹配的总记录数。这样做是为了让分页器知道总共有多少页记录。然而，如果你不打算在应用程序的 UI 中显示总页数，则计算记录数的查询是不必要的。

因此，如果你只需要在应用程序的 UI 中显示简单的 "Next" 和 "Previous" 链接，则可以使用 `simplePaginate` 方法来执行单个高效的查询：

```php
$users = DB::table('users')->simplePaginate(15);
```

### 分页 Eloquent 结果

你也可以对[Eloquent](/docs/11/eloquent/eloquent)查询进行分页。在这个例子中，我们将对 `App\Models\User` 模型进行分页，并指示我们计划每页显示 15 条记录。如你所见，语法几乎与分页查询构造器结果相同：

```php
use App\Models\User;

$users = User::paginate(15);
```

当然，你可以在 `paginate` 方法之后添加其他查询约束，例如 `where` 子句：

```php
$users = User::where('votes', '>', 100)->paginate(15);
```

当分页 Eloquent 模型时，你也可以使用 `simplePaginate` 方法：

```php
$users = User::where('votes', '>', 100)->simplePaginate(15);
```

类似地，你可以使用 `cursorPaginate` 方法对 Eloquent 模型进行光标分页：

```php
$users = User::where('votes', '>', 100)->cursorPaginate(15);
```

#### 每页多个分页器实例

有时你可能需要在应用程序渲染的单个屏幕上渲染两个不同的分页器。然而，如果两个分页器实例都使用 `page` 查询字符串参数来存储当前页面，则两个分页器的会冲突。为了解决这个冲突，你可以将你希望使用的查询字符串参数的名称传递给 `paginate`、`simplePaginate` 和 `cursorPaginate` 方法的第三个参数，以便存储分页器的当前页面：

```php
use App\Models\User;

$users = User::where('votes', '>', 100)->paginate(
    $perPage = 15, $columns = ['*'], $pageName = 'users'
);
```

### 光标分页

虽然 `paginate` 和 `simplePaginate` 使用 SQL "offset" 子句创建查询，光标分页通过构造比较查询中包含的有序列的 "where" 子句，提供了所有 Laravel 分页方法中可用的最高效的数据库性能。这种分页方法特别适合大型数据集和 "无限" 滚动用户界面。

与基于页号的分页不同，光标分页在分页器生成的 URL 的查询字符串中放置一个 "cursor" 字符串。光标是一个编码的字符串，包含下一个分页查询应该开始分页的位置以及它应该分页的方向：

```shell
http://localhost/users?cursor=eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0
```

你可以通过查询构造器提供的 `cursorPaginate` 方法创建一个基于光标的分页器实例。此方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例：

```php
$users = DB::table('users')->orderBy('id')->cursorPaginate(15);
```

获取到光标分页器实例后，你可以像使用 `paginate` 和 `simplePaginate` 方法时一样[显示分页结果](#displaying-pagination-results)。有关光标分页器实例提供的方法的更多信息，请查阅[光标分页器实例方法文档](#cursor-paginator-instance-methods)。

> [!WARNING]  
> 你的查询必须包含 "order by" 子句，才能利用光标分页。此外，查询排序的列必须属于你正在分页的表。

#### 光标与偏移分页的对比

为了阐明偏移分页与光标分页之间的差异，让我们看一些示例 SQL 查询。以下两个查询都将显示按 `id` 排序的 `users` 表的 "第二页" 结果：

```sql
# 偏移分页...
select * from users order by id asc limit 15 offset 15;

# 光标分页...
select * from users where id > 15 order by id asc limit 15;
```

与偏移分页相比，光标分页查询具有以下优势：

- 对于大数据集，如果 "order by" 列被索引，光标分页将提供更好的性能。这是因为 "offset" 子句会扫描之前所有匹配的数据。
- 对于频繁写入的数据集，如果用户当前查看的页面最近添加或删除了结果，偏移分页可能会跳过记录或显示重复记录。

然而，光标分页也有以下限制：

- 如同 `simplePaginate`，光标分页只能用来显示 "Next" 和 "Previous" 链接，不支持生成带有页码的链接。
- 它要求排序基于至少一个唯一列或唯一的列组合。不支持带有 `null` 值的列。
- "order by" 子句中的查询表达式仅在它们被别名化并添加到 "select" 子句中时受支持。
- 带有参数的查询表达式不受支持。

### 手动创建分页器

有时你可能希望手动创建分页器实例，传递一个你已经在内存中的项目数组。你可以通过创建 `Illuminate\Pagination\Paginator`、`Illuminate\Pagination\LengthAwarePaginator` 或 `Illuminate\Pagination\CursorPaginator` 实例来完成这个操作，这取决于你的需求。

`Paginator` 和 `CursorPaginator` 类不需要知道结果集中的项目总数；然而，因为这样，这些类没有检索最后一页索引的方法。`LengthAwarePaginator` 接受几乎相同的参数作为 `Paginator`；然而，它需要结果集中所有项目的计数。

换句话说，`Paginator` 对应于查询构造器上的 `simplePaginate` 方法，`CursorPaginator` 对应于 `cursorPaginate` 方法，`LengthAwarePaginator` 对应于 `paginate` 方法。

> [!WARNING]  
> 当手动创建分页器实例时，你应该手动 "切片" 传递给分页器的结果数组。如果你不确定如何做到这一点，请查阅 [array_slice](https://secure.php.net/manual/en/function.array-slice.php) PHP 函数。

### 自定义分页 URL

默认情况下，分页器生成的链接将匹配当前请求的 URI。然而，分页器的 `withPath` 方法允许你自定义分页器在生成链接时使用的 URI。例如，如果你想要分页器生成像 `http://example.com/admin/users?page=N` 这样的链接，你应该将 `/admin/users` 传递给 `withPath` 方法：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->withPath('/admin/users');

    // ...
});
```

#### 追加查询字符串值

你可以使用 `appends` 方法来追加分页链接的查询字符串。例如，要追加 `sort=votes` 到每个分页链接，你应该如下调用 `appends`：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->appends(['sort' => 'votes']);

    // ...
});
```

如果你想要将当前请求的所有查询字符串值追加到分页链接中，可以使用 `withQueryString` 方法：

```php
$users = User::paginate(15)->withQueryString();
```

#### 添加哈希片段

如果你需要在分页器生成的 URL 中添加一个“哈希片段”，你可以使用 `fragment` 方法。例如，要在每个分页链接的末尾添加 `#users`，你应该这样调用 `fragment` 方法：

```php
$users = User::paginate(15)->fragment('users');
```

## 显示分页结果

当调用 `paginate` 方法时，你将收到一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，而调用 `simplePaginate` 方法会返回一个 `Illuminate\Pagination\Paginator` 实例。最后，调用 `cursorPaginate` 方法会返回一个 `Illuminate\Pagination\CursorPaginator` 实例。

这些对象提供了几种描述结果集的方法。除了这些辅助方法外，分页器实例也是迭代器，可以像数组一样进行循环。所以，一旦你检索到了结果，你就可以显示结果并使用 [Blade](/docs/11/basics/blade) 渲染分页链接：

```blade
<div class="container">
    @foreach ($users as $user)
        {{ $user->name }}
    @endforeach
</div>

{{ $users->links() }}
```

`links` 方法将渲染到结果集其余页面的链接。这些链接都已经包含了正确的 `page` 查询字符串变量。记住，`links` 方法生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com) 兼容。

### 调整分页链接窗口

当分页器显示分页链接时，会显示当前页码以及当前页前后各三页的链接。使用 `onEachSide` 方法，你可以控制在分页器生成的中间滑动窗口链接中当前页每边的额外链接显示数量：

```blade
{{ $users->onEachSide(5)->links() }}
```

### 转换结果为 JSON

Laravel 分页器类实现了 `Illuminate\Contracts\Support\Jsonable` 接口合约，并暴露了 `toJson` 方法，所以将你的分页结果转换为 JSON 非常简单。你也可以通过从路由或控制器动作返回分页器实例来将其转换为 JSON：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::paginate();
});
```

分页器的 JSON 将包含 `total`、`current_page`、`last_page` 等元信息。结果记录可通过 JSON 数组中的 `data` 键获得。以下是从路由返回分页器实例创建的 JSON 示例：

```json
{
  "total": 50,
  "per_page": 15,
  "current_page": 1,
  "last_page": 4,
  "first_page_url": "http://laravel.app?page=1",
  "last_page_url": "http://laravel.app?page=4",
  "next_page_url": "http://laravel.app?page=2",
  "prev_page_url": null,
  "path": "http://laravel.app",
  "from": 1,
  "to": 15,
  "data": [
    {
      // 记录...
    },
    {
      // 记录...
    }
  ]
}
```

## 自定义分页视图

默认情况下，呈现分页链接的视图与 [Tailwind CSS](https://tailwindcss.com) 框架兼容。不过，如果你没有使用 Tailwind，你可以自由定义自己的视图来渲染这些链接。在分页器实例上调用 `links` 方法时，你可以将视图名称作为该方法的第一个参数传递：

```blade
{{ $paginator->links('view.name') }}

<!-- 向视图传递额外数据... -->
{{ $paginator->links('view.name', ['foo' => 'bar']) }}
```

不过，自定义分页视图最简单的方法是使用 `vendor:publish` 命令将它们导出到你的 `resources/views/vendor` 目录：

```shell
php artisan vendor:publish --tag=laravel-pagination
```

上述命令会将视图放在你应用的 `resources/views/vendor/pagination` 目录中。该目录中的 `tailwind.blade.php` 文件对应默认的分页视图。你可以编辑这个文件来修改分页 HTML。

如果你想指定一个不同的文件作为默认分页视图，你可以在你的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `defaultView` 和 `defaultSimpleView` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Paginator::defaultView('view-name');

        Paginator::defaultSimpleView('view-name');
    }
}
```

### 使用 Bootstrap

Laravel 包括使用 [Bootstrap CSS](https://getbootstrap.com/) 构建的分页视图。要使用这些视图而不是默认的 Tailwind 视图，你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `useBootstrapFour` 或 `useBootstrapFive` 方法：

```php
use Illuminate\Pagination\Paginator;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Paginator::useBootstrapFive();
    Paginator::useBootstrapFour();
}
```

## Paginator / LengthAwarePaginator 实例方法

每个分页器实例通过以下方法提供额外的分页信息：

| 方法                                    | 描述                                                                 |
| --------------------------------------- | -------------------------------------------------------------------- |
| `$paginator->count()`                   | 获取当前页的项目数量。                                               |
| `$paginator->currentPage()`             | 获取当前页码。                                                       |
| `$paginator->firstItem()`               | 获取结果中第一个项目的编号。                                         |
| `$paginator->getOptions()`              | 获取分页器选项。                                                     |
| `$paginator->getUrlRange($start, $end)` | 创建分页 URL 范围。                                                  |
| `$paginator->hasPages()`                | 确定是否有足够的项目分为多个页面。                                   |
| `$paginator->hasMorePages()`            | 确定数据存储中是否有更多项目。                                       |
| `$paginator->items()`                   | 获取当前页面的项目。                                                 |
| `$paginator->lastItem()`                | 获取结果中最后一个项目的编号。                                       |
| `$paginator->lastPage()`                | 获取最后可用页面的页码。（在使用 `simplePaginate` 时不可用）。       |
| `$paginator->nextPageUrl()`             | 获取下一页的 URL。                                                   |
| `$paginator->onFirstPage()`             | 确定分页器是否在第一页。                                             |
| `$paginator->perPage()`                 | 每页展示的项目数。                                                   |
| `$paginator->previousPageUrl()`         | 获取上一页的 URL。                                                   |
| `$paginator->total()`                   | 确定数据存储中匹配项目的总数。（在使用 `simplePaginate` 时不可用）。 |
| `$paginator->url($page)`                | 获取给定页码的 URL。                                                 |
| `$paginator->getPageName()`             | 获取用于存储页码的查询字符串变量。                                   |
| `$paginator->setPageName($name)`        | 设置用于存储页码的查询字符串变量。                                   |
| `$paginator->through($callback)`        | 使用回调转换每个项目。                                               |

## Cursor Paginator 实例方法

每个游标分页器实例通过以下方法提供额外的分页信息：

| 方法                            | 描述                               |
| ------------------------------- | ---------------------------------- |
| `$paginator->count()`           | 获取当前页的项目数量。             |
| `$paginator->cursor()`          | 获取当前的游标实例。               |
| `$paginator->getOptions()`      | 获取分页器选项。                   |
| `$paginator->hasPages()`        | 确定是否有足够的项目分为多个页面。 |
| `$paginator->hasMorePages()`    | 确定数据存储中是否有更多项目。     |
| `$paginator->getCursorName()`   | 获取用于存储游标的查询字符串变量。 |
| `$paginator->items()`           | 获取当前页面的项目。               |
| `$paginator->nextCursor()`      | 获取下一组项目的游标实例。         |
| `$paginator->nextPageUrl()`     | 获取下一页的 URL。                 |
| `$paginator->onFirstPage()`     | 确定分页器是否在第一页。           |
| `$paginator->onLastPage()`      | 确定分页器是否在最后一页。         |
| `$paginator->perPage()`         | 每页展示的项目数。                 |
| `$paginator->previousCursor()`  | 获取上一组项目的游标实例。         |
| `$paginator->previousPageUrl()` | 获取上一页的 URL。                 |
| `$paginator->setCursorName()`   | 设置用于存储游标的查询字符串变量。 |
| `$paginator->url($cursor)`      | 获取给定游标实例的 URL。           |
