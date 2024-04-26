---
title: Laravel 广播
---

# 广播

[[toc]]

## 简介

在许多现代 Web 应用程序中，WebSockets 用于实现实时、实时更新的用户界面。当服务器上的某些数据更新时，通常会通过 WebSocket 连接发送消息以便客户端处理。WebSockets 提供了一个比不断轮询应用程序服务器以获取数据变化以在 UI 中反映的更有效的替代方案。

例如，设想您的应用程序可以将用户的数据导出为 CSV 文件并通过电子邮件发送给他们。但是，创建这个 CSV 文件需要几分钟，所以你选择在 [队列工作](/docs/11/digging-deeper/queues) 中创建和邮寄 CSV。当 CSV 创建并邮寄给用户时，我们可以使用事件广播来调度一个 `App\Events\UserDataExported` 事件，该事件被我们应用程序的 JavaScript 接收。一旦收到事件，我们可以显示一个消息给用户，他们的 CSV 已经通过邮件发送给他们，而不需要他们刷新页面。

为了帮助您构建这些类型的功能，Laravel 使得通过 WebSocket 连接 "广播" 您的服务器端 Laravel [事件](/docs/11/digging-deeper/events) 变得容易。广播您的 Laravel 事件允许您在服务器端 Laravel 应用程序和客户端 JavaScript 应用程序之间共享相同的事件名称和数据。

广播背后的核心概念很简单：客户端连接到前端的命名频道，而您的 Laravel 应用程序在后端向这些频道广播事件。这些事件可以包含您希望提供给前端的任何附加数据。

#### 支持的驱动程序

