import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Tooltip,
  Icon,
  Cascader,
  Select,
  Row,
  Col,
  Checkbox,
  Button,
  AutoComplete,
  DatePicker,
  Transfer,
  Radio
} from 'antd';
import useForm from 'rc-form-hooks';

import './App.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const AutoCompleteOption = AutoComplete.Option;

const residences = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake'
          }
        ]
      }
    ]
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men'
          }
        ]
      }
    ]
  }
];

function RegistrationForm() {
  const [state, setState] = useState({
    confirmDirty: false,
    autoCompleteResult: []
  });

  const form = useForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form
      .validateFields(['transfer'])
      .then(() => console.log('Received values of form: ', form.values));
  };

  const handleConfirmBlur = (e: any) => {
    const { value } = e.target;
    setState({ ...state, confirmDirty: state.confirmDirty || !!value });
  };

  const compareToFirstPassword = (rule: any, value: any, callback: any) => {
    if (value && value !== form.getFieldValue('password')) {
      callback('Two passwords that you enter is inconsistent!');
    } else {
      callback();
    }
  };

  const validateToNextPassword = (rule: any, value: any, callback: any) => {
    if (value && state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback();
  };

  const handleWebsiteChange = (value: any) => {
    let autoCompleteResult: any;
    if (!value) {
      autoCompleteResult = [];
    } else {
      autoCompleteResult = ['.com', '.org', '.net'].map(
        domain => `${value}${domain}`
      );
    }
    setState({ ...state, autoCompleteResult });
  };

  const { getFieldDecorator, setFieldsValue, getFieldValue } = form;
  const { autoCompleteResult } = state;
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 }
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 }
    }
  };
  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0
      },
      sm: {
        span: 16,
        offset: 8
      }
    }
  };
  const prefixSelector = getFieldDecorator('prefix', {
    initialValue: '86'
  })(
    <Select style={{ width: 70 }}>
      <Option value='86'>+86</Option>
      <Option value='87'>+87</Option>
    </Select>
  );

  const websiteOptions = autoCompleteResult.map(website => (
    <AutoCompleteOption key={website}>{website}</AutoCompleteOption>
  ));

  useEffect(() => {
    setFieldsValue({ radio: 0, phone: 111111 });
  }, [getFieldValue, setFieldsValue]);

  return (
    <Form {...formItemLayout} onSubmit={handleSubmit}>
      <Form.Item label='Radio'>
        {getFieldDecorator('radio')(
          <Radio.Group>
            <Radio value={1}>1</Radio>
            <Radio value={0}>0</Radio>
          </Radio.Group>
        )}
      </Form.Item>
      <Form.Item label='Transfer'>
        {getFieldDecorator('transfer', {
          valuePropName: 'targetKeys'
        })(
          <Transfer
            dataSource={[{ key: '1', title: '1' }, { key: '2', title: '2' }]}
            render={({ title }) => title}
          />
        )}
      </Form.Item>
      <Form.Item label='Date Range'>
        {getFieldDecorator(['dateRange1', 'dateRange2'])(<RangePicker />)}
      </Form.Item>
      <Form.Item label='E-mail'>
        {getFieldDecorator('email', {
          rules: [
            {
              type: 'email',
              message: 'The input is not valid E-mail!'
            },
            {
              required: true,
              message: 'Please input your E-mail!'
            }
          ]
        })(<Input />)}
      </Form.Item>
      <Form.Item label='Password' hasFeedback>
        {getFieldDecorator('password', {
          rules: [
            {
              required: true,
              message: 'Please input your password!'
            },
            {
              validator: validateToNextPassword
            }
          ]
        })(<Input.Password />)}
      </Form.Item>
      <Form.Item label='Confirm Password' hasFeedback>
        {getFieldDecorator('confirm', {
          rules: [
            {
              required: true,
              message: 'Please confirm your password!'
            },
            {
              validator: compareToFirstPassword
            }
          ]
        })(<Input.Password onBlur={handleConfirmBlur} />)}
      </Form.Item>
      <Form.Item
        label={
          <span>
            Nickname&nbsp;
            <Tooltip title='What do you want others to call you?'>
              <Icon type='question-circle-o' />
            </Tooltip>
          </span>
        }>
        {getFieldDecorator('nickname', {
          rules: [
            {
              required: true,
              message: 'Please input your nickname!',
              whitespace: true
            }
          ]
        })(<Input />)}
      </Form.Item>
      <Form.Item label='Habitual Residence'>
        {getFieldDecorator('residence', {
          initialValue: ['zhejiang', 'hangzhou', 'xihu'],
          rules: [
            {
              type: 'array',
              required: true,
              message: 'Please select your habitual residence!'
            }
          ]
        })(<Cascader options={residences} />)}
      </Form.Item>
      <Form.Item label='Phone Number'>
        {getFieldDecorator('phone', {
          rules: [
            { required: true, message: 'Please input your phone number!' }
          ]
        })(<Input addonBefore={prefixSelector} style={{ width: '100%' }} />)}
      </Form.Item>
      <Form.Item label='Website'>
        {getFieldDecorator('website', {
          rules: [{ required: true, message: 'Please input website!' }]
        })(
          <AutoComplete
            dataSource={websiteOptions}
            onChange={handleWebsiteChange}
            placeholder='website'>
            <Input />
          </AutoComplete>
        )}
      </Form.Item>
      <Form.Item
        label='Captcha'
        extra='We must make sure that your are a human.'>
        <Row gutter={8}>
          <Col span={12}>
            {getFieldDecorator('captcha', {
              rules: [
                { required: true, message: 'Please input the captcha you got!' }
              ]
            })(<Input />)}
          </Col>
          <Col span={12}>
            <Button>Get captcha</Button>
          </Col>
        </Row>
      </Form.Item>
      <Form.Item {...tailFormItemLayout}>
        {getFieldDecorator('agreement', {
          valuePropName: 'checked'
        })(
          <Checkbox>
            I have read the <a href=''>agreement</a>
          </Checkbox>
        )}
      </Form.Item>
      <Form.Item {...tailFormItemLayout}>
        <Button type='primary' htmlType='submit'>
          Register
        </Button>
      </Form.Item>
    </Form>
  );
}

export default RegistrationForm;
