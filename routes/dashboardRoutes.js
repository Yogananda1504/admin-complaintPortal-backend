import { getDashboardData } from "../controllers/DashboardController.js";
import { Router } from "express";
import protect from "../middlewares/protect.js";

const router = Router();

router.get("/",getDashboardData);

export default router