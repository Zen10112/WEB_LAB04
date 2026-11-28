# Full-Stack Esports Fair-Play Appeal Tribunal

Himass & TanVuu Case Study · WEB-LAB04 HW2

The frontend and backend are independent npm projects. The frontend uses illustrative dossiers and validates practice drafts locally. The backend exposes a separate persistence API for dossier reads, SLA clock synchronization, and appeal submissions. See [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) for the contracts.

## Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+.

From `HW/HW2/frontend`, run:

```sh
npm ci
npm run dev
```

Open `http://localhost:5174`. Choose either dossier and select **Open appeal form**. The preview follows the current valid draft, and **Validate draft** checks it locally while the appeal window is open. Run `npm test` in the frontend directory for route, form, and SLA timer tests and `npm run build` to type-check and build it.

Start MongoDB Community Server on `127.0.0.1:27017`. From `HW/HW2/backend`, run in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env # First-time setup only
npm run seed
npm start
```

Use `cp .env.example .env` in Bash or Zsh. The sample sets `MONGODB_URI=mongodb://127.0.0.1:27017/lab04_hw2` and `FRONTEND_ORIGIN=http://localhost:5174`. Set the origin to the exact frontend address if it differs. The seed adds missing illustrative dossiers and retains existing records.

Express listens on `http://127.0.0.1:3002` by default. Open `/api/dossiers` to see the seed data, or `/api/dossiers/himass` to see the case deadline and the current server clock. The API accepts appeals at `POST /api/dossiers/:playerID/appeals`.

Run `npm test` in the backend after seeding to exercise the HTTP API against local MongoDB. The tests read the seeded dossiers, control the API clock for deadline boundaries, and write test appeals to `appeals_api_test` in `lab04_hw2`.

Record verified AI-generated failures in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