默认情况下，Laravel 包括三个服务器端广播驱动程序供您选择：[Laravel Reverb](https://reverb.laravel.com)，[Pusher Channels](https://pusher.com/channels)，和 [Ably](https://ably.com)。

> [!NOTE]  
> 在深入事件广播之前，请确保您已经阅读了 Laravel 关于 [事件和监听器](/docs/11/digging-deeper/events) 的文档。

## 服务器端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用程序中进行一些配置，并安装一些包。

事件广播是通过服务器端广播驱动程序完成的，广播您的 Laravel 事件，以便 Laravel Echo（一个 JavaScript 库）可以在浏览器客户端接收它们。不用担心 - 我们将逐步走过安装过程的每个部分。

### 配置

您应用程序的所有事件广播配置都存储在 `config/broadcasting.php` 配置文件中。Laravel 支持多种广播驱动程序：[Laravel Reverb](/docs/11/packages/reverb)，[Pusher Channels](https://pusher.com/channels)，[Ably](https://ably.com)，以及用于本地开发和调试的 `log` 驱动程序。此外，还包含一个 `null` 驱动程序，允许您在测试期间完全禁用广播。`config/broadcasting.php` 配置文件中包含了每种驱动程序的配置示例。

#### 安装

默认情况下，新的 Laravel 应用程序中没有启用广播。您可以使用 `install:broadcasting` Artisan 命令来启用广播：

```shell
php artisan install:broadcasting
```

`install:broadcasting` 命令将创建一个 `routes/channels.php` 文件，您可以在其中注册应用程序的广播授权路由和回调。

#### 队列配置

在广播任何事件之前，您应首先配置并运行一个 [队列工作器](/docs/11/digging-deeper/queues)。所有事件广播都是通过队列工作完成的，以防止广播事件严重影响您应用程序的响应时间。

### Reverb

运行 `install:broadcasting` 命令时，将提示您安装 [Laravel Reverb](/docs/11/packages/reverb)。当然，您也可以使用 Composer 包管理器手动安装 Reverb。由于 Reverb 目前处于测试阶段，您需要明确地安装测试版本：

```sh
composer require laravel/reverb:@beta
```

包安装后，您可以运行 Reverb 的安装命令来发布配置、添加 Reverb 所需的环境变量，并在您的应用中启用事件广播：

```sh
php artisan reverb:install
```

您可以在 [Reverb 文档](/docs/11/packages/reverb) 中找到详细的 Reverb 安装和使用说明。

### Pusher Channels

如果您计划使用 [Pusher Channels](https://pusher.com/channels) 广播事件，您应该使用 Composer 包管理器安装 Pusher Channels PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，您应该在 `config/broadcasting.php` 配置文件中配置您的 Pusher Channels 凭据。这个文件中已经包含了一个 Pusher Channels 配置示例，允许您快速指定您的 key、secret 和应用 ID。通常情况下，您应该在应用程序的 `.env` 文件中配置您的 Pusher Channels 凭据：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"
```

`config/broadcasting.php` 文件的 `pusher` 配置还允许您指定 Channels 支持的附加 `options`，如集群。

然后，在您应用程序的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `pusher`：

```ini
BROADCAST_CONNECTION=pusher
```

最后，您准备安装和配置 [Laravel Echo](#client-side-installation)，它将在客户端接收广播事件。

### Ably

> [!NOTE]  
> 下面的文档讨论了如何在 "Pusher 兼容" 模式下使用 Ably。然而，Ably 团队推荐并维护了一个广播器和 Echo 客户端，能够利用 Ably 提供的独特功能。有关使用 Ably 维护的驱动程序的更多信息，请 [参阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

如果您计划使用 [Ably](https://ably.com) 广播事件，您应该使用 Composer 包管理器安装 Ably PHP SDK：

```shell
composer require ably/ably-php
```

接下来，您应该在 `config/broadcasting.php` 配置文件中配置您的 Ably 凭据。这个文件中已经包含了一个 Ably 配置示例，允许您快速指定您的 key。通常情况下，此值应通过 `ABLY_KEY` [环境变量](/docs/11/getting-started/configuration#environment-configuration) 设置：

```ini
ABLY_KEY=your-ably-key
```

然后，在您应用程序的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `ably`：

```ini
BROADCAST_CONNECTION=ably
```

最后，您准备安装和配置 [Laravel Echo](#client-side-installation)，它将在客户端接收广播事件。

## 客户端安装

### Reverb

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，使得订阅频道和监听服务器端广播驱动程序广播的事件变得简单。您可以通过 NPM 包管理器安装 Echo。在这个例子中，我们还将安装 `pusher-js` 包，因为 Reverb 使用 Pusher 协议进行 WebSocket 订阅、频道和消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，您可以在应用程序的 JavaScript 中创建一个新的 Echo 实例。一个好地方是 Laravel 框架附带的 `resources/js/bootstrap.js` 文件的底部。默认情况下，该文件中已经包含了一个 Echo 配置示例 - 您只需取消注释它并更新 `broadcaster` 配置选项为 `reverb`：

```js
import Echo from 'laravel-echo'

import Pusher from 'pusher-js'
window.Pusher = Pusher

window.Echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss']
})
```

接下来，您应该编译应用程序的资源文件：

```shell
npm run build
```

> [!WARNING]  
> Laravel Echo 的 `reverb` 广播商需要 laravel-echo v1.16.0+。

### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，使得订阅频道和监听服务器端广播驱动程序广播的事件变得简单。Echo 也利用了 `pusher-js` NPM 包实现了 Pusher 协议的 WebSocket 订阅、频道和消息。

`install:broadcasting` Artisan 命令会自动为您安装 `laravel-echo` 和 `pusher-js` 包；然而，您也可以通过 NPM 手动安装这些包：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，您可以在应用程序的 JavaScript 中创建一个新的 Echo 实例。`install:broadcasting` 命令会在 `resources/js/echo.js` 创建一个 Echo 配置文件；但是，此文件中的默认配置是为 Laravel Reverb 准备的。您可以复制下面的配置来将您的配置转换为 Pusher：

```js
import Echo from 'laravel-echo'

import Pusher from 'pusher-js'
window.Pusher = Pusher

window.Echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  forceTLS: true
})
```

接下来，您应该在应用程序的 `.env` 文件中定义 Pusher 环境变量的适当值。如果这些变量在您的 `.env` 文件中还不存在，您应该添加它们：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

一旦您根据应用程序的需要调整了 Echo 配置，您可以编译应用程序的资源文件：

```shell
npm run build
```

> [!NOTE]  
> 要了解有关编译应用程序 JavaScript 资源的更多信息，请参阅关于 [Vite](/docs/11/basics/vite) 的文档。

#### 使用现有的客户端实例

如果你已经有一个预配置的 Pusher Channels 客户端实例，你希望 Echo 使用它，你可以通过 `client` 配置选项将其传递给 Echo：

```js
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

const options = {
  broadcaster: 'pusher',
  key: 'your-pusher-channels-key'
}

window.Echo = new Echo({
  ...options,
  client: new Pusher(options.key, options)
})
```

### Ably

[!NOTE]

> 下面的文档讨论如何在 "Pusher 兼容" 模式下使用 Ably。然而，Ably 团队推荐并维护一个广播器和 Echo 客户端，能够利用 Ably 提供的独特功能。为了获取更多关于使用 Ably 维护的驱动程序的信息，请查阅 [Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，它使订阅频道和监听由你的服务器端广播驱动器广播的事件变得无痛。Echo 也利用 `pusher-js` NPM 包来实现 WebSocket 订阅、频道和消息的 Pusher 协议。

`install:broadcasting` Artisan 命令会自动为你安装 `laravel-echo` 和 `pusher-js` 包；但是，你也可以通过 NPM 手动安装这些包：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应该在你的 Ably 应用设置中启用 Pusher 协议支持。你可以在你的 Ably 应用的设置仪表板的 "Protocol Adapter Settings" 部分启用此功能。**

一旦 Echo 安装完毕，你就可以在你的应用的 JavaScript 中创建一个新的 Echo 实例了。`install:broadcasting`命令在 `resources/js/echo.js` 中创建一个 Echo 配置文件；但是，这个文件中的默认配置是为 Laravel Reverb 准备的。你可以复制下面的配置，将你的配置迁移到 Ably：

```js
import Echo from 'laravel-echo'

