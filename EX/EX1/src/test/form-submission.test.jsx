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
