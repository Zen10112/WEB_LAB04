// @ts-check

const utcDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

/** @param {number} remainingMs */
function formatRemaining(remainingMs) {
  const seconds = Math.ceil(remainingMs / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor(seconds / 3600) % 24;
  const minutes = Math.floor(seconds / 60) % 60;
  const clock = [hours, minutes, seconds % 60].map((part) => String(part).padStart(2, '0')).join(':');
  return days ? `${days}d ${clock}` : clock;
}

/** @param {{ deadlineAt: string, remainingMs: number, expired: boolean }} props */
export default function AppealSlaStatus({ deadlineAt, remainingMs, expired }) {
  const deadlineMs = Date.parse(deadlineAt);

  return (
    <dl className="appeal-sla">
      <div>
        <dt>Appeal deadline</dt>
        <dd>{Number.isFinite(deadlineMs) ? <time dateTime={deadlineAt}>{utcDate.format(deadlineMs)} UTC</time> : 'Unavailable'}</dd>
      </div>
      <div>
        <dt>Time remaining</dt>
        <dd>{expired ? <span role="status">Appeal window closed</span> : <span role="timer">{formatRemaining(remainingMs)}</span>}</dd>
      </div>
    </dl>
  );
}
