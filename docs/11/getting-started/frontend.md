---
title: Laravel 前端
---

# 前端

[[toc]]

## 简介

Laravel 是一个后端框架，提供了构建现代 Web 应用所需的所有功能，如[路由](/docs/11/basics/routing)、[验证](/docs/11/basics/validation)、[缓存](/docs/11/digging-deeper/cache)、[队列](/docs/11/digging-deeper/queues)、[文件存储](/docs/11/digging-deeper/filesystem)等。然而，我们认为为开发者提供一个包括构建应用前端的强大全栈体验是很重要的。

在使用 Laravel 构建应用时，有两种主要的方法来处理前端开发，您选择哪种方法取决于您是想通过利用 PHP 来构建前端，还是使用 Vue 和 React 这样的 JavaScript 框架。我们将在下面讨论这两种选项，以便您可以就应用程序的最佳前端开发方法做出明智的决定。

## 使用 PHP

### PHP 和 Blade

过去，大多数 PHP 应用程序使用简单的 HTML 模板与 PHP `echo` 语句相结合来向浏览器渲染 HTML，这些 `echo` 语句渲染在请求期间从数据库检索的数据：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，这种方法可以通过使用[视图](/docs/11/basics/views)和 [Blade](/docs/11/basics/blade) 来实现。Blade 是一种极其轻量级的模板语言，为显示数据、迭代数据等提供了便利、简短的语法：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

使用这种方式构建应用程序时，表单提交和其他页面交互通常会从服务器接收到一个全新的 HTML 文档，并且整个页面将由浏览器重新渲染。即使在今天，许多应用程序可能完全适合使用简单的 Blade 模板以这种方式构建它们的前端。

### 用户期望的增长

然而，随着用户对 Web 应用的期望成熟，许多开发者发现需要构建更动态的前端，交互感觉更加流畅。鉴于此，一些开发者选择开始使用 Vue 和 React 这样的 JavaScript 框架构建应用程序的前端。

