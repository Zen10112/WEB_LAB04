import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let App;
let releaseModule;
let importStarted;
let renderDetail;
let runtimeErrors;
let consoleError;
let consoleWarn;

function recordRuntimeError(event) {
  runtimeErrors.push(event.error ?? event.reason ?? event.message);
}

beforeEach(async () => {
  vi.resetModules();
  const gate = new Promise((resolve) => {
    releaseModule = resolve;
  });
  importStarted = vi.fn();
  vi.doMock('../components/PersonDetail.jsx', async (importOriginal) => {
    importStarted();
    await gate;
    const module = await importOriginal();
    renderDetail = vi.fn(module.default);
    return { ...module, default: renderDetail };
  });

  runtimeErrors = [];
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  window.addEventListener('error', recordRuntimeError);
  window.addEventListener('unhandledrejection', recordRuntimeError);
  ({ default: App } = await import('../App.jsx'));
});

async function finishImport() {
  await act(async () => {
    releaseModule();
    await vi.dynamicImportSettled();
  });
}

afterEach(async () => {
  try {
    cleanup();
    await finishImport();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(runtimeErrors).toEqual([]);
  } finally {
    window.removeEventListener('error', recordRuntimeError);
    window.removeEventListener('unhandledrejection', recordRuntimeError);
    vi.doUnmock('../components/PersonDetail.jsx');
    vi.restoreAllMocks();
  }
});

test('starts importing on render and passes the profile to the real PersonDetail', async () => {
  expect(importStarted).not.toHaveBeenCalled();
  render(<App />);
  expect(screen.getByRole('region', { name: 'Thông tin cá nhân', busy: true })).toBeVisible();
  expect(screen.queryByText('Nguyễn Minh Anh')).not.toBeInTheDocument();

  await finishImport();

  expect(importStarted).toHaveBeenCalledTimes(1);
  expect(renderDetail).toHaveBeenCalledTimes(1);
  expect(renderDetail.mock.lastCall[0]).toEqual({
    person: { name: 'Nguyễn Minh Anh', role: 'Sinh viên' },
  });
  expect(screen.getByText('Nguyễn Minh Anh')).toBeVisible();
  expect(screen.getByText('Sinh viên')).toBeVisible();
});

test('does not mount PersonDetail if App unmounts while the import is pending', async () => {
  const { container, unmount } = render(<App />);
  expect(screen.getByText('Đang tải thông tin cá nhân…')).toBeInTheDocument();
  unmount();

  await finishImport();

  expect(importStarted).toHaveBeenCalledTimes(1);
  expect(renderDetail).not.toHaveBeenCalled();
  expect(container).toBeEmptyDOMElement();
});

// Exercise 1.1 has no router. Model a parent replacing the current route view.
function RouteView({ route }) {
  return route === 'person' ? <App /> : <main><h1>Trang khác</h1></main>;
}

test('keeps the active route when leaving and revisiting the pending detail view', async () => {
  const { container, rerender } = render(<RouteView route="person" />);
  expect(screen.getByText('Đang tải thông tin cá nhân…')).toBeInTheDocument();
  rerender(<RouteView route="other" />);
  expect(screen.getByRole('heading', { name: 'Trang khác' })).toBeVisible();
  rerender(<RouteView route="person" />);
  expect(screen.getByRole('region', { name: 'Thông tin cá nhân', busy: true })).toBeVisible();
  rerender(<RouteView route="other" />);

  await finishImport();

  expect(screen.getByRole('heading', { name: 'Trang khác' })).toBeVisible();
  expect(container.querySelector('[aria-live]')).toBeNull();
  expect(renderDetail).not.toHaveBeenCalled();
  rerender(<RouteView route="person" />);
  expect(await screen.findByText('Nguyễn Minh Anh')).toBeVisible();
  expect(screen.queryByText('Đang tải thông tin cá nhân…')).not.toBeInTheDocument();
  expect(importStarted).toHaveBeenCalledTimes(1);
});
