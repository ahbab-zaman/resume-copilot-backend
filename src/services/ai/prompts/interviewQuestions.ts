import { z } from "zod";

export const interviewRoleSchema = z.enum(["frontend", "backend", "fullstack"]);
export const interviewDifficultySchema = z.enum(["junior", "mid", "senior"]);

export const interviewQuestionSchema = z.object({
  category: z.enum(["Technical", "Behavioral", "HR"]),
  question: z.string().min(1),
  modelAnswer: z.string().min(1),
  followUp: z.string().min(1),
});

export const interviewSessionSchema = z.object({
  role: interviewRoleSchema,
  difficulty: interviewDifficultySchema,
  questions: z.array(interviewQuestionSchema).length(6),
});

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewSessionResult = z.infer<typeof interviewSessionSchema>;
export type InterviewRole = z.infer<typeof interviewRoleSchema>;
export type InterviewDifficulty = z.infer<typeof interviewDifficultySchema>;

export const interviewQuestionsSystemPrompt = `You are an interview question generator.
Return ONLY valid JSON matching this shape:
{
  "role": "frontend" | "backend" | "fullstack",
  "difficulty": "junior" | "mid" | "senior",
  "questions": [
    {
      "category": "Technical" | "Behavioral" | "HR",
      "question": string,
      "modelAnswer": string,
      "followUp": string
    }
  ]
}
Generate exactly 6 questions total: 2 Technical, 2 Behavioral, and 2 HR.
Keep the questions practical and specific to the selected role and difficulty.
Make the model answers concise, useful, and realistic without pretending to know the candidate's resume.
Vary the wording so the set feels like a real interview loop, not repeated templates.`;

export function buildInterviewQuestionsUserPrompt(
  role: InterviewRole,
  difficulty: InterviewDifficulty,
): string {
  return `ROLE:
${role}

DIFFICULTY:
${difficulty}

Create a balanced interview prep set with 6 questions total.
The questions should progress naturally from easier warm-up questions to more specific follow-ups.
Each answer should be something a strong candidate could say out loud in an interview.`;
}
