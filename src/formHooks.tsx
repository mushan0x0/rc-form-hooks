import React, { useState, useEffect, useMemo } from 'react';
let Schema = require('async-validator');
Schema = Schema.default ? Schema.default : Schema;

function validateFields<F>(
  { ...fieldsOptions }: {
    [N in keyof F]: GetFieldDecoratorOptions<F>;
  },
  { ...values }: {
    [N in keyof F]?: F[N];
  },
  ns?: Array<keyof F>,
) {
  return new Promise((resolve, reject) => {
    ns = ns || (Object.keys(fieldsOptions) as Array<keyof F>);
    const fieldsRule: {
      [N in keyof F]?: Array<Validator<F>>;
    } = {};
    for (const name in fieldsOptions) {
      if (ns.includes(name)) {
        fieldsRule[name] = fieldsOptions[name].rules;
      }
    }

    for (const name in values) {
      if (!ns.includes(name)) {
        delete values[name];
      }
    }

    new Schema(fieldsRule)
      .validate(values, (
        errors: Array<{
          field: keyof F;
          message: string;
        }> | null,
      ) => {
        if (errors) {
          const errorsObj: {
            [N in keyof F]?: [{ message: string, field: keyof F }];
          } = {};
          for (const { field, message } of (errors || [])) {
            errorsObj[field] = [{ message, field }];
          }
          reject({ errors: errorsObj, values });
        } else {
          resolve(values);
        }
      });
  });
}

function useForm<V>(createOptions: CreateOptions<V> = {}): FormMethods<V> {
  const cacheData = useMemo(() => ({
    fieldsChanged: {},
  } as {
    fieldsChanged: {
      [N in keyof V]?: boolean;
    };
    currentField: keyof V;
  }), []);

  const fieldsOptions: {
    [N in keyof V]: GetFieldDecoratorOptions<V>;
  } = {} as any;

  const [errors, setErrors] = useState<{
    [N in keyof V]?: Array<{
      message: string,
      field: keyof V,
    }>;
  }>({});
  const [values, setValues] = useState<{
    [N in keyof V]?: V[N];
  }>({});
  useEffect(() => {
    const { fieldsChanged, currentField } = cacheData;
    if (!fieldsChanged[currentField]) {
      return;
    }

    validateFields(fieldsOptions, values, [currentField])
      .then(() => {
        delete errors[currentField];
        setErrors({ ...errors });
      })
      .catch(({ errors: newErrors }) => {
        setErrors({ ...errors, ...newErrors });
      });
  }, [JSON.stringify(values)]);

  useEffect(() => {
    if (createOptions.onValuesChange) {
      createOptions.onValuesChange(values, values);
    }
  }, [JSON.stringify(values)]);

  const getFieldProps = (
    name: keyof V,
    options: GetFieldDecoratorOptions<V> = {},
  ) => ({
    [fieldsOptions[name].valuePropName || 'value']: values[name],
    [fieldsOptions[name].trigger || 'onChange']: (e: string | any) => {
      const value = (e && e.target) ? e.target.value : e;
      values[name] = value;
      setValues({ ...values });

      cacheData.currentField = name;
      cacheData.fieldsChanged[name] = true;
      if (createOptions.onValuesChange) {
        createOptions.onValuesChange({
          [name]: value,
        } as typeof values, values);
      }
    },
    ['data-__field']: { errors: errors[name] },
    ['data-__meta']: {
      validate: [{
        rules: options.rules,
      }],
    },
  });

  const objFilter = (obj: { [N in keyof V]?: any }, ns?: Array<keyof V>) => {
    if (ns) {
      (Object.keys(obj) as Array<keyof V>)
        .forEach((name) => {
          if (!ns.includes(name)) {
            delete obj[name];
          }
        });
    }
    return obj;
  };

  return {
    resetFields: (ns = (Object.keys(fieldsOptions) as Array<keyof V>)) => {
      delete cacheData.currentField;
      ns.forEach((name) => {
        delete cacheData.fieldsChanged[name];

        values[name] = undefined;
        setValues({ ...values });

        delete errors[name];
        setErrors({ ...errors });
      });
    },

    validateFields: (ns) => new Promise(async (resolve, reject) => {
      validateFields(fieldsOptions, values, ns)
        .then((values) => resolve(values as V))
        .catch(({ errors: newErrors, values }) => {
          setErrors({
            ...errors,
            ...newErrors,
          });
          reject({ errors: newErrors, values });
        });
    }),

    getFieldDecorator: (name, options = {
      rules: [{ required: false }],
    }) => {
      fieldsOptions[name] = options;
      values[name] = values[name]
        || cacheData.fieldsChanged[name]
          ? values[name]
          : options.initialValue;

      const props: any = getFieldProps(name, options);
      return (fieldElem) => {
        const { trigger = 'onChange' } = options;
        return React.cloneElement(fieldElem, { ...props, [trigger]: (e: any) => {
            props[trigger](e);
            if ((fieldElem.props as any)[trigger]) {
              (fieldElem.props as any)[trigger](e);
            }
          }} as any);
      };
    },

    setFieldsValue: ({ ...values }) => setValues(values),

    getFieldsValue: (ns) => {
      const result = { ...values };
      objFilter(result, ns);
      return result;
    },

    getFieldValue: (name) => values[name],

    getFieldsError: (ns) => {
      const result = { ...errors };
      objFilter(result, ns);
      return result;
    },

    getFieldError: (name): any => errors[name] || [],

    setFields: (fields) => {
      for (const name in fields) {
        const { value, errors: errorArr = [] } = fields[name];
        values[name] = value;
        setValues({ ...values });

        const fieldErrors = [];
        for (const { message } of errorArr) {
          fieldErrors.push({
            message,
            field: name,
          });
        }
        errors[name] = fieldErrors;
        setErrors({ ...errors });
      }
    },
  };
}

