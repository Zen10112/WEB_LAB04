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

    expect(screen.getByRole('alert')).toHaveTextContent('404 – Không tìm thấy người này');
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

test.each(['/people/2', '/people/bao-tran', '/PEOPLE/%32/'])(
  'identifies the current profile link for %s',
  (path) => {
    renderRoute(path);

    const sidebar = within(screen.getByRole('navigation', { name: 'Danh sách' }));
    expect(sidebar.getAllByRole('link', { current: 'page' })).toHaveLength(1);
    expect(sidebar.getByRole('link', { name: 'Trần Bảo Trân' })).toHaveAttribute(
      'aria-current', 'page',
    );
  },
);

test('does not mark a case-mismatched ID as selected on the profile 404', () => {
  renderRoute('/people/MINH-ANH');

  expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy người này');
  const sidebar = within(screen.getByRole('navigation', { name: 'Danh sách' }));
  expect(sidebar.queryByRole('link', { current: 'page' })).not.toBeInTheDocument();
});

test('renders the home and directory outlets in the same shared layout', async () => {
  renderRoute('/');

  const header = screen.getByRole('banner');
  const main = screen.getByRole('main');
  const navigation = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
  expect(within(main).getByRole('heading', { name: 'Trang chủ' })).toBeVisible();
  expect(navigation.getByRole('link', { name: 'Trang chủ', current: 'page' })).toBeVisible();

  fireEvent.click(navigation.getByRole('link', { name: 'Thông tin cá nhân' }));

  expect(await within(main).findByRole('heading', { name: 'Danh bạ' })).toBeVisible();
  expect(screen.getByRole('main')).toBe(main);
  expect(screen.getByRole('banner')).toBe(header);
  expect(navigation.getByRole('link', { name: 'Thông tin cá nhân', current: 'page' })).toBeVisible();
  expect(navigation.getByRole('link', { name: 'Trang chủ' })).not.toHaveAttribute('aria-current');

  const sidebar = within(screen.getByRole('navigation', { name: 'Danh sách' }));
  expect(sidebar.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/people/minh-anh', '/people/bao-tran', '/people/duc-huy',
  ]);
  expect(within(screen.getByRole('region', { name: 'Chi tiết hồ sơ' }))
    .getByText('Chọn một người trong danh sách để xem chi tiết.')).toBeVisible();
});

test('renders the shared layout around an unmatched URL', () => {
  renderRoute('/khong-ton-tai');

  expect(within(screen.getByRole('main'))
    .getByRole('heading', { name: '404 – Không tìm thấy trang' })).toBeVisible();
  const navigation = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
  expect(navigation.queryByRole('link', { current: 'page' })).not.toBeInTheDocument();
});
