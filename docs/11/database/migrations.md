---
title: Laravel 数据库迁移
---

# 数据库 迁移

[[toc]]

## 介绍

迁移就像是数据库的版本控制，允许你的团队定义和共享应用的数据库模式。如果你曾经不得不告诉团队成员在从源代码控制中拉取你的更改后手动向他们的本地数据库模式添加列，那么你就遇到了数据库迁移所解决的问题。

Laravel 的 `Schema` [facade](/docs/11/architecture-concepts/facades) 为所有支持的 Laravel 数据库系统提供创建和操作表的数据库无关支持。通常，迁移将使用这个 facade 来创建和修改数据库表和列。

## 生成迁移

你可以使用 `make:migration` [Artisan 命令](/docs/11/digging-deeper/artisan) 来生成一个数据库迁移。新的迁移将被放置在 `database/migrations` 目录中。每个迁移文件名都包含了时间戳，让 Laravel 能够确定迁移的顺序：

```shell
php artisan make:migration create_flights_table
```

Laravel 会使用迁移名称来尝试猜测表的名称以及迁移是否会创建一个新表。如果 Laravel 能够从迁移名称中确定表名，Laravel 将预填充指定表的生成迁移文件。否则，你可以手动指定迁移文件中的表。

如果你想为生成的迁移指定一个自定义路径，执行 `make:migration` 命令时可以使用 `--path` 选项。给定的路径应与你的应用的基本路径相关。

> [!NOTE]
> 迁移模板可以使用 [stub 发布](/docs/11/digging-deeper/artisan#stub-customization) 进行自定义。

### 压缩迁移

随着你构建应用，你可能会随着时间的积累越来越多的迁移。这可能导致你的 `database/migrations` 目录变得臃肿，可能包含数百个迁移。如果你愿意，你可以将你的迁移压缩成一个 SQL 文件。要开始，请执行 `schema:dump` 命令：

```shell
php artisan schema:dump

# 转储当前数据库模式并清理所有现有迁移...
php artisan schema:dump --prune
```

当你执行这个命令时，Laravel 会将一个 "模式" 文件写入你的应用的 `database/schema` 目录。模式文件的名称将对应于数据库连接。现在，当你尝试迁移你的数据库并且没有其他迁移被执行时，Laravel 将首先执行你正在使用的数据库连接的模式文件中的 SQL 语句。执行了模式文件的 SQL 语句后，Laravel 将执行未包含在模式转储中的任何剩余迁移。

如果你的应用的测试使用的是与你在本地开发期间通常使用的不同的数据库连接，则应该确保你已经使用该数据库连接转储了一个模式文件，以便你的测试能够构建你的数据库。在转储你在本地开发期间通常使用的数据库连接之后，你可能希望这样做：

```shell
php artisan schema:dump
php artisan schema:dump --database=testing --prune
```

你应该将数据库模式文件提交到源代码控制，以便其他新团队成员可以快速创建你的应用的初始数据库结构。

> [!WARNING]
> 迁移压缩仅适用于 MySQL、PostgreSQL 和 SQLite 数据库，并使用数据库的命令行客户端。

## 迁移结构

迁移类包含两个方法：`up` 和 `down`。`up` 方法用于向数据库中添加新表、列或索引，而 `down` 方法应该撤销 `up` 方法执行的操作。

在这两个方法中，你可以使用 Laravel schema 构建器来表现地创建和修改表。要了解 schema 构建器上所有可用的方法，请查看[它的文档](#creating-tables)。例如，以下迁移创建了一个 `flights` 表：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 运行迁移。
     */
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('airline');
            $table->timestamps();
        });
    }

    /**
     * 回滚迁移。
     */
    public function down(): void
    {
        Schema::drop('flights');
    }
};
```

#### 设置迁移连接

如果你的迁移将与应用的默认数据库连接以外的数据库连接进行交互，则应设置迁移的 `$connection` 属性：

```php
/**
 * 应该由迁移使用的数据库连接。
 *
 * @var string
 */
protected $connection = 'pgsql';

/**
 * 运行迁移。
 */