import Pusher from 'pusher-js'
window.Pusher = Pusher

window.Echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
  wsHost: 'realtime-pusher.ably.io',
  wsPort: 443,
  disableStats: true,
  encrypted: true
})
```

你可能已经注意到我们的 Ably Echo 配置引用了一个 `VITE_ABLY_PUBLIC_KEY` 环境变量。这个变量的值应该是你的 Ably 公钥。你的公钥是你的 Ably 密钥中出现在 `:` 字符之前的部分。

一旦你根据你的需求调整了 Echo 配置，你可以编译你的应用的资源：

```shell
npm run dev
```

[!NOTE]

> 想了解更多关于编译你的应用的 JavaScript 资源的信息，请查看 [Vite](/docs/11/basics/vite) 的文档。

## 概念概述

Laravel 的事件广播允许你通过基于驱动的方式将你的服务端 Laravel 事件广播到你的客户端 JavaScript 应用。目前，Laravel 包含 [Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com) 驱动。事件可以很容易地在客户端使用 [Laravel Echo](#client-side-installation) JavaScript 包进行消费。

事件通过 "channels" 进行广播，可以被指定为公共或私有的。你的应用的任何访问者都可以在没有任何认证或授权的情况下订阅一个公共 channel；然而，要订阅一个私有 channel，用户必须被认证并被授权在该 channel 上监听。

### 使用示例应用

在深入探讨事件广播的每一个组件之前，让我们通过使用一个电子商务商店来进行一个高层次的概述。

在我们的应用中，假设我们有一个页面允许用户查看他们订单的配送状态。我们也假设当一个配送状态更新被应用处理时，将触发 `OrderShipmentStatusUpdated` 事件：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

#### `ShouldBroadcast` 接口

当用户正在查看他们的一个订单时，我们不希望他们必须刷新页面来查看状态更新。相反，我们希望在更新生成时就广播它们。因此，我们需要将 `ShouldBroadcast` 接口标记在 `OrderShipmentStatusUpdated` 事件上。这将指示 Laravel 在事件被触发时广播事件：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    /**
     * The order instance.
     *
     * @var \App\Order
     */
    public $order;
}
```

`ShouldBroadcast`接口要求我们的事件定义一个 `broadcastOn` 方法。这个方法负责返回事件应该广播的频道。一个空的这个方法的存根已经在生成的事件类上定义了，所以我们只需要填写它的详细内容。我们只希望订单的创建者能够查看状态更新，所以我们会将事件广播到一个与订单绑定的私有 channel：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channel the event should broadcast on.
 */
public function broadcastOn(): Channel
{
    return new PrivateChannel('orders.'.$this->order->id);
}
```

如果你希望事件能够在多个频道上广播，你可以返回一个 `array` ：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channels the event should broadcast on.
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PrivateChannel('orders.'.$this->order->id),
        // ...
    ];
}
```

#### 认证 Channels

记住，用户必须被授权才能在私有 channels 上监听。我们可以在应用的 `routes/channels.php` 文件中定义我们的频道授权规则。在这个例子中，我们需要验证任何试图在私有 `orders.1` 频道上监听的用户实际上是订单的创建者：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道的名字和一个回调函数，返回 `true` 或 `false` 来表示用户是否被授权在频道上监听。

所有的授权回调函数都会将当前认证的用户作为它们的第一个参数，并将任何额外的通配符参数作为它们的后续参数。在这个例子中，我们使用 `{orderId}` 占位符来表示频道名字中的 "ID" 部分是一个通配符。

#### 监听事件广播

