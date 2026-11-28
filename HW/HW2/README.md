# Full-Stack Esports Fair-Play Appeal Tribunal

Himass & TanVuu Case Study · WEB-LAB04 HW2

The frontend loads illustrative dossiers for Himass and TanVuu from Express and uses the API deadline and server clock for each appeal countdown. Successful submissions return a receipt after MongoDB saves the appeal. See [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) for the contracts.

## 1. Start MongoDB Community Server

Install Node.js 20.19+ on the 20.x line, or Node.js 22.12+, and MongoDB Community Server. Use your own local MongoDB instance at `127.0.0.1:27017`. The seed creates `lab04_hw2` with two illustrative dossiers.

On Windows, if MongoDB is installed as a service and is stopped, run this in an elevated PowerShell terminal:

```powershell
Start-Service MongoDB
```

Alternatively, create a writable directory for the database files and start MongoDB in a separate terminal. Replace the sample path with that directory.

```sh
mongod --dbpath "path/to/local-data" --bind_ip 127.0.0.1 --port 27017
```

## 2. Seed and start the backend

From the repository root, run in PowerShell:

```powershell
cd HW/HW2/backend
npm ci
Copy-Item .env.example .env # First-time setup only
npm run seed
npm start
```

Use `cp .env.example .env` in Bash or Zsh. The sample sets `MONGODB_URI=mongodb://127.0.0.1:27017/lab04_hw2` and `FRONTEND_ORIGIN=http://localhost:5174`. Set the origin to the exact frontend address if it differs. The seed adds missing illustrative dossiers and retains existing records.

Express listens on `http://127.0.0.1:3002` by default. Open `/api/dossiers` to see the seed data, or `/api/dossiers/himass` to see the case deadline and the current server clock. The API accepts appeals at `POST /api/dossiers/:playerID/appeals`.

## 3. Start the frontend

Open a second terminal at the repository root:

```sh
cd HW/HW2/frontend
npm ci
npm run dev
```

Open `http://localhost:5174` and choose a dossier. **Open appeal form** starts a draft for that dossier. The JSON inspector updates when the current draft is valid. **Submit appeal** sends the draft and displays its receipt. If a response is lost, **Retry submission** reuses the original operation ID. The sample deadlines are fixed UTC dates stored in the seeded dossiers.

The frontend uses `http://127.0.0.1:3002` by default. If the backend port differs, copy `frontend/.env.example` to `frontend/.env`, set `VITE_API_URL`, and restart Vite. If the frontend origin changes, update `FRONTEND_ORIGIN` in `backend/.env` and restart Express.

## Verification

- In `frontend`, run `npm test` and `npm run build` for route, form, timer, request lifecycle, and build checks.
- In `backend`, run `npm test` after seeding. The tests read the seeded dossiers, control the API clock for deadline boundaries, and write test appeals to `appeals_api_test` in `lab04_hw2`.

Record verified AI-generated failures in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
