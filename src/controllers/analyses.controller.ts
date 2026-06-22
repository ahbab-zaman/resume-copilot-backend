import type { Request, Response } from "express";
import { z } from "zod";

import { OptimizedResume } from "../models/OptimizedResume";
import { HttpError } from "../utils/httpError";
import { createAtsAnalysis, getAnalysisById } from "../services/analyses/analysesService";
import { optimizeResume } from "../services/analyses/optimizedResumeService";
import { buildOptimizedResumePdfLines } from "../services/pdf/buildAnalysisPdf";
import { generatePdfBuffer } from "../services/pdf/generatePdf";

const analysisCreateSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescriptionText: z.string().trim().min(40, "Job description is too short"),
});

const analysisIdSchema = z.string().uuid();

export async function createAnalysisHandler(
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

    const parsed = analysisCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "resumeId and jobDescriptionText are required",
      });
    }

    const analysis = await createAtsAnalysis({
      userId: req.userId,
      resumeId: parsed.data.resumeId,
      jobDescriptionText: parsed.data.jobDescriptionText,
    });

    return res.status(201).json({
      success: true,
      data: analysis,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/analyses.controller/createAnalysisHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function getAnalysisHandler(
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

    const parsed = analysisIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis id",
      });
    }

    const analysis = await getAnalysisById(req.userId, parsed.data);

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/analyses.controller/getAnalysisHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function optimizeResumeHandler(
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

    const parsed = analysisIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis id",
      });
    }

    const optimizedResume = await optimizeResume({
      userId: req.userId,
      analysisId: parsed.data,
    });

    return res.status(201).json({
      success: true,
      data: optimizedResume,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/analyses.controller/optimizeResumeHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function downloadOptimizedResumeHandler(
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

    const parsed = analysisIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid analysis id",
      });
    }

    const optimizedResume = await OptimizedResume.findOne({
      where: {
        analysisId: parsed.data,
        userId: req.userId,
      },
    });

    if (!optimizedResume) {
      return res.status(404).json({
        success: false,
        error: "Optimized resume not found",
      });
    }

    const pdf = generatePdfBuffer({
      title: `Optimized resume - ${optimizedResume.analysisId}`,
      pages: buildOptimizedResumePdfLines({ optimizedResume }),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="optimized-resume-${optimizedResume.analysisId}.pdf"`,
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
      "[controllers/analyses.controller/downloadOptimizedResumeHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
