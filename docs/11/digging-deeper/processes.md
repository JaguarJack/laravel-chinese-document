---
title: Laravel 进程
---

# 进程

[[toc]]

## 介绍

Laravel 提供了围绕 [Symfony Process 组件](https://symfony.com/doc/7.0/components/process.html)的表达性、最简单的 API，允许你方便地从 Laravel 应用程序调用外部进程。Laravel 的进程特性专注于最常见的用例和出色的开发者体验。

## 调用进程

为了调用进程，你可以使用 `Process` facade 提供的 `run` 和 `start` 方法。`run` 方法将调用一个进程并等待该进程执行完成，而 `start` 方法用于异步进程执行。我们将在本文档中检查这两种方法。首先，让我们看看如何调用一个基本的同步进程并检查它的结果：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

return $result->output();
```

当然，`run` 方法返回的 `Illuminate\Contracts\Process\ProcessResult` 实例提供了各种有用的方法，可用于检查进程结果：

```php
$result = Process::run('ls -la');

$result->successful();
$result->failed();
$result->exitCode();
$result->output();
$result->errorOutput();
```

#### 抛出异常

如果你有一个进程结果，并希望在退出码大于零时抛出 `Illuminate\Process\Exceptions\ProcessFailedException` 的实例（从而指示失败），你可以使用 `throw` 和 `throwIf` 方法。如果进程没有失败，将返回进程结果实例：

```php
$result = Process::run('ls -la')->throw();

$result = Process::run('ls -la')->throwIf($condition);
```

### 进程选项

当然，你可能需要在调用进程之前自定义进程的行为。幸运的是，Laravel 允许你调整各种进程特性，如工作目录、超时和环境变量。

#### 工作目录路径

你可以使用 `path` 方法来指定进程的工作目录。如果没有调用此方法，进程将继承当前执行 PHP 脚本的工作目录：

```php
$result = Process::path(__DIR__)->run('ls -la');
```

#### 输入

你可以使用 `input` 方法提供通过进程的“标准输入”输入：

```php
$result = Process::input('Hello World')->run('cat');
```

#### 超时

默认情况下，进程会在执行超过 60 秒后抛出 `Illuminate\Process\Exceptions\ProcessTimedOutException` 的实例。不过，你可以通过 `timeout` 方法自定义此行为：

```php
$result = Process::timeout(120)->run('bash import.sh');
```

或者，如果你想完全禁用进程超时，你可以调用 `forever` 方法：

```php
$result = Process::forever()->run('bash import.sh');
```

`idleTimeout` 方法可用于指定进程运行而不返回任何输出的最大秒数：

```php
$result = Process::timeout(60)->idleTimeout(30)->run('bash import.sh');
```

#### 环境变量

环境变量可以通过 `env` 方法提供给进程。被调用的进程还将继承你的系统定义的所有环境变量：

```php
$result = Process::forever()
            ->env(['IMPORT_PATH' => __DIR__])
            ->run('bash import.sh');
```

如果你希望从被调用的进程中移除一个继承的环境变量，你可以为该环境变量提供 `false` 值：

```php
$result = Process::forever()
            ->env(['LOAD_PATH' => false])
            ->run('bash import.sh');
```

#### TTY 模式

`tty` 方法可用于启用你的进程的 TTY 模式。TTY 模式将进程的输入和输出连接到你的程序的输入和输出，允许你的进程作为一个进程打开像 Vim 或 Nano 这样的编辑器：

```php
Process::forever()->tty()->run('vim');
```

### 进程输出

如前所述，进程输出可以使用进程结果上的 `output`（标准输出）和 `errorOutput`（标准错误）方法访问：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

echo $result->output();
echo $result->errorOutput();
```

然而，输出也可以通过将闭包作为第二个参数传递给 `run` 方法来实时收集。该闭包将接收两个参数：输出的“类型”（`stdout` 或 `stderr`）和输出字符串本身：

```php
$result = Process::run('ls -la', function (string $type, string $output) {
    echo $output;
});
```

Laravel 还提供了 `seeInOutput` 和 `seeInErrorOutput` 方法，这两种方法提供了一种方便的方式来确定给定字符串是否包含在进程的输出中：

```php
if (Process::run('ls -la')->seeInOutput('laravel')) {
    // ...
}
```

#### 禁用进程输出

如果你的进程正在写入大量你不感兴趣的输出，你可以通过在构建进程时调用 `quietly` 方法来禁用输出检索，从而节省内存：

```php
use Illuminate\Support\Facades\Process;

$result = Process::quietly()->run('bash import.sh');
```

### 管道

有时你可能想要使一个进程的输出成为另一个进程的输入。这通常被称为将一个进程的输出“管道”到另一个进程。`Process` facade 提供的 `pipe` 方法使这很容易完成。`pipe` 方法将同步执行管道过程并返回管道中最后一个过程的进程结果：

```php
use Illuminate\Process\Pipe;
use Illuminate\Support\Facades\Process;

$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
});

if ($result->successful()) {
    // ...
}
```

如果你不需要自定义构成管道的各个进程，你可以简单地将一系列命令字符串传递给 `pipe` 方法：

```php
$result = Process::pipe([
    'cat example.txt',
    'grep -i "laravel"',
]);
```

通过将闭包作为第二个参数传递给 `pipe` 方法，也可以实时收集进程输出。闭包将接收两个参数：输出的“类型”（`stdout` 或 `stderr`）和输出字符串本身：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
}, function (string $type, string $output) {
    echo $output;
});
```

Laravel 还允许你通过 `as` 方法为管道中的每个进程分配字符串键。这个键也将被传递给提供给 `pipe` 方法的输出闭包，让你能够确定输出属于哪个进程：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->as('first')->command('cat example.txt');
    $pipe->as('second')->command('grep -i "laravel"');
})->start(function (string $type, string $output, string $key) {
    // ...
});
```

