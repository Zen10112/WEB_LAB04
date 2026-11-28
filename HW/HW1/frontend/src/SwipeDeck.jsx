// @ts-check
import { useId, useRef } from 'react';
import { useSwipeDeck } from './useSwipeDeck';

/** @typedef {import('./useSwipeDeck').Profile} Profile */
/** @typedef {'left' | 'right' | 'up'} SwipeDirection */
/** @typedef {import('./useSwipeDeck').SwipeKind} SwipeKind */

const swipeThreshold = 50;

/** @param {{ profile: Profile, onSwipe?: (direction: SwipeDirection) => void }} props */
function ProfileCard({ profile, onSwipe }) {
  const gesture = useRef(/** @type {{ pointerId: number, startX: number } | null} */ (null));

  /** @param {import('react').PointerEvent<HTMLElement>} event */
  function handlePointerDown(event) {
    if (!onSwipe || gesture.current || !event.isPrimary || event.button !== 0) return;

    gesture.current = { pointerId: event.pointerId, startX: event.clientX };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  /** @param {import('react').PointerEvent<HTMLElement>} event */
  function handlePointerUp(event) {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;

    gesture.current = null;
    const distance = event.clientX - start.startX;
    if (distance < -swipeThreshold) onSwipe?.('left');
    if (distance > swipeThreshold) onSwipe?.('right');
  }

  /** @param {import('react').PointerEvent<HTMLElement>} event */
  function handlePointerCancel(event) {
    if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
  }

  return (
    <article
      className="profile-card"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
    >
      <img src={profile.imageUrl} alt={`Ảnh chân dung ${profile.name}`} draggable={false} />
      <div className="profile-details">
        <h3>{profile.name} <span>{profile.age} tuổi</span></h3>
        <p>{profile.bio}</p>
      </div>
    </article>
  );
}

/** @param {{ score: number, remainingCount: number }} props */
function DeckStats({ score, remainingCount }) {
  return (
    <section className="deck-panel">
      <h2>Thống kê</h2>
      <dl className="deck-stats">
        <div><dt>Điểm số</dt><dd>{score}</dd></div>
        <div><dt>Thẻ còn lại</dt><dd>{remainingCount}</dd></div>
      </dl>
    </section>
  );
}

/** @param {{ profiles: Profile[] }} props */
function UpcomingQueue({ profiles }) {
  return (
    <section className="deck-panel">
      <h2>Hàng đợi</h2>
      {profiles.length ? (
        <ol className="deck-queue">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <img src={profile.imageUrl} alt="" width="48" height="48" loading="lazy" />
              <div><strong>{profile.name}</strong><span>{profile.age} tuổi</span></div>
            </li>
          ))}
        </ol>
      ) : <p className="queue-empty">Không có hồ sơ tiếp theo.</p>}
    </section>
  );
}

/** @type {ReadonlyArray<{ direction: SwipeDirection, label: string, icon: string }>} */
const swipeActions = [
  { direction: 'left', label: 'Dislike', icon: '×' },
  { direction: 'up', label: 'Swipe Up', icon: '↑' },
  { direction: 'right', label: 'Like', icon: '♥' },
];

/** @param {{ onSwipe?: (direction: SwipeDirection) => void, onUndo?: () => void }} props */
function SwipeControls({ onSwipe, onUndo }) {
  return (
    <div className="swipe-controls" role="group" aria-label="Thao tác với thẻ">
      {swipeActions.map(({ direction, label, icon }) => (
        <button key={direction} className={`swipe-button swipe-${direction}`} type="button" lang="en"
          aria-disabled={!onSwipe} onClick={onSwipe ? () => onSwipe(direction) : undefined}>
          <span aria-hidden="true">{icon}</span>{label}
        </button>
      ))}
      <button className="swipe-button swipe-undo" type="button" lang="en" aria-disabled={!onUndo} onClick={onUndo}>
        <span aria-hidden="true">↶</span>Undo
      </button>
    </div>
  );
}

/** @type {ReadonlyMap<string, SwipeDirection>} */
const keyboardDirections = new Map([
  ['ArrowLeft', 'left'],
  ['ArrowRight', 'right'],
  ['ArrowUp', 'up'],
]);

