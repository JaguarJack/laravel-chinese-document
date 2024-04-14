# Prompts

[[toc]]

## 简介

Laravel Prompts 是一个 PHP 包，用于向您的命令行应用程序添加美观且用户友好的表单，具有包括占位符文本和验证等浏览器类特性。

![Laravel Prompts 示例图](https://laravel.com/img/docs/prompts-example.png)

Laravel Prompts 非常适合在您的 [Artisan 控制台命令](/docs/11/digging-deeper/artisan#writing-commands)中接受用户输入，但它也可用于任何命令行 PHP 项目中。

> [!NOTE]
> Laravel Prompts 支持 macOS、Linux 和包含 WSL 的 Windows。有关更多信息，请参阅我们的文档 [不受支持的环境与替代方案](#fallbacks)。

## 安装

Laravel 的最新版本已经包含了 Laravel Prompts。

Laravel Prompts 也可以通过 Composer 包管理器安装在您的其他 PHP 项目中：

```shell
composer require laravel/prompts
```

## 可用的 Prompts

### 文本

`text` 函数将向用户提出给定的问题，接受他们的输入，然后返回它：

```php
use function Laravel\Prompts\text;

$name = text('What is your name?');
```

您还可以包括占位符文本、默认值以及信息提示：

```php
$name = text(
    label: 'What is your name?',
    placeholder: 'E.g. Taylor Otwell',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

#### 需要输入值

如果您需要输入一个值，您可以传递 `required` 参数：

```php
$name = text(
    label: 'What is your name?',
    required: true
);
```

如果您想自定义验证信息，您也可以传递一个字符串：

```php
$name = text(
    label: 'What is your name?',
    required: 'Your name is required.'
);
```

#### 额外的验证

最后，如果您希望执行额外的验证逻辑，您可以向 `validate` 参数传递一个闭包：

```php
$name = text(
    label: 'What is your name?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

闭包将接收已输入的值，并可能返回一条错误消息，或者如果验证通过则返回 `null`。

另外，您可以利用 Laravel 的 [validator](/docs/11/basics/validation) 的力量。为此，提供一个数组到 `validate` 参数中，包含属性名称和所需的验证规则：

```php
$name = text(
    label: 'What is your name?',
    validate: ['name' => 'required|max:255|unique:users,name']
);
```

### 密码

`password` 函数与 `text` 函数类似，但是用户在控制台中输入时，其输入内容会被掩码。这在询问敏感信息，如密码时非常有用：

```php
use function Laravel\Prompts\password;

$password = password('What is your password?');
```

您还可以包括占位符文本和信息提示：

```php
$password = password(
    label: 'What is your password?',
    placeholder: 'password',
    hint: 'Minimum 8 characters.'
);
```

#### 必填值

如果您需要输入一个值，您可以传递 `required` 参数：

```php
$password = password(
    label: 'What is your password?',
    required: true
);
```

如果您想自定义验证信息，您也可以传递一个字符串：

```php
$password = password(
    label: 'What is your password?',
    required: 'The password is required.'
);
```

#### 额外的验证

最后，如果您希望执行额外的验证逻辑，您可以向 `validate` 参数传递一个闭包：

```php
$password = password(
    label: 'What is your password?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 8 => 'The password must be at least 8 characters.',
        default => null
    }
);
```

闭包将接收已输入的值，并可能返回一条错误消息，或者如果验证通过则返回 `null`。

另外，您可以利用 Laravel 的 [validator](/docs/11/basics/validation) 的力量。为此，提供一个数组到 `validate` 参数中，包含属性名称和所需的验证规则：

```php
$password = password(
    label: 'What is your password?',
    validate: ['password' => 'min:8']
);
```

### 确认

如果您需要询问用户一个 "是或否" 的确认，您可以使用 `confirm` 函数。用户可以使用箭头键或按 `y` 或 `n` 来选择他们的响应。此函数将返回 `true` 或 `false`。

```php
use function Laravel\Prompts\confirm;

$confirmed = confirm('Do you accept the terms?');
```

您还可以包括默认值、自定义的 "是" 和 "否" 标签的措辞以及信息提示：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    default: false,
    yes: 'I accept',
    no: 'I decline',
    hint: 'The terms must be accepted to continue.'
);
```

#### 要求 "是"

如果需要，您可以通过传递 `required` 参数强制用户选择 "是"：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: true
);
```

如果您想自定义验证信息，您也可以传递一个字符串：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: 'You must accept the terms to continue.'
);
```

### 选择器

如果您需要用户从一系列预定义选项中选择，您可以使用 `select` 函数：

```php
use function Laravel\Prompts\select;

$role = select(
    'What role should the user have?',
    ['Member', 'Contributor', 'Owner'],
);
```

您还可以指定默认选项和信息提示：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner'],
    default: 'Owner',
    hint: 'The role may be changed at any time.'
);
```

您还可以传递一个关联数组给 `options` 参数，以返回被选中的键而不是其值：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'member' => 'Member',
        'contributor' => 'Contributor',
        'owner' => 'Owner'
    ],
    default: 'owner'
);
```

当列表中的选项多于五个时会开始滚动。您可以通过传递 `scroll` 参数来自定义此行为：

```php
$role = select(
    label: 'Which category would you like to assign?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

#### 验证

与其他 prompt 函数不同，`select` 函数不接受 `required` 参数，因为不可能什么都不选择。然而，如果您需要呈现一个选项但阻止它被选择，您可以向 `validate` 参数传递一个闭包：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'member' => 'Member',
        'contributor' => 'Contributor',
        'owner' => 'Owner'
    ],
    validate: fn (string $value) =>
        $value === 'owner' && User::where('role', 'owner')->exists()
            ? 'An owner already exists.'
            : null
);
```

如果 `options` 参数是关联数组，则闭包将接收被选中的键，否则它将接收被选中的值。闭包可以返回一个错误信息，或者如果验证通过则返回 `null`。

### 多项选择

如果您需要用户能够选择多个选项，您可以使用 `multiselect` 函数：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    'What permissions should be assigned?',
    ['Read', 'Create', 'Update', 'Delete']
);
```

