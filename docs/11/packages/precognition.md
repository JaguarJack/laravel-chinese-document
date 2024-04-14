# Precognition

[[toc]]

## 介绍

Laravel Precognition 允许您预测未来 HTTP 请求的结果。Precognition 的主要用例之一是为您的前端 JavaScript 应用程序提供“实时”验证，而无需复制应用程序后端的验证规则。Precognition 特别适合与 Laravel 的基于 Inertia 的[启动工具包](/docs/11/getting-started/starter-kits)配合使用。

当 Laravel 接收到一个“预知请求”时，它将执行该路由的所有中间件并解析路由的控制器依赖项，包括验证[表单请求](/docs/11/basics/validation#form-request-validation) - 但它实际上不会执行路由的控制器方法。

## 实时验证

### 使用 Vue

使用 Laravel Precognition，您可以为用户提供实时验证体验，而无需在前端 Vue 应用程序中复制验证规则。为了说明它如何工作，让我们为创建新用户构建一个表单。

首先，要为路由启用 Precognition，应将`HandlePrecognitiveRequests`中间件添加到路由定义中。您还应该创建一个[表单请求](/docs/11/basics/validation#form-request-validation)来容纳路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，您应该通过 NPM 为 Vue 安装 Laravel Precognition 前端助手：

```shell
npm install laravel-precognition-vue
```

安装 Laravel Precognition 包后，您现在可以使用 Precognition 的`useForm`函数创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）和初始表单数据。

然后，要启用实时验证，在每个输入的`change`事件中调用表单的`validate`方法，传入输入的名称：

```vue
<script setup>
import { useForm } from 'laravel-precognition-vue'

const form = useForm('post', '/users', {
  name: '',
  email: ''
})

const submit = () => form.submit()
</script>

<template>
  <form @submit.prevent="submit">
    <label for="name">Name</label>
    <input id="name" v-model="form.name" @change="form.validate('name')" />
    <div v-if="form.invalid('name')">
      {{ form.errors.name }}
    </div>

    <label for="email">Email</label>
    <input id="email" type="email" v-model="form.email" @change="form.validate('email')" />
    <div v-if="form.invalid('email')">
      {{ form.errors.email }}
    </div>

    <button :disabled="form.processing">Create User</button>
  </form>
</template>
```

现在，随着用户填写表单，Precognition 将根据路由的表单请求中的验证规则提供实时验证输出。当表单的输入改变时，将发送一个防抖“预知”验证请求到您的 Laravel 应用程序。您可以通过调用表单的`setValidationTimeout`函数来配置防抖超时：

```js
form.setValidationTimeout(3000)
```

当验证请求正在进行时，表单的`validating`属性将为`true`：

```html
<div v-if="form.validating">Validating...</div>
```

在验证请求或表单提交过程中返回的任何验证错误将自动填充表单的`errors`对象：

```html
<div v-if="form.invalid('email')">{{ form.errors.email }}</div>
```

您可以使用表单的`hasErrors`属性来确定表单是否有任何错误：

```html
<div v-if="form.hasErrors">
  <!-- ... -->
</div>
```

您还可以通过分别将输入的名称传递给表单的`valid`和`invalid`函数，来确定输入是否通过或失败验证：

```html
<span v-if="form.valid('email')">✅</span>

<span v-else-if="form.invalid('email')">❌</span>
```

> [!WARNING]  
> 仅当表单输入发生变化且收到验证响应后，表单输入才会显示为有效或无效。

如果您正在使用 Precognition 验证表单输入的一个子集，手动清除错误可能会很有用。您可以使用表单的`forgetError`函数来实现这一点：

```html
<input
  id="avatar"
  type="file"
  @change="(e) => {
        form.avatar = e.target.files[0]

        form.forgetError('avatar')
    }" />
```

当然，您还可以根据对表单提交响应的代码执行。表单的`submit`函数返回一个 Axios 请求 Promise。这提供了一个方便的方式来访问响应载荷，在成功提交表单后重置表单输入或处理失败的请求：

```js
const submit = () =>
  form
    .submit()
    .then((response) => {
      form.reset()

      alert('User created.')
    })
    .catch((error) => {
      alert('An error occurred.')
    })
```

您可以通过检查表单的`processing`属性来确定表单提交请求是否正在进行中：

```html
<button :disabled="form.processing">Submit</button>
```

### 使用 Vue 和 Inertia

> [!NOTE]  
> 如果您希望在使用 Vue 和 Inertia 开发 Laravel 应用程序时走在前列，可以考虑使用我们的其中一个[启动工具包](/docs/11/getting-started/starter-kits)。Laravel 的启动工具包为您的新 Laravel 应用程序提供了后端和前端的认证脚手架。

在使用 Vue 和 Inertia 之前，请确保复习我们关于[使用 Vue 的 Precognition](#using-vue)的普通文档。使用 Vue 和 Inertia 时，您将需要通过 NPM 安装与 Inertia 兼容的 Precognition 库：

```shell
npm install laravel-precognition-vue-inertia
```

一旦安装成功，Precognition 的`useForm`函数将返回一个增强了上述验证功能的 Inertia [表单助手](https://inertiajs.com/forms#form-helper)。

表单助手的`submit`方法已被简化，不再需要指定 HTTP 方法或 URL。相反，您可以传入 Inertia 的[访问选项](https://inertiajs.com/manual-visits)作为第一个也是唯一的参数。此外，`submit`方法不返回 Promise，如上面的 Vue 示例中所见。相反，在给定给`submit`方法的访问选项中，您可以提供 Inertia 支持的任何[事件回调](https://inertiajs.com/manual-visits#event-callbacks)：

```vue
<script setup>
import { useForm } from 'laravel-precognition-vue-inertia'

const form = useForm('post', '/users', {
  name: '',
  email: ''
})

const submit = () =>
  form.submit({
    preserveScroll: true,
    onSuccess: () => form.reset()
  })
</script>
```

### 使用 React

使用 Laravel Precognition，您可以为用户提供实时验证体验，而无需在前端 React 应用程序中复制验证规则。为了说明它如何工作，让我们为创建新用户构建一个表单。

首先，要为路由启用 Precognition，应将`HandlePrecognitiveRequests`中间件添加到路由定义中。您还应该创建一个[表单请求](/docs/11/basics/validation#form-request-validation)来容纳路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，您应该通过 NPM 为 React 安装 Laravel Precognition 前端助手：

```shell
npm install laravel-precognition-react
```

安装 Laravel Precognition 包后，您现在可以使用 Precognition 的`useForm`函数创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）和初始表单数据。

要启用实时验证，您应该监听每个输入的`change`和`blur`事件。在`change`事件处理程序中，您应该使用`setData`函数设置表单数据，传入输入的名称和新值。然后，在`blur`事件处理程序中调用表单的`validate`方法，提供输入的名称：

```jsx
import { useForm } from 'laravel-precognition-react'

export default function Form() {
  const form = useForm('post', '/users', {
    name: '',
    email: ''
  })

  const submit = (e) => {
    e.preventDefault()

    form.submit()
  }

  return (
    <form onSubmit={submit}>
      <label for='name'>Name</label>
      <input id='name' value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} onBlur={() => form.validate('name')} />
      {form.invalid('name') && <div>{form.errors.name}</div>}

      <label for='email'>Email</label>
      <input id='email' value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} onBlur={() => form.validate('email')} />
      {form.invalid('email') && <div>{form.errors.email}</div>}

      <button disabled={form.processing}>Create User</button>
    </form>
  )
}
```

现在，随着用户填写表单，Precognition 将根据路由的表单请求中的验证规则提供实时验证输出。当表单的输入改变时，将发送一个防抖“预知”验证请求到您的 Laravel 应用程序。您可以通过调用表单的`setValidationTimeout`函数来配置防抖超时：

```js
form.setValidationTimeout(3000)
```

当验证请求正在进行时，表单的`validating`属性将为`true`：

```jsx
{
  form.validating && <div>Validating...</div>
}
```

在验证请求或表单提交过程中返回的任何验证错误将自动填充表单的`errors`对象：

```jsx
{
  form.invalid('email') && <div>{form.errors.email}</div>
}
```

您可以使用表单的`hasErrors`属性来确定表单是否有任何错误：

```jsx
{form.hasErrors && <div><!-- ... --></div>}
```

您还可以通过分别将输入的名称传递给表单的`valid`和`invalid`函数，来确定输入是否通过或失败验证：

```jsx
{
  form.valid('email') && <span>✅</span>
}

{
  form.invalid('email') && <span>❌</span>
}
```

> [!WARNING]  
> 仅当表单输入发生变化且收到验证响应后，表单输入才会显示为有效或无效。

如果您正在使用 Precognition 验证表单输入的一个子集，手动清除错误可能会很有用。您可以使用表单的`forgetError`函数来实现这一点：

```jsx
<input
    id="avatar"
    type="file"
    onChange={(e) =>
        form.setData('avatar', e.target.value);

        form.forgetError('avatar');
    }
>
```

当然，您还可以根据对表单提交响应的代码执行。表单的`submit`函数返回一个 Axios 请求 Promise。这提供了一个方便的方式来访问响应载荷，在成功提交表单后重置表单输入或处理失败的请求：

```js
const submit = (e) => {
  e.preventDefault()

  form
    .submit()
    .then((response) => {
      form.reset()

      alert('User created.')
    })
    .catch((error) => {
      alert('An error occurred.')
    })
}
```

您可以通过检查表单的`processing`属性来确定表单提交请求是否正在进行中：

```html
<button disabled="{form.processing}">Submit</button>
```

### 使用 React 和 Inertia

> [!NOTE]  
> 如果您希望在使用 React 和 Inertia 开发 Laravel 应用程序时走在前列，可以考虑使用我们的其中一个[启动工具包](/docs/11/getting-started/starter-kits)。Laravel 的启动工具包为您的新 Laravel 应用程序提供了后端和前端的认证脚手架。

在使用 React 和 Inertia 之前，请确保复习我们关于[使用 React 的 Precognition](#using-react)的普通文档。使用 React 和 Inertia 时，您将需要通过 NPM 安装与 Inertia 兼容的 Precognition 库：

```shell
npm install laravel-precognition-react-inertia
```

一旦安装成功，Precognition 的`useForm`函数将返回一个增强了上述验证功能的 Inertia [表单助手](https://inertiajs.com/forms#form-helper)。

表单助手的`submit`方法已被简化，不再需要指定 HTTP 方法或 URL。相反，您可以传入 Inertia 的[访问选项](https://inertiajs.com/manual-visits)作为第一个也是唯一的参数。此外，`submit`方法不返回 Promise，如上面的 React 示例中所见。相反，在给定给`submit`方法的访问选项中，您可以提供 Inertia 支持的任何[事件回调](https://inertiajs.com/manual-visits#event-callbacks)：

```js
import { useForm } from 'laravel-precognition-react-inertia'

const form = useForm('post', '/users', {
  name: '',
  email: ''
})

const submit = (e) => {
  e.preventDefault()

  form.submit({
    preserveScroll: true,
    onSuccess: () => form.reset()
  })
}
```