/**
 * @param {{ profiles: Profile[], score: number, status?: 'ready' | 'loading' | 'error', pending?: boolean,
 * onSwipe?: (direction: SwipeDirection) => void, onUndo?: () => void, error?: string, onRetry?: () => void }} props
 */
export default function SwipeDeck({ profiles, score, status = 'ready', pending = false, onSwipe, onUndo, error, onRetry }) {
  const headingId = useId();
  const shortcutHintId = useId();
  const stage = useRef(/** @type {HTMLElement | null} */ (null));
  const ready = status === 'ready';
  const [current, ...upcoming] = ready ? profiles : [];
  const swipe = ready && current && !pending ? onSwipe : undefined;
  const undo = ready && !pending ? onUndo : undefined;
  const showShortcuts = Boolean(swipe || undo);

  /** @param {import('react').KeyboardEvent<HTMLElement>} event */
  function handleKeyDown(event) {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return;

    const direction = keyboardDirections.get(event.key);
    if (direction && swipe) {
      event.preventDefault();
      if (!event.repeat) swipe(direction);
    } else if (event.key === 'Backspace' && undo) {
      event.preventDefault();
      if (!event.repeat) undo();
    }
  }

  return (
    <main className="swipe-deck">
      <header className="deck-header">
        <span className="deck-mark" aria-hidden="true">♡</span>
        <h1>Hẹn hò nhưng không yêu</h1>
      </header>

      <div className="deck-layout">
        <section
          ref={stage}
          className="deck-panel deck-stage"
          aria-labelledby={headingId}
          aria-describedby={showShortcuts ? shortcutHintId : undefined}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <h2 id={headingId}>Hồ sơ hiện tại</h2>
          {current && <ProfileCard key={current.id} profile={current} onSwipe={swipe} />}
          {status === 'loading' && <p className="deck-message" role="status">Đang tải hồ sơ…</p>}
          {status === 'error' && <p className="deck-message" role="alert">{error ?? 'Không tải được hồ sơ.'}</p>}
          {ready && !current && <p className="deck-message">Bạn đã xem hết hồ sơ.</p>}
          <SwipeControls onSwipe={swipe} onUndo={undo} />
          {ready && pending && <p className="shortcut-hint" role="status">Đang lưu hoặc đồng bộ bộ thẻ…</p>}
          {ready && error && <p className="deck-error" role="alert">{error}</p>}
          {onRetry && (
            <button className="swipe-button deck-retry" type="button" onClick={() => {
              stage.current?.focus();
              onRetry();
            }}>Thử lại</button>
          )}
          {showShortcuts && <p className="shortcut-hint" id={shortcutHintId}>Phím ←, →, ↑ để vuốt thẻ. Backspace để hoàn tác.</p>}
        </section>
        <div className="deck-sidebar">
          <DeckStats score={score} remainingCount={ready ? profiles.length : 0} />
          <UpcomingQueue profiles={upcoming} />
        </div>
      </div>
    </main>
  );
}

/** @type {Readonly<Record<SwipeDirection, SwipeKind>>} */
const swipeKinds = { left: 'PASS', right: 'LIKE', up: 'SKIP' };

export function SwipeDeckSession() {
  const { data, pending, error, swipe, undo, retry } = useSwipeDeck();
  const history = data?.snapshot.history ?? [];
  const score = history.reduce((total, { kind }) => total + (kind === 'LIKE' ? 10 : -5), 0);
  const reviewed = new Set(history.map(({ profileId }) => profileId));
  const remaining = data?.profiles.filter(({ id }) => !reviewed.has(id)) ?? [];
  const current = remaining[0];
  const status = data ? 'ready' : pending ? 'loading' : 'error';

  return (
    <SwipeDeck
      profiles={remaining}
      score={score}
      status={status}
      pending={pending}
      error={error}
      onRetry={retry}
      onSwipe={swipe && current ? (direction) => swipe(current.id, swipeKinds[direction]) : undefined}
      onUndo={undo}
    />
  );
}