接下来，我们剩下的就是在我们的 JavaScript 应用中监听事件了。我们可以使用 [Laravel Echo](#client-side-installation) 来做这件事。首先，我们会使用 `private` 方法来订阅私有频道。然后，我们可以使用 `listen` 方法来监听 `OrderShipmentStatusUpdated` 事件。默认情况下，所有的事件的公共属性都会被包含在广播事件上：

```js
Echo.private(`orders.${orderId}`).listen('OrderShipmentStatusUpdated', (e) => {
  console.log(e.order)
})
```

## 定义广播事件

要告知 Laravel 一个给定的事件应该被广播，你必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。这个接口已经导入到了框架生成的所有事件类中，所以你可以很容易地将它添加到你的任何事件上。

`ShouldBroadcast`接口要求你实现一个单一的方法：`broadcastOn`。`broadcastOn` 方法应该返回一个频道或者一个频道的数组，事件应该在这些频道上被广播。这些频道应该是 `Channel`, `PrivateChannel`, 或 `PresenceChannel` 的实例。`Channel` 的实例代表任何用户都可以订阅的公共频道，而 `PrivateChannels` 和 `PresenceChannels` 代表私有频道，这需要 [频道授权](#authorizing-channels) ：

```php
<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast
{
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->user->id),
        ];
    }
}
```

在实现了 `ShouldBroadcast` 接口之后，你只需要像平常一样 [触发事件](/docs/11/digging-deeper/events)。一旦事件被触发，一个 [队列任务](/docs/11/digging-deeper/queues) 将自动使用你指定的广播驱动来广播事件。

### 广播名称

默认情况下，Laravel 会使用事件的类名进行广播。但是，你可以通过在事件中定义一个 `broadcastAs` 方法来自定义广播名称：

```php
/**
 * 事件的广播名字.
 */
public function broadcastAs(): string
{
    return 'server.created';
}
```

如果你使用 `broadcastAs` 方法自定义了广播名称，你应该确保你的监听器是以一个前导 `.` 字符注册的。这可以通知 Echo 不要将应用的命名空间添加到事件前面：

```js
.listen('.server.created', function (e) {
    ....
});
```

<a name="broadcast-data"></a>

### 广播数据

当一个事件被广播时，所有的 `public` 属性会被自动序列化并作为事件负载进行广播，允许你从你的 JavaScript 应用中访问它的任何 public 数据。例如，如果你的事件有一个公共的 `$user` 属性，它包含一个 Eloquent 模型，那么事件的广播负载将会是：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

然而，如果你希望对你的广播负载有更细粒度的控制，你可以在你的事件中添加一个 `broadcastWith` 方法。这个方法应该返回一个数组，数组中包含你希望作为事件负载进行广播的数据：

```php
/**
 * 获取将要广播的数据.
 *
 * @return array<string, mixed>
 */
public function broadcastWith(): array
{
    return ['id' => $this->user->id];
}
```

<a name="broadcast-queue"></a>

### 广播队列

默认情况下，每个广播事件都会被放置在你的 `queue.php` 配置文件中指定的默认队列的默认队列连接上。你可以通过在你的事件类上定义 `connection` 和 `queue` 属性来自定义广播者使用的队列连接和名称：

```php
/**
 * 当广播事件时使用的队列连接的名字.
 *
 * @var string
 */
public $connection = 'redis';

/**
 * 广播任务放置的队列的名称.
 *
 * @var string
 */
public $queue = 'default';
```

或者，你也可以通过在你的事件中定义一个 `broadcastQueue` 方法来自定义队列名称：

```php
/**
 * 广播任务放置的队列的名称.
 */
public function broadcastQueue(): string
{
    return 'default';
}
```

如果你希望通过使用 `sync` 队列而不是默认的队列驱动程序来广播你的事件，你可以实现 `ShouldBroadcastNow` 接口而不是 `ShouldBroadcast` 接口：

```php
<?php

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OrderShipmentStatusUpdated implements ShouldBroadcastNow
{
    // ...
}
```

### 广播条件

有时你希望你的事件只在给定的条件为真时广播。你可以通过在你的事件类中添加一个 `broadcastWhen` 方法来定义这些条件：

    /**
     * Determine if this event should broadcast.
     */
    public function broadcastWhen(): bool
    {
        return $this->order->value > 100;
    }

#### 广播和数据库事务

当在数据库事务中分派广播事件时，它们可能会在数据库事务提交之前被队列处理。当这种情况发生时，你在数据库事务期间对模型或数据库记录进行的任何更新可能还没有在数据库中反映出来。此外，在事务期间创建的任何模型或数据库记录可能不存在于数据库中。如果你的事件依赖于这些模型，当处理广播事件的工作时可能会发生意外的错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以指示特定的广播事件应在所有打开的数据库事务被提交后分派，方法是在事件类上实现 `ShouldDispatchAfterCommit` 接口：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use SerializesModels;
}
```

> [!NOTE]
> 更多关于应对这些问题的方法，请查看有关[队列工作和数据库事务](/docs/11/digging-deeper/queues#jobs-and-database-transactions)的文档。

## 授权频道

私有频道要求你授权当前认证的用户能实际上在频道上进行监听。这通过向 Laravel 应用程序发送带有频道名称的 HTTP 请求，并让应用程序决定用户是否可以在该频道上进行监听来实现。当使用 [Laravel Echo](#客户端安装) 时，授权订阅私有频道的 HTTP 请求将自动进行。

启用广播时，Laravel 会自动注册 `/broadcasting/auth` 路由来处理授权请求。`/broadcasting/auth` 路由会被自动放到 `web` 中间件组中。

### 定义授权回调

接下来，我们需要定义实际决定当前认证用户的逻辑，是否可以监听给定频道。这是在 `routes/channels.php` 文件中完成的，该文件由 `install:broadcasting` Artisan 命令创建。在此文件中，你可以使用 `Broadcast::channel` 方法注册频道授权回调：

```php
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道的名称和一个回调函数，该回调函数返回 `true` 或 `false` 以指示用户是否有权在频道上进行监听。

所有的授权回调函数都会收到当前认证的用户作为其第一个参数，以及任何额外的通配符参数作为其后续参数。在这个例子中，我们使用 `{orderId}` 占位符来表示通道名中的 "ID" 部分是一个通配符。

你可以使用 `channel:list` Artisan 命令查看应用程序的广播授权回调列表：

```shell
php artisan channel:list
```

#### 授权回调模型绑定

就像 HTTP 路由一样，通道路由也可以利用隐式和显式[路由模型绑定](/docs/11/basics/routing#route-model-binding)。例如，你可以请求一个实际的 `Order` 模型实例，而不是接收一个字符串或数字的订单 ID：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{order}', function (User $user, Order $order) {
    return $user->id === $order->user_id;
});
```

> [!WARNING]  
> 不同于 HTTP 路由模型绑定，通道模型绑定不支持自动[隐式模型绑定作用域](/docs/11/basics/routing#implicit-model-binding-scoping)。然而，这通常不是问题，因为大多数通道可以基于单个模型的唯一主键进行作用域限定。

#### 授权回调验证

私有和存在的广播频道通过你应用程序的默认身份验证守卫对当前用户进行验证。如果用户没有认证，通道授权将被自动拒绝，授权回调将不会被执行。然而，如果必要，你可以指定多个、自定义的守卫，它们应该验证进入的请求：

```php
Broadcast::channel('channel', function () {
    // ...
}, ['guards' => ['web', 'admin']]);
```

### 定义频道类

如果你的应用程序正在处理许多不同的频道，你的 `routes/channels.php` 文件可能会变得很大。所以，你可以使用频道类而不是使用闭包来授权频道。使用 `make:channel` Artisan 命令可以生成一个频道类。这个命令会将一个新的频道类放在 `App/Broadcasting` 目录下。

```shell
php artisan make:channel OrderChannel
```

接下来，在你的 `routes/channels.php` 文件中注册你的频道：

```php
use App\Broadcasting\OrderChannel;

