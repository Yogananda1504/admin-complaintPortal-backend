import { hostelRemarkController } from "../controllerFunctions/hostelFunctions.js";
import { academicRemarkController } from "../controllerFunctions/academicFunctions.js";
import { administrationRemarkController } from "../controllerFunctions/administrationFunctions.js";
import { raggingRemarkController } from "../controllerFunctions/raggingFunctions.js";
import { medicalRemarkController } from "../controllerFunctions/medicalFunctions.js";
import {departmentRemarkController } from "../controllerFunctions/InfRoleBasedFunctions.js";
import { hostelRoleBasedRemarkController } from "../controllerFunctions/hostelRoleBasedFunctions.js";

export const RemarksController = async (req, res) => {
	try {
		const category  = req.params.category.toLowerCase();  
        console.log("Remarks Category : ",category);
		if (category === "hostel") {
			await hostelRoleBasedRemarkController(req, res);
		} else if (category === "academic") {
			await academicRemarkController(req, res);
		} else if (category === "administration") {
			await administrationRemarkController(req, res);
		} else if (category === "ragging") {
			await raggingRemarkController(req, res);
		} else if (category === "medical") {
			await medicalRemarkController(req, res);
		} else if (category === "infrastructure") {
			await departmentRemarkController(req, res);
		} else {
            console.log("Invalid Category : " ,category);
			return res.status(400).json({
				success: false,
				message: "Invalid category",
			});
		}
	} catch (error) {
		console.error("Internal server error:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while updating complaint status",
		});
	}
};
