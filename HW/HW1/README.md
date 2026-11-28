# Full-Stack Interactive Card-Swipe Deck

Hẹn hò nhưng không yêu Edition · WEB-LAB04 HW1

The frontend and backend are separate npm projects. Each can start from its own directory. The frontend uses local sample profiles and keeps the swipe history in memory. Focus the deck and press Left, Right, or Up to swipe, or Backspace to undo. The buttons also work, and dragging the card horizontally by more than 50 CSS pixels swipes left or right. The backend currently starts a local Express listener.

## Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+.

Run the frontend from `HW/HW1/frontend`:

```sh
npm ci
npm run dev
```

Run the backend from `HW/HW1/backend` in a separate terminal. On PowerShell:

```powershell
npm ci
Copy-Item .env.example .env # First-time setup only
npm run dev
```

Vite prints its local URL. Express listens on `http://127.0.0.1:3001` by default. The scaffold can start without MongoDB. The persistence task will use `MONGODB_URI` from `.env` to connect to MongoDB Community Server at `mongodb://127.0.0.1:27017/lab04_hw1` and add a repeatable seed command.

Run `npm test` in `frontend` to check the rendered deck, input events, and undo behavior. Run `npm run build` to type-check and build it. Feature tasks and their test contracts are in [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md). Observed AI implementation errors are recorded in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
