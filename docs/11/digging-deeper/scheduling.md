---
title: Laravel 任务调度
---

# 任务调度

[[toc]]

## 简介

在过去，您可能为服务器上需要调度的每个任务编写了 cron 配置项。然而，这很快就会变成痛苦，因为您的任务调度不再在源代码控制中，您必须 SSH 登录到您的服务器查看现有的 cron 项或添加额外的项。

Laravel 的命令调度器提供了一种全新的方法来管理服务器上的定时任务。调度器允许您在 Laravel 应用程序本身中流畅且有表达力地定义命令调度。使用调度器时，您的服务器上只需要一个单一的 cron 条目。您的任务调度通常在应用程序的 `routes/console.php` 文件中定义。

## 定义调度

您可以在应用程序的 `routes/console.php` 文件中定义所有的调度任务。让我们从一个示例开始，我们将安排一个闭包在每天午夜被调用。在闭包中，我们将执行一个数据库查询来清空一个表：

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->daily();
```

除了使用闭包调度，您还可以调度 [可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
Schedule::call(new DeleteRecentUsers)->daily();
```

如果您更愿意保留 `routes/console.php` 文件仅用于命令定义，您可以在应用程序的 `bootstrap/app.php` 文件中使用 `withSchedule` 方法来定义您的调度任务。这个方法接受一个接收调度器实例的闭包：

```php
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->call(new DeleteRecentUsers)->daily();
})
```

如果您想要查看您的调度任务和它们下一次计划运行的概况，您可以使用 `schedule:list` Artisan 命令：

```bash
php artisan schedule:list
```

### 调度 Artisan 命令

除了调度闭包，您还可以调度 [Artisan 命令](/docs/11/digging-deeper/artisan) 和系统命令。例如，您可以使用 `command` 方法来调度 Artisan 命令，使用命令的名称或类名。

当使用 Artisan 命令的类名进行调度时，您可以传递一个额外的命令行参数数组，这些参数将在命令被调用时提供：

```php
use App\Console\Commands\SendEmailsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send Taylor --force')->daily();

Schedule::command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

#### 调度 Artisan 闭包命令

如果您想要调度由闭包定义的 Artisan 命令，您可以在命令定义后链式调用调度相关的方法：

```php
Artisan::command('delete:recent-users', function () {
    DB::table('recent_users')->delete();
})->purpose('Delete recent users')->daily();
```

如果您需要向闭包命令传递参数，您可以将它们提供给 `schedule` 方法：

```php
Artisan::command('emails:send {user} {--force}', function ($user) {
    // ...
})->purpose('Send emails to the specified user')->schedule(['Taylor', '--force'])->daily();
```

### 调度队列作业

`job` 方法可用于调度 [队列作业](/docs/11/digging-deeper/queues)。这种方法为调度队列作业提供了一个便捷的方式，无需使用 `call` 方法来定义闭包来将作业排队：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new Heartbeat)->everyFiveMinutes();
```

可选的第二个和第三个参数可以提供给 `job` 方法，指定应该用于排队作业的队列名称和队列连接：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

// 将作业分派到 "sqs" 连接的 "heartbeats" 队列...
Schedule::job(new Heartbeat, 'heartbeats', 'sqs')->everyFiveMinutes();
```

### 调度 Shell 命令

`exec` 方法可以用于向操作系统发出命令：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::exec('node /home/forge/script.js')->daily();
```

### 调度频率选项

我们已经看到了一些如何配置任务以在指定间隔运行的示例。然而，还有许多更多的任务调度频率，您可以分配给任务：

