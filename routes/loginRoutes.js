import { Router } from "express";
import  authController  from "../controllers/authController.js";
const router = Router();

router.post("/",authController);


export default router;