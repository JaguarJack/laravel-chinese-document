---
title: Laravel Envoy
---

# Laravel Envoy

[[toc]]

## 简介

[Laravel Envoy](https://github.com/laravel/envoy) 是一个工具，用于执行您在远程服务器上运行的常见任务。使用 [Blade](/docs/11/basics/blade) 风格的语法，您可以轻松地设置部署、Artisan 命令等任务。目前，Envoy 仅支持 Mac 和 Linux 操作系统。然而，通过使用 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10)，可以在 Windows 上实现支持。

## 安装

首先，使用 Composer 包管理器将 Envoy 安装到您的项目中：

```shell
composer require laravel/envoy --dev
```

一旦 Envoy 被安装，Envoy 的二进制文件将在您应用程序的 `vendor/bin` 目录中可用：

```shell
php vendor/bin/envoy
```

## 编写任务

### 定义任务

任务是 Envoy 的基础构件。任务定义了在调用任务时应在远程服务器上执行的 shell 命令。例如，您可能定义了一个任务，它在应用程序的所有队列工作器服务器上执行 `php artisan queue:restart` 命令。

您的所有 Envoy 任务都应该在应用程序根目录的 `Envoy.blade.php` 文件中定义。这里有一个让您开始的例子：

```blade
@servers(['web' => ['user@192.168.1.1'], 'workers' => ['user@192.168.1.2']])

@task('restart-queues', ['on' => 'workers'])
    cd /home/user/example.com
    php artisan queue:restart
@endtask
```

如您所见，文件顶部定义了一个 `@servers` 数组，允许您通过任务声明的 `on` 选项引用这些服务器。`@servers` 声明应始终放置在单行。在您的 `@task` 声明中，您应该放置在调用任务时应在服务器上执行的 shell 命令。

#### 本地任务

您可以通过将服务器的 IP 地址指定为 `127.0.0.1` 来强制脚本在本地计算机上运行：

```blade
@servers(['localhost' => '127.0.0.1'])
```

#### 导入 Envoy 任务

使用 `@import` 指令，您可以导入其他 Envoy 文件，以便将它们的故事和任务添加到您的文件中。文件导入后，您可以执行它们包含的任务，就好像它们是在您自己的 Envoy 文件中定义的一样：

```blade
@import('vendor/package/Envoy.blade.php')
```

### 多服务器

Envoy 允许您轻松地在多个服务器上运行任务。首先，在您的 `@servers` 声明中添加额外的服务器。每个服务器应被分配一个唯一的名称。定义完额外的服务器后，您可以在任务的 `on` 数组中列出每个服务器：

```blade
@servers(['web-1' => '192.168.1.1', 'web-2' => '192.168.1.2'])

@task('deploy', ['on' => ['web-1', 'web-2']])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate --force
@endtask
```

#### 并行执行

默认情况下，任务将串行在每个服务器上执行。换句话说，一个任务将在第一个服务器上运行完成后，再继续在第二个服务器上执行。如果您希望并行在多个服务器上运行任务，请在任务声明中添加 `parallel` 选项：

```blade
@servers(['web-1' => '192.168.1.1', 'web-2' => '192.168.1.2'])

@task('deploy', ['on' => ['web-1', 'web-2'], 'parallel' => true])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate --force
@endtask
```

### 设置

有时，您可能需要在运行 Envoy 任务之前执行任意 PHP 代码。您可以使用 `@setup` 指令定义一个 PHP 代码块，它应该在您的任务执行之前运行：

```php
@setup
    $now = new DateTime;
@endsetup
```

如果在任务执行之前需要引入其他 PHP 文件，您可以在 `Envoy.blade.php` 文件的顶部使用 `@include` 指令：

```blade
@include('vendor/autoload.php')

@task('restart-queues')
    # ...
@endtask
```

### 变量

如果需要，您可以通过在调用 Envoy 时在命令行上指定它们，将参数传递给 Envoy 任务：

```shell
php vendor/bin/envoy run deploy --branch=master
```

您可以使用 Blade 的 "echo" 语法在任务中访问选项。您还可以在任务中定义 Blade `if` 语句和循环。例如，让我们在执行 `git pull` 命令之前验证 `$branch` 变量的存在：

```blade
@servers(['web' => ['user@192.168.1.1']])

@task('deploy', ['on' => 'web'])
    cd /home/user/example.com

    @if ($branch)
        git pull origin {{ $branch }}
    @endif

    php artisan migrate --force
@endtask
```

### 故事

故事将一组任务在一个方便的名称下分组。例如，一个 `deploy` 故事可能通过在其定义中列出任务名称，来运行 `update-code` 和 `install-dependencies` 任务：

```blade
@servers(['web' => ['user@192.168.1.1']])

@story('deploy')
    update-code
    install-dependencies
@endstory

@task('update-code')
    cd /home/user/example.com
    git pull origin master
@endtask

@task('install-dependencies')
    cd /home/user/example.com
    composer install
@endtask
```

故事编写完成后，您可以像调用任务一样调用它：

```shell
php vendor/bin/envoy run deploy
```

### 钩子

任务和故事运行时，会执行许多钩子。Envoy 支持的钩子类型有 `@before`、`@after`、`@error`、`@success` 和 `@finished`。所有这些钩子中的代码都被解释为 PHP 并在本地执行，而不是在远程服务器上执行，您的任务与这些服务器互动。

您可以定义任意多个这些钩子。它们将按照它们在您的 Envoy 脚本中出现的顺序执行。

#### `@before`

在每个任务执行之前，您的 Envoy 脚本中注册的所有 `@before` 钩子将执行。`@before` 钩子接收将要执行的任务的名称：

```blade
@before
    if ($task === 'deploy') {
        // ...
    }
@endbefore
```

#### `@after`

在每个任务执行后，您的 Envoy 脚本中注册的所有 `@after` 钩子将执行。`@after` 钩子接收已执行的任务的名称：

```blade
@after
    if ($task === 'deploy') {
        // ...
    }
@endafter
```

#### `@error`

在每个任务失败后（退出状态码大于 `0`），您的 Envoy 脚本中注册的所有 `@error` 钩子将执行。`@error` 钩子接收已执行的任务的名称：

```blade
@error
    if ($task === 'deploy') {
        // ...
    }
@enderror
```

#### `@success`

如果所有任务都没有错误地执行，您的 Envoy 脚本中注册的所有 `@success` 钩子将执行：

```blade
@success
    // ...
@endsuccess
```

#### `@finished`

在所有任务执行完成后（无论退出状态如何），所有的 `@finished` 钩子都将执行。`@finished` 钩子接收已完成任务的状态码，这可能是 `null` 或大于等于 `0` 的 `integer`：

```blade
@finished
    if ($exitCode > 0) {
        // 任务中有错误...
    }
@endfinished
```

## 执行任务

要运行在您的应用程序的 `Envoy.blade.php` 文件中定义的任务或故事，请执行 Envoy 的 `run` 命令，传递您想要执行的任务或故事的名称。Envoy 将执行任务并显示任务运行时来自远程服务器的输出：

```shell
php vendor/bin/envoy run deploy
```

### 确认任务执行

如果您希望在服务器上运行任务前提示确认，请在任务声明中添加 `confirm` 指令。这个选项对于破坏性操作特别有用：

```blade
@task('deploy', ['on' => 'web', 'confirm' => true])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate
@endtask
```

## 通知

### Slack

Envoy 支持在每个任务执行后发送通知到 [Slack](https://slack.com)。`@slack` 指令接受一个 Slack 钩子 URL 和一个频道/用户名。您可以通过在您的 Slack 控制面板中创建一个“Incoming WebHooks”集成来检索您的 webhook URL。

您应该将完整的 webhook URL 作为传递给 `@slack` 指令的第一个参数。传递给 `@slack` 指令的第二个参数应该是一个频道名（`#channel`）或者用户名（`@user`）：

```blade
@finished
    @slack('webhook-url', '#bots')
@endfinished
```

默认情况下，Envoy 通知会向通知频道发送描述已执行任务的消息。然而，您可以通过向 `@slack` 指令传递第三个参数来使用您自己的自定义消息覆盖这条消息：

```blade
@finished
    @slack('webhook-url', '#bots', 'Hello, Slack.')
@endfinished
```

### Discord

Envoy 也支持在每个任务执行后发送通知到 [Discord](https://discord.com)。`@discord` 指令接受一个 Discord 钩子 URL 和消息。您可以通过在服务器设置中创建一个“Webhook”并选择 webhook 应该发布到哪个频道来检索您的 webhook URL。您应该将整个 Webhook URL 传递给 `@discord` 指令：

```blade
@finished
    @discord('discord-webhook-url')
@endfinished
```

### Telegram

Envoy 也支持在每个任务执行后发送通知到 [Telegram](https://telegram.org)。`@telegram` 指令接受一个 Telegram 机器人 ID 和一个聊天 ID。您可以通过使用 [BotFather](https://t.me/botfather) 创建一个新的机器人来检索您的机器人 ID。您可以使用 [@username_to_id_bot](https://t.me/username_to_id_bot) 检索一个有效的聊天 ID。您应该将整个机器人 ID 和聊天 ID 传递给 `@telegram` 指令：

```blade
@finished
    @telegram('bot-id','chat-id')
@endfinished
```

### Microsoft Teams

Envoy 也支持在每个任务执行后发送通知到 [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams)。`@microsoftTeams` 指令接受一个 Teams Webhook（必填）、消息、主题颜色（成功、信息、警告、错误）和一个选项数组。您可以通过创建一个新的 [传入 webhook](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook) 来检索您的 Teams Webhook。Teams API 还有许多其他属性来自定义您的消息盒子，如标题、摘要和分区。您可以在 [Microsoft Teams 文档](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using?tabs=cURL#example-of-connector-message) 中找到更多信息。您应该将整个 Webhook URL 传递给 `@microsoftTeams` 指令：

```blade
@finished
    @microsoftTeams('webhook-url')
@endfinished
```
