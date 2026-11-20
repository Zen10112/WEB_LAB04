import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { FormProvider, useFormContext } from '../form/FormContext';
import InputField from '../form/InputField';
import SimpleForm from '../form/SimpleForm';

afterEach(cleanup);

test('renders initial values with distinct IDs and associated labels', () => {
  render(<SimpleForm initialValues={{ name: 'Minh Anh', email: 'minh@example.test' }} />);

  const form = within(screen.getByRole('form', { name: 'Thông tin liên hệ' }));
  const name = form.getByRole('textbox', { name: 'Họ và tên' });
  const email = form.getByRole('textbox', { name: 'Email' });

  expect(name).toHaveValue('Minh Anh');
  expect(email).toHaveValue('minh@example.test');
  expect(email).toHaveAttribute('type', 'email');
  expect(email).toHaveAttribute('placeholder', 'Nhập email');
  expect(name.id).not.toBe(email.id);
  expect(form.getByText('Họ và tên')).toHaveAttribute('for', name.id);
  expect(form.getByText('Email')).toHaveAttribute('for', email.id);
});

function ContextValues() {
  const { values } = useFormContext();
  return <output aria-label="Giá trị trong Context">{JSON.stringify(values)}</output>;
}

test('updates only the edited context field and stays controlled when cleared', () => {
  const error = vi.spyOn(console, 'error');
  const warn = vi.spyOn(console, 'warn');

  try {
    render(
      <FormProvider initialValues={{ name: 'Minh Anh', email: '' }} validationRules={{}}>
        <InputField name="name" label="Họ và tên" />
        <InputField name="email" label="Email" type="email" />
        <ContextValues />
      </FormProvider>,
    );

    const name = screen.getByRole('textbox', { name: 'Họ và tên' });
    const email = screen.getByRole('textbox', { name: 'Email' });
    const context = screen.getByRole('status', { name: 'Giá trị trong Context' });
    const nameId = name.id;

    fireEvent.change(email, { target: { value: 'minh@example.test' } });
    expect(context).toHaveTextContent('{"name":"Minh Anh","email":"minh@example.test"}');
    expect(name).toHaveValue('Minh Anh');

    fireEvent.change(name, { target: { value: '' } });
    expect(name).toHaveValue('');
    expect(name).toHaveAttribute('id', nameId);
    expect(email).toHaveValue('minh@example.test');
    expect(context).toHaveTextContent('{"name":"","email":"minh@example.test"}');
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
});

test('associates an existing context error with only the affected field', () => {
  render(<SimpleForm validationRules={{ email: [(value) => value ? undefined : 'Nhập email.'] }} />);

  const name = screen.getByRole('textbox', { name: 'Họ và tên' });
  const email = screen.getByRole('textbox', { name: 'Email' });
  const message = screen.getByText('Nhập email.');

  expect(name).not.toHaveAttribute('aria-describedby');
  expect(email).toHaveAttribute('aria-invalid', 'true');
  expect(email).toHaveAttribute('aria-describedby', message.id);
  expect(email).toHaveAccessibleDescription('Nhập email.');
});
