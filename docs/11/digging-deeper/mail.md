---
title: Laravel 邮件
---

# 邮件

[[toc]]

# 介绍

发送电子邮件无需复杂。Laravel 提供了一个干净、简洁的电子邮件 API，它是由流行的 [Symfony Mailer](https://symfony.com/doc/7.0/mailer.html) 组件提供支持的。Laravel 和 Symfony Mailer 为通过 SMTP、Mailgun、Postmark、Amazon SES 和 `sendmail` 发送电子邮件提供了驱动程序，让您快速开始使用本地或云服务发送邮件。

### 配置

Laravel 的电子邮件服务可以通过应用程序的 `config/mail.php` 配置文件进行配置。该文件中配置的每个邮件发送器可以拥有它自己独特的配置，甚至是独特的“传输”，允许您的应用程序使用不同的电子邮件服务发送特定的电子邮件消息。例如，您的应用程序可能使用 Postmark 发送事务性电子邮件，同时使用 Amazon SES 发送大量电子邮件。

在您的 `mail` 配置文件中，您将找到一个 `mailers` 配置数组。这个数组包含了 Laravel 支持的每个主要邮件驱动程序/传输的示例配置条目，而 `default` 配置值决定了当应用程序需要发送电子邮件消息时，默认使用哪个邮件发送器。

### 驱动/传输的先决条件

基于 API 的驱动程序，如 Mailgun、Postmark 和 MailerSend，通常比通过 SMTP 服务器发送邮件更简单、更快。我们建议您尽可能使用这些驱动程序之一。

#### Mailgun 驱动程序

要使用 Mailgun 驱动程序，请通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，在您应用程序的 `config/mail.php` 配置文件中将 `default` 选项设置为 `mailgun`，并将以下配置数组添加到您的 `mailers` 数组中：

```php
'mailgun' => [
    'transport' => 'mailgun',
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

配置应用程序的默认邮件发送器后，在您的 `config/services.php` 配置文件中添加以下选项：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    'scheme' => 'https',
],
```

如果您没有使用美国 [Mailgun 地区](https://documentation.mailgun.com/en/latest/api-intro.html#mailgun-regions)，您可以在 `services` 配置文件中定义您地区的端点：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.eu.mailgun.net'),
    'scheme' => 'https',
],
```

#### Postmark 驱动程序

要使用 Postmark 驱动程序，请通过 Composer 安装 Symfony 的 Postmark Mailer 传输：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

接下来，在您应用程序的 `config/mail.php` 配置文件中将 `default` 选项设置为 `postmark`。配置应用程序的默认邮件发送器后，请确保您的 `config/services.php` 配置文件包含以下选项：

```php
'postmark' => [
    'token' => env('POSTMARK_TOKEN'),
],
```

如果您希望指定给定邮件发送器应该使用的 Postmark 消息流，您可以在邮件发送器的配置数组中添加 `message_stream_id` 配置选项。此配置数组可以在应用程序的 `config/mail.php` 配置文件中找到：

```php
'postmark' => [
    'transport' => 'postmark',
    'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

这样您还可以设置多个 Postmark 邮件发送器，使用不同的消息流。

#### SES 驱动程序

要使用 Amazon SES 驱动程序，您必须首先安装 Amazon AWS SDK for PHP。您可以通过 Composer 包管理器安装此库：

```shell
composer require aws/aws-sdk-php
```

接下来，在 `config/mail.php` 配置文件中将 `default` 选项设置为 `ses`，并确认您的 `config/services.php` 配置文件包含以下选项：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
],
```

要通过会话令牌使用 AWS [临时凭证](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，您可以在应用程序的 SES 配置中添加一个 `token` 键：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'token' => env('AWS_SESSION_TOKEN'),
],
```

要与 SES 的[订阅管理功能](https://docs.aws.amazon.com/ses/latest/dg/sending-email-subscription-management.html)交互，您可以在邮件消息的 [`headers`](#headers) 方法返回的数组中返回 `X-Ses-List-Management-Options` 头信息：

```php
/**
 * 获取消息头信息。
 */
public function headers(): Headers
{
    return new Headers(
        text: [
            'X-Ses-List-Management-Options' => 'contactListName=MyContactList;topicName=MyTopic',
        ],
    );
}
```

如果您希望定义 [其他选项](https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-sesv2-2019-09-27.html#sendemail)，这些选项会在发送电子邮件时被 Laravel 传递给 AWS SDK 的 `SendEmail` 方法，请在您的 `ses` 配置中定义一个 `options` 数组：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'options' => [
        'ConfigurationSetName' => 'MyConfigurationSet',
        'EmailTags' => [
            ['Name' => 'foo', 'Value' => 'bar'],
        ],
    ],
],
```

#### MailerSend 驱动程序

[MailerSend](https://www.mailersend.com/) 是一个事务性电子邮件和 SMS 服务，为 Laravel 维护了自己的 API 基础邮件驱动程序。包含该驱动程序的包可以通过 Composer 包管理器安装：

```shell
composer require mailersend/laravel-driver
```

包安装完成后，将 `MAILERSEND_API_KEY` 环境变量添加到应用程序的 `.env` 文件中。另外，应该将 `MAIL_MAILER` 环境变量定义为 `mailersend`：

```shell
MAIL_MAILER=mailersend
MAIL_FROM_ADDRESS=app@yourdomain.com
MAIL_FROM_NAME="App Name"

MAILERSEND_API_KEY=your-api-key
```

要了解更多关于 MailerSend 的信息，包括如何使用托管模板，请查看 [MailerSend 驱动程序文档](https://github.com/mailersend/mailersend-laravel-driver#usage)。

### 故障转移配置

有时，您配置用来发送应用程序邮件的外部服务可能会宕机。在这些情况下，定义一个或多个备份邮件递送配置可能会很有用，当您的主要递送驱动程序宕机时，这些配置将被使用。

要做到这一点，您应该在应用程序的 `mail` 配置文件中定义一个使用 `failover` 传输的邮件发送器。您应用程序的 `failover` 邮件发送器的配置数组应包含一个 `mailers` 数组，该数组引用配置的邮件发送器的选择顺序：

```php
'mailers' => [
    'failover' => [
        'transport' => 'failover',
        'mailers' => [
            'postmark',
            'mailgun',
            'sendmail',
        ],
    ],

    // ...
],
```

一旦定义了故障转移邮件发送器，您应该设置此邮件发送器作为应用程序默认使用的邮件发送器，方法是在应用程序的 `mail` 配置文件中指定其名称作为 `default` 配置键的值：

```php
'default' => env('MAIL_MAILER', 'failover'),
```

````markdown
### 循环轮询配置

`roundrobin`传输允许您在多个邮件程序之间分配邮件工作负载。要开始，请在应用程序的`mail`配置文件中定义一个使用`roundrobin`传输的邮件程序。您应用程序的`roundrobin`邮件程序的配置数组应包含一个`mailers`数组，其中引用了应该用于传递的已配置邮件程序：

```php
'mailers' => [
    'roundrobin' => [
        'transport' => 'roundrobin',
        'mailers' => [
            'ses',
            'postmark',
        ],
    ],

    // ...
],
```
````

定义您的循环轮询邮件程序后，您应该将此邮件程序设置为应用程序默认使用的邮件程序，方法是在您的应用程序的`mail`配置文件中将其名称指定为`default`配置键的值：

```php
'default' => env('MAIL_MAILER', 'roundrobin'),
```

循环轮询传输从配置的邮件程序列表中随机选择一个邮件程序，然后为每个后续电子邮件切换到下一个可用的邮件程序。与`failover`传输相比，旨在实现[高可用性](https://en.wikipedia.org/wiki/High_availability)，而`roundrobin`传输提供[负载平衡](<https://en.wikipedia.org/wiki/Load_balancing_(computing)>)。

## 生成 Mailables

在构建 Laravel 应用程序时，应用程序发送的每种类型的电子邮件都表示为“mailable”类。这些类存储在`app/Mail`目录中。如果您在应用程序中看不到此目录，请不要担心，因为在您使用`make:mail` Artisan 命令创建第一个 mailable 类时，它将为您生成：

```shell
php artisan make:mail OrderShipped
```

## 编写 Mailables

生成 mailable 类后，打开它以便我们可以探索其内容。mailable 类配置在多个方法中完成，包括`envelope`、`content`和`attachments`方法。

`envelope`方法返回一个`Illuminate\Mail\Mailables\Envelope`对象，用于定义消息的主题和有时的收件人。`content`方法返回一个`Illuminate\Mail\Mailables\Content`对象，用于定义将用于生成消息内容的[Blade 模板](/docs/11/basics/blade)。

### 配置发件人

#### 使用信封

首先，我们来探讨配置电子邮件的发件人。或者换句话说，谁将是电子邮件的“发件人”。有两种方法可以配置发件人。首先，您可以在消息的信封上指定“发件人”地址：

```php
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Get the message envelope.
 */
public function envelope(): Envelope
{
    return new Envelope(
        from: new Address('jeffrey@example.com', 'Jeffrey Way'),
        subject: 'Order Shipped',
    );
}
```

如果您愿意，您还可以指定`replyTo`地址：

```php
return new Envelope(
    from: new Address('jeffrey@example.com', 'Jeffrey Way'),
    replyTo: [
        new Address('taylor@example.com', 'Taylor Otwell'),
    ],
    subject: 'Order Shipped',
);
```

#### 使用全局`from`地址

然而，如果您的应用程序对所有电子邮件使用相同的“发件人”地址，则在生成的每个 mailable 类中添加它会变得很麻烦。相反，您可以在`config/mail.php`配置文件中指定全局“发件人”地址。如果没有在 mailable 类中指定其他“发件人”地址，这个地址将被使用：

```php
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

此外，您还可以在`config/mail.php`配置文件中定义全局“回复到”地址：

```php
'reply_to' => ['address' => 'example@example.com', 'name' => 'App Name'],
```

### 配置视图

在 mailable 类的`content`方法中，您可以定义`view`，或者在呈现电子邮件内容时应使用哪个模板。由于每封电子邮件通常使用[Blade 模板](/docs/11/basics/blade)呈现其内容，因此在构建电子邮件的 HTML 时，您可以充分利用 Blade 模板引擎的功能和方便性：

```php
/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
    );
}
```

> [!NOTE]  
> 您可能希望创建一个`resources/views/emails`目录来存放所有电子邮件模板; 但是，您可以在`resources/views`目录中的任何地方自由放置它们。

#### 纯文本电子邮件

如果您想定义电子邮件的纯文本版本，您可以在创建消息的`Content`定义时指定纯文本模板。与`view`参数一样，`text`参数应该是一个模板名称，将用于呈现电子邮件的内容。您可以自由定义消息的 HTML 和纯文本版本：

```php
/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
        text: 'mail.orders.shipped-text'
    );
}
```

为了清晰起见，`html`参数可以用作`view`参数的别名：

```php
return new Content(
    html: 'mail.orders.shipped',
    text: 'mail.orders.shipped-text'
);
```

### 视图数据

#### 通过公共属性

通常，您需要传递一些数据到您的视图，以便在呈现电子邮件的 HTML 时使用。有两种方法可以使数据在您的视图中可用。首先，您的 mailable 类中定义的任何公共属性都会自动在视图中可用。因此，例如，您可以将数据传递到您的 mailable 类的构造函数，并将该数据设置为类中定义的公共属性：

```php
<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Order $order,
    ) {}

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
        );
    }
}
```

一旦数据被设置为一个公共属性，它就会自动在您的视图中可用，因此您可以像在 Blade 模板中访问任何其他数据一样访问它：

```html
<div>Price: {{ $order->price }}</div>
```

### 通过 `with` 参数

如果您想在将数据发送到模板之前自定义电子邮件数据的格式，您可以通过 `Content` 定义的 `with` 参数手动将数据传递给视图。通常，您仍将通过 mailable 类的构造函数传递数据；但是，您应该将这些数据设置为 `protected` 或 `private` 属性，这样数据就不会自动可用于模板：

```php
<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * 创建一个新的消息实例。
     */
    public function __construct(
        protected Order $order,
    ) {}

    /**
     * 获取消息内容定义。
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
            with: [
                'orderName' => $this->order->name,
                'orderPrice' => $this->order->price,
            ],
        );
    }
}
```

一旦数据被传递到 `with` 方法，它将自动可用于您的视图，因此您可以像访问 Blade 模板中的任何其他数据一样访问它：

```blade
<div>
    价格：{{ $orderPrice }}
</div>
```

### 附件

要向电子邮件添加附件，您需要在消息的 `attachments` 方法返回的数组中添加附件。首先，您可以通过 `Attachment` 类提供的 `fromPath` 方法提供一个文件路径来添加附件：

```php
use Illuminate\Mail\Mailables\Attachment;

/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromPath('/path/to/file'),
    ];
}
```

在向消息添加文件时，您还可以使用 `as` 和 `withMime` 方法为附件指定显示名称和/或 MIME 类型：

```php
/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromPath('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf'),
    ];
}
```

#### 从磁盘附加文件

如果您在 [文件系统磁盘](/docs/11/basics/errors)之一上存储了文件，则可以使用 `fromStorage` 附件方法将其附加到电子邮件：

```php
/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

当然，您也可以指定附件的名称和 MIME 类型：

```php
/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf'),
    ];
}
```

如果您需要指定一个不同于默认磁盘的存储磁盘，可以使用 `fromStorageDisk` 方法：

```php
/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorageDisk('s3', '/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf'),
    ];
}
```

#### 原始数据附件

如果您已经有了要嵌入到电子邮件模板中的原始图像数据字符串，可以在 `$message` 变量上调用 `embedData` 方法。调用 `embedData` 方法时，您需要提供应分配给嵌入图像的文件名：

```blade
<body>
    这是来自原始数据的图像：

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

