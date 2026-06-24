# Code Standards — Backend

## Engineering Mindset

- Think before implementing — read `architecture.md` and `project-overview.md` first.
- Scope is sacred — build only what the current feature requires.
- Every route must be testable with curl/Postman immediately after implementation, independent of the frontend.
- Clean over clever.
- Failures are expected — every AI call and every DB call is wrapped in try/catch; one failure never crashes the process.

---

## TypeScript

- Strict mode, no exceptions.
- Never use `any` — use `unknown` and narrow.
- Never use type assertions (`as SomeType`) without a comment explaining why.
- All function parameters and return types explicitly typed.
- `type` for object shapes/unions, `interface` only when extending.
- `const` by default.

---

## Folder Roles

| Folder              | Owns                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `routes/`           | Route → controller wiring only. No logic.                                                                                                                                      |
| `controllers/`      | Request validation, calling services, shaping the `{ success, data, error }` response. No direct AI SDK calls, no direct Sequelize queries beyond what a thin service exposes. |
| `services/ai/`      | All Gemini/OpenRouter calls and the fallback wrapper. Never imports Express types.                                                                                              |
| `services/pdf/`     | PDF rendering only.                                                                                                                                                            |
| `services/parsing/` | pdf-parse text extraction only.                                                                                                                                                |
| `models/`           | Sequelize model definitions only.                                                                                                                                              |
| `middleware/`       | Auth verification and error handling only.                                                                                                                                     |

---

## Route Handlers

```typescript
// routes/analyses.routes.ts
import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";
import {
  createAnalysis,
  getAnalysis,
} from "../controllers/analyses.controller";

const router = Router();
router.post("/", verifyAuth, createAnalysis);
router.get("/:id", verifyAuth, getAnalysis);

export default router;
```

```typescript
// controllers/analyses.controller.ts
import { Request, Response } from "express";
import { runAtsAnalysis } from "../services/ai/aiClient";
import { JobAnalysis } from "../models/JobAnalysis";

export async function createAnalysis(req: Request, res: Response) {
  try {
    const { resumeId, jobDescriptionText } = req.body;
    if (!resumeId || !jobDescriptionText) {
      return res
        .status(400)
        .json({
          success: false,
          error: "resumeId and jobDescriptionText are required",
        });
    }

    const result = await runAtsAnalysis({
      userId: req.userId!,
      resumeId,
      jobDescriptionText,
    });
    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error });
    }

    return res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[analyses.controller/createAnalysis]", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}
```

**Rules:**

- Every controller function has a try/catch.
- Every controller validates the request body before calling a service.
- Errors logged with a `[file/function]` prefix.
- Always return `{ success: boolean, data?: T, error?: string }` — never raw data.
- Never expose raw error messages or stack traces to the client.

---

## Auth Middleware

```typescript
// middleware/verifyAuth.ts
import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`),
);

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          success: false,
          error: "Missing or invalid authorization header",
        });
    }

    const token = header.slice("Bearer ".length);
    const { payload } = await jwtVerify(token, JWKS);
    req.userId = payload.sub as string;
    next();
  } catch (error) {
    console.error("[middleware/verifyAuth]", error);
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired session" });
  }
}
```

**Rules:**

- This is the only file in the backend that understands better-auth JWTs.
- `JWKS` is created once at module load — cached, never re-fetched per request unless `jose` itself decides to refresh.
- Every route except `/health` uses this middleware.
- Never trust a `userId` from `req.body` — always use `req.userId`.

---

## AI Service Layer

```typescript
// services/ai/aiClient.ts
import { generateWithGemini } from "./geminiClient";
import { generateWithOpenRouter } from "./openrouterClient";
import { logAgentEvent } from "../../utils/logger";