export interface CreateOptions<V> {
  onValuesChange?: (
    changedValues: {
      [N in keyof V]?: V[N];
    },
    allValues: {
      [N in keyof V]?: V[N];
    },
  ) => void;
}

export interface FormMethods<V> {
  validateFields: (ns?: Array<keyof V>) => Promise<V>;
  resetFields: (ns?: Array<keyof V>) => void;
  getFieldDecorator: <P extends React.InputHTMLAttributes<React.ReactElement<P>>>(
    name: keyof V, options?: GetFieldDecoratorOptions<V>,
  ) => (element: React.ReactElement<P>) => React.ReactElement<P>;
  setFieldsValue: (values: {
    [N in keyof V]?: V[N]
  }) => void;
  getFieldsValue: (ns?: Array<keyof V>) => {
    [N in keyof V]?: V[N];
  };
  getFieldsError: (ns?: Array<keyof V>) => {
    [N in keyof V]?: Array<{
      message: string;
      field: keyof V,
    }>;
  };
  getFieldValue: (name: keyof V) => V[keyof V] | undefined;
  getFieldError: (name: keyof V) => Array<{
    message: string;
    field: keyof V,
  }>;
  setFields: (fields: {
    [N in keyof V]: {
      value?: V[N];
      errors?: Error[];
    };
  }) => void;
}

export interface GetFieldDecoratorOptions<V> {
  rules?: Array<Validator<V>>;
  initialValue?: any;
  trigger?: string;
  valuePropName?: string;
}

/**
 * come from: https://github.com/ant-design/ant-design/blob/master/components/form/Form.tsx
 */
interface Validator<V> {
  /** validation error message */
  message?: React.ReactNode;
  /** built-in validation type, available options: https://github.com/yiminghe/async-validator#type */
  type?: string;
  /** indicates whether field is required */
  required?: boolean;
  /** treat required fields that only contain whitespace as errors */
  whitespace?: boolean;
  /** validate the exact length of a field */
  len?: number;
  /** validate the min length of a field */
  min?: number;
  /** validate the max length of a field */
  max?: number;
  /** validate the value from a list of possible values */
  enum?: string | string[];
  /** validate from a regular expression */
  pattern?: RegExp;
  /** transform a value before validation */
  transform?: (value: V) => V;
  /** custom validate function (Note: callback must be called) */
  validator?: (rule: Validator<V>, value: any, callback: any, source?: any, options?: any) => any;
}

export interface FormComponentProps<V> {
  form: FormMethods<V>;
}

export default useForm;
