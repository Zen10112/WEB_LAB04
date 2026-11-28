# HW2 AI Failure Audit

Final engineering review of the Fair-Play Appeal Tribunal at baseline commit `4e20397`, including the Retry focus fix from this review. The review found five verified AI-generated failures. Three representative incidents are detailed below and two are summarized. Evidence comes from source, diffs, and captured test or browser output. Pre-fix snippets for changes corrected before commit come from their implementation logs. Deliberate TDD failures for missing behavior are excluded.

## Detailed incidents

### HW2-01 — A 404 URL marked a dossier as current

- **Failure ID** — `HW2-01`
- **Title** — A 404 URL marked a dossier as current
- **Category** — React Router navigation and accessibility
- **Affected File** — [frontend/src/FairPlayAppealPortal.jsx](frontend/src/FairPlayAppealPortal.jsx)
- **Original AI Output** — ``<NavLink key={playerID} to={`/dossier/${playerID}`} caseSensitive>{displayName}</NavLink>``
- **Evidence** — After routing was implemented, `node --test --test-name-pattern 'unknown player IDs'` failed with `/dossier/himass/other should have no current nav link`.
- **Root Cause** — `NavLink` matched the dossier path prefix and set `aria-current="page"` while the router rendered the 404 fallback.
- **Engineering Fix** — Add `end` for exact dossier matching in `820667b`. When the nested appeal route was added, prefix matching was limited to the recognized appeal route so its parent link remains current.
- **Verification Result** — The final route suite passes for valid dossiers and unknown paths, including `/dossier/himass/other`. The routing-stage Chrome run also confirmed the 404 had no current link and that Enter activated its recovery link.
- **Status** — Detected & Fixed

### HW2-04 — A malformed route parameter returned HTTP 500

- **Failure ID** — `HW2-04`
- **Title** — A malformed route parameter returned HTTP 500
- **Category** — Express request validation and error handling
- **Affected File** — [backend/src/app.js](backend/src/app.js)
- **Original AI Output** — The original error middleware ended with `return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } });` after handling domain and JSON parser errors.
- **Evidence** — The regression for `GET /api/dossiers/%ZZ` logged `URIError: Failed to decode param '%ZZ'` with `status: 400`. The HTTP assertion failed with `500 !== 400`.
- **Root Cause** — Express raised the decoding error before the dossier handler ran. The custom middleware fell through to the generic 500 response.
- **Engineering Fix** — Map a route-decoding `URIError` with status 400 to the JSON `INVALID_PATH` response in `1ceba69`.
- **Verification Result** — The malformed URL assertion passes in the five-test HTTP suite against local MongoDB. The same suite passes for valid reads and unknown player IDs.
- **Status** — Detected & Fixed

### HW2-05 — Retrying a dossier read dropped keyboard focus

- **Failure ID** — `HW2-05`
- **Title** — Retrying a dossier read dropped keyboard focus
- **Category** — Application accessibility and asynchronous navigation
- **Affected File** — [frontend/src/FairPlayAppealPortal.jsx](frontend/src/FairPlayAppealPortal.jsx)
- **Original AI Output** — `<button type="button" className="portal-action" onClick={retry}>Retry</button>` in `4e20397`.
- **Evidence** — During this review, `node --test --test-name-pattern 'failed dossier read' test/DossierRoutes.test.mjs` loaded the dossier after retry but failed `Retry should keep focus in the dossier content`.
- **Root Cause** — Starting the retry cleared the old error and removed the focused button. The persistent main landmark had no focus target.
- **Engineering Fix** — Make the shared `main` programmatically focusable with `tabIndex={-1}` and move focus there before retrying. Keep the focus assertion in the dossier-read regression test.
- **Verification Result** — All 22 frontend tests and the TypeScript/Vite build passed. Chrome recovered from an injected HTTP 503 when Retry was activated with Enter and kept focus on the main landmark after the dossier loaded.
- **Status** — Detected & Fixed

## Additional verified incidents

