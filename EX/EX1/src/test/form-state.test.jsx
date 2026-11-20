import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { FormProvider, useFormContext } from '../form/FormContext';

afterEach(cleanup);

const initialValues = { name: '', email: '' };
const validationRules = {
  name: [(value) => value.trim() ? undefined : 'Nhập họ tên.'],
  email: [(value) => value.includes('@') ? undefined : 'Email không hợp lệ.'],
};

function Wrapper({ children }) {
  return (
    <FormProvider initialValues={initialValues} validationRules={validationRules}>
      {children}
    </FormProvider>
  );
}

test('exposes the initial values, rules, errors and validity through context', () => {
  const { result } = renderHook(useFormContext, { wrapper: Wrapper });

  expect(result.current.values).toEqual(initialValues);
  expect(result.current.validationRules).toEqual(validationRules);
  expect(result.current.errors).toEqual({ name: 'Nhập họ tên.', email: 'Email không hợp lệ.' });
  expect(result.current.isValid).toBe(false);
});

test('derives errors and validity in the same render as field changes', () => {
  const snapshots = [];
  const { result } = renderHook(() => {
    const form = useFormContext();
    snapshots.push([form.values.name, form.values.email, form.errors, form.isValid]);
    return form;
  }, { wrapper: Wrapper });

  act(() => result.current.setFieldValue('name', 'Minh Anh'));
  expect(result.current.values).toEqual({ name: 'Minh Anh', email: '' });
  expect(result.current.errors).toEqual({ email: 'Email không hợp lệ.' });
  expect(result.current.isValid).toBe(false);

  act(() => result.current.setFieldValue('email', 'minh@example.test'));
  expect(result.current.errors).toEqual({});
  expect(result.current.isValid).toBe(true);

  act(() => result.current.setFieldValue('email', ''));
  expect(result.current.errors).toEqual({ email: 'Email không hợp lệ.' });
  expect(result.current.isValid).toBe(false);

  for (const [name, email, errors, isValid] of snapshots) {
    expect(errors).toEqual({
      ...(name ? {} : { name: 'Nhập họ tên.' }),
      ...(email ? {} : { email: 'Email không hợp lệ.' }),
    });
    expect(isValid).toBe(Boolean(name && email));
  }
});

test('preserves both batched field updates without React warnings', () => {
  const error = vi.spyOn(console, 'error');
  const warn = vi.spyOn(console, 'warn');

  try {
    const { result } = renderHook(useFormContext, { wrapper: Wrapper });
    act(() => {
      result.current.setFieldValue('name', 'Minh Anh');
      result.current.setFieldValue('email', 'minh@example.test');
    });

    expect(result.current.values).toEqual({ name: 'Minh Anh', email: 'minh@example.test' });
    expect(result.current.isValid).toBe(true);
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
});

test('reports a clear error when used without a FormProvider', () => {
  expect(() => renderHook(useFormContext)).toThrow(
    'useFormContext must be used within a FormProvider.',
  );
});
