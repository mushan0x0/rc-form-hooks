# rc-form-hooks

> Use hooks to bind form components to actions such as uniform validation and get values.

[![NPM](https://img.shields.io/npm/v/rc-form-hooks.svg)](https://www.npmjs.com/package/rc-form-hooks) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save rc-form-hooks
```

or

```bash
yarn add rc-form-hooks
```

## Usage

```tsx
import React from 'react';
import useForm from 'rc-form-hooks';

export default () => {
  const { getFieldDecorator, validateFields, errors, values } = useForm<{
    username: string;
  }>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateFields()
      .then(console.log)
      .catch(e => console.error(e.message));
  };
  return (
    <form onSubmit={handleSubmit}>
      {getFieldDecorator('username', {
        rules: [{ required: true, message: 'Please input username!' }]
      })(<input type='text' />)}
      <span className={'value'}>{values.username}</span>
      <span className={'error'}>{errors.username.message}</span>
      <button type={'submit'}>submit</button>
    </form>
  );
};
```

## License

MIT © [mushan0x0](https://github.com/mushan0x0)
