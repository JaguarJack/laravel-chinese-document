---
title: Laravel Dusk
---

# Laravel Dusk

[[toc]]

## 介绍

[Laravel Dusk](https://github.com/laravel/dusk) 提供了一个表达式丰富、易于使用的浏览器自动化和测试 API。默认情况下，Dusk 不要求您在本地计算机上安装 JDK 或 Selenium。相反，Dusk 使用一个独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装。然而，您也可以自由使用任何其他兼容 Selenium 的驱动。

## 安装

要开始，您应该安装 [Google Chrome](https://www.google.com/chrome) 并添加 `laravel/dusk` Composer 依赖到您的项目中：

```
composer require laravel/dusk --dev
```

> [!WARNING]  
> 如果您手动注册了 Dusk 的服务提供者，您应该 **永远不会** 在生产环境中注册它，因为这样做可能会导致任意用户能够对您的应用程序进行身份验证。

在安装 Dusk 包之后，执行 `dusk:install` Artisan 命令。`dusk:install` 命令将会创建一个 `tests/Browser` 目录、一个示例 Dusk 测试，并将 Chrome 驱动程序的二进制文件安装到您的操作系统中：

```
php artisan dusk:install
```

接下来，在您应用程序的 `.env` 文件中设置 `APP_URL` 环境变量。这个值应该与您在浏览器中访问应用程序时使用的 URL 匹配。

> [!NOTE]  
> 如果您正在使用 [Laravel Sail](/docs/11/packages/sail) 来管理您的本地开发环境，请也查阅 Sail 文档关于 [配置和运行 Dusk 测试](/docs/11/packages/sail#laravel-dusk)。

### 管理 Chrome 驱动安装

如果您希望安装一个与 Laravel Dusk 通过 `dusk:install` 命令安装的 ChromeDriver 不同版本，您可以使用 `dusk:chrome-driver` 命令：

```
# 为您的操作系统安装最新版本的 ChromeDriver...
php artisan dusk:chrome-driver

# 为您的操作系统安装指定版本的 ChromeDriver...
php artisan dusk:chrome-driver 86

# 为所有支持的操作系统安装给定版本的 ChromeDriver...
php artisan dusk:chrome-driver --all

# 安装与您操作系统上检测到的 Chrome / Chromium 版本相匹配的 ChromeDriver 版本...
php artisan dusk:chrome-driver --detect
```

> [!WARNING]  
> Dusk 要求 `chromedriver` 二进制文件是可执行的。如果您在运行 Dusk 时遇到问题，您应该确保这些二进制文件是可执行的，使用以下命令：`chmod -R 0755 vendor/laravel/dusk/bin/`。

### 使用其他浏览器

默认情况下，Dusk 使用 Google Chrome 和一个独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装来运行您的浏览器测试。然而，您也可以启动自己的 Selenium 服务器并对您想要的任何浏览器运行测试。

要开始，请打开您的 `tests/DuskTestCase.php` 文件，这是您应用程序的基础 Dusk 测试用例。在这个文件中，您可以移除对 `startChromeDriver` 方法的调用。这会阻止 Dusk 自动启动 ChromeDriver：

```php
/**
 * 为 Dusk 测试执行准备。
 *
 * @beforeClass
 */
public static function prepare(): void
{
    // static::startChromeDriver();
}
```

接下来，您可以修改 `driver` 方法以连接到您选择的 URL 和端口。此外，您可以修改应传递给 WebDriver 的“期望能力”：

```php
use Facebook\WebDriver\Remote\RemoteWebDriver;

/**
 * 创建 RemoteWebDriver 实例。
 */
protected function driver(): RemoteWebDriver
{
    return RemoteWebDriver::create(
        'http://localhost:4444/wd/hub', DesiredCapabilities::phantomjs()
    );
}
```

## 入门

### 生成测试

要生成 Dusk 测试，使用 `dusk:make` Artisan 命令。生成的测试将被放置在 `tests/Browser` 目录中：

```
php artisan dusk:make LoginTest
```

### 在每个测试之后重置数据库

您编写的大多数测试都将与从应用程序数据库检索数据的页面进行交互；然而，您的 Dusk 测试绝不应该使用 `RefreshDatabase` 特性。`RefreshDatabase` 特性利用数据库事务，这将不会适用或在 HTTP 请求中可用。相反，您有两个选项：`DatabaseMigrations` 特性和 `DatabaseTruncation` 特性。

#### 使用数据库迁移

`DatabaseMigrations` 特性会在每次测试之前运行您的数据库迁移。然而，对于每次测试来说，删除并重新创建数据库表通常比截断表要慢：

```php
<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;

uses(DatabaseMigrations::class);

//
```

> [!WARNING]  
> 当执行 Dusk 测试时，不能使用 SQLite 内存数据库。因为浏览器在它自己的进程中执行，它将无法访问其他进程的内存数据库。

#### 使用数据库截断

`DatabaseTruncation` 特性会在第一个测试上迁移您的数据库，以确保您的数据库表已正确创建。然而，在后续的测试中，数据库的表将简单地被截断——提供了比重新运行所有数据库迁移更快的速度提升：

```php
<?php

use Illuminate\Foundation\Testing\DatabaseTruncation;
use Laravel\Dusk\Browser;

uses(DatabaseTruncation::class);

//
```

默认情况下，这个特性会截断除了 `migrations` 表之外的所有表。如果您想自定义应该截断哪些表，请在您的测试类上定义一个 `$tablesToTruncate` 属性：

> [!NOTE]
> 如果您正在使用 Pest，您应该在基础 `DuskTestCase` 类上或测试文件扩展的任何类上定义属性或方法。

```php
/**
 * 表示应该截断哪些表。
 *
 * @var array
 */
protected $tablesToTruncate = ['users'];
```

或者，您可以在测试类上定义一个 `$exceptTables` 属性以指定哪些表应从截断中排除：

```php
/**
 * 表示应该排除哪些表从截断。
 *
 * @var array
 */
protected $exceptTables = ['users'];
```

要指定应该截断表的数据库连接，您可以在测试类上定义一个 `$connectionsToTruncate` 属性：

```php
/**
 * 表示哪些连接应该有表被截断。
 *
 * @var array
 */
protected $connectionsToTruncate = ['mysql'];
```

如果您想在执行数据库截断之前或之后执行代码，您可以在测试类上定义 `beforeTruncatingDatabase` 或 `afterTruncatingDatabase` 方法：

```php
/**
 * 在开始截断数据库之前应该执行的任何工作。
 */
protected function beforeTruncatingDatabase(): void
{
    //
}

/**
 * 在数据库截断完成后应该执行的任何工作。
 */
protected function afterTruncatingDatabase(): void
{
    //
}
```

### 运行测试

要运行您的浏览器测试，执行 `dusk` Artisan 命令：

```
php artisan dusk
```

如果您在上次运行 `dusk` 命令时测试失败了，您可以通过重新运行失败的测试来节省时间，使用 `dusk:fails` 命令：

```
php artisan dusk:fails
```

`dusk` 命令接受 Pest / PHPUnit 测试运行程序通常接受的任何参数，例如允许您仅运行给定 [组](https://docs.phpunit.de/en/10.5/annotations.html#group) 的测试：

```
php artisan dusk --group=foo
```

````markdown
> [!NOTE]  
> 如果您正在使用 Laravel Sail 来管理您的本地开发环境，请参阅 Sail 文档中关于 [配置和运行 Dusk 测试](/docs/11/packages/sail#laravel-dusk) 的部分。

#### 手动启动 ChromeDriver

默认情况下，Dusk 将自动尝试启动 ChromeDriver。如果这不适用于您的系统，您可以在运行 `dusk` 命令前手动启动 ChromeDriver。如果您选择手动启动 ChromeDriver，您应该注释掉您的 `tests/DuskTestCase.php` 文件中的以下行：

```php
    /**
     * 准备 Dusk 测试执行。
     *
     * @beforeClass
     */
    public static function prepare(): void
    {
        // static::startChromeDriver();
    }
```
````

此外，如果您在 9515 端口以外启动了 ChromeDriver，您应该修改同类中的 `driver` 方法以反映正确的端口：

```php
    use Facebook\WebDriver\Remote\RemoteWebDriver;

    /**
     * 创建 RemoteWebDriver 实例。
     */
    protected function driver(): RemoteWebDriver
    {
        return RemoteWebDriver::create(
            'http://localhost:9515', DesiredCapabilities::chrome()
        );
    }
```

### 环境处理

为了强制 Dusk 在运行测试时使用其自己的环境文件，您应该在项目的根目录创建一个 `.env.dusk.{environment}` 文件。例如，如果您将从本地环境启动 `dusk` 命令，您应该创建一个 `.env.dusk.local` 文件。

运行测试时，Dusk 将备份您的 `.env` 文件并将您的 Dusk 环境重命名为 `.env`。一旦测试完成，您的 `.env` 文件将被恢复。

## 浏览器基础

### 创建浏览器

让我们开始编写一个测试，验证我们是否可以登录到我们的应用程序。生成测试后，我们可以修改它来导航到登录页面，输入一些凭证，并点击 "登录" 按钮。要创建浏览器实例，您可以从您的 Dusk 测试中调用 `browse` 方法：

```php
// 使用 Pest
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;

uses(DatabaseMigrations::class);

test('基本示例', function () {
    $user = User::factory()->create([
        'email' => 'taylor@laravel.com',
    ]);

    $this->browse(function (Browser $browser) use ($user) {
        $browser->visit('/login')
                ->type('email', $user->email)
                ->type('password', 'password')
                ->press('Login')
                ->assertPathIs('/home');
    });
});
```

```php
// 使用 PHPUnit
<?php

namespace Tests\Browser;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    use DatabaseMigrations;

    /**
     * 一个基本的浏览器测试示例。
     */
    public function test_basic_example(): void
    {
        $user = User::factory()->create([
            'email' => 'taylor@laravel.com',
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/login')
                    ->type('email', $user->email)
                    ->type('password', 'password')
                    ->press('Login')
                    ->assertPathIs('/home');
        });
    }
}
```

如上例所示，`browse` 方法接受一个闭包。浏览器实例将自动被 Dusk 传递给这个闭包，它是用来与您的应用程序进行交互和断言的主要对象。

#### 创建多个浏览器

有时您可能需要多个浏览器才能正确地执行测试。例如，多个浏览器可能是测试与 WebSockets 交互的聊天屏幕所需的。要创建多个浏览器，只需在传递给 `browse` 方法的闭包签名中添加更多的浏览器参数：

```php
    $this->browse(function (Browser $first, Browser $second) {
        $first->loginAs(User::find(1))
              ->visit('/home')
              ->waitForText('Message');

        $second->loginAs(User::find(2))
               ->visit('/home')
               ->waitForText('Message')
               ->type('message', 'Hey Taylor')
               ->press('Send');

        $first->waitForText('Hey Taylor')
              ->assertSee('Jeffrey Way');
    });
```

### 导航

`visit` 方法可用于导航到您应用程序中的给定 URI：

```php
    $browser->visit('/login');
```

您可以使用 `visitRoute` 方法导航到一个 [命名路由](/docs/11/basics/routing#named-routes)：

```php
    $browser->visitRoute('login');
```

您可以使用 `back` 和 `forward` 方法来“后退”和“前进”：

```php
    $browser->back();

    $browser->forward();
```

您可以使用 `refresh` 方法刷新页面：

```php
    $browser->refresh();
```

### 调整浏览器窗口大小

您可以使用 `resize` 方法调整浏览器窗口的大小：

```php
    $browser->resize(1920, 1080);
```

`maximize` 方法可用于最大化浏览器窗口：

```php
    $browser->maximize();
```

`fitContent` 方法会调整浏览器窗口的大小以匹配其内容的大小：

```php
    $browser->fitContent();
```

当测试失败时，Dusk 将在截取屏幕截图之前自动调整浏览器以适应内容。你可以通过在你的测试中调用 `disableFitOnFailure` 方法来禁用此功能：

```php
    $browser->disableFitOnFailure();
```

您可以使用 `move` 方法将浏览器窗口移动到屏幕上的其他位置：

```php
    $browser->move($x = 100, $y = 100);
```

### 浏览器宏

如果您想定义一个可以在多个测试中重复使用的自定义浏览器方法，您可以在 `Browser` 类上使用 `macro` 方法。通常，您应该从[服务提供者的](/docs/11/architecture-concepts/providers) `boot` 方法调用此方法：

```php
    <?php

    namespace App\Providers;

    use Illuminate\Support\ServiceProvider;
    use Laravel\Dusk\Browser;

    class DuskServiceProvider extends ServiceProvider
    {
        /**
         * 注册 Dusk 的浏览器宏。
         */
        public function boot(): void
        {
            Browser::macro('scrollToElement', function (string $element = null) {
                $this->script("$('html, body').animate({ scrollTop: $('$element').offset().top }, 0);");

                return $this;
            });
        }
    }
```

`macro` 函数接受一个名称作为其第一个参数，闭包作为第二个参数。当在 `Browser` 实例上调用宏作为方法时，将执行宏的闭包：

```php
    $this->browse(function (Browser $browser) use ($user) {
        $browser->visit('/pay')
                ->scrollToElement('#credit-card-details')
                ->assertSee('输入信用卡详情');
    });
```

````markdown
### 认证

在测试需要认证的页面时，您可以使用 Dusk 的 `loginAs` 方法来避免在每个测试中都与应用程序的登录屏幕进行交互。`loginAs` 方法接受与您的可认证模型相关联的主键或可认证模型实例：

```php
    use App\Models\User;
    use Laravel\Dusk\Browser;

    $this->browse(function (Browser $browser) {
        $browser->loginAs(User::find(1))
                ->visit('/home');
    });
```
````

> [!WARNING]  
> 使用 `loginAs` 方法后，用户会话将在文件中的所有测试中保持。

### Cookies

您可以使用 `cookie` 方法获取或设置加密 Cookie 的值。默认情况下，Laravel 创建的所有 Cookie 都是加密的：

```php
    $browser->cookie('name');

    $browser->cookie('name', 'Taylor');
```

您可以使用 `plainCookie` 方法获取或设置未加密 Cookie 的值：

```php
    $browser->plainCookie('name');

    $browser->plainCookie('name', 'Taylor');
```

您可以使用 `deleteCookie` 方法删除给定的 Cookie：

```php
    $browser->deleteCookie('name');
```

### 执行 JavaScript

您可以使用 `script` 方法在浏览器内执行任意 JavaScript 语句：

```php
    $browser->script('document.documentElement.scrollTop = 0');

    $browser->script([
        'document.body.scrollTop = 0',
        'document.documentElement.scrollTop = 0',
    ]);

    $output = $browser->script('return window.location.pathname');
```

### 截屏

您可以使用 `screenshot` 方法来截取屏幕并用给定的文件名保存。所有的屏幕截图将被保存在 `tests/Browser/screenshots` 目录中：

```php
$browser->screenshot('filename');
```

`responsiveScreenshots` 方法可以用来在不同的断点处截取一系列屏幕截图：

```php
$browser->responsiveScreenshots('filename');
```

`screenshotElement` 方法可用于截取页面上某个特定元素的屏幕截图：

```php
$browser->screenshotElement('#selector', 'filename');
```

### 将控制台输出存储到磁盘

您可以使用 `storeConsoleLog` 方法将当前浏览器的控制台输出写入磁盘，并用给定的文件名保存。控制台输出将被保存在 `tests/Browser/console` 目录中：

```php
$browser->storeConsoleLog('filename');
```

### 将页面源码存储到磁盘

您可以使用 `storeSource` 方法将当前页面的源码写入磁盘，并用给定的文件名保存。页面源码将被保存在 `tests/Browser/source` 目录中：

```php
$browser->storeSource('filename');
```

## 与元素交互

### Dusk 选择器

选择正确的 CSS 选择器来与元素交互是编写 Dusk 测试中最困难的部分之一。随着时间的推移，前端的变化可能会导致下面这样的 CSS 选择器破坏您的测试：

```html
<!-- HTML... -->
<button>Login</button>
```

```php
// Test...
$browser->click('.login-page .container div > button');
```

Dusk 选择器使您能够专注于编写高效的测试，而不是记住 CSS 选择器。要定义选择器，请在 HTML 元素上添加一个 `dusk` 属性。然后，在与 Dusk 浏览器交互时，用 `@` 前缀选择器来操作测试中的元素：

```html
<!-- HTML... -->
<button dusk="login-button">Login</button>
```

```php
// Test...
$browser->click('@login-button');
```

如果需要，您可以通过 `selectorHtmlAttribute` 方法自定义 Dusk 选择器所使用的 HTML 属性。通常，这个方法应该从应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Laravel\Dusk\Dusk;

Dusk::selectorHtmlAttribute('data-dusk');
```

### 文本、值和属性

#### 检索和设置值

Dusk 提供了几种方法来与页面上的当前值、显示文本和元素属性进行交互。例如，要获取与给定 CSS 或 Dusk 选择器匹配的元素的 "value"，请使用 `value` 方法：

```php
// 检索值...
$value = $browser->value('selector');

// 设置值...
$browser->value('selector', 'value');
```

您可以使用 `inputValue` 方法获取具有给定字段名称的输入元素的 "value"：

```php
$value = $browser->inputValue('field');
```

#### 检索文本

`text` 方法可用于检索与给定选择器匹配的元素的显示文本：

```php
$text = $browser->text('selector');
```

#### 检索属性

最后，`attribute` 方法可用于检索与给定选择器匹配的元素的属性值：

```php
$attribute = $browser->attribute('selector', 'value');
```

### 与表单交互

#### 输入值

Dusk 提供了多种与表单和输入元素交互的方法。首先，让我们看一个在输入字段中输入文本的示例：

```php
$browser->type('email', 'taylor@laravel.com');
```

请注意，尽管必要时该方法会接收一个 CSS 选择器，但我们并不需要将 CSS 选择器传递给 `type` 方法。如果没有提供 CSS 选择器，Dusk 将搜索具有给定 `name` 属性的 `input` 或 `textarea` 字段。

要在不清除其内容的情况下追加文本到字段中，您可以使用 `append` 方法：

```php
$browser->type('tags', 'foo')
        ->append('tags', ', bar, baz');
```

您可以使用 `clear` 方法清除输入框的值：

```php
$browser->clear('email');
```

您可以指示 Dusk 使用 `typeSlowly` 方法缓慢地输入。默认情况下，Dusk 在按键之间会暂停 100 毫秒。要自定义按键之间的时间间隔，您可以将适当的毫秒数作为方法的第三个参数传递：

```php
$browser->typeSlowly('mobile', '+1 (202) 555-5555');

$browser->typeSlowly('mobile', '+1 (202) 555-5555', 300);
```

您可以使用 `appendSlowly` 方法缓慢追加文本：

```php
$browser->type('tags', 'foo')
        ->appendSlowly('tags', ', bar, baz');
```

#### 下拉菜单

要选择 `select` 元素上可用的值，您可以使用 `select` 方法。与 `type` 方法类似，`select` 方法不需要完整的 CSS 选择器。当向 `select` 方法传递值时，您应该传递底层选项值而不是显示文本：

```php
$browser->select('size', 'Large');
```

您可以通过省略第二个参数来选择一个随机选项：

```php
$browser->select('size');
```

通过向 `select` 方法提供一个数组作为第二个参数，您可以指示该方法选择多个选项：

```php
$browser->select('categories', ['Art', 'Music']);
```

#### 复选框

要勾选某个复选框输入项，您可以使用 `check` 方法。与许多其他输入相关的方法一样，不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 将搜索具有匹配 `name` 属性的复选框：

```php
$browser->check('terms');
```

`uncheck` 方法可用于取消勾选复选框输入项：

```php
$browser->uncheck('terms');
```

#### 单选按钮

要选中 `radio` 输入项的某个选项，您可以使用 `radio` 方法。与许多其他输入相关的方法一样，不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 将搜索具有匹配 `name` 和 `value` 属性的 `radio` 输入项：

```php
$browser->radio('size', 'large');
```

### 附加文件

`attach` 方法可以用于将文件附加到 `file` 输入元素上。与许多其他输入相关的方法一样，不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 将搜索具有匹配 `name` 属性的 `file` 输入项：

```php
$browser->attach('photo', __DIR__.'/photos/mountains.png');
```

> [!WARNING]  
> `attach` 函数要求您的服务器上安装并启用了 `Zip` PHP 扩展。

### 点击按钮

`press` 方法可用于点击页面上的按钮元素。传递给 `press` 方法的参数可以是按钮的显示文本或者 CSS/Dusk 选择器：

```php
$browser->press('Login');
```

在提交表单时，许多应用程序在按下表单的提交按钮后会禁用它，然后在表单提交的 HTTP 请求完成后重新启用按钮。要按下一个按钮并等待该按钮被重新启用，您可以使用 `pressAndWaitFor` 方法：

```php
// 按下按钮并等待最多5秒钟直到它被启用...
$browser->pressAndWaitFor('Save');

// 按下按钮并等待最多1秒钟直到它被启用...
$browser->pressAndWaitFor('Save', 1);
```

### 点击链接

要点击链接，您可以在浏览器实例上使用 `clickLink` 方法。`clickLink` 方法将点击具有给定显示文本的链接：

```php
$browser->clickLink($linkText);
```

您可以使用 `seeLink` 方法确定页面上是否可见具有给定显示文本的链接：

```php
if ($browser->seeLink($linkText)) {
    // ...
}
```

> [!WARNING]  
> 这些方法与 jQuery 交互。如果页面上没有可用的 jQuery，Dusk 将自动将其注入到页面中，以便在测试期间使用。

### 使用键盘

`keys` 方法允许您向给定元素提供比 `type` 方法通常允许的更复杂的输入序列。例如，您可以指导 Dusk 在输入值时按住修改键。在这个例子中，`shift` 键将被按住，同时将 `taylor` 输入到匹配给定选择器的元素中。在输入 `taylor` 之后，将在没有任何修改键的情况下输入 `swift`：

```php
$browser->keys('selector', ['{shift}', 'taylor'], 'swift');
```

`keys` 方法的另一个有价值的用法是向您应用程序的主 CSS 选择器发送“键盘快捷键”组合：

```php
$browser->keys('.app', ['{command}', 'j']);
```

> [!WARNING]  
> 所有的修改键如 `{command}` 都被包裹在 `{}` 字符中，并且与 `Facebook\WebDriver\WebDriverKeys` 类中定义的常量匹配，可以在 [GitHub 上找到](https://github.com/php-webdriver/php-webdriver/blob/master/lib/WebDriverKeys.php)。

#### 流畅的键盘交互

Dusk 还提供了 `withKeyboard` 方法，允许您通过 `Laravel\Dusk\Keyboard` 类流畅地执行复杂的键盘交互。`Keyboard` 类提供了 `press`、`release`、`type` 和 `pause` 方法：

```php
use Laravel\Dusk\Keyboard;

$browser->withKeyboard(function (Keyboard $keyboard) {
    $keyboard->press('c')
        ->pause(1000)
        ->release('c')
        ->type(['c', 'e', 'o']);
});
```

#### 键盘宏

如果您想定义可以在整个测试套件中轻松重用的自定义键盘交互，您可以使用 `Keyboard` 类提供的 `macro` 方法。通常，您应该从[服务提供者的](/docs/11/architecture-concepts/providers) `boot` 方法中调用此方法：

```php
<?php

namespace App\Providers;

use Facebook\WebDriver\WebDriverKeys;
use Illuminate\Support\ServiceProvider;
use Laravel\Dusk\Keyboard;
use Laravel\Dusk\OperatingSystem;

class DuskServiceProvider extends ServiceProvider
{
    /**
     * 注册 Dusk 的浏览器宏。
     */
    public function boot(): void
    {
        Keyboard::macro('copy', function (string $element = null) {
            $this->type([
                OperatingSystem::onMac() ? WebDriverKeys::META : WebDriverKeys::CONTROL, 'c',
            ]);

            return $this;
        });

        Keyboard::macro('paste', function (string $element = null) {
            $this->type([
                OperatingSystem::onMac() ? WebDriverKeys::META : WebDriverKeys::CONTROL, 'v',
            ]);

            return $this;
        });
    }
}
```

`macro` 函数接受一个名称作为它的第一个参数和一个闭包作为第二个。在 `Keyboard` 实例上调用宏作为方法时，会执行宏的闭包：

```php
$browser->click('@textarea')
    ->withKeyboard(fn (Keyboard $keyboard) => $keyboard->copy())
    ->click('@another-textarea')
    ->withKeyboard(fn (Keyboard $keyboard) => $keyboard->paste());
```

### 使用鼠标

#### 点击元素

`click` 方法可用于点击匹配给定 CSS 或 Dusk 选择器的元素：

```php
$browser->click('.selector');
```

`clickAtXPath` 方法可用于点击匹配给定 XPath 表达式的元素：

```php
$browser->clickAtXPath('//div[@class = "selector"]');
```

`clickAtPoint` 方法可用于点击相对于浏览器可视区域的一对坐标上的最顶层元素：

```php
$browser->clickAtPoint($x = 0, $y = 0);
```

`doubleClick` 方法可用于模拟鼠标的双击操作：

```php
$browser->doubleClick();

$browser->doubleClick('.selector');
```

`rightClick` 方法可用于模拟鼠标的右击操作：

```php
$browser->rightClick();

$browser->rightClick('.selector');
```

`clickAndHold` 方法可用于模拟鼠标按钮被点击并按住不放。随后调用 `releaseMouse` 方法会撤消此行为并释放鼠标按钮：

```php
$browser->clickAndHold('.selector');

$browser->clickAndHold()
        ->pause(1000)
        ->releaseMouse();
```

`controlClick` 方法可用于模拟浏览器内的 `ctrl+click` 事件：

```php
$browser->controlClick();

$browser->controlClick('.selector');
```

#### Mouseover

当您需要将鼠标移到与给定 CSS 或 Dusk 选择器匹配的元素上方时，可以使用 `mouseover` 方法：

```php
$browser->mouseover('.selector');
```

#### 拖放

`drag` 方法可用于将匹配给定选择器的元素拖动到另一个元素上：

```php
$browser->drag('.from-selector', '.to-selector');
```

或者，您可以将元素拖动到单个方向：

```php
$browser->dragLeft('.selector', $pixels = 10);
$browser->dragRight('.selector', $pixels = 10);
$browser->dragUp('.selector', $pixels = 10);
$browser->dragDown('.selector', $pixels = 10);
```

最后，您可以按给定偏移量拖动元素：

```php
$browser->dragOffset('.selector', $x = 10, $y = 10);
```

### JavaScript 对话框

Dusk 提供了各种方法来与 JavaScript 对话框交互。例如，您可以使用 `waitForDialog` 方法等待 JavaScript 对话框出现。此方法接受一个可选参数，指示等待对话框出现的秒数：

```php
$browser->waitForDialog($seconds = null);
```

`assertDialogOpened` 方法可用于断言对话框已显示并包含给定的消息：

```php
$browser->assertDialogOpened('Dialog message');
```

如果 JavaScript 对话框包含提示信息，则可以使用 `typeInDialog` 方法在提示框中输入值：

```php
$browser->typeInDialog('Hello World');
```

要通过点击 "确定" 按钮关闭开启的 JavaScript 对话框，您可以调用 `acceptDialog` 方法：

```php
$browser->acceptDialog();
```

要通过点击 "取消" 按钮关闭开启的 JavaScript 对话框，您可以调用 `dismissDialog` 方法：

```php
$browser->dismissDialog();
```

### 与内联框架交互

如果您需要与 iframe 中的元素进行交互，您可以使用 `withinFrame` 方法。在提供给 `withinFrame` 方法的闭包中进行的所有元素交互都将限定在指定的 iframe 上下文中：

```php
$browser->withinFrame('#credit-card-details', function ($browser) {
    $browser->type('input[name="cardnumber"]', '4242424242424242')
            ->type('input[name="exp-date"]', '12/24')
            ->type('input[name="cvc"]', '123');
    })->press('Pay');
```

### 选择器作用域

有时您可能希望在给定的选择器作用域内执行多个操作。例如，您可能希望断言某些文本仅存在于表格中然后点击该表格中的按钮。您可以使用 `with` 方法来实现这一点。给定给 `with` 方法的闭包中执行的所有操作都将限定在原始选择器内：

```php
$browser->with('.table', function (Browser $table) {
    $table->assertSee('Hello World')
          ->clickLink('Delete');
});
```

您可能偶尔需要在当前作用域之外执行断言。您可以使用 `elsewhere` 和 `elsewhereWhenAvailable` 方法来实现这一点：

```php
$browser->with('.table', function (Browser $table) {
    // 当前作用域是 `body .table`...

    $browser->elsewhere('.page-title', function (Browser $title) {
        // 当前作用域是 `body .page-title`...
        $title->assertSee('Hello World');
    });

    $browser->elsewhereWhenAvailable('.page-title', function (Browser $title) {
        // 当前作用域是 `body .page-title`...
        $title->assertSee('Hello World');
    });
});
```

### 等待元素

在测试广泛使用 JavaScript 的应用程序时，往往需要“等待”某些元素或数据可用后再继续进行测试。Dusk 使这变得简单。使用多种方法，您可以等待元素在页面上可见，甚至等到一个给定的 JavaScript 表达式返回 `true`。

#### 等待

如果您只是需要暂停测试一定的毫秒数，请使用 `pause` 方法：

```php
$browser->pause(1000);
```

如果您需要在给定条件为 `true` 时才暂停测试，请使用 `pauseIf` 方法：

```php
$browser->pauseIf(App::environment('production'), 1000);
```

同样地，如果您需要除了在给定条件为 `true` 时才暂停测试，您可以使用 `pauseUnless` 方法：

```php
$browser->pauseUnless(App::environment('testing'), 1000);
```

#### 等待选择器

`waitFor` 方法可用于暂停测试的执行，直到页面上显示与给定的 CSS 或 Dusk 选择器匹配的元素。默认情况下，该方法将在抛出异常前最多暂停测试五秒钟。如有必要，您可以将一个自定义的超时阈值作为第二个参数传递给该方法：

```php
// 等待最多五秒选择器...
$browser->waitFor('.selector');

// 等待最多一秒选择器...
$browser->waitFor('.selector', 1);
```

您也可以等到与给定选择器匹配的元素包含给定文本：

```php
// 等待最多五秒选择器包含给定文本...
$browser->waitForTextIn('.selector', 'Hello World');

// 等待最多一秒选择器包含给定文本...
$browser->waitForTextIn('.selector', 'Hello World', 1);
```

您还可以等到与给定选择器匹配的元素从页面中消失：

```php
// 等待最多五秒直到选择器消失...
$browser->waitUntilMissing('.selector');

// 等待最多一秒直到选择器消失...
$browser->waitUntilMissing('.selector', 1);
```

或者，您可以等到与给定选择器匹配的元素启用或禁用：

```php
// 等待最多五秒直到选择器启用...
$browser->waitUntilEnabled('.selector');

// 等待最多一秒直到选择器启用...
$browser->waitUntilEnabled('.selector', 1);

// 等待最多五秒直到选择器禁用...
$browser->waitUntilDisabled('.selector');

// 等待最多一秒直到选择器禁用...
$browser->waitUntilDisabled('.selector', 1);
```

#### 当可用时作用域选择器

有时您可能希望等待一个元素出现，该元素与给定的选择器匹配，然后与该元素进行交互。例如，您可能希望等到模态窗口可用然后在模态窗口中按下“确定”按钮。`whenAvailable` 方法可用于实现此目的。在给定的闭包中执行的所有元素操作都将限定在原始选择器内：

```php
$browser->whenAvailable('.modal', function (Browser $modal) {
    $modal->assertSee('Hello World')
          ->press('OK');
});
```

#### 等待文本

`waitForText` 方法可用于等待给定文本在页面上显示：

```php
// 等待最多五秒文本...
$browser->waitForText('Hello World');

// 等待最多一秒文本...
$browser->waitForText('Hello World', 1);
```

您可以使用 `waitUntilMissingText` 方法等待显示的文本从页面上移除：

```php
// 等待最多五秒文本被移除...
$browser->waitUntilMissingText('Hello World');

// 等待最多一秒文本被移除...
$browser->waitUntilMissingText('Hello World', 1);
```

#### 等待链接

`waitForLink` 方法可用于等待页面上显示给定的链接文本：

```php
// 等待最多五秒链接...
$browser->waitForLink('Create');

// 等待最多一秒链接...
$browser->waitForLink('Create', 1);
```

#### 等待输入框

`waitForInput` 方法可用于等待给定的输入字段在页面上可见：

```php
// 等待最多五秒输入...
$browser->waitForInput($field);

// 等待最多一秒输入...
$browser->waitForInput($field, 1);
```

#### 等待页面位置

当进行路径断言，例如 `$browser->assertPathIs('/home')` 时，如果 `window.location.pathname` 是异步更新的，断言可能会失败。您可以使用 `waitForLocation` 方法等待位置变为给定值：

```php
$browser->waitForLocation('/secret');
```

`waitForLocation` 方法也可用于等待当前窗口位置是一个完全限定的 URL：

```php
$browser->waitForLocation('https://example.com/path');
```

您也可以等待一个[命名路由的](/docs/11/basics/routing#named-routes)位置：

```php
$browser->waitForRoute($routeName, $parameters);
```

#### 等待页面重载

如果您需要在执行操作后等待页面重载，请使用 `waitForReload` 方法：

```php
use Laravel\Dusk\Browser;

$browser->waitForReload(function (Browser $browser) {
    $browser->press('Submit');
})
->assertSee('Success!');
```

由于需要等待页面重载通常发生在点击按钮之后，您可以为了方便使用 `clickAndWaitForReload` 方法：

```php
$browser->clickAndWaitForReload('.selector')
        ->assertSee('something');
```

#### 等待 JavaScript 表达式

有时您可能希望暂停测试的执行，直到给定的 JavaScript 表达式评估为 `true`。您可以使用 `waitUntil` 方法轻松实现这一点。向该方法传递一个表达式时，您不需要包含 `return` 关键字或结束分号：

```php
// 等待最多五秒直到表达式为真...
$browser->waitUntil('App.data.servers.length > 0');

// 等待最多一秒直到表达式为真...
$browser->waitUntil('App.data.servers.length > 0', 1);
```

#### 等待 Vue 表达式

`waitUntilVue` 和 `waitUntilVueIsNot` 方法可用于等待 [Vue 组件](https://vuejs.org) 属性具有给定值：

```php
// 等待组件属性包含给定值...
$browser->waitUntilVue('user.name', 'Taylor', '@user');

// 等待组件属性不包含给定值...
$browser->waitUntilVueIsNot('user.name', null, '@user');
```

#### 等待 JavaScript 事件

`waitForEvent` 方法可用于暂停测试执行，直到发生 JavaScript 事件：

```php
$browser->waitForEvent('load');
```

事件监听器默认附加到当前作用域，即 `body` 元素。使用作用域选择器时，事件监听器将附加到匹配的元素：

```php
$browser->with('iframe', function (Browser $iframe) {
    // 等待 iframe 的 load 事件...
    $iframe->waitForEvent('load');
});
```

您也可以将选择器作为第二个参数提供给 `waitForEvent` 方法，将事件监听器附加到特定元素：

```php
$browser->waitForEvent('load', '.selector');
```

您还可以等待 `document` 和 `window` 对象上的事件：

```php
// 等待文档被滚动...
$browser->waitForEvent('scroll', 'document');

// 等待最多五秒直到窗口被调整大小...
$browser->waitForEvent('resize', 'window', 5);
```

#### 使用回调等待

Dusk 中的许多 "等待" 方法依赖于底层的 `waitUsing` 方法。您可以直接使用这个方法等待给定的闭包返回 `true`。`waitUsing` 方法接受等待的最大秒数、评估闭包的间隔、闭包和一个可选的失败消息：

```php
$browser->waitUsing(10, 1, function () use ($something) {
    return $something->isReady();
}, "Something wasn't ready in time.");
```

### 滚动元素进入视图

有时您可能无法点击元素，因为它在浏览器的可视区域之外。`scrollIntoView` 方法将滚动浏览器窗口，直到给定选择器的元素在视图内：

```php
$browser->scrollIntoView('.selector')
        ->click('.selector');
```

## 可用断言

Dusk 提供了多种断言，你可以在你的应用程序中使用。所有可用的断言都记录在下面的列表中：

```plaintext
assertTitle
assertTitleContains
assertUrlIs
assertSchemeIs
assertSchemeIsNot
assertHostIs
assertHostIsNot
assertPortIs
assertPortIsNot
assertPathBeginsWith
assertPathIs
assertPathIsNot
assertRouteIs
assertQueryStringHas
assertQueryStringMissing
assertFragmentIs
assertFragmentBeginsWith
assertFragmentIsNot
assertHasCookie
assertHasPlainCookie
assertCookieMissing
assertPlainCookieMissing
assertCookieValue
assertPlainCookieValue
assertSee
assertDontSee
assertSeeIn
assertDontSeeIn
assertSeeAnythingIn
assertSeeNothingIn
assertScript
assertSourceHas
assertSourceMissing
assertSeeLink
assertDontSeeLink
assertInputValue
assertInputValueIsNot
assertChecked
assertNotChecked
assertIndeterminate
assertRadioSelected
assertRadioNotSelected
assertSelected
assertNotSelected
assertSelectHasOptions
assertSelectMissingOptions
assertSelectHasOption
assertSelectMissingOption
assertValue
assertValueIsNot
assertAttribute
assertAttributeContains
assertAttributeDoesntContain
assertAriaAttribute
assertDataAttribute
assertVisible
assertPresent
assertNotPresent
assertMissing
assertInputPresent
assertInputMissing
assertDialogOpened
assertEnabled
assertDisabled
assertButtonEnabled
assertButtonDisabled
assertFocused
assertNotFocused
assertAuthenticated
assertGuest
assertAuthenticatedAs
assertVue
assertVueIsNot
assertVueContains
assertVueDoesntContain
```

#### assertTitle

断言页面标题与给定文本匹配：

```php
$browser->assertTitle($title);
```

#### assertTitleContains

断言页面标题包含给定文本：

```php
$browser->assertTitleContains($title);
```

#### assertUrlIs

断言当前 URL（不包含查询字符串）与给定字符串匹配：

```php
$browser->assertUrlIs($url);
```

#### assertSchemeIs

断言当前 URL 的协议与给定协议匹配：

```php
$browser->assertSchemeIs($scheme);
```

#### assertSchemeIsNot

断言当前 URL 的协议不匹配给定协议：

```php
$browser->assertSchemeIsNot($scheme);
```

#### assertHostIs

断言当前 URL 的主机名与给定主机名匹配：

```php
$browser->assertHostIs($host);
```

#### assertHostIsNot

断言当前 URL 的主机名不匹配给定主机名：

```php
$browser->assertHostIsNot($host);
```

#### assertPortIs

断言当前 URL 的端口与给定端口匹配：

```php
$browser->assertPortIs($port);
```

#### assertPortIsNot

断言当前 URL 的端口不匹配给定端口：

```php
$browser->assertPortIsNot($port);
```

#### assertPathBeginsWith

断言当前 URL 的路径以给定路径开头：

```php
$browser->assertPathBeginsWith('/home');
```

#### assertPathIs

断言当前路径与给定路径匹配：

```php
$browser->assertPathIs('/home');
```

#### assertPathIsNot

断言当前路径与给定路径不匹配：

```php
$browser->assertPathIsNot('/home');
```

<!-- ... more assertions ... -->

#### assertInputValue

断言给定的输入字段有给定的值：

```php
$browser->assertInputValue($field, $value);
```

#### assertInputValueIsNot

断言给定的输入字段没有给定的值：

```php
$browser->assertInputValueIsNot($field, $value);
```

#### assertChecked

断言给定的复选框已选中：

```php
$browser->assertChecked($field);
```

#### assertNotChecked

断言给定的复选框未选中：

```php
$browser->assertNotChecked($field);
```

#### assertIndeterminate

断言给定的复选框处于不确定状态：

```php
$browser->assertIndeterminate($field);
```

#### assertRadioSelected

断言给定的单选字段已选中：

```php
$browser->assertRadioSelected($field, $value);
```

#### assertRadioNotSelected

断言给定的单选字段未选中：

```php
$browser->assertRadioNotSelected($field, $value);
```

#### assertSelected

断言给定的下拉菜单已选中给定的值：

```php
$browser->assertSelected($field, $value);
```

#### assertNotSelected

断言给定的下拉菜单未选中给定的值：

```php
$browser->assertNotSelected($field, $value);
```

#### assertSelectHasOptions

断言有一组给定的值可以被选中：

```php
$browser->assertSelectHasOptions($field, $values);
```

#### assertSelectMissingOptions

断言有一组给定的值不能被选中：

```php
$browser->assertSelectMissingOptions($field, $values);
```

#### assertSelectHasOption

断言给定的值可以在给定的字段被选中：

```php
$browser->assertSelectHasOption($field, $value);
```

#### assertSelectMissingOption

断言给定的值不能被选中：

```php
$browser->assertSelectMissingOption($field, $value);
```

#### assertValue

断言匹配给定选择器的元素具有给定的值：

```php
$browser->assertValue($selector, $value);
```

#### assertValueIsNot

断言匹配给定选择器的元素不具有给定的值：

```php
$browser->assertValueIsNot($selector, $value);
```

#### assertAttribute

断言匹配给定选择器的元素在提供的属性中具有给定的值：

```php
$browser->assertAttribute($selector, $attribute, $value);
```

#### assertAttributeContains

断言匹配给定选择器的元素在提供的属性中包含给定的值：

```php
$browser->assertAttributeContains($selector, $attribute, $value);
```

#### assertAttributeDoesntContain

断言匹配给定选择器的元素在提供的属性中不包含给定的值：

```php
$browser->assertAttributeDoesntContain($selector, $attribute, $value);
```

#### assertAriaAttribute

断言匹配给定选择器的元素在提供的 aria 属性中具有给定的值：

```php
$browser->assertAriaAttribute($selector, $attribute, $value);
```

例如，给定标记 `<button aria-label="Add"></button>`，你可以这样对 `aria-label` 属性进行断言：

```php
$browser->assertAriaAttribute('button', 'label', 'Add')
```

#### assertDataAttribute

断言匹配给定选择器的元素在提供的 data 属性中具有给定的值：

```php
$browser->assertDataAttribute($selector, $attribute, $value);
```

例如，给定标记 `<tr id="row-1" data-content="attendees"></tr>`，你可以这样对 `data-label` 属性进行断言：

```php
$browser->assertDataAttribute('#row-1', 'content', 'attendees')
```

#### assertVisible

断言匹配给定选择器的元素可见：

```php
$browser->assertVisible($selector);
```

#### assertPresent

断言匹配给定选择器的元素在源代码中存在：

```php
$browser->assertPresent($selector);
```

#### assertNotPresent

断言匹配给定选择器的元素在源代码中不存在：

```php
$browser->assertNotPresent($selector);
```

#### assertMissing

断言匹配给定选择器的元素不可见：

```php
$browser->assertMissing($selector);
```

#### assertInputPresent

断言具有给定名称的输入存在：

```php
$browser->assertInputPresent($name);
```

#### assertInputMissing

断言源代码中不存在具有给定名称的输入：

```php
$browser->assertInputMissing($name);
```

#### assertDialogOpened

断言已打开具有给定消息的 JavaScript 对话框：

```php
$browser->assertDialogOpened($message);
```

#### assertEnabled

断言给定字段已启用：

```php
$browser->assertEnabled($field);
```

#### assertDisabled

断言给定字段已禁用：

```php
$browser->assertDisabled($field);
```

#### assertButtonEnabled

断言给定按钮已启用：

```php
$browser->assertButtonEnabled($button);
```

#### assertButtonDisabled

断言给定按钮已禁用：

```php
$browser->assertButtonDisabled($button);
```

#### assertFocused

断言给定字段已聚焦：

```php
$browser->assertFocused($field);
```

#### assertNotFocused

断言给定字段未聚焦：

```php
$browser->assertNotFocused($field);
```

#### assertAuthenticated

断言用户已认证：

```php
$browser->assertAuthenticated();
```

#### assertGuest

断言用户未认证：

```php
$browser->assertGuest();
```

#### assertAuthenticatedAs

断言用户被认证为给定用户：

```php
$browser->assertAuthenticatedAs($user);
```

#### assertVue

Dusk 甚至允许你对 [Vue 组件](https://vuejs.org) 数据的状态进行断言。例如，假设你的应用包含以下 Vue 组件：

```html
// HTML...

<profile dusk="profile-component"></profile>

// 组件定义... Vue.component('profile', { template: '
<div>{{ user.name }}</div>
', data: function () { return { user: { name: 'Taylor' } }; } });
```

你可以这样对 Vue 组件的状态进行断言：

```php
// Pest 测试
test('vue', function () {
    $this->browse(function (Browser $browser) {
        $browser->visit('/')
                ->assertVue('user.name', 'Taylor', '@profile-component');
    });
});

// PHPUnit 测试
/**
 * 一个基本的 Vue 测试示例。
 */
public function test_vue(): void
{
    $this->browse(function (Browser $browser) {
        $browser->visit('/')
                ->assertVue('user.name', 'Taylor', '@profile-component');
    });
}
```

#### assertVueIsNot

断言给定 Vue 组件的数据属性不匹配给定的值：

```php
$browser->assertVueIsNot($property, $value, $componentSelector = null);
```

#### assertVueContains

断言给定 Vue 组件的数据属性是数组且包含给定的值：

```php
$browser->assertVueContains($property, $value, $componentSelector = null);
```

#### assertVueDoesntContain

断言给定 Vue 组件的数据属性是数组且不包含给定的值：

```php
$browser->assertVueDoesntContain($property, $value, $componentSelector = null);
```

## Pages

有时，测试需要按顺序执行几个复杂的动作。这可能会使你的测试难以阅读和理解。Dusk Pages 允许你定义可以通过单一方法在给定页面上执行的表达动作。Pages 还允许你为应用的常用选择器或单个页面定义快捷方式。

### Generating Pages

要生成页面对象，执行 `dusk:page` Artisan 命令。所有页面对象将放置在你应用的 `tests/Browser/Pages` 目录中：

```shell
php artisan dusk:page Login
```

### Configuring Pages

默认情况下，页面有三个方法：`url`、`assert` 和 `elements`。我们现在将讨论 `url` 和 `assert` 方法。`elements` 方法将在[下面更详细地讨论](#shorthand-selectors)。

#### The `url` Method

`url` 方法应返回表示页面的 URL 路径。Dusk 将使用此 URL 在浏览器中导航到页面：

```php
/**
 * 获取页面的 URL。
 */
public function url(): string
{
    return '/login';
}
```

#### The `assert` Method

`assert` 方法可能需要进行任何必要的断言来验证浏览器实际上是否在给定页面。这个方法实际上并不需要放置任何东西；但是，如果你愿意，你可以自由进行这些断言。这些断言将在导航到页面时自动运行：

```php
/**
 * 断言浏览器在页面上。
 */
public function assert(Browser $browser): void
{
    $browser->assertPathIs($this->url());
}
```

### Navigating to Pages

一旦定义了页面，你可以使用 `visit` 方法导航到它：

```php
use Tests\Browser\Pages\Login;

$browser->visit(new Login);
```

有时你可能已经在某个页面上，并且需要将页面的选择器和方法“加载”到当前测试上下文中。当按下按钮并被重定向到给定页面而不是显式导航时，这种情况很常见。在这种情况下，你可以使用 `on` 方法来加载页面：

```php
use Tests\Browser\Pages\CreatePlaylist;

$browser->visit('/dashboard')
        ->clickLink('Create Playlist')
        ->on(new CreatePlaylist)
        ->assertSee('@create');
```

### Shorthand Selectors

页面类中的 `elements` 方法允许你为页面上的任何 CSS 选择器定义快速、易记的快捷方式。例如，让我们为应用的登录页面定义 "email" 输入字段的快捷方式：

```php
/**
 * 获取页面的元素快捷方式。
 *
 * @return array<string, string>
 */
public function elements(): array
{
    return [
        '@email' => 'input[name=email]',
    ];
}
```

一旦定义了快捷方式，你可以在通常使用完整 CSS 选择器的任何地方使用快捷选择器：

```php
$browser->type('@email', 'taylor@laravel.com');
```

#### Global Shorthand Selectors

安装 Dusk 后，一个基础的 `Page` 类将放置在你的 `tests/Browser/Pages` 目录中。这个类包含一个 `siteElements` 方法，可以用来定义全局快捷选择器，这些选择器应该在整个应用的每个页面上都可用：

```php
/**
 * 获取站点的全局元素快捷方式。
 *
 * @return array<string, string>
 */
public static function siteElements(): array
{
    return [
        '@element' => '#selector',
    ];
}
```

### Page Methods

除了页面上定义的默认方法外，你还可以定义可在整个测试中使用的其他方法。例如，让我们想象我们正在构建一个音乐管理应用程序。应用程序的一个页面的常见动作可能是创建播放列表。你可以在页面类上定义一个 `createPlaylist` 方法，而不是在每个测试中重写创建播放列表的逻辑：

```php
<?php

namespace Tests\Browser\Pages;

use Laravel\Dusk\Browser;

class Dashboard extends Page
{
    // 其他页面方法...

    /**
     * 创建一个新的播放列表。
     */
    public function createPlaylist(Browser $browser, string $name): void
    {
        $browser->type('name', $name)
                ->check('share')
                ->press('Create Playlist');
    }
}
```

一旦方法被定义，你可以在使用该页面的任何测试中使用它。浏览器实例将自动作为自定义页面方法的第一个参数传递：

```php
use Tests\Browser\Pages\Dashboard;

$browser->visit(new Dashboard)
        ->createPlaylist('My Playlist')
        ->assertSee('My Playlist');
```

## Components

组件类似于 Dusk 的“页面对象”，但它们是为整个应用程序中重复使用的 UI 和功能片段设计的，例如导航栏或通知窗口。因此，组件不绑定到特定的 URL。

### Generating Components

要生成组件，请执行 `dusk:component` Artisan 命令。新组件将放置在 `tests/Browser/Components` 目录中：

```shell
php artisan dusk:component DatePicker
```

如上所示，"日期选择器" 是一个可能存在于应用程序各种页面上的组件示例。在整个测试套件的几十个测试中手动编写选择日期的浏览器自动化逻辑可能会变得很麻烦。相反，我们可以定义一个 Dusk 组件来代表日期选择器，允许我们将该逻辑封装在组件中：

```php
<?php

namespace Tests\Browser\Components;

use Laravel\Dusk\Browser;
use Laravel\Dusk\Component as BaseComponent;

class DatePicker extends BaseComponent
{
    /**
     * 获取组件的根选择器。
     */
    public function selector(): string
    {
        return '.date-picker';
    }

    /**
     * 断言浏览器页面包含组件。
     */
    public function assert(Browser $browser): void
    {
        $browser->assertVisible($this->selector());
    }

    /**
     * 获取组件的元素快捷方式。
     *
     * @return array<string, string>
     */
    public function elements(): array
    {
        return [
            '@date-field' => 'input.datepicker-input',
            '@year-list' => 'div > div.datepicker-years',
            '@month-list' => 'div > div.datepicker-months',
            '@day-list' => 'div > div.datepicker-days',
        ];
    }

    /**
     * 选择给定的日期。
     */
    public function selectDate(Browser $browser, int $year, int $month, int $day): void
    {
        $browser->click('@date-field')
                ->within('@year-list', function (Browser $browser) use ($year) {
                    $browser->click($year);
                })
                ->within('@month-list', function (Browser $browser) use ($month) {
                    $browser->click($month);
                })
                ->within('@day-list', function (Browser $browser) use ($day) {
                    $browser->click($day);
                });
    }
}
```

### Using Components

一旦组件被定义，我们可以从任何测试中轻松选择日期选择器中的日期。而且，如果选择日期所需的逻辑发生变化，我们只需要更新组件：

```php
// Pest 测试
<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\Browser\Components\DatePicker;

uses(DatabaseMigrations::class);

test('basic example', function () {
    $this->browse(function (Browser $browser) {
        $browser->visit('/')
                ->within(new DatePicker, function (Browser $browser) {
                    $browser->selectDate(2019, 1, 30);
                })
                ->assertSee('January');
    });
});

// PHPUnit 测试
<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\Browser\Components\DatePicker;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    /**
     * 一个基本组件测试示例。
     */
    public function test_basic_example(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/')
                    ->within(new DatePicker, function (Browser $browser) {
                        $browser->selectDate(2019, 1, 30);
                    })
                    ->assertSee('January');
        });
    }
}
```

## 持续集成

> [!WARNING]
> 大多数 Dusk 持续集成配置都预期您的 Laravel 应用程序是使用内置的 PHP 开发服务器在 8000 端口上提供服务的。因此，在继续之前，您应确保您的持续集成环境具有 `http://127.0.0.1:8000` 的 `APP_URL` 环境变量值。

### Heroku CI

要在 [Heroku CI](https://www.heroku.com/continuous-integration) 上运行 Dusk 测试，请将以下 Google Chrome 构建包和脚本添加到您的 Heroku `app.json` 文件中：

```json
{
  "environments": {
    "test": {
      "buildpacks": [{ "url": "heroku/php" }, { "url": "https://github.com/heroku/heroku-buildpack-google-chrome" }],
      "scripts": {
        "test-setup": "cp .env.testing .env",
        "test": "nohup bash -c './vendor/laravel/dusk/bin/chromedriver-linux > /dev/null 2>&1 &' && nohup bash -c 'php artisan serve --no-reload > /dev/null 2>&1 &' && php artisan dusk"
      }
    }
  }
}
```

### Travis CI

要在 [Travis CI](https://travis-ci.org) 上运行您的 Dusk 测试，请使用以下 `.travis.yml` 配置。由于 Travis CI 不是图形环境，我们需要采取一些额外的步骤来启动 Chrome 浏览器。此外，我们将使用 `php artisan serve` 来启动 PHP 的内置 Web 服务器：

```yaml
language: php

php:
  - 7.3

addons:
  chrome: stable

install:
  - cp .env.testing .env
  - travis_retry composer install --no-interaction --prefer-dist
  - php artisan key:generate
  - php artisan dusk:chrome-driver

before_script:
  - google-chrome-stable --headless --disable-gpu --remote-debugging-port=9222 http://localhost &
  - php artisan serve --no-reload &

script:
  - php artisan dusk
```

### GitHub Actions

如果您正在使用 [GitHub Actions](https://github.com/features/actions) 来运行您的 Dusk 测试，您可以使用以下配置文件作为起点。与 TravisCI 一样，我们将使用 `php artisan serve` 命令来启动 PHP 的内置 Web 服务器：

```yaml
name: CI
on: [push]
jobs:
  dusk-php:
    runs-on: ubuntu-latest
    env:
      APP_URL: 'http://127.0.0.1:8000'
      DB_USERNAME: root
      DB_PASSWORD: root
      MAIL_MAILER: log
    steps:
      - uses: actions/checkout@v4
      - name: Prepare The Environment
        run: cp .env.example .env
      - name: Create Database
        run: |
          sudo systemctl start mysql
          mysql --user="root" --password="root" -e "CREATE DATABASE \`my-database\` character set UTF8mb4 collate utf8mb4_bin;"
      - name: Install Composer Dependencies
        run: composer install --no-progress --prefer-dist --optimize-autoloader
      - name: Generate Application Key
        run: php artisan key:generate
      - name: Upgrade Chrome Driver
        run: php artisan dusk:chrome-driver --detect
      - name: Start Chrome Driver
        run: ./vendor/laravel/dusk/bin/chromedriver-linux &
      - name: Run Laravel Server
        run: php artisan serve --no-reload &
      - name: Run Dusk Tests
        run: php artisan dusk
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: screenshots
          path: tests/Browser/screenshots
      - name: Upload Console Logs
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: console
          path: tests/Browser/console
```

### Chipper CI

如果您使用 [Chipper CI](https://chipperci.com) 来运行您的 Dusk 测试，您可以使用以下配置文件作为起点。我们将使用 PHP 的内置服务器来运行 Laravel，以便我们可以监听请求：

```yaml
# file .chipperci.yml
version: 1

environment:
  php: 8.2
  node: 16

# Include Chrome in the build environment
services:
  - dusk

# Build all commits
on:
  push:
    branches: .*

pipeline:
  - name: Setup
    cmd: |
      cp -v .env.example .env
      composer install --no-interaction --prefer-dist --optimize-autoloader
      php artisan key:generate

      # Create a dusk env file, ensuring APP_URL uses BUILD_HOST
      cp -v .env .env.dusk.ci
      sed -i "s@APP_URL=.*@APP_URL=http://$BUILD_HOST:8000@g" .env.dusk.ci

  - name: Compile Assets
    cmd: |
      npm ci --no-audit
      npm run build

  - name: Browser Tests
    cmd: |
      php -S [::0]:8000 -t public 2>server.log &
      sleep 2
      php artisan dusk:chrome-driver $CHROME_DRIVER
      php artisan dusk --env=ci
```

要了解更多关于在 Chipper CI 上运行 Dusk 测试的信息，包括如何使用数据库，请查阅 [Chipper CI 官方文档](https://chipperci.com/docs/testing/laravel-dusk-new/)。
