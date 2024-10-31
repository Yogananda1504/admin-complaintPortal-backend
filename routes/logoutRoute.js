import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
const router = Router();

router.post("/", protect , (req, res) => {
try {
    res.clearCookie("jwt");
    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
} catch (error) {
    console.log('Internal server error : '+ error);
    res.status(500).json({
        success: false,
        message: "An error occurred while logging out",
       
    });
}
});