---
title: Laravel 通知
---

# 通知

[[toc]]

## 简介

除了支持[发送电子邮件](/docs/11/digging-deeper/mail)外，Laravel 还支持通过多种传输渠道发送通知，包括电子邮件、SMS（通过 [Vonage](https://www.vonage.com/communications-apis/)，前称 Nexmo）和 [Slack](https://slack.com)。此外，社区还创建了大量[社区构建的通知渠道](https://laravel-notification-channels.com/about/#suggesting-a-new-channel)，可以通过数十种不同的渠道发送通知！通知也可以存储在数据库中，以便在你的网络界面中显示。

通常，通知应该是简短的信息性消息，用来通知用户您的应用程序中发生的事情。例如，如果你正在编写一个计费应用程序，你可以通过电子邮件和短信渠道向用户发送“发票已支付”通知。

## 生成通知

在 Laravel 中，每个通知都由一个单独的类表示，通常存储在 `app/Notifications` 目录中。如果你在应用程序中没有看到这个目录，不用担心 - 当你运行 `make:notification` Artisan 命令时，它将为你创建：

```shell
php artisan make:notification InvoicePaid
```

这个命令会在你的 `app/Notifications` 目录中放置一个新的通知类。每个通知类包含一个 `via` 方法和多个消息构建方法，如 `toMail` 或 `toDatabase`，将通知转换为专门为该渠道定制的消息。

## 发送通知

### 使用 Notifiable Trait

可以通过两种方式发送通知：使用 `Notifiable` trait 的 `notify` 方法或使用 `Notification` [facade](/docs/11/architecture-concepts/facades)。`Notifiable` trait 默认包含在你的应用程序的 `App\Models\User` 模型中：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;
}
```

这个 trait 所提供的 `notify` 方法希望接收到一个通知实例：

```php
use App\Notifications\InvoicePaid;

$user->notify(new InvoicePaid($invoice));
```

> [!NOTE]
> 记住，你可以在任何模型上使用 `Notifiable` trait。你不限于只在你的 `User` 模型上包含它。

### 使用 Notification Facade

或者，你可以通过 `Notification` [facade](/docs/11/architecture-concepts/facades) 发送通知。当你需要向多个可通知实体发送通知时，比如用户集合，这种方法很有用。要使用 facade 发送通知，把所有的可通知实体和通知实例传递给 `send` 方法：

```php
use Illuminate\Support\Facades\Notification;

Notification::send($users, new InvoicePaid($invoice));
```

你还可以使用 `sendNow` 方法立即发送通知。即使通知实现了 `ShouldQueue` 接口，这个方法也会立即发送通知：

```php
Notification::sendNow($developers, new DeploymentCompleted($deployment));
```

### 指定发送渠道

每个通知类都有一个 `via` 方法，用于确定通知将通过哪些渠道发送。通知可以通过邮件（`mail`）、数据库（`database`）、广播（`broadcast`）、vonage 和 slack 渠道发送。

> [!NOTE]
> 如果你想使用其他发送渠道，如 Telegram 或 Pusher，请查看由社区推动的 [Laravel 通知渠道网站](http://laravel-notification-channels.com)。

`via` 方法接收一个 `$notifiable` 实例，这将是通知被发送到的类的实例。你可以使用 `$notifiable` 来确定通知应该通过哪些渠道发送：

```php
/**
 * 获取通知的传递渠道。
 *
 * @return array<int, string>
 */
public function via(object $notifiable): array
{
    return $notifiable->prefers_sms ? ['vonage'] : ['mail', 'database'];
}
```

### 队列化通知

> [!WARNING]
> 在队列化通知之前，你应该配置你的队列并[启动工作进程](/docs/11/digging-deeper/queues#running-the-queue-worker)。

发送通知可能需要时间，尤其是如果渠道需要进行外部 API 调用来传输通知。为了加快应用程序的响应时间，让你的通知可被队列化，通过添加 `ShouldQueue` 接口和 `Queueable` trait 到你的类。这个接口和 trait 已经导入到所有使用 `make:notification` 命令生成的通知中，所以你可以立即将它们添加到你的通知类中：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    // ...
}
```

一旦 `ShouldQueue` 接口被添加到你的通知中，你可以像往常一样发送通知。Laravel 会检测到类上的 `ShouldQueue` 接口，并自动将通知的传输排队：

```php
$user->notify(new InvoicePaid($invoice));
```

当队列化通知时，每个收件人和渠道组合将创建一个排队的工作。例如，如果你的通知有三个收件人和两个渠道，将会有六个工作被派发到队列中。

#### 延迟通知

如果你希望延迟通知的发送，请在通知实例化时链式调用 `delay` 方法：

```php
$delay = now()->addMinutes(10);

$user->notify((new InvoicePaid($invoice))->delay($delay));
```

#### 按通道延迟通知

您可以向 `delay` 方法传递一个数组，以便为特定通道指定延迟量：

```php
$user->notify((new InvoicePaid($invoice))->delay([
    'mail' => now()->addMinutes(5),
    'sms' => now()->addMinutes(10),
]));
```

或者，您也可以在通知类本身上定义一个 `withDelay` 方法。`withDelay` 方法应该返回一个通道名称和延迟值的数组：

```php
/**
 * 确定通知的递送延迟。
 *
 * @return array<string, \Illuminate\Support\Carbon>
 */
public function withDelay(object $notifiable): array
{
    return [
        'mail' => now()->addMinutes(5),
        'sms' => now()->addMinutes(10),
    ];
}
```

#### 自定义通知队列连接

