# Laravel Scount

[[toc]]

## 介绍

[Laravel Scout](https://github.com/laravel/scout) 提供了一种简单的、基于驱动的解决方案，用于为您的 [Eloquent 模型](/docs/11/eloquent/eloquent) 添加全文搜索功能。通过使用模型观察器，Scout 会自动将您的搜索索引与 Eloquent 记录同步。

目前，Scout 配备了 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com)、[Typesense](https://typesense.org) 和 MySQL / PostgreSQL (`database`) 驱动。此外，Scout 包括一个 "collection" 驱动，该驱动旨在本地开发使用，不需要任何外部依赖或第三方服务。此外，编写自定义驱动程序很简单，您可以使用自己的搜索实现来扩展 Scout。

## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 后，您应该使用 `vendor:publish` Artisan 命令发布 Scout 配置文件。此命令会将 `scout.php` 配置文件发布到您应用程序的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，将 `Laravel\Scout\Searchable` 特性添加到您希望可搜索的模型中。这个特性将注册一个模型观察器，它将自动将模型与您的搜索驱动程序同步：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;
}
```

### 队列

尽管不是使用 Scout 的严格要求，但在使用库之前，您应该认真考虑配置一个 [队列驱动](/docs/11/digging-deeper/queues)。运行队列工作进程将允许 Scout 将所有同步模型信息到搜索索引的操作排队，为您的应用程序的 Web 界面提供更好的响应时间。

配置队列驱动后，将您的 `config/scout.php` 配置文件中的 `queue` 选项值设置为 `true`：

```php
'queue' => true,
```

即使将 `queue` 选项设置为 `false`，也重要的是要记住一些 Scout 驱动程序，例如 Algolia 和 Meilisearch，始终异步索引记录。这意味着，即使索引操作已在您的 Laravel 应用程序中完成，搜索引擎本身可能不会立即反映新记录和更新的记录。

要指定 Scout 作业使用的连接和队列，您可以将 `queue` 配置选项定义为数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

当然，如果您自定义了 Scout 作业使用的连接和队列，则应运行队列工作进程来处理该连接和队列上的作业：

```shell
php artisan queue:work redis --queue=scout
```

## 驱动前提条件

### Algolia

使用 Algolia 驱动时，您应该在 `config/scout.php` 配置文件中配置 Algolia `id` 和 `secret` 凭据。配置好凭据后，您还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

### Meilisearch

[Meilisearch](https://www.meilisearch.com) 是一个快如闪电且开源的搜索引擎。如果您不确定如何在本地机器上安装 Meilisearch，您可以使用 [Laravel Sail](/docs/11/packages/sail#meilisearch)，这是 Laravel 官方支持的 Docker 开发环境。

使用 Meilisearch 驱动时，您需要通过 Composer 包管理器安装 Meilisearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在您应用程序的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及您的 Meilisearch `host` 和 `key` 凭据：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

有关 Meilisearch 的更多信息，请参阅 [Meilisearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，您应该确保通过查看 [Meilisearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)，安装与您的 Meilisearch 二进制版本兼容的 `meilisearch/meilisearch-php` 版本。

> [!WARNING]
> 当在使用 Meilisearch 的应用程序上升级 Scout 时，您应该始终 [查看 Meilisearch 服务本身的任何其他重大更改](https://github.com/meilisearch/Meilisearch/releases)。

### Typesense

[Typesense](https://typesense.org) 是一个闪电般快速的开源搜索引擎，支持关键词搜索、语义搜索、地理搜索和向量搜索。

您可以 [自托管 Typesense](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting) 或使用 [Typesense Cloud](https://cloud.typesense.org)。

要开始在 Scout 中使用 Typesense，通过 Composer 包管理器安装 Typesense PHP SDK：

```shell
composer require typesense/typesense-php
```

然后，在您应用程序的 .env 文件中设置 `SCOUT_DRIVER` 环境变量以及您的 Typesense 主机和 API 密钥凭据：

```shell
SCOUT_DRIVER=typesense
TYPESENSE_API_KEY=masterKey
TYPESENSE_HOST=localhost
```

如果需要，您还可以指定安装的端口、路径和协议：

```shell
TYPESENSE_PORT=8108
TYPESENSE_PATH=
TYPESENSE_PROTOCOL=http
```

有关 Typesense 集合的其他设置和模式定义可以在您应用程序的 `config/scout.php` 配置文件中找到。有关 Typesense 的更多信息，请参阅 [Typesense 文档](https://typesense.org/docs/guide/#quick-start)。

#### 准备存储在 Typesense 中的数据

使用 Typesense 时，您的可搜索模型必须定义一个 `toSearchableArray` 方法，该方法将模型的主键转换为字符串，将创建日期转换为 UNIX 时间戳：

```php
/**
 * 获取模型的索引化数据数组。
 *
 * @return array<string, mixed>
 */
