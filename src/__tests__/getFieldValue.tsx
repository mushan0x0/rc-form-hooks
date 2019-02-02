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
      {getFieldDecorator('test1')(
        <input type="text"/>,
      )}
      {getFieldDecorator('test2')(
        <input type="text"/>,
      )}
    </>
  );
};

describe('getFieldsValue', () => {
  let form: FormMethods<FormValues>;

  beforeEach(() => {
    mount(<Test setForm={(f) => form = f}/>);
    form.setFieldsValue({ test1: 'test1', test2: 'test2' });
  });

  it('Get test1', () => {
    expect(form.getFieldValue('test1')).toBe('test1');
  });

  it('Get test2', () => {
    expect(form.getFieldValue('test2')).toBe('test2');
  });
});
