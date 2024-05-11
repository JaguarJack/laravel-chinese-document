# Lavevel Pulse

[[toc]]

## 介绍

Laravel Pulse 提供了对您的应用程序性能和使用情况的一目了然的洞察。通过 Pulse，您可以找出像慢速作业和端点这样的瓶颈，找到您最活跃的用户，以及更多。

要深入调试单个事件，请查看 [Laravel Telescope](/docs/11/packages/telescope) 文档。

## 安装

> [!WARNING]  
> Pulse 的第一方存储实现目前需要一个 MySQL、MariaDB 或 PostgreSQL 数据库。如果您使用的是其他数据库引擎，则需要为您的 Pulse 数据单独设置一个 MySQL、MariaDB 或 PostgreSQL 数据库。

由于 Pulse 目前处于测试阶段，您可能需要调整应用程序的 `composer.json` 文件以允许安装测试包版本：

```json
{
  "minimum-stability": "beta",
  "prefer-stable": true
}
```

然后，您可以使用 Composer 包管理器将 Pulse 安装到您的 Laravel 项目中：

```sh
composer require laravel/pulse
```

接下来，您应该使用 `vendor:publish` Artisan 命令发布 Pulse 配置文件和迁移文件：

```sh
php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"
```

最后，您应该运行 `migrate` 命令以创建存储 Pulse 数据所需的表：

```sh
php artisan migrate
```

完成 Pulse 数据库迁移后，您可以通过 `/pulse` 路由访问 Pulse 仪表盘。

> [!NOTE]  
> 如果您不希望在应用程序的主数据库中存储 Pulse 数据，您可以[指定一个专用的数据库连接](#使用不同的数据库)。

### 配置

许多 Pulse 的配置选项可以使用环境变量控制。要查看可用选项、注册新记录器或配置高级选项，您可以发布 `config/pulse.php` 配置文件：

```sh
php artisan vendor:publish --tag=pulse-config
```

## 仪表盘

### 授权

Pulse 仪表盘可以通过 `/pulse` 路由访问。默认情况下，您只能在 `local` 环境中访问此仪表盘，因此您需要通过自定义 `'viewPulse'` 授权门控在生产环境中配置授权。您可以在应用程序的 `app/Providers/AppServiceProvider.php` 文件中完成此项工作：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Gate::define('viewPulse', function (User $user) {
        return $user->isAdmin();
    });

    // ...
}
```

### 定制化

可以通过发布仪表盘视图来配置 Pulse 仪表盘的卡片和布局。仪表盘视图将发布到 `resources/views/vendor/pulse/dashboard.blade.php`：

```sh
php artisan vendor:publish --tag=pulse-dashboard
```

仪表盘由 [Livewire](https://livewire.laravel.com/) 驱动，允许您在无需重建任何 JavaScript 资源的情况下自定义卡片和布局。

在此文件中，`<x-pulse>` 组件负责渲染仪表盘并为卡片提供网格布局。如果您希望仪表盘横跨整个屏幕，您可以向该组件提供 `full-width` 属性：

```blade
<x-pulse full-width>
    ...
</x-pulse>
```

默认情况下，`<x-pulse>` 组件会创建一个 12 列网格，但您可以使用 `cols` 属性自定义这一点：

```blade
<x-pulse cols="16">
    ...
</x-pulse>
```

每张卡片都接受 `cols` 和 `rows` 属性以控制空间和定位：

```blade
<livewire:pulse.usage cols="4" rows="2" />
```

大多数卡片还接受一个 `expand` 属性以显示完整卡片而不是滚动：

```blade
<livewire:pulse.slow-queries expand />
```

### 解析用户

对于显示有关用户的信息的卡片（例如应用程序使用情况卡片），Pulse 仅记录用户的 ID。在渲染仪表盘时，Pulse 将从您的默认 `Authenticatable` 模型中解析 `name` 和 `email` 字段，并使用 Gravatar 网络服务显示头像。

您可以通过在应用程序的 `App\Providers\AppServiceProvider` 类中调用 `Pulse::user` 方法来自定义字段和头像。

`user` 方法接受一个闭包，闭包将接收要显示的 `Authenticatable` 模型，并返回包含用户 `name`、`extra` 和 `avatar` 信息的数组：

```php
use Laravel\Pulse\Facades\Pulse;

