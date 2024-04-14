---
title: Laravel 前端资源
---

# 资源打包 (Vite)

[[toc]]

## 简介

[Vite](https://vitejs.dev) 是一种现代前端构建工具，它为开发环境提供了极快的速度，并且可以为生产环境打包你的代码。在使用 Laravel 构建应用程序时，你通常会使用 Vite 来打包应用程序的 CSS 和 JavaScript 文件，使之成为生产就绪的资源。

Laravel 通过提供官方插件和 Blade 指令无缝集成 Vite，以便在开发和生产环境中加载你的资源。

> [!NOTE]
> 你正在运行 Laravel Mix 吗？Vite 已经在新的 Laravel 安装中替代了 Laravel Mix。有关 Mix 的文档，请访问 [Laravel Mix](https://laravel-mix.com/) 网站。如果你想切换到 Vite，请参阅我们的[迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。

#### 在 Vite 和 Laravel Mix 之间进行选择

在转向 Vite 之前，新的 Laravel 应用在资源打包时使用了 [Mix](https://laravel-mix.com/)，它是由 [webpack](https://webpack.js.org/) 支持的。Vite 专注于提供在构建丰富的 JavaScript 应用程序时更快捷、高效的体验。如果你正在开发一个单页应用 (SPA)，包括使用像 [Inertia](https://inertiajs.com) 这样的工具开发的应用，Vite 将是非常合适的。

Vite 也适用于传统的服务器端渲染应用程序，并适用于 JavaScript "小技巧"，包括使用 [Livewire](https://livewire.laravel.com)的应用程序。然而，它缺少一些 Laravel Mix 支持的功能，例如能够复制在 JavaScript 应用程序中没有直接引用的任意资产到构建中。

#### 迁移回 Mix

你是否使用我们的 Vite 脚手架开始了一个新的 Laravel 应用，但需要回到 Laravel Mix 和 webpack？没问题。请参考我们的[从 Vite 迁移到 Mix 的官方指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-vite-to-laravel-mix)。

### 安装与设置

> [!NOTE]
> 下面的文档讨论了如何手动安装和配置 Laravel Vite 插件。然而，Laravel 的 [入门套件](/docs/11/getting-started/starter-kits) 已经包含了所有这些脚手架，并且是使用 Laravel 和 Vite 开始的最快方法。

### 安装 Node

在运行 Vite 和 Laravel 插件之前，你必须确保 Node.js (16+) 和 NPM 已经安装：

```sh
node -v
npm -v
```

你可以从 [官方 Node 网站](https://nodejs.org/en/download/) 使用简单的图形安装器轻松安装 Node 和 NPM 的最新版本。或者，如果你正在使用 [Laravel Sail](https://laravel.com/docs/11/packages/sail)，你可以通过 Sail 调用 Node 和 NPM：

```sh
./vendor/bin/sail node -v
./vendor/bin/sail npm -v
```

### 安装 Vite 和 Laravel 插件

在 Laravel 的新安装中，你会在应用程序目录结构的根部找到一个 `package.json` 文件。默认的 `package.json` 文件已经包含了你开始使用 Vite 和 Laravel 插件所需的一切。你可以通过 NPM 安装应用程序的前端依赖：

```sh
npm install
```

### 配置 Vite

Vite 通过项目根目录中的 `vite.config.js` 文件进行配置。根据你的需求，你可以自由定制这个文件，你也可以安装任何应用程序需要的其他插件，比如 `@vitejs/plugin-vue` 或 `@vitejs/plugin-react`。

Laravel Vite 插件要求你指定应用程序的入口点。这些可以是 JavaScript 或 CSS 文件，并包括 TypeScript、JSX、TSX 和 Sass 这样的预处理语言。

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [laravel(['resources/css/app.css', 'resources/js/app.js'])]
})
```

如果你正在构建 SPA，包括使用 Inertia 构建的应用，在没有 CSS 入口点时，Vite 的工作效果最好：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel([
      //'resources/css/app.css', // [tl! remove]
      'resources/js/app.js'
    ])
  ]
})
```

相反，你应该通过 JavaScript 导入 CSS。通常情况下，这将在你应用程序的 `resources/js/app.js` 文件中完成：

```js
import './bootstrap'
import '../css/app.css' // [tl! add]
```

Laravel 插件还支持多个入口点和高级配置选项，例如 [SSR 入口点](#ssr)。

#### 使用安全的开发服务器工作

如果你的本地开发 Web 服务器通过 HTTPS 提供应用程序，你可能会遇到连接到 Vite 开发服务器的问题。

如果你正在使用 [Laravel Herd](https://herd.laravel.com) 并且已经对站点进行了加密，或者你正在使用 [Laravel Valet](/docs/11/packages/valet) 并且已经对你的应用程序运行了 [secure 命令](/docs/11/packages/valet#securing-sites)，Laravel Vite 插件会自动检测并使用为你生成的 TLS 证书。

如果你使用不匹配应用程序目录名称的主机对站点进行了加密，你可以在应用程序的 `vite.config.js` 文件中手动指定主机：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      // ...
      detectTls: 'my-app.test' // [tl! add]
    })
  ]
})
```

当使用其他 Web 服务器时，你应该生成一个受信任的证书并手动配置 Vite 使用生成的证书：

```js
// ...
import fs from 'fs' // [tl! add]