默认情况下，队列通知将使用您应用程序的默认队列连接进行队列处理。如果您想指定一个不同的连接被用于某个特定通知，您可以在通知的构造器中调用 `onConnection` 方法：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的通知实例。
     */
    public function __construct()
    {
        $this->onConnection('redis');
    }
}
```

或者，如果您想指定特定的队列连接被用于通知支持的每个通道，您可以在通知上定义一个 `viaConnections` 方法。此方法应该返回一个通道名称/队列连接名称对的数组：

```php
/**
 * 确定每个通知通道应使用的连接。
 *
 * @return array<string, string>
 */
public function viaConnections(): array
{
    return [
        'mail' => 'redis',
        'database' => 'sync',
    ];
}
```

#### 自定义通知通道队列

如果您想指定特定的队列被用于每个通知支持的通道，您可以在通知上定义一个 `viaQueues` 方法。此方法应该返回一个通道名称/队列名称对的数组：

```php
/**
 * 确定每个通知通道应使用的队列。
 *
 * @return array<string, string>
 */
public function viaQueues(): array
{
    return [
        'mail' => 'mail-queue',
        'slack' => 'slack-queue',
    ];
}
```

#### 排队通知和数据库事务

当队列通知在数据库事务内分派时，它们可能会在数据库事务提交之前就被队列处理。发生这种情况时，您在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映到数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果您的通知依赖于这些模型，当处理发送队列通知的作业时可能会发生意外错误。

如果您的队列连接的 `after_commit` 配置选项设置为 `false`，您仍然可以通过发送通知时调用 `afterCommit` 方法来指示特定的队列通知在所有打开的数据库事务提交之后才分派：

```php
use App\Notifications\InvoicePaid;

$user->notify((new InvoicePaid($invoice))->afterCommit());
```

或者，您也可以在您的通知的构造器中调用 `afterCommit` 方法：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的通知实例。
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解有关解决这些问题的更多信息，请查看有关 [队列作业和数据库事务](/docs/11/digging-deeper/queues#jobs-and-database-transactions) 的文档。

#### 确定排队通知是否应发送

在队列通知分派到后台队列进行处理之后，它通常会被队列工作器接收并发送给预定的收件人。

然而，如果您想在通知由队列工作器处理之后做最终判断是否应发送队列通知，您可以在通知类上定义一个 `shouldSend` 方法。如果此方法返回 `false`，则不会发送通知：

```php
/**
 * 确定通知是否应该发送。
 */
public function shouldSend(object $notifiable, string $channel): bool
{
    return $this->invoice->isPaid();
}
```

### 按需通知

有时您可能需要向不作为您应用程序的“用户”存储的人发送通知。使用 `Notification` facade 的 `route` 方法，您可以在发送通知之前指定特定的通知路由信息：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Support\Facades\Notification;

Notification::route('mail', 'taylor@example.com')
            ->route('vonage', '5555555555')
            ->route('slack', '#slack-channel')
            ->route('broadcast', [new Channel('channel-name')])
            ->notify(new InvoicePaid($invoice));
```

如果您想在发送给 `mail` 路由的临时通知时提供收件人的姓名，您可以提供一个数组，其中电子邮件地址为键，姓名为第一个元素值：

```php
Notification::route('mail', [
    'barrett@example.com' => 'Barrett Blair',
])->notify(new InvoicePaid($invoice));
```

使用 `routes` 方法，您可以一次为多个通知通道提供特定的路由信息：

```php
Notification::routes([
    'mail' => ['barrett@example.com' => 'Barrett Blair'],
    'vonage' => '5555555555',
])->notify(new InvoicePaid($invoice));
```

## 邮件通知

### 格式化邮件消息

如果通知支持作为电子邮件发送，您应该在通知类上定义一个 `toMail` 方法。此方法将接收一个 `$notifiable` 实体并应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。

`MailMessage` 类包含了一些简单的方法来帮助您构建交易性电子邮件消息。邮件消息可以包括文本行以及一个“行动呼吁”。让我们看一个例子的 `toMail` 方法：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    $url = url('/invoice/'.$this->invoice->id);

    return (new MailMessage)
                ->greeting('Hello!')
                ->line('One of your invoices has been paid!')
                ->lineIf($this->amount > 0, "Amount paid: {$this->amount}")
                ->action('View Invoice', $url)
                ->line('Thank you for using our application!');
}
```

> [!NOTE]
> 注意我们在 `toMail` 方法中使用了 `$this->invoice->id`。您可以将任何数据您的通知需要生成其消息传递到通知的构造器。

在这个示例中，我们注册了一个问候语、一行文本、一个行动呼吁，然后是另一行文本。`MailMessage` 对象提供的这些方法使得格式化小型交易邮件变得简单快速。然后，邮件通道将消息组件翻译成一个美观、响应式的 HTML 电子邮件模板及其纯文本副本。以下是 `mail` 通道生成的电子邮件示例：

<img src="https://laravel.com/img/docs/notification-example-2.png">

> [!NOTE]
> 在发送邮件通知时，请务必在您的 `config/app.php` 配置文件中设置 `name` 配置选项。该值将在邮件通知消息的头部和尾部使用。

#### 错误消息

一些通知会通知用户错误，例如发票支付失败。通过在构建消息时调用 `error` 方法，您可以指示邮件消息是关于错误的。在邮件消息上使用 `error` 方法时，行动呼吁按钮将是红色而不是黑色：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->error()
                ->subject('Invoice Payment Failed')
                ->line('...');
}
```

#### 其他邮件通知格式化选项

在通知类中定义"text lines"而不是使用 `view` 方法指定应用于渲染通知电子邮件的自定义模板：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->view(
        'mail.invoice.paid', ['invoice' => $this->invoice]
    );
}
```

您可以通过将视图名称作为提供给 `view` 方法的数组的第二个元素指定邮件消息的纯文本视图：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->view(
        ['mail.invoice.paid', 'mail.invoice.paid-text'],
        ['invoice' => $this->invoice]
    );
}
```