## 异步进程

虽然 `run` 方法同步地调用进程，但 `start` 方法可以用于异步地调用进程。这允许你的应用在进程在后台运行时继续执行其他任务。一旦调用了进程，您可以使用 `running` 方法来确定进程是否仍在运行：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    // ...
}

$result = $process->wait();
```

如你所见，你可以调用 `wait` 方法等待进程执行完成并检索进程结果实例：

```php
$process = Process::timeout(120)->start('bash import.sh');

// ...

$result = $process->wait();
```

### 进程 ID 和信号

可使用 `id` 方法检索正在运行的进程的操作系统分配的进程 ID：

```php
$process = Process::start('bash import.sh');

return $process->id();
```

你可以使用 `signal` 方法向正在运行的进程发送“信号”。预定义信号常量的列表可以在 [PHP 文档](https://www.php.net/manual/en/pcntl.constants.php) 中找到：

```php
$process->signal(SIGUSR2);
```

### 异步进程输出

当一个异步进程正在运行时，您可以使用 `output` 和 `errorOutput` 方法访问其当前的全部输出；但是，你可以使用 `latestOutput` 和 `latestErrorOutput` 来访问自上次检索输出以来进程发生的输出：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    echo $process->latestOutput();
    echo $process->latestErrorOutput();

    sleep(1);
}
```

与 `run` 方法类似，也可以通过将闭包作为第二个参数传递给 `start` 方法，实时从异步进程中获取输出。闭包将接收两个参数：输出的“类型”(`stdout` 或 `stderr`)和输出字符串本身：

```php
$process = Process::start('bash import.sh', function (string $type, string $output) {
    echo $output;
});

$result = $process->wait();
```

## 并行进程

Laravel 还使得管理一池并行的异步进程变得轻而易举，允许你轻松地同时执行许多任务。要开始，请调用 `pool` 方法，该方法接受一个闭包，该闭包接收一个 `Illuminate\Process\Pool` 实例。

在这个闭包内，你可以定义属于池的进程。一旦通过 `start` 方法启动了进程池，你可以通过 `running` 方法访问正在运行的进程的 [集合](/docs/11/digging-deeper/collections)：

```php
use Illuminate\Process\Pool;
use Illuminate\Support\Facades\Process;

$pool = Process::pool(function (Pool $pool) {
    $pool->path(__DIR__)->command('bash import-1.sh');
    $pool->path(__DIR__)->command('bash import-2.sh');
    $pool->path(__DIR__)->command('bash import-3.sh');
})->start(function (string $type, string $output, int $key) {
    // ...
});

while ($pool->running()->isNotEmpty()) {
    // ...
}

$results = $pool->wait();
```