其他人，更愿意坚持他们熟悉的后端语言，开发了允许使用他们选择的后端语言主要构建现代 Web 应用 UI 的解决方案。例如，在 [Rails](https://rubyonrails.org/) 生态系统中，这促使了诸如 [Turbo](https://turbo.hotwired.dev/)、[Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库的创建。

在 Laravel 生态系统内，使用 PHP 主要创建现代、动态前端的需求导致了 [Laravel Livewire](https://livewire.laravel.com) 和 [Alpine.js](https://alpinejs.dev/) 的诞生。

### Livewire

[Laravel Livewire](https://livewire.laravel.com) 是一个框架，用于构建感觉动态、现代和活跃的 Laravel 驱动前端，就像使用 Vue 和 React 这样的现代 JavaScript 框架构建的前端一样。

使用 Livewire 时，您将创建渲染 UI 的离散部分的 Livewire "组件"，并公开方法和数据，这些方法和数据可以从应用程序的前端调用和交互。例如，一个简单的 "Counter" 组件可能如下所示：

```php
<?php

namespace App\Http\Livewire;

use Livewire\Component;

class Counter extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
```

计数器对应的模板将如下所写：

```blade
<div>
    <button wire:click="increment">+</button>
    <h1>{{ $count }}</h1>
</div>
```

如您所见，Livewire 使您能够编写新的 HTML 属性，如 `wire:click`，这些属性将您的 Laravel 应用程序的前端和后端连接起来。此外，您可以使用简单的 Blade 表达式渲染组件的当前状态。

对许多人来说，Livewire 彻底改变了使用 Laravel 的前端开发，使他们能够在 Laravel 的舒适环境中构建现代、动态的 Web 应用。通常，使用 Livewire 的开发者还会使用 [Alpine.js](https://alpinejs.dev/) 来在前端“撒上”所需的 JavaScript，例如为了渲染对话窗口。

如果您是 Laravel 的新手，我们建议您先熟悉 [视图](/docs/11/basics/views) 和 [Blade](/docs/11/basics/blade) 的基本用法。然后，查阅官方 [Laravel Livewire 文档](https://livewire.laravel.com/docs)，了解如何通过交互式 Livewire 组件将您的应用提升到一个新的水平。

### 入门套件

如果您希望使用 PHP 和 Livewire 构建前端，您可以利用我们的 Breeze 或 Jetstream [入门套件](/docs/11/getting-started/starter-kits) 来加速应用程序的开发。这些入门套件使用 [Blade](/docs/11/basics/blade) 和 [Tailwind](https://tailwindcss.com) 为您的应用程序提供后端和前端认证脚手架，以便您可以简单地开始构建下一个伟大的想法。

## 使用 Vue / React

尽管可以使用 Laravel 和 Livewire 构建现代前端，但许多开发者仍然更喜欢利用 Vue 或 React 这样的 JavaScript 框架的力量。这使得开发者能够利用通过 NPM 可用的丰富的 JavaScript 包和工具生态系统。

然而，如果没有额外的工具，将 Laravel 与 Vue 或 React 配对会让我们需要解决各种复杂的问题，如客户端路由、数据填充和认证。客户端路由通常通过使用 [Nuxt](https://nuxt.com/) 和 [Next](https://nextjs.org/) 这样的 Vue / React 框架来简化；然而，数据填充和认证在将后端框架如 Laravel 与这些前端框架配对时仍然是复杂而繁琐的问题。

此外，开发者还需要维护两个单独的代码仓库，通常需要在两个仓库之间协调维护、发布和部署。虽然这些问题不是不可克服的，但我们不认为这是一种生产力或愉快的开发方式。

### Inertia

幸运的是，Laravel 提供了两全其美的解决方案。[Inertia](https://inertiajs.com) 桥接了您的 Laravel 应用程序和您的现代 Vue 或 React 前端之间的鸿沟，允许您使用 Vue 或 React 构建成熟的现代前端，同时利用 Laravel 路由和控制器进行路由、数据填充和认证 —— 所有这些都在单个代码仓库中。通过这种方法，您可以在不削弱任一工具能力的情况下，充分享受 Laravel 和 Vue / React 的全部力量。

在将 Inertia 安装到您的 Laravel 应用程序后，您将像往常一样编写路由和控制器。然而，从控制器返回的不是 Blade 模板，而是 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * 显示给定用户的个人资料。
     */
    public function show(string $id): Response
    {
        return Inertia::render('Users/Profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

Inertia 页面对应于 Vue 或 React 组件，通常存储在应用程序的 `resources/js/Pages` 目录中。通过 `Inertia::render` 方法给页面提供的数据将用于填充页面组件的 "props"：

```vue
<script setup>
import Layout from '@/Layouts/Authenticated.vue'
import { Head } from '@inertiajs/vue3'

const props = defineProps(['user'])
</script>

<template>
  <Head title="User Profile" />

  <Layout>
    <template #header>
      <h2 class="text-xl font-semibold leading-tight text-gray-800">个人资料</h2>
    </template>

    <div class="py-12">你好, {{ user.name }}</div>
  </Layout>
</template>
```

如您所见，Inertia 允许您在构建前端时充分利用 Vue 或 React 的全部力量，同时为您的 Laravel 驱动后端和 JavaScript 驱动前端之间提供了一个轻量级的桥梁。

#### 服务器端渲染

如果您担心因为您的应用程序需要服务器端渲染而不敢深入 Inertia，请不要担心。Inertia 提供了[服务器端渲染支持](https://inertiajs.com/server-side-rendering)。而且，通过 [Laravel Forge](https://forge.laravel.com) 部署您的应用程序时，确保 Inertia 的服务器端渲染进程始终运行非常简单。

### 入门套件

如果您希望使用 Inertia 和 Vue / React 构建前端，您可以利用我们的 Breeze 或 Jetstream [入门套件](/docs/11/getting-started/starter-kits#breeze-and-inertia) 来加速应用程序的开发。这些入门套件使用 Inertia、Vue / React、[Tailwind](https://tailwindcss.com) 和 [Vite](https://vitejs.dev) 为您的应用程序提供后端和前端认证脚手架，以便您可以开始构建下一个伟大的想法。

## 打包资源

无论您选择使用 Blade 和 Livewire 还是 Vue / React 和 Inertia 开发前端，您可能都需要将应用程序的 CSS 打包成生产就绪的资源。当然，如果您选择使用 Vue 或 React 构建应用程序的前端，您还需要将组件打包成浏览器就绪的 JavaScript 资源。

默认情况下，Laravel 使用 [Vite](https://vitejs.dev) 来打包您的资源。Vite 提供了极快的构建时间和几乎瞬时的热模块替换（HMR）在本地开发期间。在所有新的 Laravel 应用程序中，包括那些使用我们的[入门套件](/docs/11/getting-started/starter-kits)，您将找到一个 `vite.config.js` 文件，该文件加载了我们的轻量级 Laravel Vite 插件，使 Vite 在 Laravel 应用程序中使用成为一种乐趣。

通过使用 [Laravel Breeze](/docs/11/getting-started/starter-kits#laravel-breeze) 开始您的应用程序开发是开始使用 Laravel 和 Vite 的最快方式，我们最简单的入门套件通过提供前端和后端认证脚手架来加速您的应用程序开发。

> [!NOTE]
> 有关使用 Laravel 和 Vite 的更详细文档，请参阅我们[专门的文档，了解如何打包和编译您的资源](/docs/11/basics/vite)。
