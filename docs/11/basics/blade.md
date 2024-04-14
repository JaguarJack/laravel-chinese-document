---
title: Laravel Blade 模板
---

# Blade 模板

[[toc]]

## 简介

Blade 是 Laravel 提供的简单而功能强大的模板引擎。与一些 PHP 模板引擎不同，Blade 不限制在模板中使用纯 PHP 代码。实际上，所有 Blade 模板都会被编译成纯 PHP 代码并缓存，直到它们被修改，这意味着 Blade 对应用程序基本上没有任何开销。Blade 模板文件使用 `.blade.php` 文件扩展名，并通常存储在 `resources/views` 目录中。

可以使用全局 `view` 辅助函数从路由或控制器返回 Blade 视图。当然，正如[视图](/docs/11/basics/views)文档中提到的，可以使用 `view` 辅助函数的第二个参数将数据传递给 Blade 视图：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

### 用 Livewire 强化 Blade

想要将你的 Blade 模板提升到一个新的层次，并轻松构建动态界面吗？请查看 [Laravel Livewire](https://livewire.laravel.com)。Livewire 允许你编写增强了典型只有通过 React 或 Vue 这样的前端框架才能实现的动态功能的 Blade 组件，提供了一种构建现代化、响应式前端的好方法，而无需许多 JavaScript 框架的复杂性、客户端渲染或构建步骤。

## 显示数据

你可以通过将变量包裹在花括号中来显示传递到 Blade 视图的数据。例如，给定以下路由：

```php
Route::get('/', function () {
    return view('welcome', ['name' => 'Samantha']);
});
```

你可以像这样显示 `name` 变量的内容：

```blade
Hello, {{ $name }}.
```

> [!NOTE]
> Blade 的 `{{ }}` echo 语句自动通过 PHP 的 `htmlspecialchars` 函数，以防止 XSS 攻击。

你不仅限于显示传递到视图的变量内容。你也可以回显任何 PHP 函数的结果。实际上，你可以在 Blade echo 语句内放置任何你希望的 PHP 代码：

```blade
The current UNIX timestamp is {{ time() }}.
```

### HTML 实体编码

默认情况下，Blade（和 Laravel 的 `e` 函数）会对 HTML 实体进行双重编码。如果你想禁用双重编码，可以在 `AppServiceProvider` 的 `boot` 方法中调用 `Blade::withoutDoubleEncoding` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 启动任何应用服务。
     */
    public function boot(): void
    {
        Blade::withoutDoubleEncoding();
    }
}
```

#### 显示未转义的数据

默认情况下，Blade `{{ }}` 语句会自动通过 PHP 的 `htmlspecialchars` 函数来防止 XSS 攻击。如果你不希望你的数据被转义，你可以使用以下语法：

```blade
Hello, {!! $name !!}.
```

> [!WARNING]
> 当输出用户提供的内容时要非常小心。展示用户提供的数据时，你通常应该使用转义的双花括号语法来防止 XSS 攻击。

### Blade 和 JavaScript 框架

由于许多 JavaScript 框架也使用“花括号”表示浏览器中应该显示的表达式，你可以使用 `@` 符号来通知 Blade 渲染引擎表达式应保持不变。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在这个示例中，`@` 符号将被 Blade 移除；然而，`{{ name }}` 表达式将不会被 Blade 引擎处理，允许它被你的 JavaScript 框架渲染。

`@` 符号也可以用来转义 Blade 指令：

```blade
{{-- Blade 模板 --}}
@@if()

<!-- HTML 输出 -->
@if()
```

#### 渲染 JSON

有时你可能会传递一个数组到你的视图，并打算将其渲染为 JSON 来初始化 JavaScript 变量。例如：

```blade
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

然而，你不必手动调用 `json_encode`，你可以使用 `Illuminate\Support\Js::from` 方法指令。`from` 方法接受与 PHP 的 `json_encode` 函数相同的参数；然而，它将确保生成的 JSON 被适当地转义，以便包括在 HTML 引号中。`from` 方法将返回一个 `JSON.parse` JavaScript 语句，该语句将把给定的对象或数组转换为有效的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

Laravel 应用程序框架的最新版本包含了一个 `Js` facade，它在你的 Blade 模板内提供了方便的访问此功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> [!WARNING]
> 你应该只使用 `Js::from` 方法来渲染现有变量为 JSON。Blade 模板是基于正则表达式的，并且尝试向指令传递复杂的表达式可能会导致意外的失败。

#### `@verbatim` 指令

如果你在模板的很大一部分中显示 JavaScript 变量，你可以使用 `@verbatim` 指令包裹 HTML，这样你就不必为每个 Blade echo 语句加上 `@` 符号：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

## Blade 指令

除了模板继承和数据显示之外，Blade 还为常见的 PHP 控制结构（如条件语句和循环）提供了便捷的快捷方式。这些快捷方式提供了一种非常干净、简洁的处理 PHP 控制结构的方式，同时也保持了与它们的 PHP 对应功能的熟悉度。

### If 语句

你可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令构建 `if` 语句。这些指令的功能与它们的 PHP 对应功能完全相同：

```blade
@if (count($records) === 1)
    我有一条记录！
@elseif (count($records) > 1)
    我有多条记录！
@else
    我没有任何记录！
@endif
```

为了方便，Blade 还提供了 `@unless` 指令：

```blade
@unless (Auth::check())
    你没有登录。
@endunless
```

除了已经讨论过的条件指令之外，`@isset` 和 `@empty` 指令可用作它们各自 PHP 函数的便捷快捷方式：

```blade
@isset($records)
    // $records 已定义且不为 null...
@endisset

@empty($records)
    // $records 是 "空" 的...
@endempty
```

#### 身份验证指令

