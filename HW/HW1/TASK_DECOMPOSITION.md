# HW1 Task Decomposition

## Scope and workflow

Build the Full-Stack Interactive Card-Swipe Deck, Hẹn hò nhưng không yêu Edition. The deck supports keyboard and pointer input, last-in-first-out undo, asymmetric scoring, and local persistence. This initial task establishes the scaffold and the proposed contracts below.

For each assigned feature task, confirm its contract and acceptance criteria, write and run a test that fails for the expected reason, implement the smallest change that passes it, then refactor and rerun the relevant checks. Record commands and actual outcomes. End each task by proposing one atomic Conventional Commit. The test cases below are planned.

## Component contracts

| Unit | Inputs | Behavior |
| --- | --- | --- |
| `SwipeDeckSession` | Ordered sample profiles | Stores active swipe history and provides shared swipe and undo handlers. Passes remaining profiles to `SwipeDeck`. |
| `SwipeDeck` | Ordered remaining profiles, score, loading/error/ready status, pending state, and optional intent callbacks | Displays the first card and previews the upcoming queue. The focusable deck maps keyboard shortcuts to the same callbacks as the controls and active card. |
| `ProfileCard` | `profile: Profile`, `onSwipe(direction)` | Renders the active profile and maps horizontal pointer gestures to at most one swipe intent. |
| `SwipeControls` | `canSwipe`, `canUndo`, `onSwipe(direction)`, `onUndo()` | Exposes labeled buttons for the same swipe and undo intents as keyboard and pointer input. |
| `DeckStats` | `score`, `reviewedCount`, `remainingCount` | Displays values derived from profiles and active history. |

## State contract

```ts
type SwipeDirection = 'left' | 'right' | 'up';
type SwipeKind = 'PASS' | 'LIKE' | 'SKIP';

type Profile = {
  id: string;
  name: string;
  age: number;
  bio: string;
  imageUrl: string;
};

type SwipeRecord = {
  id: string;
  profileId: string;
  kind: SwipeKind;
};

type DeckSnapshot = {
  revision: number;
  history: SwipeRecord[]; // Oldest to newest, active swipes only.
};
```

- Store ordered profiles and the latest confirmed snapshot. Track loading, request errors, and any in-flight mutation separately. Keep the current pointer ID and gesture origin transient.
- Derive the remaining queue by filtering reviewed profile IDs out of the ordered profiles. The queue head is the current card. Undo removes the last active swipe and restores that card to the head. The empty-history undo control is disabled.
- `ArrowLeft` sends `PASS`, `ArrowRight` sends `LIKE`, `ArrowUp` sends `SKIP`, and `Backspace` undoes the most recent swipe. Handle these keys only within the deck, skip editable fields and modified keys, and ignore auto-repeat. A primary pointer gesture starting on the current card sends left or right only when its horizontal displacement exceeds 50 CSS pixels. Cancelled, mismatched, and already-completed pointer events do not change the queue. An empty queue still supports undo when history exists.
- Proposed scoring is `LIKE` +10, `PASS` and `SKIP` −5. Reduce the active history from zero on render. Undo changes the score through the same calculation. Reviewed and remaining counts are also derived.

## API contract

Proposed local JSON API for a single deck on MongoDB Community Server. The `/api/profiles` and `/api/swipe` paths follow the supplied persistence example. The history and undo paths are proposed here so the deck can recover after reload.

| Method and path | Request | Success |
| --- | --- | --- |
| `GET /api/profiles` | No body | `200` with `Profile[]` in stable deck order. |
| `GET /api/swipes` | No body | `200` with `DeckSnapshot`. A new deck starts at revision `0` with empty history. |
| `POST /api/swipe` | `{ profileId, kind, expectedRevision, operationId }` | `201` with the new `DeckSnapshot`. The profile must be the next card in deck order. |
| `POST /api/swipe/:id/undo` | `{ expectedRevision, operationId }` | `200` with the new `DeckSnapshot`. `id` must identify the latest active swipe. Keep the stored record for history and mark it undone. |

- `operationId` is a client-generated UUID reused for retries of the same write. Replaying a successful mutation returns `200` with the current snapshot and makes no additional change. Reusing the ID with a different request returns `409`.
- Apply accepted mutations with an atomic revision check against a single deck state so concurrent requests work on a standalone local server. Each accepted new mutation increments the revision. The client reloads history on conflict before accepting another intent.
- Errors use `{ error: { code, message } }`. Return `400` for malformed input, `404` for an unknown profile or swipe ID, `409` for a stale revision or invalid deck transition, and `500` for unexpected storage failure. Keep internal errors and the database URI out of responses.
- Read `MONGODB_URI` from `.env` and validate that it targets `mongodb://127.0.0.1:27017/lab04_hw1` before any database access. Use async/await with Mongoose 8. Seed by stable profile keys with upserts that preserve existing data. Keep automated test fixtures separate through an injected repository or mocked adapter.

## Task sequence and planned acceptance tests

| Task | Scope | First failing test to write |
| --- | --- | --- |
| 1. Deck UI | Implement a profile card, controls, stats, and loading, error, and empty states. | Given profiles, the first card and labeled controls are visible. An exhausted deck displays its empty state. |
| 2. Swipe events | Bind scoped keyboard handlers and pointer gestures to the same swipe intent and advance the queue. | Supported keys and valid gestures each produce one intent. Short, cancelled, and repeated input leaves the queue consistent. |
| 3. LIFO undo | Add the active history stack and restore the latest card via the undo control and `Backspace`. | After two swipes, undo restores cards in reverse swipe order. Empty history is a no-op. |
| 4. Derived score | Calculate asymmetric score and counts from profiles and active history. | A like and a pass give `5`. Undoing the pass restores `10` and updates both counts. |
| 5a. Profiles and seed | Add the local Mongoose connection, profile schema, repeatable seed, and profile endpoint. | The API returns stable ordering. Running seed twice through the test adapter adds no duplicate profiles and preserves existing records. |
| 5b. Swipe persistence | Add history, swipe, and undo endpoints with validation, revision checks, and retry handling. | After swipe then undo, refreshed history matches the active deck. Stale writes and duplicate retries leave the deck consistent. |
| 6. Integration | Load profiles and history, post mutations, and reconcile the UI with server snapshots. | A reload restores prior actions. A failed write leaves the last confirmed deck and score intact. |
| 7. Regression testing | Cover the browser flow with keyboard and pointer, including focus, reload, and request failures. Add a focused regression only where coverage is missing. | Run the chosen uncovered path against its contract and capture any actual failure before fixing it. |
| 8. AI audit | Consolidate observed evidence in `AI_FAILURE_AUDIT.md` and verify the documented reproduction and fix. | Check that each entry has real evidence and that deliberate TDD failures are excluded. Record an empty audit honestly if needed. |
