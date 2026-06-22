import { Router } from "express";

import {
  getDashboardActivityHandler,
  getDashboardStatsHandler,
} from "../controllers/dashboard.controller";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.get("/stats", verifyAuth, getDashboardStatsHandler);
router.get("/activity", verifyAuth, getDashboardActivityHandler);

export default router;