const host = 'my-app.test' // [tl! add]

export default defineConfig({
  // ...
  server: {
    // [tl! add]
    host, // [tl! add]
    hmr: { host }, // [tl! add]
    https: {
      // [tl! add]
      key: fs.readFileSync(`/path/to/${host}.key`), // [tl! add]
      cert: fs.readFileSync(`/path/to/${host}.crt`) // [tl! add]
    } // [tl! add]
  } // [tl! add]
})
```

如果你无法为你的系统生成一个受信任的证书，你可以安装并配置 [`@vitejs/plugin-basic-ssl` 插件](https://github.com/vitejs/vite-plugin-basic-ssl)。使用不受信任的证书时，你需要在浏览器中接受 Vite 的开发服务器证书警告，方法是运行 `npm run dev` 命令后，在控制台中遵循 "Local" 链接。

### 在 Sail 上的 WSL2 中运行开发服务器

当在 Windows Subsystem for Linux 2 (WSL2) 上的 [Laravel Sail](/docs/11/packages/sail) 中运行 Vite 开发服务器时，你应该在你的 `vite.config.js` 文件中添加以下配置，以确保浏览器可以与开发服务器通信：

```js
// ...

export default defineConfig({
  // ...
  server: {
    // [tl! add:start]
    hmr: {
      host: 'localhost'
    }
  } // [tl! add:end]
})
```

如果在开发服务器运行时，文件更改没有在浏览器中反映出来，你可能还需要配置 Vite 的 [`server.watch.usePolling` 选项](https://vitejs.dev/config/server-options.html#server-watch)。

### 加载你的脚本和样式

配置了 Vite 入口点之后，现在可以在应用程序根模板的 `<head>` 中添加一个 `@vite()` Blade 指令来引用它们：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

如果你通过 JavaScript 导入 CSS，你只需要包含 JavaScript 入口点：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @vite('resources/js/app.js')
</head>
```

`@vite` 指令会自动检测 Vite 开发服务器，并注入 Vite 客户端以启用热模块替换（Hot Module Replacement）。在构建模式中，该指令将加载已编译和版本化的资产，包括任何导入的 CSS。

如果需要，调用 `@vite` 指令时还可以指定编译资产的构建路径：

```blade
<!doctype html>
<head>
    {{-- 给出的构建路径是相对于公共路径的。 --}}

    @vite('resources/js/app.js', 'vendor/courier/build')
</head>
```

#### 内联资产

有时可能需要包含资产的原始内容，而不是链接到资产的版本化 URL。例如，当你需要将 HTML 内容传递给 PDF 生成器时，可能需要直接在你的页面中包含资产内容。你可以使用 `Vite` facade 提供的 `content` 方法来输出 Vite 资产的内容：

```blade
@php
use Illuminate\Support\Facades\Vite;
@endphp

<!doctype html>
<head>
    {{-- ... --}}

    <style>
        {!! Vite::content('resources/css/app.css') !!}
    </style>
    <script>
        {!! Vite::content('resources/js/app.js') !!}
    </script>
</head>
```

## 运行 Vite

有两种方式可以运行 Vite。你可以通过 `dev` 命令运行开发服务器，在本地开发时使用，这非常有用。开发服务器会自动检测你的文件更改，并将它们实时反映在任何开启的浏览器窗口中。

或者，运行 `build` 命令将版本化并打包你的应用程序资产，并让它们准备好部署到生产环境：

```shell
# 运行 Vite 开发服务器...
npm run dev

# 为生产环境构建和版本化资产...
npm run build
```

