---
title: Laravel 多语言/本地化
---

# 本地化

[[toc]]

## 介绍

> [!NOTE]
> 默认情况下，Laravel 应用程序框架不包括 `lang` 目录。如果您想自定义 Laravel 的语言文件，您可以通过 `lang:publish` Artisan 命令发布它们。

Laravel 的本地化特性提供了一种方便的方法来检索不同语言的字符串，使您能够在应用程序中轻松支持多种语言。

Laravel 提供了两种管理翻译字符串的方法。首先，语言字符串可以存储在应用程序的 `lang` 目录中的文件里。在这个目录中，可能有每种应用程序支持的语言的子目录。这是 Laravel 用来管理内置 Laravel 功能（如验证错误消息）的翻译字符串的方法：

```php

/lang
/en
    messages.php
/es
    messages.php
```

或者，翻译字符串可以定义在放置在 `lang` 目录中的 JSON 文件里。采用这种方式时，您的应用程序支持的每种语言都将有一个相应的 JSON 文件在这个目录中。对于拥有大量可翻译字符串的应用程序，推荐这种方法：

```json
/lang
    en.json
    es.json

```

我们将在本文档中讨论每种管理翻译字符串的方法。

### 发布语言文件

默认情况下，Laravel 应用程序框架不包括 `lang` 目录。如果您想自定义 Laravel 的语言文件或创建您自己的，您应该通过 `lang:publish` Artisan 命令搭建 `lang` 目录。`lang:publish` 命令将在您的应用程序中创建 `lang` 目录，并发布 Laravel 使用的默认语言文件集：

```shell
php artisan lang:publish
```

### 配置区域设置

您的应用程序的默认语言存储在 `config/app.php` 配置文件的 `locale` 配置选项中，该选项通常使用 `APP_LOCALE` 环境变量设置。您可以自由修改此值以适应您的应用程序的需求。

您还可以配置一个 "备用语言"，当默认语言不包含给定的翻译字符串时，将使用该语言。与默认语言一样，备用语言也在 `config/app.php` 配置文件中配置，其值通常使用 `APP_FALLBACK_LOCALE` 环境变量设置。

您可以使用 `App` facade 提供的 `setLocale` 方法在运行时为单个 HTTP 请求修改默认语言：

```php
use Illuminate\Support\Facades\App;

Route::get('/greeting/{locale}', function (string $locale) {
    if (! in_array($locale, ['en', 'es', 'fr'])) {
        abort(400);
    }

    App::setLocale($locale);

    // ...
});
```

#### 确定当前区域设置

您可以使用 `App` facade 上的 `currentLocale` 和 `isLocale` 方法来确定当前区域设置或检查区域设置是否为给定值：

```php
use Illuminate\Support\Facades\App;

$locale = App::currentLocale();

if (App::isLocale('en')) {
    // ...
}
```

### 复数化语言

您可以指示 Laravel 的 "复数器"，它由 Eloquent 和框架的其他部分使用，将单数字符串转换为复数字符串，使用英语以外的其他语言。这可以通过在您的应用程序的服务提供者之一的 `boot` 方法中调用 `useLanguage` 方法来实现。复数器当前支持的语言有：`french`、`norwegian-bokmal`、`portuguese`、`spanish` 和 `turkish`：

```php
use Illuminate\Support\Pluralizer;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Pluralizer::useLanguage('spanish');

    // ...
}
```