public function up(): void
{
    // ...
}
```

## 运行迁移

要运行所有未完成的迁移，请执行 `migrate` Artisan 命令：

```shell
php artisan migrate
```

如果你想要查看到目前为止已经运行的迁移，你可以使用 `migrate:status` Artisan 命令：

```shell
php artisan migrate:status
```

如果你想看到迁移将执行的 SQL 语句而不实际运行它们，你可以为 `migrate` 命令提供 `--pretend` 标志：

```shell
php artisan migrate --pretend
```

#### 隔离迁移执行

如果你正在多个服务器上部署应用并在部署过程中运行迁移，你可能不希望两个服务器同时尝试迁移数据库。为了避免这种情况，你可以在调用 `migrate` 命令时使用 `isolated` 选项。

当提供了 `isolated` 选项时，Laravel 会在试图运行迁移之前使用应用的缓存驱动获取一个原子锁。当该锁被持有时，所有其他尝试运行 `migrate` 命令的尝试都不会执行；然而，命令仍然会以成功的退出状态代码退出：

```shell
php artisan migrate --isolated
```

> [!WARNING]
> 要使用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器必须与相同的中央缓存服务器通信。

#### 强制在生产环境中运行迁移

某些迁移操作是破坏性的，这意味着它们可能导致你丢失数据。为了防止你在生产数据库上运行这些命令，你将在执行命令前被提示确认。要强制命令运行而不提示，请使用 `--force` 标志：

```shell
php artisan migrate --force
```

### 回滚迁移

要回滚最近的迁移操作，你可以使用 `rollback` Artisan 命令。此命令回滚最后一个“批次”的迁移，这可能包括多个迁移文件：

```shell
php artisan migrate:rollback
```

你可以通过为 `rollback` 命令提供 `step` 选项来回滚有限数量的迁移。例如，以下命令将回滚最后五个迁移：

```shell
php artisan migrate:rollback --step=5
```

你可以通过为 `rollback` 命令提供 `batch` 选项来回滚特定的“批次”迁移，其中 `batch` 选项对应于你的应用的 `migrations` 数据库表中的批次值。例如，以下命令将回滚批次三中的所有迁移：

```shell
php artisan migrate:rollback --batch=3
```

如果你想看到迁移将执行的 SQL 语句而实际上并没有运行它们，你可以为 `migrate:rollback` 命令提供 `--pretend` 标志：

```shell
php artisan migrate:rollback --pretend
```

`migrate:reset` 命令将回滚你的应用的所有迁移：

```shell
php artisan migrate:reset
```

#### 使用单个命令回滚和迁移

`migrate:refresh` 命令将回滚所有的迁移然后执行 `migrate` 命令。这个命令有效地重新创建了你的整个数据库：

```shell
php artisan migrate:refresh

# 刷新数据库并运行所有数据库种子...
php artisan migrate:refresh --seed
```

你可以通过为 `refresh` 命令提供 `step` 选项来回滚和重新迁移有限数量的迁移。例如，以下命令将回滚和重新迁移最后五个迁移：

```shell
php artisan migrate:refresh --step=5
```

#### 删除所有表并迁移

`migrate:fresh` 命令将从数据库中删除所有表，然后执行 `migrate` 命令：

```shell
php artisan migrate:fresh

php artisan migrate:fresh --seed
```

默认情况下，`migrate:fresh` 命令只会删除默认数据库连接中的表。不过，你可以使用 `--database` 选项来指定应该迁移的数据库连接。数据库连接名称应该对应于你的应用的 `database` [配置文件](/docs/11/getting-started/configuration) 中定义的连接：

```shell
php artisan migrate:fresh --database=admin
```

> [!WARNING]
> 无论它们的前缀是什么，`migrate:fresh` 命令都会删除所有数据库表。在为其他应用共享的数据库上开发时，应谨慎使用此命令。

## 表

### 创建表

要创建新的数据库表，请在 `Schema` facade 上使用 `create` 方法。`create` 方法接受两个参数：第一个是表名，而第二个是一个闭包，该闭包会接收到一个 `Blueprint` 对象，可以用来定义新表：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email');
    $table->timestamps();
});
```

