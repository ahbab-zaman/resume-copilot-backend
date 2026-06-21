import { Router } from "express";

import {
  createResumeHandler,
  deleteResumeHandler,
  getResumesHandler,
  patchResumeHandler,
} from "../controllers/resumes.controller";
import { verifyAuth } from "../middleware/verifyAuth";
import { uploadResumePdf } from "../middleware/uploadResume";

const router = Router();

router.get("/", verifyAuth, getResumesHandler);
router.post("/", verifyAuth, uploadResumePdf, createResumeHandler);
router.patch("/:id", verifyAuth, patchResumeHandler);
router.delete("/:id", verifyAuth, deleteResumeHandler);

export default router;
