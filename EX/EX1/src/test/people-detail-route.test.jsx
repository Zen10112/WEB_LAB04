import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test } from 'vitest';
import AppRoutes from '../AppRoutes.jsx';

afterEach(cleanup);

function renderRoute(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

function findDetail() {
  return screen.findByRole('region', { name: 'Thông tin cá nhân', busy: false });
}

test.each([
  ['/people/1', 'Nguyễn Minh Anh'],
  ['/people/2', 'Trần Bảo Trân'],
  ['/people/minh-anh', 'Nguyễn Minh Anh'],
])('renders the matching profile on direct entry to %s', async (path, name) => {
  renderRoute(path);

  const detail = await findDetail();
  expect(detail.querySelector('dl dt')).toHaveTextContent('Họ và tên');
  expect(detail.querySelector('dl dd')).toHaveTextContent(name);
});

test.each(['/people/invalid-id', '/people/999', '/people/01'])(
  'keeps the directory available when no profile matches %s',
  (path) => {
    renderRoute(path);

    expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy người này');
    expect(screen.getByRole('navigation', { name: 'Danh sách' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Thông tin cá nhân' })).not.toBeInTheDocument();
  },
);

test('updates the detail after consecutive selections', async () => {
  renderRoute('/people/1');
  expect(within(await findDetail()).getByText('Nguyễn Minh Anh')).toBeVisible();

  const sidebar = within(screen.getByRole('navigation', { name: 'Danh sách' }));
  fireEvent.click(sidebar.getByRole('link', { name: 'Trần Bảo Trân' }));
  fireEvent.click(sidebar.getByRole('link', { name: 'Lê Đức Huy' }));

  const detail = within(await findDetail());
  expect(detail.getByText('Lê Đức Huy')).toBeVisible();
  expect(detail.getByText('Trợ giảng')).toBeVisible();
  expect(detail.queryByText('Nguyễn Minh Anh')).not.toBeInTheDocument();
  expect(detail.queryByText('Trần Bảo Trân')).not.toBeInTheDocument();
});
