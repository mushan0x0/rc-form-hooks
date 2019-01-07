import React from 'react'
import useForm from 'rc-form-hooks'

export default () => {
  const { getFieldDecorator, validateFields } = useForm<{ a: string }>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateFields()
      .then(console.log);
  };
  return (
    <form onSubmit={handleSubmit}>
      {getFieldDecorator('a')(
        <input type="text"/>
      )}
      <button type={'submit'}>submit</button>
    </form>
  )
}
