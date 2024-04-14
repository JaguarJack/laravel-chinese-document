---
title: Laravel Artisan 命令
---

# Artisan 命令

[[toc]]

## 简介

Artisan 是 Laravel 框架附带的命令行界面。Artisan 位于应用程序的根目录下，作为 `artisan` 脚本存在，并提供了许多有用的命令，这些命令可以在你构建应用程序时提供帮助。要查看所有可用的 Artisan 命令，你可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还包括一个“帮助”屏幕，显示并描述命令的可用参数和选项。要查看帮助屏幕，请在命令名前加上 `help`：

```shell
php artisan help migrate
```

#### Laravel Sail

如果你正在使用 [Laravel Sail](/docs/11/packages/sail) 作为本地开发环境，请记得使用 `sail` 命令行调用 Artisan 命令。Sail 会在你应用程序的 Docker 容器中执行你的 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

### Tinker (REPL)

Laravel Tinker 是一个强大的 REPL (交互式编程环境) 工具，适用于 Laravel 框架，由 [PsySH](https://github.com/bobthecow/psysh) 包提供支持。

#### 安装

所有 Laravel 应用程序默认包括 Tinker。然而，如果你之前从应用程序中移除了 Tinker，你可以使用 Composer 安装它：

```shell
composer require laravel/tinker
```

> [!NOTE]  
> 寻找热重载、多行代码编辑和在与 Laravel 应用程序交互时自动补全的功能？请查看 [Tinkerwell](https://tinkerwell.app)！

#### 使用

Tinker 允许你在命令行上与整个 Laravel 应用程序进行交互，包括你的 Eloquent 模型、任务、事件等。要进入 Tinker 环境，请运行 `tinker` Artisan 命令：

```shell
php artisan tinker
```

你可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

> [!WARNING]  
> `dispatch` 助手函数和 `Dispatchable` 类上的 `dispatch` 方法依赖于垃圾收集将任务放置到队列上。因此，在使用 tinker 时，你应该使用 `Bus::dispatch` 或 `Queue::push` 来分发任务。

#### 命令允许列表

Tinker 使用一个“允许”列表来确定哪些 Artisan 命令允许在其 shell 中运行。默认情况下，你可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`optimize` 和 `up` 命令。如果你想允许更多命令，你可以将它们添加到 `tinker.php` 配置文件中的 `commands` 数组：

```php
'commands' => [
    // App\Console\Commands\ExampleCommand::class,
],
```

#### 不应该被别名化的类

通常，Tinker 会在你在 Tinker 中与它们交互时自动为类设置别名。然而，你可能希望永远不为某些类设置别名。你可以通过在 `tinker.php` 配置文件的 `dont_alias` 数组中列出类来实现这一点：

```php
'dont_alias' => [
    App\Models\User::class,
],
```

## 编写命令

除了 Artisan 提供的命令外，你还可以构建自己的自定义命令。命令通常存储在 `app/Console/Commands` 目录中；然而，只要你的命令可以通过 Composer 载入，你可以自由选择你自己的存储位置。

### 生成命令

要创建新的命令，你可以使用 `make:command` Artisan 命令。该命令会在 `app/Console/Commands` 目录中创建一个新的命令类。如果这个目录不存在于你的应用程序中，那么它会在你第一次运行 `make:command` Artisan 命令时被创建：

```shell
php artisan make:command SendEmails
```

### 命令结构

生成命令后，你应为类的 `signature` 和 `description` 属性定义适当的值。这些属性将在命令显示在 `list` 屏幕上时使用。`signature` 属性还允许你定义[命令的输入期望](#defining-input-expectations)。当执行你的命令时将调用 `handle` 方法。你可以在此方法中放置你的命令逻辑。

让我们来看一个命令的例子。请注意，我们可以通过命令的 `handle` 方法请求我们需要的任何依赖项。Laravel [服务容器](/docs/11/architecture-concepts/container) 将自动注入此方法签名中类型提示的所有依赖项：

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\DripEmailer;
use Illuminate\Console\Command;

class SendEmails extends Command
{
    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

    /**
     * 控制台命令描述。
     *
     * @var string
     */
    protected $description = '发送营销邮件给一个用户';

    /**
     * 执行控制台命令。
     */
    public function handle(DripEmailer $drip): void
    {
        $drip->send(User::find($this->argument('user')));
    }
}
```

> [!NOTE]  
> 为了更大的代码重用，建议让你的控制台命令保持轻量级，并让它们委托给应用服务来完成它们的任务。在上面的例子中，请注意我们注入了一个服务类来完成发送邮件的“繁重工作”。

### 闭包命令

闭包命令提供了定义控制台命令为类的另一种选择。就像路由闭包是对控制器的一种替代，可以认为命令闭包是对命令类的一种替代。

尽管 `routes/console.php` 文件不定义 HTTP 路由，它定义了进入你的应用程序的基于控制台的入口点（路由）。在这个文件中，你可以使用 `Artisan::command` 方法定义所有的基于闭包的控制台命令。`command` 方法接受两个参数：[命令的签名](#defining-input-expectations) 和一个闭包，闭包接收命令的参数和选项：

```php
Artisan::command('mail:send {user}', function (string $user) {
    $this->info("Sending email to: {$user}!");
});
```

该闭包绑定到底层的命令实例，因而你可以完全访问所有你通常能够在完整命令类上访问的辅助方法。

#### 类型提示依赖项

除了接收你命令的参数和选项，命令闭包还可以类型提示你想要从[服务容器](/docs/11/architecture-concepts/container)解析的附加依赖：

```php
use App\Models\User;
use App\Support\DripEmailer;

Artisan::command('mail:send {user}', function (DripEmailer $drip, string $user) {
    $drip->send(User::find($user));
});
```

#### 闭包命令描述

在定义基于闭包的命令时，你可以使用 `purpose` 方法为命令添加描述。当你运行 `php artisan list` 或 `php artisan help` 命令时，这个描述将被显示：

```php
Artisan::command('mail:send {user}', function (string $user) {
    // ...
})->purpose('Send a marketing email to a user');
```

### 可隔离的命令

> [!WARNING]  
> 要利用这个功能，你的应用程序必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用程序的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器进行通信。

有时你可能希望确保一次只能运行一个命令实例。为此，你可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;

class SendEmails extends Command implements Isolatable
{
    // ...
}
```

当一个命令被标记为 `Isolatable` 时，Laravel 会自动给这个命令添加一个 `--isolated` 选项。当命令带着该选项被调用时，Laravel 会确保没有其他实例的该命令正在运行。Laravel 通过尝试使用你的应用程序的默认缓存驱动获取一个原子锁来实现这一点。如果其他实例的命令正在运行，这个命令将不会执行；但是，该命令仍然会退出并返回一个成功的退出状态码：

```shell
php artisan mail:send 1 --isolated
```

如果你想指定该命令在无法执行时应该返回的退出状态码，你可以通过 `isolated` 选项提供所需的状态码：

```shell
php artisan mail:send 1 --isolated=12
```

#### 锁定 ID

默认情况下，Laravel 将使用命令的名称生成用于在应用程序的缓存中获取原子锁的字符串键。然而，你可以通过在 Artisan 命令类中定义一个 `isolatableId` 方法来自定义此键，允许你将命令的参数或选项集成到键中：

```php
/**
 * 获取命令的可隔离 ID。
 */
public function isolatableId(): string
{
    return $this->argument('user');
}
```

#### 锁定过期时间

默认情况下，隔离锁定会在命令完成后过期。或者，如果命令被打断而无法完成，锁定会在一小时后过期。然而，你可以通过在命令上定义一个 `isolationLockExpiresAt` 方法来调整锁定的过期时间：

```php
use DateTimeInterface;
use DateInterval;

/**
 * 确定命令的隔离锁定何时过期。
 */
public function isolationLockExpiresAt(): DateTimeInterface|DateInterval
{
    return now()->addMinutes(5);
}
```

## 定义输入期望

在编写控制台命令时，通常需要通过参数或选项从用户那里收集输入。Laravel 使得定义你期望的用户输入变得非常方便，使用命令上的 `signature` 属性。`signature` 属性允许你在单独的、富表达性的、类路由的语法中定义命令的名称、参数和选项。

### 参数

所有用户提供的参数和选项都包裹在花括号中。在以下示例中，命令定义了一个必需的参数：`user`：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user}';
```

你也可以使参数变为可选的，或为参数定义默认值：

```php
// 可选的参数...
'mail:send {user?}'

// 带默认值的可选参数...
'mail:send {user=foo}'
```

### 选项

选项，就像参数一样，是用户输入的另一种形式。当它们通过命令行提供时，选项前缀为两个连字符（`--`）。有两种类型的选项：接收值的选项和不接收值的选项。不接收值的选项充当布尔“开关”。让我们看一个这种类型的选项的例子：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue}';
```

在这个示例中，调用 Artisan 命令时可以指定 `--queue` 开关。如果传递了 `--queue` 开关，该选项的值将是 `true`。否则，该值将是 `false`：

```shell
php artisan mail:send 1 --queue
```

#### 带值的选项

接下来，让我们看一个期望值的选项。如果用户必须为一个选项指定一个值，你应该在选项名称后加上一个 `=` 号：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue=}';
```

在这个示例中，用户可以像这样为选项传递一个值。如果在调用命令时没有指定选项，则其值将为 `null`：

```shell
php artisan mail:send 1 --queue=default
```

你可以通过在选项名称后指定默认值来为选项分配默认值。如果用户没有传递选项值，将使用默认值：

```php
'mail:send {user} {--queue=default}'
```

#### 选项快捷方式

在定义一个选项时，你可以在选项名称前指定快捷方式，并使用 `|` 字符作为分隔符来分隔快捷方式和完整的选项名称：

```php
'mail:send {user} {--Q|queue}'
```

在终端调用命令时，选项快捷方式应以单个连字符为前缀，并且在指定选项值时不应包含 `=` 字符：

```shell
php artisan mail:send 1 -Qdefault
```

### 输入数组

如果你想定义期望多个输入值的参数或选项，你可以使用 `*` 字符。首先，让我们看一个指定这种参数的示例：

```php
'mail:send {user*}'
```

调用这个方法时，可以按顺序将 `user` 参数传递到命令行。例如，以下命令将设置 `user` 的值为一个数组，其值为 `1` 和 `2`：

```shell
php artisan mail:send 1 2
```

这个 `*` 字符可以与可选参数定义结合使用，以允许零个或多个参数实例：

```php
'mail:send {user?*}'
```

#### 选项数组

在定义期望多个输入值的选项时，传递给命令的每个选项值都应该在前面加上选项名称：

```php
'mail:send {--id=*}'
```

可以通过传递多个 `--id` 选项来调用这样的命令：

```shell
php artisan mail:send --id=1 --id=2
```

### 输入描述

你可以通过使用冒号将参数名称与描述分开来为输入参数和选项分配描述。如果你需要更多空间来定义你的命令，可以随意将定义分布在多行中：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send
                        {user : 用户的 ID}
                        {--queue : 任务是否应该被加入队列}';
```

### 提示缺少的输入

如果你的命令包含必需的参数，当它们没有被提供时，用户将收到一个错误消息。另外，你可以配置你的命令以自动提示用户，当必需的参数缺失时实现自动提示，方法是实现 `PromptsForMissingInput` 接口：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\PromptsForMissingInput;

class SendEmails extends Command implements PromptsForMissingInput
{
    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

    // ...
}
```

如果 Laravel 需要从用户那里收集必需的参数，它将自动询问用户这个参数，智能地使用参数名称或描述构造问题。如果你希望自定义用于收集必需参数的问题，你可以实现 `promptForMissingArgumentsUsing` 方法，返回一个以参数名称为键的问题数组：

```php
/**
 * 使用返回的问题提示缺少的输入参数。
 *
 * @return array<string, string>
 */
protected function promptForMissingArgumentsUsing(): array
{
    return [
        'user' => '应收到邮件的用户 ID 是哪个？',
    ];
}
```

你也可以通过使用包含问题和占位符的元组来提供占位文本：

```php
return [
    'user' => ['应收到邮件的用户 ID 是哪个？', '例如 123'],
];
```

如果你想要对提示进行完全控制，你可以提供一个闭包，该闭包应提示用户并返回他们的答案：

```php
use App\Models\User;
use function Laravel\Prompts\search;

// ...

return [
    'user' => fn () => search(
        label: '搜索用户：',
        placeholder: '例如 Taylor Otwell',
        options: fn ($value) => strlen($value) > 0
            ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
            : []
    ),
];
```

> [!NOTE]  
> 完整的 [Laravel Prompts](/docs/11/packages/prompts) 文档包含了关于可用提示及其使用的额外信息。

如果你想提示用户选择或输入[选项](#options)，你可以在命令的 `handle` 方法中包含提示。然而，如果你只想在还自动提示缺少参数时提示用户，那么可以实现 `afterPromptingForMissingArguments` 方法：

```php
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use function Laravel\Prompts\confirm;

// ...

/**
 * 在用户被提示缺少参数后执行操作。
 */
protected function afterPromptingForMissingArguments(InputInterface $input, OutputInterface $output): void
{
    $input->setOption('queue', confirm(
        label: '你想要队列发送邮件吗？',
        default: $this->option('queue')
    ));
}
```

## 命令输入/输出

### 获取输入

在命令执行期间，你很可能需要访问命令接受的参数和选项的值。为了做到这一点，你可以使用 `argument` 和 `option` 方法。如果参数或选项不存在，将会返回 `null`：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $userId = $this->argument('user');
}
```

如果你需要以 `array` 形式检索所有参数，请调用 `arguments` 方法：

```php
$arguments = $this->arguments();
```

选项可以和参数一样容易地使用 `option` 方法检索。要以数组形式检索所有选项，请调用 `options` 方法：

```php
// 检索特定选项...
$queueName = $this->option('queue');

// 以数组形式检索所有选项...
$options = $this->options();
```

### 提示输入

> [!NOTE]  
> [Laravel Prompts](/docs/11/packages/prompts) 是一个 PHP 包，为命令行应用程序添加美观且友好的表单，具有浏览器样式的特性，包括占位符文本和验证。

除了显示输出，你还可以在命令执行期间要求用户提供输入。`ask` 方法将用给定的问题提示用户，接受他们的输入，然后将用户的输入返回到你的命令：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $name = $this->ask('What is your name?');

    // ...
}
```

`ask` 方法还接受一个可选的第二个参数，该参数指定如果没有提供用户输入应返回的默认值：

```php
$name = $this->ask('What is your name?', 'Taylor');
```

`secret` 方法类似于 `ask`，但用户在控制台中输入时不会看到他们的输入。这种方法在要求提供敏感信息，如密码时很有用：

```php
$password = $this->secret('What is the password?');
```

#### 请求确认

如果你需要向用户询问一个简单的“是或否”确认，你可以使用 `confirm` 方法。默认情况下，此方法会返回 `false`。然而，如果用户对提示输入 `y` 或 `yes`，方法将返回 `true`。

```php
if ($this->confirm('Do you wish to continue?')) {
    // ...
}
```

如果需要，你可以通过向 `confirm` 方法的第二个参数传递 `true` 来指定确认提示应默认返回 `true`：

```php
if ($this->confirm('Do you wish to continue?', true)) {
    // ...
}
```

#### 自动补全

`anticipate` 方法可以用来提供可能选择的自动完成提示。用户仍然可以提供任何答案，不管自动完成提示如何：

```php
$name = $this->anticipate('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以将一个闭包作为 `anticipate` 方法的第二个参数。每次用户输入字符时，将调用该闭包。闭包应接受一个包含用户迄今为止的输入的字符串参数，并返回自动完成的选项数组：

```php
$name = $this->anticipate('What is your address?', function (string $input) {
    // 返回自动完成选项...
});
```

#### 多项选择问题

如果你需要在询问问题时给用户一个预定义的选择集合，你可以使用 `choice` 方法。通过将默认值的数组索引作为第三个参数传递给该方法，你可以设置默认返回的默认值：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex
);
```

此外，`choice` 方法接受可选的第四和第五个参数，用于确定选择有效回复的最大尝试次数以及是否允许多重选择：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex,
    $maxAttempts = null,
    $allowMultipleSelections = false
);
```