> [!WARNING]
> 如果您自定义了复数器的语言，您应该明确定义您的 Eloquent 模型的[表名](/docs/11/eloquent/eloquent#table-names)。

## 定义翻译字符串

### 使用短键

通常，翻译字符串存储在 `lang` 目录中的文件里。在这个目录中，应该为您的应用程序支持的每种语言设置一个子目录。这是 Laravel 用来管理内置 Laravel 功能（如验证错误消息）的翻译字符串的方法：

```
/lang
    /en
        messages.php
    /es
        messages.php
```

所有语言文件都返回一个键值字符串数组。例如：

```php
<?php

// lang/en/messages.php

return [
    'welcome' => 'Welcome to our application!',
];
```

> [!WARNING]
> 对于根据领土差异的语言，您应根据 ISO 15897 来命名语言目录。例如，"en_GB" 应该用于英式英语而不是 "en-gb"。

### 使用翻译字符串作为键

对于具有大量可翻译字符串的应用程序，对每个由应用程序支持的翻译字符串不断发明键可能会让人在引用视图中的键时感到混乱，并且很麻烦。

因此，Laravel 还支持使用字符串的 "默认" 翻译作为键来定义翻译字符串。使用翻译字符串作为键的语言文件作为 JSON 文件存储在 `lang` 目录中。例如，如果您的应用程序有一个西班牙语翻译，应该创建一个 `lang/es.json` 文件：

```json
{
  "I love programming.": "Me encanta programar."
}
```

#### 键/文件冲突

您不应该定义与其他翻译文件名冲突的翻译字符串键。例如，为 "NL" 区域设置翻译 `__('Action')` 而 `nl/action.php` 文件存在但 `nl.json` 文件不存在时，翻译器将返回 `nl/action.php` 文件的全部内容。

## 检索翻译字符串

您可以使用 `__` 帮助函数从语言文件中检索翻译字符串。如果您使用 "短键" 来定义翻译字符串，您应该使用 "点" 语法将包含键的文件和键本身传递给 `__` 函数。例如，让我们从 `lang/en/messages.php` 语言文件中检索 `welcome` 翻译字符串：

```php
echo __('messages.welcome');
```

如果指定的翻译字符串不存在，`__` 函数将返回翻译字符串键。因此，使用上面的例子，如果翻译字符串不存在，`__` 函数将返回 `messages.welcome`。

如果您正在使用[默认翻译字符串作为您的翻译键](#using-translation-strings-as-keys)，您应该将字符串的默认翻译传递给 `__` 函数：

```php
echo __('I love programming.');
```

同样，如果翻译字符串不存在，`__` 函数将返回它得到的翻译字符串键。

如果您使用的是 [Blade 模板引擎](/docs/11/basics/blade)，您可以使用 `{{ }}` 回声语法来显示翻译字符串：

```php
{{ __('messages.welcome') }}
```

### 替换翻译字符串中的参数

如果需要，您可以在翻译字符串中定义占位符。所有占位符都以 `:` 前缀。例如，您可以定义一条带有占位符名称的欢迎消息：

```php
'welcome' => 'Welcome, :name',
```

要在检索翻译字符串时替换占位符，您可以将替换数组作为第二个参数传递给 `__` 函数：

```php
echo __('messages.welcome', ['name' => 'dayle']);
```

如果您的占位符包含全部大写字母，或者只有首字母大写，翻译值将相应地大写：

```php
'welcome' => 'Welcome, :NAME', // Welcome, DAYLE
'goodbye' => 'Goodbye, :Name', // Goodbye, Dayle
```

#### 对象替换格式化

如果您尝试将一个对象作为翻译占位符提供，将调用对象的 `__toString` 方法。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 的内置 "魔法方法" 之一。然而，有时您可能无法控制给定类的 `__toString` 方法，例如当您需要交互的类属于第三方库时。

在这些情况下，Laravel 允许您为那种特定类型的对象注册一个自定义的格式化处理器。为此，您应该调用翻译者的 `stringable` 方法。`stringable` 方法接受一个闭包，闭包应该对它负责格式化的对象类型进行类型提示。通常，应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用 `stringable` 方法：

```php
use Illuminate\Support\Facades\Lang;
use Money\Money;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Lang::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

### 复数化

复数化是一个复杂的问题，因为不同的语言有一系列复杂的复数化规则；不过，Laravel 可以帮助您根据您定义的复数化规则不同地翻译字符串。使用 `|` 字符，您可以区分字符串的单数和复数形式：

```php
'apples' => 'There is one apple|There are many apples',
```

当然，复数化也支持在[使用翻译字符串作为键](#using-translation-strings-as-keys)时：

```json
{
  "There is one apple|There are many apples": "Hay una manzana|Hay muchas manzanas"
}
```

您甚至可以创建更复杂的复数化规则，其中指定了多个值范围的翻译字符串：

```php
'apples' => '{0} There are none|[1,19] There are some|[20,*] There are many',
```

在定义了具有复数化选项的翻译字符串后，您可以使用 `trans_choice` 函数根据给定的 "数量" 获取行。在这个例子中，由于数量大于一，返回了翻译字符串的复数形式：

```php
echo trans_choice('messages.apples', 10);
```

您也可以在复数化字符串中定义占位符属性。这些占位符可以通过将数组作为第三个参数传递给 `trans_choice` 函数来替换：

```php
'minutes_ago' => '{1} :value minute ago|[2,*] :value minutes ago',

echo trans_choice('time.minutes_ago', 5, ['value' => 5]);
```

如果您想显示传递给 `trans_choice` 函数的整数值，您可以使用内置的 `:count` 占位符：

```php
'apples' => '{0} There are none|{1} There is one|[2,*] There are :count',
```

## 覆盖包语言文件

一些包可能会附带它们自己的语言文件。为了调整这些行，您可以通过将文件放在 `lang/vendor/{package}/{locale}` 目录中来覆盖它们，而不是更改包的核心文件。

因此，例如，如果您需要覆盖名为 `skyrim/hearthfire` 的包中 `messages.php` 的英文翻译字符串，您应该在 `lang/vendor/hearthfire/en/messages.php` 放置一个语言文件。在这个文件中，您只应该定义您希望覆盖的翻译字符串。您没有覆盖的任何翻译字符串将仍然从包的原始语言文件加载。
