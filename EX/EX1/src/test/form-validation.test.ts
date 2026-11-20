import { expect, test } from 'vitest';
import type { FormValues, ValidateForm, ValidationRules } from '../form/form.types';
import { validateForm } from '../form/validateForm';

const evaluate: ValidateForm = validateForm;
const rules: ValidationRules = {
  name: [
    (value) => value.trim() ? undefined : 'Nhập họ tên.',
    (value) => value.trim().length >= 2 ? undefined : 'Họ tên quá ngắn.',
  ],
  email: [(value) => value.includes('@') ? undefined : 'Email không hợp lệ.'],
};

test('returns the first error per invalid field', () => {
  const values: FormValues = Object.freeze({ name: ' ', email: 'invalid' });

  expect(evaluate(values, rules)).toEqual({
    name: 'Nhập họ tên.',
    email: 'Email không hợp lệ.',
  });
});

test('omits fields that pass or have no validation rules', () => {
  const values: FormValues = { name: 'Minh Anh', email: 'minh@example.test' };

  expect(evaluate(values, rules)).toEqual({});
  expect(evaluate({ ...values, email: '' }, { name: rules.name })).toEqual({});
});

test('gives a rule the full current values for cross-field checks', () => {
  const values: FormValues = { name: 'minh@example.test', email: 'minh@example.test' };
  const crossFieldRules: ValidationRules = {
    email: [(value, current) => value === current.name ? 'Email phải khác họ tên.' : undefined],
  };

  expect(evaluate(values, crossFieldRules)).toEqual({ email: 'Email phải khác họ tên.' });
});