### 可附加对象

虽然通常通过简单的字符串路径将文件附加到消息上就足够了，但在许多情况下，应用程序中的可附加实体由类表示。例如，如果您的应用程序正在将照片附加到消息上，您的应用程序可能还有一个代表该照片的 `Photo` 模型。在这种情况下，只需将 `Photo` 模型传递给 `attach` 方法，不是很方便吗？可附加对象就允许您这样做。

首先，实现 `Illuminate\Contracts\Mail\Attachable` 接口在将附加到消息的对象上。该接口规定您的类定义了一个返回 `Illuminate\Mail\Attachment` 实例的 `toMailAttachment` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Mail\Attachable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Attachment;

class Photo extends Model implements Attachable
{
    /**
     * 获取模型的可附加表示。
     */
    public function toMailAttachment(): Attachment
    {
        return Attachment::fromPath('/path/to/file');
    }
}
```

定义了可附加对象之后，您可以在构建电子邮件消息时从 `attachments` 方法返回该对象的实例：

```php
/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [$this->photo];
}
```

当然，附件数据可能存储在如亚马逊 S3 这样的远程文件存储服务上。因此，Laravel 还允许您生成来自应用程序 [文件系统磁盘](/docs/11/basics/errors)中存储的数据的附件实例：

```php
// 从默认磁盘的文件创建附件...
return Attachment::fromStorage($this->path);