| Method                             | Description                            |
| ---------------------------------- | -------------------------------------- |
| `->cron('* * * * *');`             | 在自定义 cron 调度上运行任务           |
| `->everySecond();`                 | 每秒运行任务                           |
| `->everyTwoSeconds();`             | 每两秒运行任务                         |
| `->everyFiveSeconds();`            | 每五秒运行任务                         |
| `->everyTenSeconds();`             | 每十秒运行任务                         |
| `->everyFifteenSeconds();`         | 每十五秒运行任务                       |
| `->everyTwentySeconds();`          | 每二十秒运行任务                       |
| `->everyThirtySeconds();`          | 每三十秒运行任务                       |
| `->everyMinute();`                 | 每分钟运行任务                         |
| `->everyTwoMinutes();`             | 每两分钟运行任务                       |
| `->everyThreeMinutes();`           | 每三分钟运行任务                       |
| `->everyFourMinutes();`            | 每四分钟运行任务                       |
| `->everyFiveMinutes();`            | 每五分钟运行任务                       |
| `->everyTenMinutes();`             | 每十分钟运行任务                       |
| `->everyFifteenMinutes();`         | 每十五分钟运行任务                     |
| `->everyThirtyMinutes();`          | 每三十分钟运行任务                     |
| `->hourly();`                      | 每小时运行任务                         |
| `->hourlyAt(17);`                  | 每小时在 17 分钟时运行任务             |
| `->everyOddHour($minutes = 0);`    | 每个奇数小时运行任务                   |
| `->everyTwoHours($minutes = 0);`   | 每两小时运行任务                       |
| `->everyThreeHours($minutes = 0);` | 每三小时运行任务                       |
| `->everyFourHours($minutes = 0);`  | 每四小时运行任务                       |
| `->everySixHours($minutes = 0);`   | 每六小时运行任务                       |
| `->daily();`                       | 每天在午夜运行任务                     |
| `->dailyAt('13:00');`              | 每天在 13:00 运行任务                  |
| `->twiceDaily(1, 13);`             | 每天在 1:00 和 13:00 运行任务          |
| `->twiceDailyAt(1, 13, 15);`       | 每天在 1:15 和 13:15 运行任务          |
| `->weekly();`                      | 每周在星期日的 00:00 运行任务          |
| `->weeklyOn(1, '8:00');`           | 每周在周一的 8:00 运行任务             |
| `->monthly();`                     | 每月在第一天的 00:00 运行任务          |
| `->monthlyOn(4, '15:00');`         | 每月在第 4 天的 15:00 运行任务         |
| `->twiceMonthly(1, 16, '13:00');`  | 每月在第 1 天和 16 天的 13:00 运行任务 |
| `->lastDayOfMonth('15:00');`       | 每月最后一天在 15:00 运行任务          |
| `->quarterly();`                   | 每个季度的第一天在 00:00 运行任务      |
| `->quarterlyOn(4, '14:00');`       | 每个季度在第 4 天的 14:00 运行任务     |
| `->yearly();`                      | 每年的第一天在 00:00 运行任务          |
| `->yearlyOn(6, 1, '17:00');`       | 每年在 6 月 1 日的 17:00 运行任务      |
| `->timezone('America/New_York');`  | 为任务设置时区                         |

这些方法可以与其他约束结合使用，创建更加精细的调度，只在一周的某些特定日子运行。例如，您可以调度命令在周一每周运行一次：

```php
use Illuminate\Support\Facades\Schedule;

// 每周在周一的下午 1 点运行一次...
Schedule::call(function () {
    // ...
})->weekly()->mondays()->at('13:00');

// 在工作日的上午 8 点到下午 5 点每小时运行一次...
Schedule::command('foo')
              ->weekdays()
              ->hourly()
              ->timezone('America/Chicago')
              ->between('8:00', '17:00');
```

下面列出了额外的调度约束：

| Method                                   | Description                  |
| ---------------------------------------- | ---------------------------- |
| `->weekdays();`                          | 限制任务到工作日             |
| `->weekends();`                          | 限制任务到周末               |
| `->sundays();`                           | 限制任务到星期日             |
| `->mondays();`                           | 限制任务到星期一             |
| `->tuesdays();`                          | 限制任务到星期二             |
| `->wednesdays();`                        | 限制任务到星期三             |
| `->thursdays();`                         | 限制任务到星期四             |
| `->fridays();`                           | 限制任务到星期五             |
| `->saturdays();`                         | 限制任务到星期六             |
| `->days(array\|mixed);`                  | 限制任务到特定的日子         |
| `->between($startTime, $endTime);`       | 限制任务在起止时间之间运行   |
| `->unlessBetween($startTime, $endTime);` | 限制任务不在起止时间之间运行 |
| `->when(Closure);`                       | 根据真值测试限制任务         |
| `->environments($env);`                  | 限制任务到特定环境           |

