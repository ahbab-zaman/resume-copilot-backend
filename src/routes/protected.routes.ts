import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.get("/", verifyAuth, (req, res) => {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired session",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      userId: req.userId,
    },
  });
});

export default router;