// 从特定磁盘的文件创建附件...
return Attachment::fromStorageDisk('backblaze', $this->path);
```

此外，您可以通过内存中的数据创建附件实例。要做到这一点，请提供一个闭包给 `fromData` 方法。闭包应返回代表附件的原始数据：

```php
return Attachment::fromData(fn () => $this->content, 'Photo Name');
```

Laravel 还提供了其他您可以用来自定义附件的方法。例如，您可以使用 `as` 和 `withMime` 方法来自定义文件的名称和 MIME 类型：

```php
return Attachment::fromPath('/path/to/file')
        ->as('Photo Name')
        ->withMime('image/jpeg');
```

### 头部

有时您可能需要向外发的邮件附加额外的头部。例如，您可能需要设置自定义的 `Message-Id` 或其他任意文本头部。

为此，在您的 mailable 上定义一个 `headers` 方法。`headers` 方法应返回一个 `Illuminate\Mail\Mailables\Headers` 实例。此类接受 `messageId`、`references` 和 `text` 参数。当然，您可以根据您的特定消息的需要提供参数：

```php
use Illuminate\Mail\Mailables\Headers;

/**
 * 获取消息头部。
 */
public function headers(): Headers
{
    return new Headers(
        messageId: 'custom-message-id@example.com',
        references: ['previous-message@example.com'],
        text: [
            'X-Custom-Header' => 'Custom Value',
        ],
    );
}
```

### 标签和元数据

一些第三方电子邮件提供商，如 Mailgun 和 Postmark 支持消息的“标签”和“元数据”，这些可被用来对您的应用程序发送的电子邮件进行分组和跟踪。您可以通过您的 `Envelope` 定义为电子邮件消息添加标签和元数据：

```php
use Illuminate\Mail\Mailables\Envelope;