如你所见，你可以等待池中所有进程执行完成并通过 `wait` 方法解决它们的结果。`wait` 方法返回一个可访问的数组对象，允许你通过其键访问池中每个进程的进程结果实例：

```php
$results = $pool->wait();

echo $results[0]->output();
```

或者，为了方便，可以使用 `concurrently` 方法启动一个异步进程池并立即等待其结果。当与 PHP 的数组解构功能结合使用时，这可以提供特别表现力的语法：

```php
[$first, $second, $third] = Process::concurrently(function (Pool $pool) {
    $pool->path(__DIR__)->command('ls -la');
    $pool->path(app_path())->command('ls -la');
    $pool->path(storage_path())->command('ls -la');
});

echo $first->output();
```

### 命名池进程

通过数字键访问进程池结果并不是非常具有表现力；因此，Laravel 允许你通过 `as` 方法为池中的每个进程分配字符串键。这个键也将传递给提供给 `start` 方法的闭包，允许你确定输出属于哪个进程：

```php
$pool = Process::pool(function (Pool $pool) {
    $pool->as('first')->command('bash import-1.sh');
    $pool->as('second')->command('bash import-2.sh');
    $pool->as('third')->command('bash import-3.sh');
})->start(function (string $type, string $output, string $key) {
    // ...
});

$results = $pool->wait();

return $results['first']->output();
```

### 池进程 ID 和信号

由于进程池的 `running` 方法提供了池中所有被调用进程的集合，你可以轻松访问底层池进程的 ID：

```php
$processIds = $pool->running()->each->id();
```

为了方便，你可以在进程池上调用 `signal` 方法向池中的每个进程发送信号：

```php
$pool->signal(SIGUSR2);
```

## 测试

许多 Laravel 服务提供了功能，帮助您轻松并具有表达力地编写测试，Laravel 的进程服务也不例外。`Process` facade 的 `fake` 方法允许你指定 Laravel 在调用进程时返回桩/假的结果。

### 伪造进程

为了探索 Laravel 伪造进程的能力，让我们想象一个调用进程的路由：

```php
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    Process::run('bash import.sh');

    return 'Import complete!';
});
```

