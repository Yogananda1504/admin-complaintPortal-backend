
import { Router } from "express";
import protect from "../middlewares/protect.js";
import { DataController,StatsController,StatusController } from "../controllers/complaintController.js";
const router = Router();
//This give the complaints details in the paged format.
router.get("/get-complaints/:category",protect,DataController);
//This will give the quantitave number of the complaints.
router.get("/stats/:category",protect,StatsController);
//This will update the status of the complaints
router.post("/status/:category",protect,StatusController);
export default router;