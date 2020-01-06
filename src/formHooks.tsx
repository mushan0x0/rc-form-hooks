import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

let Schema = require('async-validator');
Schema = Schema.default ? Schema.default : Schema;

function validate<F>(
  {
    ...fieldsOptions
  }: {
    [N in keyof F]: GetFieldDecoratorOptions<F>;
  },
  {
    ...values
  }: {
    [N in keyof F]?: F[N];
  },
  ns?: (keyof F)[]
) {
  return new Promise((resolve, reject) => {
    ns = ns || (Object.keys(fieldsOptions) as (keyof F)[]);
    const fieldsRule: {
      [N in keyof F]?: Validator<F>[];
    } = {};
    for (const name in fieldsOptions) {
      if (ns.includes(name)) {
        fieldsRule[name] = fieldsOptions[name].rules || [{ required: false }];
      }
    }

    for (const name in values) {
      if (!ns.includes(name)) {
        delete values[name];
      }
    }

    new Schema(fieldsRule).validate(
      values,
      (
        errors:
          | {
              field: keyof F;
              message: string;
            }[]
          | null
      ) => {
        if (errors) {
          const errorsObj: {
            [N in keyof F]?: [{ message: string; field: keyof F }];
          } = {};
          for (const { field, message } of errors || []) {
            errorsObj[field] = [{ message, field }];
          }
          reject({ errors: errorsObj, values });
        } else {
          resolve(values);
        }
      }
    );
  });
}

export type TypeValues<V> = {
  [N in keyof V]?: V[N];
};

export type TypeErrors<V> = {
  [N in keyof V]?: {
    message: string;
    field: keyof V;
  }[];
};

