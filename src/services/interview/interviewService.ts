import { InterviewSession } from "../../models/InterviewSession";
import { HttpError } from "../../utils/httpError";
import { generateStructured } from "../ai/aiClient";
import {
  buildInterviewQuestionsUserPrompt,
  interviewSessionSchema,
  interviewQuestionsSystemPrompt,
  type InterviewDifficulty,
  type InterviewQuestion,
  type InterviewRole,
} from "../ai/prompts/interviewQuestions";

type GenerateInterviewSessionInput = {
  userId: string;
  role: InterviewRole;
  difficulty: InterviewDifficulty;
};

type SerializedInterviewSession = {
  id: string;
  role: InterviewRole;
  difficulty: InterviewDifficulty;
  questions: InterviewQuestion[];
  createdAt: string;
};

function serializeInterviewSession(
  session: InterviewSession,
): SerializedInterviewSession {
  return {
    id: session.id,
    role: session.role,
    difficulty: session.difficulty,
    questions: session.questions,
    createdAt: session.createdAt.toISOString(),
  };
}

export async function generateInterviewSession(
  input: GenerateInterviewSessionInput,
): Promise<SerializedInterviewSession> {
  const aiResponse = await generateStructured({
    feature: "interview-questions",
    systemPrompt: interviewQuestionsSystemPrompt,
    userPrompt: buildInterviewQuestionsUserPrompt(input.role, input.difficulty),
    userId: input.userId,
    schema: interviewSessionSchema,
  });

  if (!aiResponse.success) {
    throw new HttpError(502, aiResponse.error);
  }

  const payload = aiResponse.data;

  const interviewSession = await InterviewSession.create({
    userId: input.userId,
    role: input.role,
    difficulty: input.difficulty,
    questions: payload.questions,
  });

  return serializeInterviewSession(interviewSession);
}
