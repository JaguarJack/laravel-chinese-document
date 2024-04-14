---
title: Laravel 文件存储
---

# 文件存储

## 介绍

Laravel 提供了强大的文件系统抽象，多亏了 Frank de Jonge 优秀的 [Flysystem](https://github.com/thephpleague/flysystem) PHP 包。Laravel 的 Flysystem 集成提供了简单的驱动程序，用于处理本地文件系统、SFTP 和 Amazon S3。更好的是，当你在本地开发机器和生产服务器之间切换这些存储选项时，API 对每个系统都保持不变。

## 配置

Laravel 的文件系统配置文件位于 `config/filesystems.php`。在这个文件中，你可以配置你所有的文件系统 "磁盘"。每个磁盘代表一个特定的存储驱动程序和存储位置。配置文件中包含了每个支持驱动程序的示例配置，因此你可以根据你的存储偏好和凭证修改配置。

`local` 驱动程序与运行 Laravel 应用程序的服务器上存储的文件进行交互，而 `s3` 驱动程序用于写入 Amazon 的 S3 云存储服务。

> [!NOTE]
> 你可以配置任意多的磁盘，甚至可以有多个使用相同驱动程序的磁盘。

### 本地驱动程序

使用 `local` 驱动程序时，所有文件操作都相对于你的 `filesystems` 配置文件中定义的 `root` 目录。默认情况下，这个值被设置为 `storage/app` 目录。因此，下面的方法将写入到 `storage/app/example.txt`：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('local')->put('example.txt', 'Contents');
```

### 公共磁盘

应用程序 `filesystems` 配置文件中包含的 `public` 磁盘适用于将要公开访问的文件。默认情况下，`public` 磁盘使用 `local` 驱动程序，并将其文件存储在 `storage/app/public`。

为了使这些文件可以从 web 访问，你应该创建一个从 `public/storage` 到 `storage/app/public` 的符号链接。利用这种文件夹约定将使你可以在一个目录中保持公开访问的文件，这些文件可以在使用像 [Envoyer](https://envoyer.io) 这样的零停机部署系统时轻松共享。

要创建符号链接，你可以使用 `storage:link` Artisan 命令：

```shell
php artisan storage:link
```

存储文件和创建符号链接后，你可以使用 `asset` 辅助函数创建文件的 URL：

```php
echo asset('storage/file.txt');
```

你可以在 `filesystems` 配置文件中配置额外的符号链接。当你运行 `storage:link` 命令时，将创建配置的每个链接：

```php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('images') => storage_path('app/images'),
],
```

`storage:unlink` 命令可用于销毁配置的符号链接：

```shell
php artisan storage:unlink
```

### 驱动程序先决条件

#### S3 驱动程序配置

在使用 S3 驱动程序之前，你需要通过 Composer 包管理器安装 Flysystem S3 包：

```shell
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

S3 磁盘配置数组位于你的 `config/filesystems.php` 配置文件中。通常，你应该使用以下环境变量配置你的 S3 信息和凭证，这些变量由 `config/filesystems.php` 配置文件引用：

```ini
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=<your-bucket-name>
AWS_USE_PATH_STYLE_ENDPOINT=false
```

为方便起见，这些环境变量与 AWS CLI 使用的命名约定一致。

#### FTP 驱动程序配置

在使用 FTP 驱动程序之前，你需要通过 Composer 包管理器安装 Flysystem FTP 包：

```shell
composer require league/flysystem-ftp "^3.0"
```

Laravel 的 Flysystem 集成很好地与 FTP 配合工作；但是，框架默认的 `config/filesystems.php` 配置文件中没有包含样本配置。如果你需要配置一个 FTP 文件系统，你可以使用以下配置示例：

```php
'ftp' => [
    'driver' => 'ftp',
    'host' => env('FTP_HOST'),
    'username' => env('FTP_USERNAME'),
    'password' => env('FTP_PASSWORD'),

    // 可选的 FTP 设置...
    // 'port' => env('FTP_PORT', 21),
    // 'root' => env('FTP_ROOT'),
    // 'passive' => true,
    // 'ssl' => true,
    // 'timeout' => 30,
],
```

