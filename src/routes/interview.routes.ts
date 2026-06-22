import { Router } from "express";

import { createInterviewHandler } from "../controllers/interview.controller";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.post("/", verifyAuth, createInterviewHandler);

export default router;