Broadcast::channel('orders.{order}', OrderChannel::class);
```

最后，你可以将你的频道的授权逻辑放在频道类的 `join` 方法中。这个 `join` 方法将包含你通常会放在你的频道授权闭包中的相同逻辑。你也可以利用频道模型绑定：

```php
<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderChannel
{
    /**
     * Create a new channel instance.
     */
    public function __construct()
    {
        // ...
    }

    /**
     * Authenticate the user's access to the channel.
     */
    public function join(User $user, Order $order): array|bool
    {
        return $user->id === $order->user_id;
    }
}
```

> [!NOTE]  
> 像 Laravel 中的许多其他类一样，频道类会被 [服务容器](/docs/11/architecture-concepts/container)自动解析。所以，你可以在其构造函数中对频道所需的任何依赖进行类型提示。

## 广播事件

一旦你定义了一个事件并用 `ShouldBroadcast` 接口进行了标记，你就只需要使用事件的 `dispatch` 方法触发事件。事件调度器会注意到事件标记了 `ShouldBroadcast` 接口，并将事件排入广播队列：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

### 只对他人

在构建一个利用事件广播的应用程序时，你可能偶尔需要将事件广播给除当前用户之外的给定频道的所有订阅者。你可以使用 `broadcast` 辅助函数和 `toOthers` 方法来完成这个任务：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->toOthers();
```

为了更好地理解何时可能需要使用 `toOthers` 方法，让我们设想一个任务列表应用程序，用户可以通过输入任务名称创建新任务。要创建一个任务，你的应用程序可能会向 `/task` URL 发起请求，该请求会广播任务的创建并返回新任务的 JSON 表示。当你的 JavaScript 应用程序接收到来自终端的响应时，它可能会直接将新任务插入到其任务列表中，如下所示：

```js
axios.post('/task', task).then((response) => {
  this.tasks.push(response.data)
})
```

然而，别忘了我们也广播了任务的创建。如果你的 JavaScript 应用程序也在监听此事件以便将任务添加到任务列表，则你的列表中将有重复的任务：一个来自终点，一个来自广播。你可以通过使用 `toOthers` 方法来指示广播器不向当前用户广播事件来解决这个问题。

> [!WARNING]  
> 要调用 `toOthers` 方法，你的事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` 特性。

#### 配置

当你初始化一个 Laravel Echo 实例时，一个套接字 ID 将被分配给链接。如果你正在使用全局 [Axios](https://github.com/mzabriskie/axios) 实例从你的 JavaScript 应用程序中进行 HTTP 请求，套接字 ID 将自动附加到每一个发出的请求作为一个 `X-Socket-ID` 头。然后，当你调用 `toOthers` 方法时，Laravel 将从头中提取套接字 ID，并指示广播者不向具有该套接字 ID 的任何连接广播。

如果你没有使用全局 Axios 实例，你将需要手动配置你的 JavaScript 应用程序以在所有发出的请求中发送 `X-Socket-ID` 头。你可以使用 `Echo.socketId` 方法获取套接字 ID：

```js
var socketId = Echo.socketId()
```

### 自定义连接

如果你的应用程序与多个广播连接进行交互，你想使用一个其他广播者广播事件，你可以使用 `via` 方法指定将事件推送到哪个连接：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');
```

