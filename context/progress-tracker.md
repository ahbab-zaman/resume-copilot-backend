# Progress Tracker

> **Used in:** Frontend repo AND Backend repo. Each repo keeps its own copy and checks off only the boxes relevant to it for shared features - update this after every completed feature.

---

## Current Status

**Phase:** Phase 4 - Copilot Flow
**Repo (frontend/backend/both):** backend
**Last completed:** 11 ATS Analysis - AI Service
**Next:** 12 Resume Optimizer

---

## Progress

### Phase 1 - Foundation

- [ ] 01 Backend Skeleton _(backend)_
- [ ] 02 Frontend Skeleton + better-auth _(frontend)_
- [ ] 03 Database Schema _(both)_
- [ ] 04 Cross-Repo Auth Wiring _(both)_

### Phase 2 - App Shell

- [ ] 05 Sidebar + Authenticated Layout _(frontend)_
- [ ] 06 State Management Setup _(frontend)_
- [ ] 07 Landing + Pricing Pages _(frontend)_

### Phase 3 - Resume Manager

- [ ] 08 Resumes Page - Full UI _(frontend)_
- [x] 09 Resume Upload + Extraction _(both)_ - backend resumes API, upload parsing, and CRUD support completed

### Phase 4 - Copilot Flow

- [ ] 10 Copilot Page - Full UI _(frontend)_
- [x] 11 ATS Analysis - AI Service _(both)_ - backend now exposes the ATS analysis endpoint, AI fallback wrapper, and saved analysis model
- [ ] 12 Resume Optimizer _(both)_
- [ ] 13 Cover Letter Generator _(both)_
- [ ] 14 Mock Interview Generator (Copilot tab) _(both)_

### Phase 5 - Interview Practice

- [ ] 15 Interview Page - Full UI _(frontend)_
- [ ] 16 Interview Page - Wired _(both)_

### Phase 6 - Application Tracker

- [ ] 17 Applications Page - Full UI _(frontend)_
- [ ] 18 Applications - Wired _(both)_

### Phase 7 - Dashboard

- [ ] 19 Dashboard Page - Full UI _(frontend)_
- [ ] 20 Dashboard - Real Data _(both)_

### Phase 8 - Settings

- [ ] 21 Settings Page _(frontend)_

---

## Decisions Made During Build

- The backend now has the resumes table and CRUD API endpoints needed for the upload/list/rename/delete/set-active flow.
- The backend now has the ATS analysis table, AI prompt/service layer, and `/api/analyses` routes needed for Copilot scoring.

---

## Notes

- The frontend is now wired to the backend resumes API.
