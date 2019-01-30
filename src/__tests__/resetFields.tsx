import React from 'react';
import formHooks, { FormMethods } from '..';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const Input = (porps: any) => <input {...porps}/>;

interface FormValues {
  test1: string;
  test2: string;
}

const Test = ({ setForm }: { setForm: (form: FormMethods<FormValues>) => void }) => {
  const form = formHooks<FormValues>();
  const { getFieldDecorator, resetFields } = form;
  setForm(form);
  return (
    <form>
      {getFieldDecorator('test1')(
        <Input type="text"/>,
      )}
      {getFieldDecorator('test2')(
        <Input type="text"/>,
      )}
      <button onClick={() => resetFields()}>Reset</button>
    </form>
  );
};

describe('Reset fields', () => {
  let form: FormMethods<FormValues>;

  beforeEach(() => {
    mount(<Test setForm={(f) => form = f}/>);

    const values = { test1: '1', test2: '1' };
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
