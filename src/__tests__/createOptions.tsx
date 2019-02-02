import React from 'react';
import formHooks, { FormMethods, CreateOptions } from '..';
import { mount } from 'enzyme';

interface FormValues {
  test1?: string;
  test2?: string;
}

interface TestProps {
  setForm: (form: FormMethods<FormValues>) => void;
  createOption?: CreateOptions<FormValues>;
}

const Test = ({ setForm, createOption }: TestProps) => {
  const form = formHooks<FormValues>(createOption);
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

describe('createOption', () => {
  let form: FormMethods<FormValues>;

  it('onValuesChange', () => {
    let values: FormValues = undefined as any;
    let changeValues: FormValues = undefined as any;
    mount(
      <Test
        setForm={(f) => form = f}
        createOption={{
          onValuesChange: (changedValues, allValues) => {
            values = allValues;
            changeValues = changedValues;
          },
        }}
      />,
    );
    form.setFieldsValue({
      test1: 'test1',
    });
    form.setFieldsValue({
      test2: 'test2',
    });
    setTimeout(() => {
      expect(changeValues).toBe({
        test2: 'test2',
      });
      expect(values).toBe({
        test1: 'test1',
        test2: 'test2',
      });
    }, 50);
  });
});
