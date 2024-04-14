---
title: Laravel 入门套件
---

# 入门套件

[[toc]]

## 简介

为了让您在构建新的 Laravel 应用程序时能够快速启动，我们很高兴提供认证和应用程序入门套件。这些套件会自动为您的应用程序提供注册和认证应用程序用户所需的路由、控制器和视图。

虽然我们欢迎您使用这些入门套件，但它们并非必需。您完全可以通过简单地安装一个全新的 Laravel 来从头开始构建您自己的应用程序。无论哪种方式，我们都知道您将构建出一些伟大的作品！

## Laravel Breeze

[Laravel Breeze](https://github.com/laravel/breeze) 是 Laravel 所有[认证功能](/docs/11/security/authentication)的最小、简单实现，包括登录、注册、密码重置、电子邮件验证和密码确认。此外，Breeze 还包括一个简单的“个人资料”页面，用户可以在其中更新他们的姓名、电子邮件地址和密码。

Laravel Breeze 的默认视图层由简单的 [Blade 模板](/docs/11/basics/blade) 组成，使用 [Tailwind CSS](https://tailwindcss.com) 进行样式设计。此外，Breeze 提供了基于 [Livewire](https://livewire.laravel.com) 或 [Inertia](https://inertiajs.com) 的脚手架选项，可选择使用 Vue 或 React 进行 Inertia 基础脚手架。

![Breeze 注册页面](https://laravel.com/img/docs/breeze-register.png)

#### Laravel Bootcamp

如果您是 Laravel 的新手，请随时跳入 [Laravel Bootcamp](https://bootcamp.laravel.com)。Laravel Bootcamp 将引导您使用 Breeze 构建第一个 Laravel 应用程序。这是了解 Laravel 和 Breeze 所提供的一切的绝佳方式。

### 安装

首先，您应该[创建一个新的 Laravel 应用程序](/docs/11/getting-started/installation)。如果您使用 [Laravel 安装器](/docs/11/getting-started/installation#creating-a-laravel-project) 创建应用程序，将在安装过程中提示您安装 Laravel Breeze。否则，您将需要按照下面的手动安装说明进行操作。

如果您已经创建了一个没有入门套件的新 Laravel 应用程序，您可以使用 Composer 手动安装 Laravel Breeze：

```shell
composer require laravel/breeze --dev
```

在 Composer 安装了 Laravel Breeze 包之后，您应该运行 `breeze:install` Artisan 命令。此命令将认证视图、路由、控制器和其他资源发布到您的应用程序。Laravel Breeze 将所有代码发布到您的应用程序中，以便您完全控制并查看其功能和实现。

`breeze:install` 命令将提示您选择首选的前端堆栈和测试框架：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

### Breeze 和 Blade

Breeze 的默认“堆栈”是 Blade 堆栈，它使用简单的 [Blade 模板](/docs/11/basics/blade) 来渲染应用程序的前端。可以通过调用 `breeze:install` 命令并选择 Blade 前端堆栈来安装 Blade 堆栈。在安装 Breeze 的脚手架之后，您还应该编译应用程序的前端资产：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

接下来，您可以在 Web 浏览器中导航到应用程序的 `/login` 或 `/register` URL。Breeze 的所有路由都定义在 `routes/auth.php` 文件中。

> [!NOTE]
> 要了解有关编译应用程序 CSS 和 JavaScript 的更多信息，请查看 Laravel 的 [Vite 文档](/docs/11/basics/vite#running-vite)。

### Breeze 和 Livewire

Laravel Breeze 还提供了 [Livewire](https://livewire.laravel.com) 脚手架。Livewire 是一种使用纯 PHP 构建动态、响应式前端 UI 的强大方式。

对于主要使用 Blade 模板的团队来说，Livewire 是寻找 Vue 和 React 这样的 JavaScript 驱动 SPA 框架的简单替代方案的绝佳选择。

要使用 Livewire 堆栈，您可以在执行 `breeze:install` Artisan 命令时选择 Livewire 前端堆栈。安装 Breeze 的脚手架后，您应该运行数据库迁移：

```shell
php artisan breeze:install

php artisan migrate
```

### Breeze 和 React / Vue

Laravel Breeze 还通过 [Inertia](https://inertiajs.com) 前端实现提供了 React 和 Vue 脚手架。Inertia 允许您使用经典的服务器端路由和控制器构建现代的单页 React 和 Vue 应用程序。

Inertia 让您可以在构建前端时充分享受 React 和 Vue 的前端强大功能，并结合 Laravel 的令人难以置信的后端生产力和 [Vite](https://vitejs.dev) 的闪电般快速编译。要使用 Inertia 堆栈，您可以在执行 `breeze:install` Artisan 命令时选择 Vue 或 React 前端堆栈。

选择 Vue 或 React 前端堆栈时，Breeze 安装程序还将提示您确定是否希望 [Inertia SSR](https://inertiajs.com/server-side-rendering) 或 TypeScript 支持。安装 Breeze 的脚手架后，您还应该编译应用程序的前端资产：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

接下来，您可以在 Web 浏览器中导航到应用程序的 `/login` 或 `/register` URL。Breeze 的所有路由都定义在 `routes/auth.php` 文件中。

### Breeze 和 Next.js / API

Laravel Breeze 还可以脚手架一个准备好的认证 API，以认证现代 JavaScript 应用程序，如由 [Next](https://nextjs.org)、[Nuxt](https://nuxt.com) 等驱动的应用程序。要开始，请在执行 `breeze:install` Artisan 命令时选择 API 堆栈作为您想要的堆栈：

```shell
php artisan breeze:install

php artisan migrate
```

在安装期间，Breeze 将向您的应用程序的 `.env` 文件添加一个 `FRONTEND_URL` 环境变量。此 URL 应该是您的 JavaScript 应用程序的 URL。在本地开发期间，这通常是 `http://localhost:3000`。此外，您应该确保您的 `APP_URL` 设置为 `http://localhost:8000`，这是 `serve` Artisan 命令使用的默认 URL。

#### Next.js 参考实现

最后，您已准备好将此后端与您选择的前端配对。Breeze 前端的 Next 参考实现[可在 GitHub 上找到](https://github.com/laravel/breeze-next)。此前端由 Laravel 维护，并包含与 Breeze 提供的传统 Blade 和 Inertia 堆栈相同的用户界面。

## Laravel Jetstream

虽然 Laravel Breeze 为构建 Laravel 应用程序提供了一个简单和最小的起点，Jetstream 则通过更健壮的功能和额外的前端技术堆栈增强了该功能。**对于刚接触 Laravel 的新手来说，我们建议在转向 Laravel Jetstream 之前先学习 Laravel Breeze。**

Jetstream 为 Laravel 提供了精美设计的应用程序脚手架，并包括登录、注册、电子邮件验证、双因素认证、会话管理、通过 Laravel Sanctum 提供的 API 支持，以及可选的团队管理。Jetstream 使用 [Tailwind CSS](https://tailwindcss.com) 设计，并提供基于 [Livewire](https://livewire.laravel.com) 或 [Inertia](https://inertiajs.com) 的前端脚手架选择。

有关安装 Laravel Jetstream 的完整文档可以在[官方 Jetstream 文档](https://jetstream.laravel.com)中找到。
