import { hostelRemarkController } from "../controllerFunctions/hostelFunctions.js";
import { academicRemarkController } from "../controllerFunctions/academicFunctions.js";
import { administrationRemarkController } from "../controllerFunctions/administrationFunctions.js";
import { raggingRemarkController } from "../controllerFunctions/raggingFunctions.js";
import { medicalRemarkController } from "../controllerFunctions/medicalFunctions.js";
import { infrastructureRemarkController } from "../controllerFunctions/infrastructureFunctions.js";

export const RemarksController = async (req, res) => {
	try {
		const category  = req.params.category;  
        console.log(category);
		if (category === "hostel") {
			await hostelRemarkController(req, res);
		} else if (category === "academic") {
			await academicRemarkController(req, res);
		} else if (category === "administration") {
			await administrationRemarkController(req, res);
		} else if (category === "ragging") {
			await raggingRemarkController(req, res);
		} else if (category === "medical") {
			await medicalRemarkController(req, res);
		} else if (category === "infrastructure") {
			await infrastructureRemarkController(req, res);
		} else {
            console.log(category);
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
