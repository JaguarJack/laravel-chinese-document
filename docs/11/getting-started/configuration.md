---
title: Laravel 配置
---

# 配置

[[toc]]

## 简介

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，因此请随时浏览文件，并熟悉您可用的选项。

这些配置文件允许您配置诸如数据库连接信息、邮件服务器信息以及您的应用时区和加密密钥等核心配置值。

#### `about` 命令

Laravel 可以通过 `about` Artisan 命令显示您的应用配置、驱动程序和环境的概览。

```shell
php artisan about
```

如果您只对应用概览输出的特定部分感兴趣，您可以使用 `--only` 选项过滤该部分：

```shell
php artisan about --only=environment
```

或者，要详细探索特定配置文件的值，您可以使用 `config:show` Artisan 命令：

```shell
php artisan config:show database
```

## 环境配置

根据应用程序运行的环境，拥有不同的配置值通常很有帮助。例如，您可能希望在本地和生产服务器上使用不同的缓存驱动程序。

为了使这变得简单，Laravel 使用了 [DotEnv](https://github.com/vlucas/phpdotenv) PHP 库。在新安装的 Laravel 中，您的应用根目录将包含一个 `.env.example` 文件，定义了许多常见的环境变量。在 Laravel 安装过程中，这个文件将自动复制为 `.env`。

Laravel 的默认 `.env` 文件包含了一些常见的配置值，这些值可能根据您的应用是在本地还是在生产 Web 服务器上运行而有所不同。这些值随后由 `config` 目录中的配置文件使用 Laravel 的 `env` 函数读取。

如果您与团队一起开发，您可能希望继续包含并更新 `.env.example` 文件。通过在示例配置文件中放置占位符值，您的团队中的其他开发者可以清楚地看到运行您的应用程序需要哪些环境变量。

> [!NOTE]
> 您的 `.env` 文件中的任何变量都可以被外部环境变量（如服务器级或系统级环境变量）覆盖。

#### 环境文件安全

您的 `.env` 文件不应提交到您的应用程序的源代码控制中，因为使用您的应用程序的每个开发者/服务器可能需要不同的环境配置。此外，如果入侵者访问到您的源代码库，这将是一个安全风险，因为任何敏感凭据都会被暴露。

然而，Laravel 允许您加密您的环境文件，以便它们可以安全地添加到源代码控制中。

#### 额外的环境文件

在加载应用程序的环境变量之前，Laravel 会确定是否已经外部提供了 `APP_ENV` 环境变量或是否指定了 `--env` CLI 参数。如果是，Laravel 将尝试加载 `.env.[APP_ENV]` 文件（如果存在）。如果不存在，将加载默认的 `.env` 文件。

## 环境变量类型

您的 `.env` 文件中的所有变量通常被解析为字符串，因此创建了一些保留值，以允许您从 `env()` 函数返回更广泛的类型范围：

| `.env` 值 | `env()` 值   |
| --------- | ------------ |
| true      | (bool) true  |
| (true)    | (bool) true  |
| false     | (bool) false |
| (false)   | (bool) false |
| empty     | (string) ''  |
| (empty)   | (string) ''  |
| null      | (null) null  |
| (null)    | (null) null  |

如果您需要定义一个包含空格的环境变量值，您可以通过用双引号括起来的方式来实现：

```ini
APP_NAME="我的应用"
```

## 检索环境配置

当您的应用程序收到请求时，`.env` 文件中列出的所有变量将被加载到 PHP 的 `$_ENV` 超全局变量中。然而，您可以在配置文件中使用 `env` 函数来检索这些变量的值。事实上，如果您查看 Laravel 配置文件，您会注意到许多选项已经在使用这个函数：

```php
'debug' => env('APP_DEBUG', false),
```

传递给 `env` 函数的第二个值是“默认值”。如果给定键不存在环境变量，则将返回此值。

## 确定当前环境

当前应用环境是通过 `.env` 文件中的 `APP_ENV` 变量确定的。您可以通过 `App` [facade](/docs/11/architecture-concepts/facades) 上的 `environment` 方法访问此值：

```php
use Illuminate\Support\Facades\App;

$environment = App::environment();
```

您还可以向 `environment` 方法传递参数来确定环境是否匹配给定值。如果环境与任何给定值匹配，该方法将返回 `true`：

```php
if (App::environment('local')) {
    // 环境是本地
}

if (App::environment(['local', 'staging'])) {
    // 环境是本地或者是 staging...
}
```

> [!NOTE]
> 通过定义服务器级 `APP_ENV` 环境变量可以覆盖当前应用环境检测。

## 加密环境文件

未加密的环境文件不应存储在源代码控制中。然而，Laravel 允许您加密您的环境文件，以便它们可以安全地添加到源代码控制中。

#### 加密

要加密环境文件，您可以使用 `env:encrypt` 命令：

```shell
php artisan env:encrypt
```

执行 `env:encrypt` 命令将加密您的 `.env` 文件，并将加密内容放在 `.env.encrypted` 文件中。解密密钥将在命令的输出中显示，并应存储在安全的密码管理器中。如果您想提供自己的加密密钥，您可以在调用命令时使用 `--key` 选项：

```shell
php artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

如果您的应用程序有多个环境文件，例如 `.env` 和 `.env.staging`，您可以通过 `--env` 选项指定应该加密的环境文件：

```shell
php artisan env:encrypt --env=staging
```

#### 解密

要解密环境文件，您可以使用 `env:decrypt` 命令。这个命令需要一个解密密钥，Laravel 将从 `LARAVEL_ENV_ENCRYPTION_KEY` 环境变量中检索它：

```shell
php artisan env:decrypt
```

或者，密钥可以直接通过 `--key` 选项提供给命令：

```shell
php artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

当调用 `env:decrypt` 命令时，Laravel 将解密 `.env.encrypted` 文件的内容，并将解密内容放在 `.env` 文件中。

`env:decrypt` 命令也可以通过 `--cipher` 选项使用自定义加密密码：

```shell
php artisan env:decrypt --key=qUWuNRdfuImXcKxZ --cipher=AES-128-CBC
```

如果您的应用程序有多个环境文件，例如 `.env` 和 `.env.staging`，您可以通过 `--env` 选项指定应该解密的环境文件：

```shell
php artisan env:decrypt --env=staging
```

为了覆盖现有的环境文件，您可以向 `env:decrypt` 命令提供 `--force` 选项：

```shell
php artisan env:decrypt --force
```

## 访问配置值

您可以在应用程序的任何地方使用 `Config` facade 或全局 `config` 函数轻松访问配置值。可以使用“点”语法访问配置值，其中包括文件名和您希望访问的选项的名称。还可以指定默认值，如果配置选项不存在，则返回该值：

```php
use Illuminate\Support\Facades\Config;

$value = Config::get('app.timezone');

$value = config('app.timezone');

// 如果配置值不存在，检索默认值...
$value = config('app.timezone', 'Asia/Seoul');
```

要在运行时设置配置值，您可以调用 `Config` facade 的 `set` 方法或将数组传递给 `config` 函数：

```php
Config::set('app.timezone', 'America/Chicago');

config(['app.timezone' => 'America/Chicago']);
```

为了协助静态分析，`Config` facade 还提供了类型化的配置检索方法。如果检索到的配置值与预期类型不匹配，将抛出异常：

```php
Config::string('config-key');
Config::integer('config-key');
Config::float('config-key');
Config::boolean('config-key');
Config::array('config-key');
```

## 配置缓存

为了给您的应用程序提速，您应该使用 `config:cache` Artisan 命令将所有配置文件缓存到一个文件中。这将把您的应用程序的所有配置选项合并到一个文件中，框架可以快速加载该文件。

您通常应该将 `php artisan config:cache` 命令作为您的生产部署过程的一部分。该命令不应在本地开发期间运行，因为配置选项在应用程序开发过程中经常需要更改。

一旦配置被缓存，您的应用程序的 `.env` 文件在请求或 Artisan 命令期间将不会被框架加载；因此，`env` 函数将只返回外部的、系统级别的环境变量。

因此，您应该确保只从应用程序的配置（`config`）文件中调用 `env` 函数。您可以通过查看 Laravel 的默认配置文件来看到许多这样的例子。可以使用上面[描述的 `config` 函数](#accessing-configuration-values) 从应用程序的任何地方访问配置值。

可以使用 `config:clear` 命令清除缓存的配置：

```shell
php artisan config:clear
```

> [!WARNING]
> 如果您在部署过程中执行 `config:cache` 命令，您应该确保只从配置文件中调用 `env` 函数。一旦配置被缓存，`.env` 文件将不会被加载；因此，`env` 函数将只返回外部的、系统级别的环境变量。

## 配置发布

Laravel 的大多数配置文件已经发布在您的应用程序的 `config` 目录中；然而，某些配置文件如 `cors.php` 和 `view.php` 默认不会被发布，因为大多数应用程序永远不需要修改它们。

然而，您可以使用 `config:publish` Artisan 命令来发布默认未发布的任何配置文件：

```shell
php artisan config:publish

php artisan config:publish --all
```

## 调试模式

您的 `config/app.php` 配置文件中的 `debug` 选项决定了实际向用户显示的错误信息量。默认情况下，此选项设置为遵循存储在 `.env` 文件中的 `APP_DEBUG` 环境变量的值。

> [!WARNING]
> 对于本地开发，您应该将 `APP_DEBUG` 环境变量设置为 `true`。**在生产环境中，这个值应该始终为 `false`。如果在生产中将变量设置为 `true`，您将冒着向应用程序的最终用户暴露敏感配置值的风险。**

## 维护模式

当您的应用程序处于维护模式时，所有请求到您的应用程序的请求都会显示一个自定义视图。这使得在更新应用程序或进行维护时“禁用”您的应用程序变得很简单。维护模式检查包含在应用程序的默认中间件堆栈中。如果应用程序处于维护模式，将抛出一个带有 503 状态码的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例。

要启用维护模式，请执行 `down` Artisan 命令：

```shell
php artisan down
```

如果您希望所有维护模式响应都发送 `Refresh` HTTP 头，您可以在调用 `down` 命令时提供 `refresh` 选项。`Refresh` 头将指示浏览器在指定的秒数后自动刷新页面：

```shell
php artisan down --refresh=15
```

您还可以向 `down` 命令提供 `retry` 选项，该选项将被设置为 `Retry-After` HTTP 头的值，尽管浏览器通常会忽略此头：

```shell
php artisan down --retry=60
```

#### 绕过维护模式

要允许使用秘密令牌绕过维护模式，您可以使用 `secret` 选项指定一个维护模式绕过令牌：

```shell
php artisan down --secret="1630542a-246b-4b66-afa1-dd72a4c43515"
```

在应用程序进入维护模式后，您可以导航到与此令牌匹配的应用程序 URL，Laravel 将向您的浏览器颁发一个维护模式绕过 cookie：

```shell
https://example.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

如果您希望 Laravel 为您生成秘密令牌，您可以使用 `with-secret` 选项。秘密将在应用程序进入维护模式后显示给您：

```shell
php artisan down --with-secret
```

访问此隐藏路由时，您将被重定向到应用程序的 `/` 路由。一旦浏览器颁发了 cookie，您将能够正常浏览应用程序，就好像它没有处于维护模式一样。

> [!NOTE]
> 您的维护模式秘密通常应该由字母数字字符组成，并且可以选择性地包含破折号。您应该避免使用在 URL 中具有特殊含义的字符，如 `?` 或 `&`。

#### 预渲染维护模式视图

如果您在部署期间使用 `php artisan down` 命令，如果他们在您的 Composer 依赖项或其他基础设施组件更新时访问应用程序，您的用户可能偶尔会遇到错误。这是因为在确定您的应用程序处于维护模式并使用模板引擎渲染维护模式视图之前，必须启动 Laravel 框架的相当大的一部分。这样做是为了在请求周期的非常开始就返回维护模式视图，而在此之前，您的应用程序的任何依赖都还未加载。您可以使用 `down` 命令的 `render` 选项预渲染您选择的模板：

```shell
php artisan down --render="errors::503"
```

#### 重定向维护模式请求

在维护模式下，Laravel 将为用户尝试访问的所有应用程序 URL 显示维护模式视图。如果您愿意，您可以指示 Laravel 将所有请求重定向到特定 URL。这可以通过使用 `redirect` 选项来完成。例如，您可能希望将所有请求重定向到 `/` URI：

```shell
php artisan down --redirect=/
```

#### 禁用维护模式

要禁用维护模式，请使用 `up` 命令：

```shell
php artisan up
```

> [!NOTE]
> 您可以通过在 `resources/views/errors/503.blade.php` 中定义自己的模板来自定义默认的维护模式模板。

#### 维护模式和队列

当您的应用程序处于维护模式时，不会处理任何[队列作业](/docs/11/digging-deeper/queues)。一旦应用程序退出维护模式，作业将继续正常处理。

#### 维护模式的替代方案

由于维护模式要求您的应用程序有几秒钟的停机时间，因此请考虑使用 [Laravel Vapor](https://vapor.laravel.com) 和 [Envoyer](https://envoyer.io) 等替代方案来实现 Laravel 的零停机时间部署。
