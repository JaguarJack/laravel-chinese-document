# Laravel Horizon

[[toc]]

## 简介

> [!NOTE]
> 在深入了解 Laravel Horizon 之前，您应该先熟悉 Laravel 的基本[队列服务](/docs/11/digging-deeper/queues)。Horizon 增加了 Laravel 队列的附加功能，如果您还不熟悉 Laravel 提供的基本队列功能，可能会感到困惑。

[Laravel Horizon](https://github.com/laravel/horizon)为您的 Laravel 支持的 [Redis 队列](/docs/11/digging-deeper/queues) 提供了一个美观的仪表板和代码驱动的配置。Horizon 允许您轻松监控队列系统的关键指标，如作业吞吐量、运行时间和作业失败情况。

使用 Horizon 时，您所有的队列工作器配置都存储在单个、简单的配置文件中。通过在版本控制文件中定义您的应用程序的工作配置，您可以在部署应用程序时轻松扩展或修改应用程序的队列工作器。

![Horizon 示例图片](https://laravel.com/img/docs/horizon-example.png)

## 安装

> [!WARNING]
> Laravel Horizon 要求使用 [Redis](https://redis.io) 来驱动您的队列。因此，您应确保您的队列连接在应用程序的 `config/queue.php` 配置文件中设置为 `redis`。

您可以使用 Composer 包管理器将 Horizon 安装到您的项目中：

```shell
composer require laravel/horizon
```

安装 Horizon 后，使用 `horizon:install` Artisan 命令发布其资源：

```shell
php artisan horizon:install
```

### 配置

发布 Horizon 的资源后，其主要的配置文件将位于 `config/horizon.php`。此配置文件允许您为应用程序配置队列工作器选项。每个配置选项都包含其用途的描述，因此请确保彻底探索此文件。

> [!WARNING]
> Horizon 在内部使用名为 `horizon` 的 Redis 连接。这个 Redis 连接名称是保留的，不应分配给 `database.php` 配置文件中的另一个 Redis 连接或作为 `horizon.php` 配置文件中 `use` 选项的值。

#### 环境

安装后，您应该熟悉的主要 Horizon 配置选项是 `environments` 配置选项。此配置选项是您的应用程序运行的环境数组，并为每个环境定义工作进程选项。默认情况下，此条目包含 `production` 和 `local` 环境。但是，您可以根据需要添加更多环境：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
        ],
    ],

    'local' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
        ],
    ],
],
```

当您启动 Horizon 时，它将使用您的应用程序所运行的环境的工作进程配置选项。通常，环境由 `APP_ENV` [环境变量](/docs/11/getting-started/configuration#determining-the-current-environment)的值确定。例如，默认的 `local` Horizon 环境配置为启动三个工作进程，并自动平衡分配给每个队列的工作进程数量。默认的 `production` 环境配置为启动最多 10 个工作进程，并自动平衡分配给每个队列的工作进程数量。

> [!WARNING]
> 您应确保 `horizon` 配置文件中的 `environments` 部分包含您计划运行 Horizon 的每个[环境](/docs/11/getting-started/configuration#environment-configuration)的条目。

#### 监督者

正如您在 Horizon 的默认配置文件中看到的，每个环境都可以包含一个或多个“监督者”。默认情况下，配置文件将此监督者定义为 `supervisor-1`；但是，您可以根据需要自由命名您的监督者。每个监督者本质上负责“监督”一组工作进程，并负责在队列之间平衡工作进程。

如果您希望在特定环境中定义一组应在该环境中运行的新工作进程，您可以为给定环境添加额外的监督者。如果您希望为应用程序使用的给定队列定义不同的平衡策略或工作进程计数，您可以选择这样做。

#### 维护模式

当您的应用程序处于[维护模式](/docs/11/getting-started/configuration#maintenance-mode)时，除非在 Horizon 配置文件中将监督者的 `force` 选项定义为 `true`，否则 Horizon 不会处理排队的作业：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'force' => true,
        ],
    ],
],
```

#### 默认值

