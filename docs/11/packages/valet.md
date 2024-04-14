# Valet

[[toc]]

## 介绍

> [!提示]  
> 在 macOS 或 Windows 上寻找更简单的 Laravel 应用程序开发方法吗？请查看 [Laravel Herd](https://herd.laravel.com)。Herd 包括开始 Laravel 开发所需的一切，包括 Valet、PHP 和 Composer。

[Laravel Valet](https://github.com/laravel/valet) 是为 macOS 极简主义者设计的开发环境。Laravel Valet 配置您的 Mac 在启动时一直在后台运行 [Nginx](https://www.nginx.com/)。然后，使用 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq)，Valet 将 `*.test` 域上的所有请求代理到您本地机器上安装的站点。

换句话说，Valet 是一个使用内存大约只需 7 MB 的极速 Laravel 开发环境。Valet 不是 [Sail](/docs/11/packages/sail) 或 [Homestead](/docs/11/packages/homestead) 的完整替代品，但如果您想要灵活的基础设施，偏好极致速度，或在内存有限的机器上工作，它提供了一个绝佳的选择。

`Valet` 支持的内容包括但不限于：

- [Laravel](https://laravel.com)
- [Bedrock](https://roots.io/bedrock/)
- [CakePHP 3](https://cakephp.org)
- [ConcreteCMS](https://www.concretecms.com/)
- [Contao](https://contao.org/en/)
- [Craft](https://craftcms.com)
- [Drupal](https://www.drupal.org/)
- [ExpressionEngine](https://www.expressionengine.com/)
- [Jigsaw](https://jigsaw.tighten.co)
- [Joomla](https://www.joomla.org/)
- [Katana](https://github.com/themsaid/katana)
- [Kirby](https://getkirby.com/)
- [Magento](https://magento.com/)
- [OctoberCMS](https://octobercms.com/)
- [Sculpin](https://sculpin.io/)
- [Slim](https://www.slimframework.com)
- [Statamic](https://statamic.com)
- Static HTML
- [Symfony](https://symfony.com)
- [WordPress](https://wordpress.org)
- [Zend](https://framework.zend.com)

不过，您可以通过您自己的[自定义驱动程序](#custom-valet-drivers)扩展 Valet。

## 安装

> [!WARNING]  
> Valet 需要 macOS 和 [Homebrew](https://brew.sh/)。在安装之前，您应确保没有其他程序（如 Apache 或 Nginx）绑定到您的本地机器的 80 端口。

首先，您需要使用 `update` 命令确保 Homebrew 是最新的：

```shell
brew update
```

接下来，您应该使用 Homebrew 来安装 PHP：

```shell
brew install php
```

在安装了 PHP 之后，您就可以安装 [Composer 包管理器](https://getcomposer.org) 了。此外，您应确保 `$HOME/.composer/vendor/bin` 目录在您的系统的“PATH”中。安装 Composer 后，您可以安装 Laravel Valet 作为一个全局的 Composer 包：

```shell
composer global require laravel/valet
```

最后，您可以执行 Valet 的 `install` 命令。这将配置并安装 Valet 和 DnsMasq，此外，Valet 依赖的守护进程将被配置为在您的系统启动时启动：

```shell
valet install
```

Valet 安装完成后，尝试在您的终端上 ping 任何 `*.test` 域名，例如使用命令 `ping foobar.test`。如果 Valet 安装正确，您应该看到这个域名在 `127.0.0.1` 上有响应。

Valet 会在您的机器启动时自动启动它所需的服务。

#### PHP 版本

> [!NOTE]  
> 您可以指令 Valet 使用每个站点的 PHP 版本，而不是修改您的全局 PHP 版本。这可以通过 `isolate` [命令](#per-site-php-versions)实现。

Valet 允许您使用 `valet use php@version` 命令切换 PHP 版本。如果指定的 PHP 版本尚未通过 Homebrew 安装，Valet 将会安装它：

```shell
valet use php@8.2

valet use php
```

您还可以在项目的根目录中创建一个 `.valetrc` 文件。`.valetrc` 文件应包含站点应使用的 PHP 版本：

```shell
php=php@8.2
```

创建此文件后，您可以简单地执行 `valet use` 命令，命令将通过读取文件来确定站点首选的 PHP 版本。

> [!WARNING]  
> Valet 一次只能服务一个 PHP 版本，即使您安装了多个 PHP 版本。

#### 数据库

如果您的应用程序需要数据库，请查看 [DBngin](https://dbngin.com)，它提供了一个免费的一体化数据库管理工具，包括 MySQL、PostgreSQL 和 Redis。安装 DBngin 后，您可以使用 `root` 用户名和空字符串作为密码在 `127.0.0.1` 连接到您的数据库。

#### 重置您的安装

如果您的 Valet 安装运行不正常，执行 `composer global require laravel/valet` 命令，随后执行 `valet install` 将重置您的安装并可以解决各种问题。在极少数情况下，您可能需要通过执行 `valet uninstall --force` 后跟 `valet install` 来“硬重置” Valet。

### 升级 Valet

您可以通过在终端中执行 `composer global require laravel/valet` 命令来升级 Valet 安装。升级后，运行 `valet install` 命令是一个好习惯，以便 Valet 在必要时可以对您的配置文件进行其他升级。

#### 升级到 Valet 4

如果您从 Valet 3 升级到 Valet 4，要正确升级 Valet 安装，请采取以下步骤：

- 如果您添加了 `.valetphprc` 文件来自定义站点的 PHP 版本，请将每个 `.valetphprc` 文件重命名为 `.valetrc`。然后，在 `.valetrc` 文件的现有内容前面加上 `php=`。
- 将任何自定义驱动程序更新为匹配新驱动程序系统的命名空间、扩展名、类型提示和返回类型提示。您可以参考 Valet 的 [SampleValetDriver](https://github.com/laravel/valet/blob/d7787c025e60abc24a5195dc7d4c5c6f2d984339/cli/stubs/SampleValetDriver.php) 作为示例。
- 如果您使用 PHP 7.1 - 7.4 来服务您的网站，请确保您仍然使用 Homebrew 安装 8.0 或更高版本的 PHP，因为 Valet 将使用此版本进行一些脚本的运行，即使这不是您的主要链接版本。

## 提供站点服务

一旦安装了 Valet，您就可以开始为您的 Laravel 应用程序提供服务了。Valet 提供了两个命令来帮助您为应用程序提供服务：`park` 和 `link`。

### `park` 命令

`park` 命令在您的机器上注册一个包含您的应用程序的目录。一旦该目录与 Valet "停靠"，该目录中的所有目录都将在您的网络浏览器中以 `http://<directory-name>.test` 的方式访问：

```shell
cd ~/Sites

valet park
```

就是这样。现在，您在“停靠”的目录中创建的任何应用程序都将自动使用 `http://<directory-name>.test` 的约定进行服务。因此，如果您的停靠目录包含名为“laravel”的目录，则该目录中的应用程序将可以在 `http://laravel.test` 访问。此外，Valet 自动允许您使用通配符子域名访问站点（如 `http://foo.laravel.test`）。

### `link` 命令

`link` 命令也可以用来为您的 Laravel 应用程序提供服务。如果您希望为目录中的单个站点而不是整个目录提供服务，此命令会很有用：

```shell
cd ~/Sites/laravel

valet link
```

使用 `link` 命令将应用程序链接到 Valet 后，您可以使用其目录名称访问应用程序。因此，上面的示例中链接的站点可以在 `http://laravel.test` 访问。此外，Valet 自动允许您使用通配符子域名访问站点（如 `http://foo.laravel.test`）。

如果您希望以不同的主机名提供应用程序，您可以将主机名传递给 `link` 命令。例如，您可以运行以下命令，使应用程序可以在 `http://application.test` 访问：

```shell
cd ~/Sites/laravel

valet link application
```

当然，您还可以使用 `link` 命令在子域上提供应用程序：

```shell
valet link api.application
```

您可以执行 `links` 命令来显示所有链接目录的列表：

```shell
valet links
```

`unlink` 命令可用于销毁站点的符号链接：

```shell
cd ~/Sites/laravel

valet unlink
```

### 用 TLS 加固站点

默认情况下，Valet 通过 HTTP 提供站点服务。然而，如果您想通过加密的 TLS 使用 HTTP/2 提供网站服务，您可以使用 `secure` 命令。例如，如果您的站点通过 Valet 在 `laravel.test` 域上提供服务，您应运行以下命令来加固它：

```shell
valet secure laravel
```

要“取消加固”一个站点并恢复通过普通 HTTP 提供其流量，您可以使用 `unsecure` 命令。像 `secure` 命令一样，此命令接受您希望取消加固的主机名：

```shell
valet unsecure laravel
```

### 提供默认站点服务

有时，您可能希望配置 Valet 以便在访问未知的 `test` 域时提供一个“默认”站点而不是 `404`。为此，您可以在您的 `~/.config/valet/config.json` 配置文件中添加一个 `default` 选项，其中包含应该作为您默认站点的路径：

```json
"default": "/Users/Sally/Sites/example-site",
```

### 每个站点的 PHP 版本

默认情况下，Valet 使用您的全局 PHP 安装为您的站点提供服务。然而，如果您需要在各种站点中支持多个 PHP 版本，您可以使用 `isolate` 命令来指定特定站点应使用的 PHP 版本。`isolate` 命令配置 Valet 使用指定的 PHP 版本为您当前工作目录中的站点提供服务：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果您的站点名称与包含它的目录名称不匹配，您可以使用 `--site` 选项指定站点名称：

```shell
valet isolate php@8.0 --site="site-name"
```

为了方便起见，您可以使用 `valet php`、`composer` 和 `which-php` 命令代理调用基于站点配置的 PHP 版本的相应 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

您可以执行 `isolated` 命令显示所有独立站点及其 PHP 版本的列表：

```shell
valet isolated
```

要使站点回退到 Valet 的全局安装的 PHP 版本，您可以在站点的根目录中调用 `unisolate` 命令：

```shell
valet unisolate
```

## 分享站点

Valet 包含一个命令，让您可以向世界分享您的本地站点，为在移动设备上测试您的站点或与团队成员和客户分享提供了一种简单的方式。

Valet 开箱即支持通过 ngrok 或 Expose 分享您的站点。在分享站点之前，您应该使用 `share-tool` 命令更新您的 Valet 配置，指定 `ngrok` 或 `expose`：

```shell
valet share-tool ngrok
```

如果您选择了一个工具，但没有通过 Homebrew（对于 ngrok）或 Composer（对于 Expose）安装它，Valet 会自动提示您安装它。当然，这两个工具都需要您在开始分享站点之前认证您的 ngrok 或 Expose 账户。

要分享一个站点，请在终端中导航到站点的目录，并运行 Valet 的 `share` 命令。一个可公开访问的 URL 将被放置到您的剪贴板，并准备直接粘贴到您的浏览器中或与您的团队分享：

```shell
cd ~/Sites/laravel

valet share
```

要停止分享您的站点，您可以按 `Control + C`。

> [!WARNING]  
> 如果您使用自定义 DNS 服务器（例如 `1.1.1.1`），ngrok 分享可能无法正确工作。如果您的机器上是这种情况，请打开 Mac 的系统设置，转到网络设置，打开高级设置，然后转到 DNS 标签页并添加 `127.0.0.1` 作为您的第一个 DNS 服务器。

#### 通过 Ngrok 分享站点

使用 Ngrok 分享你的站点需要你创建一个 Ngrok 账户并设置一个认证 token。一旦你有了认证 token，你就可以使用该 token 更新你的 Valet 配置了：

```shell
valet set-ngrok-token YOUR_TOKEN_HERE
```

> [!NOTE]  
> 你可以给 share 命令传递额外的 ngrok 参数，例如 `valet share --region=eu`。更多信息请查看 Ngrok 文档。

#### 通过 Expose 分享站点

使用 Expose 分享你的站点需要你创建一个 Expose 账户并通过你的认证 token 认证 Expose。

你可以查看 Expose 文档来了解它支持的额外命令行参数信息。

### 在你的本地网络上分享站点

Valet 默认会将传入的流量限制在内部 `127.0.0.1` 接口上，这样你的开发机就不会因为互联网的安全风险而暴露。

如果你希望允许你本地网络上的其他设备通过你的机器 IP 地址访问你机器上的 Valet 站点（例如：`192.168.1.10/application.test`），你需要手动编辑该站点的适当 Nginx 配置文件以移除 `listen` 指令上的限制。你应该移除 `listen` 指令的 `127.0.0.1:` 前缀。

如果你还没有对项目运行 `valet secure`，你可以通过编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件为所有非 HTTPS 站点开放网络访问。然而，如果你是通过 HTTPS（你已经运行了 `valet secure`）为项目站点服务，那么你应该编辑 `~/.config/valet/Nginx/app-name.test` 文件。

一旦你更新了你的 Nginx 配置，运行 `valet restart` 命令来应用配置变更。

## 针对特定站点的环境变量

一些使用其他框架的应用程序可能依赖于服务器环境变量，但不提供在你的项目中配置这些变量的方式。Valet 允许你通过在项目根目录下添加一个 `.valet-env.php` 文件来配置针对特定站点的环境变量。这个文件应该返回一个站点 / 环境变量对的数组，这些变量将被添加到每个指定站点数组中的全局 `$_SERVER` 数组中：

```php
<?php

return [
    // 为 laravel.test 站点设置 $_SERVER['key'] 为 "value"...
    'laravel' => [
        'key' => 'value',
    ],

    // 为所有站点设置 $_SERVER['key'] 为 "value"...
    '*' => [
        'key' => 'value',
    ],
];
```

## 代理服务

有时你可能希望将 Valet 域代理到你本地机器上的另一个服务。例如，你可能偶尔需要在运行 Valet 的同时运行 Docker 中的一个独立站点；然而，Valet 和 Docker 不能同时绑定到 80 端口。

为了解决这个问题，你可以使用 `proxy` 命令来生成一个代理。例如，你可能想将所有来自 `http://elasticsearch.test` 的流量代理到 `http://127.0.0.1:9200`：

```shell
# 通过 HTTP 代理...
valet proxy elasticsearch http://127.0.0.1:9200

# 通过 TLS + HTTP/2 代理...
valet proxy elasticsearch http://127.0.0.1:9200 --secure
```

你可以使用 `unproxy` 命令来移除一个代理：

```shell
valet unproxy elasticsearch
```

你可以使用 `proxies` 命令列出所有被代理的站点配置：

```shell
valet proxies
```

## 自定义 Valet 驱动

你可以编写自己的 Valet "驱动"来为 Valet 本身不支持的某个框架或 CMS 运行的 PHP 应用程序提供服务。当你安装 Valet 时，会创建一个包含 `SampleValetDriver.php` 文件的 `~/.config/valet/Drivers` 目录。这个文件包含了一个示例驱动实现，用于展示如何编写自定义驱动。编写驱动只要求你实现三个方法：`serves`，`isStaticFile` 和 `frontControllerPath`。

这三个方法接收 `$sitePath`，`$siteName` 和 `$uri` 值作为它们的参数。`$sitePath` 是你机器上被服务的站点的完全限定路径，比如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域的 "主机" / "站点名" 部分（`my-project`）。`$uri` 是进来的请求 URI（`/foo/bar`）。

一旦你完成了自定义 Valet 驱动，将它放到 `~/.config/valet/Drivers` 目录中，使用 `FrameworkValetDriver.php` 的命名规范。例如，如果你正在为 WordPress 编写一个自定义 valet 驱动，你的文件名应该是 `WordPressValetDriver.php`。

让我们看一个你的自定义 Valet 驱动该实现的每个方法的示例实现。

#### `serves` 方法

`serves` 方法应该在你的驱动应该处理进来的请求时返回 `true`。否则，该方法应该返回 `false`。所以，在这个方法中，你应该尝试确定给定的 `$sitePath` 是否包含了你试图提供服务的类型的项目。

例如，假设我们正在编写一个 `WordPressValetDriver`。我们的 `serves` 方法可能看起来像这样：

```php
/**
 * Determine if the driver serves the request.
 */
public function serves(string $sitePath, string $siteName, string $uri): bool
{
    return is_dir($sitePath.'/wp-admin');
}
```

#### `isStaticFile` 方法

`isStaticFile` 方法需要确定进来的请求是否针对的是一个"静态文件"，例如图片或样式表。如果文件是静态的，方法应该返回指向磁盘上静态文件的完全限定路径。如果进来的请求不是针对静态文件，方法应该返回 `false`：

```php
/**
 * Determine if the incoming request is for a static file.
 *
 * @return string|false
 */
public function isStaticFile(string $sitePath, string $siteName, string $uri)
{
    if (file_exists($staticFilePath = $sitePath.'/public/'.$uri)) {
        return $staticFilePath;
    }

    return false;
}
```

> [!WARNING]  
> `isStaticFile` 方法只会在 `serves` 方法对进来的请求返回 `true` 且请求的 URI 不是 `/` 时被调用。

#### `frontControllerPath` 方法

`frontControllerPath` 方法应当返回应用的"前端控制器"的完全限定路径，通常是一个"index.php"文件或等效文件：

```php
/**
 * Get the fully resolved path to the application's front controller.
 */
public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
{
    return $sitePath.'/public/index.php';
}
```

### 本地驱动

如果你希望为单一应用定义一个自定义的 Valet 驱动，可以在应用的根目录下创建一个 `LocalValetDriver.php` 文件。你的自定义驱动可以继承基础的 `ValetDriver` 类，或者继承一个已存在的特定应用驱动，比如 `LaravelValetDriver`：

```php
use Valet\Drivers\LaravelValetDriver;

class LocalValetDriver extends LaravelValetDriver
{
    /**
     * Determine if the driver serves the request.
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return true;
    }

    /**
     * Get the fully resolved path to the application's front controller.
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
    {
        return $sitePath.'/public_html/index.php';
    }
}
```

## 其他 Valet 命令

| Command                   | Description                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `valet list`              | Display a list of all Valet commands.                                                                                                |
| `valet diagnose`          | Output diagnostics to aid in debugging Valet.                                                                                        |
| `valet directory-listing` | Determine directory-listing behavior. Default is "off", which renders a 404 page for directories.                                    |
| `valet forget`            | Run this command from a "parked" directory to remove it from the parked directory list.                                              |
| `valet log`               | View a list of logs which are written by Valet's services.                                                                           |
| `valet paths`             | View all of your "parked" paths.                                                                                                     |
| `valet restart`           | Restart the Valet daemons.                                                                                                           |
| `valet start`             | Start the Valet daemons.                                                                                                             |
| `valet stop`              | Stop the Valet daemons.                                                                                                              |
| `valet trust`             | Add sudoers files for Brew and Valet to allow Valet commands to be run without prompting for your password.                          |
| `valet uninstall`         | Uninstall Valet: shows instructions for manual uninstall. Pass the `--force` option to aggressively delete all of Valet's resources. |

## Valet 目录和文件

你可能会在排查 Valet 环境问题时发现以下目录和文件信息有用：

#### `~/.config/valet`

包含了 Valet 的所有配置。你可能会希望维护这个目录的一个备份。

#### `~/.config/valet/dnsmasq.d/`

该目录包含了 DNSMasq 的配置。

#### `~/.config/valet/Drivers/`

该目录包含了 Valet 的驱动。驱动程序决定了一个特定的框架/CMS 是如何被服务的。

#### `~/.config/valet/Nginx/`

该目录包含了 Valet 的所有 Nginx 站点配置。在运行 `install` 和 `secure` 命令时，这些文件会被重新构建。

#### `~/.config/valet/Sites/`

该目录包含了你所有的[链接项目](#the-link-command)的符号链接。

#### `~/.config/valet/config.json`

这个文件是 Valet 的总配置文件。

#### `~/.config/valet/valet.sock`

这个文件是 Valet 的 Nginx 安装使用的 PHP-FPM 套接字。只有 PHP 正确运行时，这个文件才会存在。

#### `~/.config/valet/Log/fpm-php.www.log`

这个文件是 PHP 错误的用户日志。

#### `~/.config/valet/Log/nginx-error.log`

这个文件是 Nginx 错误的用户日志。

#### `/usr/local/var/log/php-fpm.log`

这个文件是 PHP-FPM 错误的系统日志。

#### `/usr/local/var/log/nginx`

该目录包含了 Nginx 的访问和错误日志。

#### `/usr/local/etc/php/X.X/conf.d`

该目录包含了各种 PHP 配置设置的 `*.ini` 文件。

#### `/usr/local/etc/php/X.X/php-fpm.d/valet-fpm.conf`

这个文件是 PHP-FPM 池配置文件。

#### `~/.composer/vendor/laravel/valet/cli/stubs/secure.valet.conf`

这个文件是用于为你的站点构建 SSL 证书的默认 Nginx 配置。

### 磁盘访问

自 macOS 10.14 起，默认情况下 [对某些文件和目录的访问是受限的](https://manuals.info.apple.com/MANUALS/1000/MA1902/en_US/apple-platform-security-guide.pdf)。这些限制包括桌面、文档和下载目录。此外，网络卷和可移动卷的访问也受到限制。因此，Valet 建议你的站点文件夹位于这些受保护位置之外。

然而，如果你希望从这些位置中的一个来服务站点，你将需要给予 Nginx "完全磁盘访问"。否则，你可能会遇到来自 Nginx 的服务器错误或其他不可预测的行为，特别是在服务静态资源时。通常情况下，macOS 会自动提示你授权给 Nginx 访问这些位置的完整权限。或者，你可以通过`系统偏好设置` > `安全性与隐私` > `隐私`手动进行授权，并选择`完全磁盘访问`。接下来，在主窗格中启用任何 `nginx` 条目。
