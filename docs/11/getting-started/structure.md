---
title: Laravel 目录结构介绍
---

# 目录结构

- [简介](#introduction)
- [根目录](#the-root-directory)
  - [`app` 目录](#the-root-app-directory)
  - [`bootstrap` 目录](#the-bootstrap-directory)
  - [`config` 目录](#the-config-directory)
  - [`database` 目录](#the-database-directory)
  - [`public` 目录](#the-public-directory)
  - [`resources` 目录](#the-resources-directory)
  - [`routes` 目录](#the-routes-directory)
  - [`storage` 目录](#the-storage-directory)
  - [`tests` 目录](#the-tests-directory)
  - [`vendor` 目录](#the-vendor-directory)
- [`App` 目录](#the-app-directory)
  - [`Broadcasting` 目录](#the-broadcasting-directory)
  - [`Console` 目录](#the-console-directory)
  - [`Events` 目录](#the-events-directory)
  - [`Exceptions` 目录](#the-exceptions-directory)
  - [`Http` 目录](#the-http-directory)
  - [`Jobs` 目录](#the-jobs-directory)
  - [`Listeners` 目录](#the-listeners-directory)
  - [`Mail` 目录](#the-mail-directory)
  - [`Models` 目录](#the-models-directory)
  - [`Notifications` 目录](#the-notifications-directory)
  - [`Policies` 目录](#the-policies-directory)
  - [`Providers` 目录](#the-providers-directory)
  - [`Rules` 目录](#the-rules-directory)

## 简介

Laravel 应用程序的默认结构旨在为大型和小型应用程序提供一个出色的起点。但是，您可以自由地按照自己的喜好组织应用程序。Laravel 几乎不对任何给定类的位置施加限制 - 只要 Composer 能够自动加载该类。

> [!NOTE]
> 新手 Laravel？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在我们引导您构建第一个 Laravel 应用程序的同时，为您提供框架的实操演练。

## 根目录

#### `app` 目录

`app` 目录包含您应用程序的核心代码。我们很快会更详细地探索这个目录；然而，您应用程序中几乎所有的类都将位于此目录。

#### `bootstrap` 目录

`bootstrap` 目录包含引导框架的 `app.php` 文件。此目录还包含一个 `cache` 目录，其中包含用于性能优化的框架生成文件，例如路由和服务缓存文件。

#### `config` 目录

顾名思义，`config` 目录包含您应用程序的所有配置文件。通读所有这些文件并熟悉您可用的所有选项是个好主意。

#### `database` 目录

`database` 目录包含您的数据库迁移、模型工厂和种子文件。如果您愿意，还可以使用此目录来保存 SQLite 数据库。

#### `public` 目录

`public` 目录包含 `index.php` 文件，这是所有请求进入您应用程序的入口点，并配置自动加载。此目录还包含您的资产，如图像、JavaScript 和 CSS。

#### `resources` 目录

`resources` 目录包含您的[视图](/docs/11/basics/views)以及原始的、未编译的资产，如 CSS 或 JavaScript。

#### `routes` 目录

`routes` 目录包含您应用程序的所有路由定义。默认情况下，Laravel 附带了两个路由文件：`web.php` 和 `console.php`。

`web.php` 文件包含 Laravel 放置在 `web` 中间件组中的路由，该组提供会话状态、CSRF 保护和 cookie 加密。如果您的应用程序不提供无状态的、RESTful API，则您的所有路由很可能都将在 `web.php` 文件中定义。

`console.php` 文件是您可以定义所有基于闭包的控制台命令的地方。每个闭包都绑定到一个命令实例，允许简单地与每个命令的 IO 方法进行交互。尽管此文件不定义 HTTP 路由，它定义了基于控制台的应用程序入口点（路由）。您还可以在 `console.php` 文件中[安排](/docs/11/digging-deeper/scheduling)任务。

如果需要，您可以通过 `install:api` 和 `install:broadcasting` Artisan 命令安装额外的 API 路由（`api.php`）和广播频道（`channels.php`）文件。

`api.php` 文件包含旨在无状态的路由，因此通过这些路由进入应用程序的请求旨在通过[令牌](/docs/11/packages/sanctum)进行认证，并且不会访问会话状态。

`channels.php` 文件是您可以注册应用程序支持的所有[事件广播](/docs/11/digging-deeper/broadcasting)频道的地方。

#### `storage` 目录

`storage` 目录包含您的日志、编译的 Blade 模板、基于文件的会话、文件缓存以及框架生成的其他文件。此目录分为 `app`、`framework` 和 `logs` 目录。`app` 目录可用于存储应用程序生成的任何文件。`framework` 目录用于存储框架生成的文件和缓存。最后，`logs` 目录包含您应用程序的日志文件。

`storage/app/public` 目录可用于存储用户生成的文件，如应该公开访问的个人资料头像。您应该在 `public/storage` 创建指向此目录的符号链接。您可以使用 `php artisan storage:link` Artisan 命令创建链接。

#### `tests` 目录

`tests` 目录包含您的自动化测试。默认情况下提供了 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de/) 单元测试和功能测试示例。每个测试类应以 `Test` 单词为后缀。您可以使用 `/vendor/bin/pest` 或 `/vendor/bin/phpunit` 命令运行测试。或者，如果您希望对测试结果有更详细和美观的表示，您可以使用 `php artisan test` Artisan 命令运行测试。

#### `vendor` 目录

`vendor` 目录包含您的 [Composer](https://getcomposer.org) 依赖项。

## `App` 目录

您应用程序的大部分内容都位于 `app` 目录中。默认情况下，此目录在 `App` 命名空间下，并通过 Composer 使用 [PSR-4 自动加载标准](https://www.php-fig.org/psr/psr-4/) 自动加载。

默认情况下，`app` 目录包含 `Http`、`Models` 和 `Providers` 目录。然而，随着时间的推移，当您使用 make Artisan 命令生成类时，`app` 目录内将生成各种其他目录。例如，直到您执行 `make:command` Artisan 命令生成命令类时，`app/Console` 目录才会存在。

`Console` 和 `Http` 目录在下面的各自部分中进一步解释，但可以将 `Console` 和 `Http` 目录视为提供进入应用程序核心的 API。HTTP 协议和 CLI 都是与应用程序交互的机制，但实际上不包含应用程序逻辑。换句话说，它们是向应用程序发出命令的两种方式。`Console` 目录包含所有的 Artisan 命令，而 `Http` 目录包含您的控制器、中间件和请求。

> [!NOTE] > `app` 目录中的许多类都可以通过 Artisan 命令生成。要查看可用命令，请在终端中运行 `php artisan list make` 命令。

#### `Broadcasting` 目录

`Broadcasting` 目录包含应用程序的所有广播频道类。这些类是使用 `make:channel` 命令生成的。默认情况下，这个目录不存在，但当你创建第一个频道时，它将为你创建。要了解更多关于频道的信息，请查看[事件广播](/docs/11/digging-deeper/broadcasting)文档。

#### `Console` 目录

`Console` 目录包含应用程序的所有自定义 Artisan 命令。这些命令可以使用 `make:command` 命令生成。

#### `Events` 目录

默认情况下，这个目录不存在，但当你使用 `event:generate` 和 `make:event` Artisan 命令时，它将为你创建。`Events` 目录包含[事件类](/docs/11/digging-deeper/events)。事件可用于提醒应用程序的其他部分某个给定动作已经发生，提供了极大的灵活性和解耦。

#### `Exceptions` 目录

`Exceptions` 目录包含应用程序的所有自定义异常。这些异常可以使用 `make:exception` 命令生成。

#### `Http` 目录

`Http` 目录包含您的控制器、中间件和表单请求。几乎所有处理进入应用程序的请求的逻辑都将放在此目录中。

#### `Jobs` 目录

默认情况下，这个目录不存在，但如果您执行 `make:job` Artisan 命令，它将为您创建。`Jobs` 目录包含应用程序的[可队列化作业](/docs/11/digging-deeper/queues)。作业可以由您的应用程序排队，或在当前请求生命周期内同步运行。在当前请求期间同步运行的作业有时被称为“命令”，因为它们是[命令模式](https://en.wikipedia.org/wiki/Command_pattern)的实现。

#### `Listeners` 目录

默认情况下，这个目录不存在，但如果您执行 `event:generate` 或 `make:listener` Artisan 命令，它将为您创建。`Listeners` 目录包含处理[事件](/docs/11/digging-deeper/events)的类。事件监听器接收事件实例并对事件触发时执行逻辑。例如，`UserRegistered` 事件可能由 `SendWelcomeEmail` 监听器处理。

#### `Mail` 目录

默认情况下，这个目录不存在，但如果您执行 `make:mail` Artisan 命令，它将为您创建。`Mail` 目录包含由应用程序发送的所有[代表电子邮件的类](/docs/11/digging-deeper/mail)。邮件对象允许您将构建电子邮件的所有逻辑封装在一个简单的类中，该类可以使用 `Mail::send` 方法发送。

#### `Models` 目录

`Models` 目录包含所有的 [Eloquent 模型类](/docs/11/eloquent/eloquent)。Laravel 提供的 Eloquent ORM 提供了一个美观、简单的 ActiveRecord 实现，用于处理您的数据库。每个数据库表都有一个对应的“模型”，用于与该表交互。模型允许您查询表中的数据，以及向表中插入新记录。

#### `Notifications` 目录

默认情况下，这个目录不存在，但如果您执行 `make:notification` Artisan 命令，它将为您创建。`Notifications` 目录包含应用程序发送的所有“事务性”[通知](/docs/11/digging-deeper/notifications)，例如关于应用程序内发生的事件的简单通知。Laravel 的通知功能抽象了通过多种驱动程序（如电子邮件、Slack、SMS 或存储在数据库中）发送通知的功能。

#### `Policies` 目录

默认情况下，这个目录不存在，但如果您执行 `make:policy` Artisan 命令，它将为您创建。`Policies` 目录包含应用程序的[授权策略类](/docs/11/security/authorization)。策略用于确定用户是否可以对资源执行给定操作。

#### `Providers` 目录

`Providers` 目录包含应用程序的所有[服务提供者](/docs/11/architecture-concepts/providers)。服务提供者通过在服务容器中绑定服务、注册事件或执行任何其他任务来为接收请求的应用程序做准备。

在新的 Laravel 应用程序中，此目录将已经包含 `AppServiceProvider`。您可以根据需要向此目录添加自己的提供者。

#### `Rules` 目录

默认情况下，这个目录不存在，但如果您执行 `make:rule` Artisan 命令，它将为您创建。`Rules` 目录包含应用程序的自定义验证规则对象。规则用于在简单的对象中封装复杂的验证逻辑。有关更多信息，请查看[验证文档](/docs/11/basics/validation)。
