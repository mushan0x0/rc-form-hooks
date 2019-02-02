import React from 'react';
import formHooks, { FormMethods } from '..';
import { ReactWrapper, mount } from 'enzyme';
import { Switch } from 'antd';

interface FormValues {
  test1?: string;
  test2?: boolean;
}

interface TestProps {
  setForm: (form: FormMethods<FormValues>) => void;
  test1OnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  test2OnChange?: (value: boolean) => void;
}

const Test = ({ setForm, test1OnChange, test2OnChange }: TestProps) => {
  const form = formHooks<FormValues>();
  const { getFieldDecorator } = form;
  setForm(form);
  return (
    <>
      {getFieldDecorator('test1')(
        <input id={'test1'} type="text" onChange={test1OnChange}/>,
      )}
      {getFieldDecorator('test2')(
        <Switch onChange={test2OnChange}/>,
      )}
    </>
  );
};

describe('getFieldDecorator', () => {
  let form: FormMethods<FormValues> = undefined as any;
  let wrapper: ReactWrapper;
  let handleChangeValue: any = null;

  beforeEach(() => {
    handleChangeValue = null;
  });

  it('Binding form', () => {
    wrapper = mount(
      <Test
        setForm={(f) => form = f}
        test1OnChange={(e) => {
          handleChangeValue = e.target.value;
        }}
      />,
    );

    const value = '23333';
    wrapper.find('#test1').simulate('change', { target: { value } });
    expect(handleChangeValue).toBe(value);
    expect(form.getFieldValue('test1')).toBe(value);
  });

  it('Custom components', () => {
    wrapper = mount(
      <Test
        setForm={(f) => form = f}
        test2OnChange={(value) => {
          handleChangeValue = value;
        }}
      />,
    );

    const value = true;
    (wrapper.find(Switch).first().instance().props as any).onChange(value);
    expect(handleChangeValue).toBe(value);
    expect(form.getFieldValue('test2')).toBe(value);
  });
});