#### SFTP 驱动程序配置

在使用 SFTP 驱动程序之前，你需要通过 Composer 包管理器安装 Flysystem SFTP 包：

```shell
composer require league/flysystem-sftp-v3 "^3.0"
```

Laravel 的 Flysystem 集成很好地与 SFTP 配合工作；但是，框架默认的 `config/filesystems.php` 配置文件中没有包含样本配置。如果你需要配置一个 SFTP 文件系统，你可以使用以下配置示例：

```php
'sftp' => [
    'driver' => 'sftp',
    'host' => env('SFTP_HOST'),

    // 基本认证设置...
    'username' => env('SFTP_USERNAME'),
    'password' => env('SFTP_PASSWORD'),

    // 使用加密密码的 SSH 密钥认证设置...
    'privateKey' => env('SFTP_PRIVATE_KEY'),
    'passphrase' => env('SFTP_PASSPHRASE'),

    // 文件/目录权限设置...
    'visibility' => 'private', // `private` = 0600, `public` = 0644
    'directory_visibility' => 'private', // `private` = 0700, `public` = 0755

    // 可选的 SFTP 设置...
    // 'hostFingerprint' => env('SFTP_HOST_FINGERPRINT'),
    // 'maxTries' => 4,
    // 'passphrase' => env('SFTP_PASSPHRASE'),
    // 'port' => env('SFTP_PORT', 22),
    // 'root' => env('SFTP_ROOT', ''),
    // 'timeout' => 30,
    // 'useAgent' => true,
],
```

### 限定范围和只读文件系统

限定范围的磁盘允许你定义一个自动以给定路径前缀为前缀的文件系统。在创建限定范围的文件系统磁盘之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-path-prefixing "^3.0"
```

你可以通过定义使用 `scoped` 驱动程序的磁盘，来创建任何现有文件系统磁盘的路径限定范围实例。例如，你可以创建一个磁盘，该磁盘将你现有的 `s3` 磁盘的范围限制在特定路径前缀下，然后你使用限定范围的磁盘进行的每个文件操作都将使用指定的前缀：

```php
's3-videos' => [
    'driver' => 'scoped',
    'disk' => 's3',
    'prefix' => 'path/to/videos',
],
```

“只读”磁盘允许你创建不允许写操作的文件系统磁盘。在使用 `read-only` 配置选项之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-read-only "^3.0"
```

接下来，你可以在一个或多个磁盘的配置数组中包含 `read-only` 配置选项：

```php
's3-videos' => [
    'driver' => 's3',
    // ...
    'read-only' => true,
],
```

### 兼容 Amazon S3 的文件系统