`@auth` 和 `@guest` 指令可用于快速确定当前用户是否[认证](/docs/11/security/authentication)或者是游客：

```blade
@auth
    // 用户已认证...
@endauth

@guest
    // 用户未认证...
@endguest
```

如果需要，你可以指定检查时使用的认证 guard，在使用 `@auth` 和 `@guest` 指令时：

```blade
@auth('admin')
    // 用户已认证...
@endauth

@guest('admin')
    // 用户未认证...
@endguest
```

#### 环境指令

你可以使用 `@production` 指令检查应用是否在生产环境中运行：

```blade
@production
    // 生产环境特定内容...
@endproduction
```

或者，你可以使用 `@env` 指令确定应用是否在特定环境中运行：

```blade
@env('staging')
    // 应用在 "staging" 中运行...
@endenv

@env(['staging', 'production'])
    // 应用在 "staging" 或 "production" 中运行...
@endenv
```

#### Section 指令

你可以使用 `@hasSection` 指令确定一个模板继承区块是否有内容：

```blade
@hasSection('navigation')
    <div class="pull-right">
        @yield('navigation')
    </div>

    <div class="clearfix"></div>
@endif
```

你可以使用 `@sectionMissing` 指令确定一个区块是否没有内容：

```blade
@sectionMissing('navigation')
    <div class="pull-right">
        @include('default-navigation')
    </div>
@endif
```

#### 会话指令

`@session` 指令可用于确定是否存在[会话](/docs/11/basics/session)值。如果会话值存在，`@session` 和 `@endsession` 指令内的模板内容将被执行。在 `@session` 指令的内容中，你可以回显 `$value` 变量来显示会话的值：

```blade
@session('status')
    <div class="p-4 bg-green-100">
        {{ $value }}
    </div>
@endsession
```

### Switch 语句

Switch 语句可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令构建：

```blade
@switch($i)
    @case(1)
        第一种情况...
        @break

    @case(2)
        第二种情况...
        @break

    @default
        默认情况...
@endswitch
```

### 循环

除了条件语句，Blade 还提供了简单的指令，用于处理 PHP 的循环结构。同样，每个这些指令的功能都与它们的 PHP 对应功能完全相同：

```blade
@for ($i = 0; $i < 10; $i++)
    当前的值是 {{ $i }}
@endfor

@foreach ($users as $user)
    <p>这是用户 {{ $user->id }}</p>
@endforeach

@forelse ($users as $user)
    <li>{{ $user->name }}</li>
@empty
    <p>没有用户</p>
@endforelse

@while (true)
    <p>我将永远循环。</p>
@endwhile
```

