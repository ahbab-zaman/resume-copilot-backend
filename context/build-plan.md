# Build Plan

## Core Principle

Each feature is built **end-to-end in one pass**: backend logic first, then the frontend wires it in immediately via a TanStack Query hook — never UI-with-mock-data sitting disconnected from a real endpoint. Visual polish (matching `ui-rules.md`/`ui-tokens.md` exactly — radius, shadows, spacing, the marketing-vs-in-app button scales) is deferred to a dedicated **Design Pass** phase at the end, once every feature is functionally wired and testable.

This keeps two separate, independently-completable questions apart: _does it work_ (Phases 1–2) and _does it look right_ (Phase 3). You're never blocked on design to verify logic works, and never blocked on logic to verify design looks right. A page can be ugly-but-functional through Phase 2 — that's expected, not a problem.

Every feature below states what happens in the **Frontend repo**, the **Backend repo**, or **both** — built together when tagged `(both)`, not as two separate visits.

---

## Phase 1 — Foundation

### 01 Backend Skeleton

**Backend:** Express app boots, `/health` returns 200, Sequelize connects to Postgres, `verifyAuth` middleware exists and rejects unauthenticated requests with 401 on a dummy protected route.

### 02 Frontend Skeleton + better-auth ✅ Done

**Frontend:** Next.js app boots, Tailwind + shadcn installed, root layout with Geist font. better-auth configured (`lib/auth.ts`) with email/password + Google OAuth + JWT plugin. `/login` and `/register` working end to end — can create an account and land on a placeholder `/dashboard`.

### 03 Database Schema

**Backend:** All Sequelize models created (`resumes`, `job_analyses`, `optimized_resumes`, `cover_letters`, `interview_sessions`, `applications`, `agent_logs`) and migrated.

**Frontend:** better-auth's own tables (`user`, `session`, `account`, `verification`) created via its CLI migration against the same Postgres instance. _(Already done — confirmed working since auth is live.)_

### 04 Cross-Repo Auth Wiring

**Frontend:** `lib/api-client.ts` built — fetch wrapper that attaches a fresh Bearer JWT from better-auth to every call.

**Backend:** `middleware/verifyAuth.ts` built — fetches and caches the frontend's JWKS, verifies incoming JWTs, attaches `req.userId`.

**Test:** a protected backend route returns the correct `userId` when called from a logged-in frontend session.

### 05 App Shell (Functional Only)

**Frontend:** `(app)/layout.tsx` with a working `Sidebar.tsx` (Dashboard, Copilot, Resumes, Applications, Interview, Settings — links and routing only), auth guard redirecting logged-out users to `/login`. Unstyled or minimally styled — full visual treatment happens in Phase 3.

### 06 State Management Setup

**Frontend:** Install `@tanstack/react-query`, `@reduxjs/toolkit`, `react-redux`. Build `providers/QueryProvider.tsx` and `providers/ReduxProvider.tsx`, wrap the root layout in both. Build `store/index.ts` with two starter slices (`activeResumeSlice`, `uiSlice`) and `store/hooks.ts`. See `code-standards.md`'s State Management section for the dividing rule between the two tools.

---

## Phase 2 — Core Features (Backend + Frontend, Functional)

Every feature here is built as one pass per feature: backend endpoint and model, then the frontend query/mutation hook and just enough UI (forms, buttons, a plain list/table) to actually exercise it end to end. Styling to spec comes in Phase 3.

### 07 Resume Upload + Extraction _(both)_

**Backend:** `POST /api/resumes` — `multer` memory upload, `pdf-parse` extraction, save row with `parsed_text`. `GET/PATCH/DELETE /api/resumes`.

**Frontend:** `hooks/queries/useResumes.ts` (`useResumes`, `useUploadResume`, `useDeleteResume`, `useSetActiveResume`). Minimal `/resumes` page — upload control + plain list, wired to real data.

### 08 ATS Analysis — AI Service _(both)_

