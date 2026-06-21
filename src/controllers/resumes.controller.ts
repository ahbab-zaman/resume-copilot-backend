import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../utils/httpError";
import {
  createResume,
  deleteResume,
  listResumes,
  updateResume,
} from "../services/resumes/resumesService";

const updateResumeSchema = z.object({
  title: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (value) => typeof value.title === "string" || typeof value.isActive === "boolean",
  {
    message: "title or isActive is required",
  },
);

const resumeIdSchema = z.string().uuid();

export async function createResumeHandler(
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

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "A PDF file is required",
      });
    }

    const titleValue =
      typeof req.body.title === "string" ? req.body.title : undefined;

    const resume = await createResume({
      userId: req.userId,
      fileBuffer: file.buffer,
      originalFileName: file.originalname,
      title: titleValue,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: resume.id,
        title: resume.title,
        originalFileUrl: resume.originalFileUrl,
        parsedText: resume.parsedText,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/resumes.controller/createResumeHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function getResumesHandler(
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

    const resumes = await listResumes(req.userId);

    return res.status(200).json({
      success: true,
      data: resumes.map((resume) => ({
        id: resume.id,
        title: resume.title,
        originalFileUrl: resume.originalFileUrl,
        parsedText: resume.parsedText,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      })),
    });
  } catch (error: unknown) {
    console.error("[controllers/resumes.controller/getResumesHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function patchResumeHandler(
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

    const parsed = updateResumeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "title or isActive is required",
      });
    }

    const resumeId = resumeIdSchema.safeParse(req.params.id);
    if (!resumeId.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid resume id",
      });
    }

    const resume = await updateResume(req.userId, resumeId.data, parsed.data);

    return res.status(200).json({
      success: true,
      data: {
        id: resume.id,
        title: resume.title,
        originalFileUrl: resume.originalFileUrl,
        parsedText: resume.parsedText,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/resumes.controller/patchResumeHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function deleteResumeHandler(
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

    const resumeId = resumeIdSchema.safeParse(req.params.id);
    if (!resumeId.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid resume id",
      });
    }

    await deleteResume(req.userId, resumeId.data);

    return res.status(200).json({
      success: true,
      data: { deleted: true },
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/resumes.controller/deleteResumeHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