> [!NOTE]
> 在进行 `foreach` 循环时，你可以使用[循环变量](#the-loop-variable)来获取有关循环的宝贵信息，例如你是否处于循环的第一次或最后一次迭代中。

在使用循环时，你还可以使用 `@continue` 和 `@break` 指令来跳过当前迭代或结束循环：

```blade
@foreach ($users as $user)
    @if ($user->type == 1)
        @continue
    @endif

    <li>{{ $user->name }}</li>

    @if ($user->number == 5)
        @break
    @endif
@endforeach
```

你还可以在指令声明中包含连续或中断条件：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

### 循环变量

在进行 `foreach` 循环时，你的循环内将有一个 `$loop` 变量可用。这个变量提供了一些有用的信息，如当前循环索引，以及这是第一次还是最后一次通过循环迭代：

```blade
@foreach ($users as $user)
    @if ($loop->first)
        这是第一次迭代。
    @endif

    @if ($loop->last)
        这是最后一次迭代。
    @endif

    <p>这是用户 {{ $user->id }}</p>
@endforeach
```

如果你在嵌套循环中，你可以通过 `parent` 属性访问父循环的 `$loop` 变量：

```blade
@foreach ($users as $user)
    @foreach ($user->posts as $post)
        @if ($loop->parent->first)
            这是父循环的第一次迭代。
        @endif
    @endforeach
@endforeach
```

`$loop` 变量还包含多种其他有用的属性：

| 属性               | 描述                              |
| ------------------ | --------------------------------- |
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。 |
| `$loop->iteration` | 当前的循环迭代（从 1 开始）。     |
| `$loop->remaining` | 循环中剩余的迭代次数。            |
| `$loop->count`     | 正在迭代的数组中的项目总数。      |
| `$loop->first`     | 是否为循环的第一次迭代。          |
| `$loop->last`      | 是否为循环的最后一次迭代。        |
| `$loop->even`      | 这是循环的偶数次迭代。            |
| `$loop->odd`       | 这是循环的奇数次迭代。            |
| `$loop->depth`     | 当前循环的嵌套级别。              |
| `$loop->parent`    | 在嵌套循环中，父代的循环变量。    |

### 条件类和样式

`@class` 指令有条件地编译 CSS 类字符串。该指令接受一个类数组，其中数组键包含你想要添加的类，而值是一个布尔表达式。如果数组元素有一个数字键，它将始终包含在渲染的类列表中：

```blade
@php
    $isActive = false;
    $hasError = true;
@endphp

<span @class([
    'p-4',
    'font-bold' => $isActive,
    'text-gray-500' => ! $isActive,
    'bg-red' => $hasError,
])></span>

<span class="p-4 text-gray-500 bg-red"></span>
```

同样，`@style` 指令可用于条件地向 HTML 元素添加内联 CSS 样式：

```blade
@php
    $isActive = true;
@endphp

<span @style([
    'background-color: red',
    'font-weight: bold' => $isActive,
])></span>

<span style="background-color: red; font-weight: bold;"></span>
```

### 额外属性

为了方便起见，你可以使用 `@checked` 指令轻松指示给定的 HTML 复选框输入是否被“选中”。如果提供的条件求值为 `true`，则此指令将回显 `checked`：

```blade
<input type="checkbox"
        name="active"
        value="active"
        @checked(old('active', $user->active)) />
```

类似地，`@selected` 指令可用于指示给定的选择选项是否应该被“选中”：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，`@disabled` 指令可用于指示给定元素是否应该被“禁用”：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>提交</button>
```

此外，`@readonly` 指令可用于指示给定元素是否应该是“只读”的：

```blade
<input type="email"
        name="email"
        value="email@laravel.com"
        @readonly($user->isNotAdmin()) />
```

另外，`@required` 指令可用于指示给定元素是否应该是“必需”的：

```blade
<input type="text"
        name="title"
        value="title"
        @required($user->isAdmin()) />
```

### 包含子视图

> [!NOTE]
> 虽然你可以自由使用 `@include` 指令，但 Blade [组件](#components) 提供了类似的功能，并且比 `@include` 指令提供了更多优势，如数据和属性绑定。

Blade 的 `@include` 指令允许你从另一个视图中包含一个 Blade 视图。所有对父视图可用的变量对包含的视图都将可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- 表单内容 -->
    </form>
</div>
```

尽管包含的视图将继承父视图中所有可用的数据，你也可以传递一个额外的数据数组，这些数据将对包含的视图可用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果你尝试 `@include` 一个不存在的视图，Laravel 将会抛出错误。如果你想包含一个可能存在或不存在的视图，你应该使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果你想 `@include` 一个视图，给定的布尔表达式如果求值为 `true` 或 `false`，你可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要包含从给定视图数组中存在的第一个视图，你可以使用 `@includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

> [!WARNING]
> 你应该避免在你的 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们将引用缓存的编译视图的位置。

#### 为集合渲染视图

你可以使用 Blade 的 `@each` 指令将循环和包含合并成一行：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是用于渲染数组或集合中每个元素的视图。第二个参数是你希望迭代的数组或集合，而第三个参数是将在视图内分配给当前迭代的变量名称。因此，例如，如果你正在迭代一个 `jobs` 数组，通常你会希望在视图中将每个作业作为 `job` 变量访问。当前迭代的数组键将在视图中作为 `key` 变量可用。

你还可以向 `@each` 指令传递第四个参数。这个参数决定了如果给定数组为空时将渲染哪个视图。

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> [!WARNING]
> 通过 `@each` 渲染的视图不会继承父视图的变量。如果子视图需要这些变量，你应该使用 `@foreach` 和 `@include` 指令。

### `@once` 指令

`@once` 指令允许你定义模板的一部分，这部分在每个渲染周期只会被评估一次。这在使用[堆栈](#stacks)将给定的 JavaScript 推送到页面的头部时可能很有用。例如，如果你在循环中渲染一个给定的 [组件](#components)，你可能希望只在组件第一次渲染时将 JavaScript 推送到头部：

```blade
@once
    @push('scripts')
        <script>
            // 你的自定义 JavaScript...
        </script>
    @endpush
@endonce
```

由于 `@once` 指令通常与 `@push` 或 `@prepend` 指令一起使用，因此 `@pushOnce` 和 `@prependOnce` 指令方便您使用：

```blade
@pushOnce('scripts')
    <script>
        // 你的自定义 JavaScript...
    </script>
@endPushOnce
```

### 原生 PHP

在某些情况下，将 PHP 代码嵌入到视图中是有用的。你可以使用 Blade 的 `@php` 指令在模板中执行一块纯 PHP：

```blade
@php
    $counter = 1;
@endphp
```

或者，如果你只需要使用 PHP 导入一个类，你可以使用 `@use` 指令：

```blade
@use('App\Models\Flight')
```

第二个参数可以提供给 `@use` 指令用于为导入的类取别名：

```php
@use('App\Models\Flight', 'FlightModel')
```

### 注释

Blade 还允许你在视图中定义注释。然而，与 HTML 注释不同，Blade 注释不包含在应用程序返回的 HTML 中：

```blade
{{-- 这个注释不会出现在渲染的 HTML 中 --}}
```

## 组件

组件和插槽提供了与节、布局和包含类似的好处；但是，一些人可能会发现组件和插槽的心智模型更容易理解。编写组件有两种方法：基于类的组件和匿名组件。

要创建一个基于类的组件，你可以使用 `make:component` Artisan 命令。为了说明如何使用组件，我们将创建一个简单的 `Alert` 组件。`make:component` 命令将把组件放在 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还会为组件创建一个视图模板。视图将被放置在 `resources/views/components` 目录中。编写自己应用程序的组件时，组件通常会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现，所以通常不需要进一步的组件注册。

你还可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令将在 `app/View/Components/Forms` 目录中创建一个 `Input` 组件，并将视图放置在 `resources/views/components/forms` 目录中。

如果你想创建一个匿名组件（只有一个 Blade 模板且没有类的组件），你可以在调用 `make:component` 命令时使用 `--view` 选项：

```shell
php artisan make:component forms.input --view
```

上面的命令将在 `resources/views/components/forms/input.blade.php` 创建一个 Blade 文件，可以通过 `<x-forms.input />` 渲染为组件。

#### 手动注册包组件

编写自己的应用程序组件时，组件通常会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现。

但是，如果你正在构建一个使用 Blade 组件的包，你将需要手动注册你的组件类及其 HTML 标签别名。你通常应该在包的服务提供者的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', Alert::class);
}
```

一旦你的组件注册后，它可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

或者，你可以使用 `componentNamespace` 方法按照约定自动加载组件类。例如，`Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 组件，它们位于 `Package\Views\Components` 命名空间下：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许使用包组件，并通过 `package-name::` 语法指明它们的供应商命名空间：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 将通过对组件名称进行帕斯卡式命名法（Pascal case）自动检测与该组件相关联的类。子目录也通过“点”表示法支持。

### 渲染组件

要显示组件，你可以在你的 Blade 模板中使用 Blade 组件标签。Blade 组件标签以字符串 `x-` 开头，后跟组件类的 kebab case 名称：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类在 `app/View/Components` 目录下的更深层，则可以使用 `.` 字符来表示目录嵌套。例如，假设组件位于 `app/View/Components/Inputs/Button.php`，我们可以这样渲染它：

```blade
<x-inputs.button/>
```

如果你想有条件地渲染你的组件，你可以在你的组件类上定义一个 `shouldRender` 方法。如果 `shouldRender` 方法返回 `false`，则不会渲染该组件：

```php
use Illuminate\Support\Str;

/**
 * 该组件是否应该被渲染
 */
public function shouldRender(): bool
{
    return Str::length($this->message) > 0;
}
```

### 向组件传递数据

你可以使用 HTML 属性向 Blade 组件传递数据。可以使用简单的 HTML 属性字符串将硬编码的原始值传递给组件。应该通过使用 `:` 字符为前缀的属性向组件传递 PHP 表达式和变量：

```blade
<x-alert type="error" :message="$message"/>
```

你应该在组件的类构造函数中定义所有的组件数据属性。组件上的所有公共属性将自动提供给组件的视图。从组件的 `render` 方法传递数据到视图是没有必要的：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\View\View;

class Alert extends Component
{
    /**
     * 创建组件实例。
     */
    public function __construct(
        public string $type,
        public string $message,
    ) {}

    /**
     * 获取表示组件的视图/内容。
     */
    public function render(): View
    {
        return view('components.alert');
    }
}
```

当你的组件被渲染时，你可以通过名称回显你的组件的公共变量的内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

#### 命名约定

组件构造函数的参数应该使用 `camelCase` 指定，而在 HTML 属性中引用参数名称时应该使用 `kebab-case`。例如，给定以下组件构造函数：

```php
/**
 * 创建组件实例。
 */
public function __construct(
    public string $alertType,
) {}
```

`$alertType` 参数可以这样提供给组件：

```blade
<x-alert alert-type="danger" />
```

#### 短属性语法

传递属性给组件时，你还可以使用“短属性”语法。这经常很方便，因为属性名称经常与它们对应的变量名称匹配：

```blade
{{-- 短属性语法... --}}
<x-profile :$userId :$name />

{{-- 等同于... --}}
<x-profile :user-id="$userId" :name="$name" />
```

#### 转义属性渲染

因为一些 JavaScript 框架（如 Alpine.js）也使用前缀为冒号的属性，你可以使用双冒号（`::`）前缀来告知 Blade 该属性不是 PHP 表达式。例如，给定以下组件：

```blade
<x-button ::class="{ danger: isDeleting }">
    提交
</x-button>
```

Blade 将渲染以下 HTML：

```blade
<button :class="{ danger: isDeleting }">
    提交
</button>
```

#### 组件方法

除了公共变量可用于你的组件模板外，组件上的任何公共方法也可以被调用。例如，想象一个具有 `isSelected` 方法的组件：

```php
/**
 * 判断给定的选项是否是当前选中的选项。
 */
public function isSelected(string $option): bool
{
    return $option === $this->selected;
}
```

你可以通过调用与方法名称匹配的变量，在你的组件模板中执行该方法：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

#### 在组件类中访问属性和插槽

Blade 组件还允许你在类的 `render` 方法中访问组件名，属性和插槽。然而，为了访问这些数据，你应该从组件的 `render` 方法返回一个闭包。闭包将接收一个 `$data` 数组作为其唯一参数。此数组将包含几个元素，提供有关组件的信息：

```php
use Closure;

/**
 * 获取表示组件的视图/内容。
 */
public function render(): Closure
{
    return function (array $data) {
        // $data['componentName'];
        // $data['attributes'];
        // $data['slot'];

        return '<div>组件内容</div>';
    };
}
```

`componentName` 等于 HTML 标签中的 `x-` 前缀后的名称。所以 `<x-alert />` 的 `componentName` 将是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个 `Illuminate\Support\HtmlString` 实例，它包含组件插槽的内容。

闭包应该返回一个字符串。如果返回的字符串对应于一个现有的视图，该视图将被渲染；否则，返回的字符串将被视为内联 Blade 视图进行求值。

#### 额外的依赖项

如果你的组件需要来自 Laravel [服务容器](/docs/11/architecture-concepts/container)的依赖项，你可以在组件的数据属性之前列出它们，它们将自动被容器注入：

```php
use App\Services\AlertCreator;

/**
 * 创建组件实例。
 */
public function __construct(
    public AlertCreator $creator,
    public string $type,
    public string $message,
) {}
```

#### 隐藏属性/方法

如果你想防止某些公共方法或属性作为变量暴露给你的组件模板，你可以将它们添加到组件上的 `$except` 数组属性中：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * 不应该暴露给组件模板的属性/方法。
     *
     * @var array
     */
    protected $except = ['type'];

    /**
     * 创建组件实例。
     */
    public function __construct(
        public string $type,
    ) {}
}
```

### 组件属性

我们已经研究了如何向组件传递数据属性；然而，有时你可能需要指定额外的 HTML 属性，例如 `class`，这些属性不是组件运行所需的数据的一部分。通常，你希望将这些额外的属性传递给组件模板的根元素。例如，假设我们想这样渲染一个 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不是组件构造函数的一部分的属性将自动添加到组件的“属性包”中。这个属性包会自动通过 `$attributes` 变量提供给组件。可以通过回显这个变量，在组件内渲染所有的属性：

```blade
<div {{ $attributes }}>
    <!-- 组件内容 -->