/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Pulse::user(fn ($user) => [
        'name' => $user->name,
        'extra' => $user->email,
        'avatar' => $user->avatar_url,
    ]);

    // ...
}
```

> [!NOTE]  
> 您可以通过实现 `Laravel\Pulse\Contracts\ResolvesUsers` 接口并在 Laravel 的[服务容器](/docs/11/architecture-concepts/container#binding-a-singleton)中绑定它来完全自定义认证用户的捕获和检索方式。

### 卡片

#### 服务器

`<livewire:pulse.servers />` 卡片显示运行 `pulse:check` 命令的所有服务器的系统资源使用情况。有关系统资源报告的更多信息，请参考 [服务器记录器](#servers-recorder) 文档。

如果你替换了基础设施中的服务器，你可能希望在一定的时间后停止在 Pulse 仪表板上显示非活动的服务器。你可以使用 `ignore-after` 属性来实现这一点，该属性接受一个以秒为单位的数字，表示非活动服务器应该在多少秒后从 Pulse 仪表板中移除。或者，你可以提供一个相对时间格式的字符串，比如 `1 小时` 或 `3 天 1 小时`：

```blade
<livewire:pulse.servers ignore-after="3 hours" />
```

#### 应用程序使用情况

`<livewire:pulse.usage />` 卡片显示对您的应用程序发送请求、分派作业和遇到慢速请求的前 10 名用户。

如果您希望同时在屏幕上查看所有使用情况指标，您可以多次包含卡片并指定 `type` 属性：

```blade
<livewire:pulse.usage type="requests" />
<livewire:pulse.usage type="slow_requests" />
<livewire:pulse.usage type="jobs" />
```

要了解有关自定义 Pulse 检索和显示用户信息的更多信息，请查阅我们关于[解析用户](#dashboard-resolving-users)的文档。

> [!NOTE]  
> 如果您的应用程序接收大量请求或分派多个作业，您可能希望开启[采样](#sampling)。有关详细信息，请参阅 [用户请求记录器](#user-requests-recorder)、[用户作业记录器](#user-jobs-recorder) 和 [慢速作业记录器](#slow-jobs-recorder) 文档。

#### 异常

`<livewire:pulse.exceptions />` 卡片显示应用程序中发生的异常的频率和最近时间。默认情况下，异常将根据异常类和发生位置进行分组。有关详细信息，请查阅 [异常记录器](#exceptions-recorder) 文档。

#### 队列

`<livewire:pulse.queues />` 卡片显示应用程序队列的吞吐量，包括排队、处理中、已处理、已释放和失败的作业数量。有关详细信息，请查阅 [队列记录器](#queues-recorder) 文档。

#### 慢速请求

`<livewire:pulse.slow-requests />` 卡片显示超过配置阈值的传入应用程序请求，该阈值默认为 1000 毫秒。有关详细信息，请查阅 [慢速请求记录器](#slow-requests-recorder) 文档。

#### 慢速作业

`<livewire:pulse.slow-jobs />` 卡片显示超过配置阈值的应用程序中排队的作业，该阈值默认为 1000 毫秒。有关详细信息，请查阅 [慢速作业记录器](#slow-jobs-recorder) 文档。

#### 慢速查询

`<livewire:pulse.slow-queries />` 卡片显示超过配置阈值的应用程序中的数据库查询，该阈值默认为 1000 毫秒。

默认情况下，慢速查询将根据 SQL 查询（不含绑定）和发生位置进行分组，但您可以选择不捕获位置，仅根据 SQL 查询进行分组。

有关详细信息，请查阅 [慢速查询记录器](#slow-queries-recorder) 文档。

#### 慢速外部请求

`<livewire:pulse.slow-outgoing-requests />` 卡片显示使用 Laravel 的 [HTTP 客户端](/docs/11/digging-deeper/http-client) 发出的超过配置阈值的外部请求，该阈值默认为 1000 毫秒。

默认情况下，条目将根据完整 URL 进行分组。然而，您可能希望使用正则表达式对相似的外部请求进行归一化或分组。有关详细信息，请查阅 [慢速外部请求记录器](#slow-outgoing-requests-recorder) 文档。

#### 缓存

`<livewire:pulse.cache />` 卡片显示了您应用程序的缓存命中和未命中统计数据，无论是全局统计还是针对个别键的统计。

默认情况下，条目将根据键进行分组。然而，您可能希望使用正则表达式对相似的键进行归一化或分组。有关详细信息，请查阅 [缓存交互记录器](#cache-interactions-recorder) 文档。

## 记录条目

大多数 Pulse 记录器会自动基于 Laravel 派发的框架事件来捕获条目。然而，[服务器记录器](#servers-recorder) 和一些第三方卡片必须定期轮询信息。要使用这些卡片，你必须在你的所有各个应用服务器上运行 `pulse:check` 守护进程：

```php
php artisan pulse:check
```

> [!NOTE]
> 为了使 `pulse:check` 过程永久在后台运行，你应该使用进程监控器，如 Supervisor 来确保命令不会停止运行。

由于 `pulse:check` 命令是一个长期运行的过程，它不会看到你的代码库的变化，除非被重启。你应该在应用程序的部署过程中通过调用 `pulse:restart` 命令来优雅地重启命令：

```sh
php artisan pulse:restart
```

> [!NOTE]  
> Pulse 使用[缓存](/docs/11/digging-deeper/cache)来存储重启信号，所以在使用这个功能之前，你应该验证缓存驱动是否为你的应用程序正确配置。

### 记录器

记录器负责捕获来自你的应用程序的条目，以记录在 Pulse 数据库中。记录器在 [Pulse 配置文件](#configuration) 的 `recorders` 部分注册和配置。

#### 缓存交互

`CacheInteractions` 记录器捕获你的应用程序发生的[缓存](/docs/11/digging-deeper/cache)命中和未命中信息，以在 [缓存](#cache-card) 卡片上显示。

你可以选择调整[采样率](#sampling)和被忽略的键模式。

你还可以配置键分组，以便将类似的键作为单个条目进行分组。例如，你可能希望从缓存相同类型信息的键中移除唯一 ID。分组使用正则表达式配置以“查找和替换”键的部分。配置文件中包括了一个示例：

```php
Recorders\CacheInteractions::class => [
    // ...
    'groups' => [
        // '/:\d+/' => ':*',
    ],
],
```

匹配到的第一个模式将被使用。如果没有模式匹配，则键将按原样捕获。

#### 异常

`Exceptions` 记录器捕获你的应用程序中发生的可报告异常信息，以在 [异常](#exceptions-card) 卡片上显示。

你可以选择调整[采样率](#sampling)和被忽略的异常模式。你还可以配置是否捕获异常起源的位置。捕获的位置将显示在 Pulse 仪表盘上，这有助于追踪异常的起源；然而，如果同一个异常在多个地方发生，它将对每个独特的位置多次出现。

#### 队列

`Queues` 记录器捕获你的应用程序队列的信息，以在 [队列](#queues-card) 卡片上显示。

你可以选择调整[采样率](#sampling)和被忽略的作业模式。

#### 慢作业

`SlowJobs` 记录器捕获你的应用程序中发生的慢作业信息，以在 [慢作业](#slow-jobs-recorder) 卡片上显示。

你可以选择调整慢作业阈值，[采样率](#sampling)，和被忽略的作业模式。

#### 慢出站请求

`SlowOutgoingRequests` 记录器捕获使用 Laravel 的 [HTTP 客户端](/docs/11/digging-deeper/http-client) 发出并超出配置阈值的出站 HTTP 请求信息，以在 [慢出站请求](#slow-outgoing-requests-card) 卡片上显示。

你可以选择调整慢出站请求阈值，[采样率](#sampling)，和被忽略的 URL 模式。

你还可以配置 URL 分组，以便将类似的 URL 作为单个条目进行分组。例如，你可能希望从 URL 路径中移除唯一 ID 或仅按域名分组。分组使用正则表达式配置以“查找和替换”URL 的部分。配置文件中包含了一些示例：

```php
Recorders\OutgoingRequests::class => [
    // ...
    'groups' => [
        // '#^https://api\.github\.com/repos/.*$#' => 'api.github.com/repos/*',
        // '#^https?://([^/]*).*$#' => '\1',
        // '#/\d+#' => '/*',
    ],
],
```

匹配到的第一个模式将被使用。如果没有模式匹配，则 URL 将按原样捕获。

#### 慢查询

`SlowQueries` 记录器捕获你的应用程序中超出配置阈值的任何数据库查询信息，以在 [慢查询](#slow-queries-card) 卡片上显示。

你可以选择调整慢查询阈值，[采样率](#sampling)，和被忽略的查询模式。你还可以配置是否捕获查询位置。捕获的位置将显示在 Pulse 仪表盘上，这有助于追踪查询的起源；然而，如果同一个查询在多个位置进行，它将对每个独特的位置多次出现。

#### 慢请求

`Requests` 记录器捕获对你的应用程序所做的请求信息，以在 [慢请求](#slow-requests-card) 和 [应用使用](#application-usage-card) 卡片上显示。

你可以选择调整慢路由阈值，[采样率](#sampling)，和被忽略的路径。

#### 服务器

`Servers` 记录器捕获为你的应用程序供电的服务器的 CPU、内存和存储使用情况信息，以在 [服务器](#servers-card) 卡片上显示。这个记录器需要在你希望监视的每台服务器上运行 [`pulse:check` 命令](#capturing-entries)。

每台报告服务器必须有一个唯一的名称。默认情况下，Pulse 将使用 PHP 的 `gethostname` 函数返回的值。如果你想自定义这个，你可以设置 `PULSE_SERVER_NAME` 环境变量：

```shell
PULSE_SERVER_NAME=load-balancer
```

Pulse 配置文件也允许你自定义被监视的目录。

#### 用户作业

`UserJobs` 记录器捕获你的应用程序中用户调度作业的信息，以在 [应用使用](#application-usage-card) 卡片上显示。

你可以选择调整[采样率](#sampling)和被忽略的作业模式。

#### 用户请求

`UserRequests` 记录器捕获用户对你的应用程序发出的请求信息，以在 [应用使用](#application-usage-card) 卡片上显示。

你可以选择调整[采样率](#sampling)和被忽略的请求模式。

### 过滤

正如我们所看到的，许多[记录器](#recorders)提供了通过配置“忽略”入站条目的能力，例如基于请求的 URL 的值。但是，有时基于其他因素过滤记录可能会很有用，比如当前认证的用户。为了过滤掉这些记录，你可以将一个闭包传递给 Pulse 的 `filter` 方法。通常，`filter` 方法应该在应用程序的 `AppServiceProvider` 的 `boot` 方法中被调用：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Pulse\Entry;
use Laravel\Pulse\Facades\Pulse;
use Laravel\Pulse\Value;

/**
 * 初始化任何应用服务。
 */
public function boot(): void
{
    Pulse::filter(function (Entry|Value $entry) {
        return Auth::user()->isNotAdmin();
    });

    // ...
}
```