#### 日子约束

`days` 方法可用于限制任务执行到特定周天。例如，您可以调度命令每小时在星期天和星期三运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
                    ->hourly()
                    ->days([0, 3]);
```

或者，当定义任务应该运行的周天时，您可以使用 `Illuminate\Console\Scheduling\Schedule` 类上可用的常量：

```php
use Illuminate\Support\Facades;
use Illuminate\Console\Scheduling\Schedule;

Facades\Schedule::command('emails:send')
                    ->hourly()
                    ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

#### 时段约束

`between` 方法可用于基于一天中的时间限制任务的执行：

```php
Schedule::command('emails:send')
                        ->hourly()
                        ->between('7:00', '22:00');
```

类似地，`unlessBetween` 方法可以用来排除一段时间内的任务执行：

```php
Schedule::command('emails:send')
                        ->hourly()
                        ->unlessBetween('23:00', '4:00');
```

#### 真值测试约束

`when` 方法可用于基于给定真值测试的结果来限制任务的执行。换句话说，如果给定的闭包返回 `true`，任务将执行，只要没有其他约束条件阻止任务运行：

```php
Schedule::command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可以看作是 `when` 的反义。如果 `skip` 方法返回 `true`，则不会执行调度的任务：

```php
Schedule::command('emails:send')->daily()->skip(function () {
    return true;
});
```

当使用链式的 `when` 方法时，如果所有 `when` 条件返回 `true`，则计划的命令将会执行。

#### 环境约束

`environments` 方法可用于仅在给定环境中执行任务（由 `APP_ENV` [环境变量](/docs/11/getting-started/configuration#environment-configuration)定义）：

```php
Schedule::command('emails:send')
                ->daily()
                ->environments(['staging', 'production']);
```

### 时区

使用 `timezone` 方法，您可以指定调度任务的时间应在给定时区内解释：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
             ->timezone('America/New_York')
             ->at('2:00')
```

如果您在为所有调度任务重复指定相同的时区，您可以在应用程序的 `app` 配置文件中定义一个 `schedule_timezone` 选项，指定应分配到所有调度的时区：

```php
'timezone' => env('APP_TIMEZONE', 'UTC'),

'schedule_timezone' => 'America/Chicago',
```

> [!WARNING]  
> 请记住，某些时区使用夏令时。当夏令时变化发生时，您的调度任务可能会运行两次，甚至根本不运行。因此，我们建议尽可能避免时区调度。

### 防止任务重叠

默认情况下，即使任务的前一个实例仍在运行，也会运行调度的任务。要防止这种情况，您可以使用 `withoutOverlapping` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->withoutOverlapping();
```

在本例中，`emails:send` [Artisan 命令](/docs/11/digging-deeper/artisan) 如果没有在运行，每分钟都会运行。`withoutOverlapping` 方法在您有作业执行时间存在巨大差异的情况下特别有用，阻止您预测给定任务将需要多长时间。

如果需要，您可以指定"无重叠"锁过期前必须经过的分钟数。默认情况下，锁将在 24 小时后过期：

```php
Schedule::command('emails:send')->withoutOverlapping(10);
```

在幕后，`withoutOverlapping` 方法使用您应用程序的 [缓存](/docs/11/digging-deeper/cache) 来获取锁。如果必要，您可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。这通常只在任务由于意外的服务器问题而卡住时才需要。

### 单服务器运行任务

> [!WARNING]  
> 要使用此功能，您的应用程序必须使用 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动作为应用程序的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器进行通信。

如果您的应用程序的调度器在多台服务器上运行，您可以限制计划任务只在单个服务器上执行。例如，假设您有一个计划任务，每周五晚上生成新报告。如果任务调度器在三个工作服务器上运行，则计划任务将在所有三个服务器上运行并生成报告三次。这不好！

为了指示该任务仅在一个服务器上运行，请在定义计划任务时使用 `onOneServer` 方法。首个获得该任务的服务器将获得该工作的原子锁，以防止其他服务器同时运行相同的任务：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
        ->fridays()
        ->at('17:00')
        ->onOneServer();
```

