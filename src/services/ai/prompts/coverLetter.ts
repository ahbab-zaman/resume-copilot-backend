import { z } from "zod";

import type { JobSummary } from "../../../models/JobAnalysis";

export const coverLetterSchema = z.object({
  content: z.string().min(1),
});

export type CoverLetterResult = z.infer<typeof coverLetterSchema>;

export type CoverLetterTone = "professional" | "startup" | "corporate";

type BuildCoverLetterUserPromptInput = {
  tone: CoverLetterTone;
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

export const coverLetterSystemPrompt = `You are a cover letter generator.
Return ONLY valid JSON matching this shape:
{
  "content": string
}
Write a complete cover letter in plain text with short paragraphs and a natural closing.
Keep it truthful, concise, and tailored to the job description and resume.
Do not invent experience that is not supported by the provided input.
Match the requested tone while staying professional.`;

export function buildCoverLetterUserPrompt(
  input: BuildCoverLetterUserPromptInput,
): string {
  const strengths = input.strengths.length > 0 ? input.strengths : ["None"];
  const weaknesses = input.weaknesses.length > 0 ? input.weaknesses : ["None"];

  return `TONE:
${input.tone}

RESUME TITLE:
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
- ${strengths.join("\n- ")}

WEAKNESSES:
- ${weaknesses.join("\n- ")}

JOB SUMMARY:
What they want: ${input.jobSummary.whatTheyWant}
Key responsibilities:
- ${input.jobSummary.keyResponsibilities.join("\n- ")}

JOB DESCRIPTION:
${input.jobDescriptionText}

Write a cover letter that opens with a brief introduction, includes 2 to 3 concise body paragraphs, and ends with a clear closing sentence.`;
}