如果你在 WSL2 上的 [Sail](/docs/11/packages/sail) 中运行开发服务器，可能需要一些[额外的配置](#configuring-hmr-in-sail-on-wsl2)选项。

## 使用 JavaScript

### 别名

默认情况下，Laravel 插件提供了一个常用别名，以帮助你快速开始并方便地导入应用程序的资产：

```js
{
    '@': '/resources/js'
}
```

你可以通过在 `vite.config.js` 配置文件中添加自己的别名来覆盖 `'@'` 别名：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [laravel(['resources/ts/app.tsx'])],
  resolve: {
    alias: {
      '@': '/resources/ts'
    }
  }
})
```

### Vue

如果你想使用 [Vue](https://vuejs.org/) 框架构建前端，那么你还需要安装 `@vitejs/plugin-vue` 插件：

```sh
npm install --save-dev @vitejs/plugin-vue
```

然后，你可以在 `vite.config.js` 配置文件中包含该插件。当使用 Laravel 和 Vue 插件时，还需要一些额外的配置选项：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    laravel(['resources/js/app.js']),
    vue({
      template: {
        transformAssetUrls: {
          // Vue 插件会重写 Single File Components 中引用的资产 URL，
          // 指向 Laravel web 服务器。设置此值为 `null` 允许 Laravel 插件
          // 重新指向 Vite 服务器。
          base: null,

          // Vue 插件会解析绝对 URL 并将它们视为磁盘上文件的绝对路径。
          // 设置此值为 `false` 将不处理绝对 URL，所以它们可以如预期
          // 那样引用公共目录中的资产。
          includeAbsolute: false
        }
      }
    })
  ]
})
```

> [!NOTE]
> Laravel 的 [入门套件](/docs/11/getting-started/starter-kits) 已经包含了正确的 Laravel、Vue 和 Vite 配置。查看 [Laravel Breeze](/docs/11/getting-started/starter-kits#breeze-and-inertia)，它是开始使用 Laravel、Vue 和 Vite 的最快途径。

### React

如果你想使用 [React](https://reactjs.org/) 框架构建你的前端界面，那么你还需要安装 `@vitejs/plugin-react` 插件：

```sh
npm install --save-dev @vitejs/plugin-react
```

接下来，你可以在 `vite.config.js` 配置文件中包含该插件：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [laravel(['resources/js/app.jsx']), react()]
})
```

你需要确保所有包含 JSX 的文件都有一个 `.jsx` 或 `.tsx` 扩展名，并根据需要更新你的入口点，如[上面所示](#configuring-vite)。

你还需要在现有的 `@vite` 指令旁边包含额外的 `@viteReactRefresh` Blade 指令。

```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
```

`@viteReactRefresh` 指令必须在 `@vite` 指令之前调用。

> [!NOTE]
> Laravel 的 [入门套件](/docs/11/getting-started/starter-kits) 已经包含了正确的 Laravel、React 和 Vite 配置。查看 [Laravel Breeze](/docs/11/getting-started/starter-kits#breeze-and-inertia)，它是开始使用 Laravel、React 和 Vite 的最快途径。

### Inertia

Laravel Vite 插件提供了一个方便的 `resolvePageComponent` 函数，帮助你解析 Inertia 页面组件。以下是使用 Vue 3 示例中该助手的示例；但是，你也可以在其他框架中使用该函数，如 React：

```js
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
  setup({ el, App, props, plugin }) {
    return createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  }
})
```

> [!NOTE]
> Laravel 的 [入门套件](/docs/11/getting-started/starter-kits) 已经包含了正确的 Laravel、Inertia 和 Vite 配置。查看 [Laravel Breeze](/docs/11/getting-started/starter-kits#breeze-and-inertia)，这是开始使用 Laravel、Inertia 和 Vite 的最快途径。

### URL 处理

使用 Vite 并在你的应用程序 HTML、CSS 或 JS 中引用资源时，需要考虑一些注意事项。首先，如果你使用绝对路径引用资源，Vite 不会将资源包含在构建中；因此，你应该确保资源在公共目录中可用。

在引用相对资产路径时，你应该记住这些路径与引用它们的文件相关。通过相对路径引用的任何资产都会被 Vite 重写、版本化并打包。

考虑以下项目结构：

```shell
public/
  taylor.png
resources/
  js/
    Pages/
      Welcome.vue
  images/
    abigail.png
```

以下示例演示了 Vite 如何处理相对和绝对 URL：

```html
<!-- 此资产不由 Vite 处理，不会包含在构建中 -->
<img src="/taylor.png" />