默认情况下，你的应用程序的 `filesystems` 配置文件包含了 `s3` 磁盘的磁盘配置。除了使用这个磁盘与 Amazon S3 进行交互外，你还可以用它来与任何兼容 S3 的文件存储服务，如 [MinIO](https://github.com/minio/minio) 或 [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/) 进行交互。

通常，更新磁盘的凭证以匹配你打算使用的服务的凭证后，你只需要更新 `endpoint` 配置选项的值。这个选项的值通常是通过 `AWS_ENDPOINT` 环境变量定义的：

```php
'endpoint' => env('AWS_ENDPOINT', 'https://minio:9000'),
```

#### MinIO

为了让 Laravel 的 Flysystem 集成在使用 MinIO 时生成正确的 URL，你应该定义 `AWS_URL` 环境变量，使其与应用程序的本地 URL 匹配，并在 URL 路径中包含存储桶名称：

```ini
AWS_URL=http://localhost:9000/local
```

> [!WARNING]
> 使用 MinIO 时，通过 `temporaryUrl` 方法生成临时存储 URL 是不支持的。

## 获取磁盘实例

`Storage` facade 可用于与你配置的任何磁盘交互。例如，你可以使用 facade 上的 `put` 方法将头像存储在默认磁盘上。如果你在没有首先调用 `disk` 方法的情况下调用 `Storage` facade 上的方法，该方法将自动传递给默认磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('avatars/1', $content);
```

如果你的应用程序与多个磁盘交互，你可以使用 `Storage` facade 上的 `disk` 方法处理特定磁盘上的文件：

```php
Storage::disk('s3')->put('avatars/1', $content);
```

### 按需磁盘

有时你可能希望在运行时使用给定配置创建磁盘，而这个配置实际上并不存在于你的应用程序的 `filesystems` 配置文件中。为了实现这一点，你可以将配置数组传递给 `Storage` facade 的 `build` 方法：

```php
use Illuminate\Support\Facades\Storage;

$disk = Storage::build([
    'driver' => 'local',
    'root' => '/path/to/root',
]);

$disk->put('image.jpg', $content);
```

## 检索文件

`get` 方法可用于检索文件内容。文件的原始字符串内容将被方法返回。记住，所有文件路径应该相对于磁盘的 "root" 位置指定：

```php
$contents = Storage::get('file.jpg');
```

如果你检索的文件包含 JSON，你可以使用 `json` 方法检索文件并解码其内容：

```php
$orders = Storage::json('orders.json');
```

`exists` 方法可用于确定磁盘上是否存在文件：

```php
if (Storage::disk('s3')->exists('file.jpg')) {
    // ...
}
```

`missing` 方法可用于确定磁盘上是否缺少文件：

```php
if (Storage::disk('s3')->missing('file.jpg')) {
    // ...
}
```

### 下载文件

`download` 方法可用于生成一个响应，以强制用户的浏览器下载给定路径的文件。`download` 方法接受一个文件名作为方法的第二个参数，这将决定用户下载文件时看到的文件名。最后，你可以将 HTTP 标头的数组作为第三个参数传递给该方法：

```php
return Storage::download('file.jpg');

return Storage::download('file.jpg', $name, $headers);
```

### 文件 URL

你可以使用 `url` 方法获取给定文件的 URL。如果你使用的是 `local` 驱动程序，这通常只是在给定路径前加上 `/storage` 并返回文件的相对 URL。如果你使用的是 `s3` 驱动程序，将返回完全合格的远程 URL：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::url('file.jpg');
```

当使用 `local` 驱动程序时，所有应该公开访问的文件都应该放在 `storage/app/public` 目录中。此外，你应该在 `public/storage` 处[创建一个符号链接](#the-public-disk)，指向 `storage/app/public` 目录。

> [!WARNING]
> 当使用 `local` 驱动程序时，`url` 的返回值不是 URL 编码的。因此，我们建议始终使用将创建有效 URL 的文件名来存储你的文件。

#### URL 主机自定义

如果你想修改使用 `Storage` facade 生成的 URL 的主机，你可以在磁盘的配置数组中添加或更改 `url` 选项：

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
    'throw' => false,
],
```

#### 临时上传 URLs

> [!WARNING]：
> 生成临时上传 URLs 的能力仅由 `s3` 驱动支持。

如果你需要生成一个可用于直接从客户端应用程序上传文件的临时 URL，你可以使用 `temporaryUploadUrl` 方法。此方法接受一个路径和一个 `DateTime` 实例，指定 URL 何时过期。`temporaryUploadUrl` 方法返回一个关联数组，可以将其解构为上传 URL 和应与上传请求一起包含的头部：

```php
use Illuminate\Support\Facades\Storage;

['url' => $url, 'headers' => $headers] = Storage::temporaryUploadUrl(
    'file.jpg', now()->addMinutes(5)
);
```

这个方法主要适用于需要客户端应用程序直接将文件上传到云存储系统（如 Amazon S3）的无服务器环境。

### 文件元数据

除了读取和写入文件，Laravel 还可以提供有关文件本身的信息。例如，`size` 方法可以用来获取文件的大小（以字节为单位）：

```php
use Illuminate\Support\Facades\Storage;

$size = Storage::size('file.jpg');
```

`lastModified` 方法返回文件最后修改时间的 UNIX 时间戳：

```php
$time = Storage::lastModified('file.jpg');
```

可以通过 `mimeType` 方法获得给定文件的 MIME 类型：

```php
$mime = Storage::mimeType('file.jpg');
```

#### 文件路径

你可以使用 `path` 方法来获取给定文件的路径。如果你使用的是 `local` 驱动，这将返回文件的绝对路径。如果你使用的是 `s3` 驱动，这个方法将返回 S3 存储桶中文件的相对路径：

```php
use Illuminate\Support\Facades\Storage;

$path = Storage::path('file.jpg');
```

## 存储文件

`put` 方法可用于将文件内容存储在磁盘上。你也可以向 `put` 方法传递一个 PHP `resource`，它将利用底层的 Flysystem 流支持。请记住，所有文件路径都应根据磁盘配置的 "root" 位置来指定：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents);

Storage::put('file.jpg', $resource);
```

#### 写入失败

如果 `put` 方法（或其他 "写" 操作）无法将文件写入磁盘，将会返回 `false`：

```php
if (! Storage::put('file.jpg', $contents)) {
    // 文件无法写入磁盘...
}
```

如果你愿意，你可以在文件系统磁盘的配置数组中定义 `throw` 选项。当这个选项被定义为 `true` 时，像 `put` 这样的 "write" 方法在写操作失败时会抛出 `League\Flysystem\UnableToWriteFile` 的实例：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

### 预置和追加到文件

`prepend` 和 `append` 方法允许你在文件的开头或结尾写入内容：

```php
Storage::prepend('file.log', 'Prepended Text');

Storage::append('file.log', 'Appended Text');
```

### 复制和移动文件

`copy` 方法可用于将现有文件复制到磁盘上的新位置，而 `move` 方法可用于将现有文件重命名或移动到新位置：

```php
Storage::copy('old/file.jpg', 'new/file.jpg');

Storage::move('old/file.jpg', 'new/file.jpg');
```

### 自动流

流文件到存储可以显著减少内存使用。如果你希望 Laravel 自动管理将给定文件流式传输到你的存储位置，你可以使用 `putFile` 或 `putFileAs` 方法。这个方法接受一个 `Illuminate\Http\File` 或 `Illuminate\Http\UploadedFile` 实例，并将自动将文件流式传输到你希望的位置：

```php
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

// 自动为文件名生成一个唯一的 ID...
$path = Storage::putFile('photos', new File('/path/to/photo'));

// 手动指定文件名...
$path = Storage::putFileAs('photos', new File('/path/to/photo'), 'photo.jpg');
```

有几点关于 `putFile` 方法需要注意的重要事项。注意我们只指定了一个目录名，而不是指定了一个文件名。默认情况下，`putFile` 方法将生成一个唯一的 ID 用作文件名。文件的扩展名将通过检查文件的 MIME 类型来确定。文件的路径将由 `putFile` 方法返回，因此你可以在数据库中存储路径，包括生成的文件名。

`putFile` 和 `putFileAs` 方法还接受一个参数来指定存储文件的 "可见性"。这特别有用，如果你正在如 Amazon S3 这样的云磁盘上存储文件，并希望通过生成的 URLs 让文件公开可访问：

```php
Storage::putFile('photos', new File('/path/to/photo'), 'public');
```

### 文件上传

在网络应用程序中，存储文件最常见的用例之一是存储用户上传的文件，如照片和文档。Laravel 使得使用上传文件实例上的 `store` 方法非常容易存储上传的文件。使用你希望存储上传文件的路径调用 `store` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserAvatarController extends Controller
{
    /**
     * 为用户更新头像。
     */
    public function update(Request $request): string
    {
        $path = $request->file('avatar')->store('avatars');

        return $path;
    }
}
```

关于这个例子有几点重要的事情需要注意。注意我们只指定了一个目录名，而不是文件名。默认情况下，`store` 方法将生成一个唯一的 ID 用作文件名。文件的扩展名将通过检查文件的 MIME 类型来确定。`store` 方法将返回文件的路径，因此你可以在数据库中存储路径，包括生成的文件名。

你也可以在 `Storage` facade 上调用 `putFile` 方法来执行与上述示例相同的文件存储操作：

```php
$path = Storage::putFile('avatars', $request->file('avatar'));
```

#### 指定文件名

如果你不希望为你存储的文件自动分配一个文件名，你可以使用 `storeAs` 方法，它接受路径、文件名和（可选的）磁盘作为其参数：

```php
$path = $request->file('avatar')->storeAs(
    'avatars', $request->user()->id
);
```

你也可以使用 `Storage` facade 上的 `putFileAs` 方法来执行与上述示例相同的文件存储操作：

```php
$path = Storage::putFileAs(
    'avatars', $request->file('avatar'), $request->user()->id
);
```

> [!WARNING]：
> 不可打印和无效的 unicode 字符将自动从文件路径中移除。因此，你可能希望在将文件路径传递给 Laravel 的文件存储方法之前，先对其进行清理。文件路径使用 `League\Flysystem\WhitespacePathNormalizer::normalizePath` 方法进行标准化。

#### 指定磁盘

默认情况下，上传文件的 `store` 方法将使用你的默认磁盘。如果你想指定另一个磁盘，在 `store` 方法中作为第二个参数传递磁盘名称：

```php
$path = $request->file('avatar')->store(
    'avatars/'.$request->user()->id, 's3'
);
```

如果你正在使用 `storeAs` 方法，你可以将磁盘名称作为方法的第三个参数传递：

```php
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

#### 其他已上传文件信息

如果你想获取已上传文件的原始名称和扩展名，你可以使用 `getClientOriginalName` 和 `getClientOriginalExtension` 方法：

```php
$file = $request->file('avatar');

$name = $file->getClientOriginalName();
$extension = $file->getClientOriginalExtension();
```

然而，请记住，`getClientOriginalName` 和 `getClientOriginalExtension` 方法被认为是不安全的，因为文件名和扩展名可能会被恶意用户篡改。因此，你通常应该更倾向于使用 `hashName` 和 `extension` 方法来为给定文件上传获取名称和扩展名：

```php
$file = $request->file('avatar');

$name = $file->hashName(); // 生成唯一的随机名称...
$extension = $file->extension(); // 根据文件的 MIME 类型确定文件的扩展名...
```

### 文件可见性

在 Laravel 的 Flysystem 集成中，“可见性”是对多个平台的文件权限的抽象。文件可以被声明为 `public` 或 `private`。当文件被声明为 `public` 时，你正在表示该文件通常应该可以被他人访问。例如，当使用 S3 驱动时，你可以检索 `public` 文件的 URLs。

你可以在写入文件时通过 `put` 方法设置可见性：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents, 'public');
```

如果文件已经存储，可以通过 `getVisibility` 和 `setVisibility` 方法检索和设置其可见性：

```php
$visibility = Storage::getVisibility('file.jpg');

