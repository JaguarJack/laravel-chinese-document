---
title: Laravel 数据库测试
---

# 数据库测试

[[toc]]

## 简介

Laravel 提供了各种有用的工具和断言，使测试您的数据库驱动的应用程序变得更加容易。此外，Laravel 模型工厂和 seeders 能够无痛地使用您的应用程序的 Eloquent 模型和关系来创建测试数据库记录。我们将在以下文档中讨论所有这些强大的功能。

### 每个测试后重置数据库

在进一步讨论之前，让我们先讨论如何在每个测试结束后重置数据库，以便前一个测试的数据不会干扰后续测试。Laravel 自带的 `Illuminate\Foundation\Testing\RefreshDatabase` 特性将为您处理这一切。只需在您的测试类中使用这个特性：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('基本示例', function () {
    $response = $this->get('/');

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 一个基本的功能测试示例。
     */
    public function test_basic_example(): void
    {
        $response = $this->get('/');

        // ...
    }
}
```

`Illuminate\Foundation\Testing\RefreshDatabase` 特性不会迁移您的数据库，如果您的架构是最新的。它只会在数据库事务中执行测试。因此，那些不使用这个特性的测试用例添加到数据库中的任何记录可能仍然存在数据库中。

如果您希望完全重置数据库，您可以改用 `Illuminate\Foundation\Testing\DatabaseMigrations` 或 `Illuminate\Foundation\Testing\DatabaseTruncation` 特性。然而，这两个选项的速度都比 `RefreshDatabase` 特性慢得多。

## 模型工厂

在测试时，您可能需要在执行测试之前插入一些记录到您的数据库中。Laravel 允许您为每个 [Eloquent 模型](/docs/11/eloquent/eloquent) 使用 [模型工厂](/docs/11/eloquent/eloquent-factories) 定义一组默认属性，而不是在创建测试数据时手动指定每列的值。

要了解更多关于创建和使用模型工厂来创建模型的信息，请查阅完整的 [模型工厂文档](/docs/11/eloquent/eloquent-factories)。一旦您定义了模型工厂，您就可以在测试中使用工厂来创建模型：

```php tab=Pest
use App\Models\User;

test('模型可以被实例化', function () {
    $user = User::factory()->create();

    // ...
});
```

```php tab=PHPUnit
use App\Models\User;

public function test_models_can_be_instantiated(): void
{
    $user = User::factory()->create();

    // ...
}
```

## 运行 Seeders

如果您希望在功能测试期间使用 [数据库 seeders](/docs/11/database/seeding) 填充数据库，您可以调用 `seed` 方法。默认情况下，`seed` 方法将执行 `DatabaseSeeder`，后者应执行所有其他 seeders。或者，您可以将特定的 seeder 类名称传递给 `seed` 方法：

```php tab=Pest
<?php

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('订单可以创建', function () {
    // 运行 DatabaseSeeder...
    $this->seed();

    // 运行一个特定的 seeder...
    $this->seed(OrderStatusSeeder::class);

    // ...

    // 运行一系列特定的 seeders...
    $this->seed([
        OrderStatusSeeder::class,
        TransactionStatusSeeder::class,
        // ...
    ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 测试创建一个新订单。
     */
    public function test_orders_can_be_created(): void
    {
        // 运行 DatabaseSeeder...
        $this->seed();

        // 运行一个特定的 seeder...
        $this->seed(OrderStatusSeeder::class);

        // ...

        // 运行一系列特定的 seeders...
        $this->seed([
            OrderStatusSeeder::class,
            TransactionStatusSeeder::class,
            // ...
        ]);
    }
}
```

另外，您可以指示 Laravel 自动在每个使用 `RefreshDatabase` 特性的测试之前种子化数据库。您可以通过在您的基础测试类上定义一个 `$seed` 属性来完成这一点：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * 表示是否应该在每个测试之前运行默认的 seeder。
     *
     * @var bool
     */
    protected $seed = true;
}
```

当 `$seed` 属性是 `true` 时，测试将在每个使用 `RefreshDatabase` 特性的测试之前运行 `Database\Seeders\DatabaseSeeder` 类。然而，您可以通过在测试类上定义一个 `$seeder` 属性来指定应该执行的特定 seeder：

```php
use Database\Seeders\OrderStatusSeeder;

/**
 * 在每个测试之前运行特定的 seeder。
 *
 * @var string
 */
protected $seeder = OrderStatusSeeder::class;
```

## 可用的断言

Laravel 为您的 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de) 功能测试提供了几个数据库断言。我们将在下面讨论这些断言中的每一个。

#### assertDatabaseCount

断言数据库中的表包含给定数量的记录：

```php
$this->assertDatabaseCount('users', 5);
```

#### assertDatabaseHas

断言数据库中的表包含匹配给定键/值查询约束的记录：

```php
$this->assertDatabaseHas('users', [
    'email' => 'sally@example.com',
]);
```

#### assertDatabaseMissing

断言数据库中的表不包含匹配给定键/值查询约束的记录：

```php
$this->assertDatabaseMissing('users', [
    'email' => 'sally@example.com',
]);
```

#### assertSoftDeleted

`assertSoftDeleted` 方法可用于断言给定的 Eloquent 模型已经被 "软删除"：

```php
$this->assertSoftDeleted($user);
```

#### assertNotSoftDeleted

`assertNotSoftDeleted` 方法可用于断言给定的 Eloquent 模型没有被 "软删除"：

```php
$this->assertNotSoftDeleted($user);
```

#### assertModelExists

断言给定模型在数据库中存在：

```php
use App\Models\User;

$user = User::factory()->create();

$this->assertModelExists($user);
```

#### assertModelMissing

断言给定模型在数据库中不存在：

```php
use App\Models\User;

$user = User::factory()->create();

$user->delete();

$this->assertModelMissing($user);
```

#### expectsDatabaseQueryCount

`expectsDatabaseQueryCount` 方法可以在测试开始时调用，以指定您期望在测试期间运行的数据库查询的总数。如果实际执行的查询数量与这个预期不完全匹配，测试将失败：

```php
$this->expectsDatabaseQueryCount(5);

// 测试...
```