**Backend:** `services/ai/aiClient.ts` (Gemini → DeepSeek fallback), `services/ai/prompts/atsAnalysis.ts`, `POST /api/analyses`, `GET /api/analyses/:id`.

**Frontend:** `useAnalysis.ts` query/mutation hooks. Minimal `/copilot` page — resume select + JD textarea + Analyze button, results rendered as plain text/numbers (no score bar styling yet).

### 09 Resume Optimizer _(both)_

**Backend:** `services/ai/prompts/resumeOptimizer.ts`, `POST /api/analyses/:id/optimize`.

**Frontend:** Mutation hook + a plain "Optimize" button and result block on `/copilot`.

### 10 Cover Letter Generator _(both)_

**Backend:** `services/ai/prompts/coverLetter.ts`, `POST /api/analyses/:id/cover-letter` with `{ tone }`, optional PDF render via `services/pdf/generatePdf.tsx`.

**Frontend:** Tone selector (plain `<select>`), generate button, editable textarea, download link — on `/copilot`.

### 11 Mock Interview Generator _(both)_

**Backend:** `services/ai/prompts/interviewQuestions.ts`, `POST /api/interview` with `{ role, difficulty }` — reusable from the Copilot tab and the standalone page.

**Frontend:** `useInterview.ts` hook. Minimal `/interview` page — role/difficulty selectors, Generate button, plain question list with show/hide answer.

### 12 Application Tracker _(both)_

**Backend:** `GET/POST/PATCH/DELETE /api/applications` — full CRUD, scoped to `user_id`.

**Frontend:** `useApplications.ts` hooks. Minimal `/applications` page — plain list grouped by status (no drag-and-drop, no Kanban columns yet), add/edit/delete working.

### 13 Dashboard Data _(both)_

**Backend:** `GET /api/dashboard/stats` (plain `COUNT` queries), `GET /api/dashboard/activity` (union of recent rows, last 10).

**Frontend:** `useDashboard.ts` hooks. Minimal `/dashboard` page — plain numbers and a plain activity list.

### 14 Settings — Functional

**Frontend:** `/settings` wired to better-auth — update name/email, theme toggle (stored in `uiSlice`), delete account flow. No backend involvement (this repo never owns user data).

---

## Phase 3 — Design Pass (Frontend Only)

Every page above already works. This phase applies `ui-rules.md` and `ui-tokens.md` exactly — radius, shadow elevation, the marketing-vs-in-app button/typography registers, the Vercel mesh gradient on the hero, badge colors, the Kanban board's real drag-and-drop, the ATS score bar. Run `/imprint` after each one.

### 15 Landing Page — Design

Full hero (mesh gradient), Features, How It Works, FAQ, Footer, public navbar.

### 16 Pricing Page — Design

Pricing cards (`pricing-card` chrome), free-tier presentation.

### 17 App Shell — Design

Sidebar to spec (active indicator, ghost hover states), full in-app radius/spacing register.

### 18 Resumes Page — Design

Real table chrome (mono-caption headers, hover states), upload dialog, ATS-score-per-resume display.

### 19 Copilot Page — Design

3-column layout, processing/loading states, ATS Score Dashboard (score bar bands), Insights Panel, Output Tabs.

### 20 Applications Page — Design

Real Kanban board with `@dnd-kit/core` drag-and-drop, status badge colors, stats row.

### 21 Interview Page — Design

Question cards with category badges, Show Answer / Next Question interaction polish.

### 22 Dashboard — Design

Stat cards, recent activity feed styling, incomplete-resume banner.

### 23 Settings Page — Design

Form layout, theme toggle styling, delete-account confirmation dialog.

---

## Feature Count

| Phase                                | Features |
| ------------------------------------ | -------- |
| Phase 1 — Foundation                 | 6        |
| Phase 2 — Core Features (functional) | 8        |
| Phase 3 — Design Pass (frontend)     | 9        |
| **Total**                            | **23**   |
