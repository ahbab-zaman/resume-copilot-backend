# AGENTS.md — Backend (AI Resume Job Pilot)

> **Read this file first, every session, before touching any code.** It is the entry point. After this, read `context/project-overview.md` and `context/architecture.md` in full before starting any feature, then only the other `context/` files relevant to what you're building.

---

## 1. Project Overview

AI Resume Job Pilot is a two-repo application. **This repo is the backend** — Express, all business logic, all database access, and all AI calls. It has no UI and no authentication code of its own; it trusts JWTs minted by the frontend's better-auth instance and verifies them against that instance's JWKS endpoint.

One-line product description: given a resume and a job description, produce an ATS match score, an AI-optimized resume, a tailored cover letter, and mock interview questions — and persist a Kanban-style application tracker. This repo is where every one of those AI calls and database writes actually happens.

---

## 2. Core Technologies

- **Framework**: Express + TypeScript (strict)
- **ORM**: Sequelize
- **Database**: PostgreSQL (shared instance with the frontend's better-auth tables — never write to those tables)
- **AI — primary**: Gemini 2.5 Flash
- **AI — fallback**: DeepSeek V3 (OpenAI-compatible endpoint, via the `openai` SDK)
- **PDF generation**: `@react-pdf/renderer`
- **Resume text extraction**: `pdf-parse`
- **File upload**: `multer` (memory storage only)
- **JWT verification**: `jose`, against the frontend's JWKS

This repo has **no** login/register/logout code, **no** session management, **no** UI of any kind. If a task seems to need any of those, it belongs in the frontend repo instead — say so rather than building it here.

---

## 3. Project Structure

```
/
├── AGENTS.md                      ← this file
├── context/                       ← read after this file
│   ├── project-overview.md
│   ├── architecture.md
│   ├── build-plan.md
│   ├── progress-tracker.md
│   ├── code-standards.md
│   └── library-docs.md
├── skills/                        ← /architect /recover /remember /review (no /imprint — no UI here)
├── src/
│   ├── server.ts                  → entrypoint
│   ├── app.ts                     → Express app, middleware wiring, CORS
│   ├── config/
│   │   ├── db.ts                  → Sequelize instance
│   │   └── env.ts                 → typed env var loader
│   ├── middleware/
│   │   ├── verifyAuth.ts          → JWKS fetch + JWT verification — the only auth code in this repo
│   │   └── errorHandler.ts
│   ├── models/                    → Resume, JobAnalysis, OptimizedResume, CoverLetter, InterviewSession, Application, AgentLog
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── geminiClient.ts
│   │   │   ├── deepseekClient.ts
│   │   │   ├── aiClient.ts        → generateStructured() — the only way controllers call AI
│   │   │   └── prompts/
│   │   ├── pdf/
│   │   └── parsing/
│   ├── types/
│   └── utils/
```

---

## 4. Routes / Controllers

No pages here — this is the API surface the frontend calls. Full contract in `context/architecture.md`.

| Method                | Path                             | Controller                | Notes                                            |
| --------------------- | -------------------------------- | ------------------------- | ------------------------------------------------ |
| POST                  | `/api/resumes`                   | `resumes.controller`      | `multer` upload, `pdf-parse` extraction          |
| GET                   | `/api/resumes`                   | `resumes.controller`      | List, scoped to `req.userId`                     |
| PATCH                 | `/api/resumes/:id`               | `resumes.controller`      | Rename / set active                              |
| DELETE                | `/api/resumes/:id`               | `resumes.controller`      | Delete                                           |
| POST                  | `/api/analyses`                  | `analyses.controller`     | ATS analysis via `aiClient.generateStructured()` |
| GET                   | `/api/analyses/:id`              | `analyses.controller`     | Fetch saved analysis                             |
| POST                  | `/api/analyses/:id/optimize`     | `analyses.controller`     | Resume optimizer                                 |
| POST                  | `/api/analyses/:id/cover-letter` | `coverLetters.controller` | Tone-selectable, optional PDF export             |
| POST                  | `/api/interview`                 | `interview.controller`    | Standalone or Copilot-tab question generation    |
| GET/POST/PATCH/DELETE | `/api/applications`              | `applications.controller` | Kanban CRUD                                      |
| GET                   | `/api/dashboard/stats`           | `dashboard.controller`    | Plain `COUNT` queries                            |
| GET                   | `/api/dashboard/activity`        | `dashboard.controller`    | Union of recent rows, last 10                    |
| GET                   | `/health`                        | —                         | No auth — uptime check only                      |

Every route except `/health` runs through `verifyAuth` before its controller executes.

---

## 5. Authentication (What This Repo Actually Does)

This repo verifies, it never issues:

```typescript
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`),
);
const { payload } = await jwtVerify(token, JWKS);
req.userId = payload.sub as string;
```

- No password hashing, no session cookies, no OAuth code — that all lives in the frontend repo.
- Never trust a `userId` from the request body — always `req.userId` from the verified token.
- A failed verification always returns a generic `401` — never log the raw token.

---

## 6. Context Files — Read in This Order

1. `context/project-overview.md` — what's being built and why
2. `context/architecture.md` — the frontend/backend boundary, the full REST contract, the database schema, the AI fallback pattern
3. `context/build-plan.md` — what's built in what order, and which parts are frontend/backend/both
4. `context/progress-tracker.md` — what's actually done so far in _this_ repo
5. `context/code-standards.md` — how code in this repo must be written
6. `context/library-docs.md` — exact usage patterns for Sequelize, Gemini, DeepSeek, JWT verification, PDF generation, pdf-parse

---

## 7. Skills Installed

All in `/.agents/skills/`. Use them — don't skip them because a task feels small.

| Skill                                  | When to run it                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/architect`                           | Before building any new feature — think it through and confirm a plan first                       |
| `/review`                              | After finishing any feature — verify it against the plan, the architecture, and the REST contract |
| `/recover`                             | The moment something goes wrong — diagnose before re-prompting                                    |
| `/remember save` / `/remember restore` | End / start of every session                                                                      |