### 输出写入

要将输出发送到控制台，你可使用 `line`、`info`、`comment`、`question`、`warn` 和 `error` 方法。这些方法中的每一个都会使用适当的 ANSI 颜色。例如，让我们向用户显示一些一般信息。通常，`info` 方法将显示为控制台中的绿色文本：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    // ...

    $this->info('The command was successful!');
}
```

要显示错误消息，请使用 `error` 方法。错误消息文本通常显示为红色：

```php
$this->error('Something went wrong!');
```

你可以使用 `line` 方法显示平淡无颜色的文本：

```php
$this->line('Display this on the screen');
```

你可以使用 `newLine` 方法显示一个空行：

```php
// 写一个空白行...
$this->newLine();

// 写三个空白行...
$this->newLine(3);
```

#### 表格

`table` 方法使得正确格式化多行/列数据变得容易。你所需要做的就是提供列名和表格数据，Laravel 将自动为你计算表格的适当宽度和高度：

```php
use App\Models\User;

$this->table(
    ['Name', 'Email'],
    User::all(['name', 'email'])->toArray()
);
```

#### 进度条

对于耗时较长的任务，显示进度条以告知用户任务完成程度是很有帮助的。使用 `withProgressBar` 方法，Laravel 将为给定的可迭代值的每次迭代显示进度条并推进它的进度：

```php
use App\Models\User;

