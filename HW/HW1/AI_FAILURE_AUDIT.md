# HW1 AI Failure Audit

Final engineering review of the Swipe Deck at commit `7d94082`. The audit compares HW1 with the five failure categories from Lab 4 Slide 29 and reviews input handling, history, scoring, asynchronous requests, and persistence. Evidence comes from the committed code, the implementation diffs, and test or browser output captured during the work. The pre-fix snippets below come from the original implementation steps. Some fixes landed in the same commit as their feature.

Five AI-generated failures were verified and fixed. One affected the application and four affected test code or test setup. Deliberate TDD failures for missing behavior are excluded.

## Detailed incidents

### HW1-01 — Vite SSR tests lost the React JSX transform

- **Failure ID** — `HW1-01`
- **Title** — Vite SSR tests lost the React JSX transform
- **Category** — Test infrastructure / Vite and React
- **Affected File** — [frontend/test/SwipeDeck.test.mjs](frontend/test/SwipeDeck.test.mjs)
- **Original AI Output** — `vite = await createServer({ configFile: false, server: { middlewareMode: true, ws: false } });`
- **Evidence** — After `SwipeDeck.jsx` existed, `npm test` failed all three render tests with `ReferenceError: React is not defined`. Vite also reported `The server is being restarted or closed. Request is outdated` during dependency scanning.
- **Root Cause** — `configFile: false` skipped the project's React plugin and its automatic JSX transform. The SSR harness also started a browser dependency scan that could outlive the tests.
- **Engineering Fix** — Load the project Vite config and use `optimizeDeps: { noDiscovery: true }` for the SSR test server. The corrected harness is in `773531f`.
- **Verification Result** — All three render tests passed after the correction. The final review passed all 13 frontend tests, TypeScript checking, and the Vite build.
- **Status** — Detected & Fixed

### HW1-02 — Chrome drag automation released pointer capture early

- **Failure ID** — `HW1-02`
- **Title** — Chrome drag automation released pointer capture early
- **Category** — Browser test automation / Pointer events
- **Affected File** — Transient Chrome DevTools drag script used to verify [frontend/src/SwipeDeck.jsx](frontend/src/SwipeDeck.jsx)
- **Original AI Output** — `button: type === 'mouseMoved' ? 'none' : 'left',` in the options passed to `Input.dispatchMouseEvent`.
- **Evidence** — An outside-card drag left `Minh Anh` visible where the smoke test expected `Bảo Trân`. The event trace showed `setPointerCapture(1)` succeeded on pointer-down and the outside pointer-up later targeted `.deck-stage`.
- **Root Cause** — The driver reported `button: 'none'` during the simulated left-button drag. Chrome lost capture during that event sequence.
- **Engineering Fix** — Send `button: 'left'` on the move and set `buttons` to `0` on release.
- **Verification Result** — With the corrected driver, Chrome passed the 50 px boundary and drag-outside-the-card checks. The final review reran an outside-card drag against Express and MongoDB and confirmed that the resulting swipe was stored.
- **Status** — Detected & Fixed

### HW1-03 — Keyboard focus was lost after Retry

- **Failure ID** — `HW1-03`
- **Title** — Keyboard focus was lost after Retry
- **Category** — Application accessibility / Keyboard focus
- **Affected File** — [frontend/src/SwipeDeck.jsx](frontend/src/SwipeDeck.jsx)
- **Original AI Output** — `<button className="swipe-button deck-retry" type="button" onClick={onRetry}>Thử lại</button>`
- **Evidence** — With API retry already functional, `node --test --test-name-pattern 'failed initial read' test/SwipeInput.test.mjs` failed at `Retry returns keyboard focus to the deck`. Profiles loaded after Retry, but the deck did not have focus.
- **Root Cause** — Starting the request cleared the error and removed the focused Retry button. Focus was never transferred to the deck.
- **Engineering Fix** — Focus the deck section before starting the retry. Commit `7d94082` includes the fix and the [focus regression test](frontend/test/SwipeInput.test.mjs).
- **Verification Result** — The regression passes in the 13-test frontend suite. During integration, Chrome activated Retry with Space. In the final review, Chrome activated it with Enter, showed visible focus on the deck, and accepted Backspace to undo the persisted swipe.
- **Status** — Detected & Fixed

