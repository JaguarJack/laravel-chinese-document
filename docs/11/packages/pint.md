# Laravel Pint

[[toc]]

## 介绍

[Laravel Pint](https://github.com/laravel/pint) 是一个为极简主义者设计的固执的 PHP 代码风格修正器。Pint 基于 PHP-CS-Fixer，能够确保你的代码风格保持整洁一致。

Pint 会自动安装在所有新的 Laravel 应用程序中，因此你可以立即开始使用它。默认情况下，Pint 不需要任何配置，它会根据 Laravel 的固执编码风格来修复代码中的风格问题。

## 安装

在最近的 Laravel 框架版本中已经包括了 Pint，所以通常不需要安装。但是，对于较旧的应用程序，你可以通过 Composer 安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

## 运行 Pint

你可以通过调用项目的 `vendor/bin` 目录中的 `pint` 可执行文件来指示 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

你也可以在特定的文件或目录上运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

Pint 将显示一个详细的列表，包含它更新过的所有文件。通过在调用 Pint 时提供 `-v` 选项，你可以查看 Pint 更改的更详细信息：

```shell
./vendor/bin/pint -v
```

如果你希望 Pint 只是检查你的代码风格错误，而实际上不改变文件，你可以使用 `--test` 选项：

```shell
./vendor/bin/pint --test
```

如果你希望 Pint 只修改根据 Git 还没有提交的变更过的文件，你可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

## 配置 Pint

如前所述，Pint 不需要任何配置。然而，如果你希望自定义预设、规则或检查的文件夹，你可以通过在项目根目录中创建一个 `pint.json` 文件来完成：

```json
{
  "preset": "laravel"
}
```

此外，如果你希望使用来自特定目录的 `pint.json`，你在调用 Pint 时可以提供 `--config` 选项：

```shell
pint --config vendor/my-company/coding-style/pint.json
```

### 预设

预设定义了一组可以用于修复代码风格问题的规则。默认情况下，Pint 使用 `laravel` 预设，这个预设会根据 Laravel 的固执编码风格来修复问题。然而，你通过提供 `--preset` 选项给 Pint 来指定不同的预设：

```shell
pint --preset psr12
```

如果你愿意，你也可以在项目的 `pint.json` 文件中设置预设：

```json
{
  "preset": "psr12"
}
```

Pint 当前支持的预设包括：`laravel`, `per`, `psr12`, 和 `symfony`。

### 规则

规则是 Pint 用来修复代码风格问题的风格指南。如上所述，预设是事先定义的规则组合，通常已经足够适用于大多数 PHP 项目，因此你通常不需要关心它们所包含的个别规则。

然而，如果你愿意，你可以在你的 `pint.json` 文件中启用或禁用特定规则：

```json
{
  "preset": "laravel",
  "rules": {
    "simplified_null_return": true,
    "braces": false,
    "new_with_braces": {
      "anonymous_class": false,
      "named_class": false
    }
  }
}
```

Pint 构建在 [PHP-CS-Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 的基础之上。因此，你可以使用它的任何规则来修复项目中的代码风格问题：[PHP-CS-Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

### 排除文件/文件夹

默认情况下，Pint 会检查项目中所有的 `.php` 文件，除了 `vendor` 目录的文件。如果你希望排除更多的文件夹，你可以使用 `exclude` 配置选项来完成：

```json
{
  "exclude": ["my-specific/folder"]
}
```

如果你希望排除包含特定名称模式的所有文件，你可以使用 `notName` 配置选项来完成：

```json
{
  "notName": ["*-my-file.php"]
}
```

如果你想要通过提供文件的精确路径来排除某个文件，你可以使用 `notPath` 配置选项来完成：

```json
{
  "notPath": ["path/to/excluded-file.php"]
}
```
