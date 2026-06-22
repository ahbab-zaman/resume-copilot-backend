import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import analysesRoutes from "./routes/analyses.routes";
import coverLettersRoutes from "./routes/coverLetters.routes";
import healthRoutes from "./routes/health.routes";
import protectedRoutes from "./routes/protected.routes";
import resumeRoutes from "./routes/resumes.routes";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/health", healthRoutes);
  app.use("/api/protected", protectedRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api/analyses", analysesRoutes);
  app.use("/api/analyses", coverLettersRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  app.use(errorHandler);

  return app;
}

export const app = createApp();
