import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../utils/httpError";
import { generateInterviewSession } from "../services/interview/interviewService";

const interviewCreateSchema = z.object({
  role: z.enum(["frontend", "backend", "fullstack"]),
  difficulty: z.enum(["junior", "mid", "senior"]),
});

export async function createInterviewHandler(
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

    const parsed = interviewCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "role and difficulty are required",
      });
    }

    const session = await generateInterviewSession({
      userId: req.userId,
      role: parsed.data.role,
      difficulty: parsed.data.difficulty,
    });

    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[controllers/interview.controller/createInterviewHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
