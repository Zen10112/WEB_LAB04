# HW1 AI Failure Audit

No AI implementation errors were observed during scaffold creation.

For each observed AI error, record the affected task, the evidence and reproduction steps, the cause, the correction, and the verification result. Aim for about three representative incidents if they occur. Keep deliberate TDD failures out of the audit and retain actual evidence without modifying or fabricating logs.

## Deck UI — SSR test configuration

- **Evidence** — After `SwipeDeck.jsx` existed, `npm test` in `frontend` failed all three tests with `ReferenceError: React is not defined`. Vite also printed `The server is being restarted or closed. Request is outdated` during its dependency scan.
- **Cause** — The test harness disabled the project's Vite config and skipped the React plugin that provides the automatic JSX transform. It also started a browser dependency scan that the short-lived SSR tests did not need.
- **Correction** — Load the project's normal Vite config in the tests and disable dependency discovery for the test server.
- **Verification** — The next `npm test` run passed all three tests. `npm run build` passed TypeScript checking and the Vite build.

## Swipe events — Focus assertion diagnostics

- **Evidence** — In the pre-implementation run of `node --test test/SwipeInput.test.mjs`, the focus test reported `[RangeError: Array buffer allocation failed]` after about 62 seconds instead of identifying the missing focus target.
- **Cause** — A failed `assert.equal(document.activeElement, deck)` tried to format full jsdom nodes for the diagnostic.
- **Correction** — Compare node identity as a boolean and provide a short explicit failure message. The expected initial absence of deck focus itself is a TDD failure.
- **Verification** — The final `npm test` run passed all six tests, including deck focus and scoped keyboard input.

## Swipe events — Chrome drag test input

- **Evidence** — A local Chrome smoke test expected `Bảo Trân` after a drag ending outside the card and received `Minh Anh`. The event trace showed `setPointerCapture(1)` succeeded on pointer-down, then the outside pointer-up targeted `.deck-stage` instead of the card.
- **Cause** — The Chrome DevTools smoke test sent `button: 'none'` on `mouseMoved` during a left-button drag. Chrome lost capture during that simulated sequence.
- **Correction** — Keep `button: 'left'` on the move event for the smoke test and set `buttons` to `0` on release. The app's pointer handlers needed no change for this failure.
- **Verification** — Chrome passed the 50 px boundary, outside-card drag, keyboard shortcuts, buttons, exhausted state, undo, and text-field Backspace checks.

## LIFO undo and derived score

No new AI implementation errors were observed. Both new tests failed before implementation because the displayed score was fixed at zero. After deriving the score from history, all eight frontend tests and the build passed.

## MongoDB persistence

No new AI implementation errors were observed. The initial contract test failed because the API module had yet to be implemented. On local `lab04_hw1`, the first seed inserted three profiles and the second inserted zero. The final run passed all three live API tests and the server startup check.

## Frontend integration — Vite browser test configuration

- **Evidence** — Chrome loaded an empty page during the integration smoke test. Its console reported that `react-dom/client.js` did not provide an export named `createRoot`.
- **Cause** — The browser test launcher reused `optimizeDeps.noDiscovery: true` from the SSR test setup, leaving the CommonJS React DOM entry unoptimized for the browser.
- **Correction** — Start the browser test with the normal Vite development configuration.
- **Verification** — Chrome loaded the profiles from Express and completed the live swipe, reload, and undo sequence.

## Frontend integration — Keyboard focus after retry

- **Evidence** — With the initial integration in place, `node --test --test-name-pattern 'failed initial read' test/SwipeInput.test.mjs` failed at `Retry returns keyboard focus to the deck`. The retry succeeded, then removing the focused button left focus outside the deck.
- **Correction** — Move focus to the deck when Retry is activated, before its button is removed during the request.
- **Verification** — All 13 frontend tests passed. The first Chrome run with a raw Enter event did not activate the native button. A subsequent run with Space activated Retry, returned visible keyboard focus to the deck, and allowed a persisted undo with Backspace.
