import { Router } from "express";
import protect from "../middlewares/protect.js";
import { serve_complaint,serve_logs } from "../controllers/utilityController.js";
const router = Router();

// The main purpose of this file is to serve the log files for the Respective Categories

router.get("/:category", protect, serve_complaint);
router.post("/log/:category", protect, serve_logs);

export default router;