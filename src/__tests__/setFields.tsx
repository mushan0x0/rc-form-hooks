import React from 'react';
import formHooks, { FormMethods } from '..';
import { mount } from 'enzyme';

interface FormValues {
  test1?: string;
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
    </>
  );
};

describe('seFields', () => {
  let form: FormMethods<FormValues>;

  beforeEach(() => {
    mount(<Test setForm={(f) => form = f}/>);
    form.setFields({
      test1: {
        value: 'test1',
        errors: [new Error('test1 message1'), new Error('test1 message2')],
      },
    });
  });

  it('Get error', () => {
    expect(form.getFieldError('test1')).toEqual([{
      message: 'test1 message1',
      field: 'test1',
    }, {
      message: 'test1 message2',
      field: 'test1',
    }]);
  });

  it('Get value', () => {
    expect(form.getFieldValue('test1')).toEqual('test1');
  });
});