function useForm<V = any>(
  createOptions: CreateOptions<V> = {}
): FormMethods<V> {
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
    fieldsValidated: {}
  });

  const fieldsOptions = useRef<
    {
      [N in keyof V]: GetFieldDecoratorOptions<V>;
    }
  >({} as any);

  const [errors, setErrors] = useState<TypeErrors<V>>({});
  const [values, setValues] = useState<TypeValues<V>>({});
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  const [fieldsValidating, setFieldsValidating] = useState<
    {
      [N in keyof V]: {
        validating: boolean;
        value: any;
      };
    }
  >({} as any);
  const fieldsValidatingRef = useRef(fieldsValidating);
  useEffect(() => {
    const {
      current: { fieldsTouched: fieldsChanged, currentField }
    } = cacheData;
    if (currentField === undefined || !fieldsChanged[currentField]) {
      return;
    }

    const fieldsValidating = fieldsValidatingRef.current;
    fieldsValidating[currentField] = {
      validating: true,
      value: values[currentField]
    };
    setFieldsValidating({ ...fieldsValidating });
    validate(fieldsOptions.current, values, [currentField])
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
          ...newErrors
        }));
      })
      .finally(() => {
        if (values[currentField] === fieldsValidating[currentField].value) {
          fieldsValidating[currentField].validating = false;
        }
        setFieldsValidating({ ...fieldsValidating });
      });
  }, [values, fieldsOptions]);

  const preValuesRef = useRef(values);
  useEffect(() => {
    if (createOptions.onValuesChange) {
      const changedValues = {};
      Object.keys(values).forEach(key => {
        if (values[key] !== preValuesRef.current[key]) {
          changedValues[key] = values[key];
        }
      });
      createOptions.onValuesChange(changedValues, values);
    }
    preValuesRef.current = { ...values };
  }, [values, createOptions]);

  const getFieldProps = useCallback(
    (
      name: keyof V | (keyof V)[],
      options: GetFieldDecoratorOptions<V> = {}
    ) => {
      const n = name instanceof Array ? name[0] : name;
      const {
        trigger = 'onChange',
        valuePropName = 'value',
        normalize = (e: any) => (e && e.target ? e.target[valuePropName] : e)
      } = fieldsOptions.current[n];
      const props: any = {
        [trigger]: (...arg: any) => {
          const value = normalize(...arg);
          setValues(oldValues => {
            const currentValue: { [N in keyof V]?: V[N] } = {};
            if (name instanceof Array && value instanceof Array) {
              name.forEach((n, index) => (currentValue[n] = value[index]));
            } else {
              currentValue[n] = value;
            }
            // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
            const values = {
              ...oldValues,
              ...currentValue
            } as typeof oldValues;

            const { current } = cacheData;
            current.currentField = n;
            current.fieldsTouched[n] = true;
            if (createOptions.onValuesChange) {
              createOptions.onValuesChange(
                // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
                {
                  [n]: value
                } as typeof values,
                values
              );
            }

            valuesRef.current = values;

            return values;
          });
        },
        'data-__field': {
          errors: errors[n],
          value: values[n],
          validating:
            fieldsValidating[name instanceof Array ? name[0] : name].validating
        },
        'data-__meta': {
          validate: [
            {
              rules: options.rules
            }
          ]
        }
      };
      if (name instanceof Array) {
        const value: any = [];
        name.forEach(n => {
          value.push(values[n]);
        });
        props[valuePropName] = value;
      } else {
        props[valuePropName] = values[name] as any;
      }
      return props;
    },
    [values, createOptions, errors, fieldsValidating]
  );

  const objFilter = useCallback(
    (obj: { [N in keyof V]?: any }, ns?: (keyof V)[]) => {
      if (ns) {
        (Object.keys(obj) as (keyof V)[]).forEach(name => {
          if (!ns.includes(name)) {
            delete obj[name];
          }
        });
      }
      return obj;
    },
    []
  );

  const resetFields = useCallback((ns?: (keyof V)[]) => {
    const { current } = cacheData;
    delete current.currentField;
    if (!ns) {
      setValues(() => ({}));
      setErrors(() => ({}));
      Object.keys(current).forEach(name => (current[name] = {}));
    } else {
      ns.forEach(name => {
        delete current.fieldsTouched[name];

        setValues(
          values => ({ ...values, [name]: undefined } as typeof values)
        );

        setErrors(oldErrors => {
          const errors = { ...oldErrors };
          delete errors[name];
          return errors;
        });
      });
    }
  }, []);

  const validateFields = useCallback(
    (ns?: (keyof V)[], options = {}): Promise<V> =>
      new Promise(async (resolve, reject) => {
        const { fieldsValidated } = cacheData.current;
        if (ns) {
          ns.forEach(name => {
            fieldsValidated[name] = true;
          });
        }
        if (options.force) {
          Object.keys(fieldsValidated).forEach(name => {
            if (fieldsValidated[name]) {
              delete errors[name];
            }
          });
        }
        validate(fieldsOptions.current, valuesRef.current, ns)
          .then(values => resolve(values as V))
          .catch(a => {
            const { errors: newErrors } = a;
            setErrors(errors => ({
              ...errors,
              ...newErrors
            }));
            reject(newErrors[Object.keys(newErrors)[0]][0]);
          });
      }),
    [errors]
  );

  const reRenderRef = useRef(true);
  reRenderRef.current = true;
  const getFieldDecorator = useCallback(
    (
      name,
      options = {
        rules: [{ required: false }]
      }
    ) => {
      if (reRenderRef.current) {
        fieldsOptions.current = {} as any;
        reRenderRef.current = false;
      }
      const setOptions = (name: keyof V, index?: number) => {
        fieldsOptions.current[name] = options;
        values[name] =
          values[name] !== undefined || cacheData.current.fieldsTouched[name]
            ? values[name]
            : index !== undefined
            ? (options.initialValue || [])[index]
            : options.initialValue;
        if (!fieldsValidating[name]) {
          fieldsValidating[name] = {
            validating: false,
            value: values[name]
          };
        }
      };
      valuesRef.current = values;
      if (name instanceof Array) {
        name.forEach((n, i) => setOptions(n, i));
      } else {
        setOptions(name as keyof V);
      }
      const props: any = getFieldProps(name, options);
      return (fieldElem: React.ReactElement) => {
        const { trigger = 'onChange' } = options;
        return React.cloneElement(fieldElem, {
          ...fieldElem.props,
          ...props,
          [trigger]: (...arg: any) => {
            props[trigger](...arg);
            if ((fieldElem.props as any)[trigger]) {
              (fieldElem.props as any)[trigger](...arg);
            }
          }
        } as any);
      };
    },
    [fieldsValidating, values, getFieldProps]
  );

  const setFieldsValue = useCallback(
    ({ ...newValues }) =>
      setValues(oldValues => {
        const values = { ...oldValues, ...newValues };
        valuesRef.current = values;
        return values;
      }),
    []
  );

  const getFieldsValue = useCallback(
    ns => {
      const result = { ...valuesRef.current };
      objFilter(result, ns);
      return result;
    },
    [objFilter]
  );

  const getFieldValue = useCallback(name => valuesRef.current[name], []);

  const getFieldsError = useCallback(
    ns => {
      const result = { ...errors };
      objFilter(result, ns);
      return result;
    },
    [errors, objFilter]
  );

  const getFieldError = useCallback((name): any => errors[name] || [], [
    errors
  ]);

  const setFields = useCallback(fields => {
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
        const errorArr = fields[name].errors || [];
        errors[name] = errorArr.map(({ message }: any) => ({
          message,
          field: name
        }));
      }
      return errors;
    });
  }, []);

  const isFieldTouched = useCallback(
    name => Boolean(cacheData.current.fieldsTouched[name]),
    []
  );

  const isFieldsTouched = useCallback(
    (names: (keyof V)[] = []) =>
      names.some(x => Boolean(cacheData.current.fieldsTouched[x])),
    []
  );

  const isFieldValidating = useCallback(
    name => fieldsValidating[name].validating,
    [fieldsValidating]
  );

  const errorsArr = useMemo(() => Object.keys(errors).map(key => errors[key]), [
    errors
  ]);

  return {
    errors,
    errorsArr,
    values,
    resetFields,
    validateFields,
    getFieldDecorator,
    setFieldsValue,
    getFieldsValue,
    getFieldValue,
    getFieldsError,
    getFieldError,
    setFields,
    isFieldTouched,
    isFieldsTouched,
    isFieldValidating
  };
}