创建表时，你可以使用 schema 构建器的 [列方法](#creating-columns) 中的任何一个来定义表的列。

#### 确定表 / 列的存在

你可以使用 `hasTable`、`hasColumn` 和 `hasIndex` 方法来判断一个表、列或索引是否存在：

```php
if (Schema::hasTable('users')) {
    // "users" 表存在...
}

if (Schema::hasColumn('users', 'email')) {
    // "users" 表存在并且有一个 "email" 列...
}

if (Schema::hasIndex('users', ['email'], 'unique')) {
    // "users" 表存在并且 "email" 列上有一个唯一索引...
}
```

#### 数据库连接和表选项

如果你想在非应用默认连接的数据库连接上执行 schema 操作，使用 `connection` 方法：

```php
Schema::connection('sqlite')->create('users', function (Blueprint $table) {
    $table->id();
});
```

此外，还有几个属性和方法可以用来定义表创建的其他方面。`engine` 属性可用于在使用 MySQL 时指定表的存储引擎：

```php
Schema::create('users', function (Blueprint $table) {
    $table->engine('InnoDB');

    // ...
});
```

`charset` 和 `collation` 属性可用于在使用 MySQL 时指定创建表的字符集和排序规则：

```php
Schema::create('users', function (Blueprint $table) {
    $table->charset('utf8mb4');
    $table->collation('utf8mb4_unicode_ci');

    // ...
});
```

`temporary` 方法可用于指示表应该是“临时的”。临时表只对当前连接的数据库会话可见，并且在连接关闭时会自动丢弃：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->temporary();

    // ...
});
```

如果你想向数据库表添加一个"注释"，你可以在表实例上调用 `comment` 方法。表注释目前只由 MySQL 和 PostgreSQL 支持：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->comment('Business calculations');

    // ...
});
```

### 更新表

`Schema` facade 上的 `table` 方法可以用来更新现有表。与 `create` 方法类似，`table` 方法接受两个参数：表名和一个接收 `Blueprint` 实例的闭包，你可以用来向表中添加列或索引：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

### 重命名 / 删除表

要重命名现有数据库表，请使用 `rename` 方法：

```php
use Illuminate\Support\Facades\Schema;

Schema::rename($from, $to);
```

要删除现有表，你可以使用 `drop` 或 `dropIfExists` 方法：

```php
Schema::drop('users');

Schema::dropIfExists('users');
```

#### 重命名带有外键的表

在重命名表之前，你应该验证表上的任何外键约束在你的迁移文件中是否具有明确的名称，而不是让 Laravel 分配一个基于约定的名称。否则，外键约束名称将引用旧的表名。

## 列

### 创建列

`Schema` facade 上的 `table` 方法可以用来更新现有表。与 `create` 方法类似，`table` 方法接受两个参数：表名和一个接收 `Illuminate\Database\Schema\Blueprint` 实例的闭包，你可以使用它向表中添加列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

### 可用的列类型

schema 构建器蓝图提供了各种方法，对应于你可以添加到数据库表的不同类型的列。所有可用的方法都列在下表中：

#### `bigIncrements()`

`bigIncrements` 方法创建一个自动增长的 `UNSIGNED BIGINT`（主键）等效列：

```php
$table->bigIncrements('id');
```

#### `bigInteger()`

`bigInteger` 方法创建一个 `BIGINT` 等效列：

```php
$table->bigInteger('votes');
```

#### `binary()`

`binary` 方法创建一个 `BLOB` 等效列：

```php
$table->binary('photo');
```

在使用 MySQL、MariaDB 或 SQL Server 时，你可以传递 `length` 和 `fixed` 参数来创建 `VARBINARY` 或 `BINARY` 等效列：

```php
$table->binary('data', length: 16); // VARBINARY(16)

$table->binary('data', length: 16, fixed: true); // BINARY(16)
```

#### `boolean()`

`boolean` 方法创建一个 `BOOLEAN` 等效列：

```php
$table->boolean('confirmed');
```

#### `char()`

`char` 方法创建一个指定长度的 `CHAR` 等效列：

```php
$table->char('name', length: 100);
```

#### `dateTimeTz()`

`dateTimeTz` 方法创建一个带有可选小数秒精度的 `DATETIME`（带时区）等效列：

```php
$table->dateTimeTz('created_at', precision: 0);
```

#### `dateTime()`

`dateTime` 方法创建一个带有可选小数秒精度的 `DATETIME` 等效列：

```php
$table->dateTime('created_at', precision: 0);
```

#### `date()`

`date` 方法创建一个 `DATE` 等效列：

```php
$table->date('created_at');
```

#### `decimal()`

`decimal` 方法创建一个具有指定精度（总位数）和比例（小数位数）的 `DECIMAL` 等效列：

```php
$table->decimal('amount', total: 8, places: 2);
```

#### `double()`

`double` 方法创建一个 `DOUBLE` 等效列：

```php
$table->double('amount');
```

#### `enum()`

`enum` 方法创建一个具有给定有效值的 `ENUM` 等效列：

```php
$table->enum('difficulty', ['easy', 'hard']);
```

#### `float()`

`float` 方法创建一个具有给定精度的 `FLOAT` 等效列：

```php
$table->float('amount', precision: 53);
```

#### `foreignId()`

`foreignId` 方法创建一个 `UNSIGNED BIGINT` 等效列：

```php
$table->foreignId('user_id');
```

#### `foreignIdFor()`