<!-- 此资产将被 Vite 重写、版本化和打包 -->
<img src="../../images/abigail.png" />
```

## 使用样式表

你可以在 [Vite 文档](https://vitejs.dev/guide/features.html#css) 中了解更多关于 Vite 的 CSS 支持。如果你使用 PostCSS 插件，如 [Tailwind](https://tailwindcss.com)，你可以在项目根目录中创建一个 `postcss.config.js` 文件，Vite 会自动应用它：

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

> [!NOTE]
> Laravel 的 [入门套件](/docs/11/getting-started/starter-kits) 已经包含了正确的 Tailwind、PostCSS 和 Vite 配置。或者，如果你想在不使用我们的入门套件的情况下使用 Tailwind 和 Laravel，请查看 [Laravel 的 Tailwind 安装指南](https://tailwindcss.com/docs/guides/laravel)。

## 使用 Blade 和路由

### 使用 Vite 处理静态资源

在 JavaScript 或 CSS 中引用资产时，Vite 会自动处理和版本化它们。此外，在使用 Blade 构建应用程序时，Vite 还可以处理和版本化你仅在 Blade 模板中引用的静态资源。

然而，为了实现这一点，你需要通过在应用程序的入口点导入静态资产，使 Vite 能够知道你的资产。例如，如果你想处理并版本化 `resources/images` 中存储的所有图片和 `resources/fonts` 中存储的所有字体，你应该在应用程序的 `resources/js/app.js` 入口点中添加以下内容：

```js
import.meta.glob(['../images/**', '../fonts/**'])
```

当运行 `npm run build` 时，这些资产现在将被 Vite 处理。然后你可以在 Blade 模板中使用 `Vite::asset` 方法引用这些资产，该方法会返回给定资产的版本化 URL：

```blade
<img src="{{ Vite::asset('resources/images/logo.png') }}">
```

### 保存时刷新

当你的应用程序是使用传统的服务器端渲染和 Blade 构建时，Vite 可以通过在你对应用程序视图文件做出更改时自动刷新浏览器来改善开发工作流程。要开始使用，你只需要简单地将 `refresh` 选项指定为 `true`。

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      // ...
      refresh: true
    })
  ]
})
```

当 `refresh` 选项为 `true` 时，保存以下目录中的文件将触发浏览器执行完整页面刷新，同时你运行了 `npm run dev`：

- `app/View/Components/**`
- `lang/**`
- `resources/lang/**`
- `resources/views/**`
- `routes/**`

监视 `routes/**` 目录在你的应用程序前端生成路由链接时使用 [Ziggy](https://github.com/tighten/ziggy) 非常有用。

如果这些默认路径不适合你的需求，你可以指定你自己的路径列表来监视：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      // ...
      refresh: ['resources/views/**']
    })
  ]
})
```

在底层，Laravel Vite 插件使用了 [`vite-plugin-full-reload`](https://github.com/ElMassimo/vite-plugin-full-reload) 包，该软件包提供了一些高级配置选项，用于微调此功能的行为。如果你需要这种级别的自定义，你可以提供一个 `config` 定义：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      // ...
      refresh: [
        {
          paths: ['path/to/watch/**'],
          config: { delay: 300 }
        }
      ]
    })
  ]
})
```

### 别名

