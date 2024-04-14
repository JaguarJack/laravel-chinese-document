---
title: Laravel Eloquent 工厂
---

# Eloquent：工厂

[[toc]]

## 介绍

在测试应用或填充数据库时，你可能需要在数据库中插入一些记录。不需要手动指定每列的值，Laravel 允许你使用模型工厂为每个 [Eloquent 模型](/docs/11/eloquent/eloquent) 定义一组默认属性。

如果想看一个如何编写工厂的例子，请查看你应用中的 `database/factories/UserFactory.php` 文件。这个工厂被包含在所有新的 Laravel 应用中，包含以下工厂定义：

```php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

如你所见，工厂在最基础的形式上是扩展 Laravel 基础工厂类的类，并定义了一个 `definition` 方法。`definition` 方法返回创建模型时应用的默认属性值集。

通过 `fake` 帮助函数，工厂可以访问 [Faker](https://github.com/FakerPHP/Faker) PHP 库，这使你能够为测试和数据填充方便地生成各种类型的随机数据。

> [!Note]  
> 你可以通过更新 `config/app.php` 配置文件中的 `faker_locale` 选项来更改应用的 Faker 语言环境。

## 定义模型工厂

### 生成工厂

要创建工厂，请执行 `make:factory` [Artisan 命令](/docs/11/digging-deeper/artisan)：

```shell
php artisan make:factory PostFactory
```

新的工厂类将被放置在你的 `database/factories` 目录中。

#### 模型和工厂发现规约

一旦你定义了工厂，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 提供模型的静态 `factory` 方法来实例化该模型的工厂实例。`HasFactory` trait 的 `factory` 方法将使用规约来确定该 trait 分配到的模型的适当工厂。特别是，该方法将在 `Database\Factories` 命名空间中寻找一个类名与模型名匹配并以 `Factory` 为后缀的工厂。如果这些规约不适用于你的特定应用或工厂，你可以覆写你的模型上的 `newFactory` 方法直接返回模型对应工厂的实例：

```php
use Illuminate\Database\Eloquent\Factories\Factory;
use Database\Factories\Administration\FlightFactory;

/**
 * Create a new factory instance for the model.
 */
protected static function newFactory(): Factory
{
    return FlightFactory::new();
}
```

然后，在相应的工厂上定义一个 `model` 属性：

```php
use App\Administration\Flight;
use Illuminate\Database\Eloquent\Factories\Factory;

class FlightFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Flight::class;
}
```

### 工厂状态

状态操作方法允许你定义可以以任何组合应用到模型工厂的明确修改。例如，你的 `Database\Factories\UserFactory` 工厂可能包含一个修改默认属性值的 `suspended` 状态方法。

状态转换方法通常调用 Laravel 的基础工厂类提供的 `state` 方法。`state` 方法接受一个闭包，该闭包将接收为工厂定义的原始属性数组，并应返回一个修改的属性数组：

```php
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Indicate that the user is suspended.
 */
public function suspended(): Factory
{
    return $this->state(function (array $attributes) {
        return [
            'account_status' => 'suspended',
        ];
    });
}
```

#### "Trashed" 状态

如果你的 Eloquent 模型可以[软删除](/docs/11/eloquent/eloquent#soft-deleting)，你可以调用内置的 `trashed` 状态方法来指示创建的模型应该已经是"软删除"状态。你不需要手动定义 `trashed` 状态，因为它已自动可用于所有工厂：

```php
use App\Models\User;

$user = User::factory()->trashed()->create();
```

### 工厂回调

工厂回调通过 `afterMaking` 和 `afterCreating` 方法注册，并允许你在创建或制作模型后执行额外任务。你应该通过在工厂类上定义一个 `configure` 方法来注册这些回调。当工厂实例化时，Laravel 将自动调用此方法：

```php
namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            // ...
        })->afterCreating(function (User $user) {
            // ...
        });
    }

    // ...
}
```

你还可以在状态方法中注册工厂回调来执行特定于给定状态的额外任务：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Indicate that the user is suspended.
 */
public function suspended(): Factory
{
    return $this->state(function (array $attributes) {
        return [
            'account_status' => 'suspended',
        ];
    })->afterMaking(function (User $user) {
        // ...
    })->afterCreating(function (User $user) {
        // ...
    });
}
```