There is no `/imprint` here — this repo has no UI to capture patterns from.

---

## 8. AI Service Rules

- Controllers never call `geminiClient.ts` or `deepseekClient.ts` directly — always through `aiClient.generateStructured()`.
- Gemini 2.5 Flash is the primary model; DeepSeek V3 is the fallback, triggered only on a Gemini error or validation failure — never called first.
- Every AI feature has its own prompt file under `services/ai/prompts/` and its own `zod` schema to validate the JSON response shape.
- A failure of both models is logged to `agent_logs` and surfaces as one generic, human-readable error to the frontend.

---

## 9. Development Workflow

- `npm run dev` — start dev server (with `ts-node-dev` or equivalent)
- `npm run build` — compile TypeScript
- `npm run migrate` — run Sequelize migrations
- Frontend must be running separately (see frontend repo's own `AGENTS.md`) for the JWKS endpoint to be reachable — without it, every request to this backend will fail auth with a `401`.

---

## 10. Environment Variables

```
DATABASE_URL=DATABASE_URL
FRONTEND_URL=http://localhost:3000   # used to fetch the JWKS for auth verification
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
PORT=4000
```

Never put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, or any frontend auth secret in this repo's environment — this repo never issues or manages sessions.

---

## 11. Best Practices & Invariants

- TypeScript strict, no `any`.
- Every route except `/health` goes through `verifyAuth`.
- Every DB query filters on `userId` from the verified JWT.
- Every controller has a try/catch and returns `{ success, data?, error? }` — never raw data, never a raw stack trace.
- Every Sequelize model is `underscored: true`, one model per file, never imported from `routes/` or `services/ai/`.

---

## 12. Security

- CORS configured in `app.ts` to allow only `FRONTEND_URL` as an origin — never `*`.
- `helmet` enabled on the Express app.
- `multer` uses memory storage only, 5MB limit, PDF mimetype only — uploads are never written to local disk.
- Never log a JWT, an AI provider key, or `DATABASE_URL` to the console or to `memory.md`.
- Rate limiting on `/api/analyses`, `/api/analyses/:id/optimize`, `/api/analyses/:id/cover-letter`, and `/api/interview` — these are the AI-calling, cost-incurring routes.