在 JavaScript 应用程序中[创建别名](#aliases)到经常引用的目录是很常见的。但是，你也可以使用 `Illuminate\Support\Facades\Vite` 类的 `macro` 方法在 Blade 中创建别名。通常，“宏”应该在[服务提供者](/docs/11/architecture-concepts/providers)的 `boot` 方法内定义：

```php
/**
 * 启动任何应用服务。
 */
public function boot(): void
{
    Vite::macro('image', fn (string $asset) => $this->asset("resources/images/{$asset}"));
}
```

定义宏之后，就可以在模板中调用它。例如，我们可以使用上面定义的 `image` 宏来引用位于 `resources/images/logo.png` 的资产：

```blade
<img src="{{ Vite::image('logo.png') }}" alt="Laravel Logo">
```

## 自定义基础 URL

如果你的 Vite 编译资产部署到与你的应用程序不同的域，例如通过 CDN，你必须在应用程序的 `.env` 文件中指定 `ASSET_URL` 环境变量：

```php
ASSET_URL=https://cdn.example.com
```

配置资产 URL 之后，所有重写的资产 URL 都将被配置的值作为前缀：

```shell
https://cdn.example.com/build/assets/app.9dce8d17.js
```

记住，[绝对 URL 并不会被 Vite 重写](#url-processing)，所以它们不会被加前缀。

## 环境变量

你可以通过在应用程序的 `.env` 文件中使用 `VITE_` 前缀，将环境变量注入到你的 JavaScript 中：

```php
VITE_SENTRY_DSN_PUBLIC=http://example.com
```

你可以通过 `import.meta.env` 对象访问注入的环境变量：

```js
import.meta.env.VITE_SENTRY_DSN_PUBLIC
```

## 在测试中禁用 Vite

在运行测试时，Laravel 的 Vite 集成将尝试解析你的资产，这要求你运行 Vite 开发服务器或构建你的资产。

如果你更愿意在测试期间模拟 Vite，可以调用 `withoutVite` 方法，该方法在扩展 Laravel 的 `TestCase` 类的任何测试中都可用：

```php
test('without vite example', function () {
    $this->withoutVite();

    // ...
});
```

```php
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_without_vite_example(): void
    {
        $this->withoutVite();

        // ...
    }
}
```

如果你想为所有测试禁用 Vite，你可以从基础 `TestCase` 类中的 `setUp` 方法调用 `withoutVite` 方法：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }
}
```

## 服务器端渲染 (SSR)

Laravel Vite 插件使得使用 Vite 设置服务器端渲染变得轻而易举。首先，在 `resources/js/ssr.js` 创建一个 SSR 入口点，并通过向 Laravel 插件传递配置选项来指定入口点：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.js',
      ssr: 'resources/js/ssr.js'
    })
  ]
})
```

为了确保你不会忘记重新构建 SSR 入口点，我们建议在应用程序的 `package.json` 中的 "build" 脚本中增加创建你 SSR 构建的内容：

```json
"scripts": {
     "dev": "vite",
     "build": "vite build", // [tl! remove]
     "build": "vite build && vite build --ssr" // [tl! add]
}
```

然后，要构建并启动 SSR 服务器，你可以运行以下命令：

```sh
npm run build
node bootstrap/ssr/ssr.js
```

如果你正在使用 [Inertia 的 SSR](https://inertiajs.com/server-side-rendering)，你可以改为使用 `inertia:start-ssr` Artisan 命令来启动 SSR 服务器：

```sh
php artisan inertia:start-ssr
```

> [!NOTE]
> Laravel 的 [入门套件](/docs/11/getting-started/starter-kits) 已经包含了正确的 Laravel、Inertia SSR 和 Vite 配置。查看 [Laravel Breeze](/docs/11/getting-started/starter-kits#breeze-and-inertia) 了解如何快速开始使用 Laravel、Inertia SSR 和 Vite。

## 脚本和样式标签属性

### 内容安全政策 (CSP) Nonce

如果你希望在脚本和样式标签上包含 [`nonce` 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce) 作为你的[内容安全政策](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，你可以使用 `useCspNonce` 方法在自定义 [中间件](/docs/11/basics/middleware) 中生成或指定一个 nonce：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class AddContentSecurityPolicyHeaders
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Vite::useCspNonce();

        return $next($request)->withHeaders([
            'Content-Security-Policy' => "script-src 'nonce-".Vite::cspNonce()."'",
        ]);
    }
}
```

调用 `useCspNonce` 方法后，Laravel 将自动在所有生成的脚本和样式标签上包含 `nonce` 属性。

如果你需要在其他地方指定 nonce，包括 Laravel 的[入门套件](/docs/11/getting-started/starter-kits)中包含的 [Ziggy `@route` 指令](https://github.com/tighten/ziggy#using-routes-with-a-content-security-policy)，你可以使用 `cspNonce` 方法来检索它：

```blade
@routes(nonce: Vite::cspNonce())
```

如果你已经有一个你想指示 Laravel 使用的 nonce，你可以将 nonce 传递给 `useCspNonce` 方法：

```php
Vite::useCspNonce($nonce);
```

### 子资源完整性 (SRI)

如果你的 Vite 清单包含了资产的 `integrity` 散列值，Laravel 会在其生成的任何脚本和样式标签上自动添加 `integrity` 属性，以强制执行[子资源完整性 (Subresource Integrity)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)。默认情况下，Vite 不会在其清单中包含 `integrity` 散列值，但是你可以通过安装 [`vite-plugin-manifest-sri`](https://www.npmjs.com/package/vite-plugin-manifest-sri) NPM 插件来启用它：

```shell
npm install --save-dev vite-plugin-manifest-sri
```

然后，在你的 `vite.config.js` 文件中启用此插件：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import manifestSRI from 'vite-plugin-manifest-sri' // [tl! add]

export default defineConfig({
  plugins: [
    laravel({
      // ...
    }),
    manifestSRI() // [tl! add]
  ]
})
```

如果需要，你还可以自定义找到整合哈希的清单键：

```php
use Illuminate\Support\Facades\Vite;

Vite::useIntegrityKey('custom-integrity-key');
```

如果你想完全禁用这种自动检测，可以将 `false` 传递给 `useIntegrityKey` 方法：

```php
Vite::useIntegrityKey(false);
```

### 任意属性

如果你需要在脚本和样式标签上包含额外的属性，比如 [`data-turbo-track`](https://turbo.hotwired.dev/handbook/drive#reloading-when-assets-change) 属性，你可以通过 `useScriptTagAttributes` 和 `useStyleTagAttributes` 方法指定它们。通常，这些方法应该在[服务提供者](/docs/11/architecture-concepts/providers)中调用：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes([
    'data-turbo-track' => 'reload', // 为属性指定一个值...
    'async' => true, // 指定没有值的属性...
    'integrity' => false, // 排除本来会包含的属性...
]);

