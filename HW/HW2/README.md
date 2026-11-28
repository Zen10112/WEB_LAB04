# Full-Stack Esports Fair-Play Appeal Tribunal

Himass & TanVuu Case Study · WEB-LAB04 HW2

The frontend and backend are independent npm projects. The frontend opens illustrative dossiers for Himass and TanVuu. The backend currently starts a local Express listener. See [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) for the route contracts and planned form, SLA timer, and persistence API.

## Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+.

From `HW/HW2/frontend`, run:

```sh
npm ci
npm run dev
```

Open `http://localhost:5174`. The dossier URLs are `/dossier/himass` and `/dossier/tanvuu`. Run `npm test` in the frontend directory for route tests and `npm run build` to type-check and build it.

From `HW/HW2/backend`, run:

```sh
npm ci
npm start
```

Express listens on `http://127.0.0.1:3002` by default. The scaffold can start without a database. The persistence task will use MongoDB Community Server at `mongodb://127.0.0.1:27017/lab04_hw2`, read `MONGODB_URI` from the ignored `.env`, and add an idempotent seed command. The backend includes `.env.example` for that task.

Record verified AI-generated failures in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
