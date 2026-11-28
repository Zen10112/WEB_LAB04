# HW1 AI Failure Audit

No AI implementation errors were observed during scaffold creation.

For each observed AI error, record the affected task, the evidence and reproduction steps, the cause, the correction, and the verification result. Aim for about three representative incidents if they occur. Keep deliberate TDD failures out of the audit and retain actual evidence without modifying or fabricating logs.

## Deck UI — SSR test configuration

- **Evidence** — After `SwipeDeck.jsx` existed, `npm test` in `frontend` failed all three tests with `ReferenceError: React is not defined`. Vite also printed `The server is being restarted or closed. Request is outdated` during its dependency scan.
- **Cause** — The test harness disabled the project's Vite config and skipped the React plugin that provides the automatic JSX transform. It also started a browser dependency scan that the short-lived SSR tests did not need.
- **Correction** — Load the project's normal Vite config in the tests and disable dependency discovery for the test server.
- **Verification** — The next `npm test` run passed all three tests. `npm run build` passed TypeScript checking and the Vite build.
