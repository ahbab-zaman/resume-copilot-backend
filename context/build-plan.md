# Build Plan

## Core Principle

Full page UI is built with mock data first and verified visually before any logic is written, same as before — but now "logic" is split: **backend logic** (DB + AI) is built and tested independently via direct API calls (curl/Postman) before the **frontend** wires it up. Every feature must be visible/testable in its own repo before moving to the next. No invisible phases on either side.

Each numbered feature below states what happens in the **Frontend repo** and what happens in the **Backend repo** separately — they are built and tested independently, then connected.

---

## Phase 1 — Foundation

### 01 Backend Skeleton

**Backend:** Express app boots, `/health` returns 200, Sequelize connects to Postgres, `verifyAuth` middleware exists and rejects unauthenticated requests with 401 on a dummy protected route.

### 02 Frontend Skeleton + better-auth

**Frontend:** Next.js app boots, Tailwind + shadcn installed, root layout with Inter font. better-auth configured (`lib/auth.ts`) with email/password + Google OAuth + JWT plugin. `/login` and `/register` pages working end to end — can create an account and land on a placeholder `/dashboard`.

### 03 Database Schema

**Backend:** All Sequelize models created (`resumes`, `job_analyses`, `optimized_resumes`, `cover_letters`, `interview_sessions`, `applications`, `agent_logs`) and migrated.

**Frontend:** better-auth's own tables (`user`, `session`, `account`, `verification`) created via its CLI migration against the same Postgres instance.

### 04 Cross-Repo Auth Wiring

**Frontend:** `lib/api-client.ts` built — fetch wrapper that attaches a fresh Bearer JWT from better-auth to every call.

**Backend:** `middleware/verifyAuth.ts` built — fetches and caches the frontend's JWKS, verifies incoming JWTs, attaches `req.userId`.

**Test:** a protected backend route returns the correct `userId` when called from a logged-in frontend session.

---

## Phase 2 — App Shell

### 05 Sidebar + Authenticated Layout

**Frontend:** `(app)/layout.tsx` with `Sidebar.tsx` (Dashboard, Copilot, Resumes, Applications, Interview, Settings), auth guard redirecting logged-out users to `/login`.

### 06 Landing + Pricing Pages

**Frontend:** Full landing page UI (Hero, Features, How It Works, FAQ, Footer) and pricing page, all free tier, with mock testimonial data.

---

## Phase 3 — Resume Manager

### 07 Resumes Page — Full UI

**Frontend:** `/resumes` page UI with mock data — table of resumes (name, date, ATS score, actions), upload button/dialog.

### 08 Resume Upload + Extraction

**Backend:** `POST /api/resumes` — accepts multipart PDF, runs `pdf-parse`, saves row with `parsed_text`. If extraction returns empty/too-short text → `400` with human-readable error.

**Frontend:** Wire upload dialog to the real endpoint, list real resumes, wire rename/delete/set-active to `PATCH`/`DELETE`.

---

## Phase 4 — The Copilot Flow (flagship)

### 09 Copilot Page — Full UI

**Frontend:** `/copilot` 3-column UI with mock data — input panel (resume select/upload, JD textarea), processing/loading states, output results panel (ATS Score Dashboard, Insights Panel, Output Tabs for Resume/Cover Letter/Interview Qs).

### 10 ATS Analysis — AI Service

**Backend:** `services/ai/aiClient.ts` (Gemini → DeepSeek fallback wrapper) and `services/ai/prompts/atsAnalysis.ts`. `POST /api/analyses` runs the prompt, validates the structured JSON shape, saves a `job_analyses` row, returns it.

**Frontend:** Wire Analyze button to `POST /api/analyses`, render real ATS Score Dashboard (overall/skills/experience/education + missing keywords) and Insights Panel (strengths/weaknesses) from the response.

### 11 Resume Optimizer

**Backend:** `services/ai/prompts/resumeOptimizer.ts`, `POST /api/analyses/:id/optimize` — loads the analysis + original resume text, runs the prompt, saves `optimized_resumes` row.

**Frontend:** Wire "Optimize Resume" tab — side-by-side original vs optimized view, Download PDF button.

### 12 Cover Letter Generator

**Backend:** `services/ai/prompts/coverLetter.ts`, `POST /api/analyses/:id/cover-letter` with `{ tone }`. Generates content, optionally renders PDF via `services/pdf/generatePdf.tsx`, saves `cover_letters` row.

**Frontend:** Wire "Cover Letter" tab — tone selector, editable textarea pre-filled with AI output, Download PDF button.

### 13 Mock Interview Generator (from Copilot context)

**Backend:** `services/ai/prompts/interviewQuestions.ts`, reusable by both the Copilot tab and the standalone `/interview` page.

**Frontend:** Wire "Interview Qs" tab on the Copilot results screen — question cards with Show Answer / Next Question.

---

## Phase 5 — Standalone Interview Practice

### 14 Interview Page — Full UI

**Frontend:** `/interview` page UI with mock data — role selector, difficulty selector, Generate button, question cards grouped Technical/Behavioral/HR.

### 15 Interview Page — Wired

**Backend:** `POST /api/interview` with `{ role, difficulty }`, no resume/JD required — generates a fresh question set, saves `interview_sessions` row.

**Frontend:** Wire Generate button to the endpoint, render real questions with model answers and follow-ups.

---

## Phase 6 — Application Tracker

### 16 Applications Page — Full UI

**Frontend:** `/applications` Kanban UI with mock data — columns Applied/Screening/Interview/Rejected/Offer, draggable cards, filter bar, stats row.

### 17 Applications — Wired

**Backend:** `GET/POST/PATCH/DELETE /api/applications` — full CRUD, scoped to `user_id`.

**Frontend:** Wire board to real data, drag-to-update-status calls `PATCH`, add/edit/delete dialogs wired, stats row computed from real data.

---

## Phase 7 — Dashboard

### 18 Dashboard Page — Full UI

**Frontend:** `/dashboard` UI with mock data — four stat cards, recent activity list, quick action buttons, incomplete-resume banner if no active resume.

### 19 Dashboard — Real Data

**Backend:** `GET /api/dashboard/stats` (plain `COUNT` queries across the four tables) and `GET /api/dashboard/activity` (union + sort of recent rows across `resumes`, `job_analyses`, `cover_letters`, `applications`, last 10).

**Frontend:** Wire stat cards and activity feed to the real endpoints.

---

## Phase 8 — Settings

### 20 Settings Page

**Frontend:** `/settings` — profile fields (from better-auth user), theme toggle, delete account flow (calls better-auth's delete-user action; backend is not involved since it never owns user data).

---

## Feature Count

| Phase                         | Features |
| ----------------------------- | -------- |
| Phase 1 — Foundation          | 4        |
| Phase 2 — App Shell           | 2        |
| Phase 3 — Resume Manager      | 2        |
| Phase 4 — Copilot Flow        | 5        |
| Phase 5 — Interview Practice  | 2        |
| Phase 6 — Application Tracker | 2        |
| Phase 7 — Dashboard           | 2        |
| Phase 8 — Settings            | 1        |
| **Total**                     | **20**   |
