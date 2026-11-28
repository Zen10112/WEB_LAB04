import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { validateAppeal } from './validateAppeal';
import type { AppealDraft, AppealErrors, AppealField } from './validateAppeal';

type FormContextValue = {
  values: AppealDraft;
  errors: AppealErrors;
  isValid: boolean;
  touched: Partial<Record<AppealField, boolean>>;
  attempted: boolean;
  setFieldValue: (name: AppealField, value: string) => void;
  markTouched: (name: AppealField) => void;
  markAttempted: () => void;
};

const emptyDraft: AppealDraft = { ground: '', statement: '', evidenceUrl: '' };
export const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<AppealDraft>(emptyDraft);
  const [touched, setTouched] = useState<FormContextValue['touched']>({});
  const [attempted, setAttempted] = useState(false);
  const errors = validateAppeal(values);

  function markTouched(name: AppealField) {
    setTouched((current) => current[name] ? current : { ...current, [name]: true });
  }

  function setFieldValue(name: AppealField, value: string) {
    setValues((current) => current[name] === value ? current : { ...current, [name]: value });
    markTouched(name);
  }

  return (
    <FormContext.Provider value={{
      values, errors, isValid: Object.keys(errors).length === 0, touched, attempted,
      setFieldValue, markTouched, markAttempted: () => setAttempted(true),
    }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const form = useContext(FormContext);
  if (!form) throw new Error('useFormContext must be used inside a FormProvider.');
  return form;
}