public function toSearchableArray()
{
    return array_merge($this->toArray(),[
        'id' => (string) $this->id,
        'created_at' => $this->created_at->timestamp,
    ]);
}
```

您还应该在应用程序的 `config/scout.php` 文件中定义 Typesense 集合架构。集合架构描述了通过 Typesense 可搜索的每个字段的数据类型。有关所有可用架构选项的更多信息，请参阅 [Typesense 文档](https://typesense.org/docs/latest/api/collections.html#schema-parameters)。

如果您需要在定义 Typesense 集合架构后更改它，您可以运行 `scout:flush` 和 `scout:import`，这将删除所有现有的索引数据并重新创建架构。或者，您可以使用 Typesense 的 API 修改集合架构，而不移除任何索引数据。

如果您的可搜索模型是软删除的，并且包含在 `index-settings` 数组中，Scout 将自动在该索引上包含对软删除模型的筛选支持。如果您对软删除模型索引没有其他可筛选或可排序属性要定义，您可以简单地为该模型添加一个空条目到 `index-settings` 数组中：

```php
'index-settings' => [
    Flight::class => []
],
```

配置应用程序的索引设置后，您必须调用 `scout:sync-index-settings` Artisan 命令。此命令将通知 Meilisearch 您目前已配置的索引设置。为方便起见，您可能希望将此命令作为您的部署过程的一部分：

```shell
php artisan scout:sync-index-settings
```

## 配置

### 配置模型索引

每个 Eloquent 模型都与一个特定的搜索 "索引" 同步，该索引包含该模型的所有可搜索记录。换句话说，您可以将每个索引视为一个 MySQL 表。默认情况下，每个模型都会被保留到与模型的典型 "表" 名称相匹配的索引中。通常，这是模型名称的复数形式；然而，您可以通过重写模型上的 `searchableAs` 方法来自定义模型的索引：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取与模型关联的索引名称。
     */
    public function searchableAs(): string
    {
        return 'posts_index';
    }
}
```

### 配置可搜索数据

默认情况下，模型的整个 `toArray` 形式将被持久化到其搜索索引中。如果您希望自定义同步到搜索索引的数据，您可以重写模型上的 `toSearchableArray` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取模型的索引化数据数组。
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $array = $this->toArray();

        // 自定义数据数组...

        return $array;
    }
}
```

一些搜索引擎如 Meilisearch 只会在数据类型正确的情况下进行过滤操作(`>`、`<` 等)。因此，当使用这些搜索引擎并自定义可搜索数据时，您应确保数字值被转换为其正确的类型：

```php
public function toSearchableArray()
{
    return [
        'id' => (int) $this->id,
        'name' => $this->name,
        'price' => (float) $this->price,
    ];
}
```

#### 配置过滤数据和索引设置 (Meilisearch)

与 Scout 的其他驱动程序不同，Meilisearch 要求您预先定义索引搜索设置，如可过滤属性、可排序属性和 [其他支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可过滤属性是当调用 Scout 的 `where` 方法时计划过滤的任何属性，而可排序属性是当调用 Scout 的 `orderBy` 方法时计划排序的任何属性。要定义您的索引设置，请在您应用程序的 `scout` 配置文件中调整 `index-settings` 部分下的 `meilisearch` 配置条目：

```php
use App\Models\User;
use App\Models\Flight;

