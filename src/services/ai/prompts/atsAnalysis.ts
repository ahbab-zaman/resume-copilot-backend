import { z } from "zod";

export const atsAnalysisSchema = z.object({
  atsScore: z.number().int().min(0).max(100),
  skillsMatch: z.number().int().min(0).max(100),
  experienceMatch: z.number().int().min(0).max(100),
  educationMatch: z.number().int().min(0).max(100),
  missingKeywords: z.array(z.string().min(1)),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  jobTitleDetected: z.string().min(1),
  seniorityDetected: z.enum(["junior", "mid", "senior"]),
  jobSummary: z.object({
    whatTheyWant: z.string().min(1),
    keyResponsibilities: z.array(z.string().min(1)),
  }),
});

export type AtsAnalysisResult = z.infer<typeof atsAnalysisSchema>;

export const atsAnalysisSystemPrompt = `You are an ATS resume screening expert.
Compare the resume against the job description and return ONLY valid JSON matching this shape:
{
  "atsScore": number,
  "skillsMatch": number,
  "experienceMatch": number,
  "educationMatch": number,
  "missingKeywords": string[],
  "strengths": string[],
  "weaknesses": string[],
  "jobTitleDetected": string,
  "seniorityDetected": "junior" | "mid" | "senior",
  "jobSummary": {
    "whatTheyWant": string,
    "keyResponsibilities": string[]
  }
}
Be specific, grounded in the provided resume text, and never invent experience that is not supported by the input.`;

export function buildAtsAnalysisUserPrompt(
  resumeText: string,
  jobDescriptionText: string,
): string {
  return `RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescriptionText}`;
}

