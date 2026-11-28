// @ts-check
import { useId } from 'react';

/** @typedef {{ id: string, name: string, age: number, bio: string, imageUrl: string }} Profile */
/** @typedef {'left' | 'right' | 'up'} SwipeDirection */

/** @param {{ profile: Profile }} props */
function ProfileCard({ profile }) {
  return (
    <article className="profile-card">
      <img src={profile.imageUrl} alt={`Ảnh chân dung ${profile.name}`} />
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

/** @param {{ onSwipe?: (direction: SwipeDirection) => void, onUndo?: () => void, preview: boolean }} props */
function SwipeControls({ onSwipe, onUndo, preview }) {
  const descriptionId = useId();

  return (
    <>
      <div className="swipe-controls" role="group" aria-label="Thao tác với thẻ" aria-describedby={preview ? descriptionId : undefined}>
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
      {preview && <p className="preview-note" id={descriptionId}>Các nút đang tắt trong bản xem trước.</p>}
    </>
  );
}

/**
 * @param {{ profiles: Profile[], score: number, status?: 'ready' | 'loading' | 'error', pending?: boolean,
 * onSwipe?: (direction: SwipeDirection) => void, onUndo?: () => void }} props
 */
export default function SwipeDeck({ profiles, score, status = 'ready', pending = false, onSwipe, onUndo }) {
  const headingId = useId();
  const ready = status === 'ready';
  const [current, ...upcoming] = ready ? profiles : [];

  return (
    <main className="swipe-deck">
      <header className="deck-header">
        <span className="deck-mark" aria-hidden="true">♡</span>
        <h1>Hẹn hò nhưng không yêu</h1>
      </header>

      <div className="deck-layout">
        <section className="deck-panel deck-stage" aria-labelledby={headingId}>
          <h2 id={headingId}>Hồ sơ hiện tại</h2>
          {current && <ProfileCard profile={current} />}
          {status === 'loading' && <p className="deck-message" role="status">Đang tải hồ sơ…</p>}
          {status === 'error' && <p className="deck-message" role="alert">Không tải được hồ sơ.</p>}
          {ready && !current && <p className="deck-message">Bạn đã xem hết hồ sơ.</p>}
          <SwipeControls
            onSwipe={ready && current && !pending ? onSwipe : undefined}
            onUndo={ready && !pending ? onUndo : undefined}
            preview={!onSwipe && !onUndo}
          />
        </section>
        <div className="deck-sidebar">
          <DeckStats score={score} remainingCount={ready ? profiles.length : 0} />
          <UpcomingQueue profiles={upcoming} />
        </div>
      </div>
    </main>
  );
}
