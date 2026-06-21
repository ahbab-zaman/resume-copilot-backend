# Project Overview

> **Used in:** Frontend repo AND Backend repo (identical copy in both `context/` folders). Read this first, every session.

## About the Project

**AI Resume Job Pilot** is a full stack AI career assistant. A user uploads their resume and pastes a job description, and a single AI workflow produces an ATS match score, a rewritten/optimized resume, a missing-skills report, a tailored cover letter, and role-specific mock interview questions — all from one click. A Kanban-style tracker lets the user manage applications afterward.

This is two separate codebases:

- **Frontend repo** — Next.js (App Router), TypeScript, Tailwind, shadcn/ui, better-auth. Owns all UI and owns authentication end-to-end.
- **Backend repo** — Node.js, Express, TypeScript, PostgreSQL via Sequelize. Owns all business data and all AI calls.

They share one PostgreSQL database and communicate over a REST API secured with JWTs minted by better-auth and verified by the backend. See `architecture.md` for exactly how that boundary works — it is the single most important thing to get right in this project, since the original reference docs this project was bootstrapped from assumed a single Next.js full-stack app. **Every file in this set has been rewritten so frontend and backend never share runtime code.**

---

## The Problem It Solves

Tailoring a resume and cover letter to every job, figuring out what's actually missing, and prepping for the interview — all of that takes hours per application. AI Resume Job Pilot collapses it into one paste-and-click workflow, then keeps the user organized across every application they send.

---

## Pages (Frontend Repo Only)

```
/                  → Landing page (public)
/login             → Login — email/password + Google OAuth (public)
/register          → Register — email/password + Google OAuth (public)
/pricing           → Pricing page, free tier only for now (public)
/dashboard         → Quick stats, recent activity, quick actions (auth)
/copilot           → Flagship 3-step AI workflow (auth)
/resumes           → Resume manager (auth)
/applications      → Kanban application tracker (auth)
/interview         → AI mock interview practice (auth)
/settings          → Profile, theme, delete account (auth)
```

## Navigation

Authenticated app uses a **left sidebar** (six items above are too many for a clean top navbar): Dashboard, Copilot, Resumes, Applications, Interview, Settings, with the user menu pinned at the bottom. Public marketing pages (`/`, `/pricing`) use a simple top navbar instead — no sidebar before login.

---

## Core User Flow

### Landing → Auth

- Logged-out visitor sees the landing page; "Get Started" → `/register`, "Sign In" → `/login`.
- Register/Login support email+password and Google OAuth, both via better-auth.
- After auth → redirect to `/dashboard`.

### The Copilot Flow (flagship feature)

1. User uploads a resume (PDF) and pastes a job description on `/copilot`.
2. Click **Analyze**.
3. Backend extracts resume text, sends resume + JD to the AI layer (Gemini 2.5 Flash, DeepSeek V3 fallback).
4. Single AI call (or small chained set of calls) returns, in one structured pass:
   - ATS Match Score — overall, skills %, experience %, education %
   - Missing keywords
   - Strengths / weaknesses
   - Job summary (what the recruiter is actually looking for, seniority detected)
5. Results render in the dashboard panel. From there the user can, on demand:
   - Generate an **optimized resume** (rewritten bullets, stronger verbs, side-by-side compare)
   - Generate a **cover letter** (choose tone: Professional / Startup / Corporate)
   - Generate **mock interview questions** (Technical / Behavioral / HR, by difficulty)
6. Every generated artifact is saved against the analysis so the user can revisit it from `/resumes` or `/dashboard`.

### Resume Management

- `/resumes` lists every uploaded resume with its most recent ATS score.
- One resume can be marked active (used as the default for new analyses).
- View / rename / delete / download.

### Application Tracker

- `/applications` — Kanban board: Applied, Screening, Interview, Rejected, Offer.
- Card: company, role, date applied, notes. Drag between columns updates status.
- Stats: total applications, interviews received, success rate.

### Interview Prep

- `/interview` — pick role (Frontend/Backend/Full Stack) and difficulty (Junior/Mid/Senior), generate questions.
- Each question card: category badge, Show Answer (model answer), Next Question.

### Dashboard

- Stat cards: Resumes Uploaded, ATS Analyses Run, Cover Letters Generated, Applications Tracked — plain DB counts, no event-tracking service.
- Recent activity feed — last 5–10 actions across resumes/analyses/cover letters/applications.
- Quick actions: Upload Resume, New Job Analysis, Start Mock Interview, Track Application.

---

## AI Models

| Model                | Role                                                              | Why                                                          |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| **Gemini 2.5 Flash** | Primary — used for every AI feature                               | Large free quota, fast, strong structured JSON output        |
| **DeepSeek V3**      | Fallback — used only when Gemini errors or its quota is exhausted | OpenAI-compatible API, cheap/free tier, good general quality |

Used for: ATS scoring, job description analysis, resume optimization, cover letter generation, interview question generation. All five features go through the same `generateStructured()` AI client wrapper (see backend `library-docs.md`) so the fallback logic is written once.

---

## Features In Scope

- Landing page, pricing page (free tier only, presented professionally)
- better-auth: email/password + Google OAuth, session management, JWT issuance for backend calls
- Resume upload (PDF) + text extraction
- Resume manager (list, rename, delete, download, mark active)
- One-shot AI Copilot analysis: ATS score + skills/experience/education match + missing keywords + strengths/weaknesses + job summary
- AI resume optimizer (rewrite, side-by-side compare)
- AI cover letter generator (3 tones, editable, PDF export)
- AI mock interview generator (technical/behavioral/HR, by difficulty, model answers, follow-ups)
- Application tracker (Kanban, stats)
- Dashboard with DB-counted stats + recent activity
- Settings (profile, theme, delete account)

## Features Out of Scope

- Job discovery / job board scraping (no Adzuna-style search — user supplies the JD themselves)
- Company research agent (no Browserbase/Stagehand — out of scope for this project)
- Auto-apply / form filling
- Paid plans / billing integration (pricing page exists but everything is free for now)
- Event-analytics service (PostHog or similar) — dashboard uses plain DB counts
- Mobile app, browser extension, team accounts
- Email/push notifications
- Multiple resumes "active" at once — one active resume per user

---

## Target User

A job seeker — junior to senior — applying to multiple roles who wants each application (resume, cover letter, interview prep) tailored quickly without doing the analysis manually each time.

## Success Criteria

- User can register, upload a resume, paste a JD, and get a full Copilot analysis in under a minute.
- ATS scores and missing-keyword detection feel accurate and consistent.
- Optimized resume and cover letter read as genuinely improved, not templated filler.
- Interview questions are relevant to the chosen role and difficulty.
- Frontend and backend never share code or types directly — only the documented REST contract.
- AI calls degrade gracefully: a Gemini failure falls back to DeepSeek without the user noticing anything beyond a slightly longer wait.
