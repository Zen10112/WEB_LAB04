import type { FormField, ValidateForm } from './form.types';

export const validateForm: ValidateForm = (values, validationRules) => {
  const errors: Partial<Record<FormField, string>> = {};

  for (const field of Object.keys(values) as FormField[]) {
    for (const rule of validationRules[field] ?? []) {
      const message = rule(values[field], values);
      if (message !== undefined) {
        errors[field] = message;
        break;
      }
    }
  }

  return errors;
};
