import React from 'react';
import formHooks, { FormMethods } from '..';
import { mount } from 'enzyme';

interface FormValues {
  test1: string;
  test2: string;
}

const Test = ({ setForm }: { setForm: (form: FormMethods<FormValues>) => void }) => {
  const form = formHooks<FormValues>();
  const { getFieldDecorator } = form;
  setForm(form);
  return (
    <>
      {getFieldDecorator('test1')(
        <input type="text"/>,
      )}
      {getFieldDecorator('test2')(
        <input type="text"/>,
      )}
    </>
  );
};

describe('resetFields', () => {
  let form: FormMethods<FormValues>;

  beforeEach(() => {
    mount(<Test setForm={(f) => form = f}/>);

    const values = { test1: '1', test2: '2' };
    form.setFieldsValue(values);
  });

  it('Reset the multiple', () => {
    form.resetFields();
    expect(form.getFieldsValue()).toEqual({
      test1: undefined,
      test2: undefined,
    });
  });

  it('Reset one', () => {
    form.resetFields(['test1']);
    expect(form.getFieldsValue()).toEqual({
      test1: undefined,
      test2: '2',
    });
  });
});