export async function generateStructured<T>(
  feature: string,
  systemPrompt: string,
  userPrompt: string,
  userId: string,
): Promise<{ success: boolean; data?: T; error?: string; modelUsed?: string }> {
  try {
    const result = await generateWithGemini<T>(systemPrompt, userPrompt);
    return { success: true, data: result, modelUsed: "gemini-2.5-flash" };
  } catch (geminiError) {
    await logAgentEvent({
      userId,
      feature,
      level: "warning",
      message: `Gemini failed: ${String(geminiError)}`,
    });
    try {
      const result = await generateWithOpenRouter<T>(
        ["deepseek/deepseek-chat-v3-0324:free", "qwen/qwen3-235b-a22b:free"],
        systemPrompt,
        userPrompt,
      );
      return { success: true, data: result, modelUsed: "openrouter" };
    } catch (fallbackError) {
      await logAgentEvent({
        userId,
        feature,
        level: "error",
        message: `OpenRouter also failed: ${String(fallbackError)}`,
      });
      return {
        success: false,
        error: "AI generation failed. Please try again shortly.",
      };
    }
  }
}
```

**Rules:**

- Controllers never call `geminiClient.ts` or `openrouterClient.ts` directly — always through `generateStructured()`.
- Every AI feature (ATS analysis, optimizer, cover letter, interview questions) has its own prompt file under `services/ai/prompts/`, each exporting a `systemPrompt` string and a `buildUserPrompt(...)` function.
- A failure of both models is always logged to `agent_logs` before returning the generic error to the client — never let the raw provider error reach the response.
- Parsed JSON from either provider is validated against the expected shape before being saved or returned — wrap `JSON.parse` in try/catch.

---

## Sequelize Models

```typescript
// models/JobAnalysis.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class JobAnalysis extends Model {
  declare id: string;
  declare userId: string;
  declare resumeId: string;
  declare atsScore: number;
}

JobAnalysis.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
    resumeId: { type: DataTypes.UUID, allowNull: false, field: "resume_id" },
    jobDescriptionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "job_description_text",
    },
    atsScore: { type: DataTypes.INTEGER, allowNull: false, field: "ats_score" },
    skillsMatch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "skills_match",
    },
    experienceMatch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "experience_match",
    },
    educationMatch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "education_match",
    },
    missingKeywords: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      field: "missing_keywords",
    },
    strengths: { type: DataTypes.ARRAY(DataTypes.TEXT) },
    weaknesses: { type: DataTypes.ARRAY(DataTypes.TEXT) },
    jobSummary: { type: DataTypes.JSONB, field: "job_summary" },
    aiModelUsed: { type: DataTypes.TEXT, field: "ai_model_used" },
  },
  { sequelize, tableName: "job_analyses", underscored: true, updatedAt: false },
);
```

**Rules:**

- One model per file, named to match the table in PascalCase singular.
- `tableName` always explicit and snake_case plural.
- `underscored: true` on every model — DB columns are snake_case, JS properties are camelCase.
- Never query a model without filtering on `userId` (except inside a migration/seed script).
- No model file ever imports from `routes/`, `controllers/`, or `services/ai/`.

---

## Error Handling

- Never use empty catch blocks.
- Console errors always prefixed `[folder/file or function]`.
- API errors return generic, human-readable messages — never raw error/stack traces.
- AI/agent errors always logged to `agent_logs` via `utils/logger.ts` before surfacing a generic message.

---

## Environment Variables

| Variable           | Used In                                    |
| ------------------ | ------------------------------------------ |
| `DATABASE_URL`     | `config/db.ts`                             |
| `FRONTEND_URL`     | `middleware/verifyAuth.ts` (JWKS endpoint) |
| `GEMINI_API_KEY`   | `services/ai/geminiClient.ts`              |
| `OPEN_ROUTER_API_KEY` | `services/ai/openrouterClient.ts`         |
| `PORT`             | `server.ts`                                |

Never hardcode any key or URL anywhere in the codebase.

---

## Dependencies

Approved for this repo:

- `express`, `cors`, `helmet`
- `sequelize`, `pg`, `pg-hstore`
- `jose` — JWT verification against the frontend's JWKS
- `@google/genai` — Gemini SDK
- OpenRouter-compatible `fetch` calls — used for fallback model routing
- `@react-pdf/renderer` — PDF generation
- `pdf-parse` — resume text extraction
- `multer` — multipart file upload handling
- `zod` — validating AI JSON output and request bodies

Never install a new package without a clear reason and updating this list first.

---

## Comments

- No comments explaining _what_ code does — code must be self-explanatory.
- Comments only for _why_ — e.g. why a fallback model was chosen, why a field is nullable.
- No TODO comments in committed code.
