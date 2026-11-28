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
