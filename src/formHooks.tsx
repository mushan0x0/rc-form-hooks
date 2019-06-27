import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
        fieldsRule[name] = fieldsOptions[name].rules || [];
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

export type TypeValues<V> = {
  [N in keyof V]?: V[N];
};

export type TypeErrors<V> = {
  [N in keyof V]?: Array<{
    message: string,
    field: keyof V,
  }>;
};

function useForm<V = any>(createOptions: CreateOptions<V> = {}): FormMethods<V> {
  const cacheData = useRef<{
    fieldsTouched: {
      /**
       * `undefined` means `false` here
       */
      [N in keyof V]?: true;
    };
    fieldsValidated: {
      [N in keyof V]?: true;
    };
    currentField?: keyof V;
  }>({
    fieldsTouched: {},
    fieldsValidated: {},
  });

  const fieldsOptions: {
    [N in keyof V]: GetFieldDecoratorOptions<V>;
  } = {} as any;

  const [errors, setErrors] = useState<TypeErrors<V>>({});
  const [values, setValues] = useState<TypeValues<V>>({});
  useEffect(() => {
    const { current: { fieldsTouched: fieldsChanged, currentField } } = cacheData;
    if (currentField === undefined || !fieldsChanged[currentField]) {
      return;
    }

    validateFields(fieldsOptions, values, [currentField])
      .then(() => {
        setErrors(errors => {
          const errs = { ...errors };
          delete errs[currentField];
          return errs;
        });
      })
      .catch(({ errors: newErrors }) => {
        setErrors(oldErrors => ({
           ...oldErrors,
           ...newErrors,
        }));
      });
  }, [JSON.stringify(values), cacheData.current]);

  useEffect(() => {
    if (createOptions.onValuesChange) {
      createOptions.onValuesChange(values, values);
    }
  }, [JSON.stringify(values), createOptions]);

  const getFieldProps = (
    name: keyof V,
    options: GetFieldDecoratorOptions<V> = {},
  ) => ({
    [fieldsOptions[name].valuePropName || 'value']: values[name],
    [fieldsOptions[name].trigger || 'onChange']: (e: string | any) => {
      const value = (e && e.target) ? e.target.value : e;
      setValues(oldValues => {
        const values  = {
          ...oldValues,
           [name]: value,
        } as typeof oldValues;

        const { current } = cacheData;
        current.currentField = name;
        current.fieldsTouched[name] = true;
        if (createOptions.onValuesChange) {
            createOptions.onValuesChange({
              [name]: value,
            } as typeof values, values);
          }

        return values;
      });

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
    errors,

    values,

    resetFields: (ns = (Object.keys(fieldsOptions) as Array<keyof V>)) => {
      const { current } = cacheData;
      delete current.currentField;
      ns.forEach((name) => {
        delete current.fieldsTouched[name];

        setValues(values => ({ ...values, [name]: undefined } as typeof values));

        setErrors(oldErrors => {
          const errors = { ...oldErrors };
          delete errors[name];
          return errors;
        });
      });
    },

    validateFields: (ns, options = {}) => new Promise(async (resolve, reject) => {
      const { fieldsValidated } = cacheData.current;
      if (ns) {
        ns.forEach((name) => {
          fieldsValidated[name] = true;
        });
      }
      if (options.force) {
        Object.keys(fieldsValidated).forEach((name) => {
          if (fieldsValidated[name]) {
            delete errors[name];
          }
        });
      }
      validateFields(fieldsOptions, values, ns)
        .then((values) => resolve(values as V))
        .catch((a) => {
          const { errors: newErrors } = a;
          setErrors(errors => ({
            ...errors,
            ...newErrors,
          }));
          reject(newErrors[Object.keys(newErrors)[0]][0]);
        });
    }),

    getFieldDecorator: (name, options = {
      rules: [{ required: false }],
    }) => {
      fieldsOptions[name] = options;
      values[name] = values[name]
        || cacheData.current.fieldsTouched[name]
          ? values[name]
          : options.initialValue;

      const props: any = getFieldProps(name, options);
      return (fieldElem) => {
        const { trigger = 'onChange' } = options;
        return React.cloneElement(fieldElem, { ...fieldElem.props, ...props, [trigger]: (e: any) => {
            props[trigger](e);
            if ((fieldElem.props as any)[trigger]) {
              (fieldElem.props as any)[trigger](e);
            }
          }} as any);
      };
    },

    setFieldsValue: ({ ...newValues }) => setValues({ ...values, ...newValues }),

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
      setValues(oldValues => {
        const values = { ...oldValues };
        for (const name in fields) {
          const { value } = fields[name];
          values[name] = value;
        }
        return values;
      });
      setErrors(oldErrors => {
        const errors = { ...oldErrors };
        for (const name in fields) {
          const errorArr   = fields[name].errors || [];
          errors[name] = errorArr.map(({ message }) => ({ message, field: name }));
        }
        return errors;
      });
    },

    isFieldTouched: (name) => Boolean(cacheData.current.fieldsTouched[name]),

    isFieldsTouched: (names = []) => names.some(x => Boolean(cacheData.current.fieldsTouched[x])),
  };
}

export interface CreateOptions<V> {
  onValuesChange?: (
    changedValues: TypeValues<V>,
    allValues: TypeValues<V>,
  ) => void;
}

export interface FormMethods<V> {
  errors: TypeErrors<V>;
  values: TypeValues<V>;
  validateFields: (ns?: Array<keyof V>, options?: ValidateFieldsOptions) => Promise<V>;
  resetFields: (ns?: Array<keyof V>) => void;
  getFieldDecorator: <P extends React.InputHTMLAttributes<React.ReactElement<P>>>(
    name: keyof V, options?: GetFieldDecoratorOptions<V>,
  ) => (element: React.ReactElement<P>) => React.ReactElement<P>;
  setFieldsValue: (values: {
    [N in keyof V]?: V[N]
  }) => void;
  getFieldsValue: (ns?: Array<keyof V>) => TypeValues<V>;
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
  isFieldTouched(name: keyof V): boolean;
  isFieldsTouched(names?: Array<keyof V>): boolean;
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

export declare type ValidateFieldsOptions = {
  /** 所有表单域是否在第一个校验规则失败后停止继续校验 */
  // first?: boolean;
  /** 指定哪些表单域在第一个校验规则失败后停止继续校验 */
  // firstFields?: string[];
  /** 已经校验过的表单域，在 validateTrigger 再次被触发时是否再次校验 */
  force?: boolean;
  /** 定义 validateFieldsAndScroll 的滚动行为 */
  // scroll?: DomScrollIntoViewConfig;
};

export default useForm;