Storage::setVisibility('file.jpg', 'public');
```

当与已上传的文件交互时，你可以使用 `storePublicly` 和 `storePubliclyAs` 方法将上传的文件存储为 `public` 可见性：

```php
$path = $request->file('avatar')->storePublicly('avatars', 's3');

$path = $request->file('avatar')->storePubliclyAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

#### 本地文件和可见性

当使用 `local` 驱动时，`public` [可见性](#file-visibility) 对应于目录的 `0755` 权限和文件的 `0644` 权限。你可以在应用程序的 `filesystems` 配置文件中修改权限映射：

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app'),
    'permissions' => [
        'file' => [
            'public' => 0644,
            'private' => 0600,
        ],
        'dir' => [
            'public' => 0755,
            'private' => 0700,
        ],
    ],
    'throw' => false,
],
```

## 删除文件

`delete` 方法接受单个文件名或要删除的文件数组：

```php
use Illuminate\Support\Facades\Storage;

Storage::delete('file.jpg');

Storage::delete(['file.jpg', 'file2.jpg']);
```

如果需要，你可以指定文件应该从哪个磁盘删除：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->delete('path/file.jpg');
```

## 目录

#### 获取目录中的所有文件

`files` 方法返回给定目录中所有文件的数组。如果你想要检索给定目录中所有文件（包括所有子目录）的列表，你可以使用 `allFiles` 方法：

