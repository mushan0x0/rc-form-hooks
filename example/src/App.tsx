import React from 'react';
import useForm from 'rc-form-hooks';

export default () => {
  const { getFieldDecorator, validateFields } = useForm<{ username: string }>();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateFields()
      .then(console.log);
  };
  return (
    <form onSubmit={handleSubmit}>
      {getFieldDecorator('username', {
        rules: [{ message: 'Please Enter UserName', required: true }],
      })(
        <input type="text"/>,
      )}
      <button type={'submit'}>submit</button>
    </form>
  );
};