在测试此路由时，我们可以通过在 `Process` facade 上调用不带参数的 `fake` 方法，指定 Laravel 返回每个调用进程的假成功进程结果。此外，我们甚至可以[断言](#available-assertions)运行了特定的进程：

```php tab=Pest
<?php

use Illuminate\Process\PendingProcess;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\Process;

test('process is invoked', function () {
    Process::fake();

    $response = $this->get('/import');

    // 简单的进程断言...
    Process::assertRan('bash import.sh');

    // 或者，检查进程配置...
    Process::assertRan(function (PendingProcess $process, ProcessResult $result) {
        return $process->command === 'bash import.sh' &&
               $process->timeout === 60;
    });
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Process\PendingProcess;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_process_is_invoked(): void
    {
        Process::fake();

        $response = $this->get('/import');

        // 简单的进程断言...
        Process::assertRan('bash import.sh');

        // 或者，检查进程配置...
        Process::assertRan(function (PendingProcess $process, ProcessResult $result) {
            return $process->command === 'bash import.sh' &&
                   $process->timeout === 60;
        });
    }
}
```

如前所述，调用 `Process` facade 上的 `fake` 方法将指示 Laravel 始终返回没有输出的成功进程结果。然而，你可以很容易地使用 `Process` facade 的 `result` 方法为伪造的进程指定输出和退出代码：

```php
Process::fake([
    '*' => Process::result(
        output: 'Test output',
        errorOutput: 'Test error output',
        exitCode: 1,
    ),
]);
```

### 伪造特定进程

如之前的示例中所注意到的，`Process` facade 允许您通过传递一个数组到 `fake` 方法来为不同的进程指定不同的假结果。

数组的键应该代表您希望伪造的命令模式及其关联的结果。`*` 字符可以用作通配符。任何未被伪造的进程命令实际上将被调用。你可以使用 `Process` facade 的 `result` 方法构造这些命令的存根/伪造结果：

```php
Process::fake([
    'cat *' => Process::result(
        output: 'Test "cat" output',
    ),
    'ls *' => Process::result(
        output: 'Test "ls" output',
    ),
]);
```

如果您不需要自定义伪造进程的退出代码或错误输出，使用简单的字符串指定伪造的进程结果可能会更加方便：

```php
Process::fake([
    'cat *' => 'Test "cat" output',
    'ls *' => 'Test "ls" output',
]);
```

### 伪造进程序列

如果您正在测试的代码多次使用相同的命令调用多个进程，您可能希望为每次进程调用分配不同的假进程结果。您可以通过 `Process` facade 的 `sequence` 方法来实现这一点：

```php
Process::fake([
    'ls *' => Process::sequence()
                ->push(Process::result('First invocation'))
                ->push(Process::result('Second invocation')),
]);
```

### 伪造异步进程生命周期

到目前为止，我们主要讨论了使用 `run` 方法同步调用的伪造进程。但是，如果你正在尝试测试与通过 `start` 调用的异步进程交互的代码，你可能需要一种更复杂的方法来描述你的假进程。

例如，让我们想象以下路由，它与一个异步进程交互：

```php
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    $process = Process::start('bash import.sh');

    while ($process->running()) {
        Log::info($process->latestOutput());
        Log::info($process->latestErrorOutput());
    }

    return 'Done';
});
```

为了正确伪造这个进程，我们需要能够描述 `running` 方法应返回 `true` 的次数。此外，我们可能希望指定应该按顺序返回的多行输出。为了实现这一点，我们可以使用 `Process` facade 的 `describe` 方法：

```php
Process::fake([
    'bash import.sh' => Process::describe()
            ->output('First line of standard output')
            ->errorOutput('First line of error output')
            ->output('Second line of standard output')
            ->exitCode(0)
            ->iterations(3),
]);
```

让我们深入研究上面的示例。使用 `output` 和 `errorOutput` 方法，我们可以指定多行输出将按顺序返回。`exitCode` 方法可用于指定伪造进程的最终退出代码。最后，`iterations` 方法可用于指定 `running` 方法应返回 `true` 的次数。

### 可用的断言

如[前所述](#faking-processes)，Laravel 为你的功能测试提供了几个进程断言。我们将在下面讨论这些断言中的每一个。

#### assertRan

断言调用了给定的进程：

```php
use Illuminate\Support\Facades\Process;

Process::assertRan('ls -la');
```

`assertRan` 方法还接受一个闭包，该闭包将接收一个进程实例和一个进程结果，允许你检查进程的配置选项。如果此闭包返回 `true`，断言将“通过”：

```php
Process::assertRan(fn ($process, $result) =>
    $process->command === 'ls -la' &&
    $process->path === __DIR__ &&
    $process->timeout === 60
);
```

传递给 `assertRan` 闭包的 `$process` 是 `Illuminate\Process\PendingProcess` 的一个实例，而 `$result` 是 `Illuminate\Contracts\Process\ProcessResult` 的一个实例。

#### assertDidntRun

断言没有调用给定的进程：

```php
use Illuminate\Support\Facades\Process;

Process::assertDidntRun('ls -la');
```

与 `assertRan` 方法一样，`assertDidntRun` 方法也接受一个闭包，该闭包将接收一个进程实例和一个进程结果，允许你检查进程的配置选项。如果此闭包返回 `true`，断言将“失败”：

```php
Process::assertDidntRun(fn (PendingProcess $process, ProcessResult $result) =>
    $process->command === 'ls -la'
);
```

#### assertRanTimes

断言给定的进程被调用了给定的次数：

```php
use Illuminate\Support\Facades\Process;

Process::assertRanTimes('ls -la', times: 3);
```

`assertRanTimes` 方法也接受一个闭包，该闭包将接收一个进程实例和一个进程结果，允许你检查进程的配置选项。如果此闭包返回 `true` 且进程被调用了指定次数，断言将“通过”：

```php
Process::assertRanTimes(function (PendingProcess $process, ProcessResult $result) {
    return $process->command === 'ls -la';
}, times: 3);
```

### 防止漂流进程

如果你希望确保在你的单个测试或完整测试套件中所有被调用的进程都已被伪造，你可以调用 `preventStrayProcesses` 方法。在调用此方法后，没有相应伪造结果的任何进程都会抛出异常，而不是启动实际进程：

```php
use Illuminate\Support\Facades\Process;

Process::preventStrayProcesses();

Process::fake([
    'ls *' => 'Test output...',
]);

// 返回假响应...
Process::run('ls -la');

// 抛出异常...
Process::run('bash import.sh');
```
