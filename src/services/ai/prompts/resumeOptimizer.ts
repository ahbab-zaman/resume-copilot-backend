import { z } from "zod";

import type { JobSummary } from "../../../models/JobAnalysis";

export const resumeOptimizerSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  sectionPairs: z
    .array(
      z.object({
        section: z.string().min(1),
        original: z.string().min(1),
        optimized: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .min(3)
    .max(6),
  keywordIntegrations: z.array(z.string().min(1)),
  nextSteps: z.array(z.string().min(1)),
});

export type ResumeOptimizerResult = z.infer<typeof resumeOptimizerSchema>;

type BuildResumeOptimizerUserPromptInput = {
  resumeTitle: string;
  resumeText: string;
  jobTitleDetected: string;
  seniorityDetected: "junior" | "mid" | "senior";
  atsScore: number;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  jobSummary: JobSummary;
  jobDescriptionText: string;
};

export const resumeOptimizerSystemPrompt = `You are a resume rewrite assistant.
Return ONLY valid JSON matching this shape:
{
  "headline": string,
  "summary": string,
  "sectionPairs": [
    {
      "section": string,
      "original": string,
      "optimized": string,
      "reason": string
    }
  ],
  "keywordIntegrations": string[],
  "nextSteps": string[]
}
Rewrite the resume so it is truthful, specific, and tailored to the job description.
Keep the improvements grounded in the original resume text.
Use stronger verbs, measurable outcomes when supported, and natural keyword placement.
If the resume text is unstructured, summarize the original wording honestly instead of inventing missing bullets.`;

export function buildResumeOptimizerUserPrompt(
  input: BuildResumeOptimizerUserPromptInput,
): string {
  return `RESUME TITLE:
${input.resumeTitle}

RESUME TEXT:
${input.resumeText}

JOB TITLE DETECTED:
${input.jobTitleDetected}

SENIORITY DETECTED:
${input.seniorityDetected}

ATS SCORE:
${input.atsScore}

MISSING KEYWORDS:
${input.missingKeywords.join(", ") || "None"}

STRENGTHS:
${input.strengths.join("\n- ")}

WEAKNESSES:
${input.weaknesses.join("\n- ")}

JOB SUMMARY:
What they want: ${input.jobSummary.whatTheyWant}
Key responsibilities:
- ${input.jobSummary.keyResponsibilities.join("\n- ")}

JOB DESCRIPTION:
${input.jobDescriptionText}

Return 3 to 6 sectionPairs that compare the most useful original wording to a stronger tailored rewrite.`;
}
