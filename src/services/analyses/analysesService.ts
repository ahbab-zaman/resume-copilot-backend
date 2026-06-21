import { Resume } from "../../models/Resume";
import { JobAnalysis, type JobSummary } from "../../models/JobAnalysis";
import { HttpError } from "../../utils/httpError";
import {
  atsAnalysisSchema,
  atsAnalysisSystemPrompt,
  buildAtsAnalysisUserPrompt,
  type AtsAnalysisResult,
} from "../ai/prompts/atsAnalysis";
import { generateStructured } from "../ai/aiClient";

type CreateAtsAnalysisInput = {
  userId: string;
  resumeId: string;
  jobDescriptionText: string;
};

type SerializedJobAnalysis = {
  id: string;
  resumeId: string;
  jobDescriptionText: string;
  jobTitleDetected: string;
  seniorityDetected: "junior" | "mid" | "senior";
  atsScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  jobSummary: JobSummary;
  aiModelUsed: string;
  createdAt: string;
};

function serializeAnalysis(analysis: JobAnalysis): SerializedJobAnalysis {
  return {
    id: analysis.id,
    resumeId: analysis.resumeId,
    jobDescriptionText: analysis.jobDescriptionText,
    jobTitleDetected: analysis.jobTitleDetected,
    seniorityDetected: analysis.seniorityDetected,
    atsScore: analysis.atsScore,
    skillsMatch: analysis.skillsMatch,
    experienceMatch: analysis.experienceMatch,
    educationMatch: analysis.educationMatch,
    missingKeywords: analysis.missingKeywords,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    jobSummary: analysis.jobSummary,
    aiModelUsed: analysis.aiModelUsed,
    createdAt: analysis.createdAt.toISOString(),
  };
}

export async function createAtsAnalysis(
  input: CreateAtsAnalysisInput,
): Promise<SerializedJobAnalysis> {
  const resume = await Resume.findOne({
    where: {
      id: input.resumeId,
      userId: input.userId,
    },
  });

  if (!resume) {
    throw new HttpError(404, "Resume not found");
  }

  const aiResponse = await generateStructured({
    feature: "ats-analysis",
    systemPrompt: atsAnalysisSystemPrompt,
    userPrompt: buildAtsAnalysisUserPrompt(
      resume.parsedText,
      input.jobDescriptionText,
    ),
    userId: input.userId,
    schema: atsAnalysisSchema,
  });

  if (!aiResponse.success) {
    throw new HttpError(502, aiResponse.error);
  }

  const payload = aiResponse.data as AtsAnalysisResult;

  const analysis = await JobAnalysis.create({
    userId: input.userId,
    resumeId: input.resumeId,
    jobDescriptionText: input.jobDescriptionText,
    jobTitleDetected: payload.jobTitleDetected,
    seniorityDetected: payload.seniorityDetected,
    atsScore: payload.atsScore,
    skillsMatch: payload.skillsMatch,
    experienceMatch: payload.experienceMatch,
    educationMatch: payload.educationMatch,
    missingKeywords: payload.missingKeywords,
    strengths: payload.strengths,
    weaknesses: payload.weaknesses,
    jobSummary: payload.jobSummary,
    aiModelUsed: aiResponse.modelUsed,
  });

  return serializeAnalysis(analysis);
}

export async function getAnalysisById(
  userId: string,
  analysisId: string,
): Promise<SerializedJobAnalysis> {
  const analysis = await JobAnalysis.findOne({
    where: {
      id: analysisId,
      userId,
    },
  });

  if (!analysis) {
    throw new HttpError(404, "Analysis not found");
  }

  return serializeAnalysis(analysis);
}

