import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../utils/httpError";
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
} from "../services/applications/applicationsService";

const applicationStatusSchema = z.enum([
  "applied",
  "screening",
  "interview",
  "rejected",
  "offer",
]);

const applicationCreateSchema = z.object({
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  status: applicationStatusSchema.optional(),
  appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().trim().nullable().optional(),
});

const applicationUpdateSchema = z
  .object({
    company: z.string().trim().min(1).optional(),
    role: z.string().trim().min(1).optional(),
    status: applicationStatusSchema.optional(),
    appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine(
    (value) =>
      typeof value.company === "string" ||
      typeof value.role === "string" ||
      typeof value.status === "string" ||
      typeof value.appliedDate === "string" ||
      value.notes !== undefined,
    {
      message: "At least one field is required",
    },
  );

const applicationIdSchema = z.string().uuid();

export async function listApplicationsHandler(
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

    const applications = await listApplications(req.userId);

    return res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error: unknown) {
    console.error(
      "[controllers/applications.controller/listApplicationsHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function createApplicationHandler(
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

    const parsed = applicationCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "company and role are required",
      });
    }

    const application = await createApplication({
      userId: req.userId,
      company: parsed.data.company,
      role: parsed.data.role,
      status: parsed.data.status,
      appliedDate: parsed.data.appliedDate,
      notes: parsed.data.notes ?? null,
    });

    return res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error(
      "[controllers/applications.controller/createApplicationHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function updateApplicationHandler(
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

    const applicationId = applicationIdSchema.safeParse(req.params.id);
    if (!applicationId.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid application id",
      });
    }

    const parsed = applicationUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "At least one field is required",
      });
    }

    const application = await updateApplication(
      req.userId,
      applicationId.data,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    console.error(
      "[controllers/applications.controller/updateApplicationHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function deleteApplicationHandler(
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

    const applicationId = applicationIdSchema.safeParse(req.params.id);
    if (!applicationId.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid application id",
      });
    }

    await deleteApplication(req.userId, applicationId.data);

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

    console.error(
      "[controllers/applications.controller/deleteApplicationHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
