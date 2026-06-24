# Render Deployment Guide

This backend is an Express + TypeScript app that connects to PostgreSQL and validates auth tokens against the frontend domain.

## What Render needs

- Node 22
- A PostgreSQL database
- These environment variables:
  - `DATABASE_URL`
  - `FRONTEND_URL`
  - `PORT` is optional on Render
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`

At least one of the AI provider keys must be present. Set both if you want Gemini fallback to DeepSeek.

## Recommended Render setup

Create a new **Web Service** on Render from this backend repository.

Important: set the service **Root Directory** to `ai-resume-backend`.
That makes Render run the build from the backend folder, so Sequelize can find `migrations/`.

### Build command

```bash
npm ci && npm run build
```

### Start command

```bash
npm start
```

### Node version

Use Node `22.x`.

If you configure the service through the Render dashboard, set the runtime version to Node 22. If you use a Blueprint, keep the service on Node 22 as well.

## Database setup

Create a managed PostgreSQL instance on Render, then copy the internal or external connection string into `DATABASE_URL`.

The backend already supports SSL when the connection string includes `?sslmode=require`, which is the safest production option.

## Environment variables

Set these in Render:

```bash
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-frontend-domain.com
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
```

Notes:

- `FRONTEND_URL` must be the exact public URL of the frontend.
- Keep the scheme, for example `https://`.
- If you have both a production frontend and a preview/staging frontend, use separate Render services with separate env values.

## Migrations

This project uses Sequelize migrations. Run them after the database is connected and before the app is used in production.

If you are using a free Render web service and do not want to use shell access or a one-off job, run the migration during the build phase.

This only works if the service root is `ai-resume-backend`.

Set your Render build command to:

```bash
npm ci && npm run deploy
```

The `deploy` script runs:

```bash
npm run migrate && npm run build
```

That means migrations run before the app is started, which is the safest no-shell option for a free service.

If you prefer to run it from your own machine, set the production `DATABASE_URL` locally and run:

```bash
npm run migrate
```

If you use a paid web service or a one-off job later, you can still run `npm run migrate` there.

Do not run migrations automatically in the web service start command. That can create race conditions on redeploys.

## Post-deploy checks

After deploy, verify these endpoints:

```bash
GET /health
GET /api/protected
```

Expected behavior:

- `/health` returns a 200 response with `status: ok`
- `/api/protected` returns `401` without a bearer token

## Frontend integration

The frontend must point at the Render backend URL through `NEXT_PUBLIC_BACKEND_URL`.

If your frontend is deployed separately, update its environment variables to:

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-render-service.onrender.com
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

The backend also allows the frontend origin through CORS, so the frontend URL and backend URL must match exactly.

## Production checklist

- Use a Render Postgres database
- Set `DATABASE_URL` with SSL enabled
- Set `FRONTEND_URL` to the live frontend URL
- Set `GEMINI_API_KEY` and `DEEPSEEK_API_KEY`
- Run migrations
- Confirm `/health` is healthy
- Confirm frontend requests succeed against the Render URL
