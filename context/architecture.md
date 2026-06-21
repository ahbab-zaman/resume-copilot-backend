# Architecture

> **Used in:** Frontend repo AND Backend repo (identical copy in both `context/` folders). This is the most important file in the project — it defines the boundary between the two codebases.

## Why Two Repos

The original reference docs this project is adapted from assumed one Next.js full-stack app (Server Actions, API routes, and DB calls all in the same process). **This project is split into two deployable services that share one PostgreSQL database and talk over HTTP:**

```
┌─────────────────────────┐         REST + Bearer JWT        ┌──────────────────────────┐
│   FRONTEND (Next.js)    │ ───────────────────────────────▶ │   BACKEND (Express)     │
│   - All UI               │                                  │   - All business logic   │
│   - better-auth (full)   │ ◀─────────────────────────────── │   - All AI calls         │
│   - issues session JWTs  │           JSON responses          │   - Sequelize / Postgres │
└────────────┬─────────────┘                                  └────────────┬─────────────┘
             │                                                              │
             │              shared Postgres instance, different schemas    │
             └──────────────────────────────────────────────────────────────┘
```

Neither repo imports code from the other. The only contract between them is the REST API documented below and the JWT verification mechanism.

---

## Stack

| Layer                  | Tool                                                             | Lives In           |
| ---------------------- | ---------------------------------------------------------------- | ------------------ |
| Frontend framework     | Next.js 15+ (App Router)                                         | Frontend repo      |
| Styling                | Tailwind CSS + shadcn/ui                                         | Frontend repo      |
| Auth                   | better-auth (email/password + Google OAuth, owns its own tables) | Frontend repo      |
| Backend framework      | Express + TypeScript                                             | Backend repo       |
| ORM                    | Sequelize                                                        | Backend repo       |
| Database               | PostgreSQL (single instance, shared)                             | Both connect to it |
| AI — primary           | Gemini 2.5 Flash                                                 | Backend repo only  |
| AI — fallback          | DeepSeek V3                                                      | Backend repo only  |
| PDF generation         | @react-pdf/renderer                                              | Backend repo only  |
| Resume text extraction | pdf-parse                                                        | Backend repo only  |
| Language               | TypeScript strict                                                | Both               |

---

## Authentication — How It Crosses the Boundary

**better-auth owns authentication completely.** It runs inside the Next.js app, manages its own tables (`user`, `session`, `account`, `verification`) in the shared Postgres database, and handles email/password + Google OAuth end to end. The Express backend never touches these tables and never issues or revalidates sessions itself.

To let the backend trust a request, better-auth's **JWT plugin** is enabled:

1. Frontend signs a user in via better-auth (cookie-based session as normal for browser navigation).
2. For every call to the Express API, the frontend's API client fetches a short-lived JWT from better-auth (`authClient.token()` / the JWT plugin's token endpoint) and sends it as `Authorization: Bearer <token>`.
3. better-auth exposes a JWKS endpoint at `https://<frontend-domain>/api/auth/jwks`.
4. The Express backend has a middleware that fetches and caches that JWKS, verifies the JWT signature and expiry on every request using `jose`, and extracts `userId` from the `sub` claim.
5. If verification fails → `401` with a generic message. The backend never tries to renew or manage the session itself — that is entirely the frontend's job.

```
Browser ──login──▶ better-auth (Next.js) ──writes──▶ user/session/account tables
Browser ──API call + Bearer JWT──▶ Express ──verifies via JWKS──▶ trusts req.userId
```

**Invariant:** the backend must never accept a request without a valid, verified JWT on any route except health checks. There is no backend-side login, registration, or token-issuing code at all — if a feature seems to need one, it belongs in the frontend's better-auth config instead.

---

## Folder Structure — Frontend Repo

