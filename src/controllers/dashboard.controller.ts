import type { Request, Response } from "express";

import { getDashboardActivity, getDashboardStats } from "../services/dashboard/dashboardService";

export async function getDashboardStatsHandler(
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

    const stats = await getDashboardStats(req.userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.error("[controllers/dashboard.controller/getDashboardStatsHandler]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function getDashboardActivityHandler(
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

    const activity = await getDashboardActivity(req.userId);

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error: unknown) {
    console.error(
      "[controllers/dashboard.controller/getDashboardActivityHandler]",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