Vite::useStyleTagAttributes([
    'data-turbo-track' => 'reload',
]);
```

如果你需要有条件地添加属性，你可以传递一个回调，该回调将接收资产源路径、其 URL、其清单块和整个清单：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes(fn (string $src, string $url, array|null $chunk, array|null $manifest) => [
    'data-turbo-track' => $src === 'resources/js/app.js' ? 'reload' : false,
]);

Vite::useStyleTagAttributes(fn (string $src, string $url, array|null $chunk, array|null $manifest) => [
    'data-turbo-track' => $chunk && $chunk['isEntry'] ? 'reload' : false,
]);
```

> [!WARNING]
> 当 Vite 开发服务器运行时，`$chunk` 和 `$manifest` 参数将为 `null`。

## 高级自定义

开箱即用的 Laravel Vite 插件使用了通常适应大部分应用程序的约定；但是，有时你可能需要自定义 Vite 的行为。为了启用额外的自定义选项，我们提供以下方法和选项，可以代替 `@vite` Blade 指令使用：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    {{
        Vite::useHotFile(storage_path('vite.hot')) // 自定义 "hot" 文件...
            ->useBuildDirectory('bundle') // 自定义构建目录...
            ->useManifestFilename('assets.json') // 自定义清单文件名...
            ->withEntryPoints(['resources/js/app.js']) // 指定入口点...
            ->createAssetPathsUsing(function (string $path, ?bool $secure) { // 自定义后台路径生成已构建的资产...
                return "https://cdn.example.com/{$path}";
            })
    }}
</head>
```

在 `vite.config.js` 文件中，你应该指定相同的配置：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      hotFile: 'storage/vite.hot', // 自定义 "hot" 文件...
      buildDirectory: 'bundle', // 自定义构建目录...
      input: ['resources/js/app.js'] // 指定入口点...
    })
  ],
  build: {
    manifest: 'assets.json' // 自定义清单文件名...
  }
})
```

### 纠正开发服务器 URL

Vite 生态系统内的一些插件假设以正斜杠开头的 URL 总是指向 Vite 开发服务器。然而，由于 Laravel 集成的性质，情况并非如此。

例如，当 Vite 提供你的资产时，`vite-imagetools` 插件会输出如下 URL：

```html
<img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520" />
```

`vite-imagetools` 插件期待输出的 URL 会被 Vite 拦截，然后插件可以处理所有以 `/@imagetools` 开始的 URL。如果你使用的插件期待这种行为，你将需要手动纠正 URL。你可以在 `vite.config.js` 文件中使用 `transformOnServe` 选项来实现这一点。

在这个特定的例子中，我们将在生成的代码中将 `/@imagetools` 开头的所有 URL 替换为开发服务器的 URL：

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import { imagetools } from 'vite-imagetools'

export default defineConfig({
  plugins: [
    laravel({
      // ...
      transformOnServe: (code, devServerUrl) => code.replaceAll('/@imagetools', devServerUrl + '/@imagetools')
    }),
    imagetools()
  ]
})
```

现在，当 Vite 提供资产时，它将输出指向 Vite 开发服务器的 URL：

```html
-
<img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520" />
<!-- [tl! remove] -->
+
<img src="http://[::1]:5173/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520" />
<!-- [tl! add] -->
```
