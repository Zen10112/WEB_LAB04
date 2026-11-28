# HW2 AI Failure Audit

No verified AI-generated failures were identified during scaffold creation.

Record observed AI-generated failures with the affected file, original output, supporting evidence, root cause, engineering fix, and verification status. Preserve genuine test output or diffs. Deliberate TDD failures for missing behavior are excluded.

## HW2-01 — A 404 path marked a dossier as current

- **Category** — React Router navigation and accessibility
- **Affected file** — [FairPlayAppealPortal.jsx](frontend/src/FairPlayAppealPortal.jsx)
- **Original AI output** — ``<NavLink key={playerID} to={`/dossier/${playerID}`} caseSensitive>{displayName}</NavLink>``
- **Evidence** — `node --test --test-name-pattern 'unknown player IDs'` failed after routing had been implemented. Its assertion reported `/dossier/himass/other should have no current nav link`.
- **Root cause** — The dossier `NavLink` matched path prefixes, so it supplied `aria-current="page"` even when the router rendered the 404 fallback.
- **Engineering fix** — Add `end` to the dossier `NavLink` so the active state matches the dossier route itself.
- **Verification** — All four route tests and the TypeScript/Vite build passed after the fix. Chrome confirmed the 404 had no current navigation link and the recovery link worked with Enter.
- **Status** — Detected & Fixed

## HW2-02 — Invalid-field focus failed type checking

- **Category** — TypeScript and form accessibility
- **Affected file** — [AppealForm.jsx](frontend/src/form/AppealForm.jsx)
- **Original AI output** — ``event.currentTarget.querySelector(`[name="${firstError}"]`)?.focus();``
- **Evidence** — After the form was implemented, `npm run build` failed with `TS2339: Property 'focus' does not exist on type 'Element'.`
- **Engineering fix** — Find the first invalid control through `form.elements.namedItem()` and narrow it to `HTMLElement` before focusing it.
- **Verification** — All nine tests and the TypeScript/Vite build passed.
- **Status** — Detected & Fixed

## HW2-03 — The appeal section referenced a missing heading ID

- **Category** — Accessible name relationships
- **Affected file** — [AppealForm.jsx](frontend/src/form/AppealForm.jsx)
- **Original AI output** — The section used `aria-labelledby="appeal-title"`, while its heading was `<h1>{dossier.displayName} appeal</h1>`.
- **Evidence** — `node --test --test-name-pattern 'direct appeal route' test/DossierRoutes.test.mjs` failed because the rendered heading had no matching `id`.
- **Engineering fix** — Give the heading `id="appeal-title"` and keep the association covered by the route test.
- **Verification** — The route regression and full nine-test suite passed.
- **Status** — Detected & Fixed

## Appeal SLA countdown

No new verified AI-generated failures were identified. The pre-implementation tests failed because the hook had yet to be added. All 14 frontend tests and the TypeScript/Vite build passed after implementation. A live Chrome check switched between two actual tabs and observed trusted `visibilitychange` events. The test controlled the clock and held interval callbacks to verify that returning to the appeal tab refreshed the countdown immediately and disabled submission after expiration.

## HW2-04 — An invalid route encoding returned HTTP 500

- **Category** — Express request validation
- **Affected file** — [backend/src/app.js](backend/src/app.js)
- **Evidence** — After implementation, `npm test -- --test-name-pattern 'reads the seeded dossiers'` requested `/api/dossiers/%ZZ`. Express logged `URIError: Failed to decode param '%ZZ'` with `status: 400`, but the API sent `500` and the test reported `500 !== 400`.
- **Root cause** — The custom error handler recognized domain and JSON parser errors, then treated Express's route-decoding error as an unexpected failure.
- **Engineering fix** — Map Express's `URIError` with status 400 to a JSON `INVALID_PATH` response.
- **Verification** — All five HTTP tests passed on local MongoDB, including the malformed URL regression.
- **Status** — Detected & Fixed

## Frontend API integration

No new verified AI-generated failures were identified. The initial contract tests failed as expected while the frontend still used sample data. The final run passed 22 frontend tests, five live API tests, and the TypeScript/Vite build.

Chrome DevTools Protocol used Chromium's Slow 3G settings. When navigation switched from TanVuu back to Himass, `Network.loadingFailed` marked the in-flight TanVuu GET as canceled with `net::ERR_ABORTED`. The live browser run also verified direct routes, 404, keyboard focus and activation, named and described form controls, invalid submission blocking, one stored receipt for two submit intents, server-driven expiration, reload, and the 320 px layout. The test used a controlled server clock for the SLA boundary and stored its appeal in `appeals_browser_test` within `lab04_hw2`.