/**
 * 获取消息信封。
 *
 * @return \Illuminate\Mail\Mailables\Envelope
 */
public function envelope(): Envelope
{
    return new Envelope(
        subject: 'Order Shipped',
        tags: ['shipment'],
        metadata: [
            'order_id' => $this->order->id,
        ],
    );
}
```

如果您的应用程序使用的是 Mailgun 驱动，在 [标签](https://documentation.mailgun.com/en/latest/user_manual.html#tagging-1)和[元数据](https://documentation.mailgun.com/en/latest/user_manual.html#attaching-data-to-messages)方面的更多信息，请参阅 Mailgun 的文档。同样，如果是 Postmark，您可以查阅有关对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)支持的 Postmark 文档。

如果您的应用程序使用 Amazon SES 发送电子邮件，您应使用 `metadata` 方法为消息附加 [SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)。

### 自定义 Symfony 消息

Laravel 的邮件功能是由 Symfony Mailer 提供支持的。Laravel 允许您注册自定义回调，这些回调将在发送消息前使用 Symfony Message 实例调用。这给了您在消息发送前深度自定义消息的机会。要做到这一点，在您的 `Envelope` 定义中定义一个 `using` 参数：

```php
use Illuminate\Mail\Mailables\Envelope;
use Symfony\Component\Mime\Email;

/**
 * 获取消息信封。
 */
public function envelope(): Envelope
{
    return new Envelope(
        subject: 'Order Shipped',
        using: [
            function (Email $message) {
                // ...
            },
        ]
    );
}
```

## Markdown 邮件

Markdown 邮件允许您在 mailable 中利用[邮件通知](/docs/11/digging-deeper/notifications#mail-notifications)的预构建模板和组件。由于消息是以 Markdown 编写的，Laravel 能够为消息渲染出漂亮、响应式的 HTML 模板，同时自动生成纯文本副本。

### 生成 Markdown 邮件

要使用相应的 Markdown 模板生成 mailable，您可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=mail.orders.shipped
```

然后，在 mailable 的 `content` 方法中配置 mailable 的 `Content` 定义时，使用 `markdown` 参数而不是 `view` 参数：

```php
use Illuminate\Mail\Mailables\Content;

/**
 * 获取消息内容定义。
 */
public function content(): Content
{
    return new Content(
        markdown: 'mail.orders.shipped',
        with: [
            'url' => $this->orderUrl,
        ],
    );
}
```

### 编写 Markdown 消息

Markdown mailable 使用 Blade 组件和 Markdown 语法的结合，这样您就可以轻松地构造邮件消息，同时利用 Laravel 的预构建电子邮件 UI 组件：

```blade
<x-mail::message>
# 订单已发货

您的订单已经发货！

<x-mail::button :url="$url">
查看订单
</x-mail::button>

谢谢，<br>
{{ config('app.name') }}
</x-mail::message>
```

> [!NOTE]
> 编写 Markdown 电子邮件时不要使用过多的缩进。根据 Markdown 标准，Markdown 解析器会将缩进内容渲染为代码块。

#### 按钮组件

按钮组件渲染一个居中的按钮链接。组件接受两个参数，一个 `url` 和一个可选的 `color`。支持的颜色有 `primary`、`success` 和 `error`。您可以在消息中添加任意多个按钮组件：