`foreignIdFor` 方法为给定的模型类添加一个 `{column}_id` 等效列。列类型将是 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`，这取决于模型键类型：

```php
$table->foreignIdFor(User::class);
```

#### `foreignUlid()`

`foreignUlid` 方法创建一个 `ULID` 等效列：

```php
$table->foreignUlid('user_id');
```

#### `foreignUuid()`

`foreignUuid` 方法创建一个 `UUID` 等效列：

```php
$table->foreignUuid('user_id');
```

#### `geography()`

`geography` 方法创建一个具有给定空间类型和 SRID（空间参考系统标识符）的 `GEOGRAPHY` 等效列：

```php
$table->geography('coordinates', subtype: 'point', srid: 4326);
```

> [!NOTE]
> 对于空间类型的支持取决于你的数据库驱动。请查阅你的数据库文档。如果你的应用使用 PostgreSQL 数据库，你必须在 `geography` 方法可用之前安装 [PostGIS](https://postgis.net) 扩展。

#### `geometry()`

`geometry` 方法创建一个具有给定空间类型和 SRID（空间参考系统标识符）的 `GEOMETRY` 等效列：

```php
$table->geometry('positions', subtype: 'point', srid: 0);
```

> [!NOTE]
> 对于空间类型的支持取决于你的数据库驱动。请查阅你的数据库文档。如果你的应用使用 PostgreSQL 数据库，你必须在 `geometry` 方法可用之前安装 [PostGIS](https://postgis.net) 扩展。

#### `id()`

`id` 方法是 `bigIncrements` 方法的别名。默认情况下，该方法将创建一个 `id` 列；但是，如果你想要为该列分配一个不同的名称，可以传递一个列名称：

```php
$table->id();
```

#### `increments()`

`increments` 方法创建一个自动增长的 `UNSIGNED INTEGER` 等效列作为主键：

```php
$table->increments('id');
```

#### `integer()`

`integer` 方法创建一个 `INTEGER` 等效列：

```php
$table->integer('votes');
```

#### `ipAddress()`

`ipAddress` 方法创建一个 `VARCHAR` 等效列：

```php
$table->ipAddress('visitor');

```

使用 PostgreSQL 时，将创建一个 `INET` 列。

#### `json()`

`json` 方法创建一个等同于 `JSON` 的列：

```php
$table->json('options');
```

#### `jsonb()`

`jsonb` 方法创建一个等同于 `JSONB` 的列：

```php
$table->jsonb('options');
```

#### `longText()`

`longText` 方法创建一个等同于 `LONGTEXT` 的列：

```php
$table->longText('description');
```

使用 MySQL 或 MariaDB 时，你可以应用 `binary` 字符集到该列，以创建等同于 `LONGBLOB` 的列：

```php
$table->longText('data')->charset('binary'); // LONGBLOB
```

#### `macAddress()`

`macAddress` 方法创建一个旨在存储 MAC 地址的列。某些数据库系统（如 PostgreSQL）具有用于此类数据的专用列类型。其他数据库系统将使用等同于字符串的列：

```php
$table->macAddress('device');
```

#### `mediumIncrements()`

`mediumIncrements` 方法创建一个自增的等同于 `UNSIGNED MEDIUMINT` 的主键列：

```php
$table->mediumIncrements('id');
```

#### `mediumInteger()`

`mediumInteger` 方法创建一个等同于 `MEDIUMINT` 的列：

```php
$table->mediumInteger('votes');
```

#### `mediumText()`

`mediumText` 方法创建一个等同于 `MEDIUMTEXT` 的列：

```php
$table->mediumText('description');
```

使用 MySQL 或 MariaDB 时，你可以应用 `binary` 字符集到该列，以创建等同于 `MEDIUMBLOB` 的列：

```php
$table->mediumText('data')->charset('binary'); // MEDIUMBLOB
```

#### `morphs()`

`morphs` 方法是一个便利方法，添加一个 `{column}_id` 等同列和一个 `{column}_type` 等同于 `VARCHAR` 的列。`{column}_id` 的列类型将根据模型键类型而定，可能是 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`。

这个方法旨在用于定义多态 [Eloquent 关系](/docs/11/eloquent/eloquent-relationships) 所需的列。在以下示例中，将创建 `taggable_id` 和 `taggable_type` 列：

```php
$table->morphs('taggable');
```

#### `nullableTimestamps()`