或者，你可以通过在事件的构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。然而，在这样做之前，你应该确保事件类使用了 `InteractsWithBroadcasting` 特性：

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    use InteractsWithBroadcasting;

    /**
     * Create a new event instance.
     */
    public function __construct()
    {
        $this->broadcastVia('pusher');
    }
}
```

### 匿名事件广播

有时，您可能希望在不创建专用事件类的情况下，向应用程序的前端广播一个简单的事件。为了满足这一需求，`Broadcast` facade 允许您广播“匿名事件”：

```php
Broadcast::on('orders.'.$order->id)->send();
```

上面的示例将广播以下事件：

```json
{
  "event": "AnonymousEvent",
  "data": "[]",
  "channel": "orders.1"
}
```

使用 `as` 和 `with` 方法，您可以自定义事件的名称和数据：

```php
Broadcast::on('orders.'.$order->id)
    ->as('OrderPlaced')
    ->with($order)
    ->send();
```

上面的示例将广播如下事件：

```json
{
  "event": "OrderPlaced",
  "data": "{ id: 1, total: 100 }",
  "channel": "orders.1"
}
```

如果您希望在私有频道或存在频道上广播匿名事件，您可以使用 `private` 和 `presence` 方法：

```php
Broadcast::private('orders.'.$order->id)->send();
Broadcast::presence('channels.'.$channel->id)->send();
```

使用 `send` 方法广播匿名事件会将事件分派到您应用程序的[队列](/docs/11/digging-deeper/queues)中进行处理。但是，如果您希望立即广播事件，您可以使用 `sendNow` 方法：

```php
Broadcast::on('orders.'.$order->id)->sendNow();
```

要向除当前认证用户以外的所有频道订阅者广播事件，您可以调用 `toOthers` 方法：

```php
Broadcast::on('orders.'.$order->id)
    ->toOthers()
    ->send();
```

## 接收广播

### 监听事件

一旦你[安装并实例化了 Laravel Echo](#client-side-installation)，你就可以开始监听来自你的 Laravel 应用程序广播的事件了。首先，使用 `channel` 方法获取频道的一个实例，然后调用 `listen` 方法来开始监听指定的事件：

```js
Echo.channel(`orders.${this.order.id}`).listen('OrderShipmentStatusUpdated', (e) => {
  console.log(e.order.name)
})
```

如果你想在私有频道上监听事件，那么应使用 `private` 方法替代。你可以继续链接 `listen` 方法来在单一频道上监听多个事件：

```js
Echo.private(`orders.${this.order.id}`).listen(/* ... */).listen(/* ... */).listen(/* ... */)
```

#### 停止监听事件

如果你想在[不离开频道](#leaving-a-channel)的情况下停止监听某个事件，你可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`).stopListening('OrderShipmentStatusUpdated')
```

### 离开频道

要离开频道，你可以在你的 Echo 实例上调用 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`)
```

如果你希望离开频道以及其相关的私有和存在频道，你可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`)
```

### 命名空间

你可能已经注意到，在上述例子中，我们没有为事件类指定完整的 `App\Events` 命名空间。这是因为 Echo 会自动假设事件位于 `App\Events` 命名空间中。但是，你可以在实例化 Echo 时通过传递 `namespace` 配置选项来配置根命名空间：

```js
window.Echo = new Echo({
  broadcaster: 'pusher',
  // ...
  namespace: 'App.Other.Namespace'
})
```

或者，当你使用 Echo 订阅它们时，你可以用 `.` 前缀事件类。这将允许你始终指定完全限定的类名：

```js
Echo.channel('orders').listen('.Namespace\\Event\\Class', (e) => {
  // ...
})
```

## Presence 频道

Presence 频道基于私有频道的安全性，同时暴露了关于谁订阅了频道的额外功能。这使得构建强大的，协作的应用程序功能变得容易，例如当另一个用户正在浏览同一页面时通知用户或者列出聊天室的成员。

### 授权 Presence 频道

所有的 Presence 频道也都是私有频道；因此，用户必须被[授权访问他们](#authorizing-channels)。然而，当为 Presence 频道定义授权回调时，你不会返回 `true` 如果用户被授权加入频道。相反，你应该返回一组关于用户的数据。

这些由授权回调返回的数据，将在你的 JavaScript 应用中的 Presence 频道事件侦听器中可用。如果用户未被授权加入 Presence 频道，你应返回 `false` 或 `null`：

```php
use App\Models\User;

Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
```

### 加入 Presence 频道

为了加入 Presence 频道，你可以使用 Echo 的 `join` 方法。`join` 方法将返回一个 `PresenceChannel` 实现，这个实现，以及暴露 `listen` 方法，允许你订阅 `here`，`joining` 和 `leaving` 事件。

```js
Echo.join(`chat.${roomId}`)
  .here((users) => {
    // ...
  })
  .joining((user) => {
    console.log(user.name)
  })
  .leaving((user) => {
    console.log(user.name)
  })
  .error((error) => {
    console.error(error)
  })