或者，如果您的消息只有纯文本视图，您可以使用 `text` 方法：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->text(
        'mail.invoice.paid-text', ['invoice' => $this->invoice]
    );
}
```

### 自定义发送者

默认情况下，电子邮件的发送者/发件人地址在 `config/mail.php` 配置文件中定义。然而，您可以使用 `from` 方法为特定通知指定发件人地址：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->from('barrett@example.com', 'Barrett Blair')
                ->line('...');
}
```

### 自定义收件人

当通过 `mail` 通道发送通知时，通知系统将自动寻找您的可通知实体上的 `email` 属性。您可以定义一个 `routeNotificationForMail` 方法到您的可通知实体上，以自定义用来递送通知的电子邮件地址：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为邮件通道的路由通知。
     *
     * @return  array<string, string>|string
     */
    public function routeNotificationForMail(Notification $notification): array|string
    {
        // 仅返回电子邮件地址...
        return $this->email_address;

        // 返回电子邮件地址和姓名...
        return [$this->email_address => $this->name];
    }
}
```

### 自定义主题

默认情况下，电子邮件的主题是通知类的类名转化为“标题大小写”。所以，如果您的通知类被命名为 `InvoicePaid`，电子邮件的主题将是 `Invoice Paid`。如果您想为消息指定不同的主题，您可以在构建消息时调用 `subject` 方法：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->subject('Notification Subject')
                ->line('...');
}
```

### 自定义邮箱

默认情况下，邮件通知将使用 `config/mail.php` 配置文件中定义的默认邮件器发送。然而，您可以在构建您的消息时通过调用 `mailer` 方法实时指定其他邮件器：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->mailer('postmark')
                ->line('...');
}
```

### 自定义模板

您可以通过发布通知包资源来修改邮件通知使用的 HTML 和纯文本模板。运行此命令后，邮件通知模板将位于 `resources/views/vendor/notifications` 目录：

```shell
php artisan vendor:publish --tag=laravel-notifications
```

### 附件

要在电子邮件通知中添加附件，请在构建消息时使用 `attach` 方法。`attach` 方法接受文件的绝对路径作为第一个参数：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->greeting('Hello!')
                ->attach('/path/to/file');
}
```

> [!NOTE]
> 通知邮件消息提供的 `attach` 方法也接受[可附加对象](/docs/11/digging-deeper/mail#attachable-objects)。请查阅全面的[可附加对象文档](/docs/11/digging-deeper/mail#attachable-objects)以了解更多。

在附加文件到消息时，您也可以通过将 `array` 作为第二个参数传递给 `attach` 方法来指定显示名称和/或 MIME 类型：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->greeting('Hello!')
                ->attach('/path/to/file', [
                    'as' => 'name.pdf',
                    'mime' => 'application/pdf',
                ]);
}
```

与在邮件对象中附加文件不同，您不能使用 `attachFromStorage` 直接从存储盘附加文件。您应该使用 `attach` 方法并指定存储盘上文件的绝对路径。或者，您可以从 `toMail` 方法返回一个[邮件](/docs/11/digging-deeper/mail#generating-mailables)：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;

/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
                ->to($notifiable->email)
                ->attachFromStorage('/path/to/file');
}
```