`nullableTimestamps` 方法是 [timestamps](#column-method-timestamps) 方法的别名：

```php
$table->nullableTimestamps(precision: 0);
```

#### `nullableMorphs()`

此方法类似于 [morphs](#column-method-morphs) 方法；然而，创建的列将是“可为空”：

```php
$table->nullableMorphs('taggable');
```

#### `nullableUlidMorphs()`

此方法类似于 [ulidMorphs](#column-method-ulidMorphs) 方法；然而，创建的列将是“可为空”：

```php
$table->nullableUlidMorphs('taggable');
```

#### `nullableUuidMorphs()`

此方法类似于 [uuidMorphs](#column-method-uuidMorphs) 方法；然而，创建的列将是“可为空”：

```php
$table->nullableUuidMorphs('taggable');
```

#### `rememberToken()`

`rememberToken` 方法创建一个可为空的 `VARCHAR(100)` 等同列，用于存储当前的 "记住我" [认证令牌](/docs/11/security/authentication#remembering-users)：

```php
$table->rememberToken();
```

#### `set()`

`set` 方法创建一个 `SET` 等同列，并附有给定的有效值列表：

```php
$table->set('flavors', ['strawberry', 'vanilla']);
```

#### `smallIncrements`

`smallIncrements` 方法创建一个自增的 `UNSIGNED SMALLINT` 等效的列作为主键：

```php
$table->smallIncrements('id');
```

#### `smallInteger`

`smallInteger` 方法创建一个 `SMALLINT` 等效的列：

```php
$table->smallInteger('votes');
```

#### `softDeletesTz`

`softDeletesTz` 方法添加了一个可以为空的 `deleted_at` `TIMESTAMP`（带有时区）等效的列，可选的分数秒精度。此列旨在存储 Eloquent "软删除" 功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletesTz('deleted_at', precision: 0);
```

#### `softDeletes`

`softDeletes` 方法添加了一个可以为空的 `deleted_at` `TIMESTAMP` 等效的列，可选的分数秒精度。此列旨在存储 Eloquent "软删除" 功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletes('deleted_at', precision: 0);
```

#### `string`

`string` 方法创建了一个给定长度的 `VARCHAR` 等效的列：

```php
$table->string('name', length: 100);
```

#### `text`

`text` 方法创建了一个 `TEXT` 等效的列：

```php
$table->text('description');
```

在使用 MySQL 或 MariaDB 时，你可以将 `binary` 字符集应用于列，以创建一个 `BLOB` 等效的列：

```php
$table->text('data')->charset('binary'); // BLOB
```

#### `timeTz`

`timeTz` 方法创建了一个带有可选分数秒精度的 `TIME`（带有时区）等效的列：

```php
$table->timeTz('sunrise', precision: 0);
```

#### `time`

`time` 方法创建了一个带有可选分数秒精度的 `TIME` 等效的列：

```php
$table->time('sunrise', precision: 0);
```

#### `timestampTz`

`timestampTz` 方法创建了一个带有可选分数秒精度的 `TIMESTAMP`（带有时区）等效的列：

```php
$table->timestampTz('added_at', precision: 0);
```

#### `timestamp`

`timestamp` 方法创建了一个带有可选分数秒精度的 `TIMESTAMP` 等效的列：

```php
$table->timestamp('added_at', precision: 0);
```

#### `timestampsTz`

`timestampsTz` 方法创建了带有可选分数秒精度 `created_at` 和 `updated_at` `TIMESTAMP`（带有时区）等效的列：

```php
$table->timestampsTz(precision: 0);
```

#### `timestamps`

`timestamps` 方法创建了带有可选分数秒精度 `created_at` 和 `updated_at` `TIMESTAMP` 等效的列：

```php
$table->timestamps(precision: 0);
```

#### `tinyIncrements`

`tinyIncrements` 方法创建了一个自增的 `UNSIGNED TINYINT` 等效的列作为主键：

```php
$table->tinyIncrements('id');
```

#### `tinyInteger`

`tinyInteger` 方法创建了一个 `TINYINT` 等效的列：

```php
$table->tinyInteger('votes');
```

#### `tinyText`

`tinyText` 方法创建了一个 `TINYTEXT` 等效的列：

```php
$table->tinyText('notes');
```

在使用 MySQL 或 MariaDB 时，你可以将 `binary` 字符集应用于列，以创建一个 `TINYBLOB` 等效的列：

```php
$table->tinyText('data')->charset('binary'); // TINYBLOB
```

#### `unsignedBigInteger`

`unsignedBigInteger` 方法创建了一个 `UNSIGNED BIGINT` 等效的列：

```php
$table->unsignedBigInteger('votes');
```

#### `unsignedInteger`

`unsignedInteger` 方法创建了一个 `UNSIGNED INTEGER` 等效的列：

```php
$table->unsignedInteger('votes');
```

#### `unsignedMediumInteger`

`unsignedMediumInteger` 方法创建了一个 `UNSIGNED MEDIUMINT` 等效的列：

```php
$table->unsignedMediumInteger('votes');
```

#### `unsignedSmallInteger`

`unsignedSmallInteger` 方法创建了一个 `UNSIGNED SMALLINT` 等效的列：

```php
$table->unsignedSmallInteger('votes');
```

#### `unsignedTinyInteger`

`unsignedTinyInteger` 方法创建了一个 `UNSIGNED TINYINT` 等效的列：

```php
$table->unsignedTinyInteger('votes');
```

#### `ulidMorphs`

`ulidMorphs` 方法是一个便捷方法，添加一个 `{column}_id` `CHAR(26)` 等效列和一个 `{column}_type` `VARCHAR` 等效列。

此方法旨在定义使用 ULID 标识符的多态 [Eloquent 关系](/docs/11/eloquent/eloquent-relationships) 所需的列时使用。在以下示例中，将创建 `taggable_id` 和 `taggable_type` 列：

```php
$table->ulidMorphs('taggable');
```

#### `uuidMorphs`

`uuidMorphs` 方法是一个便捷方法，添加一个 `{column}_id` `CHAR(36)` 等效列和一个 `{column}_type` `VARCHAR` 等效列。

此方法旨在定义使用 UUID 标识符的多态 [Eloquent 关系](/docs/11/eloquent/eloquent-relationships) 所需的列时使用。在以下示例中，将创建 `taggable_id` 和 `taggable_type` 列：

```php
$table->uuidMorphs('taggable');
```

#### `ulid`

`ulid` 方法创建一个 `ULID` 等效列：

```php
$table->ulid('id');
```

#### `uuid`

`uuid` 方法创建一个 `UUID` 等效列：

```php
$table->uuid('id');
```

#### `year`

`year` 方法创建一个 `YEAR` 等效列：

```php
$table->year('birth_year');
```

### 列修饰符

除了上面列出的列类型之外，当给数据库表添加一个列时，还有几个你可以使用的列“修饰符”。例如，要使列可以“为空”，你可以使用 `nullable` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable();
});
```

以下表格包含所有可用的列修饰符。这个列表不包括 [索引修饰符](#创建索引)：

| 修饰符                              | 描述                                                           |
| ----------------------------------- | -------------------------------------------------------------- |
| `->after('column')`                 | 在另一列之后放置该列（仅限 MySQL）。                           |
| `->autoIncrement()`                 | 设置整数列为自动增长的（主键）。                               |
| `->charset('utf8mb4')`              | 为列指定字符集（仅限 MySQL）。                                 |
| `->collation('utf8mb4_unicode_ci')` | 为列指定排序规则。                                             |
| `->comment('my comment')`           | 向列添加注释（MySQL / PostgreSQL）。                           |
| `->default($value)`                 | 为列指定“默认”值。                                             |
| `->first()`                         | 将列置于表的“第一列”（仅限 MySQL）。                           |
| `->from($integer)`                  | 设置自动增长字段的起始值（MySQL / PostgreSQL）。               |
| `->invisible()`                     | 使列在 `SELECT *` 查询中“不可见”（仅限 MySQL）。               |
| `->nullable($value = true)`         | 允许插入 NULL 值到列中。                                       |
| `->storedAs($expression)`           | 创建一个存储生成的列（MySQL / PostgreSQL / SQLite）。          |
| `->unsigned()`                      | 设置整数列为 UNSIGNED（仅限 MySQL）。                          |
| `->useCurrent()`                    | 设置时间戳列使用 CURRENT_TIMESTAMP 作为默认值。                |
| `->useCurrentOnUpdate()`            | 设置记录更新时，时间戳列使用 CURRENT_TIMESTAMP（仅限 MySQL）。 |
| `->virtualAs($expression)`          | 创建一个虚拟生成的列（MySQL / SQLite）。                       |
| `->generatedAs($expression)`        | 使用指定的序列选项创建一个身份列（PostgreSQL）。               |
| `->always()`                        | 定义身份列的序列值优先于输入（PostgreSQL）。                   |

#### 默认表达式

`default` 修饰符接受一个值或一个 `Illuminate\Database\Query\Expression` 实例。使用 `Expression` 实例将防止 Laravel 用引号包裹该值并允许你使用数据库特定的函数。当你需要为 JSON 列分配默认值时，这是特别有用的情况：

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * 运行迁移。
     */
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->json('movies')->default(new Expression('(JSON_ARRAY())'));
            $table->timestamps();
        });
    }
};
```

> [!WARNING]：
> 默认表达式的支持取决于你的数据库驱动程序、数据库版本和字段类型。请参阅你的数据库文档。

#### 列顺序

在使用 MySQL 数据库时，可以使用 `after` 方法在模式中的现有列之后添加列：

```php
$table->after('password', function (Blueprint $table) {
    $table->string('address_line1');
    $table->string('address_line2');
    $table->string('city');
});
```

### 修改列

`change` 方法允许你修改现有列的类型和属性。例如，你可能希望增加 `string` 列的大小。要看到 `change` 方法的作用，让我们将 `name` 列的大小从 25 增加到 50。为此，我们只需定义列的新状态然后调用 `change` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->change();
});
```

修改列时，必须明确包括你想要保留的所有修饰符在列定义上 - 任何缺失的属性都将被丢弃。例如，要保留 `unsigned`、`default` 和 `comment` 属性，你必须在更改列时明确调用每个修饰符：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('my comment')->change();
});
```

`change` 方法不改变列的索引。因此，你可以使用索引修饰符在修改列时明确添加或删除索引：

```php
// 添加一个索引...
$table->bigIncrements('id')->primary()->change();

// 删除一个索引...
$table->char('postal_code', 10)->unique(false)->change();
```

### 重命名列

要重命名列，可以使用模式构建器提供的 `renameColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

### 删除列

要删除列，可以在模式构建器上使用 `dropColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
});
```

可以通过将列名数组传递给 `dropColumn` 方法，来从表中删除多个列：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn(['votes', 'avatar', 'location']);
});
```

