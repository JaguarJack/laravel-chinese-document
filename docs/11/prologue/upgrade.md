---
title: Laravel 升级指南
---

# 升级指南

[[toc]]

## 高影响变更

- [更新依赖项](#updating-dependencies)
- [应用结构](#application-structure)
- [浮点类型](#floating-point-types)
- [修改列](#modifying-columns)
- [SQLite 最低版本](#sqlite-minimum-version)
- [更新 Sanctum](#updating-sanctum)

## 中等影响变更

- [Carbon 3](#carbon-3)
- [密码重哈希](#password-rehashing)
- [每秒速率限制](#per-second-rate-limiting)

## 低影响变更

- [移除 Doctrine DBAL](#doctrine-dbal-removal)
- [Eloquent 模型 `casts` 方法](#eloquent-model-casts-method)
- [空间类型](#spatial-types)
- [Spatie Once 包](#spatie-once-package)
- [`Enumerable` 合约](#the-enumerable-contract)
- [`UserProvider` 合约](#the-user-provider-contract)
- [`Authenticatable` 合约](#the-authenticatable-contract)

## 从 10.x 升级到 11.0

#### 预计升级时间：15 分钟

> [!NOTE]
> 我们尝试记录每一个可能的破坏性变更。由于这些破坏性变更中的一些只出现在框架的不太明显的部分，因此只有部分变更可能实际影响到您的应用程序。想节省时间？您可以使用 [Laravel Shift](https://laravelshift.com/) 来帮助自动化您的应用程序升级。

### 更新依赖项

**影响可能性：高**

#### 需要 PHP 8.2.0

Laravel 现在需要 PHP 8.2.0 或更高版本。

#### 需要 curl 7.34.0

Laravel 的 HTTP 客户端现在需要 curl 7.34.0 或更高版本。

#### Composer 依赖项

您应该在应用程序的 `composer.json` 文件中更新以下依赖项：

- `laravel/framework` 至 `^11.0`
- `nunomaduro/collision` 至 `^8.1`
- `laravel/breeze` 至 `^2.0`（如果已安装）
- `laravel/cashier` 至 `^15.0`（如果已安装）
- `laravel/dusk` 至 `^8.0`（如果已安装）
- `laravel/jetstream` 至 `^5.0`（如果已安装）
- `laravel/octane` 至 `^2.3`（如果已安装）
- `laravel/passport` 至 `^12.0`（如果已安装）
- `laravel/sanctum` 至 `^4.0`（如果已安装）
- `laravel/spark-stripe` 至 `^5.0`（如果已安装）
- `laravel/telescope` 至 `^5.0`（如果已安装）
- `inertiajs/inertia-laravel` 至 `^1.0`（如果已安装）

如果您的应用程序使用 Laravel Cashier Stripe、Passport、Sanctum、Spark Stripe 或 Telescope，您将需要将它们的迁移发布到您的应用程序中。Cashier Stripe、Passport、Sanctum、Spark Stripe 和 Telescope **不再自动从它们自己的迁移**目录加载迁移。因此，您应该运行以下命令将它们的迁移发布到您的应用程序中：

```bash
php artisan vendor:publish --tag=cashier-migrations
php artisan vendor:publish --tag=passport-migrations
php artisan vendor:publish --tag=sanctum-migrations
php artisan vendor:publish --tag=spark-migrations
php artisan vendor:publish --tag=telescope-migrations
```

此外，您应该查看这些包的升级指南，以确保您了解任何其他破坏性变更：

- [Laravel Cashier Stripe](#cashier-stripe)
- [Laravel Passport](#passport)
- [Laravel Sanctum](#sanctum)
- [Laravel Spark Stripe](#spark-stripe)
- [Laravel Telescope](#telescope)

如果您手动安装了 Laravel 安装程序，您应该通过 Composer 更新安装程序：

```bash
composer global require laravel/installer:^5.6
```

最后，如果您之前已将 `doctrine/dbal` Composer 依赖项添加到您的应用程序中，您可以将其移除，因为 Laravel 不再依赖此包。

### 应用结构

Laravel 11 引入了一个新的默认应用结构，包含更少的默认文件。具体来说，新的 Laravel 应用包含更少的服务提供者、中间件和配置文件。

然而，我们**不推荐**从 Laravel 10 升级到 Laravel 11 的应用尝试迁移它们的应用结构，因为 Laravel 11 已经仔细调整以支持 Laravel 10 的应用结构。

### 认证

#### 密码重哈希

Laravel 11 将在认证期间自动重新哈希用户的密码，如果自密码上次哈希以来您的哈希算法的“工作因子”已更新。

通常，这不应该干扰您的应用程序；然而，您可以通过在应用程序的 `config/hashing.php` 配置文件中添加 `rehash_on_login` 选项来禁用此行为：

```php
'rehash_on_login' => false,
```

#### `UserProvider` 合约

**影响可能性：低**

`Illuminate\Contracts\Auth\UserProvider` 合约收到了一个新的 `rehashPasswordIfRequired` 方法。当应用程序的哈希算法工作因子发生变化时，此方法负责重新哈希并存储用户的密码。

如果您的应用程序或包定义了实现此接口的类，您应该将新的 `rehashPasswordIfRequired` 方法添加到您的实现中。一个参考实现可以在 `Illuminate\Auth\EloquentUserProvider` 类中找到：

```php
public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false);
```

#### `Authenticatable` 合约

**影响可能性：低**

`Illuminate\Contracts\Auth\Authenticatable` 合约收到了一个新的 `getAuthPasswordName` 方法。此方法负责返回您的认证实体的密码列的名称。

如果您的应用程序或包定义了实现此接口的类，您应该将新的 `getAuthPasswordName` 方法添加到您的实现中：

```php
public function getAuthPasswordName()
{
    return 'password';
}
```

Laravel 包含的默认 `User` 模型自动接收此方法，因为该方法包含在 `Illuminate\Auth\Authenticatable` 特性中。

#### `AuthenticationException` 类

**影响可能性：非常低**

`Illuminate\Auth\AuthenticationException` 类的 `redirectTo` 方法现在需要一个 `Illuminate\Http\Request` 实例作为其第一个参数。如果您手动捕获此异常并调用 `redirectTo` 方法，您应该相应地更新您的代码：

```php
if ($e instanceof AuthenticationException) {
    $path = $e->redirectTo($request);
}
```

### 缓存

#### 缓存键前缀

**影响可能性：非常低**

以前，如果为 DynamoDB、Memcached 或 Redis 缓存存储定义了缓存键前缀，Laravel 会在前缀后附加 `:`。在 Laravel 11 中，缓存键前缀不会接收 `:` 后缀。如果您想保持之前的前缀行为，您可以手动将 `:` 后缀添加到您的缓存键前缀。

### 集合

#### `Enumerable` 合约

**影响可能性：低**

`Illuminate\Support\Enumerable` 合约的 `dump` 方法已更新，以接受可变参数 `...$args`。如果您正在实现这个接口，您应该相应地更新您的实现：

```php
public function dump(...$args);
```

### 数据库

#### SQLite 3.35.0+

**影响可能性：高**

如果您的应用程序正在使用 SQLite 数据库，需要 SQLite 3.35.0 或更高版本。

#### Eloquent 模型 `casts` 方法

**影响可能性：低**

基础 Eloquent 模型类现在定义了一个 `casts` 方法，以支持属性转换的定义。如果您的应用程序的模型定义了一个 `casts` 关系，它可能与基础 Eloquent 模型类现在存在的 `casts` 方法冲突。

#### 修改列

**影响可能性：高**

当修改列时，您现在必须在更改后显式包括您希望保留在列定义上的所有修饰符。任何缺失的属性都将被删除。例如，要保留 `unsigned`、`default` 和 `comment` 属性，您必须在更改列时显式调用每个修饰符，即使这些属性已经通过之前的迁移分配给列。

例如，假设您有一个迁移创建了一个带有 `unsigned`、`default` 和 `comment` 属性的 `votes` 列：

```php
Schema::create('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('The vote count');
});
```

后来，您编写了一个将该列更改为 `nullable` 的迁移：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->nullable()->change();
});
```

在 Laravel 10 中，此迁移将保留列上的 `unsigned`、`default` 和 `comment` 属性。然而，在 Laravel 11 中，迁移现在必须还包括之前在列上定义的所有属性。否则，它们将被删除：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')
        ->unsigned()
        ->default(1)
        ->comment('The vote count')
        ->nullable()
        ->change();
});
```

`change` 方法不会更改列的索引。因此，您可以使用索引修饰符在修改列时显式添加或删除索引：

```php
// 添加索引...
$table->bigIncrements('id')->primary()->change();

// 删除索引...
$table->char('postal_code', 10)->unique(false)->change();
```

如果您不希望更新应用程序中所有现有的“更改”迁移以保留列的现有属性，您可以简单地[压缩您的迁移](/docs/11/database/migrations#squashing-migrations)：

```bash
php artisan schema:dump
```

一旦您的迁移被压缩，Laravel 将使用您应用程序的架构文件“迁移”数据库，然后运行任何待处理的迁移。

#### 浮点类型

**影响可能性：高**

`double` 和 `float` 迁移列类型已重写，以在所有数据库中保持一致。

`double` 列类型现在创建一个没有总位数和小数位（小数点后的数字）的 `DOUBLE` 等效列，这是标准 SQL 语法。因此，您可以移除 `$total` 和 `$places` 参数：

```php
$table->double('amount');
```

`float` 列类型现在创建一个没有总位数和小数位（小数点后的数字）的 `FLOAT` 等效列，但有一个可选的 `$precision` 规范来确定存储大小为 4 字节单精度列或 8 字节双精度列。因此，您可以移除 `$total` 和 `$places` 参数，并根据您的数据库文档指定可选的 `$precision` 到您希望的值：

```php
$table->float('amount', precision: 53);
```

已移除 `unsignedDecimal`、`unsignedDouble` 和 `unsignedFloat` 方法，因为这些列类型的无符号修饰符已被 MySQL 弃用，并且从未在其他数据库系统上标准化。然而，如果您希望继续使用这些列类型的已弃用无符号属性，您可以将 `unsigned` 方法链接到列的定义：

```php
$table->decimal('amount', total: 8, places: 2)->unsigned();
$table->double('amount')->unsigned();
$table->float('amount', precision: 53)->unsigned();
```

#### 专用 MariaDB 驱动

**影响可能性：非常低**

Laravel 11 添加了一个专用的数据库驱动来连接 MariaDB 数据库，而不是始终使用 MySQL 驱动。

如果您的应用程序连接到 MariaDB 数据库，您可以将连接配置更新为新的 `mariadb` 驱动，以便在将来从 MariaDB 特定的功能中受益：

```php
'driver' => 'mariadb',
'url' => env('DB_URL'),
'host' => env('DB_HOST', '127.0.0.1'),
'port' => env('DB_PORT', '3306'),
// ...
```

目前，新的 MariaDB 驱动的行为类似于当前的 MySQL 驱动，但有一个例外：`uuid` 架构构建器方法创建原生 UUID 列而不是 `char(36)` 列。

如果您的现有迁移使用了 `uuid` 架构构建器方法，并且您选择使用新的 `mariadb` 数据库驱动，您应该将您的迁移中的 `uuid` 方法调用更新为 `char`，以避免破坏性变更或意外行为：

```php
Schema::table('users', function (Blueprint $table) {
    $table->char('uuid', 36);

    // ...
});
```

#### 空间类型

**影响可能性：低**

数据库迁移的空间列类型已重写，以在所有数据库中保持一致。因此，您可以从您的迁移中移除 `point`、`lineString`、`polygon`、`geometryCollection`、`multiPoint`、`multiLineString`、`multiPolygon` 和 `multiPolygonZ` 方法，改用 `geometry` 或 `geography` 方法：

```php
$table->geometry('shapes');
$table->geography('coordinates');
```

要在 MySQL、MariaDB 和 PostgreSQL 上显式限制存储在列中的值的类型或空间参考系统标识符，您可以将 `subtype` 和 `srid` 传递给方法：

```php
$table->geometry('dimension', subtype: 'polygon', srid: 0);
$table->geography('latitude', subtype: 'point', srid: 4326);
```

相应地，PostgreSQL 语法的 `isGeometry` 和 `projection` 列修饰符已被移除。

#### 移除 Doctrine DBAL

**影响可能性：低**

以下列表中的 Doctrine DBAL 相关类和方法已被移除。Laravel 不再依赖此包，并且不再需要注册自定义 Doctrine 类型来正确创建和修改之前需要自定义类型的各种列类型：

- `Illuminate\Database\Schema\Builder::$alwaysUsesNativeSchemaOperationsIfPossible` 类属性
- `Illuminate\Database\Schema\Builder::useNativeSchemaOperationsIfPossible()` 方法
- `Illuminate\Database\Connection::usingNativeSchemaOperations()` 方法
- `Illuminate\Database\Connection::isDoctrineAvailable()` 方法
- `Illuminate\Database\Connection::getDoctrineConnection()` 方法
- `Illuminate\Database\Connection::getDoctrineSchemaManager()` 方法
- `Illuminate\Database\Connection::getDoctrineColumn()` 方法
- `Illuminate\Database\Connection::registerDoctrineType()` 方法
- `Illuminate\Database\DatabaseManager::registerDoctrineType()` 方法
- `Illuminate\Database\PDO` 目录
- `Illuminate\Database\DBAL\TimestampType` 类
- `Illuminate\Database\Schema\Grammars\ChangeColumn` 类
- `Illuminate\Database\Schema\Grammars\RenameColumn` 类
- `Illuminate\Database\Schema\Grammars\Grammar::getDoctrineTableDiff()` 方法

此外，不再需要通过您应用程序的 `database` 配置文件中的 `dbal.types` 注册自定义 Doctrine 类型。

如果您之前使用 Doctrine DBAL 来检视您的数据库及其相关表，您可以改用 Laravel 的新原生架构方法（`Schema::getTables()`、`Schema::getColumns()`、`Schema::getIndexes()`、`Schema::getForeignKeys()` 等）。

#### 已弃用的架构方法

**影响可能性：非常低**

已弃用、基于 Doctrine 的 `Schema::getAllTables()`、`Schema::getAllViews()` 和 `Schema::getAllTypes()` 方法已被新的 Laravel 原生 `Schema::getTables()`、`Schema::getViews()` 和 `Schema::getTypes()` 方法取代。

当使用 PostgreSQL 和 SQL Server 时，新的架构方法不会接受三部分引用（例如 `database.schema.table`）。因此，您应该使用 `connection()` 来声明数据库：

```php
Schema::connection('database')->hasTable('schema.table');
```

#### 架构构建器 `getColumnType()` 方法

**影响可能性：非常低**

`Schema::getColumnType()` 方法现在总是返回给定列的实际类型，而不是 Doctrine DBAL 等效类型。

#### 数据库连接接口

**影响可能性：非常低**

`Illuminate\Database\ConnectionInterface` 接口收到了一个新的 `scalar` 方法。如果您正在定义自己的此接口的实现，您应该将 `scalar` 方法添加到您的实现中：

```php
public function scalar($query, $bindings = [], $useReadPdo = true);
```

### 日期

#### Carbon 3

**影响可能性：中等**

Laravel 11 支持 Carbon 2 和 Carbon 3。Carbon 是一个广泛被 Laravel 和整个生态系统的包使用的日期操作库。如果您安装了 Carbon 3，您应该查看 Carbon 的[变更日志](https://github.com/briannesbitt/Carbon/releases/tag/3.0.0)。

### 邮件

#### `Mailer` 合约

**影响可能性：非常低**

`Illuminate\Contracts\Mail\Mailer` 合约收到了一个新的 `sendNow` 方法。如果您的应用程序或包手动实现了这个合约，您应该将新的 `sendNow` 方法添加到您的实现中：

```php
public function sendNow($mailable, array $data = [], $callback = null);
```

### 包

#### 将服务提供者发布到应用程序

**影响可能性：非常低**

如果您编写了一个 Laravel 包，该包手动将服务提供者发布到应用程序的 `app/Providers` 目录，并手动修改应用程序的 `config/app.php` 配置文件来注册服务提供者，您应该更新您的包以使用新的 `ServiceProvider::addProviderToBootstrapFile` 方法。

`addProviderToBootstrapFile` 方法将自动将您已发布的服务提供者添加到应用程序的 `bootstrap/providers.php` 文件中，因为新的 Laravel 11 应用程序中的 `config/app.php` 配置文件中不存在 `providers` 数组。

```php
use Illuminate\Support\ServiceProvider;

ServiceProvider::addProviderToBootstrapFile(Provider::class);
```

### 队列

#### `BatchRepository` 接口

**影响可能性：非常低**

`Illuminate\Bus\BatchRepository` 接口收到了一个新的 `rollBack` 方法。如果您在自己的包或应用程序中实现了这个接口，您应该将这个方法添加到您的实现中：

```php
public function rollBack();
```

#### 数据库事务中的同步作业

**影响可能性：非常低**

以前，同步作业（使用 `sync` 队列驱动的作业）会立即执行，不管队列连接的 `after_commit` 配置选项是否设置为 `true` 或作业上是否调用了 `afterCommit` 方法。

在 Laravel 11 中，同步队列作业现在将尊重队列连接或作业的“提交后”配置。

### 速率限制

#### 每秒速率限制

**影响可能性：中等**

Laravel 11 支持每秒速率限制，而不仅限于每分钟的粒度。您应该注意与此变更相关的各种潜在破坏性变更。

`GlobalLimit` 类构造函数现在接受秒而不是分钟。这个类没有文档记录，通常不会被您的应用程序使用：

```php
new GlobalLimit($attempts, 2 * 60);
```

`Limit` 类构造函数现在接受秒而不是分钟。这个类的所有文档用法都限于静态构造函数，如 `Limit::perMinute` 和 `Limit::perSecond`。然而，如果您手动实例化这个类，您应该更新您的应用程序以向类的构造函数提供秒：

```php
new Limit($key, $attempts, 2 * 60);
```

`Limit` 类的 `decayMinutes` 属性已重命名为 `decaySeconds`，现在包含秒而不是分钟。

`Illuminate\Queue\Middleware\ThrottlesExceptions` 和 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 类构造函数现在接受秒而不是分钟：

```php
new ThrottlesExceptions($attempts, 2 * 60);
new ThrottlesExceptionsWithRedis($attempts, 2 * 60);
```

### Cashier Stripe

#### 更新 Cashier Stripe

**影响可能性：高**

Laravel 11 不再支持 Cashier Stripe 14.x。因此，您应该在您的 `composer.json` 文件中将您的 Laravel Cashier Stripe 依赖项更新为 `^15.0`。

Cashier Stripe 15.0 不再自动从其自己的迁移目录加载迁移。相反，您应该运行以下命令将 Cashier Stripe 的迁移发布到您的应用程序：

```shell
php artisan vendor:publish --tag=cashier-migrations
```

请查看完整的 [Cashier Stripe 升级指南](https://github.com/laravel/cashier-stripe/blob/15.x/UPGRADE.md) 以了解其他破坏性变更。

### Spark (Stripe)

#### 更新 Spark Stripe

**影响可能性：高**

Laravel 11 不再支持 Laravel Spark Stripe 4.x。因此，您应该在您的 `composer.json` 文件中将您的 Laravel Spark Stripe 依赖项更新为 `^5.0`。

Spark Stripe 5.0 不再自动从其自己的迁移目录加载迁移。相反，您应该运行以下命令将 Spark Stripe 的迁移发布到您的应用程序：

```shell
php artisan vendor:publish --tag=spark-migrations
```

请查看完整的 [Spark Stripe 升级指南](https://spark.laravel.com/docs/spark-stripe/upgrade.html) 以了解其他破坏性变更。

### Passport

#### 更新 Passport

**影响可能性：高**

Laravel 11 不再支持 Laravel Passport 11.x。因此，您应该在您的 `composer.json` 文件中将您的 Laravel Passport 依赖项更新为 `^12.0`。

Passport 12.0 不再自动从其自己的迁移目录加载迁移。相反，您应该运行以下命令将 Passport 的迁移发布到您的应用程序：

```shell
php artisan vendor:publish --tag=passport-migrations
```

此外，默认情况下禁用密码授权类型。您可以通过在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用 `enablePasswordGrant` 方法来启用它：

```php
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

### Sanctum

#### 更新 Sanctum

**影响可能性：高**

Laravel 11 不再支持 Laravel Sanctum 3.x。因此，您应该在您的 `composer.json` 文件中将您的 Laravel Sanctum 依赖项更新为 `^4.0`。

Sanctum 4.0 不再自动从其自己的迁移目录加载迁移。相反，您应该运行以下命令将 Sanctum 的迁移发布到您的应用程序：

```shell
php artisan vendor:publish --tag=sanctum-migrations
```

然后，在您的应用程序的 `config/sanctum.php` 配置文件中，您应该将 `authenticate_session`、`encrypt_cookies` 和 `validate_csrf_token` 中间件的引用更新为以下内容：

```php
'middleware' => [
    'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
    'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
],
```

### Telescope

#### 更新 Telescope

**影响可能性：高**

Laravel 11 不再支持 Laravel Telescope 4.x。因此，您应该在您的 `composer.json` 文件中将您的 Laravel Telescope 依赖项更新为 `^5.0`。

Telescope 5.0 不再自动从其自己的迁移目录加载迁移。相反，您应该运行以下命令将 Telescope 的迁移发布到您的应用程序：

```shell
php artisan vendor:publish --tag=telescope-migrations
```

### Spatie Once 包

**影响可能性：中等**

Laravel 11 现在提供了自己的 [`once` 函数](/docs/11/packages/reverb#method-once) 以确保给定的闭包只执行一次。因此，如果您的应用程序依赖于 `spatie/once` 包，您应该从您的应用程序的 `composer.json` 文件中移除它，以避免冲突。

### 杂项

我们还鼓励您查看 `laravel/laravel` [GitHub 仓库](https://github.com/laravel/laravel) 中的变更。虽然这些变更中的许多不是必需的，但您可能希望将这些文件与您的应用程序同步。这些变更中的一些将在本升级指南中涵盖，但其他一些，如配置文件或注释的变更，将不会。您可以使用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/10.x...11.x) 轻松查看这些变更，并选择哪些更新对您来说很重要。
