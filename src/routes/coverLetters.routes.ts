import { Router } from "express";

import {
  downloadCoverLetterHandler,
  generateCoverLetterHandler,
} from "../controllers/coverLetters.controller";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.post("/:id/cover-letter", verifyAuth, generateCoverLetterHandler);
router.get("/:id/cover-letter/download", verifyAuth, downloadCoverLetterHandler);

export default router;
