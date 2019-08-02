import React from 'react';
import formHooks, { FormMethods } from '..';
import { mount } from 'enzyme';

interface FormValues {
  test1: string;
  test2?: string;
  test3?: string;
  test4: string;
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
        }],
      })(
        <input type="text"/>,
      )}
      {getFieldDecorator('test2')(
        <input type="text"/>,
      )}
      {getFieldDecorator('test3', {
        rules: [{
          validator: (_, value, callback) => {
            if (value && value !== 'test3') {
              callback(new Error('test3 message'));
            } else {
              callback();
            }
          },
        }],
      })(
        <input type="text"/>,
      )}
      {getFieldDecorator('test4', {
        rules: [{
          required: true,
          message: 'test4 message',
        }],
      })(
        <input type="text"/>,
      )}
    </>
  );
};

describe('validateFields', () => {
  let form: FormMethods<FormValues>;

  beforeEach(() => {
    mount(<Test setForm={(f) => form = f}/>);
  });

  it('Validate one', () => {
    return form.validateFields()
      .catch((e) => {
        const { test1 = [] } = form.errors;
        expect(test1.length).toBe(1);
        expect(e.message).toEqual( 'test1 is required');
      });
  });

  it('Catch the values of', () => {
    form.setFieldsValue({ test2: '1' });
    return form.validateFields()
      .catch((e) => {
        expect(form.values.test2).toBe('1');
        expect(e.message).toEqual( 'test1 is required');
      });
  });

  it('Custom message', () => {
    return form.validateFields()
      .catch(() => {
        const { test4 = [] } = form.errors;
        expect(test4[0].message).toEqual( 'test4 message');
      });
  });

  it('Custom names', () => {
    return form.validateFields(['test2', 'test3', 'test4'])
      .catch(() => {
        expect(Object.keys(form.errors).length).toBe( 1);
        expect(Object.keys(form.values).length).toBe( 4);
      });
  });

  it('Filter values', () => {
    form.setFieldsValue({
      test1: 'test1',
      test4: 'test4',
    } as any);
    return form.validateFields()
      .then(() => {
        expect(form.values).toEqual({
          test1: 'test1',
          test2: undefined,
          test3: undefined,
          test4: 'test4',
        });
      });
  });
});