$users = $this->withProgressBar(User::all(), function (User $user) {
    $this->performTask($user);
});
```

有时，你可能需要对进度条的推进有更多的手动控制。首先，定义过程将迭代的总步骤数。然后，在处理每个项后，推进进度条：

```php
$users = App\Models\User::all();

$bar = $this->output->createProgressBar(count($users));

$bar->start();

foreach ($users as $user) {
    $this->performTask($user);

    $bar->advance();
}

$bar->finish();
```

> [!NOTE]
> 有关更高级选项，请查看 [Symfony Progress Bar 组件文档](https://symfony.com/doc/7.0/components/console/helpers/progressbar.html)。

## 注册命令

默认情况下，Laravel 会自动注册 `app/Console/Commands` 目录中的所有命令。然而，你可以指导 Laravel 扫描其他目录以搜索 Artisan 命令，方法是在应用程序的 `bootstrap/app.php` 文件中使用 `withCommands` 方法：

```php
->withCommands([
    __DIR__.'/../app/Domain/Orders/Commands',
])
```

如果需要，你还可以通过向 `withCommands` 方法提供命令的类名来手动注册命令：

```php
use App\Domain\Orders\Commands\SendEmails;

->withCommands([
    SendEmails::class,
])
```

当 Artisan 启动时，应用程序中的所有命令都将由 [服务容器](/docs/11/architecture-concepts/container) 解析并注册到 Artisan。

## 编程式执行命令

有时你可能希望在 CLI 之外执行一个 Artisan 命令。例如，你可能希望从路由或控制器执行一个 Artisan 命令。你可以使用 `Artisan` 门面上的 `call` 方法来实现这一点。`call` 方法接受命令的签名名称或类名称作为其第一个参数，并在第二个参数中接受命令参数的数组。将会返回退出代码：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/user/{user}/mail', function (string $user) {
    $exitCode = Artisan::call('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
});
```

