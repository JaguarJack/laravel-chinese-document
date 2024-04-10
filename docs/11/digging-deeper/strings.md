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

````markdown
#### `Str::position()` {.collection-method}

`Str::position` 方法返回字符串中子字符串第一次出现的位置。如果给定字符串中不存在子字符串，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::position('Hello, World!', 'Hello');

// 0

$position = Str::position('Hello, World!', 'W');

// 7
```
````

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

#### `Str::take()` {.collection-method}
