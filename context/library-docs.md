# Library Docs — Backend

## Order of Authority

```
MCP server / official docs (if available) → this file (project rules) → general training knowledge
```

AI provider SDKs in particular change often — never rely on memory alone for exact method names.

---

## Sequelize + PostgreSQL

```typescript
// config/db.ts
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  logging: false,
});
```

```typescript
// Querying — always scoped to userId
const resumes = await Resume.findAll({
  where: { userId: req.userId },
  order: [["createdAt", "DESC"]],
});

const analysis = await JobAnalysis.findOne({
  where: { id: analysisId, userId: req.userId },
});
if (!analysis) {
  return res.status(404).json({ success: false, error: "Analysis not found" });
}
```

**Rules:**

- Always filter by `userId` taken from `req.userId`, never from the request body.
- Always check for `null` after `findOne`/`findByPk` and return a 404 — never assume the row exists.
- Migrations live in a `migrations/` folder, run via `sequelize-cli` — never use `sync({ force: true })` outside local dev.

---

## better-auth JWT Verification (Cross-Repo Auth)

This backend never installs `better-auth` itself — it only verifies tokens minted by the frontend's instance using `jose`.

```typescript
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`),
);

const { payload } = await jwtVerify(token, JWKS);
const userId = payload.sub as string;
```

**Rules:**

- `JWKS` set is created once per process, not per request — `jose` handles internal caching/refresh.
- If `jwtVerify` throws, always respond `401` with a generic message — never log the raw token.
- Never attempt to decode the token without verifying the signature first.

---

## Gemini 2.5 Flash

```typescript
// services/ai/geminiClient.ts
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateWithGemini<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty Gemini response");
  return JSON.parse(text) as T;
}
```

**Rules:**

- Model string is always `"gemini-2.5-flash"` — never another Gemini model without updating this file first.
- Always set `responseMimeType: "application/json"` for structured output.
- Temperature `0.3` for ATS scoring/extraction (deterministic), `0.6` for resume optimization and cover letters (some natural variation).
- Always wrap `JSON.parse` in try/catch — a malformed response should throw and trigger the DeepSeek fallback, not crash the request.

---

## DeepSeek V3 (Fallback)

DeepSeek exposes an OpenAI-compatible endpoint — reuse the `openai` SDK pointed at DeepSeek's base URL.

```typescript
// services/ai/deepseekClient.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

export async function generateWithDeepSeek<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Empty DeepSeek response");
  return JSON.parse(content) as T;
}
```

**Rules:**

- Model string is always `"deepseek-chat"` (DeepSeek V3) — never another DeepSeek model without updating this file.
- Only ever called from `aiClient.generateStructured()` after a Gemini failure — never called directly as a primary path.
- Same temperature convention as Gemini for consistency between providers.

---

## AI Prompt Files

One file per feature under `services/ai/prompts/`, each exporting a system prompt and a user-prompt builder. Example:

```typescript
// services/ai/prompts/atsAnalysis.ts
export const systemPrompt = `You are an ATS resume screening expert. Compare the resume against the job description and return ONLY valid JSON matching this shape:
{
  "atsScore": number, "skillsMatch": number, "experienceMatch": number, "educationMatch": number,
  "missingKeywords": string[], "strengths": string[], "weaknesses": string[],
  "jobTitleDetected": string, "seniorityDetected": "junior" | "mid" | "senior",
  "jobSummary": { "whatTheyWant": string, "keyResponsibilities": string[] }
}
Never invent skills the resume doesn't mention. Be specific, not generic.`;

export function buildUserPrompt(
  resumeText: string,
  jobDescriptionText: string,
): string {
  return `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescriptionText}`;
}
```

**Rules:**

- Every prompt file's system prompt ends with "Return ONLY valid JSON matching this shape" plus the exact shape — never free text mixed with JSON.
- Every prompt file is provider-agnostic — the same prompt is sent to both Gemini and DeepSeek.
- Never put user-identifying information beyond what's needed for the task into a prompt.

---

## @react-pdf/renderer

Works in any Node process — no browser or Next.js required.

```typescript
// services/pdf/generatePdf.tsx
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  heading: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  text: { fontSize: 10, lineHeight: 1.5 },
});

function CoverLetterDoc({ content }: { content: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.text}>{content}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCoverLetterPdf(content: string): Promise<Buffer> {
  return renderToBuffer(<CoverLetterDoc content={content} />);
}
```

**Rules:**

- File extension is `.tsx` since JSX is used, even though this is a plain Node/Express service — no React app context needed, `renderToBuffer` runs standalone.
- Only these CSS properties are supported: `padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`.
- Always use `renderToBuffer` — never `renderToStream` or browser-only APIs.
- Buffer is saved to disk/storage and a URL is persisted on the relevant row (`cover_letters.pdf_url` or `optimized_resumes.pdf_url`) — never returned as a raw buffer in a JSON response.

---

## pdf-parse

```typescript
// services/parsing/extractResumeText.ts
import pdf from "pdf-parse";

export async function extractResumeText(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  const text = result.text?.trim();
  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract text from this PDF. Please try a different file.",
    );
  }
  return text;
}
```

**Rules:**

- Called only from `POST /api/resumes`, right after `multer` gives you the buffer.
- A short/empty result always throws with the exact human-readable message above — the controller catches it and returns `400`.
- Never write the uploaded file to disk before parsing — operate on the in-memory buffer.

---

## multer (file upload)

```typescript
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are accepted"));
    }
    cb(null, true);
  },
});
```

**Rules:**

- Always `memoryStorage()` — never write uploads to local disk.
- 5MB limit, PDF only — reject anything else with a clear error before it reaches `pdf-parse`.

---

## zod

Used for two things in this repo: validating request bodies, and validating AI JSON output before it's saved.

```typescript
const atsAnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100),
  skillsMatch: z.number().min(0).max(100),
  experienceMatch: z.number().min(0).max(100),
  educationMatch: z.number().min(0).max(100),
  missingKeywords: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

const parsed = atsAnalysisSchema.safeParse(aiResult);
if (!parsed.success) {
  throw new Error("AI returned an unexpected shape");
}
```

**Rules:**

- Every AI feature has a matching zod schema next to its prompt file.
- A failed `safeParse` is treated the same as a provider error — it triggers the DeepSeek fallback (or, if DeepSeek also fails validation, logs to `agent_logs` and returns the generic error).
