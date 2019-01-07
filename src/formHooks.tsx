import React, { useState, useEffect, useMemo } from 'react';
const { default: Schema } = require('async-validator');

function validateFields<F>(
  fields: {
    [N in keyof F]?: Array<Validator<F>>;
  },
  values: {
    [N in keyof F]?: F[N];
  },
) {
  return new Promise((resolve, reject) => {
    new Schema(fields)
      .validate(values, (errors: Array<{
        field: keyof F;
        message: string;
      }> | null) => {
        if (errors) {
          const errorsObj: {
            [N in keyof F]?: [{ message: string }];
          } = {};
          for (const { field, message } of errors || []) {
            errorsObj[field] = [{ message }];
          }
          reject(errorsObj);
        } else {
          resolve(values);
        }
      });
  });
}

function useForm<V>(createOptions: {
  onValuesChange?: (
    changedValues: V[keyof V],
    allValues: {
      [N in keyof V]?: V[N];
    },
  ) => void;
} = {}): FormMethods<V> {
  const cacheData = useMemo(() => ({
    fieldsChanged: {},
  } as {
    fieldsChanged: {
      [N in keyof V]?: boolean;
    };
    currentField: keyof V;
  }), []);
  const fieldsOptions: {
    [N in keyof V]?: GetFieldDecoratorOptions<V>;
  } = {};

  const [errors, setErrors] = useState<{
    [N in keyof V]?: Array<{
      message: string;
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
    const { rules = [] } = fieldsOptions[currentField] || {} as any;
    validateFields(
      { [currentField]: rules as any },
      { [currentField]: values[currentField] },
    )
      .then(() => {
        delete errors[currentField];
        setErrors(errors);
      })
      .catch((error) => {
        setErrors({ ...errors, ...error });
      });
  }, [JSON.stringify(values)]);

  const getFieldProps = (
    name: keyof V,
    options: GetFieldDecoratorOptions<V> = {},
  ) => ({
    value: values[name],
    onChange: (e: string | any) => {
      const value = (e && e.target) ? e.target.value : e;
      values[name] = value;
      setValues({
        ...values,
      });
      cacheData.currentField = name;
      cacheData.fieldsChanged[name] = true;
      if (createOptions.onValuesChange) {
        createOptions.onValuesChange(value, values);
      }
    },
    ['data-__field']: { errors: errors[name] },
    ['data-__meta']: {
      validate: [{
        rules: options.rules,
      }],
    },
  });

  return {
    resetFields: (ns) => {
      delete cacheData.currentField;
      if (ns) {
        ns.forEach((name) => {
          values[name] = undefined;
          delete errors[name];
          delete cacheData.fieldsChanged[name];
        });
        setValues(values);
        setErrors(errors);
      } else {
        setErrors({});
        setValues({});
        cacheData.fieldsChanged = {};
      }
    },

    validateFields: (ns) => new Promise(async (resolve, reject) => {
      const copyFields = { ...fieldsOptions };
      const copyValues = { ...values };
      ns = ns || (Object.keys(copyFields) as Array<keyof V>);
      for (const name in copyFields) {
        (copyFields[name] as any) = (copyFields[name] || { rules: [] } as any).rules;
        if (!ns.includes(name)) {
          delete copyValues[name];
        }
      }
      for (const name in copyValues) {
        if (!ns.includes(name)) {
          delete copyValues[name];
        }
      }
      validateFields(copyFields as any, copyValues)
        .then((values) => resolve(values as V))
        .catch((newErrors) => {
          setErrors({
            ...errors,
            ...newErrors,
          });
          reject({ errors, values });
        });
    }),

    getFieldDecorator: (name, options = {}) => {
      if (fieldsOptions[name]) {
        fieldsOptions[name] = options;
      } else {
        fieldsOptions[name] = options;
        values[name] = values[name] || options.initialValue;
      }
      const props: any = getFieldProps(name, options);
      return (fieldElem: any) => {
        return React.cloneElement(fieldElem, { ...props, onChange: (e: any) => {
          props.onChange(e);
          if (fieldElem.props.onChange) {
            fieldElem.props.onChange(e);
          }
        }});
      };
    },

    setFieldsValue: setValues,

    getFieldsValue: (ns) => {
      const result = { ...values };
      if (ns) {
        (Object.keys(result) as Array<keyof V>)
          .forEach((name) => {
            if (!ns.includes(name)) {
              delete result[name];
            }
          });
      }
      return result;
    },
  };
}

export interface FormMethods<V> {
  validateFields: (ns?: Array<keyof V>) => Promise<V>;
  resetFields: (ns?: Array<keyof V>) => void;
  getFieldDecorator: <P>(
    name: keyof V, options?: GetFieldDecoratorOptions<V>,
  ) => (element: React.ReactElement<P>) => React.ReactElement<P>;
  setFieldsValue: (values: V) => void;
  getFieldsValue: (ns?: Array<keyof V>) => {
    [N in keyof V]?: V[N];
  };
}

export interface GetFieldDecoratorOptions<V> {
  rules?: Array<Validator<V>>;
  initialValue?: any;
}

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
