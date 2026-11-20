export type FormValues = Readonly<{
  name: string;
  email: string;
}>;

export type FormField = keyof FormValues;

/** Return a message for an invalid value, or undefined when the rule passes. */
export type ValidationRule = (value: string, values: FormValues) => string | undefined;

/** Run rules in array order and report only the first error for each field. */
export type ValidationRules = Readonly<Partial<Record<FormField, readonly ValidationRule[]>>>;
export type FormErrors = Readonly<Partial<Record<FormField, string>>>;

export type ValidateForm = (values: FormValues, validationRules: ValidationRules) => FormErrors;

export type FormProviderOptions = Readonly<{
  initialValues: FormValues;
  validationRules: ValidationRules;
}>;

/** Derive errors and isValid from the current values and rules during render. */
export type FormContextValue = Readonly<{
  values: FormValues;
  errors: FormErrors;
  /** True when errors contains no fields. */
  isValid: boolean;
  setFieldValue: (field: FormField, value: string) => void;
  validationRules: ValidationRules;
}>;
