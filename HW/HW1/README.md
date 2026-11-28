# Full-Stack Interactive Card-Swipe Deck

Hẹn hò nhưng không yêu Edition · WEB-LAB04 HW1

The frontend and backend are separate npm projects. The frontend still uses local sample profiles and keeps swipe history in memory. Focus the deck and press Left, Right, or Up to swipe, or Backspace to undo. The buttons also work, and dragging the card horizontally by more than 50 CSS pixels swipes left or right. The backend exposes an independent API backed by MongoDB Local.

## Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+.

Run the frontend from `HW/HW1/frontend`:

```sh
npm ci
npm run dev
```

Start MongoDB Community Server locally, then run the backend from `HW/HW1/backend` in a separate terminal. On PowerShell:

```powershell
npm ci
Copy-Item .env.example .env # First-time setup only
npm run seed
npm run dev
```

Vite prints its local URL. Express listens on `http://127.0.0.1:3001` by default and requires `MONGODB_URI=mongodb://127.0.0.1:27017/lab04_hw1` in the ignored `.env`. Set `FRONTEND_ORIGIN` to the exact Vite origin if it differs from `http://localhost:5173`. The seed creates `profiles` and `swipes` and inserts missing sample profiles by stable key. Re-running it preserves existing records.

The API exposes `GET /api/profiles`, `GET /api/swipes`, `POST /api/swipe`, and `POST /api/swipe/:id/undo`. See the request and response contracts in [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md). The API retains undone swipe records and excludes them from the active history returned to callers.

Run `npm test` in `frontend` for the deck and input events, and `npm run build` to type-check and build it. In `backend`, run `npm test` after seeding to exercise the HTTP API on live MongoDB. Each run stores its own test deck in `lab04_hw1` and leaves the default deck and existing records intact. Observed AI implementation errors are recorded in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
