import hostelDataController from "../controllers/hostelDataController.js";
import { Router } from "express";
import protect from "../middlewares/protect.js";
import hostelComplaintStatusController from "../controllers/hostelComplaintStatusController.js";
import hostelStatsController from "../controllers/hostelStatsController.js";
const router = Router();

router.get("/",protect,hostelDataController);
router.get("/stats",protect,hostelStatsController);
router.post("/status",protect,hostelComplaintStatusController);
export default router;