您还可以指定默认选择和信息提示：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: ['Read', 'Create', 'Update', 'Delete'],
    default: ['Read', 'Create'],
    hint: 'Permissions may be updated at any time.'
);
```

您还可以将关联数组传递给 `options` 参数来返回选定选项的键，而不是它们的值：

```php
$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: [
        'read' => 'Read',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete'
    ],
    default: ['read', 'create']
);
```

在列表开始滚动之前，最多会显示五个选项。您可以通过传递 `scroll` 参数来自定义此行为：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

#### 需要一个值

默认情况下，用户可以选择零个或多个选项。您可以传递 `required` 参数来强制选择一个或多个选项：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    required: true,
);
```

如果您希望自定义验证消息，您还可以提供一个字符串给 `required` 参数：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    required: 'You must select at least one category',
);
```

#### 验证

如果您需要显示一个选项但阻止它被选择，您可以将一个闭包传递给 `validate` 参数：

```php
$permissions = multiselect(
    label: 'What permissions should the user have?',
    options: [
        'read' => 'Read',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete'
    ],
    validate: fn (array $values) => ! in_array('read', $values)
        ? 'All users require the read permission.'
        : null
);
```

如果 `options` 参数是一个关联数组，则闭包将接收选定的键，否则它将接收选定的值。闭包可以返回一个错误消息，或者如果验证通过，则返回 `null`。

### 建议

`suggest` 函数可用于为可能的选择提供自动完成提示。用户仍然可以提供任何答案，无论自动完成提示如何：

```php
use function Laravel\Prompts\suggest;

$name = suggest('What is your name?', ['Taylor', 'Dayle']);
```

或者，您可以将一个闭包作为 `suggest` 函数的第二个参数传递。每当用户输入一个字符时，都会调用该闭包。该闭包应该接受一个包含到目前为止用户输入的字符串参数，并返回一个用于自动完成的选项数组：

```php
$name = suggest(
    'What is your name?',
    fn ($value) => collect(['Taylor', 'Dayle'])
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
)
```

您也可以包括占位符文本、默认值和信息提示：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    placeholder: 'E.g. Taylor',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

#### 需要值

如果您需要输入一个值，您可以传递 `required` 参数：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: true
);
```