'meilisearch' => [
    'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),
    'key' => env('MEILISEARCH_KEY', null),
    'index-settings' => [
        User::class => [
            'filterableAttributes'=> ['id', 'name', 'email'],
            'sortableAttributes' => ['created_at'],
            // 其他设置字段...
        ],
        Flight::class => [
            'filterableAttributes'=> ['id', 'destination'],
            'sortableAttributes' => ['updated_at'],
        ],
    ],
],
```

如果给定索引的模型能够进行软删除，并且在 `index-settings` 数组中，则 Scout 将自动支持在该索引上对软删除模型进行过滤。如果您对软删除模型索引没有其他可过滤或可排序属性要定义，您可以简单地为该模型添加一个空条目到 `index-settings` 数组中：

```php
'index-settings' => [
    Flight::class => []
],
```

### 配置模型 ID

默认情况下，Scout 将使用模型的主键作为存储在搜索索引中的模型的唯一 ID/键。如果您需要定制这种行为，您可以重写模型上的 `getScoutKey` 和 `getScoutKeyName` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引模型的值。
     */
    public function getScoutKey(): mixed
    {
        return $this->email;
    }

    /**
     * 获取用于索引模型的键名称。
     */
    public function getScoutKeyName(): mixed
    {
        return 'email';
    }
}
```

### 配置每个模型的搜索引擎

在搜索时，Scout 通常会使用应用程序的 `scout` 配置文件中指定的默认搜索引擎。然而，可以通过覆盖模型上的 `searchableUsing` 方法来更改特定模型的搜索引擎：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Engines\Engine;
use Laravel\Scout\EngineManager;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引模型的引擎。
     */
    public function searchableUsing(): Engine
    {
        return app(EngineManager::class)->engine('meilisearch');
    }
}
```

### 识别用户

Scout 还允许您在使用 [Algolia](https://algolia.com) 时自动识别用户。在 Algolia 的仪表盘中查看您的搜索分析时，将认证用户与搜索操作相关联可能很有帮助。您可以通过在应用程序的 `.env` 文件中定义 `SCOUT_IDENTIFY` 环境变量为 `true` 来启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用此功能还会将请求的 IP 地址和您的认证用户的主要标识符传递给 Algolia，以便将此数据与用户发出的任何搜索请求相关联。

## 数据库/集合引擎

### 数据库引擎

> [!WARNING]  
> 数据库引擎目前支持 MySQL 和 PostgreSQL。

如果您的应用程序与小到中等规模的数据库互动，或者有较轻的工作负载，您可能会发现使用 Scout 的 "database" 引擎更方便。数据库引擎将使用 "where like" 子句和全文索引，在您现有数据库中筛选结果，以确定您查询的适用搜索结果。

要使用数据库引擎，您可以简单地将 `SCOUT_DRIVER` 环境变量的值设置为 `database`，或者在您的应用程序的 `scout` 配置文件中直接指定 `database` 驱动程序：

```ini
SCOUT_DRIVER=database
```

指定数据库引擎为首选驱动程序后，您必须 [配置您的可搜索数据](#configuring-searchable-data)。然后，您可以开始 [执行对模型的搜索查询](#searching)。使用数据库引擎时，不需要像 Algolia、Meilisearch 或 Typesense 索引那样的搜索引擎索引。

#### 自定义数据库搜索策略

默认情况下，数据库引擎将针对您 [配置为可搜索的](#configuring-searchable-data) 每个模型属性执行 "where like" 查询。然而，在某些情况下，这可能导致性能不佳。因此，可以配置数据库引擎的搜索策略，以便某些指定的列使用全文搜索查询，或者仅使用 "where like" 约束来搜索字符串的前缀 (`example%`) 而不是搜索整个字符串 (`%example%`)。

要定义此行为，您可以将 PHP 属性分配给模型的 `toSearchableArray` 方法。未分配额外搜索策略行为的任何列将继续使用默认的 "where like" 策略：

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;

/**
 * 获取模型的索引化数据数组。
 *
 * @return array<string, mixed>
 */
#[SearchUsingPrefix(['id', 'email'])]
#[SearchUsingFullText(['bio'])]
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->bio,
    ];
}
```

