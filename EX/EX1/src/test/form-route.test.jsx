import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import AppRoutes from '../AppRoutes.jsx';

afterEach(cleanup);

test('opens the form from home, submits, and leaves and reopens the form cleanly', async () => {
  const error = vi.spyOn(console, 'error');
  const warn = vi.spyOn(console, 'warn');

  try {
    render(<MemoryRouter><AppRoutes /></MemoryRouter>);
    const main = screen.getByRole('main');
    const header = screen.getByRole('banner');
    fireEvent.click(within(main).getByRole('link', { name: 'Mở biểu mẫu liên hệ' }));

    const form = await within(main).findByRole('form', { name: 'Thông tin liên hệ' });
    fireEvent.change(within(form).getByRole('textbox', { name: 'Họ và tên' }), {
      target: { value: 'Minh Anh' },
    });
    fireEvent.change(within(form).getByRole('textbox', { name: 'Email' }), {
      target: { value: 'minh@example.test' },
    });
    fireEvent.click(within(form).getByRole('button', { name: 'Gửi thông tin' }));
    expect(JSON.parse(main.querySelector('pre code').textContent)).toEqual({
      name: 'Minh Anh', email: 'minh@example.test',
    });

    fireEvent.click(within(header).getByRole('link', { name: 'Thông tin cá nhân' }));
    expect(await within(main).findByRole('heading', { name: 'Danh bạ' })).toBeVisible();
    expect(main.querySelector('pre code')).toBeNull();

    fireEvent.click(within(header).getByRole('link', { name: 'Trang chủ' }));
    fireEvent.click(await within(main).findByRole('link', { name: 'Mở biểu mẫu liên hệ' }));
    expect(await within(main).findByRole('textbox', { name: 'Email' })).toHaveValue('');
    expect(main.querySelector('pre code')).toBeNull();
    expect(screen.getByRole('banner')).toBe(header);
    expect(screen.getByRole('main')).toBe(main);
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
});