| Failure ID | Evidence and effect | Fix and verification | Status |
| --- | --- | --- | --- |
| `HW2-02` | The initial `querySelector(...).focus()` call in `AppealForm.jsx` failed the build with `TS2339: Property 'focus' does not exist on type 'Element'`. | Use `form.elements.namedItem()` and an `HTMLElement` check before calling `focus()`. Landed in `be6d714`. The final build passes and Chrome focuses the first invalid field. | Detected & Fixed |
| `HW2-03` | The appeal section had `aria-labelledby="appeal-title"`, but the heading had no matching ID. The direct appeal route regression failed on the missing association. | Add `id="appeal-title"` to the heading and retain the route assertion. Landed in `be6d714`. The assertion and final frontend suite pass. | Detected & Fixed |

## Slide 29 review

| Category | Status | Evidence |
| --- | --- | --- |
| React Router v5 syntax | Not Detected | [FairPlayAppealPortal.jsx](frontend/src/FairPlayAppealPortal.jsx) uses React Router v7 `Routes`, `Route element`, `NavLink`, `Outlet`, and `useParams`. Tests exercise direct dossier routes, nested appeal routes, and 404s. |
| `useEffect` validation loops | Not Detected | [FormContext.tsx](frontend/src/form/FormContext.tsx) calculates `errors` from current values and derives `isValid` during render. Effects manage requests and timers. |
| Hardcoded database secrets | Not Detected | [database.js](backend/src/database.js) reads `MONGODB_URI` from the environment and validates it against a credential-free loopback URI for `lab04_hw2`. Git ignores the actual `.env` files and tracks the templates. The reviewed HW2 history contained no credential-bearing MongoDB URI. |
| Removed Mongoose callbacks | Not Detected | The [connection](backend/src/database.js), [seed](backend/seed.js), and [API](backend/src/app.js) use promises and `await`. Read-only dossier and appeal lookups use `.lean()`. The live API tests pass on Mongoose 8 with local MongoDB. |
| Unlabelled icon buttons | Not Detected | The reviewed actions have visible names, including Submit appeal and Retry. Chrome inspected the form controls and Submit appeal in the accessibility tree and exercised named buttons by keyboard. |

## Additional engineering checks

| Area | Status | Evidence |
| --- | --- | --- |
| Context validation | Not Detected | Automated tests cover required fields, trimmed length, evidence URL validation, the New evidence dependency, and normalized JSON. Chrome confirmed an invalid submit focuses the first field and sends no request. |
| Route races and request cleanup | Not Detected | [useDossier.ts](frontend/src/useDossier.ts) aborts on route change or unmount and checks `signal.aborted` before applying read results, errors, or final loading state. Tests exercise a late response and unmount. In Chrome under Slow 3G, `Network.loadingFailed` reported `net::ERR_ABORTED` for the TanVuu GET after switching to Himass. Himass remained active. |
| SLA timer drift and cleanup | Not Detected | [useAppealSlaTimer.js](frontend/src/useAppealSlaTimer.js) recalculates from the absolute deadline and sampled clock. Tests cover a delayed callback, deadline and offset changes, exact expiration, and interval and listener cleanup. In Chrome, trusted hidden and visible events from switching between two actual tabs triggered a live server clock refresh and corrected the countdown. |
| Submission and persistence | Not Detected | The frontend locks concurrent writes and reuses the original operation ID after an uncertain response. The live API tests cover concurrent idempotency and expired submissions. Chrome confirmed one saved receipt after two submit intents and verified the record in a separate local test collection. |
| Full accessibility conformance | Not Verified | Browser verification covered Tab and Enter, focus recovery, accessible form names and error associations, and layout at 320 CSS pixels. A full WCAG or screen-reader audit was outside the verification performed. |

## Final verification

- Frontend `npm test` passed 22 tests. `npm run build` passed TypeScript checking and the Vite build.
- Backend `npm test` passed five HTTP integration tests against `lab04_hw2`. API test appeals used `appeals_api_test`.
- Chrome with Express and local MongoDB verified direct routes, reload, 404, Slow 3G cancellation, real tab visibility transitions, Retry via Enter, field labels and error links, idempotent submission, expiration, and the mobile layout. The test used `appeals_browser_test` and controlled the API clock to exercise the deadline boundary.
