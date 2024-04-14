---
title: Laravel 字符串
---

# 字符串

[[toc]]

## 简介

Laravel 包含多种用于操作字符串值的函数。这些函数很多在框架自身中就有使用；然而，如果您发现它们方便，也可以在自己的应用程序中自由使用它们。

## 字符串

#### `__()` {.collection-method}

`__` 函数根据您的[语言文件](/docs/11/digging-deeper/localization)翻译给定的翻译字符串或翻译键：

```php
echo __('Welcome to our application');

echo __('messages.welcome');
```

如果指定的翻译字符串或键不存在，`__` 函数将返回给定的值。因此，使用上面的例子，如果翻译键不存在，`__` 函数将返回 `messages.welcome`。

#### `class_basename()` {.collection-method}

`class_basename` 函数返回给定类的类名，并移除类的命名空间：

```php
$class = class_basename('Foo\Bar\Baz');

// Baz
```

#### `e()` {.collection-method}

`e` 函数运行 PHP 的 `htmlspecialchars` 函数，默认将 `double_encode` 选项设置为 `true`：

```php
echo e('<html>foo</html>');

// &lt;html&gt;foo&lt;/html&gt;
```

#### `preg_replace_array()` {.collection-method}

`preg_replace_array` 函数使用数组顺序替换字符串中给定的模式：

```php
$string = 'The event will take place between :start and :end';

$replaced = preg_replace_array('/:[a-z_]+/', ['8:30', '9:00'], $string);

// The event will take place between 8:30 and 9:00
```

#### `Str::after()` {.collection-method}

`Str::after` 方法返回字符串中给定值后面的所有内容。如果字符串中不存在该值，则返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::after('This is my name', 'This is');

// ' my name'
```

#### `Str::afterLast()` {.collection-method}

`Str::afterLast` 方法返回字符串中最后一次出现给定值之后的所有内容。如果字符串中不存在该值，则返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::afterLast('App\Http\Controllers\Controller', '\\');

// 'Controller'
```

#### `Str::apa()` {.collection-method}

`Str::apa` 方法根据 [APA 指南](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case)将给定字符串转换为标题大小写格式：

```php
use Illuminate\Support\Str;

$title = Str::apa('Creating A Project');

// 'Creating a Project'
```

#### `Str::ascii()` {.collection-method}

`Str::ascii` 方法会尝试将字符串转换为 ASCII 值：

```php
use Illuminate\Support\Str;

$slice = Str::ascii('û');

// 'u'
```

#### `Str::before()` {.collection-method}

`Str::before` 方法返回给定值之前的字符串中的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::before('This is my name', 'my name');

// 'This is '
```

#### `Str::beforeLast()` {.collection-method}

`Str::beforeLast` 方法返回字符串中最后一次出现给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::beforeLast('This is my name', 'is');

// 'This '
```

#### `Str::between()` {.collection-method}

`Str::between` 方法返回字符串中两个值之间的部分：

```php
use Illuminate\Support\Str;

$slice = Str::between('This is my name', 'This', 'name');

// ' is my '
```

#### `Str::betweenFirst()` {.collection-method}

`Str::betweenFirst` 方法返回字符串中两个值之间最小可能部分：

```php
use Illuminate\Support\Str;

$slice = Str::betweenFirst('[a] bc [d]', '[', ']');

// 'a'
```

#### `Str::camel()` {.collection-method}

`Str::camel` 方法将给定字符串转换为 `camelCase`：

```php
use Illuminate\Support\Str;

$converted = Str::camel('foo_bar');

// 'fooBar'
```

#### `Str::charAt()` {.collection-method}

`Str::charAt` 方法返回指定索引处的字符。如果索引超出范围，则返回 `false`：

```php
use Illuminate\Support\Str;

$character = Str::charAt('This is my name.', 6);

// 's'
```

#### `Str::contains()` {.collection-method}

`Str::contains` 方法确定给定字符串是否包含给定值。该方法区分大小写：

```php
use Illuminate\Support\Str;

$contains = Str::contains('This is my name', 'my');

// true
```

您还可以传递一个值数组来确定给定字符串是否包含数组中的任何值：

```php
use Illuminate\Support\Str;

$contains = Str::contains('This is my name', ['my', 'foo']);

// true
```

#### `Str::containsAll()` {.collection-method}

`Str::containsAll` 方法确定给定字符串是否包含给定数组中的所有值：

```php
use Illuminate\Support\Str;

$containsAll = Str::containsAll('This is my name', ['my', 'name']);

// true
```

#### `Str::endsWith()` {.collection-method}

`Str::endsWith` 方法确定给定字符串是否以给定值结尾：

```php
use Illuminate\Support\Str;

$result = Str::endsWith('This is my name', 'name');

// true
```

您还可以传递一个值数组来确定给定字符串是否以数组中的任何值结尾：

```php
use Illuminate\Support\Str;

$result = Str::endsWith('This is my name', ['name', 'foo']);

// true

$result = Str::endsWith('This is my name', ['this', 'foo']);

// false
```

#### `Str::excerpt()` {.collection-method}

`Str::excerpt` 方法从给定字符串中提取与该字符串内第一个匹配短语相匹配的摘录：

```php
use Illuminate\Support\Str;

$excerpt = Str::excerpt('This is my name', 'my', [
    'radius' => 3
]);

// '...is my na...'
```

`radius` 选项，默认为 `100`，允许您定义在截断字符串的每一侧应该出现的字符数量。

此外，您可以使用 `omission` 选项来定义将添加到截断字符串前后的字符串：

```php
use Illuminate\Support\Str;

$excerpt = Str::excerpt('This is my name', 'name', [
    'radius' => 3,
    'omission' => '(...) '
]);

// '(...) my name'
```

#### `Str::finish()` {.collection-method}

`Str::finish` 方法在字符串末尾添加给定值的单个实例（如果它尚未以该值结尾）：

```php
use Illuminate\Support\Str;

$adjusted = Str::finish('this/string', '/');

// this/string/

$adjusted = Str::finish('this/string/', '/');

// this/string/
```

#### `Str::headline()` 方法 {.collection-method}

`Str::headline` 方法会根据大小写、连字符或下划线分隔的字符串转换成每个单词首字母大写且用空格分隔的字符串：

```php
use Illuminate\Support\Str;

$headline = Str::headline('steve_jobs');

// Steve Jobs

$headline = Str::headline('EmailNotificationSent');

// Email Notification Sent
```

#### `Str::inlineMarkdown()` 方法 {.collection-method}

`Str::inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换成内联 HTML。与 `markdown` 方法不同，它不会将所有生成的 HTML 包装在块级元素中：

```php
use Illuminate\Support\Str;

$html = Str::inlineMarkdown('**Laravel**');

// <strong>Laravel</strong>
```

#### Markdown 安全性

默认情况下，Markdown 支持原生 HTML，当与原生用户输入一起使用时，会暴露跨站脚本 (XSS) 漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或剥离原生 HTML，并且使用 `allow_unsafe_links` 选项来指定是否允许不安全的链接。如果你需要允许一些原生 HTML，你应该通过一个 HTML 净化器传递你编译的 Markdown：

```php
use Illuminate\Support\Str;

