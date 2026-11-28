// @ts-check
import { useId } from 'react';
import { useFormContext } from './FormContext';

/**
 * @param {{ name: import('./validateAppeal').AppealField, label: string, kind?: 'text' | 'url' | 'select' | 'textarea',
 * options?: ReadonlyArray<{ value: string, label: string }>, required?: boolean, hint?: string, revealError?: boolean }} props
 */
export default function InputField({ name, label, kind = 'text', options = [], required = false, hint, revealError }) {
  const id = useId();
  const { values, errors, touched, attempted, setFieldValue, markTouched } = useFormContext();
  const error = touched[name] || attempted || revealError ? errors[name] : undefined;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');
  const control = {
    id, name, required, value: values[name],
    onChange: (/** @type {import('react').ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>} */ event) => {
      setFieldValue(name, event.currentTarget.value);
    },
    onBlur: () => markTouched(name),
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  };

  return (
    <div className="appeal-field">
      <label htmlFor={id}>{label}</label>
      {hint && <p className="appeal-hint" id={hintId}>{hint}</p>}
      {kind === 'select' ? (
        <select {...control}>
          <option value="">Choose a ground</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : kind === 'textarea' ? <textarea {...control} rows={5} /> : <input {...control} type={kind} />}
      {error && <p className="appeal-error" id={errorId}>{error}</p>}
    </div>
  );
}
