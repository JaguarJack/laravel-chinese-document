---
title: Laravel 贡献指南
---

# 贡献指南

[[toc]]

## Bug 报告

为了鼓励积极的合作，Laravel 强烈鼓励提交 pull 请求，而不仅仅是 bug 报告。只有当 pull 请求被标记为“准备审查”（不处于“草稿”状态）并且所有新功能的测试都通过时，才会进行审查。长时间处于“草稿”状态的非活跃 pull 请求将在几天后被关闭。

然而，如果您提交了一个 bug 报告，您的问题应该包含一个标题和清晰的问题描述。您还应该包括尽可能多的相关信息和一个演示问题的代码示例。bug 报告的目标是让您自己和他人更容易复现 bug 并开发出修复方案。

记住，创建 bug 报告是希望其他遇到相同问题的人能够与您合作解决这个问题。不要期望 bug 报告会自动看到任何活动，或者其他人会立即修复它。创建 bug 报告的目的是帮助您自己和他人开始解决问题的路径。如果您想参与，您可以通过修复[我们问题追踪器中列出的任何 bug](https://github.com/issues?q=is%3Aopen+is%3Aissue+label%3Abug+user%3Alaravel) 来帮忙。您必须通过 GitHub 认证才能查看 Laravel 的所有问题。

如果您在使用 Laravel 时注意到不当的 DocBlock、PHPStan 或 IDE 警告，请不要创建 GitHub 问题。相反，请提交一个 pull 请求来修复问题。

Laravel 的源代码在 GitHub 上管理，每个 Laravel 项目都有自己的仓库：

- [Laravel 应用](https://github.com/laravel/laravel)
- [Laravel Art](https://github.com/laravel/art)
- [Laravel 文档](https://github.com/laravel/docs)
- [Laravel Dusk](https://github.com/laravel/dusk)
- [Laravel Cashier Stripe](https://github.com/laravel/cashier)
- [Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle)
- [Laravel Echo](https://github.com/laravel/echo)
- [Laravel Envoy](https://github.com/laravel/envoy)
- [Laravel Folio](https://github.com/laravel/folio)
- [Laravel 框架](https://github.com/laravel/framework)
- [Laravel Homestead](https://github.com/laravel/homestead)
- [Laravel Homestead 构建脚本](https://github.com/laravel/settler)
- [Laravel Horizon](https://github.com/laravel/horizon)
- [Laravel Jetstream](https://github.com/laravel/jetstream)
- [Laravel Passport](https://github.com/laravel/passport)
- [Laravel Pennant](https://github.com/laravel/pennant)
- [Laravel Pint](https://github.com/laravel/pint)
- [Laravel Prompts](https://github.com/laravel/prompts)
- [Laravel Reverb](https://github.com/laravel/reverb)
- [Laravel Sail](https://github.com/laravel/sail)
- [Laravel Sanctum](https://github.com/laravel/sanctum)
- [Laravel Scout](https://github.com/laravel/scout)
- [Laravel Socialite](https://github.com/laravel/socialite)
- [Laravel Telescope](https://github.com/laravel/telescope)
- [Laravel 网站](https://github.com/laravel/laravel.com-next)

## 支持问题

Laravel 的 GitHub 问题追踪器不旨在提供 Laravel 帮助或支持。相反，请使用以下渠道之一：

- [GitHub 讨论](https://github.com/laravel/framework/discussions)
- [Laracasts 论坛](https://laracasts.com/discuss)
- [Laravel.io 论坛](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

## 核心开发讨论

您可以在 Laravel 框架仓库的 [GitHub 讨论板](https://github.com/laravel/framework/discussions)中提出新功能或现有 Laravel 行为的改进。如果您提出一个新功能，请愿意实现至少一些完成该功能所需的代码。

关于 bug、新功能和现有功能的实现的非正式讨论发生在 [Laravel Discord 服务器](https://discord.gg/laravel)的 `#internals` 频道。Laravel 的维护者 Taylor Otwell 通常在工作日的 8am-5pm（UTC-06:00 或 America/Chicago）出现在频道中，并且在其他时间偶尔出现在频道中。

## 选择哪个分支？

**所有** bug 修复都应该发送到支持 bug 修复的最新版本（当前为 `11.x`）。Bug 修复**永远不应该**发送到 `master` 分支，除非它们修复了仅在即将发布的版本中存在的功能。

**次要**功能，如果与当前版本**完全向后兼容**，可以发送到最新的稳定分支（当前为 `11.x`）。

**主要**新功能或具有破坏性变更的功能应始终发送到 `master` 分支，其中包含即将发布的版本。

## 编译后的资源

如果您提交的更改会影响编译后的文件，例如 `laravel/laravel` 仓库中的 `resources/css` 或 `resources/js` 中的大多数文件，请不要提交编译后的文件。由于它们的大小很大，维护者无法实际审查它们。这可能被用作将恶意代码注入 Laravel 的方式。为了防御性地防止这种情况，所有编译后的文件都将由 Laravel 维护者生成并提交。

## 安全漏洞

如果您发现 Laravel 中存在安全漏洞，请通过电子邮件发送给 Taylor Otwell（<a href="mailto:taylor@laravel.com">taylor@laravel.com</a>）。所有安全漏洞将被迅速解决。

## 编码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码标准和 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载标准。

### PHPDoc

以下是一个有效的 Laravel 文档块示例。请注意，`@param` 属性后面跟着两个空格，参数类型，再跟着两个空格，最后是变量名：

```php
/**
 * Register a binding with the container.
 *
 * @param  string|array  $abstract
 * @param  \Closure|string|null  $concrete
 * @param  bool  $shared
 * @return void
 *
 * @throws \Exception
 */
public function bind($abstract, $concrete = null, $shared = false)
{
    // ...
}
```

当 `@param` 或 `@return` 属性由于使用了原生类型而变得多余时，它们可以被移除：

```php
/**
 * Execute the job.
 */
public function handle(AudioProcessor $processor): void
{
    //
}
```

然而，当原生类型是泛型时，请通过使用 `@param` 或 `@return` 属性指定泛型类型：

```php
/**
 * Get the attachments for the message.
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

### StyleCI

如果您的代码风格不完美也不用担心！[StyleCI](https://styleci.io/) 将在 pull 请求合并后自动将任何风格修复合并到 Laravel 仓库中。这使我们能够专注于贡献的内容而不是代码风格。

## 行为守则

Laravel 的行为守则源自 Ruby 的行为守则。任何行为守则的违规行为都可以向 Taylor Otwell（taylor@laravel.com）报告：

- 参与者将对反对的观点保持宽容。
- 参与者必须确保他们的语言和行为不包含人身攻击和贬低性的个人评论。
- 在解释他人的言行时，参与者应始终假设良好的意图。
- 可以合理认为是骚扰的行为将不被容忍。
