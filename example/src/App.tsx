import React from 'react'
import useForm from 'rc-form-hooks'

export default () => {
  const { getFieldDecorator, validateFields, getFieldError } = useForm<{ username: string }>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateFields()
      .then(({ username }) => alert(username))
      .catch(console.error);
  };
  return (
    <form onSubmit={handleSubmit}>
      {getFieldDecorator('username', {
        rules: [{
          required: true,
        }, {
          max: 8,
          min: 4,
        }],
      })(
        <input type="text"/>
      )}
      <div style={{ color: 'red' }}>
        {getFieldError('username')
          .map(({ message }) => message)
          .join(',')
        }
      </div>
      <button type={'submit'}>submit</button>
    </form>
  )
}