必要时，可以使用 `attachMany` 方法向消息附加多个文件：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->greeting('Hello!')
                ->attachMany([
                    '/path/to/forge.svg',
                    '/path/to/vapor.svg' => [
                        'as' => 'Logo.svg',
                        'mime' => 'image/svg+xml',
                    ],
                ]);
}
```

#### 原始数据附件

`attachData` 方法可以用于将原始字节字符串作为附件附加。当调用 `attachData` 方法时，您应该提供要分配给附件的文件名：

```php
/**
 * 获取通知的邮件表示。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->greeting('Hello!')
                ->attachData($this->pdf, 'name.pdf', [
                    'mime' => 'application/pdf',
                ]);
}
```

### 添加标签和元数据

一些第三方电子邮件提供商如 Mailgun 和 Postmark 支持消息的“标签”和“元数据”，这些可以用来对您的应用程序发送的电子邮件进行分组和跟踪。您可以通过 `tag` 和 `metadata` 方法向电子邮件消息添加标签和元数据：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->greeting('Comment Upvoted!')
                ->tag('upvote')
                ->metadata('comment_id', $this->comment->id);
}
```

如果您的应用程序正在使用 Mailgun 驱动程序，可查阅 Mailgun 的文档，了解有关[标签](https://documentation.mailgun.com/en/latest/user_manual.html#tagging-1)和[元数据](https://documentation.mailgun.com/en/latest/user_manual.html#attaching-data-to-messages)的更多信息。同样，您也可以查阅 Postmark 文档了解它们对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)的支持。

如果您的应用程序使用 Amazon SES 发送电子邮件，应使用 `metadata` 方法附加[SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)到消息中。

### 自定义 Symfony 消息

`MailMessage` 类的 `withSymfonyMessage` 方法允许您注册一个闭包，该闭包将在发送消息之前调用 Symfony 消息实例。这给了您在消息发送前深入定制消息的机会：

```php
use Symfony\Component\Mime\Email;

/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->withSymfonyMessage(function (Email $message) {
                    $message->getHeaders()->addTextHeader(
                        'Custom-Header', 'Header Value'
                    );
                });
}
```

### 使用 Mailables

如有需要，您可以从通知的 `toMail` 方法返回一个完整的[邮件对象](/docs/11/digging-deeper/mail)。当返回一个 `Mailable` 而不是 `MailMessage` 时，您需要指定消息收件人使用邮件对象的 `to` 方法：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Mail\Mailable;

/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
                ->to($notifiable->email);
}
```

#### Mailables 和按需通知

如果您正在发送[按需通知](#on-demand-notifications)，`toMail` 方法接收到的 `$notifiable` 实例将是 `Illuminate\Notifications\AnonymousNotifiable` 的实例，该实例提供了一个 `routeNotificationFor` 方法，可以用来检索按需通知应该发送到的电子邮件地址：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Mail\Mailable;

/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): Mailable
{
    $address = $notifiable instanceof AnonymousNotifiable
            ? $notifiable->routeNotificationFor('mail')
            : $notifiable->email;

    return (new InvoicePaidMailable($this->invoice))
                ->to($address);
}
```

### 预览邮件通知

在设计邮件通知模板时，能够在浏览器中快速预览渲染后的邮件消息就像预览典型的 Blade 模板一样方便。因此，Laravel 允许您直接从路由闭包或控制器返回由邮件通知生成的任何邮件消息。当返回 `MailMessage` 时，它将被渲染并在浏览器中显示，让您能够在不需要将邮件发送到实际电子邮件地址的情况下快速预览它的设计：

```php
use App\Models\Invoice;
use App\Notifications\InvoicePaid;

Route::get('/notification', function () {
    $invoice = Invoice::find(1);

    return (new InvoicePaid($invoice))
                ->toMail($invoice->user);
});
```

## Markdown 邮件通知

Markdown 邮件通知允许您利用邮件通知的预构建模板，同时给予您更多自由编写较长的、定制化的信息。由于这些消息是用 Markdown 编写的，Laravel 可以为这些信息渲染出漂亮、响应式的 HTML 模板的同时也自动生成一个纯文本副本。

### 生成消息

要生成具有相应 Markdown 模板的通知，您可以使用 `make:notification` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:notification InvoicePaid --markdown=mail.invoice.paid
```

像所有其他邮件通知一样，使用 Markdown 模板的通知应该在通知类上定义一个 `toMail` 方法。然而，不用使用 `line` 和 `action` 方法构造通知，而是使用 `markdown` 方法指定应使用的 Markdown 模板的名称。您希望提供给模板的数据数组可以作为该方法的第二个参数传递：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    $url = url('/invoice/'.$this->invoice->id);

    return (new MailMessage)
                ->subject('Invoice Paid')
                ->markdown('mail.invoice.paid', ['url' => $url]);
}
```

### 编写消息

Markdown 邮件通知使用 Blade 组件和 Markdown 语法的组合，允许您在利用 Laravel 预制的通知组件的同时轻松地构建通知：

```blade
<x-mail::message>
# Invoice Paid

Your invoice has been paid!

<x-mail::button :url="$url">
View Invoice
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
```

#### 按钮组件

按钮组件呈现一个居中的按钮链接。该组件接受两个参数，`url` 和可选的 `color`。支持的颜色有 `primary`、`green` 和 `red`。您可以在通知中添加尽可能多的按钮组件：

```blade
<x-mail::button :url="$url" color="green">
View Invoice
</x-mail::button>
```

#### 面板组件

面板组件会将给定的文本块呈现在背景颜色略有不同的面板中。这样做可以让你吸引对特定文本块的注意：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

#### 表格组件

表格组件允许您将 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。表格列对齐使用默认的 Markdown 表格对齐语法支持：

```blade
<x-mail::table>
| Laravel       | Table         | Example  |
| ------------- |:-------------:| --------:|
| Col 2 is      | Centered      | $10      |
| Col 3 is      | Right-Aligned | $20      |
</x-mail::table>
```

### 自定义组件

您可以导出所有 Markdown 通知组件到您自己的应用程序中进行自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

该命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 和一个 `text` 目录，每个目录都包含每个可用组件的相应表示。您可以随意自定义这些组件。

#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。您可以在此文件中自定义 CSS，并且您的样式将自动内联到 Markdown 通知的 HTML 表现。

如果您想为 Laravel 的 Markdown 组件构建一个完全新的主题，您可以在 `html/themes` 目录中放置一个 CSS 文件。命名并保存您的 CSS 文件后，更新 `mail` 配置文件的 `theme` 选项以匹配您的新主题的名称。

要为单个通知自定义主题，可在构建通知的邮件消息时调用 `theme` 方法。`theme` 方法接受在发送通知时应使用的主题名称：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
                ->theme('invoice')
                ->subject('Invoice Paid')
                ->markdown('mail.invoice.paid', ['url' => $url]);
}
```

## 数据库通知

### 先决条件

`database` 通知渠道将通知信息存储在数据库表中。这张表将包含通知类型以及描述通知的 JSON 数据结构等信息。

您可以查询该表以在应用程序的用户界面中显示通知。但在此之前，您需要创建一个数据库表来保存您的通知。您可以使用 `make:notifications-table` 命令生成一个具有正确表结构的[迁移](/docs/11/database/migrations)：

```shell
php artisan make:notifications-table

php artisan migrate
```

> [!NOTE]
> 如果您的可通知模型使用 [UUID 或 ULID 主键](/docs/11/eloquent/eloquent#uuid-and-ulid-keys)，您应在通知表迁移中使用 [`uuidMorphs`](/docs/11/database/migrations#column-method-uuidMorphs) 或 [`ulidMorphs`](/docs/11/database/migrations#column-method-ulidMorphs) 替换 `morphs` 方法。

### 格式化数据库通知

如果通知支持存储在数据库表中，您应该在通知类上定义一个 `toDatabase` 或 `toArray` 方法。这个方法将接收一个 `$notifiable` 实体并应返回一个纯 PHP 数组。返回的数组将被编码为 JSON 并存储在您的 `notifications` 表的 `data` 列中。让我们看一个例子的 `toArray` 方法：

```php
/**
 * 获取通知的数组表示。
 *
 * @return array<string, mixed>
 */