```
/
├── context/                       → these 9 files
├── app/
│   ├── layout.tsx                 → Root layout, font, theme provider
│   ├── page.tsx                   → Landing page
│   ├── (marketing)/
│   │   └── pricing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                     → authenticated shell with sidebar layout
│   │   ├── layout.tsx             → Sidebar + auth guard
│   │   ├── dashboard/page.tsx
│   │   ├── copilot/page.tsx
│   │   ├── resumes/page.tsx
│   │   ├── applications/page.tsx
│   │   ├── interview/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       └── auth/[...all]/route.ts → better-auth handler, the ONLY backend-like code in this repo
├── components/
│   ├── ui/                        → shadcn/ui components only
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx             → public marketing navbar
│   │   └── Footer.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Faq.tsx
│   ├── copilot/
│   │   ├── UploadPanel.tsx
│   │   ├── ProcessingSteps.tsx
│   │   ├── AtsScoreDashboard.tsx
│   │   ├── InsightsPanel.tsx
│   │   └── OutputTabs.tsx
│   ├── resumes/
│   │   └── ResumeTable.tsx
│   ├── applications/
│   │   ├── KanbanBoard.tsx
│   │   └── ApplicationCard.tsx
│   ├── interview/
│   │   └── QuestionCard.tsx
│   └── settings/
│       └── ProfileForm.tsx
├── providers/
│   ├── QueryProvider.tsx           → wraps the app in a TanStack Query QueryClientProvider
│   └── ReduxProvider.tsx           → wraps the app in the Redux store Provider
├── store/
│   ├── index.ts                    → configureStore(), combines slices
│   ├── activeResumeSlice.ts         → currently active resume, shared across pages
│   ├── uiSlice.ts                  → theme, sidebar collapsed state
│   └── hooks.ts                    → typed useAppDispatch / useAppSelector
├── hooks/
│   └── queries/                    → one file per resource, TanStack Query hooks only
│       ├── useResumes.ts
│       ├── useAnalysis.ts
│       └── useApplications.ts
├── lib/
│   ├── auth.ts                    → better-auth server instance + JWT plugin config
│   ├── auth-client.ts              → better-auth React client
│   ├── api-client.ts              → fetch wrapper that calls the Express backend with Bearer token
│   └── utils.ts
└── types/
    └── api.ts                     → request/response types mirroring the backend contract (hand-kept in sync, never imported across repos)
```

## Folder Structure — Backend Repo

```
/
├── context/                       → these 9 files
├── src/
│   ├── server.ts                  → entrypoint, starts Express
│   ├── app.ts                     → Express app, middleware wiring
│   ├── config/
│   │   ├── db.ts                  → Sequelize instance
│   │   └── env.ts                 → typed env var loader
│   ├── middleware/
│   │   ├── verifyAuth.ts          → JWKS fetch + JWT verification
│   │   └── errorHandler.ts
│   ├── models/                    → Sequelize models — one file per table
│   │   ├── Resume.ts
│   │   ├── JobAnalysis.ts
│   │   ├── OptimizedResume.ts
│   │   ├── CoverLetter.ts
│   │   ├── InterviewSession.ts
│   │   ├── Application.ts
│   │   └── AgentLog.ts
│   ├── routes/                    → route definitions only, no logic
│   │   ├── resumes.routes.ts
│   │   ├── analyses.routes.ts
│   │   ├── coverLetters.routes.ts
│   │   ├── interview.routes.ts
│   │   ├── applications.routes.ts
│   │   └── dashboard.routes.ts
│   ├── controllers/               → request/response handling, calls services
│   │   ├── resumes.controller.ts
│   │   ├── analyses.controller.ts
│   │   ├── coverLetters.controller.ts
│   │   ├── interview.controller.ts
│   │   ├── applications.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── geminiClient.ts
│   │   │   ├── deepseekClient.ts
│   │   │   ├── aiClient.ts        → generateStructured() with fallback logic
│   │   │   └── prompts/           → one file per AI feature
│   │   │       ├── atsAnalysis.ts
│   │   │       ├── resumeOptimizer.ts
│   │   │       ├── coverLetter.ts
│   │   │       └── interviewQuestions.ts
│   │   ├── pdf/
│   │   │   └── generatePdf.tsx
│   │   └── parsing/
│   │       └── extractResumeText.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── logger.ts
```

---

## System Boundaries

| Folder                               | Owns                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `app/` (frontend)                    | Pages and layouts only. No business logic, no direct DB access.                                                      |
| `components/` (frontend)             | UI only. Data comes from props or `lib/api-client.ts` calls.                                                         |
| `lib/auth*.ts` (frontend)            | The entire authentication system. Nothing outside this touches auth tables.                                          |
| `routes/` + `controllers/` (backend) | HTTP layer only — validation, calling services, shaping the response. No AI calls or DB queries written inline here. |
| `services/ai/` (backend)             | All AI provider calls and the Gemini→DeepSeek fallback. Nothing here touches Express request/response objects.       |
| `models/` (backend)                  | Sequelize models and table definitions only.                                                                         |
| `middleware/verifyAuth.ts` (backend) | The only place that understands better-auth JWTs.                                                                    |

