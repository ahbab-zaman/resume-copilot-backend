---
name: review
description: After building a feature, verify it matches what was planned, respects the system architecture and design standards, and is ready for production. Reports issues clearly so the developer decides what to fix.
---

> **Project-specific addendum (AI Resume Job Pilot):** For any feature that spans both repos (most do — check `build-plan.md`'s frontend/backend/both labelling), Layer 1 must confirm **both halves** were built, and Layer 2 must add a check for **REST contract conformance**: does this repo's code send/expect exactly what `architecture.md`'s contract table says, matching what the other repo actually implements (not just what it's supposed to implement — if you can see the other repo's code, check it directly).

Building is not done when the code runs. It is done when the code is correct.

AI moves fast. Fast means things get built that work on the surface but drift from the architecture, violate the design system, or miss edge cases that matter. This skill catches those things before they compound into bigger problems.

Run this after every feature. Before you move on.

## What This Skill Does Not Do

It does not fix anything. It reports what it finds and lets the developer decide what matters and what to do about it. Fixing without understanding is how problems get buried, not solved.

---

## Step 1 — Understand What Should Have Been Built

Before reviewing anything, establish the benchmark.

Read in this order:

- The implementation plan from `/architect` if one exists
- The feature description or task that was given
- Any relevant context files — `architecture.md` (architecture boundaries and REST contract), `code-standards.md`, and for frontend also `ui-rules.md` / `ui-tokens.md`

If no plan exists, ask the developer to describe what the feature was supposed to do before reviewing. You cannot verify correctness without knowing what correct looks like.

---

## Step 2 — Review in Three Layers

### Layer 1 — Does it match the plan?

Compare what was built against what was planned.

Check:

- Every part of the feature description — is it all there?
- The decisions made during planning — are they reflected in the code?
- The scope — did the implementation stay within bounds or add things that were not asked for?
- If the feature spans both repos per `build-plan.md` — is **this repo's** half actually done, and (if visible) is the other repo's half done too?

Flag anything that was planned but missing. Flag anything that was built but not planned.

### Layer 2 — Does it respect the system?

This is where AI drift most commonly happens. The feature works, but it violates rules that the project depends on.

Check:

- **Architecture boundaries** — does code in the right place own the right responsibilities? In this project specifically: no AI calls, no Sequelize queries, and no PDF generation in the frontend repo; no auth/session/login code and no UI in the backend repo. Whatever this repo's boundaries are — are they respected?
- **REST contract conformance** — does this repo's request shape, response shape, and error format match exactly what `architecture.md`'s contract table documents, and what the other repo actually sends/expects?
- **Design system** _(frontend only)_ — are the correct tokens from `ui-tokens.md` and patterns from `ui-rules.md` used? Any hardcoded values or raw Tailwind color classes that should be tokens?
- **Code standards** — naming conventions, file organisation, TypeScript strictness, error handling patterns — do they match `code-standards.md`?
- **Existing patterns** — does this feature introduce a new pattern when an existing one (check `ui-registry.md` for frontend, or existing service/controller patterns for backend) should have been used?

### Layer 3 — Is it production ready?

Check:

- Error handling — what happens when things go wrong? Are errors caught and handled or does the feature silently fail? _(Backend: is every AI call wrapped with the Gemini→DeepSeek fallback per `code-standards.md`? Is every failure logged to `agent_logs`? Frontend: does every data-fetching component have a loading and error state?)_
- Edge cases — empty states, loading states, missing data — are these handled?
- Console errors — any errors or warnings in the browser or terminal?
- Obvious bugs — anything that would clearly break for a real user?

---

## Step 3 — Report What You Found

After completing all three layers, produce a clear report. Do not bury issues. Do not soften them. Report honestly so the developer can make informed decisions.

```
## Review — [Feature Name] ([Frontend/Backend/Both])

### Layer 1 — Plan alignment
[PASS / ISSUES FOUND]
[List any gaps between what was planned and what was built]

### Layer 2 — System integrity
[PASS / ISSUES FOUND]
[List any architecture, REST contract, design, or code standard violations]

### Layer 3 — Production readiness
[PASS / ISSUES FOUND]
[List any error handling gaps, edge cases, or obvious bugs]

### Summary
[X] issues found across [Y] layers.

[If no issues: "No issues found. This feature is ready to ship."]
[If issues: "Resolve the above before moving to the next feature."]
```

---

## Step 4 — Let the Developer Decide

After presenting the report, stop. Do not start fixing. Do not suggest fixes unless the developer asks.

Wait for the developer to:

- Ask you to fix a specific issue
- Tell you an issue is intentional and can be ignored
- Confirm everything is resolved and ready to move on

The developer owns the quality decision. You inform it.

---

## Severity Guide

Not all issues are equal. Use this to help the developer prioritise:

**Critical — fix before moving on**

- Architecture boundary violations that will break future features
- REST contract mismatches between the two repos
- Missing error handling that causes silent failures
- Functionality that was planned but completely missing

**Important — fix soon**

- Design system drift that will cause UI inconsistency (frontend)
- Code standard violations that will compound across the codebase
- Edge cases that a real user will encounter

**Minor — fix when convenient**

- Naming inconsistencies that do not affect behaviour
- Missing optimisations
- Style issues that do not affect the design system

Label each issue with its severity so the developer can triage quickly.

---

## The Standard

The question this skill answers is not "does it work?"

The question is "is it correct?"

Working and correct are not the same thing. A feature can work today and break the project tomorrow. Review exists to catch the difference.
