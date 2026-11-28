import { useCallback, useEffect, useRef, useState } from 'react';

export type Profile = { id: string; name: string; age: number; bio: string; imageUrl: string };
export type SwipeKind = 'PASS' | 'LIKE' | 'SKIP';
type SwipeRecord = { id: string; profileId: string; kind: SwipeKind };
type Snapshot = { revision: number; history: SwipeRecord[] };
type DeckData = { profiles: Profile[]; snapshot: Snapshot };
type DeckRequest =
  | { type: 'load' }
  | { type: 'mutation'; path: string; body: { expectedRevision: number; operationId: string; profileId?: string; kind?: SwipeKind } };
type DeckState = {
  data: DeckData | null;
  pending: boolean;
  failure: { message: string; retry: DeckRequest | null } | null;
};

const apiOrigin = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
const loadRequest = { type: 'load' } as const;
const initialState: DeckState = { data: null, pending: true, failure: null };

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

async function requestJson<T>(path: string, signal: AbortSignal, body?: object): Promise<T> {
  const response = await fetch(new URL(path, apiOrigin), {
    signal,
    cache: 'no-store',
    ...(body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new HttpError(response.status);
  return response.json();
}

async function loadDeck(signal: AbortSignal): Promise<DeckData> {
  const [profiles, snapshot] = await Promise.all([
    requestJson<Profile[]>('/api/profiles', signal),
    requestJson<Snapshot>('/api/swipes', signal),
  ]);
  return { profiles, snapshot };
}

export function useSwipeDeck() {
  const [state, setState] = useState(initialState);
  const latest = useRef(initialState);
  const activeRequest = useRef<AbortController | null>(null);

  const runRequest = useCallback(async (request: DeckRequest) => {
    if (activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    const { signal } = controller;

    function update(patch: Partial<DeckState>) {
      if (signal.aborted) return;
      // Keep callbacks from the previous render from writing against an outdated snapshot.
      latest.current = { ...latest.current, ...patch };
      setState(latest.current);
    }

    update({ pending: true, failure: null });
    let retry: DeckRequest | null = request;

    try {
      if (request.type === 'load') {
        update({ data: await loadDeck(signal) });
        return;
      }

      const data = latest.current.data;
      if (!data) return;
      try {
        const snapshot = await requestJson<Snapshot>(request.path, signal, request.body);
        update({ data: { ...data, snapshot } });
      } catch (error) {
        if (signal.aborted) return;
        if (error instanceof HttpError && (error.status === 409 || error.status === 404)) {
          // Another client may have changed the deck. Refresh before accepting a new action.
          retry = loadRequest;
          update({
            data: await loadDeck(signal),
            failure: { message: 'Bộ thẻ đã thay đổi và được đồng bộ lại. Hãy chọn lại thao tác.', retry: null },
          });
          return;
        }
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) retry = null;
        throw error;
      }
    } catch {
      const message = retry?.type === 'load'
        ? 'Không tải được hồ sơ hoặc lịch sử vuốt.'
        : 'Chưa xác nhận được thao tác. Bộ thẻ vẫn hiển thị dữ liệu đã lưu gần nhất.';
      update({ failure: { message, retry } });
    } finally {
      update({ pending: false });
      controller.abort(); // Also cancels a sibling GET if one of the initial reads failed.
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, []);

  useEffect(() => {
    void runRequest(loadRequest);
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [runRequest]);

  function mutate(path: string, fields: { profileId?: string; kind?: SwipeKind } = {}) {
    const data = state.data;
    if (!data || latest.current.data !== data || activeRequest.current || latest.current.failure?.retry) return;

    void runRequest({
      type: 'mutation',
      path,
      body: { ...fields, expectedRevision: data.snapshot.revision, operationId: crypto.randomUUID() },
    });
  }

  function retryRequest() {
    const retry = latest.current.failure?.retry;
    if (retry) void runRequest(retry);
  }

  const blocked = state.pending || Boolean(state.failure?.retry);
  const lastSwipe = state.data?.snapshot.history.at(-1);

  return {
    data: state.data,
    pending: state.pending,
    error: state.failure?.message,
    retry: state.failure?.retry ? retryRequest : undefined,
    swipe: blocked ? undefined : (profileId: string, kind: SwipeKind) => mutate('/api/swipe', { profileId, kind }),
    undo: !blocked && lastSwipe ? () => mutate(`/api/swipe/${lastSwipe.id}/undo`) : undefined,
  };
}
