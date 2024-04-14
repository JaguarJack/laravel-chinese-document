---
title: Laravel 数据填充
---

# 数据库：数据填充

[[toc]]

## 简介

Laravel 包含了使用填充类为数据库填充数据的能力。所有的填充类都存储在 `database/seeders` 目录中。默认情况下，为你定义了一个 `DatabaseSeeder` 类。在这个类中，你可以使用 `call` 方法来运行其他填充类，允许你控制填充顺序。

> [!NOTE]  
> 数据库填充期间会自动禁用[批量赋值保护](/docs/11/eloquent/eloquent#mass-assignment)。

## 编写填充器

要生成一个填充器，执行 `make:seeder` [Artisan 命令](/docs/11/digging-deeper/artisan)。框架生成的所有填充器都将被放置在 `database/seeders` 目录中：

```shell
php artisan make:seeder UserSeeder
```

默认情况下，一个填充类只包含一个方法：`run`。当执行 `db:seed` [Artisan 命令](/docs/11/digging-deeper/artisan) 时，会调用此方法。在 `run` 方法内部，你可以根据自己的意愿插入数据到数据库中。你可以使用 [查询构造器](/docs/11/database/queries) 手动插入数据，或者可以使用 [Eloquent 模型工厂](/docs/11/eloquent/eloquent-factories)。

作为一个例子，让我们修改默认的 `DatabaseSeeder` 类，并向 `run` 方法添加一个数据库插入语句：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * 运行数据库填充器。
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => Str::random(10),
            'email' => Str::random(10).'@example.com',
            'password' => Hash::make('password'),
        ]);
    }
}
```

> [!NOTE]  
> 你可以在 `run` 方法的签名中类型提示所需的任何依赖。它们会自动通过 Laravel [服务容器](/docs/11/architecture-concepts/container) 被解析。

### 使用模型工厂

当然，手动指定每个模型种子的属性是很麻烦的。相反，你可以使用 [模型工厂](/docs/11/eloquent/eloquent-factories) 来方便地生成大量数据库记录。首先，查看 [模型工厂文档](/docs/11/eloquent/eloquent-factories) 学习如何定义你的工厂。

例如，创建 50 个用户，每个用户有一个相关的帖子：

```php
use App\Models\User;

/**
 * 运行数据库填充器。
 */
public function run(): void
{
    User::factory()
            ->count(50)
            ->hasPosts(1)
            ->create();
}
```

### 调用额外的填充器

在 `DatabaseSeeder` 类内部，你可以使用 `call` 方法执行额外的填充类。使用 `call` 方法允许你将数据库填充分解为多个文件，以便没有单个填充类变得过大。`call` 方法接受一个应该被执行的填充类数组：

```php
/**
 * 运行数据库填充器。
 */
public function run(): void
{
    $this->call([
        UserSeeder::class,
        PostSeeder::class,
        CommentSeeder::class,
    ]);
}
```

### 静默模型事件

在运行填充时，你可能想阻止模型派发事件。你可以使用 `WithoutModelEvents` trait 来实现这一点。使用 `WithoutModelEvents` trait 可以确保即使通过 `call` 方法执行了额外的填充类，也不会派发任何模型事件：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * 运行数据库填充器。
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
        ]);
    }
}
```

## 运行填充器

你可以执行 `db:seed` Artisan 命令来填充你的数据库。默认情况下，`db:seed` 命令运行 `Database\Seeders\DatabaseSeeder` 类，该类可能会反过来调用其他填充类。然而，你可以使用 `--class` 选项来指定一个特定的填充类进行单独的运行：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你也可以结合使用 `migrate:fresh` 命令和 `--seed` 选项来填充你的数据库，该命令会删除所有表格并重新运行你所有的迁移。这个命令对整个重建数据库很有用。`--seeder` 选项可用于指定要运行的特定填充器：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder
```

#### 在生产环境中强制运行填充器

某些填充操作可能会导致你改变或丢失数据。为了保护你不在生产数据库上运行填充命令，你会在 `production` 环境中执行填充器之前被提示确认。为了在没有提示的情况下强制运行填充器，使用 `--force` 标志：

```shell
php artisan db:seed --force
```