---

## Data Flow

### Copilot Analysis (the flagship flow)

```
User uploads resume + pastes JD on /copilot
        ↓
Frontend POSTs multipart form to backend: POST /api/resumes (if new resume)
        ↓
Backend extracts text (pdf-parse), saves Resume row, returns resumeId
        ↓
Frontend POSTs: POST /api/analyses { resumeId, jobDescriptionText }
        ↓
Backend controller calls services/ai/aiClient.generateStructured(atsAnalysisPrompt, ...)
        ↓
Gemini 2.5 Flash attempt → on error/quota → DeepSeek V3 attempt
        ↓
Structured JSON validated against expected shape
        ↓
JobAnalysis row saved, returned to frontend
        ↓
Frontend renders ATS Score Dashboard + Insights Panel
```

### Optimized Resume / Cover Letter / Interview Questions (on-demand, from an existing analysis)

```
User clicks "Optimize Resume" / "Generate Cover Letter" / "Generate Interview Qs" on results screen
        ↓
Frontend POSTs to the relevant backend endpoint with { analysisId, ...options }
        ↓
Backend loads the JobAnalysis + original Resume from DB
        ↓
Calls the matching AI prompt module through aiClient.generateStructured()
        ↓
Result saved (OptimizedResume / CoverLetter / InterviewSession row)
        ↓
If a PDF was requested → services/pdf/generatePdf.tsx renders a buffer → saved to disk/storage → URL returned
        ↓
Frontend renders the result / triggers download
```

### Application Tracker

```
User drags a card to a new column / adds a new application
        ↓
Frontend PATCHes/POSTs: /api/applications/:id or /api/applications
        ↓
Backend updates Application row, scoped to req.userId from the verified JWT
        ↓
Frontend refetches the board
```

---

## Database Schema (PostgreSQL, owned by Sequelize except where noted)

### `user`, `session`, `account`, `verification` — owned by better-auth, never written to by the backend

The backend treats `user.id` purely as a foreign-key value (no FK constraint enforced across the boundary, just an indexed `userId` column on every business table). Never query or join into these tables from the backend; the verified JWT already gives you `userId`.

### `resumes`

| Column            | Type        | Notes                              |
| ----------------- | ----------- | ---------------------------------- |
| id                | uuid        | PK                                 |
| user_id           | text        | opaque JWT `sub`, always filtered on |
| title             | text        | user-given or filename             |
| original_file_url | text        | stored PDF location                |
| parsed_text       | text        | extracted via pdf-parse            |
| is_active         | boolean     | one active resume per user         |
| created_at        | timestamptz |                                    |
| updated_at        | timestamptz |                                    |

### `job_analyses`

| Column               | Type        | Notes                               |
| -------------------- | ----------- | ----------------------------------- |
| id                   | uuid        | PK                                  |
| user_id              | uuid        |                                     |
| resume_id            | uuid        | FK → resumes.id                     |
| job_description_text | text        |                                     |
| job_title_detected   | text        |                                     |
| seniority_detected   | text        | junior / mid / senior               |
| ats_score            | integer     | overall 0–100                       |
| skills_match         | integer     | 0–100                               |
| experience_match     | integer     | 0–100                               |
| education_match      | integer     | 0–100                               |
| missing_keywords     | text[]      |                                     |
| strengths            | text[]      |                                     |
| weaknesses           | text[]      |                                     |
| job_summary          | jsonb       | recruiter-intent summary            |
| ai_model_used        | text        | 'gemini-2.5-flash' or 'deepseek-v3' |
| created_at           | timestamptz |                                     |

### `optimized_resumes`

| Column            | Type        | Notes                                                 |
| ----------------- | ----------- | ----------------------------------------------------- |
| id                | uuid        | PK                                                    |
| analysis_id       | uuid        | FK → job_analyses.id                                  |
| user_id           | uuid        |                                                       |
| optimized_content | jsonb       | structured sections, original kept on the resumes row |
| pdf_url           | text        | nullable until exported                               |
| created_at        | timestamptz |                                                       |

### `cover_letters`