如果您希望自定义验证消息，您还可以传递一个字符串：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: 'Your name is required.'
);
```

#### 额外验证

最后，如果您希望执行额外的验证逻辑，您可以将一个闭包传递给 `validate` 参数：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

闭包将接收输入的值并且可能返回一个错误消息，或者如果验证通过，则返回 `null`。

或者，您可以利用 Laravel 的 [validator](/docs/11/basics/validation) 功能。为此，提供一个包含属性名称和所需验证规则数组的 `validate` 参数：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: ['name' => 'required|min:3|max:255']
);
```

### 搜索

如果有许多选项供用户选择，`search` 函数允许用户输入搜索查询来过滤结果，然后使用箭头键选择一个选项：

```php
use function Laravel\Prompts\search;

$id = search(
    'Search for the user that should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

闭包将接收到目前为止用户输入的文本，并且必须返回一个选项数组。如果您返回一个关联数组，则将返回所选择的选项的键，否则将返回其值。

您还可以包括占位符文本和信息提示：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    placeholder: 'E.g. Taylor Otwell',
    options: fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: 'The user will receive an email immediately.'
);
```

在列表开始滚动之前，最多五个选项将被显示。您可以通过传递 `scroll` 参数来自定义此行为：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

#### 验证

如果您希望执行额外的验证逻辑，您可以将一个闭包传递给 `validate` 参数：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    validate: function (int|string $value) {
        $user = User::findOrFail($value);

        if ($user->opted_out) {
            return 'This user has opted-out of receiving mail.';
        }
    }
);
```

如果 `options` 闭包返回一个关联数组，则闭包将接收所选择的键，否则，它将接收所选择的值。闭包可能返回一个错误信息，或者如果验证通过，则返回 `null`。

### 多项搜索

如果有很多可搜索的选项，并且需要用户能够选择多项，`multisearch` 函数允许用户输入搜索查询来过滤结果，然后使用箭头键和空格键选择选项：

```php
use function Laravel\Prompts\multisearch;

$ids = multisearch(
    'Search for the users that should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

闭包将接收到目前为止用户输入的文本，并必须返回一个选项数组。如果您返回一个关联数组，则将返回所选择的选项的键；否则，将返回它们的值。

您还可以包括占位符文本和信息提示：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    placeholder: 'E.g. Taylor Otwell',
    options: fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: 'The user will receive an email immediately.'
);
```

在列表开始滚动之前，最多五个选项将被显示。您可以通过提供 `scroll` 参数来自定义此行为：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

#### 需要一个值

默认情况下，用户可以选择零个或更多选项。您可以传递 `required` 参数来强制选择一个或多个选项：

```php
$ids = multisearch(
    'Search for the users that should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: true,
);
```

如果您希望自定义验证信息，您也可以提供一个字符串给 `required` 参数：

```php
$ids = multisearch(
    'Search for the users that should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: 'You must select at least one user.'
);
```

#### 验证

如果您想要执行额外的验证逻辑，您可以将一个闭包传递给 `validate` 参数：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    validate: function (array $values) {
        $optedOut = User::where('name', 'like', '%a%')->findMany($values);

        if ($optedOut->isNotEmpty()) {
            return $optedOut->pluck('name')->join(', ', ', and ').' have opted out.';
        }
    }
);
```

如果 `options` 闭包返回一个关联数组，则闭包将接收所选择的键；否则，它将接收所选择的值。闭包可能返回一个错误信息，或者如果验证通过，则返回 `null`。

### 暂停

`pause` 函数可用于向用户显示信息文本，并等待他们通过按 Enter / Return 键确认他们希望继续的意愿：

```php
use function Laravel\Prompts\pause;

pause('Press ENTER to continue.');
```

## 信息消息

`note`、`info`、`warning`、`error` 和 `alert` 函数可用于显示信息性消息：

```php
use function Laravel\Prompts\info;

info('Package installed successfully.');
```

## 表格

`table` 函数可以轻松地显示多行多列的数据。您只需要提供列名和表格数据：

```php
use function Laravel\Prompts\table;

table(
    ['Name', 'Email'],
    User::all(['name', 'email'])
);
```

## 旋转