</div>
```

> [!WARNING]  
> 目前不支持在组件标签内使用如 `@env` 这样的指令。例如，`<x-alert :live="@env('production')"/>` 将不会被编译。

#### 默认/合并属性

有时你可能需要为属性指定默认值，或者将额外的值合并到组件的某些属性中。为此，你可以使用属性包的 `merge` 方法。这个方法对于定义一组应该始终应用于组件的默认 CSS 类特别有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

如果我们假设这个组件被这样使用：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

组件的最终，渲染的 HTML 将如下所示：

```blade
<div class="mb-4 alert alert-error">
    <!-- $message 变量的内容 -->
</div>
```

#### 条件合并类

有时你可能希望合并类，如果给定条件为 `true`。你可以通过 `class` 方法实现这一目标，该方法接受一个类数组，其中数组键包含你希望添加的类，而值是一个布尔表达式。如果数组元素具有数字键，它将始终包含在渲染的类列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果你需要将其他属性合并到你的组件上，你可以在 `class` 方法上链接 `merge` 方法：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> [!NOTE]  
> 如果你需要在其他不应接收合并属性的 HTML 元素上有条件地编译类，你可以使用 [`@class` 指令](#conditional-classes)。

#### 非类属性合并

合并不是 `class` 属性的属性时，提供给 `merge` 方法的值将被视为属性的“默认”值。然而，与 `class` 属性不同，这些属性不会与注入的属性值合并。相反，它们将被覆盖。例如，`button` 组件的实现可能如下所示：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要用自定义的 `type` 渲染按钮组件，可以在使用组件时指定它。如果没有指定类型，则将使用 `button` 类型：

```blade
<x-button type="submit">
    提交
