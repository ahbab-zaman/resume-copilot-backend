import type { ErrorRequestHandler } from "express";
import { MulterError } from "multer";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("[middleware/errorHandler]", error);

  if (
    (error instanceof MulterError &&
      (error.code === "LIMIT_FILE_SIZE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")) ||
    (error instanceof Error &&
      (error.message === "Only PDF files are allowed" ||
        error.message === "File too large"))
  ) {
    res.status(400).json({
      success: false,
      error:
        error instanceof MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "The PDF file is too large. Maximum size is 5MB."
          : error.message === "File too large"
          ? "The PDF file is too large. Maximum size is 5MB."
          : error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};