public function toArray(object $notifiable): array
{
    return [
        'invoice_id' => $this->invoice->id,
        'amount' => $this->invoice->amount,
    ];
}
```

当通知存储在您的应用程序的数据库中时，`type` 列将被填充为通知的类名。不过，您可以通过在通知类上定义一个 `databaseType` 方法来自定义此行为：

```php
/**
 * 获取正在广播的通知类型。
 *
 * @return string
 */
public function databaseType(object $notifiable): string
{
    return 'invoice-paid';
}
```

#### `toDatabase` vs. `toArray`

`toArray` 方法也被用于 `broadcast`

#### `toDatabase` vs. `toArray`

`toArray` 方法也被 `broadcast` 通道使用，以确定要广播到您的 JavaScript 前端的数据。如果您希望为 `database` 和 `broadcast` 通道有两个不同的数组表示形式，您应定义一个 `toDatabase` 方法来代替 `toArray` 方法。

### 访问通知

一旦通知被存储在数据库中，您需要一种便捷的方式从您的通知实体中访问它们。Laravel 默认的 `App\Models\User` 模型中包含的 `Illuminate\Notifications\Notifiable` 特性，包含了一个返回实体通知的 `notifications` [Eloquent 关联](/docs/11/eloquent/eloquent-relationships)。要获取通知，您可以像访问任何其他 Eloquent 关联一样访问此方法。默认情况下，通知将按 `created_at` 时间戳排序，最近的通知将出现在集合的开始位置：

```php
$user = App\Models\User::find(1);

foreach ($user->notifications as $notification) {
    echo $notification->type;
}
```

如果您只想检索"未读"通知，您可以使用 `unreadNotifications` 关联。同样，这些通知将按 `created_at` 时间戳排序，最近的通知将出现在集合的开始位置：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    echo $notification->type;
}
```

> [!NOTE]  
> 要从您的 JavaScript 客户端访问您的通知，您应该为您的应用程序定义一个通知控制器，该控制器返回可通知实体（例如当前用户）的通知。然后，您可以从您的 JavaScript 客户端向该控制器的 URL 发出 HTTP 请求。

### 将通知标记为已读

通常，当用户查看通知时，您会希望将通知标记为“已读”。`Illuminate\Notifications\Notifiable` 特性提供了一个 `markAsRead` 方法，该方法更新通知数据库记录中的 `read_at` 列：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    $notification->markAsRead();
}
```

然而，您可以直接在通知集合上使用 `markAsRead` 方法，而无需遍历每个通知：

```php
$user->unreadNotifications->markAsRead();
```

您也可以使用批量更新查询在不从数据库检索它们的情况下将所有通知标记为已读：

```php
$user = App\Models\User::find(1);

$user->unreadNotifications()->update(['read_at' => now()]);
```

您可以 `delete` 通知，将其完全从表中删除：

```php
$user->notifications()->delete();
```

## 广播通知

### 先决条件

在广播通知之前，您应配置并熟悉 Laravel 的[事件广播](/docs/11/digging-deeper/broadcasting)服务。事件广播提供了一种从您的 JavaScript 前端响应服务器端 Laravel 事件的方式。

### 格式化广播通知

`broadcast` 通道使用 Laravel 的[事件广播](/docs/11/digging-deeper/broadcasting)服务来广播通知，允许您的 JavaScript 前端实时捕获通知。如果一个通知支持广播，您可以在通知类上定义一个 `toBroadcast` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `BroadcastMessage` 实例。如果不存在 `toBroadcast` 方法，将使用 `toArray` 方法来收集应广播的数据。返回的数据将被编码为 JSON 并广播到您的 JavaScript 前端。让我们来看一个 `toBroadcast` 方法的示例：

```php
use Illuminate\Notifications\Messages\BroadcastMessage;

/**
 * 获取通知的广播表示。
 */
public function toBroadcast(object $notifiable): BroadcastMessage
{
    return new BroadcastMessage([
        'invoice_id' => $this->invoice->id,
        'amount' => $this->invoice->amount,
    ]);
}
```

#### 广播队列配置

所有广播通知都排队进行广播。如果您想配置用于排队广播操作的队列连接或队列名称，您可以使用 `BroadcastMessage` 的 `onConnection` 和 `onQueue` 方法：

```php
return (new BroadcastMessage($data))
                ->onConnection('sqs')
                ->onQueue('broadcasts');
```

#### 自定义通知类型

除了您指定的数据外，所有广播通知还有一个 `type` 字段，其中包含通知的完整类名。如果您想自定义通知 `type`，您可以在通知类上定义一个 `broadcastType` 方法：

```php
/**
 * 获取正在广播的通知类型。
 */
public function broadcastType(): string
{
    return 'broadcast.message';
}
```

### 监听通知

通知将通过 `{notifiable}.{id}` 约定格式的私有通道广播。因此，如果您将通知发送给一个 ID 为 `1` 的 `App\Models\User` 实例，通知将在 `App.Models.User.1` 私有通道上广播。在使用 [Laravel Echo](/docs/11/digging-deeper/broadcasting#client-side-installation) 时，您可以使用 `notification` 方法轻松监听通道上的通知：

```javascript
Echo.private('App.Models.User.' + userId).notification((notification) => {
  console.log(notification.type)
})
```

#### 自定义通知通道

如果您想自定义实体的广播通知广播到的通道，您可以在可通知实体上定义一个 `receivesBroadcastNotificationsOn` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 用户接收通知广播的通道。
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'users.'.$this->id;
    }
}
```

## SMS 通知

### 先决条件