在 Horizon 的默认配置文件中，您会注意到一个 `defaults` 配置选项。此配置选项指定应用程序的[监督者](#supervisors)的默认值。监督者的默认配置值将合并到每个环境的监督者配置中，允许您避免在定义监督者时重复不必要的内容。

### 平衡策略

与 Laravel 的默认队列系统不同，Horizon 允许您从三种工作平衡策略中选择：`simple`、`auto` 和 `false`。`simple` 策略在工作进程之间均匀地分配传入作业：

```php
'balance' => 'simple',
```

`auto` 策略，默认配置文件中的默认值，根据队列的当前工作负载调整每个队列的工作进程数量。例如，如果您的 `notifications` 队列有 1,000 个等待中的作业，而您的 `render` 队列为空，则 Horizon 将为您的 `notifications` 队列分配更多工作人员，直到队列为空。

使用 `auto` 策略时，您可以定义 `minProcesses` 和 `maxProcesses` 配置选项，以控制 Horizon 应缩放到的最小和最大工作进程数量：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
            'tries' => 3,
        ],
    ],
],
```

`autoScalingStrategy` 配置值决定 Horizon 是否会基于清空队列所需的总时间（`time` 策略）或队列上的作业总数（`size` 策略）来分配更多工作进程。

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 将多快地扩展以满足工作需求。在上面的示例中，每三秒最多会创建或销毁一个新的进程。您可以根据应用程序的需要自由调节这些值。

当 `balance` 选项设置为 `false` 时，将使用默认的 Laravel 行为，其中队列将按照您的配置中列出的顺序进行处理。

### 仪表板授权

Horizon 仪表板可以通过 `/horizon` 路径访问。默认情况下，您只能在 `local` 环境中访问此仪表板。但是，在您的 `app/Providers/HorizonServiceProvider.php` 文件中有一个[授权门](/docs/11/security/authorization#gates)定义。这个授权门控制在**非本地**环境中对 Horizon 的访问。您可以自由修改此门，以限制对您的 Horizon 安装的访问：

```php
/**
 * 注册 Horizon 门。
 *
 * 此门决定谁可以在非本地环境中访问 Horizon。
 */
protected function gate(): void
{
    Gate::define('viewHorizon', function (User $user) {
        return in_array($user->email, [
            'taylor@laravel.com',
        ]);
    });
}
```

#### 替代认证策略

请记住，Laravel 会自动将认证用户注入到门的闭包中。如果您的应用程序通过另一种方式提供 Horizon 安全性，例如 IP 限制，则您的 Horizon 用户可能不需要“登录”。因此，您需要将上面的 `function (User $user)` 闭包签名更改为 `function (User $user = null)`，以便强制 Laravel 不要求进行认证。

### 静默作业

有时，您可能对您的应用程序或第三方包派遣的某些作业不感兴趣。与其让这些作业占据您的“已完成作业”列表的空间，您可以将它们静默掉。首先，在应用程序的 `horizon` 配置文件中的 `silenced` 配置选项中添加作业的类名：

```php
'silenced' => [
    App\Jobs\ProcessPodcast::class,
],
```

或者，您希望静音的作业可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果作业实现了这个接口，即使它不在 `silenced` 配置数组中，也会自动被静默：

```php
use Laravel\Horizon\Contracts\Silenced;

class ProcessPodcast implements ShouldQueue, Silenced
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // ...
}
```

## 升级 Horizon

在升级到 Horizon 的新主要版本时，重要的是你要仔细审查[升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)。除此之外，在升级到任何新版本的 Horizon 时，你应该重新发布 Horizon 的资源：

```shell
php artisan horizon:publish
```

为了保持资源是最新的并避免在将来的更新中出现问题，你可以将 `vendor:publish --tag=laravel-assets` 命令添加到应用程序的 `composer.json` 文件中的 `post-update-cmd` 脚本里：

```json
{
  "scripts": {
    "post-update-cmd": ["@php artisan vendor:publish --tag=laravel-assets --ansi --force"]
  }
}
```

## 运行 Horizon

一旦你在应用程序的 `config/horizon.php` 配置文件中配置了你的监控器和工作进程，你可以使用 `horizon` Artisan 命令来启动 Horizon。这个单一命令将会启动当前环境中所有配置好的工作进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令暂停 Horizon 进程并指示它继续处理作业：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你也可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令来暂停和继续特定的 Horizon [监控器](#supervisors)：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令检查 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:terminate` Artisan 命令优雅地结束 Horizon 进程。任何当前正在由 Horizon 处理的作业都将完成，然后 Horizon 将停止执行：

```shell
php artisan horizon:terminate
```

### 部署 Horizon

当你准备将 Horizon 部署到应用程序的实际服务器时，你应该配置一个进程监视器来监视 `php artisan horizon` 命令，并在其意外退出时重启它。不用担心，我们将在下面讨论如何安装进程监视器。

在应用程序的部署过程中，你应该指示 Horizon 进程终止，以便由进程监视器重新启动，并接收你的代码更改：

```shell
php artisan horizon:terminate
```