#### 为单服务器任务命名

有时，您可能需要使用不同的参数调度相同的作业，同时指示 Laravel 在单个服务器上运行每个作业的每种排列。要做到这一点，您可以通过 `name` 方法为每个计划定义分配唯一名称：

```php
Schedule::job(new CheckUptime('https://laravel.com'))
        ->name('check_uptime:laravel.com')
        ->everyFiveMinutes()
        ->onOneServer();

Schedule::job(new CheckUptime('https://vapor.laravel.com'))
        ->name('check_uptime:vapor.laravel.com')
        ->everyFiveMinutes()
        ->onOneServer();
```

类似地，如果预定的闭包打算在单个服务器上运行，必须命名：

```php
Schedule::call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```

### 后台任务

默认情况下，同时预定的多项任务将基于在 `schedule` 方法中定义的顺序依次执行。如果您有长时间运行的任务，这可能导致后续任务的启动比预期晚得多。如果您想要在后台运行任务，以便它们可以同时运行，您可以使用 `runInBackground` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('analytics:report')
         ->daily()
         ->runInBackground();
```

> [!WARNING]  
> `runInBackground` 方法只能在使用 `command` 和 `exec` 方法时使用。

### 维护模式

当应用程序处于[维护模式](/docs/11/getting-started/configuration#maintenance-mode)时，您的应用程序预定的任务将不会运行，因为我们不希望您的任务干扰您可能正在服务器上执行的任何未完成的维护。然而，如果您想强制任务即使在维护模式下也能运行，您可以在定义任务时调用 `evenInMaintenanceMode` 方法：

```php
Schedule::command('emails:send')->evenInMaintenanceMode();
```

## 运行调度器

现在我们已经学会了如何定义预定任务，让我们讨论一下如何在服务器上实际运行它们。`schedule:run` Artisan 命令将评估您的所有预定任务，并根据服务器的当前时间确定它们是否需要运行。

因此，当使用 Laravel 的调度器时，我们只需要在服务器上添加一个单一的 cron 配置条目，该条目每分钟运行一次 `schedule:run` 命令。如果您不知道如何向服务器添加 cron 条目，请考虑使用诸如 [Laravel Forge](https://forge.laravel.com) 这样的服务，它可以为您管理 cron 条目：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### 小于一分钟的预定任务

在大多数操作系统中，cron 作业运行频率最多为每分钟一次。然而，Laravel 的调度器允许您安排任务以更频繁的间隔运行，甚至频繁至每秒一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->everySecond();
```

当您的应用程序中定义了小于一分钟的任务时，`schedule:run` 命令将继续运行到当前分钟结束而不是立即退出。这允许命令在整个分钟内调用所有需要的小于一分钟的任务。

由于小于一分钟的任务如果运行时间超出预期可能会延迟后续小于一分钟任务的执行，建议所有小于一分钟的任务派发队列作业或后台命令来处理实际的任务处理：

```php
use App\Jobs\DeleteRecentUsers;

Schedule::job(new DeleteRecentUsers)->everyTenSeconds();

Schedule::command('users:delete')->everyTenSeconds()->runInBackground();
```

#### 中断小于一分钟的任务

由于当定义了小于一分钟的任务时，`schedule:run` 命令运行整分钟的调用，因此当部署您的应用程序时，您可能有时需要中断命令。否则，已经在运行的 `schedule:run` 命令实例将继续使用您的应用程序之前部署的代码，直到当前分钟结束。

为了中断正在进行的 `schedule:run` 调用，您可以将 `schedule:interrupt` 命令添加到应用程序的部署脚本中。该命令应在您的应用程序部署完成后调用：

```shell
php artisan schedule:interrupt
```

### 本地运行调度器

通常，您不会在本地开发机器上添加调度器 cron 条目。相反，您可以使用 `schedule:work` Artisan 命令。此命令将在前台运行，并在您终止命令之前每分钟调用一次调度器：