| Column      | Type        | Notes                              |
| ----------- | ----------- | ---------------------------------- |
| id          | uuid        | PK                                 |
| analysis_id | uuid        | FK → job_analyses.id               |
| user_id     | uuid        |                                    |
| tone        | text        | professional / startup / corporate |
| content     | text        |                                    |
| pdf_url     | text        | nullable                           |
| created_at  | timestamptz |                                    |

### `interview_sessions`

| Column     | Type        | Notes                                                    |
| ---------- | ----------- | -------------------------------------------------------- |
| id         | uuid        | PK                                                       |
| user_id    | uuid        |                                                          |
| role       | text        | frontend / backend / fullstack                           |
| difficulty | text        | junior / mid / senior                                    |
| questions  | jsonb       | array of `{ category, question, modelAnswer, followUp }` |
| created_at | timestamptz |                                                          |

### `applications`

| Column       | Type        | Notes                                              |
| ------------ | ----------- | -------------------------------------------------- |
| id           | uuid        | PK                                                 |
| user_id      | uuid        |                                                    |
| company      | text        |                                                    |
| role         | text        |                                                    |
| status       | text        | applied / screening / interview / rejected / offer |
| applied_date | date        |                                                    |
| notes        | text        |                                                    |
| created_at   | timestamptz |                                                    |
| updated_at   | timestamptz |                                                    |

### `agent_logs`

| Column     | Type        | Notes                   |
| ---------- | ----------- | ----------------------- |
| id         | uuid        | PK                      |
| user_id    | uuid        | nullable                |
| feature    | text        | which AI feature failed |
| level      | text        | info / warning / error  |
| message    | text        |                         |
| created_at | timestamptz |                         |

---

## REST API Contract (the only thing the two repos share)

All routes require `Authorization: Bearer <jwt>` except where noted. All responses use `{ success: boolean, data?: T, error?: string }`.

| Method | Path                             | Purpose                                                     |
| ------ | -------------------------------- | ----------------------------------------------------------- |
| POST   | `/api/resumes`                   | Upload resume PDF, extract text, save                       |
| GET    | `/api/resumes`                   | List user's resumes                                         |
| PATCH  | `/api/resumes/:id`               | Rename / set active                                         |
| DELETE | `/api/resumes/:id`               | Delete                                                      |
| POST   | `/api/analyses`                  | Run Copilot ATS analysis `{ resumeId, jobDescriptionText }` |
| GET    | `/api/analyses/:id`              | Fetch a saved analysis                                      |
| POST   | `/api/analyses/:id/optimize`     | Generate optimized resume                                   |
| POST   | `/api/analyses/:id/cover-letter` | Generate cover letter `{ tone }`                            |
| POST   | `/api/interview`                 | Generate interview questions `{ role, difficulty }`         |
| GET    | `/api/applications`              | List applications                                           |
| POST   | `/api/applications`              | Create application                                          |
| PATCH  | `/api/applications/:id`          | Update status/notes                                         |
| DELETE | `/api/applications/:id`          | Delete                                                      |
| GET    | `/api/dashboard/stats`           | Counts for stat cards                                       |
| GET    | `/api/dashboard/activity`        | Recent activity feed                                        |
| GET    | `/health`                        | No auth — uptime check                                      |

---

## Invariants

- The backend has **zero** login/register/session code. All of that lives in the frontend's better-auth config.
- The frontend has **zero** AI calls, **zero** Sequelize/Postgres queries, and **zero** PDF generation. All of that lives in the backend.
- Every backend route except `/health` runs through `verifyAuth` middleware before any controller code executes.
- Every backend DB query filters on `user_id` taken from the verified JWT — never trust a `userId` in the request body.
- AI calls always go through `aiClient.generateStructured()` — never call the Gemini or DeepSeek SDKs directly from a controller.
- Every AI call is wrapped in try/catch; a Gemini failure always falls back to DeepSeek before the request is allowed to fail; a failure of both is logged to `agent_logs` and returned to the user as a generic, human-readable error.
- PDF buffers are generated server-side only and uploaded/saved, never streamed raw HTML to the client to print.
- No hardcoded hex colors or raw Tailwind color classes in frontend components — use the tokens in `ui-tokens.md`.
- TanStack Query owns all server data (resumes, analyses, applications, dashboard stats); Redux owns only client-only state with no server source of truth (active resume selection, theme, sidebar state). The same piece of data is never duplicated into both — see `code-standards.md`'s State Management section.