</x-button>
```

在这个例子中，`button` 组件渲染的 HTML 会是：

```blade
<button type="submit">
    提交
</button>
```

如果你希望 `class` 之外的其他属性将其默认值和注入的值连接在一起，你可以使用 `prepends` 方法。在这个例子中，`data-controller` 属性将始终以 `profile-controller` 开头，并且任何额外注入的 `data-controller` 值将放在这个默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

#### 检索和过滤属性

你可以使用 `filter` 方法过滤属性。此方法接受一个闭包应该返回 `true` 如果你希望保留在属性包中的属性：

```blade
{{ $attributes->filter(fn (string $value, string $key) => $key == 'foo') }}
```

为了方便起见，你可以使用 `whereStartsWith` 方法来检索所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，`whereDoesntStartWith` 方法可以用来排除所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，你可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果你想检查组件上是否存在属性，可以使用 `has` 方法。该方法接受属性名称作为唯一参数，并返回一个布尔值，指示属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class 属性存在</div>
@endif
```

如果数组被传递给 `has` 方法，该方法将确定是否所有给定的属性都存在于组件上：

```blade
@if ($attributes->has(['name', 'class']))
    <div>所有属性都存在</div>
@endif
```

`hasAny` 方法可以用来确定是否任何给定的属性存在于组件上：

```blade
@if ($attributes->hasAny(['href', ':href', 'v-bind:href']))
    <div>其中一个属性存在</div>
@endif
```

你可以使用 `get` 方法检索特定属性的值：

```blade
{{ $attributes->get('class') }}
```

### 保留关键字

默认情况下，一些关键字为 Blade 内部使用保留，以便渲染组件。以下关键字不能在你的组件中定义为公共属性或方法名称：

- `data`
- `render`
- `resolveView`
- `shouldRender`
- `view`
- `withAttributes`
- `withName`

### 插槽

在使用组件时，你经常需要通过“插槽”传递额外的内容。组件插槽通过回显 `$slot` 变量来渲染。为了探索这个概念，让我们假设 `alert` 组件具有以下标记：

```blade
<!-- /resources/views/components/alert.blade.php -->

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

我们可以通过向组件注入内容来向 `slot` 传递内容：

```blade
<x-alert>
    <strong>哎呀！</strong> 出问题了！
</x-alert>
```

有时，组件可能需要在组件内的不同位置渲染多个不同的插槽。让我们修改我们的警告组件，以允许注入一个 "title" 插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以使用 `x-slot` 标签定义命名插槽的内容。任何没有明确放在 `x-slot` 标签内的内容都将通过 `$slot` 变量传递给组件：

```xml
<x-alert>
    <x-slot:title>
        服务器错误
    </x-slot>

    <strong>哎呀！</strong> 出问题了！
</x-alert>
```

你可以调用插槽的 `isEmpty` 方法来确定插槽是否包含内容：

```blade
<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    @if ($slot->isEmpty())
        如果插槽为空，则这是默认内容。
    @else
        {{ $slot }}
    @endif
</div>
```

此外，`hasActualContent` 方法可用于确定插槽是否包含除 HTML 注释外的任何“实际”内容：

```blade
@if ($slot->hasActualContent())
    插槽含有非注释内容。
@endif
```

#### 有作用域的插槽

如果你使用过 Vue 这样的 JavaScript 框架，你可能熟悉“有作用域的插槽”，它允许你在插槽中访问组件的数据或方法。你可以通过在你的组件上定义公共方法或属性，并通过 `$component` 变量在你的插槽中访问组件，来实现类似的行为。在这个例子中，我们将假设 `x-alert` 组件的组件类上定义了一个公共的 `formatAlert` 方法：

```blade
<x-alert>
    <x-slot:title>
        {{ $component->formatAlert('服务器错误') }}
    </x-slot>

    <strong>哎呀！</strong> 出问题了！
</x-alert>
```

#### 插槽属性

像 Blade 组件一样，你可以为插槽指定额外的[属性](#component-attributes)，如 CSS 类名：

```xml
<x-card class="shadow-sm">
    <x-slot:heading class="font-bold">
        标题
    </x-slot>

    内容

    <x-slot:footer class="text-sm">
        底部
    </x-slot>