export interface CreateOptions<V> {
  onValuesChange?: (
    changedValues: TypeValues<V>,
    allValues: TypeValues<V>
  ) => void;
}

export interface FormMethods<V> {
  errors: TypeErrors<V>;
  errorsArr: TypeErrors<V>[keyof V][];
  values: TypeValues<V>;
  validateFields: (
    ns?: (keyof V)[],
    options?: ValidateFieldsOptions
  ) => Promise<V>;
  resetFields: (ns?: (keyof V)[]) => void;
  getFieldDecorator: <
    P extends React.InputHTMLAttributes<React.ReactElement<P>>
  >(
    name: keyof V | (keyof V)[],
    options?: GetFieldDecoratorOptions<V>
  ) => (element: React.ReactElement<P>) => React.ReactElement<P>;
  setFieldsValue: (
    values: {
      [N in keyof V]?: V[N];
    }
  ) => void;
  getFieldsValue: (ns?: (keyof V)[]) => TypeValues<V>;
  getFieldsError: (
    ns?: (keyof V)[]
  ) => {
    [N in keyof V]?: {
      message: string;
      field: keyof V;
    }[];
  };
  getFieldValue: (name: keyof V) => V[keyof V] | undefined;
  getFieldError: (
    name: keyof V
  ) => {
    message: string;
    field: keyof V;
  }[];
  setFields: (
    fields: {
      [N in keyof V]?: {
        value?: V[N];
        errors?: Error[];
      };
    }
  ) => void;
  isFieldTouched(name: keyof V): boolean;
  isFieldsTouched(names?: (keyof V)[]): boolean;
  isFieldValidating(name?: keyof V): boolean;
}

export interface GetFieldDecoratorOptions<V> {
  rules?: Validator<V>[];
  initialValue?: any;
  trigger?: string;
  valuePropName?: string;
  normalize?: (...arg: any) => any;
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
  validator?: (
    rule: Validator<V>,
    value: any,
    callback: any,
    source?: any,
    options?: any
  ) => any;
}

export interface FormComponentProps<V> {
  form: FormMethods<V>;
}

export interface ValidateFieldsOptions {
  /** 所有表单域是否在第一个校验规则失败后停止继续校验 */
  // first?: boolean;
  /** 指定哪些表单域在第一个校验规则失败后停止继续校验 */
  // firstFields?: string[];
  /** 已经校验过的表单域，在 validateTrigger 再次被触发时是否再次校验 */
  force?: boolean;
  /** 定义 validateFieldsAndScroll 的滚动行为 */
  // scroll?: DomScrollIntoViewConfig;
}

export default useForm;