## 性能

Pulse 设计的目的是为了能够无需额外基础设施即可加入现有应用程序。然而，对于高流量应用程序，有几种方法可以消除 Pulse 可能对你的应用程序性能造成的任何影响。

### 使用不同的数据库

对于高流量应用程序，你可能更愿意对 Pulse 使用一个专用的数据库连接，以避免影响你的应用程序数据库。

你可以通过设置 `PULSE_DB_CONNECTION` 环境变量来自定义 Pulse 所使用的[数据库连接](/docs/11/database/database#configuration)。

```shell
PULSE_DB_CONNECTION=pulse
```

### Redis 吞入

> [!WARNING]
> Redis 吞入需要 Redis 6.2 或更高版本，并且需要将 `phpredis` 或 `predis` 作为应用程序配置的 Redis 客户端驱动。

默认情况下，Pulse 会在将 HTTP 响应发送给客户端或处理完任务后，直接将条目存储到[配置的数据库连接](#using-a-different-database)；但是，你也可以使用 Pulse 的 Redis 吞入驱动将条目发送到 Redis 流中。这可以通过配置 `PULSE_INGEST_DRIVER` 环境变量来启用：

```
PULSE_INGEST_DRIVER=redis
```

默认情况下，Pulse 会使用你的默认[Redis 连接](/docs/11/database/redis#configuration)，但是你可以通过 `PULSE_REDIS_CONNECTION` 环境变量来自定义它：

```
PULSE_REDIS_CONNECTION=pulse
```

当使用 Redis 吞入时，你需要运行 `pulse:work` 命令来监控流，并将条目从 Redis 移动到 Pulse 的数据库表中。

```php
php artisan pulse:work
```

> [!NOTE]
> 为了使 `pulse:work` 过程永久在后台运行，你应该使用进程监视器，如 Supervisor 来确保 Pulse 工作者不会停止运行。

由于 `pulse:work` 命令是一个长期运行的过程，它不会看到你的代码库的变化，除非被重启。你应该在应用程序的部署过程中通过调用 `pulse:restart` 命令来优雅地重启命令：

```sh
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/11/digging-deeper/cache)来存储重启信号，因此在使用此功能之前应确保为应用程序正确配置了缓存驱动。

### 采样

默认情况下，Pulse 会捕获在你的应用程序中发生的每个相关事件。对于高流量应用程序，这可能导致需要在控制面板中聚合数百万条数据库行，尤其是对于较长的时间段而言。

你可以选择在某些 Pulse 数据记录器上启用“采样”。例如，在 [`User Requests`](#user-requests-recorder) 记录器上将采样率设置为 `0.1` 意味着你只记录你的应用程序大约 10% 的请求。在仪表板中，这些值将按比例放大，并加上 `~` 前缀，表示它们是一个近似值。

通常，对于特定度量，你拥有的条目越多，你就可以在不牺牲太多准确性的情况下安全地设置更低的采样率。

### 裁剪

一旦条目处于仪表板窗口之外，Pulse 会自动裁剪其存储的条目。在使用彩票系统吞入数据时会发生裁剪，这个系统可以在 Pulse [配置文件](#configuration)中自定义。

### 处理 Pulse 异常

如果在捕获 Pulse 数据时发生异常，例如无法连接到存储数据库，Pulse 将静默失败以避免影响你的应用程序。

如果你希望自定义这些异常的处理方式，你可以提供一个闭包给 `handleExceptionsUsing` 方法：

```php
use Laravel\Pulse\Facades\Pulse;
use Illuminate\Support\Facades\Log;

Pulse::handleExceptionsUsing(function ($e) {
    Log::debug('在 Pulse 中发生了异常', [
        'message' => $e->getMessage(),
        'stack' => $e->getTraceAsString(),
    ]);
});
```

## 自定义卡片

Pulse 允许你构建自定义卡片以显示与你的应用程序特定需求相关的数据。Pulse 使用 [Livewire](https://livewire.laravel.com)，所以在构建你的第一个自定义卡片之前，你可能想要[查看它的文档](https://livewire.laravel.com/docs)。

### 卡片组件

在 Laravel Pulse 中创建一个自定义卡片以扩展基础 `Card` Livewire 组件并定义对应的视图开始：

```php
namespace App\Livewire\Pulse;

use Laravel\Pulse\Livewire\Card;
use Livewire\Attributes\Lazy;

#[Lazy]
class TopSellers extends Card
{
    public function render()
    {
        return view('livewire.pulse.top-sellers');
    }
}
```

当使用 Livewire 的 [延迟加载](https://livewire.laravel.com/docs/lazy) 特性时，`Card` 组件会自动提供一个占位符，它会考虑传递给你的组件的 `cols` 和 `rows` 属性。

当编写你的 Pulse 卡片对应的视图时，你可以利用 Pulse 的 Blade 组件来实现一致的外观和体验：

```blade
<x-pulse::card :cols="$cols" :rows="$rows" :class="$class" wire:poll.5s="">
    <x-pulse::card-header name="Top Sellers">
        <x-slot:icon>
            ...
        </x-slot:icon>
    </x-pulse::card-header>

    <x-pulse::scroll :expand="$expand">
        ...
    </x-pulse::scroll>
</x-pulse::card>
```

`$cols`、`$rows`、`$class` 和 `$expand` 变量应该传递给相应的 Blade 组件，以便从仪表板视图中自定义卡片布局。你可能还希望在你的视图中包含 `wire:poll.5s=""` 属性以使卡片自动更新。

一旦你定义了你的 Livewire 组件和模板，卡片可以包含在你的[仪表板视图](#dashboard-customization)中：

```blade
<x-pulse>
    ...

    <livewire:pulse.top-sellers cols="4" />
</x-pulse>
```

> [!NOTE]
> 如果你的卡片包含在一个包中，你需要使用 `Livewire::component` 方法向 Livewire 注册组件。

### 样式

如果你的卡片需要超出 Pulse 包含的类和组件的额外样式，有几种方法可以为你的卡片包含自定义 CSS。

#### Laravel Vite 集成

如果你的自定义卡片位于你的应用程序代码库中并且你正在使用 Laravel 的 [Vite 集成](/docs/11/basics/vite)，你可以更新你的 `vite.config.js` 文件来包含你卡片的专用 CSS 入口点：

```js
laravel({
    input: [
        'resources/css/pulse/top-sellers.css',
        // ...
    ],
}),
```

然后你可以在你的[仪表板视图](#dashboard-customization)中使用 `@vite` Blade 指令，指定你卡片的 CSS 入口点：

```blade
<x-pulse>
    @vite('resources/css/pulse/top-sellers.css')

    ...
</x-pulse>
```

#### CSS 文件

对于包括包中的 Pulse 卡片在内的其他用例，你可以通过在你的 Livewire 组件上定义一个 `css` 方法来指示 Pulse 加载额外的样式表，该方法返回你的 CSS 文件的文件路径：

```php
class TopSellers extends Card
{
    // ...

    protected function css()
    {
        return __DIR__.'/../../dist/top-sellers.css';
    }
}
```

当这个卡片被包含在仪表板上时，Pulse 会自动在一个 `<style>` 标签中包含这个文件的内容，所以它不需要被发布到 `public` 目录。

#### Tailwind CSS

当使用 Tailwind CSS 时，你应该创建一个专用的 Tailwind 配置文件，以避免加载不必要的 CSS 或与 Pulse 的 Tailwind 类冲突：

```js
export default {
  darkMode: 'class',
  important: '#top-sellers',
  content: ['./resources/views/livewire/pulse/top-sellers.blade.php'],
  corePlugins: {
    preflight: false
  }
}
```

然后你可以在你的 CSS 入口点中指定配置文件：

```css
@config "../../tailwind.top-sellers.config.js";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

你还需要在你的卡片视图中包含一个与传递给 Tailwind 的 [`important` 选择器策略](https://tailwindcss.com/docs/configuration#selector-strategy) 相匹配的 `id` 或 `class` 属性：

```blade
<x-pulse::card id="top-sellers" :cols="$cols" :rows="$rows" class="$class">
    ...
</x-pulse::card>
```

### 数据捕获与聚合

自定义卡片可以从任何地方获取并显示数据；然而，你可能希望利用 Pulse 的强大且高效的数据记录和聚合系统。

#### 捕获条目

Pulse 允许你使用 `Pulse::record` 方法记录“条目”：

```php
use Laravel\Pulse\Facades\Pulse;

Pulse::record('user_sale', $user->id, $sale->amount)
    ->sum()
    ->count();
```

提供给 `record` 方法的第一个参数是你正在记录的条目的 `type`，而第二个参数是 `key`，它决定如何对聚合数据进行分组。对于大多数聚合方法，你还需要指定一个要聚合的 `value`。在上面的例子中，正在聚合的值是 `$sale->amount`。然后你可以调用一个或多个聚合方法（例如 `sum`），以便 Pulse 可以将预聚合的值捕获到“buckets”中，以便以后进行高效检索。

可用的聚合方法有：

- `avg`
- `count`
- `max`
- `min`
- `sum`

> [!NOTE]
> 当构建捕获当前经过身份验证的用户 ID 的卡包时，你应该使用 `Pulse::resolveAuthenticatedUserId()` 方法，该方法尊重应用程序中进行的任何[用户解析器自定义](#dashboard-resolving-users)。

#### 检索聚合数据

当扩展 Pulse 的 `Card` Livewire 组件时，你可以使用 `aggregate` 方法检索在仪表板中查看期间的聚合数据：

```php
class TopSellers extends Card
{
    public function render()
    {
        return view('livewire.pulse.top-sellers', [
            'topSellers' => $this->aggregate('user_sale', ['sum', 'count']);
        ]);
    }
}
```

`aggregate` 方法返回一个 PHP `stdClass` 对象集合。每个对象都将包含之前捕获的 `key` 属性，以及每个请求的聚合的键：

```
@foreach ($topSellers as $seller)
    {{ $seller->key }}
    {{ $seller->sum }}
    {{ $seller->count }}
@endforeach
```

Pulse 主要会从预聚合的 buckets 中检索数据；因此，指定的聚合必须使用 `Pulse::record` 方法事先捕获。最旧的 bucket 通常会部分超出期间，所以 Pulse 会聚合最早期的条目来填补空白，并给出整个期间的准确值，而不需要在每个轮询请求中聚合整个期间。

你还可以使用 `aggregateTotal` 方法检索给定类型的总值。例如，以下方法将检索所有用户销售的总额，而不是按用户分组。

```php
$total = $this->aggregateTotal('user_sale', 'sum');
```

#### 显示用户

当使用以用户 ID 作为密钥录制的聚合时，你可以使用 `Pulse::resolveUsers` 方法来解析密钥到用户记录：

```php
$aggregates = $this->aggregate('user_sale', ['sum', 'count']);

$users = Pulse::resolveUsers($aggregates->pluck('key'));

return view('livewire.pulse.top-sellers', [
    'sellers' => $aggregates->map(fn ($aggregate) => (object) [
        'user' => $users->find($aggregate->key),
        'sum' => $aggregate->sum,
        'count' => $aggregate->count,
    ])
]);
```

`find` 方法返回包含 `name`、`extra` 和 `avatar` 键的对象，你可以将它们直接传递给 `<x-pulse::user-card>` Blade 组件：

```blade
<x-pulse::user-card :user="{{ $seller->user }}" :stats="{{ $seller->sum }}" />
```

#### 自定义记录器

包作者可能希望提供记录器类，以允许用户配置数据的捕获。

记录器在应用程序的 `config/pulse.php` 配置文件的 `recorders` 部分进行注册：

```php
[
    // ...
    'recorders' => [
        Acme\Recorders\Deployments::class => [
            // ...
        ],

        // ...
    ],
]
```

记录器可以通过指定 `$listen` 属性来监听事件。Pulse 会自动注册监听器并调用记录器的 `record` 方法：

```php
<?php

namespace Acme\Recorders;

use Acme\Events\Deployment;
use Illuminate\Support\Facades\Config;
use Laravel\Pulse\Facades\Pulse;

class Deployments
{
    /**
     * 要监听的事件。
     *
     * @var array<int, class-string>
     */
    public array $listen = [
        Deployment::class,
    ];

    /**
     * 记录部署。
     */
    public function record(Deployment $event): void
    {
        $config = Config::get('pulse.recorders.'.static::class);

        Pulse::record(
            // ...
        );
    }
}
```