```php
use Illuminate\Support\Facades\Storage;

$files = Storage::files($directory);

$files = Storage::allFiles($directory);
```

#### 获取目录中的所有目录

`directories` 方法返回给定目录中所有目录的数组。此外，你可以使用 `allDirectories` 方法获取给定目录及其所有子目录中所有目录的列表：

```php
$directories = Storage::directories($directory);

$directories = Storage::allDirectories($directory);
```

#### 创建目录

`makeDirectory` 方法将创建给定目录，包括任何所需的子目录：

```php
Storage::makeDirectory($directory);
```

#### 删除目录

最后，`deleteDirectory` 方法可用来删除目录及其所有文件：

```php
Storage::deleteDirectory($directory);
```

## 测试

`Storage` facade 的 `fake` 方法允许你轻松生成一个假磁盘，当与 `Illuminate\Http\UploadedFile` 类的文件生成实用程序结合使用时，大大简化了文件上传的测试。例如：

```php
<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('albums can be uploaded', function () {
    Storage::fake('photos');

    $response = $this->json('POST', '/photos', [
        UploadedFile::fake()->image('photo1.jpg'),
        UploadedFile::fake()->image('photo2.jpg')
    ]);

    // 断言一个或多个文件被存储...
    Storage::disk('photos')->assertExists('photo1.jpg');
    Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

    // 断言一个或多个文件没有被存储...
    Storage::disk('photos')->assertMissing('missing.jpg');
    Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

    // 断言给定的目录是空的...
    Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');
});
```

