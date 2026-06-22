# Memory — Copilot Interview Generator (Backend)

Last updated: 2026-06-23

## What was built

- Added `src/services/ai/prompts/interviewQuestions.ts` with the interview question prompt and zod schema.
- Added `src/models/InterviewSession.ts` for persisted interview sessions.
- Added migration `migrations/20260622060000-create-interview-sessions.cjs`.
- Added `src/services/interview/interviewService.ts` to generate, validate, and persist interview sessions.
- Added `src/controllers/interview.controller.ts` and `src/routes/interview.routes.ts`.
- Mounted the new route under `/api/interview` in `src/app.ts`.
- Updated `context/progress-tracker.md` to mark feature 14 complete on the backend side.

## Decisions made

- Kept interview generation behind the backend boundary with the same Gemini-to-DeepSeek fallback path used by other AI features.
- Stored the interview session as a persisted `interview_sessions` row so the frontend can treat the response as saved server data.
- Locked the interview payload to 6 questions total, split across Technical, Behavioral, and HR categories.

## Problems solved

- The backend previously had no `/api/interview` route even though the architecture contract already required it.
- The backend now saves and returns interview sessions in the same contract-driven pattern as analyses, optimized resumes, and cover letters.
- The backend build passes after adding the new model, service, controller, route, and migration.

## Current state

- `POST /api/interview` generates a role/difficulty-specific interview question set and saves it.
- The interview session data is persisted in `interview_sessions`.
- The backend remains within its boundary: AI and persistence live here, while UI lives in the frontend.

## Next session starts with

- Build feature 15: the standalone Interview page full UI in the frontend repo.

## Open questions

- The interview page UI still needs to be built on top of the new `/api/interview` contract.
- If later work changes the question shape or session metadata, the frontend `QuestionCard` and shared types must stay in sync with this contract.
