import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../App.jsx';

const moduleGate = vi.hoisted(() => {
  let resolve;
  const ready = new Promise((done) => {
    resolve = done;
  });
  return { ready, resolve };
});

// Only control the imported module. App must supply the real lazy/Suspense wiring.
vi.mock('../components/PersonDetail.jsx', async () => {
  await moduleGate.ready;
  return {
    default: function PersonDetail() {
      return <article aria-label="Person detail loaded">Person detail content</article>;
    },
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('shows the accessible fallback until PersonDetail loads, then renders without errors', async () => {
  const consoleErrors = [];
  const runtimeErrors = [];
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    consoleErrors.push(args);
  });
  const onError = (event) => runtimeErrors.push(event.error ?? event.message);
  const onRejection = (event) => runtimeErrors.push(event.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  try {
    const { container } = render(<App />);

    // 1. The detail must not render while the import is pending.
    expect(screen.queryByRole('article', { name: 'Person detail loaded' })).not.toBeInTheDocument();

    // 2. Skeleton must expose the agreed loading attributes.
    const fallback = container.querySelector('[aria-busy="true"][aria-live="polite"]');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toBeVisible();

    await act(async () => {
      moduleGate.resolve();
      await moduleGate.ready;
    });

    // 3. Completing the dynamic import makes the detail visible.
    expect(await screen.findByRole('article', { name: 'Person detail loaded' })).toBeVisible();

    // 4. Suspense replaces, rather than retains, its fallback.
    await waitFor(() => {
      expect(fallback).not.toBeInTheDocument();
      expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
    });

    // 5. Rendering after the import must produce no React or runtime errors.
    expect(consoleErrors).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  } finally {
    moduleGate.resolve();
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  }
});
