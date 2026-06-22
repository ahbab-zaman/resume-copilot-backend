import { CoverLetter } from "../../models/CoverLetter";
import { JobAnalysis } from "../../models/JobAnalysis";
import { Resume } from "../../models/Resume";
import { HttpError } from "../../utils/httpError";
import { generateStructured } from "../ai/aiClient";
import {
  buildCoverLetterUserPrompt,
  coverLetterSchema,
  coverLetterSystemPrompt,
  type CoverLetterResult,
  type CoverLetterTone,
} from "../ai/prompts/coverLetter";

type GenerateCoverLetterInput = {
  userId: string;
  analysisId: string;
  tone: CoverLetterTone;
};

type SerializedCoverLetter = {
  id: string;
  analysisId: string;
  tone: CoverLetterTone;
  content: string;
  pdfUrl: string | null;
  createdAt: string;
};

function serializeCoverLetter(coverLetter: CoverLetter): SerializedCoverLetter {
  return {
    id: coverLetter.id,
    analysisId: coverLetter.analysisId,
    tone: coverLetter.tone,
    content: coverLetter.content,
    pdfUrl: coverLetter.pdfUrl,
    createdAt: coverLetter.createdAt.toISOString(),
  };
}

export async function generateCoverLetter(
  input: GenerateCoverLetterInput,
): Promise<SerializedCoverLetter> {
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
    feature: "cover-letter",
    systemPrompt: coverLetterSystemPrompt,
    userPrompt: buildCoverLetterUserPrompt({
      tone: input.tone,
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
    schema: coverLetterSchema,
  });

  if (!aiResponse.success) {
    throw new HttpError(502, aiResponse.error);
  }

  const payload = aiResponse.data as CoverLetterResult;

  const existingCoverLetter = await CoverLetter.findOne({
    where: {
      analysisId: analysis.id,
      userId: input.userId,
      tone: input.tone,
    },
  });

  if (existingCoverLetter) {
    await existingCoverLetter.update({
      content: payload.content,
      pdfUrl: null,
    });

    return serializeCoverLetter(existingCoverLetter);
  }

  const coverLetter = await CoverLetter.create({
    analysisId: analysis.id,
    userId: input.userId,
    tone: input.tone,
    content: payload.content,
    pdfUrl: null,
  });

  return serializeCoverLetter(coverLetter);
}
