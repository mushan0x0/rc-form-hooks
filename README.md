# rc-form-hooks

> Use hooks to bind form components to actions such as uniform validation and get values.

[![NPM](https://img.shields.io/npm/v/rc-form-hooks.svg)](https://www.npmjs.com/package/rc-form-hooks) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save rc-form-hooks
```

## Usage

```tsx
import React from 'react'
import useForm from 'rc-form-hooks'

export default () => {
  const { getFieldDecorator, validateFields } = useForm<{ username: string }>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateFields()
      .then(console.log);
  };
  return (
    <form onSubmit={handleSubmit}>
      {getFieldDecorator('username')(
        <input type="text"/>
      )}
      <button type={'submit'}>submit</button>
    </form>
  )
}
```

## License

MIT © [mushan0x0](https://github.com/mushan0x0)
