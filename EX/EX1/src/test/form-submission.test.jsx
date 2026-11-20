import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import SimpleForm from '../form/SimpleForm';

afterEach(cleanup);

test('blocks an empty submission and focuses the first field with its error', () => {
  const onSubmit = vi.fn();
  render(<SimpleForm onSubmit={onSubmit} />);

  fireEvent.click(screen.getByRole('button', { name: 'Gửi thông tin' }));

  const name = screen.getByRole('textbox', { name: 'Họ và tên' });
  expect(name).toHaveFocus();
  expect(name).toHaveAttribute('aria-invalid', 'true');
  expect(name).toHaveAttribute('aria-describedby', screen.getByText('Nhập họ tên.').id);
  expect(name).toHaveAccessibleDescription('Nhập họ tên.');
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

test('blocks invalid data and prevents the native form submission', () => {
  const onSubmit = vi.fn();
  render(<SimpleForm initialValues={{ name: 'Minh Anh', email: 'minh@' }} onSubmit={onSubmit} />);

  expect(fireEvent.submit(screen.getByRole('form'))).toBe(false);

  const email = screen.getByRole('textbox', { name: 'Email' });
  expect(email).toHaveFocus();
  expect(email).toHaveAccessibleDescription('Email không hợp lệ.');
  expect(onSubmit).not.toHaveBeenCalled();
});

test('submits the latest valid values and clears confirmation after an edit', () => {
  const onSubmit = vi.fn();
  render(<SimpleForm initialValues={{ name: 'Minh Anh', email: 'old@example.test' }} onSubmit={onSubmit} />);

  const email = screen.getByRole('textbox', { name: 'Email' });
  fireEvent.change(email, { target: { value: 'new@example.test' } });
  expect(fireEvent.submit(screen.getByRole('form'))).toBe(false);

  expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ name: 'Minh Anh', email: 'new@example.test' });
  expect(screen.getByRole('status')).toHaveTextContent('Đã xác nhận thông tin hợp lệ.');

  fireEvent.change(email, { target: { value: '' } });
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  expect(email).toHaveAccessibleDescription('Nhập email.');
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('keeps the last valid JSON until the next valid submission', () => {
  const { container } = render(<SimpleForm />);
  const form = screen.getByRole('form');
  const name = screen.getByRole('textbox', { name: 'Họ và tên' });
  const email = screen.getByRole('textbox', { name: 'Email' });
  const code = () => container.querySelector('pre code');

  expect(code()).not.toBeInTheDocument();
  fireEvent.submit(form);
  expect(code()).not.toBeInTheDocument();

  const first = { name: 'Minh Anh', email: 'first@example.test' };
  fireEvent.change(name, { target: { value: first.name } });
  fireEvent.change(email, { target: { value: first.email } });
  expect(code()).not.toBeInTheDocument();
  fireEvent.submit(form);
  expect(code()?.textContent).toBe(JSON.stringify(first, null, 2));

  fireEvent.change(email, { target: { value: 'invalid' } });
  fireEvent.submit(form);
  expect(code()?.textContent).toBe(JSON.stringify(first, null, 2));

  const second = { ...first, email: 'second@example.test' };
  fireEvent.change(email, { target: { value: second.email } });
  expect(code()?.textContent).toBe(JSON.stringify(first, null, 2));
  fireEvent.submit(form);
  expect(code()?.textContent).toBe(JSON.stringify(second, null, 2));
});

test('renders Unicode, quotes, backslashes and markup-like characters as JSON text', () => {
  const initialValues = { name: 'Ánh "<em> & \\ "', email: 'anh@example.test' };
  const { container } = render(<SimpleForm initialValues={initialValues} />);

  fireEvent.submit(screen.getByRole('form'));

  const code = container.querySelector('pre code');
  expect(code?.textContent).toBe(JSON.stringify(initialValues, null, 2));
  expect(code?.querySelector('em')).toBeNull();
});

test('keeps form values and the inspector unchanged if a submit consumer edits its payload', () => {
  const initialValues = { name: 'Minh Anh', email: 'minh@example.test' };
  const onSubmit = vi.fn((payload) => {
    payload.email = 'changed@example.test';
  });
  const { container } = render(<SimpleForm initialValues={initialValues} onSubmit={onSubmit} />);

  fireEvent.submit(screen.getByRole('form'));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(initialValues.email);
  expect(JSON.parse(container.querySelector('pre code').textContent)).toEqual(initialValues);
});
