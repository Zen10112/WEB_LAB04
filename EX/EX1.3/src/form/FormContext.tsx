import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  FormContextValue,
  FormProviderOptions,
  FormValues,
} from './form.types';
import { validateForm } from './validateForm';

export const FormContext = createContext<FormContextValue | null>(null);

type FormProviderProps = FormProviderOptions & { children: ReactNode };

export function FormProvider({ initialValues, validationRules, children }: FormProviderProps) {
  const [values, setValues] = useState<FormValues>(() => ({ ...initialValues }));

  const setFieldValue = useCallback<FormContextValue['setFieldValue']>((field, value) => {
    setValues((current) => (
      current[field] === value ? current : { ...current, [field]: value }
    ));
  }, []);

  const form = useMemo<FormContextValue>(() => {
    const errors = validateForm(values, validationRules);
    return {
      values,
      errors,
      isValid: Object.keys(errors).length === 0,
      setFieldValue,
      validationRules,
    };
  }, [values, setFieldValue, validationRules]);

  return <FormContext value={form}>{children}</FormContext>;
}

export function useFormContext(): FormContextValue {
  const form = useContext(FormContext);
  if (form === null) {
    throw new Error('useFormContext must be used within a FormProvider.');
  }
  return form;
}