`spin` 函数在执行指定的回调时显示一个旋转器以及一个可选的消息。它用来指示正在进行的过程，并在完成后返回回调的结果：

```php
use function Laravel\Prompts\spin;

$response = spin(
    fn () => Http::get('http://example.com'),
    'Fetching response...'
);
```

> [!WARNING]  
> `spin` 函数需要 `pcntl` PHP 扩展来使旋转器动画化。如果没有这个扩展，将会显示一个静态的旋转器。

## 进度条

对于耗时较长的任务，显示一个进度条来告知用户任务完成情况是很有帮助的。使用 `progress` 函数，Laravel 将显示一个进度条，并为给定的迭代值的每次迭代推进进度条：

```php
use function Laravel\Prompts\progress;

$users = progress(
    label: 'Updating users',
    steps: User::all(),
    callback: fn ($user) => $this->performTask($user),
);
```

`progress` 函数的行为类似于 map 函数，并将返回每次回调迭代的返回值数组。

回调还可以接受 `\Laravel\Prompts\Progress` 实例，允许您在每次迭代中修改标签和提示：

```php
$users = progress(
    label: 'Updating users',
    steps: User::all(),
    callback: function ($user, $progress) {
        $progress
            ->label("Updating {$user->name}")
            ->hint("Created on {$user->created_at}");

        return $this->performTask($user);
    },
    hint: 'This may take some time.',
);
```

有时，您可能需要更手动地控制进度条的推进。首先，定义过程将迭代的总步数。然后，在处理每个项目之后通过 `advance` 方法推进进度条：

```php
$progress = progress(label: 'Updating users', steps: 10);

$users = User::all();

$progress->start();

foreach ($users as $user) {
    $this->performTask($user);

    $progress->advance();
}

$progress->finish();
```

## 终端注意事项

#### 终端宽度

如果任何标签、选项或验证信息的长度超过了用户终端的“列”数，它将会被自动截断以适配。如果您的用户可能使用较窄的终端，请考虑缩短这些字符串的长度。通常 74 个字符长度是安全的上限，以支持 80 字符的终端。

#### 终端高度

对于接受 `scroll` 参数的任何提示，配置的值将自动减少以适配用户终端的高度，包括为验证信息留出空间。

## 不支持的环境和替代方案

Laravel Prompts 支持 macOS、Linux 和 Windows 的 WSL。由于 Windows 版本的 PHP 的限制，目前不可能在 WSL 之外的 Windows 上使用 Laravel Prompts。

因此，Laravel Prompts 支持回退到另一种实现方式，比如 [Symfony Console Question Helper](https://symfony.com/doc/7.0/components/console/helpers/questionhelper.html)。

> [!NOTE]  
> 当你在 Laravel 框架中使用 Laravel Prompts 时，每种提示的替代方案已经为您配置好，并将在不支持的环境中自动启用。

#### 替代情况

如果您不使用 Laravel 或需要自定义回退行为的使用时机，您可以向 `Prompt` 类的 `fallbackWhen` 静态方法传递一个布尔值：

```php
use Laravel\Prompts\Prompt;

Prompt::fallbackWhen(
    ! $input->isInteractive() || windows_os() || app()->runningUnitTests()
);
```

#### 替代行为

如果您不使用 Laravel 或需要自定义回退行为，您可以向每个提示类的 `fallbackUsing` 静态方法传递一个闭包：

```php
use Laravel\Prompts\TextPrompt;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;

TextPrompt::fallbackUsing(function (TextPrompt $prompt) use ($input, $output) {
    $question = (new Question($prompt->label, $prompt->default ?: null))
        ->setValidator(function ($answer) use ($prompt) {
            if ($prompt->required && $answer === null) {
                throw new \RuntimeException(is_string($prompt->required) ? $prompt->required : 'Required.');
            }

            if ($prompt->validate) {
                $error = ($prompt->validate)($answer ?? '');

                if ($error) {
                    throw new \RuntimeException($error);
                }
            }

            return $answer;
        });

    return (new SymfonyStyle($input, $output))
        ->askQuestion($question);
});
```

替代方案必须为每个提示类单独配置。闭包将接收提示类的一个实例，并且必须返回适合该提示的相应类型。