## Additional verified incidents

| Failure ID | Issue and evidence | Fix and verification | Status |
| --- | --- | --- | --- |
| `HW1-04` | `assert.equal(document.activeElement, deck)` tried to format jsdom nodes when focus differed. The test reported `RangeError: Array buffer allocation failed` instead of a useful diagnostic. The diagnostic failure is the incident. | Compare node identity as a boolean and supply a short failure message. The corrected assertion in `2b0164e` passes in the final frontend suite. | Detected & Fixed |
| `HW1-05` | The live browser launcher reused `optimizeDeps: { noDiscovery: true }` from the SSR setup. Chrome loaded a blank page and reported that `react-dom/client.js` did not provide an export named `createRoot`. | Run Chrome against Vite's normal development configuration so it can optimize React DOM. The final live browser run completed the persisted swipe and undo flow. | Detected & Fixed |

## Slide 29 review

| Category | Status | Evidence |
| --- | --- | --- |
| React Router v5 syntax | Not Applicable | HW1 mounts a single screen directly in [main.tsx](frontend/src/main.tsx). React and React DOM are the runtime dependencies in [frontend/package.json](frontend/package.json). |
| `useEffect` validation loops | Not Detected | The effect in [useSwipeDeck.ts](frontend/src/useSwipeDeck.ts) starts the initial read and aborts in-flight work on cleanup. It depends on a stable callback. Payload validation runs in [app.js](backend/src/app.js). Unmount and late-response tests pass. |
| Hardcoded database secrets | Not Detected | [database.js](backend/src/database.js) reads `MONGODB_URI` from the environment and checks it against a credential-free loopback URI for `lab04_hw1`. Git tracks the sample config and ignores both local `.env` paths. The reviewed HW1 history showed no credential-bearing MongoDB URI. |
| Removed Mongoose callbacks | Not Detected | The [connection](backend/src/database.js), [seed](backend/seed.js), and [routes](backend/src/app.js) await Mongoose calls through the promise API. The three live backend tests pass on local MongoDB. |
| Unlabelled icon buttons | Not Detected | The swipe and Undo buttons have visible text and their icons are hidden from the accessibility tree. Chrome exposed the names `Dislike`, `Swipe Up`, `Like`, and `Undo`. Retry has visible text and was exercised by keyboard. |

## Swipe Deck review

| Area | Status | Evidence |
| --- | --- | --- |
| Swipe events | Not Detected | Frontend tests cover key mapping, editable targets, auto-repeat, pointer identity, the 50 px threshold, and cancellation. Chrome exercised keyboard and mouse swipe paths, including release outside the card. |
| LIFO undo and derived score | Not Detected | Score is reduced from the confirmed history. Tests cover mixed actions, negative totals, a replacement swipe, empty history, and exhaustion. Chrome verified three consecutive undos with the expected card and score after each one. |
| Async races and failed writes | Not Detected | Tests cover overlapping input, retry with the original operation ID, stale revisions, and late responses after unmount. In Chrome, an offline swipe left the last confirmed card and score visible. Retry committed one swipe after reconnecting. |
| MongoDB persistence | Not Detected | Live tests cover validation, concurrent retries, and stored undo records. Chrome restored the saved history and score after reload. The run checked persisted MongoDB records in a separate test deck and confirmed the default deck was unchanged. |
| Physical touch devices and full accessibility conformance | Not Verified | The browser review used headless Chrome, mouse and keyboard input, the accessibility tree, and emulated viewports. |

## Final verification

- Frontend `npm test` passed 13 tests. Frontend `npm run build` passed TypeScript checking and the Vite build.
- Backend `npm test` passed 3 HTTP integration tests against local `lab04_hw1`, including payload validation, conflict handling, and persistence.
- Chrome with the local Express API verified reload, keyboard and pointer swipe, LIFO undo, score, offline retry, Tab focus, accessible button names, and layout at 1200, 390, and 320 CSS pixels.
