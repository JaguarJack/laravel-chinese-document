# Laravel Sail

[[toc]]

## 简介

[Laravel Sail](https://github.com/laravel/sail) 是一个轻量级的命令行界面，用于与 Laravel 的默认 Docker 开发环境进行交互。Sail 提供了使用 PHP、MySQL 和 Redis 构建 Laravel 应用的绝佳起点，并且不要求事先具备 Docker 经验。

Sail 的核心是存储在项目根目录下的 `docker-compose.yml` 文件以及 `sail` 脚本。`sail` 脚本提供了一个 CLI，包含便捷的方法用于与 `docker-compose.yml` 文件定义的 Docker 容器进行交互。

Laravel Sail 支持在 macOS、Linux，以及 Windows (通过 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about)) 上使用。

## 安装与设置

Laravel Sail 会随所有新的 Laravel 应用自动安装，因此您可以立即开始使用。要了解如何创建新的 Laravel 应用，请参阅 Laravel [安装文档](/docs/11/getting-started/installation#docker-installation-using-sail)，了解您操作系统的具体指南。在安装过程中，您将被询问哪些由 Sail 支持的服务将与您的应用进行交互。

### 将 Sail 安装到现有应用中

如果您有兴趣在现有的 Laravel 应用中使用 Sail，您可以简单地通过 Composer 包管理器安装 Sail。当然，这些步骤假设您现有的本地开发环境允许您安装 Composer 依赖项：

```shell
composer require laravel/sail --dev
```

安装 Sail 后，您可以运行 `sail:install` Artisan 命令。该命令将把 Sail 的 `docker-compose.yml` 文件发布到您应用的根目录，并修改 `.env` 文件，增加连接 Docker 服务所需的环境变量：

```shell
php artisan sail:install
```

最后，您可以启动 Sail。要继续了解如何使用 Sail，请继续阅读本文档的其余部分：

```shell
./vendor/bin/sail up
```

> [!WARNING]
> 如果您使用的是 Linux 的 Docker Desktop，请通过执行以下命令使用 `default` Docker 上下文：`docker context use default`。

#### 添加更多服务

如果您想要在现有的 Sail 安装中添加额外的服务，您可以运行 `sail:add` Artisan 命令：

```shell
php artisan sail:add
```

#### 使用 Devcontainers

如果您希望在 [Devcontainer](https://code.visualstudio.com/docs/remote/containers) 中进行开发，您可以在运行 `sail:install` 命令时提供 `--devcontainer` 选项。`--devcontainer` 选项将指示 `sail:install` 命令发布一个默认的 `.devcontainer/devcontainer.json` 文件到应用的根目录：

```shell
php artisan sail:install --devcontainer
```

### 重建 Sail 镜像

有时您可能想要彻底重建 Sail 镜像，以确保镜像中的所有包和软件都是最新的。您可以使用 `build` 命令完成此操作：

```shell
docker compose down -v

sail build --no-cache

sail up
```

### 配置 Shell 别名

默认情况下，使用 `vendor/bin/sail` 脚本调用 Sail 命令，该脚本随所有新的 Laravel 应用提供：

```shell
./vendor/bin/sail up
```

然而，与其重复输入 `vendor/bin/sail` 来执行 Sail 命令，您可能希望配置一个 Shell 别名，让您能更轻松地执行 Sail 的命令：

```shell
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'
```

为确保这一别名始终可用，您可以将其添加到您主目录中的 Shell 配置文件中，如 `~/.zshrc` 或 `~/.bashrc`，然后重新启动您的 Shell。

配置好 Shell 别名后，您可以通过简单输入 `sail` 来执行 Sail 命令。本文档的例子将假定您已配置此别名：

```shell
sail up
```

## 启动和停止 Sail

Laravel Sail 的 `docker-compose.yml` 文件定义了一系列 Docker 容器，这些容器共同协作帮助您构建 Laravel 应用。这些容器中的每一个都是 `docker-compose.yml` 文件中 `services` 配置的一个条目。`laravel.test` 容器是主要的应用容器，将为您的应用提供服务。

启动 Sail 之前，您应确保本地计算机上没有其他 web 服务器或数据库正在运行。要启动应用的 `docker-compose.yml` 文件中定义的所有 Docker 容器，您应执行 `up` 命令：

```shell
sail up
```

要在后台启动所有 Docker 容器，您可以以 "脱机" 模式启动 Sail：

```shell
sail up -d
```

一旦应用的容器启动完毕，您就可以在 web 浏览器中通过 http://localhost 访问项目了。

要停止所有容器，您只需按 Control + C 即可停止容器的执行。或者，如果容器在后台运行，您可以使用 `stop` 命令：

```shell
sail stop
```

## 执行命令

当使用 Laravel Sail 时，您的应用程序在 Docker 容器中执行，并与您的本地计算机隔离。然而，Sail 提供了一种方便的方法来运行各种应用程序命令，例如任意 PHP 命令、Artisan 命令、Composer 命令以及 Node / NPM 命令。

**阅读 Laravel 文档时，您经常会看到提及 Composer、Artisan 和 Node / NPM 命令但不提及 Sail 的示例。** 这些示例假定这些工具已安装在您的本地计算机上。如果您使用 Sail 作为本地 Laravel 开发环境，您应该使用 Sail 执行这些命令：

```shell
# 在本地执行 Artisan 命令...
php artisan queue:work

# 在 Laravel Sail 中执行 Artisan 命令...
sail artisan queue:work
```

### 执行 PHP 命令

PHP 命令可以使用 `php` 命令执行。当然，这些命令将使用为您的应用程序配置的 PHP 版本执行。要了解更多关于 Laravel Sail 可用的 PHP 版本，请参考 [PHP 版本文档](#sail-php-versions)：

```shell
sail php --version

sail php script.php
```

### 执行 Composer 命令

Composer 命令可以使用 `composer` 命令执行。Laravel Sail 的应用程序容器包括了一个 Composer 安装：

```shell
sail composer require laravel/sanctum
```

#### 为现有应用程序安装 Composer 依赖

如果您是与团队一起开发应用程序，您可能不是最初创建 Laravel 应用程序的人。因此，在您将应用程序的代码库克隆到本地计算机后，应用程序的 Composer 依赖项（包括 Sail）不会被安装。

您可以通过导航到应用程序目录并执行以下命令来安装应用程序的依赖项。此命令使用包含 PHP 和 Composer 的小型 Docker 容器来安装应用程序的依赖项：

```shell
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php83-composer:latest \
    composer install --ignore-platform-reqs
```

使用 `laravelsail/phpXX-composer` 镜像时，您应该使用计划用于您的应用程序的相同 PHP 版本（`80`、`81`、`82` 或 `83`）。

### 执行 Artisan 命令

Laravel Artisan 命令可以使用 `artisan` 命令执行：

```shell
sail artisan queue:work
```

### 执行 Node / NPM 命令

Node 命令可以使用 `node` 命令执行，而 NPM 命令可以使用 `npm` 命令执行：

```shell
sail node --version

sail npm run dev
```

如果您愿意，也可以使用 Yarn 代替 NPM：

```shell
sail yarn
```

## 与数据库交互

### MySQL

您可能已经注意到，您的应用程序的 `docker-compose.yml` 文件包含了一个 MySQL 容器的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，所以即使在停止和重新启动容器时，数据库中存储的数据也会被保留。

此外，在 MySQL 容器第一次启动时，它将为您创建两个数据库。第一个数据库使用您的 `DB_DATABASE` 环境变量的值命名，用于您的本地开发。第二个数据库是一个专用的测试数据库，命名为 `testing`，它将确保您的测试不会干扰您的开发数据。

一旦您启动了容器，就可以通过在应用程序的 `.env` 文件中将 `DB_HOST` 环境变量设置为 `mysql` 来连接应用程序内的 MySQL 实例。

要从您的本地计算机连接到应用程序的 MySQL 数据库，您可以使用图形化的数据库管理应用程序，如 [TablePlus](https://tableplus.com)。默认情况下，MySQL 数据库可以通过 `localhost` 端口 3306 访问，访问凭证对应于您的 `DB_USERNAME` 和 `DB_PASSWORD` 环境变量的值。或者，您也可以作为 `root` 用户连接，它的密码也使用 `DB_PASSWORD` 环境变量的值。

### Redis

您的应用程序的 `docker-compose.yml` 文件还包含了一个 [Redis](https://redis.io) 容器的条目。这个容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，以便即使在停止和重启您的容器时，也能持久保存在 Redis 中的数据。一旦您启动了容器，您可以通过在应用程序的 `.env` 文件中设置 `REDIS_HOST` 环境变量为 `redis` 来连接应用程序内的 Redis 实例。

要从您的本地计算机连接到应用程序的 Redis 数据库，您可以使用图形数据库管理应用程序，例如 [TablePlus](https://tableplus.com)。默认情况下，Redis 数据库可在 `localhost` 端口 6379 访问。

### Meilisearch

如果您在安装 Sail 时选择安装 [Meilisearch](https://www.meilisearch.com) 服务，您的应用程序的 `docker-compose.yml` 文件将包含一个条目，用于这个强大的搜索引擎，它与 [Laravel Scout](/docs/11/packages/scout) 兼容。一旦您启动了容器，您可以通过设置 `MEILISEARCH_HOST` 环境变量为 `http://meilisearch:7700` 来连接应用程序内的 Meilisearch 实例。

从您的本地计算机，您可以通过浏览器导航到 `http://localhost:7700` 来访问 Meilisearch 的基于网络的管理面板。

### Typesense

如果您在安装 Sail 时选择安装 [Typesense](https://typesense.org) 服务，您的应用程序的 `docker-compose.yml` 文件将包含一个条目，用于这个快速的开源搜索引擎，它与 [Laravel Scout](/docs/11/packages/scout#typesense) 有着原生集成。一旦您启动了容器，您可以通过设置以下环境变量来连接应用程序内的 Typesense 实例：

```ini
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

从您的本地计算机，您可以通过 `http://localhost:8108` 访问 Typesense 的 API。

## 文件存储

如果您计划在应用程序的生产环境中运行时使用 Amazon S3 存储文件，您可能希望在安装 Sail 时安装 [MinIO](https://min.io) 服务。MinIO 提供了一个与 S3 兼容的 API，您可以使用它来使用 Laravel 的 `s3` 文件存储驱动在本地开发，而无需在生产环境的 S3 环境中创建 "测试" 存储桶。如果您在安装 Sail 时选择安装 MinIO，一个 MinIO 配置部分将被添加到您应用程序的 `docker-compose.yml` 文件中。

默认情况下，您的应用程序的 `filesystems` 配置文件已经包含了 `s3` 磁盘的磁盘配置。除了使用这个磁盘与 Amazon S3 进行交互外，您还可以通过简单地修改控制其配置的相关环境变量来使用它与任何 S3 兼容的文件存储服务（如 MinIO）进行交互。例如，当使用 MinIO 时，您的文件系统环境变量配置应定义如下：

```ini
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sail
AWS_SECRET_ACCESS_KEY=password
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=local
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

为了让 Laravel 的 Flysystem 集成在使用 MinIO 时生成正确的 URL，您应该定义 `AWS_URL` 环境变量，使其匹配您的应用程序的本地 URL 并在 URL 路径中包含存储桶名称：

```ini
AWS_URL=http://localhost:9000/local
```

您可以通过 MinIO 控制台创建存储桶，该控制台可在 `http://localhost:8900` 访问。MinIO 控制台的默认用户名是 `sail`，默认密码是 `password`。

> [!WARNING]  
> 使用 MinIO 时不支持通过 `temporaryUrl` 方法生成临时存储 URL。

## 运行测试

Laravel 内置了令人惊艳的测试支持，您可以使用 Sail 的 `test` 命令来运行您的应用程序[功能和单元测试](/docs/11/testing/testing)。任何 Pest / PHPUnit 接受的 CLI 选项也可以传递给 `test` 命令：

```shell
sail test

sail test --group orders
```

Sail 的 `test` 命令相当于运行 `test` Artisan 命令：

```shell
sail artisan test
```

默认情况下，Sail 将创建一个专用的 `testing` 数据库，以便您的测试不会干扰数据库的当前状态。在默认的 Laravel 安装中，Sail 还会配置您的 `phpunit.xml` 文件在执行测试时使用这个数据库：

```xml
<env name="DB_DATABASE" value="testing"/>
```

### Laravel Dusk

[Laravel Dusk](/docs/11/testing/dusk) 提供了一个表达性的、易于使用的浏览器自动化和测试 API。感谢 Sail，您可以在不在本地计算机上安装 Selenium 或其他工具的情况下运行这些测试。开始之前，请在应用程序的 `docker-compose.yml` 文件中取消注释 Selenium 服务：

```yaml
selenium:
  image: 'selenium/standalone-chrome'
  extra_hosts:
    - 'host.docker.internal:host-gateway'
  volumes:
    - '/dev/shm:/dev/shm'
  networks:
    - sail
```

接下来，确保应用程序的 `docker-compose.yml` 文件中的 `laravel.test` 服务有一个 `depends_on` 条目指向 `selenium`：

```yaml
depends_on:
  - mysql
  - redis
  - selenium
```

最后，您可以启动 Sail 并运行 `dusk` 命令来运行您的 Dusk 测试套件：

```shell
sail dusk
```

#### Apple Silicon 上的 Selenium

如果您的本地机器包含 Apple Silicon 芯片，您的 `selenium` 服务必须使用 `seleniarm/standalone-chromium` 镜像：

```yaml
selenium:
  image: 'seleniarm/standalone-chromium'
  extra_hosts:
    - 'host.docker.internal:host-gateway'
  volumes:
    - '/dev/shm:/dev/shm'
  networks:
    - sail
```

## 预览电子邮件

Laravel Sail 默认的 `docker-compose.yml` 文件包含了一个 [Mailpit](https://github.com/axllent/mailpit) 服务的条目。Mailpit 拦截在本地开发过程中由您的应用程序发送的电子邮件，并提供一个方便的网络界面，让您可以在浏览器中预览您的电子邮件消息。使用 Sail 时，Mailpit 的默认主机是 `mailpit` ，通过 1025 端口可以访问：

```ini
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```

当 Sail 运行时，您可以访问 Mailpit 网络界面：`http://localhost:8025`

## 容器 CLI

有时您可能希望在应用程序的容器内启动一个 Bash 会话。您可以使用 `shell` 命令连接到应用程序的容器，允许您检查其文件和安装的服务以及在容器内执行任意 shell 命令：

```shell
sail shell

sail root-shell
```

要开始一个新的 [Laravel Tinker](https://github.com/laravel/tinker) 会话，您可以执行 `tinker` 命令：

```shell
sail tinker
```

## PHP 版本

Sail 目前支持通过 PHP 8.3、8.2、8.1 或 PHP 8.0 提供服务给您的应用程序。Sail 目前默认使用的 PHP 版本是 PHP 8.3。要更改用于提供应用程序服务的 PHP 版本，您应该更新应用程序的 `docker-compose.yml` 文件中的 `laravel.test` 容器的 `build` 定义：

```yaml
# PHP 8.3
context: ./vendor/laravel/sail/runtimes/8.3

# PHP 8.2
context: ./vendor/laravel/sail/runtimes/8.2

# PHP 8.1
context: ./vendor/laravel/sail/runtimes/8.1

# PHP 8.0
context: ./vendor/laravel/sail/runtimes/8.0
```

此外，您可能希望更新您的 `image` 名称以反映您的应用程序使用的 PHP 版本。该选项也在应用程序的 `docker-compose.yml` 文件中定义：

```yaml
image: sail-8.2/app
```

更新应用程序的 `docker-compose.yml` 文件后，您应该重建容器镜像：

```shell
sail build --no-cache

sail up
```

## Node 版本

Sail 默认安装 Node 20。要更改构建镜像时安装的 Node 版本，您可以更新应用程序的 `docker-compose.yml` 文件中的 `laravel.test` 服务的 `build.args` 定义：

```yaml
build:
  args:
    WWWGROUP: '${WWWGROUP}'
    NODE_VERSION: '18'
```

更新应用程序的 `docker-compose.yml` 文件后，您应该重建容器镜像：

```shell
sail build --no-cache

sail up
```

## 共享您的站点

有时您可能需要公开共享您的站点，以预览站点给同事看，或者用于测试您的应用程序中的 webhook 集成。要共享您的站点，您可以使用 `share` 命令。执行此命令后，您将获得一个随机的 `laravel-sail.site` URL，您可以用它来访问您的应用程序：

```shell
sail share
```

通过 `share` 命令共享站点时，您应该在应用程序的 `bootstrap/app.php` 文件中使用 `trustProxies` 中间件方法来配置应用程序的受信任代理。否则，URL 生成助手（如 `url` 和 `route`）将无法确定在 URL 生成期间应使用的正确 HTTP 主机：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: [
        '*',
    ]);
})
```

如果您希望为共享的站点选择子域，您可以在执行 `share` 命令时提供 `subdomain` 选项：

```shell
sail share --subdomain=my-sail-site
```

> [!NOTE]  
> `share` 命令由 [Expose](https://github.com/beyondcode/expose) 提供支持，这是一个由 [BeyondCode](https://beyondco.de) 提供的开源隧道服务。

## 使用 Xdebug 调试

Laravel Sail 的 Docker 配置包括对 [Xdebug](https://xdebug.org/) 的支持，Xdebug 是 PHP 的一个流行而强大的调试器。要启用 Xdebug，您需要在应用程序的 `.env` 文件中添加一些变量来 [配置 Xdebug](https://xdebug.org/docs/step_debug#mode)。在启动 Sail 之前您必须设置适当的模式：

```ini
SAIL_XDEBUG_MODE=develop,debug,coverage
```

#### Linux 主机 IP 配置

内部，`XDEBUG_CONFIG` 环境变量被定义为 `client_host=host.docker.internal`，以便 Xdebug 能够针对 Mac 和 Windows（WSL2）进行正确配置。如果您的本地机器运行的是 Linux，您应该确保正在运行 Docker 引擎 17.06.0+ 和 Compose 1.16.0+。否则，您需要手动定义此环境变量，如下所示。

首先，您应该通过运行以下命令来确定正确的主机 IP 地址以添加到环境变量中。通常，`<container-name>` 应该是服务您的应用程序的容器的名称，通常以 `_laravel.test_1` 结尾：

```shell
docker inspect -f {{range.NetworkSettings.Networks}}{{.Gateway}}{{end}} <container-name>
```

获取到正确的主机 IP 地址后，您应该在应用程序的 `.env` 文件中定义 `SAIL_XDEBUG_CONFIG` 变量：

```ini
SAIL_XDEBUG_CONFIG="client_host=<host-ip-address>"
```

### Xdebug CLI 使用

`sail debug` 命令可用于在运行 Artisan 命令时启动调试会话：

```shell
# 运行没有 Xdebug 的 Artisan 命令...
sail artisan migrate

# 使用 Xdebug 运行 Artisan 命令...
sail debug migrate
```

### Xdebug 浏览器使用

在通过网络浏览器与应用程序交互时进行调试，可按照 [Xdebug 提供的说明](https://xdebug.org/docs/step_debug#web-application) 从网络浏览器初始化 Xdebug 会话。

如果您使用 PhpStorm，请查看 JetBrains 关于 [零配置调试](https://www.jetbrains.com/help/phpstorm/zero-configuration-debugging.html) 的文档。

> [!WARNING]  
> Laravel Sail 依赖 `artisan serve` 来服务您的应用程序。`artisan serve` 命令从 Laravel 8.53.0 版本开始才接受 `XDEBUG_CONFIG` 和 `XDEBUG_MODE` 变量。较早版本的 Laravel（8.52.0 及以下）不支持这些变量，也不会接受调试连接。

## 自定义

由于 Sail 就是 Docker，您可以自由地自定义 Sail 几乎所有的东西。要发布 Sail 自己的 Dockerfiles，您可以执行 `sail:publish` 命令：

```shell
sail artisan sail:publish
```

执行此命令后，Laravel Sail 使用的 Dockerfiles 和其他配置文件将被放置在应用程序根目录的 `docker` 目录中。自定义您的 Sail 安装后，您可能希望更改应用程序的 `docker-compose.yml` 文件中的应用程序容器的镜像名称。进行更改后，使用 `build` 命令重建应用程序的容器。如果您使用 Sail 来开发单个机器上的多个 Laravel 应用程序，则为应用程序镜像分配一个唯一名称特别重要：

```shell
sail build --no-cache
```
