---
title: Laravel 测试入门指南
---

# 测试：入门指南

[[toc]]

## 介绍

Laravel 在设计时就考虑了测试。实际上，对 [Pest](https://pestphp.com) 和 [PHPUnit](https://phpunit.de) 的测试支持是开箱即用的，而且 `phpunit.xml` 文件已经为你的应用程序设置好了。框架还附带了方便的助手方法，允许你表达式地测试你的应用。

默认情况下，你的应用程序的 `tests` 目录包含两个目录：`Feature` 和 `Unit`。单元测试是那些专注于代码一个非常小、孤立部分的测试。事实上，大多数单元测试可能专注于单个方法。位于 "Unit" 测试目录中的测试不会启动你的 Laravel 应用程序，因此无法访问你的应用程序的数据库或其他框架服务。

特性测试可能测试代码的更大部分，包括几个对象如何互相交互，甚至是对 JSON 端点的完整 HTTP 请求。**通常，你的大部分测试应该是特性测试。这些类型的测试提供了你的整个系统正如预期工作的最大信心。**

`ExampleTest.php` 文件在 `Feature` 和 `Unit` 测试目录中都提供了。在安装新的 Laravel 应用程序后，执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令来运行你的测试。

## 环境

在运行测试时，Laravel 会自动将 [配置环境](/docs/11/getting-started/configuration#environment-configuration) 设置为 `testing`，因为 `phpunit.xml` 文件中定义了环境变量。Laravel 还自动将会话和缓存配置为 `array` 驱动，以便在测试时不会持久化任何会话或缓存数据。

你可以自由地根据需要定义其他测试环境配置值。`testing` 环境变量可以在应用程序的 `phpunit.xml` 文件中配置，但在运行测试前确保使用 `config:clear` Artisan 命令清除你的配置缓存！

#### `.env.testing` 环境文件

此外，你可以在项目的根目录中创建一个 `.env.testing` 文件。在运行 Pest 和 PHPUnit 测试或执行带有 `--env=testing` 选项的 Artisan 命令时，此文件将代替 `.env` 文件使用。

## 创建测试

使用 `make:test` Artisan 命令来创建一个新的测试用例。默认情况下，测试将放置在 `tests/Feature` 目录：

```shell
php artisan make:test UserTest
```

如果你想在 `tests/Unit` 目录中创建一个测试，可以在执行 `make:test` 命令时使用 `--unit` 选项：

```shell
php artisan make:test UserTest --unit
```

> [!NOTE]
> 测试存根可以使用 [stub 发布](/docs/11/digging-deeper/artisan#stub-customization)进行自定义。

一旦测试生成，你就可以像通常使用 Pest 或 PHPUnit 那样定义测试。要运行你的测试，请从你的终端执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令：

```php tab=Pest
<?php

test('basic', function () {
    expect(true)->toBeTrue();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $this->assertTrue(true);
    }
}
```

> [!WARNING]
> 如果你在测试类中定义了自己的 `setUp` / `tearDown` 方法，请确保调用父类的相应 `parent::setUp()` / `parent::tearDown()` 方法。通常，你应该在你自己的 `setUp` 方法开始时调用 `parent::setUp()`，并在你的 `tearDown` 方法结束时调用 `parent::tearDown()`。

## 运行测试

如前所述，一旦你编写了测试，就可以使用 `pest` 或 `phpunit` 来运行它们：

```shell tab=Pest
./vendor/bin/pest
```

```shell tab=PHPUnit
./vendor/bin/phpunit
```

除了 `pest` 或 `phpunit` 命令，你还可以使用 `test` Artisan 命令来运行你的测试。Artisan 测试运行器提供详细的测试报告，以便于开发和调试：

```shell
php artisan test
```

可以传递给 `pest` 或 `phpunit` 命令的任何参数也可以传递给 Artisan `test` 命令：

```shell
php artisan test --testsuite=Feature --stop-on-failure
```

### 并行运行测试

默认情况下，Laravel 和 Pest / PHPUnit 在单个进程中顺序执行测试。然而，你可以通过同时在多个进程中运行测试，大大减少运行测试所需的时间。首先，你应该将 `brianium/paratest` Composer 包作为 "dev" 依赖安装。然后，在执行 `test` Artisan 命令时包含 `--parallel` 选项：

```shell
composer require brianium/paratest --dev

php artisan test --parallel
```

默认情况下，Laravel 将会为你的机器创建与可用 CPU 核心一样多的进程。然而，你可以使用 `--processes` 选项来调整进程数：

```shell
php artisan test --parallel --processes=4
```

> [!WARNING]  
> 当并行运行测试时，某些 Pest / PHPUnit 选项（如 `--do-not-cache-result`）可能不可用。

#### 并行测试与数据库

只要你配置了一个主数据库连接，Laravel 自动处理为每个运行测试的并行进程创建和迁移测试数据库。测试数据库会附加一个每个进程唯一的进程标记。例如，如果你有两个并行测试进程，Laravel 将创建并使用 `your_db_test_1` 和 `your_db_test_2` 测试数据库。

默认情况下，测试数据库在调用 `test` Artisan 命令后会保留下来，以便后续的 `test` 调用再次使用。然而，你可以使用 `--recreate-databases` 选项重新创建它们：

```shell
php artisan test --parallel --recreate-databases
```

#### 并行测试钩子

有时，你可能需要准备你的应用程序测试中使用的某些资源，以便它们可以安全地由多个测试进程使用。

使用 `ParallelTesting` facade，你可以指定代码在进程或测试用例的 `setUp` 和 `tearDown` 时执行。给定的闭包接收 `$token` 和 `$testCase` 变量，分别包含进程标记和当前测试用例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\ServiceProvider;
use PHPUnit\Framework\TestCase;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        ParallelTesting::setUpProcess(function (int $token) {
            // ...
        });

        ParallelTesting::setUpTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        // 当创建测试数据库时执行...
        ParallelTesting::setUpTestDatabase(function (string $database, int $token) {
            Artisan::call('db:seed');
        });

        ParallelTesting::tearDownTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        ParallelTesting::tearDownProcess(function (int $token) {
            // ...
        });
    }
}
```

#### 访问并行测试标记

如果你想要在你的应用程序测试代码的任何其他位置访问当前并行进程的 "token"，你可以使用 `token` 方法。此标记是单个测试进程的唯一字符串标识符，可用于在并行测试进程中分段资源。例如，Laravel 自动将此标记追加到每个并行测试进程创建的测试数据库的末尾：

```php
$token = ParallelTesting::token();
```

### 报告测试覆盖率

> [!WARNING]  
> 此功能需要 [Xdebug](https://xdebug.org) 或 [PCOV](https://pecl.php.net/package/pcov)。

在运行应用程序测试时，你可能想要确定你的测试案例是否真正覆盖了应用程序代码以及运行测试时使用了多少应用程序代码。为此，你可以在调用 `test` 命令时提供 `--coverage` 选项：

```shell
php artisan test --coverage
```

#### 强制执行最低覆盖率阈值

你可以使用 `--min` 选项为你的应用程序定义最低测试覆盖率阈值。如果没有达到此阈值，则测试套件将失败：

```shell
php artisan test --coverage --min=80.3
```

### 分析测试

Artisan 测试运行器还包括一个方便的机制，用于列出应用程序中最慢的测试。使用 `--profile` 选项调用 `test` 命令，将显示你十个最慢的测试，使你可以轻松调查哪些测试可以改进以加快测试套件的速度：

```shell
php artisan test --profile
```
