# Full-Stack Interactive Card-Swipe Deck

Hẹn hò nhưng không yêu Edition · WEB-LAB04 HW1

React loads profiles and swipe history from an Express API backed by MongoDB Local. Swipe and undo are saved before the card queue and score change. Reloading the page restores the last saved deck.

## 1. Start MongoDB Local

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+. Install MongoDB Community Server on your own machine. The backend connects to that local server at `127.0.0.1:27017`. The seed command creates `lab04_hw1` and adds the sample profiles there.

On Windows, start the `MongoDB` service if it was installed as a service. Run the following in an elevated PowerShell terminal if the service is stopped.

```powershell
Start-Service MongoDB
```

Alternatively, create a writable data directory and start `mongod` in its own terminal. Replace the path below with that directory and use the full path to `mongod` if it is outside your `PATH`.

```sh
mongod --dbpath "path/to/local-data" --bind_ip 127.0.0.1 --port 27017
```

## 2. Seed and start the backend

From the repository root, use PowerShell to install the backend dependencies, create `.env` on first run, seed the database, and start Express.

```powershell
cd HW/HW1/backend
npm ci
Copy-Item .env.example .env # First-time setup only
npm run seed
npm start
```

In Bash or Zsh, use `cp .env.example .env` in place of `Copy-Item`. The template contains the following defaults.

```env
MONGODB_URI=mongodb://127.0.0.1:27017/lab04_hw1
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
```

Seed reruns preserve existing records and insert only missing sample profiles. Open `http://127.0.0.1:3001/api/profiles` to verify that Express returns the seeded profiles.

## 3. Start the frontend

Open a second terminal at the repository root.

```powershell
cd HW/HW1/frontend
npm ci
npm run dev -- --port 5173 --strictPort
```

Open `http://localhost:5173`. The frontend uses `http://127.0.0.1:3001` by default. If you change the Express port, copy `frontend/.env.example` to `frontend/.env`, update `VITE_API_URL`, and restart Vite. If you change the Vite port or hostname, update `FRONTEND_ORIGIN` in `backend/.env` to match the exact origin shown in your browser and restart Express.

Use Tab to focus the deck, then press Left, Right, or Up to swipe, or Backspace to undo. The buttons perform the same actions. A horizontal drag of more than 50 CSS pixels swipes left or right. Like adds 10 points. Dislike and Swipe Up each subtract 5. Try reloading after a swipe to verify the card and score persist. If a save fails, the last confirmed deck remains visible while you retry or reconnect.

## Verification

- In `frontend`, run `npm test` for UI, input, and request-handling tests, then `npm run build` for TypeScript checking and the Vite production build.
- In `backend`, run `npm test` with MongoDB running and the sample data seeded. Each run writes to a separate test deck in `lab04_hw1` and leaves the default deck and existing records intact.

The API contract is in [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md), and observed AI implementation errors are recorded in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