## 使用工厂创建模型

### 实例化模型

定义好工厂后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 提供给模型的静态 `factory` 方法来实例化该模型的工厂实例。让我们来看一些创建模型的示例。首先，我们将使用 `make` 方法创建模型而不将它们持久化到数据库：

```php
use App\Models\User;

$user = User::factory()->make();
```

你可以使用 `count` 方法创建多个模型的集合：

```php
$users = User::factory()->count(3)->make();
```

#### 应用状态

你还可以应用你的任何[状态](#factory-states)到模型上。如果你想将多个状态转换应用到模型上，你可以直接调用状态转换方法：

```php
$users = User::factory()->count(5)->suspended()->make();
```

#### 覆盖属性

如果你希望覆盖模型的一些默认值，你可以将一个值数组传递给 `make` 方法。只有指定的属性会被替换，而其余的属性保持设置为工厂指定的默认值：

```php
$user = User::factory()->make([
    'name' => 'Abigail Otwell',
]);
```

或者，`state` 方法可以直接在工厂实例上调用来进行内联状态转换：

```php
$user = User::factory()->state([
    'name' => 'Abigail Otwell',
])->make();
```

> [!Note]  
> 使用工厂创建模型时，[批量赋值保护](/docs/11/eloquent/eloquent#mass-assignment)会被自动禁用。

### 持久化模型

`create` 方法实例化模型实例并使用 Eloquent 的 `save` 方法将它们持久化到数据库：

```php
use App\Models\User;

// 创建一个 App\Models\User 实例...
$user = User::factory()->create();

// 创建三个 App\Models\User 实例...
$users = User::factory()->count(3)->create();
```

你可以通过向 `create` 方法传递属性数组来覆盖工厂的默认模型属性：

```php
$user = User::factory()->create([
    'name' => 'Abigail',
]);
```

### 序列

有时你可能希望为创建的每个模型交替更改某个模型属性的值。你可以通过定义状态转换序列来实现这一点。例如，你可能希望在为每个创建的用户交替 `admin` 列的值在 `Y` 和 `N` 之间：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
                ->count(10)
                ->state(new Sequence(
                    ['admin' => 'Y'],
                    ['admin' => 'N'],
                ))
                ->create();
```

在这个例子中，5 个用户将被创建，`admin` 值为 `Y`，另外 5 个用户将被创建，`admin` 值为 `N`。

如果有必要，你可以将闭包作为序列值。每次序列需要新值时都会调用闭包：

```php
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
                ->count(10)
                ->state(new Sequence(
                    fn (Sequence $sequence) => ['role' => UserRoles::all()->random()],
                ))
                ->create();
```

在序列闭包中，你可以访问注入闭包的序列实例上的 `$index` 或 `$count` 属性。`$index` 属性包含到目前为止已经发生的序列迭代次数，而 `$count` 属性包含序列将被调用的总次数：

```php
$users = User::factory()
                ->count(10)
                ->sequence(fn (Sequence $sequence) => ['name' => 'Name '.$sequence->index])
                ->create();
```

为了方便，还可以使用 `sequence` 方法应用序列，它内部简单地调用了 `state` 方法。`sequence` 方法接受闭包或序列化属性数组：

```php
$users = User::factory()
                ->count(2)
                ->sequence(
                    ['name' => 'First User'],
                    ['name' => 'Second User'],
                )
                ->create();
```

## 工厂关系

### 一对多关系

接下来，让我们探索如何使用 Laravel 的流畅工厂方法构建 Eloquent 模型关系。首先，假设我们的应用有一个 `App\Models\User` 模型和一个 `App\Models\Post` 模型。另外，假设 `User` 模型定义了与 `Post` 的 `hasMany` 关系。我们可以使用 Laravel 工厂提供的 `has` 方法来创建一个拥有三篇文章的用户。`has` 方法接受一个工厂实例：

```php
use App\Models\Post;
use App\Models\User;

$user = User::factory()
            ->has(Post::factory()->count(3))
            ->create();
```

按照约定，向 `has` 方法传递 `Post` 模型时，Laravel 将假设 `User` 模型必须有一个定义关系的 `posts` 方法。如有必要，你可以明确指定你想要操作的关系名称：

```php
$user = User::factory()
            ->has(Post::factory()->count(3), 'posts')
            ->create();
```

当然，你可以对相关模型进行状态操作。此外，如果你的状态更改需要访问到父模型，你可以传递闭包作为状态变换：

```php
$user = User::factory()
            ->has(
                Post::factory()
                        ->count(3)
                        ->state(function (array $attributes, User $user) {
                            return ['user_type' => $user->type];
                        })
            )
            ->create();
```

#### 使用魔术方法

为了方便，你可以使用 Laravel 的魔术工厂关系方法构建关系。例如，下面的例子将使用约定来确定相关模型应通过 `User` 模型上的 `posts` 关系方法来创建：

```php
$user = User::factory()
            ->hasPosts(3)
            ->create();
```

当使用魔术方法创建工厂关系时，你可以传递一个属性数组，以覆盖相关模型上的属性：

```php
$user = User::factory()
            ->hasPosts(3, [
                'published' => false,
            ])
            ->create();
```

如果你的状态更改需要访问父模型，你可以提供基于闭包的状态转换：

```php
$user = User::factory()
            ->hasPosts(3, function (array $attributes, User $user) {
                return ['user_type' => $user->type];
            })
            ->create();
```

### 从属关系

现在我们已经探讨了如何使用工厂构建“一对多”关系，让我们探讨关系的反向。`for` 方法可用于定义工厂创建模型所属的父模型。例如，我们可以创建三个属于一个用户的 `App\Models\Post` 模型实例：

```php
use App\Models\Post;
use App\Models\User;

$posts = Post::factory()
            ->count(3)
            ->for(User::factory()->state([
                'name' => 'Jessica Archer',
            ]))
            ->create();
```

如果你已经有一个应该与你正在创建的模型相关联的父模型实例，你可以将模型实例传递给 `for` 方法：

```php
$user = User::factory()->create();

$posts = Post::factory()
            ->count(3)
            ->for($user)
            ->create();
```

#### 使用魔术方法

为了方便，你可以使用 Laravel 的魔术工厂关系方法来定义“从属”关系。例如，下面的例子将使用约定来确定这三篇文章应属于 `Post` 模型上的 `user` 关系：

```php
$posts = Post::factory()
            ->count(3)
            ->forUser([
                'name' => 'Jessica Archer',
            ])
            ->create();
```

### 多对多关系

与[一对多关系](#has-many-relationships)类似，“多对多”关系可以使用 `has` 方法创建：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
            ->has(Role::factory()->count(3))
            ->create();
```

#### 中间表属性

如果你需要定义应设置在连接模型的中间表/中介表上的属性，则可以使用 `hasAttached` 方法。此方法将接收中间表属性名称和值的数组作为第二个参数：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
            ->hasAttached(
                Role::factory()->count(3),
                ['active' => true]
            )
            ->create();
```

如果你的状态更改需要访问相关模型，你可以提供基于闭包的状态转换：

```php
$user = User::factory()
            ->hasAttached(
                Role::factory()
                    ->count(3)
                    ->state(function (array $attributes, User $user) {
                        return ['name' => $user->name.' Role'];
                    }),
                ['active' => true]
            )
            ->create();
```

如果你已经有模型实例并想要将它们附加到你正在创建的模型，你可以将模型实例传递给 `hasAttached` 方法。在这个例子中，同样的三个角色将被附加到所有三个用户：

```php
$roles = Role::factory()->count(3)->create();

$user = User::factory()
            ->count(3)
            ->hasAttached($roles, ['active' => true])
            ->create();
```

#### 使用魔术方法

为了方便，你可以使用 Laravel 的魔术工厂关系方法定义多对多关系。例如，下面的例子将使用约定来确定相关模型应通过 `User` 模型上的 `roles` 关系方法创建：

```php
$user = User::factory()
            ->hasRoles(1, [
                'name' => 'Editor'
            ])
            ->create();
```

### 多态关系

[多态关系](/docs/11/eloquent/eloquent-relationships#polymorphic-relationships)也可以使用工厂创建。多态 "morph many" 关系的创建方式与典型的 "has many" 关系相同。例如，如果 `App\Models\Post` 模型与 `App\Models\Comment` 模型有一个 `morphMany` 关系：

```php
use App\Models\Post;

$post = Post::factory()->hasComments(3)->create();
```

#### Morph To 关系

魔术方法不能用于创建 `morphTo` 关系。相反，必须直接使用 `for` 方法，并且必须明确提供关系的名称。例如，假设 `Comment` 模型有一个定义 `morphTo` 关系的 `commentable` 方法。在这种情况下，我们可以使用 `for` 方法直接创建属于单个帖子的三条评论：

```php
$comments = Comment::factory()->count(3)->for(
    Post::factory(), 'commentable'
)->create();
```

#### 多态多对多关系

多态“多对多”（`morphToMany` / `morphedByMany`）关系的创建与非多态“多对多”关系的创建相同：

```php
use App\Models\Tag;
use App\Models\Video;

$videos = Video::factory()
            ->hasAttached(
                Tag::factory()->count(3),
                ['public' => true]
            )
            ->create();
```

当然，也可以使用魔术 `has` 方法来创建多态“多对多”关系：

```php
$videos = Video::factory()
            ->hasTags(3, ['public' => true])
            ->create();
```

### 在工厂内定义关系

要在模型工厂内定义关系，通常会将新的工厂实例分配给关系的外键。这通常是为“反向”关系所做，如 `belongsTo` 和 `morphTo` 关系。例如，如果你想在创建帖子时创建一个新用户，你可以这样做：

```php
use App\Models\User;

/**
 * Define the model's default state.
 *
 * @return array<string, mixed>
 */
public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'title' => fake()->title(),
        'content' => fake()->paragraph(),
    ];
}
```

如果关系的列依赖于定义它的工厂，则可以将闭包分配给一个属性。闭包将接收工厂的评估属性数组：

```php
/**
 * Define the model's default state.
 *
 * @return array<string, mixed>
 */
public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'user_type' => function (array $attributes) {
            return User::find($attributes['user_id'])->type;
        },
        'title' => fake()->title(),
        'content' => fake()->paragraph(),
    ];
}
```

### 为关系复用现有模型

如果你有模型与另一个模型共享通用关系，你可以使用 `recycle` 方法确保一个单独的相关模型实例被复用于工厂创建的所有关系。

例如，想象你有 `Airline`、`Flight` 和 `Ticket` 模型，票据属于一个航空公司和一个航班，航班也属于一个航空公司。在创建票据时，你可能会希望票据和航班有相同的航空公司，因此你可以传递航空公司实例给 `recycle` 方法：

```php
Ticket::factory()
    ->recycle(Airline::factory()->create())
    ->create();
```

如果你有属于一个通用用户或团队的模型，你会发现 `recycle` 方法特别有用。

`recycle` 方法也接受现有模型的集合。当提供集合给 `recycle` 方法时，当工厂需要某种类型的模型时，将从集合中随机选择一个模型：

```php
Ticket::factory()
    ->recycle($airlines)
    ->create();
```