#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，如果 `horizon` 进程停止执行，它将自动重启你的 `horizon` 进程。要在 Ubuntu 上安装 Supervisor，你可以使用以下命令。如果你不使用 Ubuntu，你可能可以使用操作系统的包管理器安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> [!NOTE]  
> 如果自己配置 Supervisor 听起来让你感到不知所措，考虑使用 [Laravel Forge](https://forge.laravel.com)，它将自动为你的 Laravel 项目安装和配置 Supervisor。

#### Supervisor 配置

Supervisor 配置文件通常存储在服务器的 `/etc/supervisor/conf.d` 目录中。在这个目录中，你可以创建任意数量的配置文件，这些文件会指导监视器如何监视你的进程。例如，让我们创建一个启动并监视一个 `horizon` 进程的 `horizon.conf` 文件：

```ini
[program:horizon]
process_name=%(program_name)s
command=php /home/forge/example.com/artisan horizon
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/example.com/horizon.log
stopwaitsecs=3600
```

在定义你的 Supervisor 配置时，你应确保 `stopwaitsecs` 的值大于你最长运行作业所消耗的秒数。否则，Supervisor 可能会在作业完成处理之前终止它。

> [!WARNING]  
> 虽然上述示例对于基于 Ubuntu 的服务器是有效的，但其他服务器操作系统期望的 Supervisor 配置文件的位置和文件扩展名可能会有所不同。请咨询你的服务器文档以获取更多信息。

#### 启动 Supervisor

一旦创建了配置文件，你可以使用以下命令更新 Supervisor 配置并启动被监控的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> [!NOTE]  
> 有关运行 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

## 标签

Horizon 允许你为作业分配“标签”，包括邮件、广播事件、通知和排队的事件监听器。实际上，Horizon 将根据附加到作业的 Eloquent 模型智能且自动地为大多数作业打上标签。例如，看看以下作业：

```php
<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RenderVideo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Video $video,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // ...
    }
}
```

如果这个作业是使用有一个 `id` 属性为 `1` 的 `App\Models\Video` 实例排队的，它将自动接收标签 `App\Models\Video:1`。这是因为 Horizon 会搜索作业的属性以查找任何 Eloquent 模型。如果找到 Eloquent 模型，Horizon 将使用模型的类名和主键智能地为作业打上标签：

```php
use App\Jobs\RenderVideo;
use App\Models\Video;

$video = Video::find(1);

RenderVideo::dispatch($video);
```

#### 手动标记作业

如果你希望为你的一个可排队对象手动定义标签，你可以在该类上定义一个 `tags` 方法：

```php
class RenderVideo implements ShouldQueue
{
    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['render', 'video:'.$this->video->id];
    }
}
```

#### 手动标记事件监听器

在获取排队事件监听器的标签时，Horizon 会自动将事件实例传递给 `tags` 方法，允许你将事件数据添加到标签中：

```php
class SendRenderNotifications implements ShouldQueue
{
    /**
     * Get the tags that should be assigned to the listener.
     *
     * @return array<int, string>
     */
    public function tags(VideoRendered $event): array
    {
        return ['video:'.$event->video->id];
    }
}
```

## 通知

> [!WARNING]  
> 在配置 Horizon 发送 Slack 或 SMS 通知时，你应检查[相关通知渠道的先决条件](/docs/11/digging-deeper/notifications)。

如果你想在你的某个队列有很长的等待时间时得到通知，你可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以在应用程序的 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    parent::boot();

    Horizon::routeSmsNotificationsTo('15556667777');
    Horizon::routeMailNotificationsTo('example@example.com');
    Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
}
```

#### 配置通知等待时间阈值

你可以在应用程序的 `config/horizon.php` 配置文件中配置被认为是“长等待”的秒数。此文件中的 `waits` 配置选项允许你控制每个连接/队列组合的长时间等待阈值。任何未定义的连接/队列组合将默认为 60 秒的长时间等待阈值：

```php
'waits' => [
    'redis:critical' => 30,
    'redis:default' => 60,
    'redis:batch' => 120,
],
```

## 指标

Horizon 包含一个指标仪表板，提供有关你的作业和队列等待时间及吞吐量的信息。为了填充这个仪表板，你应该配置 Horizon 的 `snapshot` Artisan 命令，让它在应用程序的 `routes/console.php` 文件中每五分钟运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
```

## 删除失败的作业

如果你想删除一个失败的作业，你可以使用 `horizon:forget` 命令。`horizon:forget` 命令接受失败作业的 ID 或 UUID 作为其唯一参数：

```shell
php artisan horizon:forget 5
```

## 清空队列中的作业

如果你想删除应用程序默认队列中的所有作业，你可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项来删除特定队列中的作业：

```shell
php artisan horizon:clear --queue=emails
```