```blade
<x-mail::button :url="$url" color="success">
查看订单
</x-mail::button>
```

#### 面板组件

面板组件将给定的文本块呈现在一个与消息其余部分略有不同背景颜色的面板中。这允许您将注意力吸引到给定的文本块上：

```blade
<x-mail::panel>
这是面板内容。
</x-mail::panel>
```

#### 表格组件

表格组件允许您将 Markdown 表格转换为 HTML 表格。组件接受 Markdown 表格作为其内容。支持使用默认的 Markdown 表格对齐语法进行表格列对齐：

```blade
<x-mail::table>
| Laravel       | Table         | Example  |
| ------------- |:-------------:| --------:|
| 第二列      | 居中      | $10      |
| 第三列      | 右对齐 | $20      |
</x-mail::table>
```

### 自定义组件

您可以将所有 Markdown 邮件组件导出到您自己的应用程序中进行自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资产标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

这个命令将会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 和一个 `text` 目录，每个目录都包含所有可用组件的各自表示。您可以随心所欲地自定义这些组件。

#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。您可以自定义此文件中的 CSS，并且您的样式将自动转换为 Markdown 邮件消息的 HTML 表示中的内联 CSS 样式。

如果您想为 Laravel 的 Markdown 组件构建一个完全新的主题，您可以在 `html/themes` 目录中放置一个 CSS 文件。在命名并保存 CSS 文件后，更新应用程序的 `config/mail.php` 配置文件中的 `theme` 选项以匹配您新主题的名称。

要为单个可邮寄物定制主题，您可以设置 mailable 类的 `$theme` 属性为在发送该 mailable 时应使用的主题名称。

## 发送邮件