</x-card>
```

要与插槽属性交互，你可以访问插槽变量的 `attributes` 属性。有关如何与属性交互的更多信息，请查阅有关[组件属性](#component-attributes)的文档：

```blade
@props([
    'heading',
    'footer',
])

<div {{ $attributes->class(['border']) }}>
    <h1 {{ $heading->attributes->class(['text-lg']) }}>
        {{ $heading }}
    </h1>

    {{ $slot }}

    <footer {{ $footer->attributes->class(['text-gray-700']) }}>
        {{ $footer }}
    </footer>
</div>
```

### 内联组件视图

对于非常小的组件，管理组件类和组件的视图模板可能会感觉很繁琐。因此，你可以直接从 `render` 方法返回组件的标记：

```php
/**
 * 获取表示组件的视图/内容。
 */
public function render(): string
{
    return <<<'blade'
        <div class="alert alert-danger">
            {{ $slot }}
        </div>
    blade;
}
```

#### 生成内联视图组件

要创建一个渲染内联视图的组件，你可以在执行 `make:component` 命令时使用 `inline` 选项：

```shell
php artisan make:component Alert --inline
```

### 动态组件

有时你可能需要渲染一个组件，但直到运行时才知道应该渲染哪个组件。在这种情况下，你可以使用 Laravel 内置的 `dynamic-component` 组件来根据运行时值或变量渲染组件：

```blade
// $componentName = "secondary-button";

<x-dynamic-component :component="$componentName" class="mt-4" />
```

### 手动注册组件

> [!WARNING]  
> 手动注册组件的以下文档主要适用于为 Laravel 包编写包含视图组件的开发者。如果你没有编写包，那么组件文档的这一部分可能与你无关。

在为自己的应用程序编写组件时，组件会自动在 `app/View/Components` 目录和 `resources/views/components` 目录中被发现。

然而，如果你正在构建一个使用 Blade 组件的包，或者在非常规目录中放置组件，你将需要手动注册你的组件类和它的 HTML 标签别名，以便 Laravel 知道在哪里找到组件。你通常应该在包的服务提供者的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 启动你的包服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

一旦你的组件被注册，可以使用它的标签别名渲染它：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按照约定自动加载组件类。例如，一个 `Nightshade` 包可能有位于 `Package\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 启动你的包服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许使用包组件通过他们的供应商命名空间使用 `package-name::` 语法：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会自动检测与此组件相关联的类名，通过 `pascal casing` 组件名称。子目录也支持使用“点”(`dot`)符号表示法。

## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件管理组件的机制。然而，匿名组件使用单个视图文件并没有关联的类。要定义匿名组件，你只需要将一个 Blade 模板放到 `resources/views/components` 目录中。例如，假设你在 `resources/views/components/alert.blade.php` 定义了一个组件，你可以这样简单地渲染它：

```blade
<x-alert/>
```

你可以使用 `.` 字符来指明组件是否嵌套在 `components` 目录内更深层。例如，假设组件定义在 `resources/views/components/inputs/button.blade.php`，你可以这样渲染它：

```blade
<x-inputs.button/>
```

### 匿名索引组件

有时，当一个组件由许多 Blade 模板组成时，你可能希望将给定组件的模板组合在一个目录内。例如，设想一个具有以下目录结构的 "accordion" 组件：

```php
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

这个目录结构允许你这样渲染手风琴组件及其子项：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

然而，为了通过 `x-accordion` 渲染手风琴组件，我们被迫将 "index" 手风琴组件模板放在 `resources/views/components` 目录中，而不是将其与其他手风琴相关模板一起嵌套在 `accordion` 目录中。

幸运的是，Blade 允许你在组件的模板目录中放置一个 `index.blade.php` 文件。当组件存在 `index.blade.php` 模板时，它将作为组件的 "root" 节点渲染。所以，我们可以继续使用上面示例中的相同 Blade 语法；但是，我们将调整我们的目录结构如下：

```php
/resources/views/components/accordion/index.blade.php
/resources/views/components/accordion/item.blade.php
```

### 数据属性/属性

既然匿名组件没有任何关联的类，你可能想知道如何区分哪些数据应该作为变量传递给组件，哪些属性应该放在组件的 [属性包](#component-attributes) 中。

你可以在组件的 Blade 模板顶部使用 `@props` 指令来指定哪些属性应该被视为数据变量。组件上的所有其他属性将通过组件的属性包提供。如果你希望给数据变量一个默认值，你可以将变量名称作为数组键，将默认值作为数组值指定：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

根据上面的组件定义，我们可以这样渲染组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

### 访问父组件数据

有时你可能希望在子组件内访问父组件的数据。在这些情况下，你可以使用 `@aware` 指令。例如，设想我们正在构建由父 `<x-menu>` 和子 `<x-menu.item>` 组成的复杂菜单组件：

```blade
<x-menu color="purple">
    <x-menu.item>...</x-menu.item>
    <x-menu.item>...</x-menu.item>
</x-menu>
```

`<x-menu>` 组件的实现可能如下所示：

```blade
<!-- /resources/views/components/menu/index.blade.php -->

@props(['color' => 'gray'])

<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}>
    {{ $slot }}