在 Laravel 中发送 SMS 通知由 [Vonage](https://www.vonage.com/) 支持（之前称为 Nexmo）。在通过 Vonage 发送通知之前，您需要安装 `laravel/vonage-notification-channel` 和 `guzzlehttp/guzzle` 包：

```shell
composer require laravel/vonage-notification-channel guzzlehttp/guzzle
```

该包包括一个 [配置文件](https://github.com/laravel/vonage-notification-channel/blob/3.x/config/vonage.php)。但是您不需要将此配置文件导出到您自己的应用程序。您可以简单地使用 `VONAGE_KEY` 和 `VONAGE_SECRET` 环境变量来定义您的 Vonage 公共密钥和私密密钥。

在定义完您的密钥后，您应该设置一个 `VONAGE_SMS_FROM` 环境变量，用来默认定义您的 SMS 消息应该从哪个电话号码发送。您可以在 Vonage 控制面板内生成这个电话号码：

```plaintext
VONAGE_SMS_FROM=15556666666
```

### 格式化 SMS 通知

如果一个通知支持以 SMS 形式发送，您应该在通知类上定义一个 `toVonage` 方法。这个方法将接收一个 `$notifiable` 实体，并应该返回一个 `Illuminate\Notifications\Messages\VonageMessage` 实例：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / SMS 表现形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
                ->content('您的 SMS 消息内容');
}
```

#### Unicode 内容

如果您的 SMS 消息将包含 unicode 字符，您在构造 `VonageMessage` 实例时应该调用 `unicode` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / SMS 表现形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
                ->content('您的 unicode 消息')
                ->unicode();
}
```

### 自定义 "发件人" 号码

如果您想从一个不同于 `VONAGE_SMS_FROM` 环境变量指定的电话号码发送某些通知，您可以在 `VonageMessage` 实例上调用 `from` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / SMS 表现形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
                ->content('您的 SMS 消息内容')
                ->from('15554443333');
}
```

### 添加客户端引用

如果您想跟踪每个用户、团队或客户的费用，您可以向通知中添加“客户端引用”。Vonage 将允许您使用此客户端引用生成报告，以便您更好地了解特定客户的 SMS 使用情况。客户端引用可以是任何长度不超过 40 个字符的字符串：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / SMS 表现形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
                ->clientReference((string) $notifiable->id)
                ->content('您的 SMS 消息内容');
}
```

### 路由 SMS 通知

要将 Vonage 通知路由到正确的电话号码，请在您的可通知实体上定义一个 `routeNotificationForVonage` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为 Vonage 频道的通知进行路由。
     */
    public function routeNotificationForVonage(Notification $notification): string
    {
        return $this->phone_number;
    }
}
```

## Slack 通知

### 先决条件

在发送 Slack 通知之前，您需要通过 Composer 安装 Slack 通知频道：

```shell
composer require laravel/slack-notification-channel
```

此外，您还必须为您的 Slack 工作区创建一个 [Slack 应用](https://api.slack.com/apps?new_app=1)。

如果您只需要发送通知到创建应用的同一个 Slack 工作区，您应该确保您的应用具有 `chat:write`、`chat:write.public` 和 `chat:write.customize` 权限范围。这些权限范围可以从 Slack 中的“OAuth & Permissions”应用管理标签中添加。

接下来，复制该应用的“Bot User OAuth Token”并将其放在您应用程序的 `services.php` 配置文件中的 `slack` 配置数组中。这个 token 可以在 Slack 的“OAuth & Permissions”标签中找到：

```php
'slack' => [
    'notifications' => [
        'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
        'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
    ],
],
```

#### 应用分发

如果您的应用程序将向您应用程序用户所拥有的外部 Slack 工作区发送通知，您需要通过 Slack“分发”您的应用。应用分发可以通过 Slack 中的应用“Manage Distribution”标签管理。一旦您的应用已经被分发，您可以使用 [Socialite](/docs/11/packages/socialite) 代表您的应用程序用户[获取 Slack Bot 令牌](/docs/11/packages/socialite#slack-bot-scopes)。

### 格式化 Slack 通知

如果通知支持以 Slack 消息形式发送，您应在通知类上定义 `toSlack` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Slack\SlackMessage` 实例。您可以使用 [Slack 的 Block Kit API](https://api.slack.com/block-kit) 构建丰富的通知。以下示例可在 [Slack 的 Block Kit 构建器](https://app.slack.com/block-kit-builder/T01KWS6K23Z#%7B%22blocks%22:%5B%7B%22type%22:%22header%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Invoice%20Paid%22%7D%7D,%7B%22type%22:%22context%22,%22elements%22:%5B%7B%22type%22:%22plain_text%22,%22text%22:%22Customer%20%231234%22%7D%5D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22An%20invoice%20has%20been%20paid.%22%7D,%22fields%22:%5B%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20No:*%5Cn1000%22%7D,%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20Recipient:*%5Cntaylor@laravel.com%22%7D%5D%7D,%7B%22type%22:%22divider%22%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Congratulations!%22%7D%7D%5D%7D) 中预览：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Composites\ConfirmObject;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表现形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    return (new SlackMessage)
            ->text('您的发票已付款！')
            ->headerBlock('Invoice Paid')
            ->contextBlock(function (ContextBlock $block) {
                $block->text('客户 #1234');
            })
            ->sectionBlock(function (SectionBlock $block) {
                $block->text('发票已被支付。');
                $block->field("*Invoice No:*\n1000")->markdown();
                $block->field("*Invoice Recipient:*\ntaylor@laravel.com")->markdown();
            })
            ->dividerBlock()
            ->sectionBlock(function (SectionBlock $block) {
                $block->text('恭喜！');
            });
}
```

### Slack 交互性

Slack 的 Block Kit 通知系统提供了强大的功能来[处理用户交互](https://api.slack.com/interactivity/handling)。要使用这些功能，您的 Slack 应用应该启用“Interactivity”并配置指向您应用程序提供的 URL 的“Request URL”。这些设置可以在 Slack 中的应用“Interactivity & Shortcuts”管理标签中管理。

在以下示例中，这使用了 `actionsBlock` 方法，Slack 将向您的“Request URL”发送一个包含点击按钮的 Slack 用户、点击按钮的 ID 等信息的 `POST` 请求。然后您的应用可以根据有效负载确定要采取的操作。您还应该[验证请求](https://api.slack.com/authentication/verifying-requests-from-slack)是由 Slack 发出的：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表现形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    return (new SlackMessage)
            ->text('您的发票已付款！')
            ->headerBlock('Invoice Paid')
            ->contextBlock(function (ContextBlock $block) {
                $block->text('客户 #1234');
            })
            ->sectionBlock(function (SectionBlock $block) {
                $block->text('发票已被支付。');
            })
            ->actionsBlock(function (ActionsBlock $block) {
                 // ID 默认为 "button_acknowledge_invoice"...
                $block->button('确认发票')->primary();

                // 手动配置 ID...
                $block->button('否认')->danger()->id('deny_invoice');
            });
}
```

