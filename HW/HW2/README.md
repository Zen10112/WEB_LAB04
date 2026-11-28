# Full-Stack Esports Fair-Play Appeal Tribunal

Himass & TanVuu Case Study · WEB-LAB04 HW2

The frontend and backend are independent npm projects. The scaffold shows the project title and starts a local Express listener. See [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) for the planned dossier routes, form, SLA timer, and persistence API.

## Run the scaffold locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+.

From `HW/HW2/frontend`, run:

```sh
npm ci
npm run dev
```

Open `http://localhost:5174`. Run `npm run build` in the same directory to type-check and build the frontend.

From `HW/HW2/backend`, run:

```sh
npm ci
npm start
```

Express listens on `http://127.0.0.1:3002` by default. The scaffold can start without a database. The persistence task will use MongoDB Community Server at `mongodb://127.0.0.1:27017/lab04_hw2`, read `MONGODB_URI` from the ignored `.env`, and add an idempotent seed command. The backend includes `.env.example` for that task.

Record verified AI-generated failures in [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md).