</ul>
```

因为 `color` 属性只传递给了父组件 (`<x-menu>`)，所以它在 `<x-menu.item>` 内不可用。然而，如果我们使用 `@aware` 指令，我们也可以在 `<x-menu.item>` 中使用它：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> [!WARNING]  
> `@aware` 指令不能访问未明确通过 HTML 属性传递给父组件的父组件数据。未明确传递给父组件的默认 `@props` 值不能被 `@aware` 指令访问。

### 匿名组件路径

如前所述，匿名组件通常通过在 `resources/views/components` 目录中放置一个 Blade 模板来定义。然而，除了默认路径，你可能偶尔想向 Laravel 注册其他匿名组件路径。

`anonymousComponentPath` 方法接受匿名组件位置的“路径”作为其第一个参数，以及可选的“命名空间”，组件应该放在其第二个参数下。通常，此方法应该从应用程序的 [服务提供者](/docs/11/architecture-concepts/providers) 之一的 `boot` 方法中调用：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

当组件路径没有指定前缀注册时，如上例所示，它们也可以在 Blade 组件中渲染，而不需要对应的前缀。例如，如果在上面注册的路径中存在一个 `panel.blade.php` 组件，它可以这样渲染：

```blade
<x-panel />
```

前缀 "命名空间" 可以作为 `anonymousComponentPath` 方法的第二个参数提供：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

当提供了前缀时，此 "命名空间" 中的组件在渲染时可以通过在组件名称前加上组件的命名空间来渲染：

```blade
<x-dashboard::panel />
```

## 构建布局

### 使用组件构建布局

大多数 Web 应用程序在不同页面上保持相同的一般布局。如果我们必须在每个我们创建的视图中重复整个布局 HTML，维护我们的应用程序将是非常繁琐和难以维护的。幸运的是，将这种布局定义为单个 [Blade 组件](#components) 然后在我们的应用程序中使用它非常方便。

#### 定义布局组件

例如，设想我们正在构建一个 "待办事项" 列表应用程序。我们可能定义一个如下所示的 `layout` 组件：

```blade
<!-- resources/views/components/layout.blade.php -->

<html>
    <head>
        <title>{{ $title ?? '待办事项管理器' }}</title>
    </head>
    <body>
        <h1>待办事项</h1>
        <hr/>
        {{ $slot }}
    </body>
</html>
```

#### 应用布局组件

一旦定义了 `layout` 组件，我们可以创建一个使用该组件的 Blade 视图。在这个例子中，我们将定义一个简单的视图来显示我们的任务列表：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        {{ $task }}
    @endforeach
</x-layout>
```

