import { useId } from 'react';
import { useFormContext } from './FormContext';
import type { FormField } from './form.types';

type InputFieldProps = {
  name: FormField;
  label: string;
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
  placeholder?: string;
};

export default function InputField({ name, label, type = 'text', placeholder }: InputFieldProps) {
  const id = useId();
  const { values, errors, setFieldValue } = useFormContext();
  const error = errors[name];
  const hasError = error !== undefined;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={values[name]}
        onChange={(event) => setFieldValue(name, event.currentTarget.value)}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      {hasError && <p className="contact-form-error" id={errorId}>{error}</p>}
    </div>
  );
}