> [!WARNING]  
> 在指定列应使用全文查询约束之前，请确保列已被分配一个 [全文索引](/docs/11/database/migrations#available-index-types)。

### 集合引擎

尽管您可以在本地开发中自由使用 Algolia、Meilisearch 或 Typesense 搜索引擎，但您可能会发现使用 "collection" 引擎开始更方便。集合引擎将使用 "where" 子句和集合过滤在您现有数据库中的结果来确定适用于您查询的搜索结果。使用此引擎时，不需要 "索引" 您的可搜索模型，因为它们将简单地从您的本地数据库中检索。

要使用集合引擎，您可以简单地将 `SCOUT_DRIVER` 环境变量的值设置为 `collection`，或者在应用程序的 `scout` 配置文件中直接指定 `collection` 驱动程序：

```ini
SCOUT_DRIVER=collection
```

指定集合驱动程序为首选驱动程序后，您可以开始 [执行对模型的搜索查询](#searching)。使用集合引擎时，不需要 Algolia、Meilisearch 或 Typesense 索引等搜索引擎索引。

#### 与数据库引擎的区别

乍一看，"数据库" 和 "集合" 引擎非常相似。它们都直接与您的数据库交互以检索搜索结果。然而，集合引擎不使用全文索引或者 `LIKE` 子句来查找匹配记录。相反，它会拉取所有可能的记录，并使用 Laravel 的 `Str::is` 帮助器确定搜索字符串是否存在于模型属性值中。

集合引擎是最方便的搜索引擎，因为它适用于 Laravel 支持的所有关系型数据库（包括 SQLite 和 SQL Server）；然而，它比 Scout 的数据库引擎效率低。

## 索引

### 批量导入

如果您将 Scout 安装到现有项目中，您可能已经有需要导入索引的数据库记录。Scout 提供了一个 `scout:import` Artisan 命令，您可以使用它将您所有现有的记录导入到搜索索引中：

```shell
php artisan scout:import "App\Models\Post"
```

`flush` 命令可用于将模型的所有记录从搜索索引中删除：

```shell
php artisan scout:flush "App\Models\Post"
```

#### 修改导入查询

如果您希望修改用于检索所有模型以进行批量导入的查询，则可以在模型上定义一个 `makeAllSearchableUsing` 方法。这是在导入模型之前添加必要的任何关系预加载的好地方：

```php
use Illuminate\Database\Eloquent\Builder;

/**
 * 修改检索模型时使所有模型可搜索的查询。
 */
protected function makeAllSearchableUsing(Builder $query): Builder
{
    return $query->with('author');
}
```

> [!WARNING]  
> 当使用队列进行批量导入模型时，`makeAllSearchableUsing` 方法可能不适用。在作业处理模型集合时，关系 [不会被恢复](/docs/11/digging-deeper/queues#handling-relationships)。

### 添加记录

为模型添加了 `Laravel\Scout\Searchable` 特性后，您所需要做的就是 `save` 或 `create` 一个模型实例，它就会自动被添加到您的搜索索引中。如果您已配置 Scout [使用队列](#queueing)，这项操作将由您的队列工作进程在后台执行：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

#### 通过查询添加记录

如果您希望通过 Eloquent 查询将一系列模型添加到搜索索引中，您可以在 Eloquent 查询上链接 `searchable` 方法。`searchable` 方法将 [分块查询的结果](/docs/11/eloquent/eloquent#chunking-results)，并将记录添加到您的搜索索引中。再次，如果您已配置 Scout 使用队列，所有的块将由您的队列工作进程在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

您也可以在 Eloquent 关系实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果您已经在内存中有一个 Eloquent 模型的集合，您可以在集合实例上调用 `searchable` 方法将模型实例添加到它们相应的索引中：

```php
$orders->searchable();
```

> [!NOTE]  
> `searchable` 方法可以被视为 "upsert" 操作。换言之，如果模型记录已经在索引中，则将被更新。如果它不在搜索索引中，它将被添加到索引中。

### 更新记录

要更新可搜索的模型，您只需要更新模型实例的属性并将模型 `save` 到数据库。Scout 将自动将更改持久化到您的搜索索引中：

```php
use App\Models\Order;

$order = Order::find(1);

// 更新订单...

$order->save();
```

您也可以在 Eloquent 查询实例上调用 `searchable` 方法来更新一系列模型。如果模型不存在于您的搜索索引中，则将被创建：

```php
Order::where('price', '>', 100)->searchable();
```

如果您希望更新关系中所有模型的搜索索引记录，您可以在关系实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果您已经在内存中有一系列 Eloquent 模型，则可以在集合实例上调用 `searchable` 方法更新索引中的模型实例：

```php
$orders->searchable();
```

#### 导入记录前的修改

有时，您可能需要在使模型可搜索之前准备模型集合。例如，您可能需要急切加载关系，以便可以有效地将关系数据添加到您的搜索索引中。为此，请在相应的模型上定义一个 `makeSearchableUsing` 方法：

```php
use Illuminate\Database\Eloquent\Collection;

/**
 * 修改正被设置为可搜索的模型集合。
 */
public function makeSearchableUsing(Collection $models): Collection
{
    return $models->load('author');
}
```

### 移除记录

要从索引中移除一条记录，您只需从数据库中 `delete` 该模型。即使您使用的是 [软删除](/docs/11/eloquent/eloquent#soft-deleting) 模型，这也是可以的：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果您不想在删除记录之前检索模型，您可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果您想移除关系中所有模型的搜索索引记录，您可以在关系实例上调用 `unsearchable` 方法：

```php
$user->orders()->unsearchable();
```

或者，如果您已经在内存中有一系列 Eloquent 模型，则可以在集合实例上调用 `unsearchable` 方法将模型实例从其相应的索引中删除：

```php
$orders->unsearchable();
```

### 暂停索引

有时您可能需要对模型执行一系列 Eloquent 操作，而不同步模型数据到搜索索引中。您可以使用 `withoutSyncingToSearch` 方法来做到这一点。此方法接受一个闭包作为参数，该闭包将立即执行。闭包中发生的任何模型操作都不会同步到模型的索引中：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // 执行模型操作...
});
```

### 条件可搜索的模型实例

有时，您可能需要在某些条件下才使模型可搜索。例如，假设您有一个 `App\Models\Post` 模型，它可能处于两种状态之一：草稿和已发布。您可能只希望允许 "已发布" 的帖子可被搜索。为此，您可以在模型上定义一个 `shouldBeSearchable` 方法：

```php
/**
 * 确定模型是否应可搜索。
 */
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法仅当通过 `save` 和 `create` 方法、查询或关系操作模型时应用。直接使用 `searchable` 方法使模型或集合可搜索将覆盖 `shouldBeSearchable` 方法的结果。

> [!WARNING]  
> 当使用 Scout 的 "database" 引擎时，`shouldBeSearchable` 方法不适用，因为所有可搜索的数据始终存储在数据库中。如果您使用数据库引擎时想要实现类似的行为，您应该使用 [where 子句](#where-clauses)。

## 搜索

您可以使用 `search` 方法开始搜索模型。`search` 方法接受一个字符串，将用于搜索您的模型。然后应该链式调用 `get` 方法来检索与给定搜索查询匹配的 Eloquent 模型：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->get();
```

由于 Scout 搜索返回一系列 Eloquent 模型的集合，因此您甚至可以直接从路由或控制器返回结果，并且它们将自动转换为 JSON：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/search', function (Request $request) {
    return Order::search($request->search)->get();
});
```

如果您想在转换成 Eloquent 模型之前获取原始的搜索结果，您可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

#### 自定义索引

搜索查询通常会在模型的 [`searchableAs`](#configuring-model-indexes) 方法指定的索引上执行。然而，您可以使用 `within` 方法指定应该搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

### Where 子句

Scout 允许您在搜索查询中添加简单的 "where" 子句。目前，这些子句只支持基本的数字相等性检查，并且主要用于根据所有者 ID 限定搜索查询的范围：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

此外，`whereIn` 方法可用于验证给定列的值是否包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereIn(
    'status', ['open', 'paid']
)->get();
```

`whereNotIn` 方法验证给定列的值是否不包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereNotIn(
    'status', ['closed']
)->get();
```

由于搜索索引不是关系型数据库，更高级的 "where" 子句目前还不支持。

> [!WARNING]  
> 如果您的应用程序使用的是 Meilisearch，您必须在使用 Scout 的 "where" 子句之前配置应用程序的 [可过滤属性](#configuring-filterable-data-for-meilisearch)。

### 分页

除了检索一系列模型外，您还可以使用 `paginate` 方法对搜索结果进行分页。这个方法会返回一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，就像您 [对传统的 Eloquent 查询进行分页](/docs/11/database/pagination) 一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

您可以通过将每页要检索的模型数量作为第一个参数传递给 `paginate` 方法来指定：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

检索到结果后，您可以使用 [Blade](/docs/11/basics/blade) 显示结果和渲染页面链接，就像您对传统的 Eloquent 查询进行分页一样：

```html
<div class="container">@foreach ($orders as $order) {{ $order->price }} @endforeach</div>

{{ $orders->links() }}
```

当然，如果您想以 JSON 格式检索分页结果，您可以直接从路由或控制器返回 paginator 实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> [!WARNING]  
> 由于搜索引擎不了解您的 Eloquent 模型的全局作用域定义，您在使用 Scout 分页的应用程序中不应使用全局作用域。或者，您应在通过 Scout 搜索时重新创建全局作用域的约束。

### 软删除

如果您的索引模型是 [软删除](/docs/11/eloquent/eloquent#soft-deleting)，并且您需要搜索您的软删除模型，请将 `config/scout.php` 配置文件的 `soft_delete` 选项设置为 `true`：

```php
'soft_delete' => true,
```

当此配置选项为 `true` 时，Scout 不会从搜索索引中移除软删除的模型。相反，它会在索引记录上设置一个隐藏的 `__soft_deleted` 属性。然后，您可以使用 `withTrashed` 或 `onlyTrashed` 方法在搜索时检索软删除的记录：

```php
use App\Models\Order;

// 包含已删记录在内时检索结果...
$orders = Order::search('Star Trek')->withTrashed()->get();

// 仅包含已删记录在内时检索结果...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> [!NOTE]  
> 当使用 `forceDelete` 将软删除的模型永久删除时，Scout 将自动将其从搜索索引中移除。

### 自定义引擎搜索

如果您需要对引擎的搜索行为进行高级自定义，您可以将一个闭包作为 `search` 方法的第二个参数。例如，您可以使用这个回调在搜索查询传递给 Algolia 之前添加地理定位数据到您的搜索选项：

```php
use Algolia\AlgoliaSearch\SearchIndex;
use App\Models\Order;

Order::search(
    'Star Trek',
    function (SearchIndex $algolia, string $query, array $options) {
        $options['body']['query']['bool']['filter']['geo_distance'] = [
            'distance' => '1000km',
            'location' => ['lat' => 36, 'lon' => 111],
        ];

        return $algolia->search($query, $options);
    }
)->get();
```

#### 自定义 Eloquent 结果查询

在 Scout 从应用程序的搜索引擎检索到匹配的 Eloquent 模型列表之后，Eloquent 用于通过它们的主键检索所有匹配的模型。您可以通过调用 `query` 方法来自定义此查询。`query` 方法接受一个闭包，该闭包将接收 Eloquent 查询构建器实例作为参数：

```php
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

$orders = Order::search('Star Trek')
    ->query(fn (Builder $query) => $query->with('invoices'))
    ->get();
```

由于此回调在您的应用程序的搜索引擎已检索到相关模型后被调用，`query` 方法不应用于“过滤”结果。相反，您应该使用 Scout 的 where 子句。

## 自定义引擎

#### 编写引擎

如果内置的 Scout 搜索引擎不符合您的需求，您可以编写自己的自定义引擎并将其注册到 Scout。您的引擎应该继承 `Laravel\Scout\Engines\Engine` 抽象类。这个抽象类包含了您的自定义引擎必须实现的八个方法：

```php
use Laravel\Scout\Builder;

abstract public function update($models);
abstract public function delete($models);
abstract public function search(Builder $builder);
abstract public function paginate(Builder $builder, $perPage, $page);
abstract public function mapIds($results);
abstract public function map(Builder $builder, $results, $model);
abstract public function getTotalCount($results);
abstract public function flush($model);
```

查看 `Laravel\Scout\Engines\AlgoliaEngine` 类上这些方法的实现可能会很有帮助。这个类将为您提供学习如何在自己的引擎中实现每个这些方法的良好起点。

#### 注册引擎

编写完自定义引擎后，您可以使用 Scout 引擎管理器的 `extend` 方法将其注册到 Scout。可以从 Laravel 服务容器中解析 Scout 的引擎管理器。您应该在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中或您的应用程序使用的任何其他服务提供者中调用 `extend` 方法：

```php
use App\ScoutExtensions\MySqlSearchEngine;
use Laravel\Scout\EngineManager;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    resolve(EngineManager::class)->extend('mysql', function () {
        return new MySqlSearchEngine;
    });
}
```

注册引擎后，您可以在应用程序的 `config/scout.php` 配置文件中将其指定为默认的 Scout `driver`：

```php
'driver' => 'mysql',
```
