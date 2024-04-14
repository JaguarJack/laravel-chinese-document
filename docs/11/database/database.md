---
title: Laravel 数据库
---

# 数据库

[[toc]]

## 介绍

几乎每个现代网络应用程序都与数据库进行交互。Laravel 使用原始 SQL、[流畅的查询构造器](/docs/11/database/queries)和 [Eloquent ORM](/docs/11/eloquent/eloquent) 来简化对各种支持数据库的交互。目前，Laravel 为以下五种数据库提供一流的支持：

- MariaDB 10.3+（[版本政策](https://mariadb.org/about/#maintenance-policy)）
- MySQL 5.7+（[版本政策](https://en.wikipedia.org/wiki/MySQL#Release_history)）
- PostgreSQL 10.0+（[版本政策](https://www.postgresql.org/support/versioning/)）
- SQLite 3.35.0+
- SQL Server 2017+（[版本政策](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server)）

### 配置

Laravel 的数据库服务配置位于应用程序的 `config/database.php` 配置文件中。在这个文件中，你可以定义所有的数据库连接，并指明默认应该使用哪个连接。文件中的大多数配置选项都由应用程序的环境变量决定。这个文件为 Laravel 支持的大多数数据库系统提供了示例。

默认情况下，Laravel 的样板 [环境配置](/docs/11/getting-started/configuration#environment-configuration) 已经可以使用 [Laravel Sail](/docs/11/packages/sail)，它是一个 Docker 配置，用于在本地机器上开发 Laravel 应用程序。但是，你可以根据本地数据库的需要自由修改数据库配置。

#### SQLite 配置

SQLite 数据库包含在你文件系统上的一个文件中。你可以在终端使用 `touch` 命令创建一个新的 SQLite 数据库：`touch database/database.sqlite`。创建数据库后，你可以通过将数据库的绝对路径放入 `DB_DATABASE` 环境变量中，轻松配置你的环境变量指向这个数据库：

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

默认情况下，SQLite 连接已启用外键约束。如果你想禁用它们，则应将 `DB_FOREIGN_KEYS` 环境变量设置为 `false`：

```ini
DB_FOREIGN_KEYS=false
```

> [!注]
> 如果你使用 [Laravel 安装器](/docs/11/getting-started/installation#creating-a-laravel-project) 创建你的 Laravel 应用程序并选择 SQLite 作为你的数据库，Laravel 将自动创建一个 `database/database.sqlite` 文件，并为你运行默认的 [数据库迁移](/docs/11/database/migrations)。

#### Microsoft SQL Server 配置

要使用 Microsoft SQL Server 数据库，你应该确保已经安装了 `sqlsrv` 和 `pdo_sqlsrv` PHP 扩展，以及它们可能需要的任何依赖项，例如 Microsoft SQL ODBC 驱动程序。

#### 使用 URL 进行配置

通常，数据库连接是使用多个配置值（如 `host`、`database`、`username`、`password` 等）进行配置的。每个配置值都有其对应的环境变量。这意味着在生产服务器上配置数据库连接信息时，你需要管理几个环境变量。

一些托管数据库提供商（如 AWS 和 Heroku）提供单一的数据库“URL”，其中包含数据库的所有连接信息。一个示例数据库 URL 可能看起来像这样：

```html
mysql://root:password@127.0.0.1/forge?charset=UTF-8
```

这些 URL 通常遵循标准的架构约定：

```html
driver://username:password@host:port/database?options
```

为了方便，Laravel 支持这些 URL 作为使用多个配置选项配置数据库的替代方法。如果存在 `url`（或对应的 `DB_URL` 环境变量）配置选项，它将被用来提取数据库连接和凭证信息。

### 读写连接

有时你可能希望对 SELECT 语句使用一个数据库连接，而对 INSERT、UPDATE 和 DELETE 语句使用另一个数据库连接。Laravel 使这变得很简单，无论你是使用原始查询、查询构建器还是 Eloquent ORM，它都会始终使用正确的连接。

为了了解如何配置读/写连接，请看这个例子：

```php
'mysql' => [
    'read' => [
        'host' => [
            '192.168.1.1',
            '196.168.1.2',
        ],
    ],
    'write' => [
        'host' => [
            '196.168.1.3',
        ],
    ],
    'sticky' => true,

    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => env('DB_CHARSET', 'utf8mb4'),
    'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => null,
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
],
```

请注意，配置数组中添加了三个键：`read`、`write` 和 `sticky`。`read` 和 `write` 的键都包含一个 `host` 键的数组值。配置数组中的 `read` 和 `write` 连接的其余数据库选项将从主 `mysql` 配置数组中合并。

如果你希望覆盖主 `mysql` 数组中的值，只需要将项放在 `read` 和 `write` 数组中。所以，在这种情况下，`192.168.1.1` 将被用作“读”连接的主机，而 `192.168.1.3` 将被用于“写”连接。数据库凭证、前缀、字符集和主 `mysql` 数组中的所有其他选项将在两个连接之间共享。当 `host` 配置数组中存在多个值时，每次请求将随机选择一个数据库主机。

#### `sticky` 选项

`sticky` 选项是*可选*的值，可用来允许在当前请求周期内对数据库进行写入的记录立即被读取。如果启用了 `sticky` 选项，并且在当前请求周期对数据库进行了“写”操作，则任何进一步的“读”操作都会使用“写”连接。这确保了在请求周期内写入的任何数据可以在同一个请求中立即从数据库中读回。这是否是你的应用程序所需的行为取决于你自己的判断。

## 执行 SQL 查询

配置好数据库连接后，您可以使用 `DB` facade 运行查询。`DB` facade 为每种类型的查询提供方法：`select`、`update`、`insert`、`delete` 和 `statement`。

#### 运行 Select 查询

要运行基础 SELECT 查询，您可以使用 `DB` facade 上的 `select` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示所有应用用户的列表。
     */
    public function index(): View
    {
        $users = DB::select('select * from users where active = ?', [1]);

        return view('user.index', ['users' => $users]);
    }
}
```

传递给 `select` 方法的第一个参数是 SQL 查询，第二个参数是需要绑定到查询的任何参数绑定。通常，这些是 `where` 子句约束的值。参数绑定提供了对 SQL 注入的保护。

`select` 方法始终返回结果的 `array`。数组中的每个结果都将是表示数据库记录的 PHP `stdClass` 对象：

```php
use Illuminate\Support\Facades\DB;

$users = DB::select('select * from users');

foreach ($users as $user) {
    echo $user->name;
}
```

#### 选择标量值

有时您的数据库查询可能会导致单一的、标量值。Laravel 允许您直接使用 `scalar` 方法来检索查询的标量结果，而不是从记录对象中检索：

```php
$burgers = DB::scalar(
    "select count(case when food = 'burger' then 1 end) as burgers from menu"
);
```

#### 选择多个结果集

如果您的应用调用返回多个结果集的存储过程，您可以使用 `selectResultSets` 方法来检索存储过程返回的所有结果集：

```php
[$options, $notifications] = DB::selectResultSets(
    "CALL get_user_options_and_notifications(?)", $request->user()->id
);
```

#### 使用命名绑定

您不必使用 `?` 来表示参数绑定，您也可以使用命名绑定来执行查询：

```php
$results = DB::select('select * from users where id = :id', ['id' => 1]);
```

#### 运行 Insert 语句

要执行 `insert` 语句，您可以使用 `DB` facade 上的 `insert` 方法。与 `select` 类似，此方法接受 SQL 查询作为其第一个参数，绑定作为其第二个参数：

```php
use Illuminate\Support\Facades\DB;

DB::insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

#### 运行 Update 语句

应使用 `update` 方法来更新数据库中的现有记录。该方法返回受语句影响的行数：

```php
use Illuminate\Support\Facades\DB;

$affected = DB::update(
    'update users set votes = 100 where name = ?',
    ['Anita']
);
```

#### 运行 Delete 语句

应使用 `delete` 方法来从数据库删除记录。与 `update` 一样，该方法将返回被该方法影响的行数：

```php
use Illuminate\Support\Facades\DB;

$deleted = DB::delete('delete from users');
```

#### 运行 General 语句

一些数据库语句不返回任何值。对于这类操作，您可以使用 `DB` facade 上的 `statement` 方法：

```php
DB::statement('drop table users');
```

#### 运行未预备语句

有时您可能希望执行未绑定任何值的 SQL 语句。您可以使用 `DB` facade 的 `unprepared` 方法来完成此操作：

```php
DB::unprepared('update users set votes = 100 where name = "Dries"');
```

> [!WARNING]
> 由于未预备语句没有绑定参数，它们可能容易受到 SQL 注入的影响。您绝不应允许用户控制的值存在于未预备语句中。

#### 隐式提交

在事务中使用 `DB` facade 的 `statement` 和 `unprepared` 方法时，您必须小心避免导致[隐式提交](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)的语句。这些语句将导致数据库引擎间接提交整个事务，使 Laravel 对数据库的事务级别保持不知情。此类语句的一个例子是创建数据库表：

```php
DB::unprepared('create table a (col varchar(1) null)');
```

请参考 MySQL 手册，获取[触发隐式提交的所有语句](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)列表。

### 使用多个数据库连接

如果您的应用在 `config/database.php` 配置文件中定义了多个连接，您可以通过 `DB` facade 提供的 `connection` 方法访问每个连接。传递给 `connection` 方法的连接名应与 `config/database.php` 配置文件中列出的任何连接或使用 `config` 帮助程序在运行时配置的连接对应：

```php
use Illuminate\Support\Facades\DB;

$users = DB::connection('sqlite')->select(/* ... */);
```

您可以使用连接实例上的 `getPdo` 方法访问连接的原始底层 PDO 实例：

```php
$pdo = DB::connection()->getPdo();
```

### 监听查询事件

如果您想指定一个在您的应用执行每个 SQL 查询时被调用的闭包，您可以使用 `DB` facade 的 `listen` 方法。此方法对于日志查询或调试非常有用。您可以在[服务提供器](/docs/11/architecture-concepts/providers)的 `boot` 方法中注册查询监听器闭包：

```php
<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
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
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        DB::listen(function (QueryExecuted $query) {
            // $query->sql;
            // $query->bindings;
            // $query->time;
        });
    }
}
```

### 监控累积查询时间

现代 web 应用的一个常见性能瓶颈是它们花费在数据库查询上的时间。幸运的是，当 Laravel 在单个请求期间花费过多时间进行数据库查询时，它可以调用您选择的闭包或回调。要开始，请为 `whenQueryingForLongerThan` 方法提供一个查询时间阈值（以毫秒为单位）和闭包。您可以在[服务提供者](/docs/11/architecture-concepts/providers)的 `boot` 方法中调用此方法：

```php
<?php

namespace App\Providers;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Events\QueryExecuted;

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
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        DB::whenQueryingForLongerThan(500, function (Connection $connection, QueryExecuted $event) {
            // 通知开发团队...
        });
    }
}
```

## 数据库事务

您可以使用 `DB` facade 提供的 `transaction` 方法，在数据库事务中运行一组操作。如果在事务闭包内抛出异常，事务将自动回滚，并重新抛出异常。如果闭包成功执行，事务将自动提交。使用 `transaction` 方法时，您不需要担心手动回滚或提交：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
});
```

#### 处理死锁

`transaction` 方法接受一个可选的第二个参数，定义了当发生死锁时，事务应该重试的次数。一旦这些尝试耗尽，将会抛出异常：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
}, 5);
```

#### 手动使用事务

如果您希望手动开始事务，并完全控制回滚和提交，您可以使用 `DB` facade 提供的 `beginTransaction` 方法：

```php
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
```

您可以通过 `rollBack` 方法回滚事务：

```php
DB::rollBack();
```

最后，您可以通过 `commit` 方法提交事务：

```php
DB::commit();
```

> [!NOTE] > `DB` facade 的事务方法控制 [查询构造器](/docs/11/database/queries) 和 [Eloquent ORM](/docs/11/eloquent/eloquent) 的事务。

## 连接到数据库 CLI

如果您想要连接到您的数据库的 CLI，您可以使用 `db` Artisan 命令：

```shell
php artisan db
```

如果需要，您可以指定一个数据库连接名，连接到非默认连接的数据库：

```shell
php artisan db mysql
```

## 检查您的数据库

使用 `db:show` 和 `db:table` Artisan 命令，您可以获得关于您的数据库及其关联表的宝贵信息。要查看您的数据库概览，包括其大小、类型、打开连接数量以及表的摘要，您可以使用 `db:show` 命令：

```shell
php artisan db:show
```

您可以通过在命令中提供 `--database` 选项来指定应该检查哪个数据库连接：

```shell
php artisan db:show --database=pgsql
```

如果您希望将表行计数和数据库视图详细信息包含在命令的输出中，您可以分别提供 `--counts` 和 `--views` 选项。在大型数据库上，检索行计数和视图详细信息可能会很慢：

```shell
php artisan db:show --counts --views
```

此外，您可以使用以下 `Schema` 方法来检查您的数据库：

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```

如果您想要检查非应用默认连接的数据库连接，您可以使用 `connection` 方法：

```php
$columns = Schema::connection('sqlite')->getColumns('users');
```

#### 表概览

如果您希望获取数据库中单个表的概览，您可以执行 `db:table` Artisan 命令。此命令提供了数据库表的总体概览，包括其列、类型、属性、键和索引：

```shell
php artisan db:table users
```

## 监控您的数据库

使用 `db:monitor` Artisan 命令，您可以指示 Laravel 分派一个 `Illuminate\Database\Events\DatabaseBusy` 事件，如果您的数据库正在管理超过您指定的数量的打开连接。

要开始，请将 `db:monitor` 命令[安排为每分钟运行一次](/docs/11/digging-deeper/scheduling)。该命令接受您希望监控的数据库连接配置的名称以及在分派事件之前应该容忍的最大打开连接数：

```shell
php artisan db:monitor --databases=mysql,pgsql --max=100
```

仅仅调度这个命令还不足以触发一个通知，提醒您打开的连接数量。当命令遇到打开连接数超过阈值的数据库时，将分派一个 `DatabaseBusy` 事件。您应在应用程序的 `AppServiceProvider` 中监听此事件，以便向您或您的开发团队发送通知：

```php
use App\Notifications\DatabaseApproachingMaxConnections;
use Illuminate\Database\Events\DatabaseBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(function (DatabaseBusy $event) {
        Notification::route('mail', 'dev@example.com')
                ->notify(new DatabaseApproachingMaxConnections(
                    $event->connectionName,
                    $event->connections
                ));
    });
}
```
