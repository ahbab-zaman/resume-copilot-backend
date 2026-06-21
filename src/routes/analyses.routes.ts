import { Router } from "express";

import {
  createAnalysisHandler,
  getAnalysisHandler,
} from "../controllers/analyses.controller";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.post("/", verifyAuth, createAnalysisHandler);
router.get("/:id", verifyAuth, getAnalysisHandler);

export default router;

