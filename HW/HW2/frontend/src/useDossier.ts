import { useEffect, useReducer, useState } from 'react';
import { ApiError, requestApi } from './api';
import type { Dossier, DossierSummary } from './dossiers';

type ReadState<T> = {
  path: string | null;
  data: { payload: T; clientReceivedAtMs: number } | null;
  pending: boolean;
  error: ApiError | Error | null;
};

function useApiRead<T>(path: string | null, refreshWhenVisible = false) {
  const [state, setState] = useState<ReadState<T>>({ path, data: null, pending: Boolean(path), error: null });
  const [attempt, reload] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    if (!path) return;
    const requestPath = path;
    let active: AbortController | null = null;

    async function load() {
      if (active) return;
      const controller = new AbortController();
      active = controller;
      const { signal } = controller;

      setState((previous) => ({ path: requestPath, pending: true, error: null, data: previous.path === requestPath ? previous.data : null }));
      try {
        const payload = await requestApi<T>(requestPath, signal);
        const clientReceivedAtMs = Date.now();
        if (!signal.aborted) setState((previous) => ({ ...previous, data: { payload, clientReceivedAtMs } }));
      } catch (error) {
        if (!signal.aborted) {
          setState((previous) => ({
            ...previous,
            data: error instanceof ApiError && error.status === 404 ? null : previous.data,
            error: error instanceof Error ? error : new Error('The request could not be completed.'),
          }));
        }
      } finally {
        if (!signal.aborted) setState((previous) => ({ ...previous, pending: false }));
        if (active === controller) active = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') void load();
    }

    void load();
    if (refreshWhenVisible) document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active?.abort();
      if (refreshWhenVisible) document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [path, attempt, refreshWhenVisible]);

  // Exclude the old route's data even before React runs the previous effect's cleanup.
  const current = state.path === path ? state : { path, data: null, pending: Boolean(path), error: null };
  return { ...current, reload };
}

export function useDossierList() {
  return useApiRead<{ dossiers: DossierSummary[] }>('/api/dossiers');
}

export function useDossier(playerID?: string) {
  return useApiRead<{ dossier: Dossier; serverNow: string }>(playerID ? `/api/dossiers/${encodeURIComponent(playerID)}` : null, true);
}