或者，你可以将整个 Artisan 命令作为字符串传递给 `call` 方法：

```php
Artisan::call('mail:send 1 --queue=default');
```

#### 传递数组值

如果你的命令定义了一个接受数组的选项，你可以传递一个值数组给该选项：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/mail', function () {
    $exitCode = Artisan::call('mail:send', [
        '--id' => [5, 13]
    ]);
});
```

#### 传递布尔值

如果你需要指定不接受字符串值的选项的值，例如 `migrate:refresh` 命令上的 `--force` 标志，则应该将 `true` 或 `false` 作为选项的值传递：

```php
$exitCode = Artisan::call('migrate:refresh', [
    '--force' => true,
]);
```

#### 排队 Artisan 命令

使用 `Artisan` 门面上的 `queue` 方法，你甚至可以将 Artisan 命令排队，以便通过你的 [队列工作器](/docs/11/digging-deeper/queues) 在后台处理。在使用此方法之前，请确保你已配置你的队列并正在运行队列监听器：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/user/{user}/mail', function (string $user) {
    Artisan::queue('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
});
```

使用 `onConnection` 和 `onQueue` 方法，你可以指定 Artisan 命令应分派到的连接或队列：

```php
Artisan::queue('mail:send', [
    'user' => 1, '--queue' => 'default'
])->onConnection('redis')->onQueue('commands');
```

