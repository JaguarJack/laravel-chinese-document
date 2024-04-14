---
title: Laravel Homestead
---

# Homestead

[[toc]]

## 介绍

Laravel 力图让整个 PHP 开发体验令人愉悦，包括您的本地开发环境。[Laravel Homestead](https://github.com/laravel/homestead) 是一个官方预先打包的 Vagrant 盒子，它在不需要您在本地机器上安装 PHP、Web 服务器或任何其他服务器软件的情况下，为您提供了一个绝妙的开发环境。

[Vagrant](https://www.vagrantup.com) 提供了一种简单、优雅的方式来管理和配置虚拟机。Vagrant 盒子是完全可丢弃的。如果出现问题，您可以在几分钟内销毁并重新创建盒子！

Homestead 可以在任何 Windows、macOS 或 Linux 系统上运行，并包括 Nginx、PHP、MySQL、PostgreSQL、Redis、Memcached、Node 以及开发惊人 Laravel 应用所需的所有其他软件。

> [!WARNING]
> 如果您使用的是 Windows，您可能需要启用硬件虚拟化 (VT-x)。通常可以通过您的 BIOS 启用它。如果您在 UEFI 系统上使用 Hyper-V，您可能还需禁用 Hyper-V 才能访问 VT-x。

### 包含的软件

- Ubuntu 22.04
- Git
- PHP 8.3
- PHP 8.2
- PHP 8.1
- PHP 8.0
- PHP 7.4
- PHP 7.3
- PHP 7.2
- PHP 7.1
- PHP 7.0
- PHP 5.6
- Nginx
- MySQL 8.0
- lmm
- Sqlite3
- PostgreSQL 15
- Composer
- Docker
- Node (包括 Yarn, Bower, Grunt 和 Gulp)
- Redis
- Memcached
- Beanstalkd
- Mailpit
- avahi
- ngrok
- Xdebug
- XHProf / Tideways / XHGui
- wp-cli

### 可选软件

- Apache
- Blackfire
- Cassandra
- Chronograf
- CouchDB
- Crystal & Lucky Framework
- Elasticsearch
- EventStoreDB
- Flyway
- Gearman
- Go
- Grafana
- InfluxDB
- Logstash
- MariaDB
- Meilisearch
- MinIO
- MongoDB
- Neo4j
- Oh My Zsh
- Open Resty
- PM2
- Python
- R
- RabbitMQ
- Rust
- RVM (Ruby 版本管理器)
- Solr
- TimescaleDB
- Trader (PHP 扩展)
- Webdriver & Laravel Dusk 工具

## 安装和设置

### 第一步

在启动您的 Homestead 环境之前，您必须安装 [Vagrant](https://developer.hashicorp.com/vagrant/downloads) 以及以下支持的供应商之一：

- [VirtualBox 6.1.x](https://www.virtualbox.org/wiki/Download_Old_Builds_6_1)
- [Parallels](https://www.parallels.com/products/desktop/)

所有这些软件包为所有流行的操作系统提供易于使用的视觉安装器。

要使用 Parallels 提供商，您需要安装 [Parallels Vagrant 插件](https://github.com/Parallels/vagrant-parallels)。它是免费的。

#### 安装 Homestead

您可以通过将 Homestead 仓库克隆到您的主机上来安装 Homestead。考虑将仓库克隆到您的“主目录”中的 `Homestead` 文件夹，因为 Homestead 虚拟机将成为您所有 Laravel 应用的主机。在本文档中，我们将这个目录称为您的“Homestead 目录”：

```shell
git clone https://github.com/laravel/homestead.git ~/Homestead
```

克隆 Laravel Homestead 仓库之后，您应该切换到 `release` 分支。这个分支总是包含最新的稳定版本的 Homestead：

```shell
cd ~/Homestead

git checkout release
```

接下来，从 Homestead 目录执行 `bash init.sh` 命令创建 `Homestead.yaml` 配置文件。`Homestead.yaml` 文件是您将配置所有 Homestead 安装设置的地方。该文件将被放置在 Homestead 目录中：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

### 配置 Homestead

#### 设置您的提供商

`Homestead.yaml` 文件中的 `provider` 键指示应使用哪个 Vagrant 提供商：`virtualbox` 或 `parallels`：

```yaml
provider: virtualbox
```

> [!WARNING]
> 如果您使用的是苹果硅片，Parallels 提供商是必需的。

#### 配置共享文件夹

`Homestead.yaml` 文件的 `folders` 属性列出了您希望与您的 Homestead 环境共享的所有文件夹。随着这些文件夹中的文件被更改，它们将在您的本地机器和 Homestead 虚拟环境之间同步。您可以根据需要配置尽可能多的共享文件夹：

```yaml
folders:
  - map: ~/code/project1
    to: /home/vagrant/project1
```

> [!WARNING]
> Windows 用户不应使用 `~/` 路径语法，而应使用项目的完整路径，例如 `C:\Users\user\Code\project1`。

您应始终将各个应用程序映射到其自己的文件夹映射，而不是映射包含您所有应用程序的单个大目录。当您映射一个文件夹时，虚拟机必须跟踪文件夹中*每个*文件的所有磁盘 IO。如果文件夹中有大量文件，您可能会经历性能下降：

```yaml
folders:
  - map: ~/code/project1
    to: /home/vagrant/project1
  - map: ~/code/project2
    to: /home/vagrant/project2
```

> [!WARNING]
> 在使用 Homestead 时，您不应挂载 `.`（当前目录）。这会导致 Vagrant 不将当前文件夹映射到 `/vagrant`，在配置环境时可能会破坏可选功能并导致意外结果。

为了启用 NFS，你可以在文件夹映射中添加一个 `type` 选项：

```yaml
folders:
  - map: ~/code/project1
    to: /home/vagrant/project1
    type: 'nfs'
```

> [!WARNING]
> 当在 Windows 上使用 NFS 时，你应该考虑安装 vagrant-winnfsd 插件。该插件将维护 Homestead 虚拟机内的文件和目录的正确用户/组权限。

你还可以通过在 `options` 键下列出它们来传递 Vagrant 的同步文件夹支持的任何选项：

```yaml
folders:
  - map: ~/code/project1
    to: /home/vagrant/project1
    type: 'rsync'
    options:
      rsync__args: ['--verbose', '--archive', '--delete', '-zz']
      rsync__exclude: ['node_modules']
```

### 配置 Nginx 站点

不熟悉 Nginx？没问题。你的 `Homestead.yaml` 文件中的 `sites` 属性让你可以轻松地将一个“域名”映射到你的 Homestead 环境中的一个文件夹。`Homestead.yaml` 文件中包含了一个样本站点配置。同样地，你可以在你的 Homestead 环境中添加尽可能多的站点。Homestead 可以为你正在开发的每一个 Laravel 应用程序提供一个方便的、虚拟化的环境：

```yaml
sites:
  - map: homestead.test
    to: /home/vagrant/project1/public
```

如果你在配置好 Homestead 虚拟机后更改了 `sites` 属性，你应该在终端执行 `vagrant reload --provision` 命令来更新虚拟机上的 Nginx 配置。

> [!WARNING]
> Homestead 脚本尽可能地构建得具有幂等性。然而，如果在配置过程中遇到问题，你应该通过执行 `vagrant destroy && vagrant up` 命令来销毁并重建机器。

#### 主机名解析

Homestead 使用 `mDNS` 来发布主机名，以便自动解析主机。如果你在 `Homestead.yaml` 文件中设置了 `hostname: homestead`，主机将以 `homestead.local` 的形式可用。macOS、iOS 和 Linux 桌面发行版默认包括 `mDNS` 支持。如果你在使用 Windows，你必须安装 Bonjour 打印服务。

对于每个项目的 Homestead 安装来说，使用自动主机名工作得最好。如果你在单个 Homestead 实例上托管多个站点，你可以将你的网站的“域名”添加到你的机器上的 `hosts` 文件中。`hosts` 文件将把你的 Homestead 站点的请求重定向到你的 Homestead 虚拟机。在 macOS 和 Linux 上，这个文件位于 `/etc/hosts`。在 Windows 上，它位于 `C:\Windows\System32\drivers\etc\hosts`。你添加到该文件的行将如下所示：

```
192.168.56.56  homestead.test
```

确保列出的 IP 地址是你在 `Homestead.yaml` 文件中设置的地址。一旦你已经将域名添加到你的 `hosts` 文件并启动了 Vagrant 盒子，你将可以通过你的网络浏览器访问站点：

```shell
http://homestead.test
```

### 配置服务

Homestead 默认启动了若干服务；然而，你可以在配置过程中自定义哪些服务被启用或禁用。例如，你可以通过修改 `Homestead.yaml` 文件中的 `services` 选项来启用 PostgreSQL 并禁用 MySQL：

```yaml
services:
  - enabled:
      - 'postgresql'
  - disabled:
      - 'mysql'
```

根据 `enabled` 和 `disabled` 指令中的顺序，指定的服务将被启动或停止。

### 启动 Vagrant 盒子

一旦你已根据自己的喜好编辑了 `Homestead.yaml`，从你的 Homestead 目录运行 `vagrant up` 命令。Vagrant 将启动虚拟机并自动配置你的共享文件夹和 Nginx 站点。

要销毁机器，你可以使用 `vagrant destroy` 命令。

### 每个项目的安装

与其全局安装 Homestead 并在你所有的项目中共享同一个 Homestead 虚拟机，不如为你管理的每个项目配置一个 Homestead 实例。如果你想要随项目提供一个 `Vagrantfile`，以便项目中的其他人在克隆项目仓库后立即 `vagrant up`，那么为每个项目安装 Homestead 可能会更有利。

你可以使用 Composer 包管理器将 Homestead 安装到你的项目中：

```shell
composer require laravel/homestead --dev
```

安装 Homestead 后，调用 Homestead 的 `make` 命令为你的项目生成 `Vagrantfile` 和 `Homestead.yaml` 文件。这些文件将被放置在你项目的根目录中。`make` 命令将自动配置 `Homestead.yaml` 文件中的 `sites` 和 `folders` 指令：

```shell
# macOS / Linux...
php vendor/bin/homestead make

# Windows...
vendor\\bin\\homestead make
```

接下来，在终端运行 `vagrant up` 命令，并通过你的浏览器访问 `http://homestead.test` 上的你的项目。请记住，如果你没有使用自动主机名解析，你仍然需要在 `/etc/hosts` 文件中为 `homestead.test` 或你选择的域名添加一个条目。

### 安装可选功能

可选软件使用 `Homestead.yaml` 文件中的 `features` 选项进行安装。大多数功能可以通过布尔值启用或禁用，而一些功能允许多个配置选项：

```yaml
features:
    - blackfire:
        server_id: "server_id"
        server_token: "server_value"
        client_id: "client_id"
        client_token: "client_value"
    - cassandra: true
    - chronograf: true
    - couchdb: true
    - crystal: true
    - dragonflydb: true
    - elasticsearch:
        version: 7.9.0
    - eventstore: true
        version: 21.2.0
    - flyway: true
    - gearman: true
    - golang: true
    - grafana: true
    - influxdb: true
    - logstash: true
    - mariadb: true
    - meilisearch: true
    - minio: true
    - mongodb: true
    - neo4j: true
    - ohmyzsh: true
    - openresty: true
    - pm2: true
    - python: true
    - r-base: true
    - rabbitmq: true
    - rustc: true
    - rvm: true
    - solr: true
    - timescaledb: true
    - trader: true
    - webdriver: true
```

#### Elasticsearch

你可以指定一个受支持的 Elasticsearch 版本，必须是确切的版本号（major.minor.patch）。默认安装将创建一个名为 'homestead' 的集群。你不应该给 Elasticsearch 分配超过操作系统内存的一半，所以确保你的 Homestead 虚拟机至少有 Elasticsearch 分配的两倍内存。

> [!NOTE]
> 查看 Elasticsearch 文档以了解如何自定义配置。

#### MariaDB

启用 MariaDB 将移除 MySQL 并安装 MariaDB。MariaDB 通常作为 MySQL 的替代品，所以你仍应在应用程序的数据库配置中使用 `mysql` 数据库驱动。

#### MongoDB

默认的 MongoDB 安装将设置数据库用户名为 `homestead`，相应密码为 `secret`。

#### Neo4j

默认的 Neo4j 安装将设置数据库用户名为 `homestead`，相应密码为 `secret`。要访问 Neo4j 浏览器，通过你的网络浏览器访问 `http://homestead.test:7474`。端口 `7687`（Bolt）、`7474`（HTTP）和 `7473`（HTTPS）已准备好从 Neo4j 客户端接收请求。

### 别名

通过在你的 Homestead 目录中修改 `aliases` 文件，你可以为你的 Homestead 虚拟机添加 Bash 别名：

```shell
alias c='clear'
alias ..='cd ..'
```

更新 `aliases` 文件后，你应该使用 `vagrant reload --provision` 命令重新配置 Homestead 虚拟机。这将确保你的新别名在机器上可用。

## 更新 Homestead

在开始更新 Homestead 之前，应确保已通过在 Homestead 目录中运行以下命令来移除当前的虚拟机：

```shell
vagrant destroy
```

接下来，您需要更新 Homestead 源代码。如果你克隆了该仓库，可以在最初克隆仓库的地方执行以下命令：

```shell
git fetch

git pull origin release
```

这些命令将从 GitHub 仓库中拉取最新的 Homestead 代码，获取最新的标签，然后检出最新的发布版本。你可以在 Homestead 的 [GitHub 发布页面](https://github.com/laravel/homestead/releases)上找到最新稳定版本。

如果你通过项目的 `composer.json` 文件安装了 Homestead，应确保你的 `composer.json` 文件包含 `"laravel/homestead": "^12"`，然后更新依赖项：

```shell
composer update
```

接下来，应该使用 `vagrant box update` 命令更新 Vagrant 盒子：

```shell
vagrant box update
```

更新 Vagrant 盒子后，应该从 Homestead 目录中运行 `bash init.sh` 命令，以更新 Homestead 的附加配置文件。系统会询问您是否希望覆盖现有的 `Homestead.yaml`、`after.sh` 和 `aliases` 文件：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

最后，您需要重新生成 Homestead 虚拟机，以使用最新的 Vagrant 安装：

```shell
vagrant up
```

## 日常使用

### 通过 SSH 连接

您可以通过在 Homestead 目录中执行 `vagrant ssh` 终端命令来 SSH 进入虚拟机。

### 添加额外的站点

一旦您的 Homestead 环境配置并运行起来，你可能会想为其他 Laravel 项目添加额外的 Nginx 站点。您可以在单个 Homestead 环境上运行任意多的 Laravel 项目。要添加额外的站点，将站点添加到 `Homestead.yaml` 文件中。

```yaml
sites:
  - map: homestead.test
    to: /home/vagrant/project1/public
  - map: another.test
    to: /home/vagrant/project2/public
```

> [!WARNING]
> 在添加站点之前，应确保已为项目目录配置了[文件夹映射](#configuring-shared-folders)。

如果 Vagrant 没有自动管理你的 "hosts" 文件，您可能还需要将新站点添加到该文件中。在 macOS 和 Linux 上，此文件位于 `/etc/hosts`。在 Windows 上，它位于 `C:\Windows\System32\drivers\etc\hosts`：

```
192.168.56.56  homestead.test
192.168.56.56  another.test
```

添加站点后，从您的 Homestead 目录中执行 `vagrant reload --provision` 终端命令。

#### 站点类型

Homestead 支持几种“类型”的站点，使得您可以轻松运行基于 Laravel 之外的项目。例如，我们可以轻松地通过使用 `statamic` 站点类型将 Statamic 应用添加到 Homestead：

```yaml
sites:
  - map: statamic.test
    to: /home/vagrant/my-symfony-project/web
    type: 'statamic'
```

可用的站点类型包括：`apache`, `apache-proxy`, `apigility`, `expressive`, `laravel`（默认值）, `proxy`（用于 nginx）, `silverstripe`, `statamic`, `symfony2`, `symfony4`, 和 `zf`。

#### 站点参数

您可以通过站点的 `params` 指令为您的站点添加额外的 Nginx `fastcgi_param` 值：

```yaml
sites:
  - map: homestead.test
    to: /home/vagrant/project1/public
    params:
      - key: FOO
        value: BAR
```

### 环境变量

你可以通过在 `Homestead.yaml` 文件中添加它们来定义全局环境变量：

```yaml
variables:
  - key: APP_ENV
    value: local
  - key: FOO
    value: bar
```

更新 `Homestead.yaml` 文件后，请确保通过执行 `vagrant reload --provision` 命令来重新配置机器。这将更新所有已安装 PHP 版本的 PHP-FPM 配置并同时更新 `vagrant` 用户的环境。

### 端口

默认情况下，以下端口被转发到您的 Homestead 环境：

- **HTTP：** 8000 &rarr; 转发到 80
- **HTTPS：** 44300 &rarr; 转发到 443

#### 转发额外端口

如果需要，您可以通过在您的 `Homestead.yaml` 文件中定义一个 `ports` 配置条目来转发额外的端口到 Vagrant 盒子。更新 `Homestead.yaml` 文件后，请确保通过执行 `vagrant reload --provision` 命令来重新配置机器：

```yaml
ports:
  - send: 50000
    to: 5000
  - send: 7777
    to: 777
    protocol: udp
```

以下是您可能希望从主机映射到 Vagrant 盒子的其他 Homestead 服务端口的列表：

- **SSH：** 2222 &rarr; 到 22
- **ngrok UI：** 4040 &rarr; 到 4040
- **MySQL：** 33060 &rarr; 到 3306
- **PostgreSQL：** 54320 &rarr; 到 5432
- **MongoDB：** 27017 &rarr; 到 27017
- **Mailpit：** 8025 &rarr; 到 8025
- **Minio：** 9600 &rarr; 到 9600

### PHP 版本

Homestead 支持在同一虚拟机上运行多个版本的 PHP。您可以在 `Homestead.yaml` 文件中指定哪个 PHP 版本用于给定站点。可用的 PHP 版本有："5.6", "7.0", "7.1", "7.2", "7.3", "7.4", "8.0", "8.1", "8.2" 和 "8.3"（默认值）：

```yaml
sites:
  - map: homestead.test
    to: /home/vagrant/project1/public
    php: '7.1'
```

[在您的 Homestead 虚拟机内部](#connecting-via-ssh)，您可以通过 CLI 使用任何支持的 PHP 版本：

```shell
php5.6 artisan list
php7.0 artisan list
php7.1 artisan list
php7.2 artisan list
php7.3 artisan list
php7.4 artisan list
php8.0 artisan list
php8.1 artisan list
php8.2 artisan list
php8.3 artisan list
```

您可以通过在 Homestead 虚拟机内部执行以下命令来更改 CLI 使用的默认 PHP 版本：

```shell
php56
php70
php71
php72
php73
php74
php80
php81
php82
php83
```

### 连接数据库

开箱即用的 `homestead` 数据库已为 MySQL 和 PostgreSQL 配置好。要从您的宿主机的数据库客户端连接到 MySQL 或 PostgreSQL 数据库，请连接到端口 `33060`（对于 MySQL） 或 `54320`（对于 PostgreSQL）上的 `127.0.0.1`。这两个数据库的用户名和密码都是 `homestead` / `secret`。

> [!WARNING]  
> 您应该只在从宿主机连接到数据库时使用这些非标准端口。您将在 Laravel 应用程序的 `database` 配置文件中使用默认的 3306 和 5432 端口，因为 Laravel 是在虚拟机*内部*运行的。

### 数据库备份

当您销毁您的 Homestead 虚拟机时，Homestead 可以自动备份您的数据库。要使用此功能，您必须使用 Vagrant 2.1.0 或更高版本。或者，如果您正在使用旧版本的 Vagrant，则必须安装 `vagrant-triggers` 插件。要启用自动数据库备份，请在您的 `Homestead.yaml` 文件中添加以下行：

```yaml
backup: true
```

一旦配置完成，当执行 `vagrant destroy` 命令时，Homestead 将会导出您的数据库到 `.backup/mysql_backup` 和 `.backup/postgres_backup` 目录。这些目录可以在您安装 Homestead 的文件夹中找到，或者如果您正在使用每个项目安装方法，则可以在项目的根目录中找到。

### 配置 Cron 计划任务

Laravel 提供了一种方便的方式来通过安排单个的 `schedule:run` Artisan 命令来计划 cron 作业，该命令每分钟运行一次。`schedule:run` 命令将检查您的 `routes/console.php` 文件中定义的作业计划以确定哪些计划任务要运行。

如果您希望为 Homestead 站点运行 `schedule:run` 命令，您可以在定义站点时将 `schedule` 选项设置为 `true`：

```yaml
sites:
  - map: homestead.test
    to: /home/vagrant/project1/public
    schedule: true
```

该站点的 cron 作业将在 Homestead 虚拟机的 `/etc/cron.d` 目录中定义。

### 配置 Mailpit

[Mailpit](https://github.com/axllent/mailpit) 允许您拦截您的去邮件并检查它，而无需实际将邮件发送给其收件人。要开始，请更新您的应用程序的 `.env` 文件以使用以下邮件设置：

```ini
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

配置完 Mailpit 后，您可以访问 `http://localhost:8025` 上的 Mailpit 控制台。

### 配置 Minio

[Minio](https://github.com/minio/minio) 是一个开源的对象存储服务器，具有与 Amazon S3 兼容的 API。要安装 Minio，请在 [features](#installing-optional-features) 部分的您的 `Homestead.yaml` 文件中更新以下配置选项：

```yaml
minio: true
```

默认情况下，Minio 可用于 9600 端口。您可以通过访问 `http://localhost:9600` 来访问 Minio 控制面板。默认的访问密钥是 `homestead`，而默认的密匙是 `secretkey`。访问 Minio 时，您应始终使用地区 `us-east-1`。

为了使用 Minio，请确保您的 `.env` 文件有以下选项：

```ini
AWS_USE_PATH_STYLE_ENDPOINT=true
AWS_ENDPOINT=http://localhost:9600
AWS_ACCESS_KEY_ID=homestead
AWS_SECRET_ACCESS_KEY=secretkey
AWS_DEFAULT_REGION=us-east-1
```

要预备使用 Minio 驱动的“S3”桶，在您的 `Homestead.yaml` 文件中添加一个 `buckets` 指令。定义完您的桶子后，您应该执行您终端中的 `vagrant reload --provision` 命令：

```yaml
buckets:
  - name: your-bucket
    policy: public
  - name: your-private-bucket
    policy: none
```

支持的 `policy` 值包括：`none`，`download`，`upload` 和 `public`。

### Laravel Dusk

为了在 Homestead 内运行 [Laravel Dusk](/docs/11/testing/dusk) 测试，您应该在您的 Homestead 配置中启用 [`webdriver` feature](#installing-optional-features)：

```yaml
features:
  - webdriver: true
```

启用 `webdriver` 功能后，您应该执行终端中的 `vagrant reload --provision` 命令。

### 共享您的环境

有时您可能希望与同事或客户分享您当前的工作。Vagrant 有内置的支持通过 `vagrant share` 命令实现；然而，如果您在 `Homestead.yaml` 文件中配置了多个站点，这将不起作用。

为了解决这个问题，Homestead 包括了它自己的 `share` 命令。开始使用，请通过 `vagrant ssh` [SSH 进入您的 Homestead 虚拟机](#connecting-via-ssh)，并执行 `share homestead.test` 命令。该命令将从您的 `Homestead.yaml` 配置文件中共享 `homestead.test` 站点。您可以将 `homestead.test` 替换为您的其他任何已配置站点：

```shell
share homestead.test
```

运行命令后，您将看到一个 Ngrok 屏幕出现，其中包含活动日志和共享站点的公开可访问的 URL。如果您想指定自定义地区、子域名或其他 Ngrok 运行时选项，您可以将它们添加到您的 `share` 命令中：

```shell
share homestead.test -region=eu -subdomain=laravel
```

如果您需要通过 HTTPS 而不是 HTTP 共享内容，使用 `sshare` 命令而不是 `share` 将使您能够做到这一点。

> [!WARNING]  
> 请记住，Vagrant 本质上是不安全的，当运行 `share` 命令时您正在将您的虚拟机暴露给互联网。

## 调试和性能分析

### 使用 Xdebug 调试 Web 请求

Homestead 包括了使用 [Xdebug](https://xdebug.org) 的步骤调试支持。例如，您可以在浏览器中访问一个页面，PHP 将连接到您的 IDE，允许您检查和修改运行中的代码。

默认情况下，Xdebug 已经在运行并准备接受连接。如果您需要在 CLI 上启用 Xdebug，请在您的 Homestead 虚拟机中执行 `sudo phpenmod xdebug` 命令。接下来，按照您的 IDE 指南启用调试。最后，配置您的浏览器，以通过扩展或[书签](https://www.jetbrains.com/phpstorm/marklets/)来触发 Xdebug。

> [!WARNING]  
> Xdebug 会导致 PHP 运行显著变慢。要禁用 Xdebug，请在您的 Homestead 虚拟机中运行 `sudo phpdismod xdebug` 命令并重新启动 FPM 服务。

#### 自动启动 Xdebug

在调试向 Web 服务器发起请求的功能性测试时，自动启动调试比修改测试以通过自定义头或 Cookie 触发调试要容易。要强制自动启动 Xdebug，请修改您的 Homestead 虚拟机内的 `/etc/php/7.x/fpm/conf.d/20-xdebug.ini` 文件，并添加以下配置：

```ini
; 如果 Homestead.yaml 包含不同的子网 IP 地址，那么此地址可能会不同...
xdebug.client_host = 192.168.10.1
xdebug.mode = debug
xdebug.start_with_request = yes
```

### 调试 CLI 应用程序

要调试 PHP CLI 应用程序，请在您的 Homestead 虚拟机内部使用 `xphp` shell 别名：

```shell
xphp /path/to/script
```

### 使用 Blackfire 对应用程序进行性能分析

[Blackfire](https://blackfire.io/docs/introduction) 是一个用于分析 Web 请求和 CLI 应用程序性能的服务。它提供了一个交互式用户界面，显示调用图和时间轴中的性能数据。它适用于开发、暂存和生产，对最终用户没有任何开销。此外，Blackfire 在代码和 `php.ini` 配置设置上提供性能、质量和安全性检查。

[Blackfire Player](https://blackfire.io/docs/player/index) 是一个开源的网络爬虫、网络测试和网络抓取应用程序，可以与 Blackfire 协同工作，用于脚本化性能分析场景。

要启用 Blackfire，请在您的 Homestead 配置文件中使用“features”设置：

```yaml
features:
  - blackfire:
      server_id: 'server_id'
      server_token: 'server_token'
      client_id: 'client_id'
      client_token: 'client_token'
```

Blackfire 服务器凭据和客户端凭据[需要一个 Blackfire 账户](https://blackfire.io/signup)。Blackfire 提供了多种应用程序性能分析选项，包括 CLI 工具和浏览器扩展。请[查阅 Blackfire 文档了解更多细节](https://blackfire.io/docs/php/integrations/laravel/index)。

## 网络接口

`Homestead.yaml` 文件的 `networks` 属性为您的 Homestead 虚拟机配置网络接口。您可以根据需要配置尽可能多的接口：

```yaml
networks:
  - type: 'private_network'
    ip: '192.168.10.20'
```

要启用[桥接](https://developer.hashicorp.com/vagrant/docs/networking/public_network)接口，请为网络配置 `bridge` 设置，并将网络类型更改为 `public_network`：

```yaml
networks:
  - type: 'public_network'
    ip: '192.168.10.20'
    bridge: 'en1: Wi-Fi (AirPort)'
```

要启用 [DHCP](https://developer.hashicorp.com/vagrant/docs/networking/public_network#dhcp)，只需从您的配置中移除 `ip` 选项：

```yaml
networks:
  - type: 'public_network'
    bridge: 'en1: Wi-Fi (AirPort)'
```

要更新网络使用的设备，您可以在网络配置中添加 `dev` 选项。默认的 `dev` 值是 `eth0`：

```yaml
networks:
  - type: 'public_network'
    ip: '192.168.10.20'
    bridge: 'en1: Wi-Fi (AirPort)'
    dev: 'enp2s0'
```

## 扩展 Homestead

您可以使用 Homestead 目录根目录下的 `after.sh` 脚本来扩展 Homestead。在这个文件中，您可以添加任何必须的 shell 命令来正确配置和定制您的虚拟机。

在定制 Homestead 时，Ubuntu 可能会询问您是否希望保留包的原始配置或用新的配置文件覆盖它。为了避免这种情况，您应该在安装包时使用以下命令以避免覆盖 Homestead 之前写的任何配置：

```shell
sudo apt-get -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    install package-name
```

### 用户自定义

当您与您的团队一起使用 Homestead 时，您可能想要调整 Homestead 以更好地适应您个人的开发风格。为了实现这一点，您可以在 Homestead 目录的根目录（包含您的 `Homestead.yaml` 文件的同一目录）中创建一个 `user-customizations.sh` 文件。在此文件中，您可以进行任何您想要的定制；然而，`user-customizations.sh` 不应该被版本控制。

## 特定提供商的设置

### VirtualBox

#### `natdnshostresolver`

默认情况下，Homestead 配置了 `natdnshostresolver` 设置为 `on`。这允许 Homestead 使用您宿主操作系统的 DNS 设置。如果您想要覆盖这种行为，在您的 `Homestead.yaml` 文件中添加以下配置选项：

```yaml
provider: virtualbox
natdnshostresolver: 'off'
```
