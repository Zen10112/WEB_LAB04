// @ts-check
import { useEffect, useState } from 'react';

/** @typedef {{ serverNow: string | number, clientReceivedAtMs: number }} ClockSample */

/** @param {string | number | undefined} value */
function toTimestamp(value) {
  return typeof value === 'string' ? Date.parse(value) : value ?? NaN;
}

/** @param {number} deadlineMs @param {number} offsetMs */
function remainingAtCurrentTime(deadlineMs, offsetMs) {
  return Number.isFinite(deadlineMs) ? Math.max(0, deadlineMs - (Date.now() + offsetMs)) : 0;
}

/** @param {string | number | undefined} deadlineAt @param {ClockSample} [clockSample] */
export default function useAppealSlaTimer(deadlineAt, clockSample) {
  const deadlineMs = toTimestamp(deadlineAt);
  const clockDelta = toTimestamp(clockSample?.serverNow) - (clockSample?.clientReceivedAtMs ?? NaN);
  const offsetMs = Number.isFinite(clockDelta) ? clockDelta : 0;
  const [sample, setSample] = useState(() => ({
    deadlineMs, offsetMs, remainingMs: remainingAtCurrentTime(deadlineMs, offsetMs),
  }));
  const remainingMs = Object.is(sample.deadlineMs, deadlineMs) && sample.offsetMs === offsetMs
    ? sample.remainingMs : remainingAtCurrentTime(deadlineMs, offsetMs);

  useEffect(() => {
    if (!Number.isFinite(deadlineMs)) return;

    /** @type {number | undefined} */
    let interval;

    function stopInterval() {
      if (interval === undefined) return;
      window.clearInterval(interval);
      interval = undefined;
    }

    function sync() {
      const remainingMs = remainingAtCurrentTime(deadlineMs, offsetMs);
      setSample((previous) => (
        previous.deadlineMs === deadlineMs && previous.offsetMs === offsetMs && previous.remainingMs === remainingMs
          ? previous : { deadlineMs, offsetMs, remainingMs }
      ));
      if (remainingMs === 0) stopInterval();
      else if (interval === undefined) interval = window.setInterval(sync, 1000);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') sync();
    }

    sync();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [deadlineMs, offsetMs]);

  return { remainingMs, expired: remainingMs === 0, isExpiredNow: () => remainingAtCurrentTime(deadlineMs, offsetMs) === 0 };
}