```shell
php artisan schedule:work
```

## 任务输出

Laravel 调度器提供了几种方便的方法来处理计划任务生成的输出。首先，使用 `sendOutputTo` 方法，您可以将输出发送到文件以供以后检查：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
         ->daily()
         ->sendOutputTo($filePath);
```

如果您希望将输出追加到给定文件，您可以使用 `appendOutputTo` 方法：

```php
Schedule::command('emails:send')
         ->daily()
         ->appendOutputTo($filePath);
```

使用 `emailOutputTo` 方法，您可以将输出通过电子邮件发送到您选择的电子邮件地址。在通过电子邮件发送任务的输出之前，您应该配置 Laravel 的[电子邮件服务](/docs/11/digging-deeper/mail)：

```php
Schedule::command('report:generate')
         ->daily()
         ->sendOutputTo($filePath)
         ->emailOutputTo('taylor@example.com');
```

如果您只想在预定的 Artisan 或系统命令以非零退出代码终止时通过电子邮件发送输出，请使用 `emailOutputOnFailure` 方法：

```php
Schedule::command('report:generate')
         ->daily()
         ->emailOutputOnFailure('taylor@example.com');
```

> [!WARNING]  
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法仅限于 `command` 和 `exec` 方法。

## 任务钩子

使用 `before` 和 `after` 方法，您可以指定在预定任务执行前后要执行的代码：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
         ->daily()
         ->before(function () {
             // 任务即将执行...
         })
         ->after(function () {
             // 任务已执行...
         });
```

`onSuccess` 和 `onFailure` 方法允许您指定如果预定任务成功或失败要执行的代码。失败表示预定的 Artisan 或系统命令以非零退出代码终止：

```php
Schedule::command('emails:send')
         ->daily()
         ->onSuccess(function () {
             // 任务成功...
         })
         ->onFailure(function () {
             // 任务失败...
         });
```

如果命令中有输出可用，您可以在您的 `after`、`onSuccess` 或 `onFailure` 钩子中通过为钩子的闭包定义类型提示为 `Illuminate\Support\Stringable` 实例的 `$output` 参数来访问它：

```php
use Illuminate\Support\Stringable;

Schedule::command('emails:send')
         ->daily()
         ->onSuccess(function (Stringable $output) {
             // 任务成功...
})
         ->onFailure(function (Stringable $output) {
             // 任务失败...
});
```

#### Pinging URLs

使用 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行前后自动 ping 给定的 URL。此方法对于通知外部服务（如 [Envoyer](https://envoyer.io)）您的预定任务正在开始或已完成执行非常有用：

```php
Schedule::command('emails:send')
         ->daily()
         ->pingBefore($url)
         ->thenPing($url);
```

如果条件为 `true`，则可以使用 `pingBeforeIf` 和 `thenPingIf` 方法仅 ping 给定的 URL：

```php
Schedule::command('emails:send')
         ->daily()
         ->pingBeforeIf($condition, $url)
         ->thenPingIf($condition, $url);
```

如果任务成功或失败，可以使用 `pingOnSuccess` 和 `pingOnFailure` 方法仅 ping 给定的 URL。失败表示预定的 Artisan 或系统命令以非零退出代码终止：

```php
Schedule::command('emails:send')
         ->daily()
         ->pingOnSuccess($successUrl)
         ->pingOnFailure($failureUrl);
```

## 事件

在调度过程中，Laravel 调度多种[事件](/docs/11/digging-deeper/events)。您可以为以下任何事件[定义侦听器](/docs/11/digging-deeper/events)：

| 事件名称                                                    |
| ----------------------------------------------------------- |
| `Illuminate\Console\Events\ScheduledTaskStarting`           |
| `Illuminate\Console\Events\ScheduledTaskFinished`           |
| `Illuminate\Console\Events\ScheduledBackgroundTaskFinished` |
| `Illuminate\Console\Events\ScheduledTaskSkipped`            |
| `Illuminate\Console\Events\ScheduledTaskFailed`             |
