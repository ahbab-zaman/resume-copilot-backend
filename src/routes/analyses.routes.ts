import { Router } from "express";

import {
  createAnalysisHandler,
  downloadOptimizedResumeHandler,
  getAnalysisHandler,
  optimizeResumeHandler,
} from "../controllers/analyses.controller";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.post("/", verifyAuth, createAnalysisHandler);
router.get("/:id", verifyAuth, getAnalysisHandler);
router.post("/:id/optimize", verifyAuth, optimizeResumeHandler);
router.get("/:id/optimize/download", verifyAuth, downloadOptimizedResumeHandler);

export default router;
