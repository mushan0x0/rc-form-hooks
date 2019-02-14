import React from 'react';
import formHooks, { FormMethods } from '..';
import { mount } from 'enzyme';

interface FormValues {
  test1?: string;
  test2?: string;
}

const Test = ({ setForm }: { setForm: (form: FormMethods<FormValues>) => void }) => {
  const form = formHooks<FormValues>();
  const { getFieldDecorator } = form;
  setForm(form);
  return (
    <>
      {getFieldDecorator('test1', {
        rules: [{
          required: true,
          message: 'test1 error',
        }],
      })(
        <input type="text"/>,
      )}
      {getFieldDecorator('test2', {
        rules: [{
          required: true,
          message: 'test2 error',
        }],
      })(
        <input type="text"/>,
      )}
    </>
  );
};

describe('getFieldsError', () => {
  let form: FormMethods<FormValues>;

  beforeEach(() => {
    mount(<Test setForm={(f) => form = f}/>);
    form.validateFields();
  });

  it('Get errors', () => {
    expect(form.getFieldsError()).toEqual({
      test1: [{
        message: 'test1 error',
        field: 'test1',
      }],
      test2: [{
        message: 'test2 error',
        field: 'test2',
      }],
    });
  });

  it('Get error', () => {
    expect(form.getFieldsError(['test1'])).toEqual({
      test1: [{
        message: 'test1 error',
        field: 'test1',
      }],
    });
  });
});