#### 可用的命令别名

Laravel 提供了几个与删除常见类型列有关的方便方法。下表描述了每个方法：

| 命令                               | 描述                                         |
| ---------------------------------- | -------------------------------------------- |
| `$table->dropMorphs('morphable');` | 删除 `morphable_id` 和 `morphable_type` 列。 |
| `$table->dropRememberToken();`     | 删除 `remember_token` 列。                   |
| `$table->dropSoftDeletes();`       | 删除 `deleted_at` 列。                       |
| `$table->dropSoftDeletesTz();`     | `dropSoftDeletes()` 方法的别名。             |
| `$table->dropTimestamps();`        | 删除 `created_at` 和 `updated_at` 列。       |
| `$table->dropTimestampsTz();`      | `dropTimestamps()` 方法的别名。              |

## 索引

### 创建索引

Laravel 模式构建器支持几种索引类型。以下示例创建了一个新的 `email` 列，并指定其值应该是唯一的。要创建该索引，我们可以将 `unique` 方法链到列定义上：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->unique();
});
```

或者，你也可以在定义列之后创建索引。要做到这一点，你应该在模式构建器蓝图上调用 `unique` 方法。这个方法接受一个应该接收一个唯一索引的列的名称：

```php
$table->unique('email');
```

你甚至可以传递一个列数组到索引方法，以创建一个复合（或组合）索引：

```php
$table->index(['account_id', 'created_at']);
```

创建索引时，Laravel 会自动根据表名，列名和索引类型生成一个索引名称，但你可以传递第二个参数给方法，自己指定索引名称：

```php
$table->unique('email', 'unique_email');
```

#### 可用的索引类型

Laravel 的模式构建器蓝图类提供了创建 Laravel 支持的每种类型索引的方法。每种索引方法都接受一个可选的第二个参数以指定索引的名称。如果省略，将根据索引中使用的表和列的名称以及索引类型导出名称。下表描述了每种可用的索引方法：

| 命令                                             | 描述                                       |
| ------------------------------------------------ | ------------------------------------------ |
| `$table->primary('id');`                         | 添加一个主键。                             |
| `$table->primary(['id', 'parent_id']);`          | 添加复合主键。                             |
| `$table->unique('email');`                       | 添加一个唯一索引。                         |
| `$table->index('state');`                        | 添加一个基础索引。                         |
| `$table->fullText('body');`                      | 添加一个全文索引（MySQL / PostgreSQL）。   |
| `$table->fullText('body')->language('english');` | 添加一个指定语言的全文索引（PostgreSQL）。 |
| `$table->spatialIndex('location');`              | 添加一个空间索引（SQLite 除外）。          |

### 重命名索引

要重命名索引，可以使用模式构建器蓝图提供的 `renameIndex` 方法。此方法接受当前索引名称作为其第一个参数，所需名称作为其第二个参数：

```php
$table->renameIndex('from', 'to')
```

### 删除索引

要删除索引，必须指定索引的名称。默认情况下，Laravel 会自动根据表名、索引的列名和索引类型分配索引名称。这里有一些例子：

| 命令                                                     | 描述                                           |
| -------------------------------------------------------- | ---------------------------------------------- |
| `$table->dropPrimary('users_id_primary');`               | 从 "users" 表中删除一个主键。                  |
| `$table->dropUnique('users_email_unique');`              | 从 "users" 表中删除一个唯一索引。              |
| `$table->dropIndex('geo_state_index');`                  | 从 "geo" 表中删除一个基本索引。                |
| `$table->dropFullText('posts_body_fulltext');`           | 从 "posts" 表中删除一个全文索引。              |
| `$table->dropSpatialIndex('geo_location_spatialindex');` | 从 "geo" 表中删除一个空间索引（SQLite 除外）。 |

如果你传递一个列数组到删除索引的方法中，基于表名，列和索引类型的传统索引名称将被生成：

```php
Schema::table('geo', function (Blueprint $table) {
    $table->dropIndex(['state']); // 删除索引 'geo_state_index'
});
```

### 外键约束

Laravel 还支持创建外键约束，这些约束用于在数据库级别强制引用完整性。例如，让我们在 `posts` 表上定义一个 `user_id` 列，它引用 `users` 表上的 `id` 列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')->references('id')->on('users');
});
```