Str::inlineMarkdown('Inject: <script>alert("Hello XSS!");</script>', [
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// Inject: alert(&quot;Hello XSS!&quot;);
```

#### `Str::is()` 方法 {.collection-method}

`Str::is` 方法用来确定给定的字符串是否匹配给定的模式。星号可以用作通配符：

```php
use Illuminate\Support\Str;

$matches = Str::is('foo*', 'foobar');

// true

$matches = Str::is('baz*', 'foobar');

// false
```

#### `Str::isAscii()` 方法 {.collection-method}

`Str::isAscii` 方法确定给定的字符串是否是 7 位 ASCII：

```php
use Illuminate\Support\Str;

$isAscii = Str::isAscii('Taylor');

// true

$isAscii = Str::isAscii('ü');

// false
```

#### `Str::isJson()` 方法 {.collection-method}

`Str::isJson` 方法确定给定的字符串是否是有效的 JSON：

```php
use Illuminate\Support\Str;

$result = Str::isJson('[1,2,3]');

// true

$result = Str::isJson('{"first": "John", "last": "Doe"}');

// true

$result = Str::isJson('{first: "John", last: "Doe"}');

// false
```

#### `Str::isUrl()` 方法 {.collection-method}

`Str::isUrl` 方法确定给定的字符串是否是有效的 URL：

```php
use Illuminate\Support\Str;

$isUrl = Str::isUrl('http://example.com');

// true

$isUrl = Str::isUrl('laravel');

// false
```

`isUrl` 方法认为多种协议是有效的。但是，你可以指定哪些协议被认为是有效的，通过提供这些协议给 `isUrl` 方法：

```php
$isUrl = Str::isUrl('http://example.com', ['http', 'https']);
```

#### `Str::isUlid()` 方法 {.collection-method}

`Str::isUlid` 方法确定给定的字符串是否是有效的 ULID：

```php
use Illuminate\Support\Str;

$isUlid = Str::isUlid('01gd6r360bp37zj17nxb55yv40');

// true

$isUlid = Str::isUlid('laravel');

// false
```

#### `Str::isUuid()` 方法 {.collection-method}

`Str::isUuid` 方法确定给定的字符串是否是有效的 UUID：

```php
use Illuminate\Support\Str;

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de');

// true

$isUuid = Str::isUuid('laravel');

// false
```

#### `Str::kebab()` 方法 {.collection-method}

`Str::kebab` 方法将给定的字符串转换成 `kebab-case`：

```php
use Illuminate\Support\Str;

$converted = Str::kebab('fooBar');

// foo-bar
```

#### `Str::lcfirst()` 方法 {.collection-method}

`Str::lcfirst` 方法返回给定字符串的第一个字符小写：

```php
use Illuminate\Support\Str;

$string = Str::lcfirst('Foo Bar');

// foo Bar
```

#### `Str::length()` 方法 {.collection-method}

`Str::length` 方法返回给定字符串的长度：

```php
use Illuminate\Support\Str;

$length = Str::length('Laravel');

// 7
```

#### `Str::limit()` 方法 {.collection-method}

`Str::limit` 方法将给定的字符串截断到指定长度：

```php
use Illuminate\Support\Str;

$truncated = Str::limit('The quick brown fox jumps over the lazy dog', 20);

// The quick brown fox...
```

你可以传递第三个参数给方法，来改变截断字符串末尾的字符串：

```php
use Illuminate\Support\Str;

$truncated = Str::limit('The quick brown fox jumps over the lazy dog', 20, ' (...)');

// The quick brown fox (...)
```

#### `Str::lower()` 方法 {.collection-method}

`Str::lower` 方法将给定的字符串转换成小写：

```php
use Illuminate\Support\Str;

$converted = Str::lower('LARAVEL');

// laravel
```

#### `Str::markdown()` 方法 {.collection-method}

`Str::markdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换成 HTML：

```php
use Illuminate\Support\Str;

$html = Str::markdown('# Laravel');

// <h1>Laravel</h1>
```

你可以调整 `html_input` 选项来控制如何处理 HTML 标签：

```php
use Illuminate\Support\Str;

$html = Str::markdown('# Taylor <b>Otwell</b>', [
    'html_input' => 'strip',
]);

// <h1>Taylor Otwell</h1>
```

#### `Str::mask()` 方法 {.collection-method}

`Str::mask` 方法用给定的字符遮盖字符串的一部分，并且这个方法可以用来隐藏诸如电子邮件地址和电话号码等字符串的一部分：

```php
use Illuminate\Support\Str;

$string = Str::mask('taylor@example.com', '*', 3);

// tay***************
```

如果需要，你可以给 `mask` 方法的第三个参数提供一个负数，这将指示该方法从字符串末尾开始遮盖的距离：

```php
$string = Str::mask('taylor@example.com', '*', -15, 3);

// tay***@example.com
```

#### `Str::orderedUuid()` 方法 {.collection-method}

`Str::orderedUuid` 方法生成一个“时间戳在前”的 UUID，这种 UUID 可以有效地存储在索引数据库列中。使用此方法生成的每一个 UUID 都将排序在之前使用此方法生成的 UUID 之后：

```php
use Illuminate\Support\Str;

return (string) Str::orderedUuid();
```

#### `Str::padBoth()` 方法 {.collection-method}

`Str::padBoth` 方法包装了 PHP 的 `str_pad` 函数，将字符串的两侧用另一个字符串填充，直到最终字符串达到期望的长度：

```php
use Illuminate\Support\Str;

$padded = Str::padBoth('James', 10, '_');

// '__James___'
```

如果没有指定填充字符串，默认使用空格填充：

```php
$padded = Str::padBoth('James', 10);

// '  James   '
```

#### `Str::padLeft()` 方法 {.collection-method}

`Str::padLeft` 方法包装了 PHP 的 `str_pad` 函数，将字符串的左侧用另一个字符串填充，直到最终字符串达到期望的长度：

```php
use Illuminate\Support\Str;

$padded = Str::padLeft('James', 10, '-=');

// '-=-=-James'
```

如果没有指定填充字符串，默认使用空格填充：

```php
$padded = Str::padLeft('James', 10);

// '     James'
```

#### `Str::padRight()` 方法 {.collection-method}

`Str::padRight` 方法包装了 PHP 的 `str_pad` 函数，将字符串的右侧用另一个字符串填充，直到最终字符串达到期望的长度：

```php
use Illuminate\Support\Str;

$padded = Str::padRight('James', 10, '-');

// 'James-----'
```

如果没有指定填充字符串，默认使用空格填充：

```php
$padded = Str::padRight('James', 10);

// 'James     '
```

#### `Str::password()` 方法 {.collection-method}

`Str::password` 方法用于生成给定长度的安全、随机密码。密码将由字母、数字、符号和空格的组合构成。默认情况下，密码长度为 32 个字符：

```php
use Illuminate\Support\Str;

$password = Str::password();

// 'EbJo2vE-AS:U,$%_gkrV4n,q~1xy/-_4'

$password = Str::password(12);

// 'qwuar>#V|i]N'
```

#### `Str::plural()` 方法 {.collection-method}

`Str::plural` 方法将单词字符串的单数形式转换为复数形式。此功能支持 [由 Laravel 的复数器支持的任何语言](/docs/11/digging-deeper/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::plural('car');

// cars

$plural = Str::plural('child');

// children
```

你可以为函数提供一个整数作为第二个参数以获取字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::plural('child', 2);

// children

$singular = Str::plural('child', 1);

// child
```

#### `Str::pluralStudly()` 方法 {.collection-method}

`Str::pluralStudly` 方法将格式化为 Studly 大小写的单数词字符串转换为其复数形式。此功能支持 [由 Laravel 的复数器支持的任何语言](/docs/11/digging-deeper/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::pluralStudly('VerifiedHuman');

// VerifiedHumans

$plural = Str::pluralStudly('UserFeedback');  // This is likely wrong example - Laravel does not pluralize 'Feedback' as 'Feedbacks'

// UserFeedback
```

你可以为函数提供一个整数作为第二个参数以获取字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::pluralStudly('VerifiedHuman', 2);

// VerifiedHumans

$singular = Str::pluralStudly('VerifiedHuman', 1);

// VerifiedHuman
```

#### `Str::position()` {.collection-method}

`Str::position` 方法返回字符串中子字符串第一次出现的位置。如果给定字符串中不存在子字符串，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::position('Hello, World!', 'Hello');

// 0

$position = Str::position('Hello, World!', 'W');

// 7
```

#### `Str::random()` {.collection-method}

`Str::random` 方法生成指定长度的随机字符串。该函数使用 PHP 的 `random_bytes` 函数：

```php
use Illuminate\Support\Str;

$random = Str::random(40);
```

在测试期间，可以使用 `createRandomStringsUsing` 方法“伪造” `Str::random` 方法返回的值：

```php
Str::createRandomStringsUsing(function () {
    return 'fake-random-string';
});
```

要指示 `random` 方法恢复正常生成随机字符串，可以调用 `createRandomStringsNormally` 方法：

```php
Str::createRandomStringsNormally();
```

#### `Str::remove()` {.collection-method}

`Str::remove` 方法从字符串中移除给定的值或值数组：

```php
use Illuminate\Support\Str;

$string = 'Peter Piper picked a peck of pickled peppers.';

$removed = Str::remove('e', $string);

// Ptr Pipr pickd a pck of pickld ppprs.
```

您还可以将第三个参数传递 `false` 给 `remove` 方法，以忽略在移除字符串时的大小写。

#### `Str::repeat()` {.collection-method}

`Str::repeat` 方法重复给定的字符串：

```php
use Illuminate\Support\Str;

$string = 'a';

$repeat = Str::repeat($string, 5);

// aaaaa
```

#### `Str::replace()` {.collection-method}

`Str::replace` 方法替换字符串内的给定字符串：

```php
use Illuminate\Support\Str;

$string = 'Laravel 10.x';

$replaced = Str::replace('10.x', '11.x', $string);

// Laravel 11.x
```

`replace` 方法还接受一个 `caseSensitive` 参数。默认情况下，`replace` 方法是区分大小写的：

```php
Str::replace('Framework', 'Laravel', caseSensitive: false);
```

#### `Str::replaceArray()` {.collection-method}

`Str::replaceArray` 方法使用一个数组依次替换字符串中的给定值：

```php
use Illuminate\Support\Str;

$string = 'The event will take place between ? and ?';

$replaced = Str::replaceArray('?', ['8:30', '9:00'], $string);

// The event will take place between 8:30 and 9:00
```

#### `Str::replaceFirst()` {.collection-method}

`Str::replaceFirst` 方法替换字符串中第一次出现的给定值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceFirst('the', 'a', 'the quick brown fox jumps over the lazy dog');

// a quick brown fox jumps over the lazy dog
```

#### `Str::replaceLast()` {.collection-method}

`Str::replaceLast` 方法替换字符串中最后一次出现的给定值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceLast('the', 'a', 'the quick brown fox jumps over the lazy dog');

// the quick brown fox jumps over a lazy dog
```

#### `Str::replaceMatches()` {.collection-method}

`Str::replaceMatches` 方法替换字符串中与模式匹配的所有部分为给定的替换字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceMatches(
    pattern: '/[^A-Za-z0-9]++/',
    replace: '',
    subject: '(+1) 501-555-1000'
)

// '15015551000'
```

`replaceMatches` 方法还接受一个闭包，该闭包将使用与给定模式匹配的字符串的每一部分被调用，允许您在闭包内执行替换逻辑并返回替换的值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceMatches('/\d/', function (array $matches) {
    return '['.$matches[0].']';
}, '123');

// '[1][2][3]'
```

#### `Str::replaceStart()` {.collection-method}

`Str::replaceStart` 方法仅在给定值出现在字符串开头时替换第一次出现的给定值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceStart('Hello', 'Laravel', 'Hello World');

// Laravel World

$replaced = Str::replaceStart('World', 'Laravel', 'Hello World');

// Hello World
```

#### `Str::replaceEnd()` {.collection-method}

`Str::replaceEnd` 方法仅在给定值出现在字符串末尾时替换最后一次出现的给定值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceEnd('World', 'Laravel', 'Hello World');

// Hello Laravel

$replaced = Str::replaceEnd('Hello', 'Laravel', 'Hello World');

// Hello World
```

#### `Str::reverse()` {.collection-method}

`Str::reverse` 方法反转给定的字符串：

```php
use Illuminate\Support\Str;

$reversed = Str::reverse('Hello World');

// dlroW olleH
```

#### `Str::singular()` {.collection-method}

`Str::singular` 方法将字符串转换为其单数形式。此函数支持 [Laravel 复数器支持的任何语言](/docs/11/digging-deeper/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$singular = Str::singular('cars');

// car

$singular = Str::singular('children');

// child
```

#### `Str::slug()` {.collection-method}

`Str::slug` 方法生成一个给定字符串的友好 URL "slug"：

```php
use Illuminate\Support\Str;

$slug = Str::slug('Laravel 5 Framework', '-');

// laravel-5-framework
```

#### `Str::snake()` {.collection-method}

`Str::snake` 方法将给定的字符串转换为 `snake_case`：

```php
use Illuminate\Support\Str;

$converted = Str::snake('fooBar');

// foo_bar

$converted = Str::snake('fooBar', '-');

// foo-bar
```

#### `Str::squish()` {.collection-method}

`Str::squish` 方法从字符串中移除所有多余的空白，包括单词之间的多余空白：

```php
use Illuminate\Support\Str;

$string = Str::squish('    laravel    framework    ');

// laravel framework
```

#### `Str::start()` {.collection-method}

`Str::start` 方法在字符串前添加单个给定值的实例，如果字符串不以该值开始：

```php
use Illuminate\Support\Str;

$adjusted = Str::start('这个/字符串', '/');

// /这个/字符串

$adjusted = Str::start('/这个/字符串', '/');

// /这个/字符串
```

#### `Str::startsWith()` {.collection-method}

`Str::startsWith` 方法确定给定的字符串是否以给定的值开始：

```php
use Illuminate\Support\Str;

$result = Str::startsWith('这是我的名字', '这是');

// true
```

如果传递了一组可能的值，则如果字符串以任何给定的值开始，`startsWith` 方法将返回 `true`：

```php
$result = Str::startsWith('这是我的名字', ['这是', '那是', '有']);

// true
```

#### `Str::studly()` {.collection-method}

`Str::studly` 方法将给定的字符串转换为 `StudlyCase`：

```php
use Illuminate\Support\Str;

$converted = Str::studly('foo_bar');

// FooBar
```

#### `Str::substr()` {.collection-method}

`Str::substr` 方法返回由开始和长度参数指定的字符串部分：

```php
use Illuminate\Support\Str;

$converted = Str::substr('Laravel 框架', 4, 7);

// Laravel
```

#### `Str::substrCount()` {.collection-method}

`Str::substrCount` 方法返回给定字符串中出现给定值的次数：

```php
use Illuminate\Support\Str;

$count = Str::substrCount('如果你喜欢冰淇淋，你会喜欢雪花蒙蒙。', '喜欢');

// 2
```

#### `Str::substrReplace()` {.collection-method}

`Str::substrReplace` 方法替换字符串中指定位置开始，并由第四个参数指定的字符数量替换的字符串的一部分。第四个参数传递 `0` 会在指定位置插入字符串，而不会替换字符串中任何现有字符：

```php
use Illuminate\Support\Str;

$result = Str::substrReplace('1300', ':', 2);
// 13:

$result = Str::substrReplace('1300', ':', 2, 0);
// 13:00
```

#### `Str::swap()` {.collection-method}

`Str::swap` 方法使用 PHP 的 `strtr` 函数替换给定字符串中的多个值：

```php
use Illuminate\Support\Str;

$string = Str::swap([
    'Tacos' => 'Burritos',
    'great' => 'fantastic',
], 'Tacos are great!');

// Burritos are fantastic!
```

#### `Str::take()` 方法 {.collection-method}

`Str::take` 方法返回字符串开头指定数量的字符：

```php
use Illuminate\Support\Str;

$taken = Str::take('Build something amazing!', 5);

// Build
```

#### `Str::title()` 方法 {.collection-method}

`Str::title` 方法将给定字符串转换为 `Title Case`：

```php
use Illuminate\Support\Str;

$converted = Str::title('a nice title uses the correct case');

// A Nice Title Uses The Correct Case
```

#### `Str::toBase64()` 方法 {.collection-method}

`Str::toBase64` 方法将给定字符串转换为 Base64 编码：

```php
use Illuminate\Support\Str;

$base64 = Str::toBase64('Laravel');

// TGFyYXZlbA==
```

#### `Str::toHtmlString()` 方法 {.collection-method}

`Str::toHtmlString` 方法将字符串实例转换为 `Illuminate\Support\HtmlString` 实例，可在 Blade 模板中显示：

```php
use Illuminate\Support\Str;

$htmlString = Str::of('Nuno Maduro')->toHtmlString();
```

#### `Str::trim()` 方法 {.collection-method}

`Str::trim` 方法从给定字符串的开头和结尾删除空白（或其他字符）。与 PHP 原生 `trim` 函数不同，`Str::trim` 方法还会删除 unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::trim(' foo bar ');

// 'foo bar'
```

#### `Str::ltrim()` 方法 {.collection-method}

`Str::ltrim` 方法从给定字符串的开头删除空白（或其他字符）。与 PHP 原生 `ltrim` 函数不同，`Str::ltrim` 方法还会删除 unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::ltrim('  foo bar  ');

// 'foo bar  '
```

#### `Str::rtrim()` 方法 {.collection-method}

`Str::rtrim` 方法从给定字符串的结尾删除空白（或其他字符）。与 PHP 原生 `rtrim` 函数不同，`Str::rtrim` 方法还会删除 unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::rtrim('  foo bar  ');

// '  foo bar'
```

#### `Str::ucfirst()` 方法 {.collection-method}

`Str::ucfirst` 方法返回首字母大写的给定字符串：

```php
use Illuminate\Support\Str;

$string = Str::ucfirst('foo bar');

// Foo bar
```

#### `Str::ucsplit()` 方法 {.collection-method}

`Str::ucsplit` 方法将给定字符串依据大写字符拆分为数组：

```php
use Illuminate\Support\Str;

$segments = Str::ucsplit('FooBar');

// [0 => 'Foo', 1 => 'Bar']
```

#### `Str::upper()` 方法 {.collection-method}

`Str::upper` 方法将给定字符串转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::upper('laravel');

// LARAVEL
```

#### `Str::ulid()` 方法 {.collection-method}

`Str::ulid` 方法生成一个 ULID，这是一种紧凑的、按时间排序的唯一标识符：

```php
use Illuminate\Support\Str;

return (string) Str::ulid();

// 01gd6r360bp37zj17nxb55yv40
```

如果您希望检索一个表示给定 ULID 创建日期和时间的 `Illuminate\Support\Carbon` 日期实例，您可以使用 Laravel 的 Carbon 集成提供的 `createFromId` 方法：

```php
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

$date = Carbon::createFromId((string) Str::ulid());
```

在测试期间，"伪造" `Str::ulid` 方法返回的值可能很有用。为此，您可以使用 `createUlidsUsing` 方法：

```php
use Symfony\Component\Uid\Ulid;

Str::createUlidsUsing(function () {
    return new Ulid('01HRDBNHHCKNW2AK4Z29SN82T9');
});
```

要指示 `ulid` 方法恢复正常生成 ULID，您可以调用 `createUlidsNormally` 方法：

```php
Str::createUlidsNormally();
```

#### `Str::unwrap()` 方法 {.collection-method}

`Str::unwrap` 方法从给定字符串的开头和结尾移除指定的字符串：

```php
use Illuminate\Support\Str;

Str::unwrap('-Laravel-', '-');

// Laravel

Str::unwrap('{framework: "Laravel"}', '{', '}');

// framework: "Laravel"
```

#### `Str::uuid()` 方法 {.collection-method}

`Str::uuid` 方法生成一个 UUID（第 4 版）：

```php
use Illuminate\Support\Str;

return (string) Str::uuid();
```

在测试期间，"伪造" `Str::uuid` 方法返回的值可能很有用。为此，您可以使用 `createUuidsUsing` 方法：

```php
use Ramsey\Uuid\Uuid;

Str::createUuidsUsing(function () {
    return Uuid::fromString('eadbfeac-5258-45c2-bab7-ccb9b5ef74f9');
});
```

要指示 `uuid` 方法恢复正常生成 UUID，您可以调用 `createUuidsNormally` 方法：

```php
Str::createUuidsNormally();
```

#### `Str::wordCount()` 方法 {.collection-method}

`Str::wordCount` 方法返回一个字符串中含有的单词数量：

```php
use Illuminate\Support\Str;

Str::wordCount('Hello, world!'); // 2
```

#### `Str::wordWrap()` 方法 {.collection-method}

`Str::wordWrap` 方法将一个字符串折行到给定数量的字符：

```php
use Illuminate\Support\Str;

$text = "The quick brown fox jumped over the lazy dog."

Str::wordWrap($text, characters: 20, break: "<br />\n");

/*
The quick brown fox<br />
jumped over the lazy<br />
dog.
*/
```

#### `Str::words()` 方法 {.collection-method}

`Str::words` 方法限制字符串中的单词数量。一个额外的字符串可以通过该方法的第三个参数传递，以指定应该追加到截断字符串末尾的字符串：

```php
use Illuminate\Support\Str;

return Str::words('Perfectly balanced, as all things should be.', 3, ' >>>');

// Perfectly balanced, as >>>
```

#### `Str::wrap()` 方法 {.collection-method}

`Str::wrap` 方法用附加的字符串或一对字符串包装给定字符串：

```php
use Illuminate\Support\Str;

Str::wrap('Laravel', '"');

// "Laravel"

Str::wrap('is', before: 'This ', after: ' Laravel!');

// This is Laravel!
```

#### `str()` 方法 {.collection-method}

`str` 函数返回给定字符串的一个新 `Illuminate\Support\Stringable` 实例。此函数等同于 `Str::of` 方法：

```php
$string = str('Taylor')->append(' Otwell');

// 'Taylor Otwell'
```

如果没有为 `str` 函数提供参数，函数将返回 `Illuminate\Support\Str` 的实例：

```php
$snake = str()->snake('FooBar');

// 'foo_bar'
```

#### `trans()` 方法 {.collection-method}

`trans` 函数使用您的[语言文件](/docs/11/digging-deeper/localization)翻译给定的翻译键：

```php
echo trans('messages.welcome');
```

如果指定的翻译键不存在，`trans` 函数将返回给定的键。因此，使用上面的例子，如果翻译键不存在，`trans` 函数将返回 `messages.welcome`。

#### `trans_choice()` 方法 {.collection-method}

`trans_choice` 函数使用变形翻译给定的翻译键：

```php
echo trans_choice('messages.notifications', $unreadCount);
```

如果指定的翻译键不存在，`trans_choice` 函数将返回给定的键。因此，使用上面的例子，如果翻译键不存在，`trans_choice` 函数将返回 `messages.notifications`。

## 流畅字符串 {.title}

流畅字符串提供了用于处理字符串值的更流畅、面向对象的接口，允许您使用更可读的语法将多个字符串操作链接在一起，与传统的字符串操作相比。

#### `after` 方法 {.collection-method}

`after` 方法返回字符串中给定值之后的所有内容。如果在字符串中不存在该值，则会返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::of('This is my name')->after('This is');

// ' my name'
```

#### `afterLast` 方法 {.collection-method}

`afterLast` 方法返回字符串中最后一次出现给定值之后的所有内容。如果在字符串中不存在该值，则会返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::of('App\Http\Controllers\Controller')->afterLast('\\');

// 'Controller'
```

#### `apa` 方法 {.collection-method}

`apa` 方法根据 [APA 指南](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case) 将给定字符串转换为首字母大写的标题格式：

```php
use Illuminate\Support\Str;

$converted = Str::of('a nice title uses the correct case')->apa();

// A Nice Title Uses the Correct Case
```

#### `append` 方法 {.collection-method}

`append` 方法将给定的值追加到字符串的末尾：

```php
use Illuminate\Support\Str;

$string = Str::of('Taylor')->append(' Otwell');

// 'Taylor Otwell'
```

#### `ascii` 方法 {.collection-method}

`ascii` 方法将尝试将字符串转换为 ASCII 值：

```php
use Illuminate\Support\Str;

$string = Str::of('ü')->ascii();

// 'u'
```

#### `basename` 方法 {.collection-method}

`basename` 方法将返回给定字符串的尾随名称部分：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->basename();

// 'baz'
```

如果需要，您可以提供一个“扩展名”，它将从尾随部分中移除：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz.jpg')->basename('.jpg');

// 'baz'
```

#### `before` 方法 {.collection-method}

`before` 方法返回字符串中给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::of('This is my name')->before('my name');

// 'This is '
```

#### `beforeLast` 方法 {.collection-method}

`beforeLast` 方法返回字符串中最后一次出现给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::of('This is my name')->beforeLast('is');

// 'This '
```

#### `between` 方法 {.collection-method}

`between` 方法返回两个值之间的字符串片段：

```php
use Illuminate\Support\Str;

$converted = Str::of('This is my name')->between('This', 'name');

// ' is my '
```

#### `betweenFirst` 方法 {.collection-method}

`betweenFirst` 方法返回两个值之间最小可能部分的字符串片段：

```php
use Illuminate\Support\Str;

$converted = Str::of('[a] bc [d]')->betweenFirst('[', ']');

// 'a'
```

#### `camel` 方法 {.collection-method}

`camel` 方法将给定字符串转换为 `camelCase`：

```php
use Illuminate\Support\Str;

$converted = Str::of('foo_bar')->camel();

// 'fooBar'
```

#### `charAt` 方法 {.collection-method}

`charAt` 方法返回指定索引处的字符。如果索引超出范围，将返回 `false`：

```php
use Illuminate\Support\Str;

$character = Str::of('This is my name.')->charAt(6);

// 's'
```

#### `classBasename` 方法 {.collection-method}

`classBasename` 方法返回给定类的类名，并移除该类的命名空间：

```php
use Illuminate\Support\Str;

$class = Str::of('Foo\Bar\Baz')->classBasename();

// 'Baz'
```

#### `contains` 方法 {.collection-method}

`contains` 方法判断给定字符串是否包含给定值。此方法区分大小写：

```php
use Illuminate\Support\Str;

$contains = Str::of('This is my name')->contains('my');

// true
```

您也可以传递一个值数组来判断给定字符串是否包含数组中的任意值：

```php
use Illuminate\Support\Str;

$contains = Str::of('This is my name')->contains(['my', 'foo']);

// true
```

#### `containsAll` 方法 {.collection-method}

`containsAll` 方法判断给定字符串是否包含给定数组中的所有值：

```php
use Illuminate\Support\Str;

$containsAll = Str::of('This is my name')->containsAll(['my', 'name']);

// true
```

#### `dirname` 方法 {.collection-method}

`dirname` 方法返回给定字符串的父目录部分：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->dirname();

// '/foo/bar'
```

如有必要，您可以指定希望从字符串中裁剪掉多少层目录级别：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->dirname(2);

// '/foo'
```

#### `excerpt` 方法 {.collection-method}

`excerpt` 方法从字符串中提取与字符串内第一个符合条件的短语匹配的摘录：

```php
use Illuminate\Support\Str;

$excerpt = Str::of('This is my name')->excerpt('my', [
    'radius' => 3
]);

// '...is my na...'
```

`radius` 选项的默认值为 `100`，允许您定义在截断字符串的每一边显示多少字符。

此外，您可以使用 `omission` 选项更改将附加到截断字符串前后的字符串：

```php
use Illuminate\Support\Str;

$excerpt = Str::of('This is my name')->excerpt('name', [
    'radius' => 3,
    'omission' => '(...) '
]);

// '(...) my name'
```

#### `endsWith` 方法 {.collection-method}

`endsWith` 方法判断给定字符串是否以给定值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->endsWith('name');

// true
```

您也可以传递一个值数组来判断给定字符串是否以数组中的任意值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->endsWith(['name', 'foo']);

// true

$result = Str::of('This is my name')->endsWith(['this', 'foo']);

// false
```

#### `exactly` 方法 {.collection-method}

`exactly` 方法判断给定字符串是否与另一个字符串完全匹配：

```php
use Illuminate\Support\Str;

$result = Str::of('Laravel')->exactly('Laravel');

// true
```

#### `explode` 方法 {.collection-method}

`explode` 方法通过给定的分隔符分割字符串，并返回包含分割后字符串部分的集合：

```php
use Illuminate\Support\Str;

$collection = Str::of('foo bar baz')->explode(' ');

// collect(['foo', 'bar', 'baz'])
```

#### `finish` 方法 {.collection-method}

`finish` 方法将给定值的单个实例添加到一个字符串的末尾，如果该值尚未出现在字符串的末尾：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('this/string')->finish('/');

// this/string/

$adjusted = Str::of('this/string/')->finish('/');

// this/string/
```

#### `headline` 方法 {.collection-method}

`headline` 方法会将由大小写、连字符或下划线分隔的字符串转换为空格分隔的字符串，并将每个单词的首字母大写：

```php
use Illuminate\Support\Str;

$headline = Str::of('taylor_otwell')->headline();

// Taylor Otwell

$headline = Str::of('EmailNotificationSent')->headline();

// Email Notification Sent
```

#### `inlineMarkdown` 方法 {.collection-method}

`inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为行内 HTML。但是，与 `markdown` 方法不同，它不会将所有生成的 HTML 包装在块级元素中：

```php
use Illuminate\Support\Str;

$html = Str::of('**Laravel**')->inlineMarkdown();

// <strong>Laravel</strong>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，当与原始用户输入一起使用时，将暴露跨站点脚本（XSS）漏洞。根据 [CommonMark Security 文档](https://commonmark.thephpleague.com/security/)，您可以使用 `html_input` 选项来转义或剥离原始 HTML，并使用 `allow_unsafe_links` 选项来指定是否允许不安全链接。如果您需要允许一些原始 HTML，您应该将编译后的 Markdown 通过 HTML Purifier 过滤：

```php
use Illuminate\Support\Str;

Str::of('注入：<script>alert("Hello XSS!");</script>')->markdown([
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// 注入：alert(&quot;Hello XSS!&quot;);
```

#### `is` {.collection-method}

`is` 方法确定给定的字符串是否匹配给定的模式。星号可以用作通配符：

```php
use Illuminate\Support\Str;

$matches = Str::of('foobar')->is('foo*');

// true

$matches = Str::of('foobar')->is('baz*');

// false
```

#### `isAscii` {.collection-method}

`isAscii` 方法确定给定的字符串是否为 ASCII 字符串：

```php
use Illuminate\Support\Str;

$result = Str::of('Taylor')->isAscii();

// true

$result = Str::of('ü')->isAscii();

// false
```

#### `isEmpty` {.collection-method}

`isEmpty` 方法确定给定的字符串是否为空：

```php
use Illuminate\Support\Str;

$result = Str::of('  ')->trim()->isEmpty();

// true

$result = Str::of('Laravel')->trim()->isEmpty();

// false
```

#### `isNotEmpty` {.collection-method}

`isNotEmpty` 方法确定给定的字符串是否不为空：

```php
use Illuminate\Support\Str;

$result = Str::of('  ')->trim()->isNotEmpty();

// false

$result = Str::of('Laravel')->trim()->isNotEmpty();

// true
```

#### `isJson` {.collection-method}

`isJson` 方法确定给定的字符串是否为有效的 JSON：

```php
use Illuminate\Support\Str;

$result = Str::of('[1,2,3]')->isJson();

// true

$result = Str::of('{"first": "John", "last": "Doe"}')->isJson();

// true

$result = Str::of('{first: "John", last: "Doe"}')->isJson();

// false
```

#### `isUlid` {.collection-method}

`isUlid` 方法确定给定的字符串是否为 ULID：

```php
use Illuminate\Support\Str;

$result = Str::of('01gd6r360bp37zj17nxb55yv40')->isUlid();

// true

$result = Str::of('Taylor')->isUlid();

// false
```

#### `isUrl` {.collection-method}

`isUrl` 方法确定给定的字符串是否为 URL：

```php
use Illuminate\Support\Str;

$result = Str::of('http://example.com')->isUrl();

// true

$result = Str::of('Taylor')->isUrl();

// false
```

`isUrl` 方法认为多种协议都有效。但是，您可以通过提供给 `isUrl` 方法来指定应视为有效的协议：

```php
$result = Str::of('http://example.com')->isUrl(['http', 'https']);
```

#### `isUuid` {.collection-method}

`isUuid` 方法确定给定的字符串是否为 UUID：

```php
use Illuminate\Support\Str;

$result = Str::of('5ace9ab9-e9cf-4ec6-a19d-5881212a452c')->isUuid();

// true

$result = Str::of('Taylor')->isUuid();

// false
```

#### `kebab` {.collection-method}

`kebab` 方法将给定的字符串转换为 `kebab-case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('fooBar')->kebab();

// foo-bar
```

#### `lcfirst` {.collection-method}

`lcfirst` 方法返回给定字符串的首字母小写版本：

```php
use Illuminate\Support\Str;

$string = Str::of('Foo Bar')->lcfirst();

// foo Bar
```

#### `length` {.collection-method}

`length` 方法返回给定字符串的长度：

```php
use Illuminate\Support\Str;

$length = Str::of('Laravel')->length();

// 7
```

#### `limit` {.collection-method}

`limit` 方法将给定的字符串截断到指定的长度：

```php
use Illuminate\Support\Str;

$truncated = Str::of('The quick brown fox jumps over the lazy dog')->limit(20);

// The quick brown fox...
```

您还可以传递第二个参数来更改追加到截断字符串末尾的字符串：

```php
use Illuminate\Support\Str;

$truncated = Str::of('The quick brown fox jumps over the lazy dog')->limit(20, ' (...)');

// The quick brown fox (...)
```

#### `lower` {.collection-method}

`lower` 方法将给定的字符串转为小写：

```php
use Illuminate\Support\Str;

$result = Str::of('LARAVEL')->lower();

// 'laravel'
```

#### `markdown` {.collection-method}

`markdown` 方法将 GitHub 风格的 Markdown 转换为 HTML：

```php
use Illuminate\Support\Str;

$html = Str::of('# Laravel')->markdown();

// <h1>Laravel</h1>

$html = Str::of('# Taylor <b>Otwell</b>')->markdown([
    'html_input' => 'strip',
]);

// <h1>Taylor Otwell</h1>
```

#### `mask` {.collection-method}

`mask` 方法使用重复的字符掩盖字符串的一部分，并且可以用来隐藏如电子邮件地址和电话号码等字符串的段落：

```php
use Illuminate\Support\Str;

$string = Str::of('taylor@example.com')->mask('*', 3);

// tay***************

$tring = Str::of('taylor@example.com')->mask('*', -15, 3);

// tay***@example.com

$string = Str::of('taylor@example.com')->mask('*', 4, -4);

// tayl**********.com
```

#### `match` {.collection-method}

`match` 方法将返回与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::of('foo bar')->match('/bar/');

// 'bar'

$result = Str::of('foo bar')->match('/foo (.*)/');

// 'bar'
```

#### `matchAll` {.collection-method}

`matchAll` 方法将返回一个集合，其中包含与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::of('bar foo bar')->matchAll('/bar/');

// collect(['bar', 'bar'])

$result = Str::of('bar fun bar fly')->matchAll('/f(\w*)/');

// collect(['un', 'ly']);
```

如果找不到匹配项，将返回空集合。

#### `isMatch` {.collection-method}

`isMatch` 方法将返回 `true` 如果字符串与给定的正则表达式匹配：

```php
use Illuminate\Support\Str;

$result = Str::of('foo bar')->isMatch('/foo (.*)/');

// true

$result = Str::of('laravel')->isMatch('/foo (.*)/');

// false
```

#### `newLine` {.collection-method}

`newLine` 方法在字符串末尾添加一个“换行”字符：

```php
use Illuminate\Support\Str;

$padded = Str::of('Laravel')->newLine()->append('Framework');

// 'Laravel
//  Framework'
```

#### `padBoth` {.collection-method}

`padBoth` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串对原字符串的两边进行填充，直到最终字符串达到期望的长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padBoth(10, '_');

// '__James___'

$padded = Str::of('James')->padBoth(10);

// '  James   '
```

#### `padLeft` {.collection-method}

`padLeft` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充原字符串的左侧，直到最终的字符串达到期望的长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padLeft(10, '-=');

// '-=-=-James'

$padded = Str::of('James')->padLeft(10);

// '     James'
```

#### `padRight` {.collection-method}

`padRight` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充原字符串的右侧，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padRight(10, '-');

// 'James-----'

$padded = Str::of('James')->padRight(10);

// 'James     '
```

#### `pipe` {.collection-method}

`pipe` 方法允许您通过将当前值传递给给定的可调用对象来转换字符串：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$hash = Str::of('Laravel')->pipe('md5')->prepend('校验和: ');

// '校验和: a5c95b86291ea299fcbe64458ed12702'

$closure = Str::of('foo')->pipe(function (Stringable $str) {
    return 'bar';
});

// 'bar'
```

#### `plural` {.collection-method}

`plural` 方法将单数词字符串转换为其复数形式。此函数支持 [Laravel 的复数器支持的任何语言](/docs/11/digging-deeper/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::of('car')->plural();

// cars

$plural = Str::of('child')->plural();

// children
```

您可以提供一个整数作为第二个参数给该函数，以获取字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::of('child')->plural(2);

// children

$plural = Str::of('child')->plural(1);

// child
```

#### `position` {.collection-method}

`position` 方法返回字符串中首次出现子字符串的位置。如果子字符串在字符串中不存在，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::of('Hello, World!')->position('Hello');

// 0

$position = Str::of('Hello, World!')->position('W');

// 7
```

#### `prepend` {.collection-method}

`prepend` 方法将给定值添加到字符串前面：

```php
use Illuminate\Support\Str;

$string = Str::of('Framework')->prepend('Laravel ');

// Laravel Framework
```

#### `remove` {.collection-method}

`remove` 方法从字符串中移除给定的值或值数组：

```php
use Illuminate\Support\Str;

$string = Str::of('阿肯色州非常美丽！')->remove('非常');

// 阿肯色州美丽！
```

您还可以传递 `false` 作为第二个参数来忽略大小写移除字符串。

#### `repeat` {.collection-method}

`repeat` 方法重复给定的字符串：

```php
use Illuminate\Support\Str;

$repeated = Str::of('a')->repeat(5);

// aaaaa
```

#### `replace` {.collection-method}

`replace` 方法替换字符串中的给定字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Laravel 6.x')->replace('6.x', '7.x');

// Laravel 7.x
```

`replace` 方法也接受一个 `caseSensitive` 参数。默认情况下，`replace` 方法区分大小写：

```php
$replaced = Str::of('macOS 13.x')->replace(
    'macOS', 'iOS', caseSensitive: false
);
```

#### `replaceArray` {.collection-method}

`replaceArray` 方法使用数组依次替换字符串中的给定值：

```php
use Illuminate\Support\Str;

$string = 'The event will take place between ? and ?';

$replaced = Str::of($string)->replaceArray('?', ['8:30', '9:00']);

// 活动将在 8:30 和 9:00 之间举行
```

#### `replaceFirst` {.collection-method}

`replaceFirst` 方法替换字符串中首次出现的给定值：

```php
use Illuminate\Support\Str;

$replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceFirst('the', 'a');

// a quick brown fox jumps over the lazy dog
```

#### `replaceLast` {.collection-method}

`replaceLast` 方法替换字符串中最后一次出现的给定值：

```php
use Illuminate\Support\Str;

$replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceLast('the', 'a');

// the quick brown fox jumps over a lazy dog
```

#### `replaceMatches` {.collection-method}

`replaceMatches` 方法替换字符串中与模式匹配的所有部分，用给定的替换字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::of('(+1) 501-555-1000')->replaceMatches('/[^A-Za-z0-9]++/', '');

// '15015551000'
```

`replaceMatches` 方法还接受一个闭包，闭包将与给定模式匹配的每个字符串部分调用，并允许您在闭包内执行替换逻辑并返回替换后的值：

```php
use Illuminate\Support\Str;

$replaced = Str::of('123')->replaceMatches('/\d/', function (array $matches) {
    return '['.$matches[0].']';
});

// '[1][2][3]'
```

#### `replaceStart` {.collection-method}

`replaceStart` 方法仅在给定值出现在字符串开头时替换字符串中的第一个出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Hello World')->replaceStart('Hello', 'Laravel');

// Laravel World

$replaced = Str::of('Hello World')->replaceStart('World', 'Laravel');

// Hello World
```

#### `replaceEnd` {.collection-method}

`replaceEnd` 方法仅在给定值出现在字符串结尾时替换字符串中的最后一个出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Hello World')->replaceEnd('World', 'Laravel');

// Hello Laravel

$replaced = Str::of('Hello World')->replaceEnd('Hello', 'Laravel');

// Hello World
```

#### `scan` {.collection-method}

`scan` 方法根据 [`sscanf` PHP 函数](https://www.php.net/manual/en/function.sscanf.php) 支持的格式，从字符串中解析输入到集合中：

```php
use Illuminate\Support\Str;

$collection = Str::of('filename.jpg')->scan('%[^.].%s');

// collect(['filename', 'jpg'])
```

#### `singular` {.collection-method}

`singular` 方法将字符串转换为其单数形式。此函数支持 [Laravel 的复数器支持的任何语言](/docs/11/digging-deeper/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$singular = Str::of('cars')->singular();

// car

$singular = Str::of('children')->singular();

// child
```

#### `slug` 方法 {.collection-method}

`slug` 方法会将给定的字符串生成一个友好的 URL "slug"：

```php
use Illuminate\Support\Str;

$slug = Str::of('Laravel Framework')->slug('-');

// laravel-framework
```

#### `snake` 方法 {.collection-method}

`snake` 方法会将给定的字符串转换为 `snake_case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('fooBar')->snake();

// foo_bar
```

#### `split` 方法 {.collection-method}

`split` 方法使用一个正则表达式将字符串分割成一个集合：

```php
use Illuminate\Support\Str;

$segments = Str::of('one, two, three')->split('/[\s,]+/');

// collect(["one", "two", "three"])
```

#### `squish` 方法 {.collection-method}

`squish` 方法会移除字符串中的所有多余空白，包括单词之间的额外空白：

```php
use Illuminate\Support\Str;

$string = Str::of('    laravel    framework    ')->squish();

// laravel framework
```

#### `start` 方法 {.collection-method}

`start` 方法会在不以给定值开头的字符串前添加这个值：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('this/string')->start('/');

// /this/string

$adjusted = Str::of('/this/string')->start('/');

// /this/string
```

#### `startsWith` 方法 {.collection-method}

`startsWith` 方法会判断给定的字符串是否以某个值开始：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->startsWith('This');

// true
```

#### `stripTags` 方法 {.collection-method}

`stripTags` 方法会从字符串中移除所有 HTML 和 PHP 标签：

```php
use Illuminate\Support\Str;

$result = Str::of('<a href="https://laravel.com">Taylor <b>Otwell</b></a>')->stripTags();

// Taylor Otwell

$result = Str::of('<a href="https://laravel.com">Taylor <b>Otwell</b></a>')->stripTags('<b>');

// Taylor <b>Otwell</b>
```

#### `studly` 方法 {.collection-method}

`studly` 方法会将给定的字符串转换为 `StudlyCase`：

```php
use Illuminate\Support\Str;

$converted = Str::of('foo_bar')->studly();

// FooBar
```

#### `substr` 方法 {.collection-method}

`substr` 方法会根据给定的开始位置和长度返回字符串的一部分：

```php
use Illuminate\Support\Str;

$string = Str::of('Laravel Framework')->substr(8);

// Framework

$string = Str::of('Laravel Framework')->substr(8, 5);

// Frame
```

#### `substrReplace` 方法 {.collection-method}

`substrReplace` 方法会在字符串中的某个位置开始替换指定数目的字符。通过给方法的第三个参数传递 `0`，可以在指定位置插入字符串而不替换现有字符：

```php
use Illuminate\Support\Str;

$string = Str::of('1300')->substrReplace(':', 2);

// 13:

$string = Str::of('The Framework')->substrReplace(' Laravel', 3, 0);

// The Laravel Framework
```

#### `swap` 方法 {.collection-method}

`swap` 方法使用 PHP 的 `strtr` 函数在字符串中替换多个值：

```php
use Illuminate\Support\Str;

$string = Str::of('Tacos are great!')
        ->swap([
            'Tacos' => 'Burritos',
            'great' => 'fantastic',
        ]);

// Burritos are fantastic!
```

#### `take` 方法 {.collection-method}

`take` 方法会返回字符串开头指定数量的字符：

```php
use Illuminate\Support\Str;

$taken = Str::of('Build something amazing!')->take(5);

// Build
```

#### `tap` 方法 {.collection-method}

`tap` 方法会将字符串传给给定的闭包，允许你查看和交互字符串而不影响字符串本身。无论闭包返回什么，原始字符串都将被 `tap` 方法返回：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Laravel')
        ->append(' Framework')
        ->tap(function (Stringable $string) {
            dump('String after append: '.$string);
        })
        ->upper();

// LARAVEL FRAMEWORK
```

#### `test` 方法 {.collection-method}

`test` 方法判断字符串是否与给定的正则表达式模式匹配：

```php
use Illuminate\Support\Str;

$result = Str::of('Laravel Framework')->test('/Laravel/');

// true
```

#### `title` 方法 {.collection-method}

`title` 方法会将给定的字符串转换为 `Title Case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('a nice title uses the correct case')->title();

// A Nice Title Uses The Correct Case
```

#### `toBase64()` 方法 {.collection-method}

`toBase64` 方法会将给定的字符串转换为 Base64：

```php
use Illuminate\Support\Str;

$base64 = Str::of('Laravel')->toBase64();

// TGFyYXZlbA==
```

#### `trim` 方法 {.collection-method}

`trim` 方法会修剪给定的字符串。不同于 PHP 的原生 `trim` 函数，Laravel 的 `trim` 方法也会移除 unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->trim();

// 'Laravel'

$string = Str::of('/Laravel/')->trim('/');

// 'Laravel'
```

#### `ltrim` 方法 {.collection-method}

`ltrim` 方法会修剪字符串的左侧。不同于 PHP 的原生 `ltrim` 函数，Laravel 的 `ltrim` 方法也会移除 unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->ltrim();

// 'Laravel  '

$string = Str::of('/Laravel/')->ltrim('/');

// 'Laravel/'
```

#### `rtrim` 方法 {.collection-method}

`rtrim` 方法会修剪给定字符串的右侧。不同于 PHP 的原生 `rtrim` 函数，Laravel 的 `rtrim` 方法也会移除 unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->rtrim();

// '  Laravel'

$string = Str::of('/Laravel/')->rtrim('/');

// '/Laravel'
```

#### `ucfirst` 方法 {.collection-method}

`ucfirst` 方法会返回首字符大写的字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('foo bar')->ucfirst();

// Foo bar
```

#### `ucsplit` 方法 {.collection-method}

`ucsplit` 方法会将给定的字符串按大写字符拆分成一个集合：

```php
use Illuminate\Support\Str;

$string = Str::of('Foo Bar')->ucsplit();

// collect(['Foo', 'Bar'])
```

#### `unwrap` 方法 {.collection-method}

`unwrap` 方法会从字符串的开始和结尾去除指定的字符串：

```php
use Illuminate\Support\Str;

Str::of('-Laravel-')->unwrap('-');

// Laravel

Str::of('{framework: "Laravel"}')->unwrap('{', '}');

// framework: "Laravel"
```

#### `upper` 方法 {.collection-method}

`upper` 方法会将给定的字符串转换为大写：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('laravel')->upper();

// LARAVEL
```

#### `when` 方法 {.collection-method}

`when` 方法会在给定条件为 `true` 时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Taylor')
                ->when(true, function (Stringable $string) {
                    return $string->append(' Otwell');
                });

// 'Taylor Otwell'
```

如果有必要，你可以将另一个闭包作为 `when` 方法的第三个参数传递给它。如果条件参数评估为 `false`，则会执行这个闭包。

#### `whenContains` 方法 {.collection-method}

`whenContains` 方法会在字符串包含给定值时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
            ->whenContains('tony', function (Stringable $string) {
                return $string->title();
            });

// 'Tony Stark'
```

如果有必要，你还可以将另一个闭包作为第三个参数传递给 `when` 方法。如果字符串不包含给定值，则会执行这个闭包。

你还可以传递一个值数组，以确定给定的字符串是否包含数组中的任何值：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
            ->whenContains(['tony', 'hulk'], function (Stringable $string) {
                return $string->title();
            });

// Tony Stark
```

#### `whenContainsAll` 方法 {.collection-method}

`whenContainsAll` 方法会在字符串包含所有给定子字符串时调用闭包。闭包将接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
                ->whenContainsAll(['tony', 'stark'], function (Stringable $string) {
                    return $string->title();
                });

// 'Tony Stark'
```

如果有必要，可以传递另一个闭包作为 `when` 方法的第三个参数。如果条件参数评估为 `false`，则会执行这个闭包。

#### `whenEmpty` 方法 {.collection-method}

`whenEmpty` 方法会在字符串为空时调用闭包。如果闭包返回一个值，这个值同样会被 `whenEmpty` 方法返回。如果闭包不返回任何值，将返回流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('  ')->whenEmpty(function (Stringable $string) {
    return $string->trim()->prepend('Laravel');
});

// 'Laravel'
```

#### `whenNotEmpty` 方法 {.collection-method}

`whenNotEmpty` 方法会在字符串不为空时调用闭包。如果闭包返回一个值，这个值同样会被 `whenNotEmpty` 方法返回。如果闭包不返回任何值，将返回流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Framework')->whenNotEmpty(function (Stringable $string) {
    return $string->prepend('Laravel ');
});

// 'Laravel Framework'
```

#### `whenStartsWith` 方法 {.collection-method}

`whenStartsWith` 方法会在字符串以给定子字符串开始时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenStartsWith('disney', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

#### `whenEndsWith` 方法 {.collection-method}

`whenEndsWith` 方法会在字符串以给定子字符串结束时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenEndsWith('world', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

#### `whenExactly` 方法 {.collection-method}

`whenExactly` 方法会在字符串与给定字符串完全匹配时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel')->whenExactly('laravel', function (Stringable $string) {
    return $string->title();
});

// 'Laravel'
```

#### `whenNotExactly` 方法 {.collection-method}

`whenNotExactly` 方法会在字符串不与给定字符串完全匹配时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('framework')->whenNotExactly('laravel', function (Stringable $string) {
    return $string->title();
});

// 'Framework'
```

#### `whenIs` 方法 {.collection-method}

`whenIs` 方法会在字符串与给定模式匹配时调用闭包。星号可以用作通配符：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('foo/bar')->whenIs('foo/*', function (Stringable $string) {
    return $string->append('/baz');
});

// 'foo/bar/baz'
```

#### `whenIsAscii` 方法 {.collection-method}

`whenIsAscii` 方法会在字符串为 7 位 ASCII 时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel')->whenIsAscii(function (Stringable $string) {
    return $string->title();
});

// 'Laravel'
```

#### `whenIsUlid` 方法 {.collection-method}

`whenIsUlid` 方法会在字符串为有效 ULID 时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;

$string = Str::of('01gd6r360bp37zj17nxb55yv40')->whenIsUlid(function (Stringable $string) {
    return $string->substr(0, 8);
});

// '01gd6r36'
```

#### `whenIsUuid` 方法 {.collection-method}

`whenIsUuid` 方法会在字符串为有效 UUID 时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->whenIsUuid(function (Stringable $string) {
    return $string->substr(0, 8);
});

// 'a0a2a2d2'
```

#### `whenTest` 方法 {.collection-method}

`whenTest` 方法会在字符串与给定的正则表达式匹配时调用闭包。闭包会接收到流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel framework')->whenTest('/laravel/', function (Stringable $string) {
    return $string->title();
});

// 'Laravel Framework'
```

#### `wordCount` 方法 {.collection-method}

`wordCount` 方法会返回字符串中包含的单词数量：

```php
use Illuminate\Support\Str;

Str::of('Hello, world!')->wordCount(); // 2
```

#### `words` 方法 {.collection-method}

`words` 方法会限制字符串中的单词数。如果需要，你可以指定一个额外的字符串，当字符串被截断时将会附加上它：

```php
use Illuminate\Support\Str;

$string = Str::of('Perfectly balanced, as all things should be.')->words(3, ' >>>');

// Perfectly balanced, as >>>
```
