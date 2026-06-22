import { Router } from "express";

import {
  createApplicationHandler,
  deleteApplicationHandler,
  listApplicationsHandler,
  updateApplicationHandler,
} from "../controllers/applications.controller";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.get("/", verifyAuth, listApplicationsHandler);
router.post("/", verifyAuth, createApplicationHandler);
router.patch("/:id", verifyAuth, updateApplicationHandler);
router.delete("/:id", verifyAuth, deleteApplicationHandler);

export default router;