#### 确认弹窗

如果您希望用户在执行操作之前需要确认，您可以在定义按钮时调用 `confirm` 方法。`confirm` 方法接受一条消息和一个闭包，闭包会接收一个 `ConfirmObject` 实例：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Composites\ConfirmObject;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表现形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    return (new SlackMessage)
            ->text('您的发票已付款！')
            ->headerBlock('Invoice Paid')
            ->contextBlock(function (ContextBlock $block) {
                $block->text('客户 #1234');
            })
            ->sectionBlock(function (SectionBlock $block) {
                $block->text('发票已被支付。');
            })
            ->actionsBlock(function (ActionsBlock $block) {
                $block->button('确认发票')
                    ->primary()
                    ->confirm(
                        '确认支付并发送感谢邮件？',
                        function (ConfirmObject $dialog) {
                            $dialog->confirm('是');
                            $dialog->deny('否');
                        }
                    );
            });
}
```

#### 检查 Slack Blocks

如果您想快速检查一下您构建的 blocks，您可以在 `SlackMessage` 实例上调用 `dd` 方法。`dd` 方法将生成并丢弃一个 URL 到 Slack 的 [Block Kit Builder](https://app.slack.com/block-kit-builder/)，该工具在您的浏览器中显示有效负载和通知预览。您可以将 `true` 传递给 `dd` 方法以丢弃原始有效负载：

```php
return (new SlackMessage)
        ->text('您的发票已付款！')
        ->headerBlock('Invoice Paid')
        ->dd();
```

### Slack 通知的路由

要将 Slack 通知定向到正确的 Slack 团队和频道，可以在你的可通知模型上定义一个`routeNotificationForSlack`方法。此方法可以返回以下三种值之一：

- `null` - 延迟路由到通知本身配置的频道。在构建你的`SlackMessage`时可以使用`to`方法来在通知中配置频道。
- 一个指定要发送通知到的 Slack 频道的字符串，例如`#support-channel`。
- 一个`SlackRoute`实例，它允许你指定一个 OAuth token 和频道名称，例如`SlackRoute::make($this->slack_channel, $this->slack_token)`。这种方法应该用于向外部工作空间发送通知。

例如，从`routeNotificationForSlack`方法返回`#support-channel`将会将通知发送到与应用程序的`services.php`配置文件中的 Bot User OAuth token 相关联的工作空间的`#support-channel`频道：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为Slack频道路由通知。
     */
    public function routeNotificationForSlack(Notification $notification): mixed
    {
        return '#support-channel';
    }
}
```

### 通知外部 Slack 工作空间

[!NOTE]

> 在向外部 Slack 工作空间发送通知之前，你的 Slack 应用必须被[分发](#slack-app-distribution)。

当然，你经常会想要将通知发送到你应用程序用户拥有的 Slack 工作空间。要做到这一点，你首先需要为用户获取一个 Slack OAuth token。幸运的是，[Laravel Socialite](/docs/11/packages/socialite)包括了一个 Slack 驱动程序，它将允许你轻松地通过 Slack 认证你应用程序的用户并[获取一个 bot token](/docs/11/packages/socialite#slack-bot-scopes)。

一旦你获得了 bot token 并将其存储在你的应用程序数据库中，你可以使用`SlackRoute::make`方法将一个通知路由到用户的工作空间。此外，你的应用程序很可能需要向用户提供一个机会来指定通知应该发送到哪个频道：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\SlackRoute;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为Slack频道路由通知。
     */
    public function routeNotificationForSlack(Notification $notification): mixed
    {
        return SlackRoute::make($this->slack_channel, $this->slack_token);
    }
}
```

### 本地化通知

Laravel 允许你在除当前 HTTP 请求的语言环境外的语言环境中发送通知，并且即使通知入队，也会记住这种语言环境。

为了实现这一点，`Illuminate\Notifications\Notification`类提供了一个`locale`方法来设置期望的语言。当评估通知时，应用程序将切换到这个语言环境，然后在评估完成后返回到之前的语言环境：

```php
$user->notify((new InvoicePaid($invoice))->locale('es'));
```

也可以通过`Notification` facade 实现对多个可通知实体的本地化：

```php
Notification::locale('es')->send(
    $users, new InvoicePaid($invoice)
);
```

### 用户首选的语言环境

有时，应用程序会存储每个用户的首选语言环境。通过在你的可通知模型上实现`HasLocalePreference`合同，你可以指导 Laravel 使用这个存储的语言环境在发送通知时：

```php
use Illuminate\Contracts\Translation\HasLocalePreference;

class User extends Model implements HasLocalePreference
{
    /**
     * 获取用户的首选语言环境。
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }
}
```