由于这种语法相当冗长，Laravel 提供了额外的，简洁的方法，这些方法使用约定来提供更好的开发者体验。当使用 `foreignId` 方法创建列时，上面的例子可以重写如下：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```

`foreignId` 方法创建了一个 `UNSIGNED BIGINT` 等效的列，而 `constrained` 方法将利用约定确定正在被引用的表和列。如果你的表名不符合 Laravel 的约定，你可以手动将其提供给 `constrained` 方法。此外，还可以指定生成的索引应该分配的名称：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained(
        table: 'users', indexName: 'posts_user_id'
    );
});
```

你还可以指定约束的 "on delete" 和 "on update" 属性的所需动作：

```php
$table->foreignId('user_id')
      ->constrained()
      ->onUpdate('cascade')
      ->onDelete('cascade');
```

也提供了这些动作的另一种表现形式方法：

| 方法                          | 描述                      |
| ----------------------------- | ------------------------- |
| `$table->cascadeOnUpdate();`  | 更新应级联。              |
| `$table->restrictOnUpdate();` | 更新应受限。              |
| `$table->noActionOnUpdate();` | 更新不执行任何动作。      |
| `$table->cascadeOnDelete();`  | 删除应级联。              |
| `$table->restrictOnDelete();` | 删除应受限。              |
| `$table->nullOnDelete();`     | 删除应将外键值设为 null。 |

