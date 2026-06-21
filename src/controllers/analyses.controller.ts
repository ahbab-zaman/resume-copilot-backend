import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../utils/httpError";
import { createAtsAnalysis, getAnalysisById } from "../services/analyses/analysesService";

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