一旦你实现了接口，Laravel 将自动使用首选的语言环境在向模型发送通知和 Mailable 时。因此，使用这个接口时无需调用`locale`方法：

```php
$user->notify(new InvoicePaid($invoice));
```

### 测试

可以使用`Notification` facade 的`fake`方法来防止通知被发送。通常情况下，发送通知与你实际测试的代码无关。很可能只需简单地断言 Laravel 是否被指示发送指定的通知。

在调用`Notification` facade 的`fake`方法后，你可以断言通知是否被指示发送到用户，并且甚至可以检查通知接收的数据：

```php tab=Pest
<?php

use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\Notification;

test('orders can be shipped', function () {
    Notification::fake();

    // Perform order shipping...

    // Assert that no notifications were sent...
    Notification::assertNothingSent();

    // Assert a notification was sent to the given users...
    Notification::assertSentTo(
        [$user], OrderShipped::class
    );

    // Assert a notification was not sent...
    Notification::assertNotSentTo(
        [$user], AnotherNotification::class
    );

    // Assert that a given number of notifications were sent...
    Notification::assertCount(3);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped(): void
    {
        Notification::fake();

        // Perform order shipping...

        // Assert that no notifications were sent...
        Notification::assertNothingSent();

        // Assert a notification was sent to the given users...
        Notification::assertSentTo(
            [$user], OrderShipped::class
        );

        // Assert a notification was not sent...
        Notification::assertNotSentTo(
            [$user], AnotherNotification::class
        );

        // Assert that a given number of notifications were sent...
        Notification::assertCount(3);
    }
}
```

你可以向`assertSentTo`或`assertNotSentTo`方法传递一个闭包，以断言是否发送了通过特定的"真实测试"的通知。如果至少有一个通知通过了给定的真实测试，那么断言将会成功：

```php
Notification::assertSentTo(
    $user,
    function (OrderShipped $notification, array $channels) use ($order) {
        return $notification->order->id === $order->id;
    }
);
```

#### 按需通知

如果你正在测试的代码发送了[按需通知](#on-demand-notifications)，你可以通过`assertSentOnDemand`方法测试按需通知是否已发送：

```php
Notification::assertSentOnDemand(OrderShipped::class);
```

通过将闭包作为第二个参数传递给`assertSentOnDemand`方法，你可以确定按需通知是否被发送到了正确的"路由"地址：

```php
Notification::assertSentOnDemand(
    OrderShipped::class,
    function (OrderShipped $notification, array $channels, object $notifiable) use ($user) {
        return $notifiable->routes['mail'] === $user->email;
    }
);
```

## 通知事件

#### 通知发送事件

当一个通知发送时，通知系统会分发`Illuminate\Notifications\Events\NotificationSending`事件。这包含了"可通知"实体和通知实例本身。你可以为此事件创建[事件监听器](/docs/11/digging-deeper/events)：

```php
use Illuminate\Notifications\Events\NotificationSending;

class CheckNotificationStatus
{
    /**
     * 处理给定的事件。
     */
    public function handle(NotificationSending $event): void
    {
        // ...
    }
}
```

如果`NotificationSending`事件的事件监听器从其`handle`方法返回`false`，则不会发送通知：

```php
/**
 * 处理给定的事件。
 */
public function handle(NotificationSending $event): bool
{
    return false;
}
```

在事件监听器中，你可以访问事件上的`notifiable`、`notification`和`channel`属性以了解更多关于通知接收者或通知本身的信息：

```php
/**
 * 处理给定的事件。
 */
public function handle(NotificationSending $event): void
{
    // $event->channel
    // $event->notifiable
    // $event->notification
}
```

### 通知发送事件

当一个通知被发送时，`Illuminate\Notifications\Events\NotificationSent` 事件会被通知系统触发。事件包含了“通知对象”实体和通知实例本身。你可以在你的应用中为这个事件创建 [事件监听器](/docs/11/digging-deeper/events)：

```php
use Illuminate\Notifications\Events\NotificationSent;

class LogNotification
{
    /**
     * Handle the given event.
     */
    public function handle(NotificationSending $event): void
    {
        // ...
    }
}
```

在事件监听器中，你可以访问事件上的 `notifiable`、`notification`、`channel` 和 `response` 属性来了解有关通知接收者或通知本身的更多信息：

```php
/**
 * Handle the given event.
 */
public function handle(NotificationSent $event): void
{
    // $event->channel
    // $event->notifiable
    // $event->notification
    // $event->response
}
```

### 自定义通知通道

Laravel 带有少数几个通知通道，但你可能想编写自己的驱动程序通过其他通道发送通知。Laravel 使得这个过程变得简单。首先，定义一个包含 `send` 方法的类。该方法应接收两个参数：`$notifiable` 和 `$notification`。

在 `send` 方法内部，你可以调用通知上的方法来检索你的通道理解的消息对象，然后将通知发送给 `$notifiable` 实例，具体方式由你自己决定：

```php
<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class VoiceChannel
{
    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $message = $notification->toVoice($notifiable);

        // Send notification to the $notifiable instance...
    }
}
```

一旦你的通知通道类被定义，你可以从任何通知的 `via` 方法返回类名。在这个例子中，你的通知的 `toVoice` 方法可以返回任何你选择用来代表语音消息的对象。例如，你可能会定义自己的 `VoiceMessage` 类来表示这些消息：

```php
<?php

namespace App\Notifications;

use App\Notifications\Messages\VoiceMessage;
use App\Notifications\VoiceChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification
{
    use Queueable;

    /**
     * Get the notification channels.
     */
    public function via(object $notifiable): string
    {
        return VoiceChannel::class;
    }

    /**
     * Get the voice representation of the notification.
     */
    public function toVoice(object $notifiable): VoiceMessage
    {
        // ...
    }
}
```