在 `constrained` 方法之前必须调用任何其他 [列修饰符](#列修饰符)：

```php
$table->foreignId('user_id')
      ->nullable()
      ->constrained();
```

#### 切换外键约束

你可以通过使用以下方法在迁移中启用或禁用外键约束：

```php
Schema::enableForeignKeyConstraints();

Schema::disableForeignKeyConstraints();

Schema::withoutForeignKeyConstraints(function () {
    // 在此闭包内禁用约束...
});
```

> [!WARNING]  
> SQLite 默认禁用外键约束。使用 SQLite 时，请确保在尝试在迁移中创建它们之前，在数据库配置中[启用外键支持](/docs/11/database/database#configuration)。此外，SQLite 仅在创建表时支持外键，[修改表时不支持](https://www.sqlite.org/omitted.html)。

## 事件

为方便起见，每个迁移操作都会派发一个[事件](/docs/11/digging-deeper/events)。以下所有事件都扩展了基类 `Illuminate\Database\Events\MigrationEvent`:

| 类                                             | 描述                         |
| ---------------------------------------------- | ---------------------------- |
| `Illuminate\Database\Events\MigrationsStarted` | 一批迁移即将执行。           |
| `Illuminate\Database\Events\MigrationsEnded`   | 一批迁移已经完成执行。       |
| `Illuminate\Database\Events\MigrationStarted`  | 一个单独的迁移即将执行。     |
| `Illuminate\Database\Events\MigrationEnded`    | 一个单独的迁移已经完成执行。 |
| `Illuminate\Database\Events\SchemaDumped`      | 数据库模式转储已完成。       |
| `Illuminate\Database\Events\SchemaLoaded`      | 已加载现有数据库模式转储。   |
