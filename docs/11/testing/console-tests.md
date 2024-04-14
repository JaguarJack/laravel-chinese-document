---
title: Laravel 控制台测试
---

# 控制台测试

[[toc]]

## 简介

除了简化 HTTP 测试外，Laravel 还提供了一个简单的 API 用于测试您的应用程序的[自定义控制台命令](/docs/11/digging-deeper/artisan)。

## 成功/失败期望

让我们开始探索如何断言一个 Artisan 命令的退出代码。为此，我们将使用 `artisan` 方法从我们的测试中调用 Artisan 命令。然后，我们将使用 `assertExitCode` 方法来断言命令是否以给定的退出代码完成：

```php
test('console command', function () {
    $this->artisan('inspire')->assertExitCode(0);
});
```

````

```php
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('inspire')->assertExitCode(0);
}
```

您可以使用 `assertNotExitCode` 方法来断言命令没有以给定的退出代码退出：

```php
$this->artisan('inspire')->assertNotExitCode(1);
```

当然，所有终端命令在成功时通常会以状态码 `0` 退出，在不成功时会以非零退出代码退出。因此，为了方便，您可以使用 `assertSuccessful` 和 `assertFailed` 断言来断言给定的命令是否以成功的退出代码退出：

```php
$this->artisan('inspire')->assertSuccessful();

$this->artisan('inspire')->assertFailed();
```

## 输入/输出期望

Laravel 允许您使用 `expectsQuestion` 方法轻松“模拟”您的控制台命令的用户输入。此外，您可以使用 `assertExitCode` 和 `expectsOutput` 方法指定您期望控制台命令输出的退出代码和文本。例如，考虑以下控制台命令：

```php
Artisan::command('question', function () {
    $name = $this->ask('What is your name?');

    $language = $this->choice('Which language do you prefer?', [
        'PHP',
        'Ruby',
        'Python',
    ]);

    $this->line('Your name is '.$name.' and you prefer '.$language.'.');
});
```

您可以使用以下测试来测试此命令，该测试利用了 `expectsQuestion`、`expectsOutput`、`doesntExpectOutput`、`expectsOutputToContain`、`doesntExpectOutputToContain` 和 `assertExitCode` 方法：

```php
test('console command', function () {
    $this->artisan('question')
         ->expectsQuestion('What is your name?', 'Taylor Otwell')
         ->expectsQuestion('Which language do you prefer?', 'PHP')
         ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
         ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
         ->expectsOutputToContain('Taylor Otwell')
         ->doesntExpectOutputToContain('you prefer Ruby')
         ->assertExitCode(0);
});
```

```php
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('question')
         ->expectsQuestion('What is your name?', 'Taylor Otwell')
         ->expectsQuestion('Which language do you prefer?', 'PHP')
         ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
         ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
         ->expectsOutputToContain('Taylor Otwell')
         ->doesntExpectOutputToContain('you prefer Ruby')
         ->assertExitCode(0);
}
```

您还可以断言控制台命令不生成任何输出，使用 `doesntExpectOutput` 方法：

```php
test('console command', function () {
    $this->artisan('example')
         ->doesntExpectOutput()
         ->assertExitCode(0);
});
```

```php
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
            ->doesntExpectOutput()
            ->assertExitCode(0);
}
```

#### 确认期望

在编写期望以 "yes" 或 "no" 形式获得确认的命令时，您可以使用 `expectsConfirmation` 方法：

```php
$this->artisan('module:import')
    ->expectsConfirmation('Do you really wish to run this command?', 'no')
    ->assertExitCode(1);
```

#### 表格期望

如果您的命令使用 Artisan 的 `table` 方法显示信息表格，编写整个表格的输出期望可能很麻烦。相反，您可以使用 `expectsTable` 方法。该方法接受表格的标题作为其第一个参数，表格的数据作为其第二个参数：

```php
$this->artisan('users:all')
    ->expectsTable([
        'ID',
        'Email',
    ], [
        [1, 'taylor@example.com'],
        [2, 'abigail@example.com'],
    ]);
```

## 控制台事件

默认情况下，在运行应用程序的测试时，不会分派 `Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished` 事件。但是，您可以通过向类添加 `Illuminate\Foundation\Testing\WithConsoleEvents` 特性来为给定的测试类启用这些事件：

```php
<?php

use Illuminate\Foundation\Testing\WithConsoleEvents;

uses(WithConsoleEvents::class);

// ...
```

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\WithConsoleEvents;
use Tests\TestCase;

class ConsoleEventTest extends TestCase
{
    use WithConsoleEvents;

    // ...
}
```
````