### 从其他命令调用命令

有时你可能希望从现有的 Artisan 命令中调用其他命令。你可以使用 `call` 方法来做到这一点。这个 `call` 方法接受命令名称和一个命令参数/选项的数组：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $this->call('mail:send', [
        'user' => 1, '--queue' => 'default'
    ]);

    // ...
}
```

如果你希望调用另一个控制台命令并抑制它的所有输出，你可以使用 `callSilently` 方法。`callSilently` 方法与 `call` 方法有相同的签名：

```php
$this->callSilently('mail:send', [
    'user' => 1, '--queue' => 'default'
]);
```

## 信号处理

正如你可能知道的，操作系统允许向正在运行的进程发送信号。例如，`SIGTERM` 信号是操作系统要求程序终止的方式。如果你希望在 Artisan 控制台命令中监听信号，并在它们发生时执行代码，你可以使用 `trap` 方法：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $this->trap(SIGTERM, fn () => $this->shouldKeepRunning = false);

    while ($this->shouldKeepRunning) {
        // ...
    }
}
```

要一次监听多个信号，你可以向 `trap` 方法提供一个信号数组：

```php
$this->trap([SIGTERM, SIGQUIT], function (int $signal) {
    $this->shouldKeepRunning = false;

    dump($signal); // SIGTERM / SIGQUIT
});
```

## 存根定制

Artisan 控制台的 `make` 命令用于创建各种类，如控制器、任务、迁移和测试。这些类是使用基于你输入的值填充的“存根”文件生成的。然而，你可能想对由 Artisan 生成的文件进行小的更改。为此，你可以使用 `stub:publish` 命令发布应用程序中最常见的存根文件，以便你可以自定义它们：

```shell
php artisan stub:publish
```

已发布的存根将位于应用程序根目录下的 `stubs` 目录中。你对这些存根所做的任何更改将会在你使用 Artisan 的 `make` 命令生成相应类时反映出来。

## 事件

Artisan 在运行命令时会分发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。`ArtisanStarting` 事件在 Artisan 开始运行时立即分发。接下来，`CommandStarting` 事件在命令运行前立即分发。最后，一旦命令执行完成后将分发 `CommandFinished` 事件。
