# HW2 Task Decomposition

## Scope and workflow

Build the Full-Stack Esports Fair-Play Appeal Tribunal for the Himass & TanVuu Case Study. Use React, Vite, and React Router v7 for the frontend and Express, Mongoose 8, and MongoDB Local for the backend. The scaffold establishes the following proposed contracts. Confirm the relevant proposal against the assignment before starting each feature task.

Follow **Contract → Fail Test → Implement → Refactor**. Define observable inputs, outputs, and acceptance criteria, then run a test that fails for the expected reason. Implement the assigned behavior, refactor while keeping the checks green, and record actual results. Propose one atomic Conventional Commit for each completed task.

## Route contracts

| Path | Screen and behavior |
| --- | --- |
| `/` | `DossierIndex` links to the Himass and TanVuu dossiers. |
| `/dossier/:playerID` | `DossierView` reads `playerID` with `useParams` and resolves the sample dossier. Canonical player IDs are `himass` and `tanvuu`. |
| `/dossier/:playerID/appeal` | Planned for the appeal form task. `DossierLayout` will provide the active dossier context to the nested form. |
| `*` | `NotFound` offers a link back to the dossier index. An unknown `playerID` displays the same fallback. |

Use React Router v7 route definitions and `Outlet` for the nested view. Direct links and browser Back/Forward should resolve the same dossier. When `playerID` changes, clear the previous draft and cancel stale reads so one player's response or input cannot appear in the other dossier.

## Component contracts

| Unit | Inputs | Behavior |
| --- | --- | --- |
| `FairPlayAppealPortal` | React Router v7 context | Renders the shared navigation with `NavLink` and the matched screen through `Outlet`. |
| `DossierIndex` | Dossier summaries and read status | Renders navigation and a loading, error, or empty state as appropriate. |
| `DossierLayout` | Validated `playerID` from the route | Planned provider of the active `dossier`, server time reference, and player-scoped draft context. |
| `DossierView` | `playerID` route parameter and local case study fixtures | Displays the matched illustrative dossier with semantic metadata or the 404 fallback. SLA and appeal links belong to later tasks. |
| `AppealForm` | Active dossier context, draft, and a submission intent | Renders labeled fields and synchronous validation messages. Disables submission when invalid, expired, or pending. Displays a receipt once persistence is confirmed. |
| `validateAppeal(draft)` | `AppealDraft` | Returns field errors synchronously as a pure function. Derive errors from current values without a validation effect. |
| `useAppealSlaTimer()` | UTC deadline and a server time sample with its client receipt timestamp | Derives remaining milliseconds from the absolute deadline and clock delta. Recomputes on ticks, refreshes the time sample when the tab becomes visible, and cleans up timers, listeners, and pending refreshes. |

## Form and SLA contracts

The grounds, limits, and receipt shape below are proposals for the implementation task.

```ts
type PlayerID = 'himass' | 'tanvuu';
type AppealGround = 'PROCEDURAL_ERROR' | 'DISPROPORTIONATE_SANCTION' | 'NEW_EVIDENCE';

type DossierSummary = { playerID: PlayerID; displayName: string };
type Dossier = DossierSummary & { summary: string; deadlineAt: string };

type AppealDraft = {
  ground: AppealGround | '';
  statement: string;
  evidenceUrl: string;
};
type FieldErrors = Partial<Record<keyof AppealDraft, string>>;

type AppealSubmission = {
  ground: AppealGround;
  statement: string;
  evidenceUrl?: string;
  operationId: string;
};
type AppealReceipt = { id: string; playerID: PlayerID; submittedAt: string };
```

- Keep draft values, touched fields, and submission status in the form context for the current player. Validate on change and again on submit. Display a field's error when it has been touched or submission was attempted. Connect errors to their controls with `aria-describedby` and surface invalid fields with `aria-invalid`.
- Require a known ground and a trimmed statement of 20–2,000 characters. The optional evidence URL must be an absolute HTTP or HTTPS URL when present. Send normalized fields and omit a blank evidence URL. Validate the same rules on the backend and take `playerID` from the route.
- Encode `deadlineAt`, `serverNow`, and `submittedAt` as UTC ISO 8601 timestamps. Estimate current server time as `Date.now() + (serverNowMs - clientReceivedAtMs)`. Recalculate the difference from the deadline on each tick and clamp it at zero. Use the backend clock to enforce expiration at or after the deadline.

## API contracts

| Method and path | Input | Success |
| --- | --- | --- |
| `GET /api/dossiers` | No body | `200` with `{ dossiers: DossierSummary[] }` in stable order. |
| `GET /api/dossiers/:playerID` | Known `playerID` | `200` with `{ dossier: Dossier, serverNow: string }`. Reload this endpoint to refresh the SLA clock reference. |
| `POST /api/dossiers/:playerID/appeals` | Known `playerID` and JSON `AppealSubmission` | `201` with the persisted `AppealReceipt`. An exact retry with the same `operationId` returns `200` with the existing receipt. |

- Errors use `{ error: { code, message, fields? } }`. Return `400` for invalid input, `404` for an unknown player, `409` for an expired deadline or an operation ID reused with a different payload, and `500` for an unexpected server error. Check existing accepted operations before enforcing the deadline on retries.
- Persist dossiers keyed by `playerID` and appeals keyed uniquely by `{ playerID, operationId }`. Read `MONGODB_URI` from `.env` and verify it targets `mongodb://127.0.0.1:27017/lab04_hw2` before connecting. Seed missing case fixtures with stable keys and upserts that preserve existing records. Restrict CORS to the configured frontend origin.

## Task sequence and acceptance tests

| Task | Scope | First acceptance check |
| --- | --- | --- |
| 1. Dossier routing | Implement the shared layout, index, dynamic dossier route, and fallback. | A direct link to either dossier renders that player, Back/Forward resolves the correct dossier, and an unknown ID shows the fallback. |
| 2. Appeal form | Add the context, controlled fields, and submission states. | A draft belongs to its route context. Moving to the other dossier starts with a clean draft. |
| 3. Synchronous validation | Implement pure field rules, accessible errors, and submit gating. | Invalid input produces immediate field errors. Corrected input clears them and enables submission within the SLA. |
| 4. SLA countdown | Implement `useAppealSlaTimer()` with an absolute deadline and visibility resync. | A delayed tick or hidden tab does not introduce drift. At zero, submission is disabled and unmount clears timers and listeners. |
| 5a. Dossier persistence | Connect only to `lab04_hw2`, define the dossier model, and add the seed and read endpoints. | Seeding twice preserves existing records without duplicates. The detail endpoint returns the dossier, deadline, and current server time. |
| 5b. Appeal persistence | Validate, enforce the deadline, and persist submissions with operation IDs. | Valid submission creates one receipt. Concurrent retries return the same receipt. Invalid and expired submissions create no appeal. |
| 6. Integration | Wire the routes, form, and timer to the API with abortable reads and confirmed submission state. | A late response cannot replace the current dossier. A failed save retains the draft for retry, and a confirmed save displays its receipt. |
| 7. Testing | Run the relevant component, timer, API, and browser checks for direct links, keyboard access, responsive layout, and persistence. | Reproduce any uncovered failure before fixing it. Record which checks actually ran and their results. |
| 8. AI audit | Verify observed incidents against source diffs, tests, or logs and complete `AI_FAILURE_AUDIT.md`. | Every entry has supporting evidence and a verified status. Deliberate TDD failures stay out of the audit. |