```

`here` 回调当频道成功加入后将立即执行，且会接收一个数组，此数组含有所有当前订阅频道的其他用户的用户信息。当新用户加入频道时，将执行 `joining` 方法；当用户离开频道时，将执行 `leaving` 方法。当认证端点返回一个非 200 的 HTTP 状态码或有问题解析返回的 JSON 时，将会执行 `error` 方法。

### 对 Presence 频道进行广播

Presence 频道可以像公共或私有频道一样接收事件。使用聊天室作为例子，我们可能希望广播 `NewMessage` 事件给房间的 Presence 频道。为了实现这个，我们将从事件的 `broadcastOn` 方法返回一个 `PresenceChannel` 实例：

```php
/**
 * Get the channels the event should broadcast on.
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PresenceChannel('chat.'.$this->message->room_id),
    ];
}
```

就像其他事件一样，你可以使用 `broadcast` 辅助函数和 `toOthers` 方法来排除当前用户从接收广播中：

```php
broadcast(new NewMessage($message));

broadcast(new NewMessage($message))->toOthers();
```

和其他类型的事件一样，你可以使用 Echo 的 `listen` 方法来监听发送到 presence 频道的事件：

```js
Echo.join(`chat.${roomId}`)
  .here(/* ... */)
  .joining(/* ... */)
  .leaving(/* ... */)
  .listen('NewMessage', (e) => {
    // ...
  })
```

## 模型广播

> [!WARNING]  
> 在阅读以下关于模型广播的文档之前，我们建议您熟悉 Laravel 的模型广播服务的一般概念以及如何手动创建和监听广播事件。

当您的应用程序的 [Eloquent models](/docs/11/eloquent/eloquent) 创建、更新或删除时，广播事件是常见的。当然，这可以通过手动[为 Eloquent 模型状态变更定义自定义事件](/docs/11/eloquent/eloquent#events)并标记这些事件以 `ShouldBroadcast` 接口来轻松实现。

然而，如果您在应用程序中没有为了其他目的使用这些事件，那么为了仅仅广播它们而创建事件类可能会很麻烦。为了解决这个问题，Laravel 允许您表明一个 Eloquent 模型应自动广播其状态变更。

首先，您的 Eloquent 模型应使用 `Illuminate\Database\Eloquent\BroadcastsEvents` 特性。此外，该模型应定义一个 `broadcastOn` 的方法，该方法将返回模型事件应广播频道的数组：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Database\Eloquent\BroadcastsEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use BroadcastsEvents, HasFactory;

    /**
     * Get the user that the post belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the channels that model events should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>
     */
    public function broadcastOn(string $event): array
    {
        return [$this, $this->user];
    }
}
```

一旦你的模型引入了这个特质并定义了其广播频道，它就会在模型实例被创建、更新、删除、垃圾箱或还原时开始自动广播事件。

另外，你可能注意到 `broadcastOn` 方法接收了一个字符串 `$event` 参数。这个参数包含了模型发生的事件类型并将具有 `created`，`updated`，`deleted`，`trashed` 或 `restored` 的值。通过检查这个变量的值，您可以确定模型应对哪个特定事件广播哪个频道（如果有的话）：

```php
/**
 * Get the channels that model events should broadcast on.
 *
 * @return array<string, array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>>
 */
public function broadcastOn(string $event): array
{
    return match ($event) {
        'deleted' => [],
        default => [$this, $this->user],
    };
}
```

#### 自定义模型广播事件创建

偶尔，你可能希望自定义 Laravel 如何创建底层的模型广播事件。你可以通过在你的 Eloquent 模型中定义一个 `newBroadcastableEvent` 方法来实现这一点。这个方法应该返回一个 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * 为该模型创建一个新的可广播的模型事件。
 */
protected function newBroadcastableEvent(string $event): BroadcastableModelEventOccurred
{
    return (new BroadcastableModelEventOccurred(
        $this, $event
    ))->dontBroadcastToCurrentUser();
}
```

### 模型广播约定

#### 频道约定

如你可能已经注意到，上面模型示例中的 `broadcastOn` 方法并没有返回 `Channel` 实例。相反，直接返回了 Eloquent 模型。如果你的模型的 `broadcastOn` 方法返回了一个 Eloquent 模型实例（或者该方法返回的数组中包含了一个 Eloquent 模型实例），Laravel 将自动为模型实例化一个私有频道，使用模型的类名和主键标识符作为频道名称。

所以，一个 `id` 为 `1` 的 `App\Models\User` 模型将会被转换为一个名称为 `App.Models.User.1` 的 `Illuminate\Broadcasting\PrivateChannel` 实例。当然，你可以在你的模型 `broadcastOn` 方法中返回完整的 `Channel` 实例，从而对模型的频道名称有完全的控制：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取模型事件应广播的频道。
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(string $event): array
{
    return [
        new PrivateChannel('user.'.$this->id)
    ];
}
```