要发送消息，请在 `Mail` [facade](/docs/11/architecture-concepts/facades)上使用 `to` 方法。 `to` 方法接受电子邮件地址、用户实例或用户集合。如果您传递一个对象或对象集合，邮件程序将自动使用它们的 `email` 和 `name` 属性在确定电子邮件收件人时，所以确保这些属性在您的对象上可用。一旦指定了收件人，您可以将 mailable 类的实例传递给 `send` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\OrderShipped;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderShipmentController extends Controller
{
    /**
     * 发送指定订单。
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 发送订单...

        Mail::to($request->user())->send(new OrderShipped($order));

        return redirect('/orders');
    }
}
```

您不限于在发送消息时仅指定“收件人”。通过将它们的相应方法链式调用在一起，您可以自由地设置“收件人”、“抄送”和“密送”：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->send(new OrderShipped($order));
```

#### 循环接收者

有时，您可能需要通过迭代收件人/电子邮件地址数组的数组向收件人列表发送 mailable。然而，由于 `to` 方法将电子邮件地址附加到 mailable 的收件人列表中，循环中的每次迭代都会再次向每个先前的收件人发送另一封电子邮件。因此，您应始终为每个收件人重新创建 mailable 实例：

```php
foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
    Mail::to($recipient)->send(new OrderShipped($order));
}
```

#### 通过指定邮件发送邮件

默认情况下，Laravel 将使用在应用程序的 `mail` 配置文件中配置为 `default` 的邮件程序发送电子邮件。但是，您可以使用 `mailer` 方法通过特定的邮件配置发送消息：

```php
Mail::mailer('postmark')
        ->to($request->user())
        ->send(new OrderShipped($order));
```

### 排队邮件

#### 排队邮件消息

由于发送电子邮件消息可能会对应用程序的响应时间产生负面影响，许多开发人员选择将电子邮件消息排入队列以进行后台发送。Laravel 使用其内置的[统一队列 API](/docs/11/digging-deeper/queues)使这变得容易。要排队发送邮件消息，您在指定收件人后使用 `Mail` facade 上的 `queue` 方法：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue(new OrderShipped($order));
```

此方法将自动处理推送作业到队列中，以便在后台发送消息。在使用此功能之前，您需要[配置队列](/docs/11/digging-deeper/queues)。

#### 延迟消息队列

如果您希望延迟交付排入队列的电子邮件消息，您可以使用 `later` 方法。作为其第一个参数，`later` 方法接受一个 `DateTime` 实例，指示何时应发送消息：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->later(now()->addMinutes(10), new OrderShipped($order));
```

#### 推送到特定队列

由于使用 `make:mail` 命令生成的所有 mailable 类都使用了 `Illuminate\Bus\Queueable` trait，因此您可以在任何 mailable 类实例上调用 `onQueue` 和 `onConnection` 方法，允许您指定消息的连接和队列名称：

```php
$message = (new OrderShipped($order))
                ->onConnection('sqs')
                ->onQueue('emails');

Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue($message);
```

#### 默认队列

如果您有总是想要排队的 mailable 类，您可以在类上实现 `ShouldQueue` 契约。现在，即使您在发送邮件时调用了 `send` 方法，mailable 仍然会被排队，因为它实现了契约：

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class OrderShipped extends Mailable implements ShouldQueue
{
    // ...
}
```

#### 排队邮件和数据库事务

当队列邮件被派发到数据库事务内部时，它们可能会在数据库事务提交之前就被队列处理。发生这种情况时，您在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果您的邮件依赖于这些模型，那么当处理发送队列邮件的作业时，可能会发生意外的错误。

如果您的队列连接的 `after_commit` 配置选项设置为 `false`，您仍可通过在发送邮件消息时调用 `afterCommit` 方法来指示特定的队列邮件应该在所有打开的数据库事务提交之后才派发：

```php
Mail::to($request->user())->send(
    (new OrderShipped($order))->afterCommit()
);
```

或者，您可以在邮件类的构造函数中调用 `afterCommit` 方法：

```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * 创建一个新的消息实例。
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解如何解决这些问题的更多信息，请查看有关 [队列作业和数据库事务](/docs/11/digging-deeper/queues#jobs-and-database-transactions) 的文档。

## 渲染邮件

有时您可能希望在不发送邮件的情况下捕获邮件的 HTML 内容。为此，您可以调用邮件的 `render` 方法。这个方法将返回邮件的评估后的 HTML 内容作为字符串：

```php
use App\Mail\InvoicePaid;
use App\Models\Invoice;

$invoice = Invoice::find(1);

return (new InvoicePaid($invoice))->render();
```

### 在浏览器中预览邮件

在设计邮件模板时，能够在浏览器中快速预览渲染后的邮件就像一个典型的 Blade 模板一样方便。因此，Laravel 允许你直接从路由闭包或控制器返回任何邮件。当邮件被返回时，它将被渲染并在浏览器中显示，让你能够在不需要将其发送到实际电子邮件地址的情况下快速预览它的设计：

```php
Route::get('/mailable', function () {
    $invoice = App\Models\Invoice::find(1);

    return new App\Mail\InvoicePaid($invoice);
});
```

## 本地化邮件

Laravel 允许您在与请求的当前语言环境不同的语言环境中发送邮件，如果邮件被队列化，它甚至会记住此语言环境。

为了实现这一点，`Mail` facade 提供了一个 `locale` 方法来设置所需的语言。当 mailable 的模板被评估时，应用程序将会改变到这个语言环境，然后在评估完成后回退到之前的语言环境：

```php
Mail::to($request->user())->locale('es')->send(
    new OrderShipped($order)
);
```

### 用户首选语言环境

有时，应用程序会存储每个用户的首选语言环境。通过在一个或多个模型上实现 `HasLocalePreference` 合同，您可以指示 Laravel 使用这个存储的语言环境来发送邮件：

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

一旦您实现了接口，Laravel 在发送邮件和通知给模型时会自动使用首选的语言环境。因此，当使用这个接口时，没有必要调用 `locale` 方法：

```php
Mail::to($request->user())->send(new OrderShipped($order));
```

## 测试邮件

#### 测试邮件内容

Laravel 提供了各种方法来检查您的邮件的结构。此外，Laravel 提供了几个方便的方法来测试您的邮件是否包含您期望的内容。这些方法包括：`assertSeeInHtml`、`assertDontSeeInHtml`、`assertSeeInOrderInHtml`、`assertSeeInText`、`assertDontSeeInText`、`assertSeeInOrderInText`、`assertHasAttachment`、`assertHasAttachedData`、`assertHasAttachmentFromStorage` 以及 `assertHasAttachmentFromStorageDisk`。

正如您所期望的，"HTML" 断言会断言您的邮件的 HTML 版本包含给定的字符串，而 "text" 断言断言邮件的纯文本版本包含给定的字符串：

```php
use App\Mail\InvoicePaid;
use App\Models\User;

it('tests mailable content', function () {
    $user = User::factory()->create();

    $mailable = new InvoicePaid($user);

    $mailable->assertFrom('jeffrey@example.com');
    $mailable->assertTo('taylor@example.com');
    $mailable->assertSeeInHtml($user->email);
    $mailable->assertSeeInHtml('Invoice Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);
    $mailable->assertSeeInText($user->email);
    $mailable->assertSeeInText($user->email);
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
});
```

```php tab=PHPUnit
use App\Mail\InvoicePaid;
use App\Models\User;

public function test_mailable_content(): void
{
    $user = User::factory()->create();

    $mailable = new InvoicePaid($user);

    $mailable->assertFrom('jeffrey@example.com');
    $mailable->assertTo('taylor@example.com');
    $mailable->assertHasCc('abigail@example.com');
    $mailable->assertHasBcc('victoria@example.com');
    $mailable->assertHasReplyTo('tyler@example.com');
    $mailable->assertHasSubject('Invoice Paid');
    $mailable->assertHasTag('example-tag');
    $mailable->assertHasMetadata('key', 'value');

    $mailable->assertSeeInHtml($user->email);
    $mailable->assertSeeInHtml('Invoice Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
}
```

#### 测试邮件发送

我们建议独立地测试您的邮件的内容和您的测试，后者断言给定的邮件是否 "发送" 给特定的用户。通常，邮件的内容与您正在测试的代码不相关，简单地断言 Laravel 被指示发送给定的邮件就足够了。

您可以使用 `Mail` facade 的 `fake` 方法来防止邮件被发送。在调用 `Mail` facade 的 `fake` 方法之后，您可以断言邮件被指示发送给用户，并甚至检查邮件接收的数据：

```php
use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;

it('tests if orders can be shipped', function () {
    Mail::fake();

    // 执行订单发货...

    // 断言没有邮件被发送...
    Mail::assertNothingSent();

    // 断言邮件已经被发送...
    Mail::assertSent(OrderShipped::class);
    // ... 更多的断言
});
```

如果你在后台队列化邮件等待发送，你应该使用 `assertQueued` 方法而不是 `assertSent`:

```php
Mail::assertQueued(OrderShipped::class);
```

您可以向 `assertSent`, `assertNotSent`, `assertQueued`, 或 `assertNotQueued` 方法传递一个闭包，以便断言一个邮件被发送通过了一个给定的“真值测试”。如果至少有一个通过给定真值测试的邮件被发送，那么断言将是成功的：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

## Mail 和本地开发

在开发发送电子邮件的应用程序时，您可能不希望实际发送邮件到活动的电子邮件地址。Laravel 提供了几种方式来在本地开发中“禁用”实际发送邮件的功能。

#### Log 驱动

`log` 邮件驱动不会发送您的邮件，而是将所有邮件消息写入您的日志文件以供检查。通常，该驱动只会在本地开发期间使用。有关根据环境配置您的应用程序的更多信息，请查看 [配置文档](/docs/11/getting-started/configuration#environment-configuration)。

#### HELO / Mailtrap / Mailpit

或者，您可以使用像 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 这样的服务，并使用 `smtp` 驱动将您的电子邮件消息发送到“哑巴”邮箱中，您可以在其中以真实的电子邮件客户端查看它们。这种方法的好处在于，它允许您在 Mailtrap 的消息查看器中实际检查最终的电子邮件。

如果您使用 [Laravel Sail](/docs/11/packages/sail)，您可以通过 [Mailpit](https://github.com/axllent/mailpit) 预览您的消息。当 Sail 活动时，您可以通过以下地址访问 Mailpit 界面：`http://localhost:8025`。

#### 使用全局 `to` 地址

最后，您可以通过调用 `Mail` facade 提供的 `alwaysTo` 方法来指定全局的 "to" 地址。通常，该方法应该在您应用程序的服务提供者之一的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Mail;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    if ($this->app->environment('local')) {
        Mail::alwaysTo('taylor@example.com');
    }
}
```

### 测试邮件发送

我们建议将邮件的内容测试与断言给定邮件已"发送"给特定用户的测试分开。通常情况下，邮件的内容与您正在测试的代码无关，简单地断言 Laravel 被指示发送指定的邮件已经足够。

您可以使用 `Mail` facade 的 `fake` 方法来防止邮件被发送。在调用 `Mail` facade 的 `fake` 方法之后，您可以断言邮件已被指示发送给用户，甚至检查邮件接收到的数据：

```php
<?php

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;

test('orders can be shipped', function () {
    Mail::fake();

    // 执行订单发货...

    // 断言没有邮件被发送...
    Mail::assertNothingSent();

    // 断言邮件已被发送...
    Mail::assertSent(OrderShipped::class);

    // 断言邮件被发送了两次...
    Mail::assertSent(OrderShipped::class, 2);

    // 断言某个邮件未被发送...
    Mail::assertNotSent(AnotherMailable::class);

    // 断言总共发送了3封邮件...
    Mail::assertSentCount(3);
});
```

如果您将邮件放入队列以便在后台发送，请使用 `assertQueued` 方法而不是 `assertSent`：

```php
Mail::assertQueued(OrderShipped::class);
Mail::assertNotQueued(OrderShipped::class);
Mail::assertNothingQueued();
Mail::assertQueuedCount(3);
```

您可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传入一个闭包函数，以便断言发送的邮件通过了指定的“真值测试”。如果至少有一封邮件通过了给定的真值测试，那么断言将视为成功：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

当调用 `Mail` facade 的断言方法时，闭包函数接收的邮件实例提供了一些有用的方法来检查邮件：

```php
Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($user) {
    return $mail->hasTo($user->email) &&
           $mail->hasCc('...') &&
           $mail->hasBcc('...') &&
           $mail->hasReplyTo('...') &&
           $mail->hasFrom('...') &&
           $mail->hasSubject('...');
});
```

邮件实例还包括几种有用的方法来检查邮件中的附件：

```php
use Illuminate\Mail\Mailables\Attachment;

Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) {
    return $mail->hasAttachment(
        Attachment::fromPath('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf')
    );
});

Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) {
    return $mail->hasAttachment(
        Attachment::fromStorageDisk('s3', '/path/to/file')
    );
});

Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($pdfData) {
    return $mail->hasAttachment(
        Attachment::fromData(fn () => $pdfData, 'name.pdf')
    );
});
```

您可能已经注意到有两种方法可以断言没有邮件被发送：`assertNotSent` 和 `assertNotQueued`。有时您可能希望断言没有邮件被发送**或**队列。为了实现这一点，您可以使用 `assertNothingOutgoing` 和 `assertNotOutgoing` 方法：

```php
Mail::assertNothingOutgoing();

Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

## 邮件和本地开发

在开发发送电子邮件的应用程序时，您可能不想实际发送电子邮件到真实的电子邮件地址。Laravel 提供了几种方法在本地开发中"禁用"实际发送邮件。

#### Log 驱动

`log` 邮件驱动会将所有邮件消息写入您的日志文件，而不是发送邮件。通常情况下，这个驱动只在本地开发中使用。有关根据环境配置您的应用程序的详细信息，请查看配置文档。

#### HELO / Mailtrap / Mailpit

或者，您可以使用像 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 的服务，搭配 `smtp` 驱动，将您的邮件消息发送到一个"虚拟邮箱"，在那里您可以在真正的电子邮件客户端中查看邮件。这种方式的好处是您可以实际在 Mailtrap 的消息查看器中检查最终的电子邮件。

如果您使用 [Laravel Sail](/docs/11/packages/sail)，可以通过 [Mailpit](https://github.com/axllent/mailpit) 预览您的消息。当 Sail 运行时，您可以在 `http://localhost:8025` 访问 Mailpit 界面。

#### 使用全局 `to` 地址

最后，您可以调用 `Mail` facade 提供的 `alwaysTo` 方法来指定一个全局 "to" 地址。通常情况下，应该从您应用程序的服务提供者之一的 `boot` 方法中调用此方法：

```php
use Illuminate\Support\Facades\Mail;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    if ($this->app->environment('local')) {
        Mail::alwaysTo('taylor@example.com');
    }
}
```

## 事件

Laravel 在发送邮件消息期间会分派两个事件。`MessageSending` 事件会在消息发送前分派，`MessageSent` 事件会在消息发送后分派。请记住，这些事件是在邮件被*发送时*分派的，而不是队列化时。您可以在应用程序内为这些事件创建事件监听器：

```php
use Illuminate\Mail\Events\MessageSending;
// use Illuminate\Mail\Events\MessageSent;

class LogMessage
{
    /**
     * 处理给定事件。
     */
    public function handle(MessageSending $event): void
    {
        // ...
    }
}
```

## 自定义传输

Laravel 包括了多种邮件传输方式；然而，您可能希望编写自己的传输来通过 Laravel 盒子外不支持的其他服务发送电子邮件。首先，定义一个扩展了 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在您的传输上实现 `doSend` 和 `__toString()` 方法：

```php
use MailchimpTransactional\ApiClient;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class MailchimpTransport extends AbstractTransport
{
    /**
     * 创建一个新的 Mailchimp 传输实例。
     */
    public function __construct(
        protected ApiClient $client,
    ) {
        parent::__construct();
    }

    /**
     * 实施文档。
     */
    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $this->client->messages->send(['message' => [
            'from_email' => $email->getFrom(),
            'to' => collect($email->getTo())->map(function (Address $email) {
                return ['email' => $email->getAddress(), 'type' => 'to'];
            })->all(),
            'subject' => $email->getSubject(),
            'text' => $email->getTextBody(),
        ]]);
    }

    /**
     * 获取传输的字符串表示。
     */
    public function __toString(): string
    {
        return 'mailchimp';
    }
}
```

定义并注册了自定义传输后，您可以通过应用程序的 `AppServiceProvider` 服务提供者的 `boot` 方法中提供的 `Mail` facade 的 `extend` 方法注册它。在传递给 `extend` 方法的闭包函数中会收到一个 `$config` 参数。这个参数将包含应用程序 `config/mail.php` 配置文件中为邮件器定义的配置数组：

```php
use App\Mail\MailchimpTransport;
use Illuminate\Support\Facades\Mail;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Mail::extend('mailchimp', function (array $config = []) {
        return new MailchimpTransport(/* ... */);
    });
}
```

定义和注册了您的自定义传输之后，您可以在应用程序的 `config/mail.php` 配置文件中创建一个利用这个新传输的邮件器定义：

```php
'mailchimp' => [
    'transport' => 'mailchimp',
    // ...
],
```

### 额外的 Symfony 传输

Laravel 包括对一些现有的 Symfony 维护的邮件传输的支持，比如 Mailgun 和 Postmark。然而，您可能希望扩展 Laravel 支持其他 Symfony 维护的传输。您可以通过 Composer 安装所需的 Symfony 邮件器并在 Laravel 中注册传输来实现这一点。例如，您可以安装并注册 "Brevo" (原 "Sendinblue") Symfony 邮件器：

```shell
composer require symfony/brevo-mailer symfony/http-client
```

安装好 Brevo 邮件器包后，您可以在应用程序的 `services` 配置文件中为您的 Brevo API 凭证添加一个条目：

```php
'brevo' => [
    'key' => 'your-api-key',
],
```

接下来，您可以使用 `Mail` facade 的 `extend` 方法在 Laravel 中注册传输。通常，这应该在服务提供者的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Mail::extend('brevo', function () {
        return (new BrevoTransportFactory)->create(
            new Dsn(
                'brevo+api',
                'default',
                config('services.brevo.key')
            )
        );
    });
}
```

一旦您的传输被注册，您可以在应用程序的 `config/mail.php` 配置文件中创建一个利用新传输的邮件器定义：

```php
'brevo' => [
    'transport' => 'brevo',
    // ...
],
```
