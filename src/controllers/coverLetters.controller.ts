import type { Request, Response } from "express";
import { z } from "zod";

import { CoverLetter } from "../models/CoverLetter";
import { HttpError } from "../utils/httpError";
import { generateCoverLetter } from "../services/analyses/coverLetterService";
import { buildCoverLetterPdfLines } from "../services/pdf/buildAnalysisPdf";
import { generatePdfBuffer } from "../services/pdf/generatePdf";

const coverLetterToneSchema = z.enum(["professional", "startup", "corporate"]);
const analysisIdSchema = z.string().uuid();

const coverLetterCreateSchema = z.object({
  tone: coverLetterToneSchema,
});

export async function generateCoverLetterHandler(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session",
      });
    }

    const analysisId = analysisIdSchema.safeParse(req.params.id);
    if (!analysisId.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis id",
      });
    }

    const parsed = coverLetterCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "tone is required",
      });
    }

    const coverLetter = await generateCoverLetter({
      userId: req.userId,
      analysisId: analysisId.data,
      tone: parsed.data.tone,
    });

    return res.status(201).json({
      success: true,
      data: coverLetter,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/coverLetters.controller/generateCoverLetterHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function downloadCoverLetterHandler(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session",
      });
    }

    const analysisId = analysisIdSchema.safeParse(req.params.id);
    if (!analysisId.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis id",
      });
    }

    const parsedTone = coverLetterToneSchema.safeParse(req.query.tone);
    if (!parsedTone.success) {
      return res.status(400).json({
        success: false,
        error: "tone is required",
      });
    }

    const coverLetter = await CoverLetter.findOne({
      where: {
        analysisId: analysisId.data,
        userId: req.userId,
        tone: parsedTone.data,
      },
    });

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        error: "Cover letter not found",
      });
    }

    const pdf = generatePdfBuffer({
      title: `Cover letter - ${coverLetter.tone}`,
      pages: buildCoverLetterPdfLines({ coverLetter }),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cover-letter-${coverLetter.analysisId}-${coverLetter.tone}.pdf"`,
    );
    return res.status(200).send(pdf);
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error(
      "[controllers/coverLetters.controller/downloadCoverLetterHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