记住，注入组件的内容将在我们的 `layout` 组件中提供给默认的 `$slot` 变量。正如你可能已经注意到的，我们的 `layout` 还会尊重提供的 `$title` 插槽，如果有的话；否则，会显示默认标题。我们可以使用在[组件文档](#components)中讨论的标准插槽语法从任务列表视图注入自定义标题：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    <x-slot:title>
        自定义标题
    </x-slot>

    @foreach ($tasks as $task)
        {{ $task }}
    @endforeach
</x-layout>
```

现在我们已经定义了布局和任务列表视图，我们只需要从路由返回 `task` 视图：

```php
use App\Models\Task;

Route::get('/tasks', function () {
    return view('tasks', ['tasks' => Task::all()]);
});
```

#### 定义布局

布局也可以通过“模板继承”创建。这是在引入[组件](#components)之前构建应用程序的主要方式。

让我们从一个简单的例子开始。首先，我们将查看一个页面布局。由于大多数 Web 应用程序在不同页面上保持相同的一般布局，因此将这种布局定义为单个 Blade 视图是很方便的：

```blade
<!-- resources/views/layouts/app.blade.php -->

<html>
    <head>
        <title>应用名称 - @yield('title')</title>
    </head>
    <body>
        @section('sidebar')
            这是主侧边栏。
        @show

        <div class="container">
            @yield('content')
        </div>
    </body>
</html>
```

如你所见，这个文件包含典型的 HTML 标记。然而，请注意 `@section` 和 `@yield` 指令。`@section` 指令，顾名思义，定义了内容的一部分，而 `@yield` 指令用于显示给定部分的内容。

现在我们定义了应用程序的布局，让我们定义一个继承布局的子页面。

#### 扩展布局

在定义子视图时，使用 `@extends` Blade 指令指定子视图应该“继承”哪个布局。扩展了 Blade 布局的视图可以使用 `@section` 指令注入内容到布局的部分中。请记住，如上例所示，这些部分的内容将使用 `@yield` 在布局中显示：

```blade
<!-- resources/views/child.blade.php -->

@extends('layouts.app')

@section('title', '页面标题')

@section('sidebar')
    @parent

    <p>这部分追加到主侧边栏。</p>
@endsection

@section('content')
    <p>这是我的正文内容。</p>
@endsection
```

在这个例子中，`sidebar` 部分使用 `@parent` 指令来追加（而不是覆盖）内容到布局的侧边栏。`@parent` 指令在视图渲染时会被布局的内容替换。

> [!NOTE]  
> 与前面的例子相反，这个 `sidebar` 部分以 `@endsection` 而不是 `@show` 结束。`@endsection` 指令仅定义一个部分，而 `@show` 将定义并**立即呈现**这一部分。

`@yield` 指令也接受默认值作为其第二个参数。如果被 yield 的部分未定义，则会渲染此值：

```blade
@yield('content', '默认内容')
```

## 表单

### CSRF 字段

无论何时在应用程序中定义 HTML 表单，你都应该在表单中包含一个隐藏的 CSRF 令牌字段，以便[CSRF 保护](/docs/11/basics/csrf)中间件可以验证请求。你可以使用 `@csrf` Blade 指令来生成令牌字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

### 方法字段

由于 HTML 表单不能发起 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来模拟这些 HTTP 动词。`@method` Blade 指令可以为你创建这个字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

### 验证错误

`@error` 指令可用于快速检查给定属性是否存在[验证错误信息](/docs/11/basics/validation#quick-displaying-the-validation-errors)。在 `@error` 指令内部，你可以回显 `$message` 变量来显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">帖子标题</label>

<input id="title"
    type="text"
    class="@error('title') is-invalid @enderror">

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

由于 `@error` 指令编译为一个 “if” 语句，你可以使用 `@else` 指令来渲染当属性没有错误时的内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">邮箱地址</label>

<input id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror">
```

你可以将[特定错误包的名称](/docs/11/basics/validation#named-error-bags)作为第二个参数传递给 `@error` 指令，以在包含多个表单的页面上检索验证错误信息：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">邮箱地址</label>

<input id="email"
    type="email"
    class="@error('email', 'login') is-invalid @enderror">

@error('email', 'login')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

## 堆栈

Blade 允许你推送到命名堆栈，这些命名堆栈可以在其他视图或布局中的其他地方渲染。对于指定子视图所需的任何 JavaScript 库来说，这特别有用：

```blade
@push('scripts')
    <script src="/example.js"></script>
@endpush
```

如果你希望在给定的布尔表达式评估为 `true` 时 `@push` 内容，你可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

你可以根据需要多次推送到一个堆栈。要渲染完整的堆栈内容，将堆栈的名称传递给 `@stack` 指令：

```blade
<head>
    <!-- 头部内容 -->

    @stack('scripts')
</head>
```

如果你希望在堆栈的开始处预置内容，你应该使用 `@prepend` 指令：

```blade
@push('scripts')
    这会是第二个...
@endpush

// 后来...

@prepend('scripts')
    这会是第一个...
@endprepend
```

## 服务注入

`@inject` 指令可用于从 Laravel [服务容器](/docs/11/architecture-concepts/container)中检索服务。传递给 `@inject` 的第一个参数是服务将被放入的变量的名称，第二个参数是你希望解析的服务的类或接口名称：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    每月收入：{{ $metrics->monthlyRevenue() }}。
</div>
```

## 渲染内联 Blade 模板

有时你可能需要将原始的 Blade 模板字符串转换为有效的 HTML。你可以使用 `Blade` facade 提供的 `render` 方法来完成这项工作。`render` 方法接受 Blade 模板字符串和一个可选的数组，该数组提供给模板的数据：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 通过将内联 Blade 模板写入 `storage/framework/views` 目录来渲染它们。如果你希望 Laravel 在渲染 Blade 模板后删除这些临时文件，你可以为该方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

## 渲染 Blade 片段

在使用 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，你可能偶尔需要在 HTTP 响应中只返回 Blade 模板的一部分。Blade "片段" 允许你做到这一点。要开始，将模板的一部分放在 `@fragment` 和 `@endfragment` 指令之间：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，在渲染使用此模板的视图时，你可以调用 `fragment` 方法指定只有指定的片段应包含在传出的 HTTP 响应中：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件有条件地返回视图的一部分。否则，将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许你在响应中返回多个视图片段。片段将被串联在一起：

```php
view('dashboard', ['users' => $users])
    ->fragments(['user-list', 'comment-list']);

view('dashboard', ['users' => $users])
    ->fragmentsIf(
        $request->hasHeader('HX-Request'),
        ['user-list', 'comment-list']
    );
```

## 扩展 Blade

Blade 允许你使用 `directive` 方法定义自己的自定义指令。当 Blade 编译器遇到自定义指令时，它将调用提供的回调函数并传入指令包含的表达式。

以下示例创建了一个 `@datetime($var)` 指令，该指令格式化给定的 `$var`，`$var` 应该是 `DateTime` 实例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        Blade::directive('datetime', function (string $expression) {
            return "<?php echo ($expression)->format('m/d/Y H:i'); ?>";
        });
    }
}
```

如你所见，我们将对传入指令的任何表达式进行 `format` 方法的链接。所以，在这个例子中，该指令最终生成的 PHP 将是：

```php
<?php echo ($var)->format('m/d/Y H:i'); ?>
```

> [!WARNING]  
> 更新 Blade 指令逻辑后，你需要删除所有缓存的 Blade 视图。可以使用 `view:clear` Artisan 命令删除缓存的 Blade 视图。

### 自定义 Echo 处理程序

如果你尝试使用 Blade "回显" 一个对象，对象的 `__toString` 方法会被调用。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 的内置 "魔术方法" 之一。然而，有时你可能无法控制给定类的 `__toString` 方法，比如当你需要交互的类属于第三方库时。

在这些情况下，Blade 允许你为那个特定类型的对象注册一个自定义的 echo 处理程序。要做到这一点，你应该调用 Blade 的 `stringable` 方法。`stringable` 方法接受一个闭包。这个闭包应该类型提示它负责渲染的对象的类型。通常，应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用 `stringable` 方法：

```php
use Illuminate\Support\Facades\Blade;
use Money\Money;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Blade::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

一旦定义了自定义 echo 处理程序，你可以在 Blade 模板中简单地回显对象：

```blade
成本：{{ $money }}
```

### 自定义 If 语句

编写自定义指令有时比定义简单的自定义条件语句更复杂。因此，Blade 提供了 `Blade::if` 方法，该方法允许你使用闭包快速定义自定义条件指令。例如，让我们定义一个检查应用程序配置的默认“磁盘”的自定义条件。我们可以在 `AppServiceProvider` 的 `boot` 方法中这样做：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Blade::if('disk', function (string $value) {
        return config('filesystems.default') === $value;
    });
}
```

一旦定义了自定义条件，你就可以在模板中使用它：

```blade
@disk('local')
    <!-- 应用程序正在使用本地磁盘... -->
@elsedisk('s3')
    <!-- 应用程序正在使用 s3 磁盘... -->
@else
    <!-- 应用程序正在使用其他磁盘... -->
@enddisk

@unlessdisk('local')
    <!-- 应用程序未使用本地磁盘... -->
@enddisk
```
