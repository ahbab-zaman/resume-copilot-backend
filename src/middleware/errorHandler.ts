import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("[middleware/errorHandler]", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};
