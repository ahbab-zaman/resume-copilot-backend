import { JobAnalysis } from "../../models/JobAnalysis";
import {
  OptimizedResume,
  type OptimizedResumeContent,
} from "../../models/OptimizedResume";
import { Resume } from "../../models/Resume";
import { HttpError } from "../../utils/httpError";
import { generateStructured } from "../ai/aiClient";
import {
  buildResumeOptimizerUserPrompt,
  resumeOptimizerSchema,
  resumeOptimizerSystemPrompt,
  type ResumeOptimizerResult,
} from "../ai/prompts/resumeOptimizer";

type OptimizeResumeInput = {
  userId: string;
  analysisId: string;
};

type SerializedOptimizedResume = {
  id: string;
  analysisId: string;
  optimizedContent: OptimizedResumeContent;
  pdfUrl: string | null;
  createdAt: string;
};

function serializeOptimizedResume(
  optimizedResume: OptimizedResume,
): SerializedOptimizedResume {
  return {
    id: optimizedResume.id,
    analysisId: optimizedResume.analysisId,
    optimizedContent: optimizedResume.optimizedContent,
    pdfUrl: optimizedResume.pdfUrl,
    createdAt: optimizedResume.createdAt.toISOString(),
  };
}

export async function optimizeResume(
  input: OptimizeResumeInput,
): Promise<SerializedOptimizedResume> {
  const analysis = await JobAnalysis.findOne({
    where: {
      id: input.analysisId,
      userId: input.userId,
    },
  });

  if (!analysis) {
    throw new HttpError(404, "Analysis not found");
  }

  const resume = await Resume.findOne({
    where: {
      id: analysis.resumeId,
      userId: input.userId,
    },
  });

  if (!resume) {
    throw new HttpError(404, "Resume not found");
  }

  const aiResponse = await generateStructured({
    feature: "resume-optimizer",
    systemPrompt: resumeOptimizerSystemPrompt,
    userPrompt: buildResumeOptimizerUserPrompt({
      resumeTitle: resume.title,
      resumeText: resume.parsedText,
      jobTitleDetected: analysis.jobTitleDetected,
      seniorityDetected: analysis.seniorityDetected,
      atsScore: analysis.atsScore,
      missingKeywords: analysis.missingKeywords,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      jobSummary: analysis.jobSummary,
      jobDescriptionText: analysis.jobDescriptionText,
    }),
    userId: input.userId,
    schema: resumeOptimizerSchema,
  });

  if (!aiResponse.success) {
    throw new HttpError(502, aiResponse.error);
  }

  const payload = aiResponse.data as ResumeOptimizerResult;

  const existingOptimizedResume = await OptimizedResume.findOne({
    where: {
      analysisId: analysis.id,
      userId: input.userId,
    },
  });

  if (existingOptimizedResume) {
    await existingOptimizedResume.update({
      optimizedContent: payload,
      pdfUrl: null,
    });

    return serializeOptimizedResume(existingOptimizedResume);
  }

  const optimizedResume = await OptimizedResume.create({
    analysisId: analysis.id,
    userId: input.userId,
    optimizedContent: payload,
    pdfUrl: null,
  });

  return serializeOptimizedResume(optimizedResume);
}
