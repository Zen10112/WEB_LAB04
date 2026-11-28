import { useEffect, useRef, useState } from 'react';
import { ApiError, requestApi } from '../api';
import type { normalizeAppeal } from './validateAppeal';

type Draft = ReturnType<typeof normalizeAppeal>;
type Payload = Draft & { operationId: string };
type Receipt = { id: string; playerID: string; submittedAt: string };
type State = {
  pending: boolean;
  error: string | null;
  receipt: Receipt | null;
  canRetry: boolean;
  closed: boolean;
};
const initial: State = { pending: false, error: null, receipt: null, canRetry: false, closed: false };

export function useAppealSubmission(playerID: string, onExpired: () => void) {
  const [state, setState] = useState(initial);
  const active = useRef<AbortController | null>(null);
  const retryPayload = useRef<Payload | null>(null);
  const confirmed = useRef(false);

  useEffect(() => () => { active.current?.abort(); }, []);

  async function send(payload: Payload) {
    if (active.current || confirmed.current) return;
    const controller = new AbortController();
    active.current = controller;
    const { signal } = controller;
    setState({ ...initial, pending: true });

    try {
      const receipt = await requestApi<Receipt>(`/api/dossiers/${encodeURIComponent(playerID)}/appeals`, signal, payload);
      if (signal.aborted) return;
      confirmed.current = true;
      retryPayload.current = null;
      setState({ ...initial, receipt });
    } catch (error) {
      if (signal.aborted) return;
      const definitive = error instanceof ApiError && [400, 403, 404, 409, 413, 415].includes(error.status);
      const closed = error instanceof ApiError && error.code === 'APPEAL_DEADLINE_EXPIRED';
      retryPayload.current = definitive ? null : payload;
      setState({
        ...initial, canRetry: !definitive, closed,
        error: definitive ? error.message : 'The appeal could not be confirmed. Retry to check or finish the same submission.',
      });
      if (closed) onExpired();
    } finally {
      if (active.current === controller) active.current = null;
    }
  }

  function submit(draft: Draft) {
    if (active.current || confirmed.current || retryPayload.current) return;
    void send({ ...draft, operationId: crypto.randomUUID() });
  }

  function retry() {
    if (retryPayload.current) void send(retryPayload.current);
  }

  return { ...state, submit, retry };
}