默认情况下，`fake` 方法将删除其临时目录中的所有文件。如果你想保留这些文件，你可以改用 "persistentFake" 方法。有关测试文件上传的更多信息，你可以查阅 [HTTP 测试文档中有关文件上传](/docs/11/testing/http-tests#testing-file-uploads) 的信息。

> [!WARNING]：
> `image` 方法需要 [GD 扩展](https://www.php.net/manual/en/book.image.php)。

## 自定义文件系统

Laravel 的 Flysystem 集成默认提供了对几种 "驱动" 的支持；然而，Flysystem 并不局限于这些，并且有许多其他存储系统的适配器。如果你想在 Laravel 应用程序中使用这些额外适配器之一，你可以创建一个自定义驱动。

为了定义一个自定义文件系统，你将需要一个 Flysystem 适配器。我们来在项目中添加一个由社区维护的 Dropbox 适配器：

```shell
composer require spatie/flysystem-dropbox
```

接下来，你可以在应用程序的 [服务提供者](/docs/11/architecture-concepts/providers) 之一的 `boot` 方法中注册驱动。为此，你应该使用 `Storage` facade 的 `extend` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Storage::extend('dropbox', function (Application $app, array $config) {
            $adapter = new DropboxAdapter(new DropboxClient(
                $config['authorization_token']
            ));

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
```

`extend` 方法的第一个参数是驱动的名称，第二个是一个闭包，它接收 `$app` 和 `$config` 变量。闭包必须返回一个 `Illuminate\Filesystem\FilesystemAdapter` 实例。`$config` 变量包含 `config/filesystems.php` 中为指定磁盘定义的值。

一旦你创建并注册了扩展的服务提供者，你可以在 `config/filesystems.php` 配置文件中使用 `dropbox` 驱动。
