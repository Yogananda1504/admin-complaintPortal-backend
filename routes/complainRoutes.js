import { Router } from "express";
import protect from "../middlewares/protect.js";
import { DataController,StatsController,StatusController } from "../controllers/complaintController.js";
import handleFileUpload from "../middlewares/uploadFile.js";
import { RemarksController } from "../controllers/RemarksController.js";

const router = Router();
//This give the complaints details in the paged format. This is in case of the admin
router.get("/get-complaints/:category",protect,DataController);
// Role based  Route
router.get("/get-complaints/:category/:role",protect,DataController);
//This will give the quantitave number of the complaints.
router.get("/stats/:category",protect,StatsController);
//This will update the status of the complaints
router.put("/status/:category",protect,StatusController);
//This will update the remarks of the complaints by the admin
router.put("/remarks/:category",protect,handleFileUpload,RemarksController);
export default router;