如果你打算从模型的 `broadcastOn` 方法中显式返回一个频道实例，你可以将一个 Eloquent 模型实例传递给频道的构造器。这样做的时候，Laravel 将使用上述的模型频道约定把 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果你需要确定模型的频道名称，你可以在任何模型实例上调用 `broadcastChannel` 方法。例如，这个方法会对一个 `id` 为 `1` 的 `App\Models\User` 模型返回字符串 `App.Models.User.1` ：

```php
$user->broadcastChannel()
```

#### 事件约定

由于模型广播事件不关联你应用程序的 `App\Events` 目录中的实际事件，因此他们根据约定分配了一个名称和载荷。 Laravel 的约定是使用模型的类名（不包括命名空间）和触发广播的模型事件的名称来广播事件。

因此，例如，对 `App\Models\Post` 模型的更新将广播一个事件名为 `PostUpdated` 的事件，载荷如下：

```json
{
    "model": {
        "id": 1,
        "title": "My first post"
        ...
    },
    ...
    "socket": "someSocketId",
}
```

`App\Models\User` 的删除将广播一个名为 `UserDeleted` 的事件。

如果你愿意，你可以通过在模型中添加一个 `broadcastAs` 和 `broadcastWith` 方法来定义自定义的广播名称和载荷。这些方法接收模型事件/操作的名称，允许你为每个模型操作自定义事件的名称和载荷。如果 `broadcastAs` 方法返回 `null` ，Laravel 将使用上述的模型广播事件名称约定进行广播事件：

```php
/**
 * 模型事件的广播名称。
 */
public function broadcastAs(string $event): string|null
{
    return match ($event) {
        'created' => 'post.created',
        default => null,
    };
}

/**
 * 获取模型的广播数据。
 *
 * @return array<string, mixed>
 */
public function broadcastWith(string $event): array
{
    return match ($event) {
        'created' => ['title' => $this->title],
        default => ['model' => $this],
    };
}
```

### 监听模型广播

一旦你向你的模型中添加了 `BroadcastsEvents` 特质，并定义了你的模型的 `broadcastOn` 方法，你就可以开始在你的客户端应用中监听广播的模型事件了。在开始之前，你可能需要查阅关于[监听事件](#listening-for-events)的完整文档。

首先，使用 `private` 方法来获取一个频道实例，然后调用 `listen` 方法来监听某个特定的事件。通常，给 `private` 方法的频道名应该对应 Laravel 的[模型广播约定](#model-broadcasting-conventions)。

获取到频道实例之后，你可以使用 `listen` 方法来监听一个特定的事件。由于模型广播事件不关联应用程序的 `App\Events` 目录中的实际事件，所以[事件名称](#model-broadcasting-event-conventions)必须以 `.` 作前缀，指出它不属于特定的名称空间。每个模型广播事件都有一个 `model` 属性，包含所有模型的可广播属性：

```js
Echo.private(`App.Models.User.${this.user.id}`).listen('.PostUpdated', (e) => {
  console.log(e.model)
})
```

## 客户端事件

> [!NOTE]  
> 使用[Pusher Channels](https://pusher.com/channels)时，要发送客户端事件，你必须在[应用管理板](https://dashboard.pusher.com/)的 "App Settings" 部分启用 "Client Events" 选项。

有时你可能希望向其他已连接的客户端广播事件，而无需打击你的 Laravel 应用。这可能对于诸如 "typing" 通知这样的事情特别有用，这种通知会通知应用的用户有其他用户正在给定的屏幕上打字。

为了广播客户端事件，你可以使用 Echo 的 `whisper` 方法：

```js
Echo.private(`chat.${roomId}`).whisper('typing', {
  name: this.user.name
})
```

为了监听客户端事件，你可以使用 `listenForWhisper` 方法：

```js
Echo.private(`chat.${roomId}`).listenForWhisper('typing', (e) => {
  console.log(e.name)
})
```

## 通知

通过配对事件广播和[通知](/docs/11/digging-deeper/notifications)，你的 JavaScript 应用在通知发生时可以收到新的通知，而无需刷新页面。在开始之前，请务必阅读了解如何使用[broadcast 通知频道](/docs/11/digging-deeper/notifications#broadcast-notifications)。

一旦你配置一个通知使用 broadcast 频道，你就可以使用 Echo 的 `notification` 方法来监听广播的事件了。请注意，频道名应该匹配接收通告的实体的类名：

```js
Echo.private(`App.Models.User.${userId}`).notification((notification) => {
  console.log(notification.type)
})
```

在这个例子，所有通过 `broadcast` 频道发送给 `App\Models\User` 实例的通知会被回调得到。应用的 `routes/channels.php` 文件中已经包含了 `App.Models.User.{id}` 频道的授权回调。
