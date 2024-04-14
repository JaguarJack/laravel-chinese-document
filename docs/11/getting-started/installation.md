---
title: Laravel 安装
---

# 安装

[[toc]]

## 了解 Laravel

Laravel 是一个具有表达性、优雅语法的 Web 应用框架。Web 框架为创建应用程序提供了一个结构和起点，允许您专注于创建一些令人惊叹的东西，而我们负责处理细节。

Laravel 力求在提供强大功能（如彻底的依赖注入、表达式数据库抽象层、队列和计划任务、单元和集成测试等）的同时，提供惊人的开发者体验。

无论您是 PHP Web 框架的新手还是拥有多年经验的开发者，Laravel 都是一个可以与您一同成长的框架。我们将帮助您迈出成为 Web 开发者的第一步，或在您将专业知识提升到新水平时为您提供帮助。我们迫不及待地想看到您构建的东西。

> [!NOTE]
> 新手 Laravel？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在我们引导您构建第一个 Laravel 应用程序的同时，为您提供框架的实操演练。

### 为什么选择 Laravel？

在构建 Web 应用程序时，您有多种工具和框架可供选择。然而，我们相信 Laravel 是构建现代、全栈 Web 应用程序的最佳选择。

#### 一个渐进式框架

我们喜欢称 Laravel 为“渐进式”框架。这意味着 Laravel 与您一同成长。如果您刚开始接触 Web 开发，Laravel 庞大的文档库、指南和[视频教程](https://laracasts.com)将帮助您在不感到压力的情况下学习基础知识。

如果您是一名资深开发者，Laravel 为您提供了强大的工具，用于[依赖注入](/docs/11/architecture-concepts/container)、[单元测试](/docs/11/testing/testing)、[队列](/docs/11/digging-deeper/queues)、[实时事件](/docs/11/digging-deeper/broadcasting)等。Laravel 已经为构建专业 Web 应用程序并准备好处理企业级工作负载进行了微调。

#### 一个可扩展的框架

Laravel 极具可扩展性。得益于 PHP 的可扩展性和 Laravel 对 Redis 等快速、分布式缓存系统的内置支持，Laravel 的水平扩展非常简单。事实上，Laravel 应用程序已经轻松扩展，以处理每月数亿次的请求。

需要极端扩展？像 [Laravel Vapor](https://vapor.laravel.com) 这样的平台允许您在 AWS 的最新无服务器技术上以几乎无限的规模运行您的 Laravel 应用程序。

#### 一个社区框架

Laravel 结合了 PHP 生态系统中最好的包，提供了最健壮和对开发者最友好的框架。此外，来自世界各地的数千名才华横溢的开发者[为框架做出了贡献](https://github.com/laravel/framework)。谁知道，也许你甚至会成为 Laravel 的贡献者。

## 创建 Laravel 项目

在创建您的第一个 Laravel 项目之前，请确保您的本地机器已安装 PHP 和 [Composer](https://getcomposer.org)。如果您在 macOS 或 Windows 上开发，可以通过 [Laravel Herd](https://herd.laravel.com) 在几分钟内安装 PHP 和 Composer。此外，我们推荐[安装 Node 和 NPM](https://nodejs.org)。

在安装了 PHP 和 Composer 之后，您可以通过 Composer 的 `create-project` 命令创建一个新的 Laravel 项目：

```bash
composer create-project laravel/laravel:^11.0 example-app
```

或者，您可以通过 Composer 全局安装 [Laravel 安装程序](https://github.com/laravel/installer)，来创建新的 Laravel 项目：

```bash
composer global require laravel/installer

laravel new example-app
```

项目创建后，使用 Laravel Artisan 的 `serve` 命令启动 Laravel 的本地开发服务器：

```bash
cd example-app

php artisan serve
```

启动 Artisan 开发服务器后，您的应用程序将在 Web 浏览器中通过 `http://localhost:8000` 访问。接下来，您已准备好[开始进入 Laravel 生态系统的下一步](#next-steps)。当然，您可能还想要[配置数据库](#databases-and-migrations)。

> [!NOTE]
> 如果您希望在开发 Laravel 应用程序时获得一个良好的开端，可以考虑使用我们的[启动套件之一](/docs/11/getting-started/starter-kits)。Laravel 的启动套件为您的新 Laravel 应用程序提供了后端和前端认证脚手架。

## 初始配置

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，因此请随时浏览文件，并熟悉您可用的选项。

Laravel 出箱即用几乎不需要额外配置。您可以自由地开始开发！然而，您可能希望查看 `config/app.php` 文件及其文档。它包含了几个选项，如 `timezone` 和 `locale`，您可能希望根据您的应用程序进行更改。

### 基于环境的配置

由于 Laravel 的许多重要配置值可能会根据您的应用程序是在本地机器上运行还是在生产 Web 服务器上运行而有所不同，因此许多重要的配置值是使用位于应用程序根目录的 `.env` 文件定义的。

您的 `.env` 文件不应该提交到应用程序的源代码控制中，因为使用您的应用程序的每个开发者/服务器可能需要不同的环境配置。此外，如果入侵者访问到您的源代码库，这将是一个安全风险，因为任何敏感凭据都会被暴露。

> [!NOTE]
> 有关 `.env` 文件和基于环境的配置的更多信息，请查看完整的[配置文档](/docs/11/getting-started/configuration#environment-configuration)。

### 数据库和迁移

现在您已经创建了 Laravel 应用程序，您可能想要在数据库中存储一些数据。默认情况下，您的应用程序的 `.env` 配置文件指定 Laravel 将与 SQLite 数据库进行交互。

在项目创建期间，Laravel 为您创建了一个 `database/database.sqlite` 文件，并运行了必要的迁移来创建应用程序的数据库表。

如果您更喜欢使用另一种数据库驱动程序，如 MySQL 或 PostgreSQL，您可以更新您的 `.env` 配置文件以使用适当的数据库。例如，如果您希望使用 MySQL，请更新您的 `.env` 配置文件的 `DB_*` 变量，如下所示：

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

如果您选择使用 SQLite 以外的数据库，您将需要创建数据库并运行应用程序的[数据库迁移](/docs/11/database/migrations)：

```shell
php artisan migrate
```

> [!NOTE]
> 如果您在 macOS 上开发并需要在本地安装 MySQL、PostgreSQL 或 Redis，请考虑使用 [DBngin](https://dbngin.com/)。

### 目录配置

Laravel 应该始终从为您的 Web 服务器配置的“Web 目录”的根目录中提供服务。您不应尝试从“Web 目录”的子目录中提供 Laravel 应用程序。尝试这样做可能会暴露应用程序中存在的敏感文件。

## 使用 Sail 进行 Docker 安装

我们希望尽可能轻松地开始使用 Laravel，无论您偏好哪种操作系统。因此，有多种选项可用于在本地机器上开发和运行 Laravel 项目。虽然您可能希望稍后探索这些选项，但 Laravel 提供了 [Sail](/docs/11/packages/sail)，一个内置的解决方案，用于使用 [Docker](https://www.docker.com) 运行您的 Laravel 项目。

Docker 是一个在小型、轻量级“容器”中运行应用程序和服务的工具，这些容器不会干扰您的本地机器上安装的软件或配置。这意味着您不必担心在本地机器上配置或设置复杂的开发工具，如 Web 服务器和数据库。要开始，您只需要安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)。

Laravel Sail 是一个轻量级的命令行界面，用于与 Laravel 的默认 Docker 配置进行交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用程序提供了一个很好的起点，无需 Docker 经验。

> [!NOTE]
> 已经是 Docker 专家？别担心！Sail 的一切都可以使用 Laravel 附带的 `docker-compose.yml` 文件进行自定义。

### macOS 上的 Sail

如果您在 Mac 上开发并且已经安装了 [Docker Desktop](https://www.docker.com/products/docker-desktop)，您可以使用一个简单的终端命令创建一个新的 Laravel 项目。例如，要在名为 "example-app" 的目录中创建一个新的 Laravel 应用程序，您可以在终端中运行以下命令：

```shell
curl -s "https://laravel.build/example-app" | bash
```

当然，您可以根据需要更改此 URL 中的 "example-app" - 只需确保应用程序名称仅包含字母数字字符、破折号和下划线。Laravel 应用程序的目录将在执行命令的目录中创建。

Sail 安装可能需要几分钟，因为 Sail 的应用程序容器正在您的本地机器上构建。

项目创建后，您可以导航到应用程序目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行界面，用于与 Laravel 的默认 Docker 配置进行交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用程序的 Docker 容器启动后，您应该运行应用程序的[数据库迁移](/docs/11/database/migrations)：

```shell
./vendor/bin/sail artisan migrate
```

最后，您可以在 Web 浏览器中通过：http://localhost 访问应用程序。

> [!NOTE]
> 要继续了解更多关于 Laravel Sail 的信息，请查看其[完整文档](/docs/11/packages/sail)。

### Windows 上的 Sail

在 Windows 机器上创建新的 Laravel 应用程序之前，请确保安装了 [Docker Desktop](https://www.docker.com/products/docker-desktop)。接下来，您应确保已安装并启用 Windows 子系统 for Linux 2 (WSL2)。WSL 允许您在 Windows 10 上本地运行 Linux 二进制可执行文件。有关如何安装和启用 WSL2 的信息可以在 Microsoft 的[开发环境文档](https://docs.microsoft.com/en-us/windows/wsl/install-win10)中找到。

> [!NOTE]
> 安装并启用 WSL2 后，您应确保 Docker Desktop [配置为使用 WSL2 后端](https://docs.docker.com/docker-for-windows/wsl/)。

接下来，您已准备好创建您的第一个 Laravel 项目。启动 [Windows 终端](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701?rtc=1&activetab=pivot:overviewtab) 并为您的 WSL2 Linux 操作系统开始一个新的终端会话。接下来，您可以使用一个简单的终端命令创建一个新的 Laravel 项目。例如，要在名为 "example-app" 的目录中创建一个新的 Laravel 应用程序，您可以在终端中运行以下命令：

```shell
curl -s https://laravel.build/example-app | bash
```

当然，您可以根据需要更改此 URL 中的 "example-app" - 只需确保应用程序名称仅包含字母数字字符、破折号和下划线。Laravel 应用程序的目录将在执行命令的目录中创建。

Sail 安装可能需要几分钟，因为 Sail 的应用程序容器正在您的本地机器上构建。

项目创建后，您可以导航到应用程序目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行界面，用于与 Laravel 的默认 Docker 配置进行交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用程序的 Docker 容器启动后，您应该运行应用程序的[数据库迁移](/docs/11/database/migrations)：

```shell
./vendor/bin/sail artisan migrate
```

最后，您可以在 Web 浏览器中通过：http://localhost 访问应用程序。

> [!NOTE]
> 要继续了解更多关于 Laravel Sail 的信息，请查看其[完整文档](/docs/11/packages/sail)。

#### 在 WSL2 中开发

当然，您需要能够修改在 WSL2 安装中创建的 Laravel 应用程序文件。为此，我们推荐使用 Microsoft 的 [Visual Studio Code](https://code.visualstudio.com) 编辑器和他们的第一方 [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) 扩展。

安装这些工具后，您可以通过在 Windows 终端中执行 `code .` 命令从应用程序的根目录打开任何 Laravel 项目。

### Linux 上的 Sail

如果您在 Linux 上开发并且已经安装了 [Docker Compose](https://docs.docker.com/compose/install/)，您可以使用一个简单的终端命令创建一个新的 Laravel 项目。

首先，如果您使用的是 Docker Desktop for Linux，您应执行以下命令。如果您没有使用 Docker Desktop for Linux，您可以跳过此步骤：

```shell
docker context use default
```

然后，要在名为 "example-app" 的目录中创建一个新的 Laravel 应用程序，您可以在终端中运行以下命令：

```shell
curl -s https://laravel.build/example-app | bash
```

当然，您可以根据需要更改此 URL 中的 "example-app" - 只需确保应用程序名称仅包含字母数字字符、破折号和下划线。Laravel 应用程序的目录将在执行命令的目录中创建。

Sail 安装可能需要几分钟，因为 Sail 的应用程序容器正在您的本地机器上构建。

项目创建后，您可以导航到应用程序目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行界面，用于与 Laravel 的默认 Docker 配置进行交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用程序的 Docker 容器启动后，您应该运行应用程序的[数据库迁移](/docs/11/database/migrations)：

```shell
./vendor/bin/sail artisan migrate
```

最后，您可以在 Web 浏览器中通过：http://localhost 访问应用程序。

> [!NOTE]
> 要继续了解更多关于 Laravel Sail 的信息，请查看其[完整文档](/docs/11/packages/sail)。

### 选择你的 Sail 服务

通过 Sail 创建新的 Laravel 应用程序时，您可以使用 `with` 查询字符串变量来选择哪些服务应该在新应用程序的 `docker-compose.yml` 文件中配置。可用的服务包括 `mysql`、`pgsql`、`mariadb`、`redis`、`memcached`、`meilisearch`、`typesense`、`minio`、`selenium` 和 `mailpit`：

```shell
curl -s "https://laravel.build/example-app?with=mysql,redis" | bash
```

如果您没有指定希望配置哪些服务，将会配置默认的服务栈，包括 `mysql`、`redis`、`meilisearch`、`mailpit` 和 `selenium`。

您可以通过在 URL 中添加 `devcontainer` 参数，指示 Sail 安装默认的 [Devcontainer](/docs/11/packages/sail#using-devcontainers)：

```shell
curl -s "https://laravel.build/example-app?with=mysql,redis&devcontainer" | bash
```

## IDE 支持

您可以自由选择任何代码编辑器来开发 Laravel 应用程序；然而，[PhpStorm](https://www.jetbrains.com/phpstorm/laravel/) 为 Laravel 及其生态系统提供了广泛的支持，包括 [Laravel Pint](https://www.jetbrains.com/help/phpstorm/using-laravel-pint.html)。

此外，社区维护的 [Laravel Idea](https://laravel-idea.com/) PhpStorm 插件提供了各种有用的 IDE 增强功能，包括代码生成、Eloquent 语法完成、验证规则完成等。

## 下一步

现在您已经创建了您的 Laravel 项目，您可能想知道接下来学习什么。首先，我们强烈建议通过阅读以下文档来熟悉 Laravel 的工作方式：

- [请求生命周期](/docs/11/architecture-concepts/lifecycle)
- [配置](/docs/11/getting-started/configuration)
- [目录结构](/docs/11/getting-started/structure)
- [前端](/docs/11/getting-started/frontend)
- [服务容器](/docs/11/architecture-concepts/container)
- [Facades](/docs/11/architecture-concepts/facades)

您想要如何使用 Laravel 也将决定您旅程的下一步。Laravel 有多种使用方式，我们将探讨框架的两个主要用例。

> [!NOTE]
> 新手 Laravel？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在我们引导您构建第一个 Laravel 应用程序的同时，为您提供框架的实操演练。

### Laravel 全栈框架

Laravel 可以作为全栈框架服务。所谓“全栈”框架，我们的意思是您将使用 Laravel 来路由请求到您的应用程序并通过 [Blade 模板](/docs/11/basics/blade) 或类似 [Inertia](https://inertiajs.com) 的单页应用程序混合技术来渲染您的前端。这是使用 Laravel 框架最常见的方式，也是我们认为使用 Laravel 最高效的方式。

如果这是您计划使用 Laravel 的方式，您可能想要查看我们关于[前端开发](/docs/11/getting-started/frontend)、[路由](/docs/11/basics/routing)、[视图](/docs/11/basics/views)或 [Eloquent ORM](/docs/11/eloquent/eloquent) 的文档。此外，您可能对学习社区包如 [Livewire](https://livewire.laravel.com) 和 [Inertia](https://inertiajs.com) 感兴趣。这些包允许您使用 Laravel 作为全栈框架，同时享受单页 JavaScript 应用程序提供的许多 UI 优势。

如果您使用 Laravel 作为全栈框架，我们还强烈建议您学习如何使用 [Vite](/docs/11/basics/vite) 编译应用程序的 CSS 和 JavaScript。

> [!NOTE]
> 如果您希望在构建应用程序时获得一个良好的开端，请查看我们官方的[应用程序启动套件之一](/docs/11/getting-started/starter-kits)。

### Laravel API 后端

Laravel 也可以作为 JavaScript 单页应用程序或移动应用程序的 API 后端服务。例如，您可能会将 Laravel 用作 [Next.js](https://nextjs.org) 应用程序的 API 后端。在这种情况下，您可以使用 Laravel 提供[认证](/docs/11/packages/sanctum)和数据存储/检索，同时还可以利用 Laravel 的强大服务，如队列、电子邮件、通知等。

如果这是您计划使用 Laravel 的方式，您可能想要查看我们关于[路由](/docs/11/basics/routing)、[Laravel Sanctum](/docs/11/packages/sanctum) 和 [Eloquent ORM](/docs/11/eloquent/eloquent) 的文档。

> [!NOTE]
> 需要为 Laravel 后端和 Next.js 前端快速搭建脚手架吗？Laravel Breeze 提供了 [API 栈](/docs/11/getting-started/starter-kits#breeze-and-next) 以及 [Next.js 前端实现](https://github.com/laravel/breeze-next)，因此您可以在几分钟内开始。
