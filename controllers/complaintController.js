import {
	hostelDataController,
	hostelComplaintStatusController,
	hostelStatsController,
} from "../controllerFunctions/hostelFunctions.js";
import {
	academicDataController,
	academicComplaintStatusController,
	academicStatsController,
} from "../controllerFunctions/academicFunctions.js";
import {
	administrationDataController,
	administrationComplaintStatusController,
	administrationStatsController,
} from "../controllerFunctions/administrationFunctions.js";
import {
	medicalDataController,
	medicalComplaintStatusController,
	medicalStatsController,
} from "../controllerFunctions/medicalFunctions.js";
// import {
// 	InfrastructureDataController,
// 	InfrastructureComplaintStatusController,
// 	InfrastructureStatsController,
// } from "../controllerFunctions/infrastructureFunctions.js";

import {
  DepartmentDataController,
  DepartmentComplaintStatusController,
  DepartmentStatsController,
} from "../controllerFunctions/InfRoleBasedFunctions.js";



import {
	raggingDataController,
	raggingComplaintStatusController,
	raggingStatsController,
} from "../controllerFunctions/raggingFunctions.js";

import {
	hostelRoleBasedDataController,
	hostelRoleBasedRemarkController,
	hostelRoleBasedStatsController,
	hostelRoleBasedStatusController
} from "../controllerFunctions/hostelRoleBasedFunctions.js";

export const DataController = async (req, res, next) => {
    console.log(req.query)
	try {
		const category = req.params.category.trim();
		console.log("Category is : ", category);
		if (category === "hostel") {
			await hostelRoleBasedDataController(req, res, next);
		} else if (category === "academic") {
			await academicDataController(req, res, next);
		} else if (category === "medical") {
			await medicalDataController(req, res, next);
		} else if (category === "ragging") {
			await raggingDataController(req, res, next);
		} else if (category === "infrastructure") {
			await DepartmentDataController(req, res, next);
		} else if (category === "administration") {
			await administrationDataController(req, res, next);
		} else {
			return res.status(400).json({ message: "Invalid Category !!!" });
		}

	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const StatusController = async (req, res, next) => {
	try {
		const category = req.params.category.toLowerCase();
		console.log("Upating the status of the complaint as : ",req.body.status);
		if (category == "hostel") {
			await hostelRoleBasedStatusController(req, res, next);
		} else if (category === "academic") {
			await academicComplaintStatusController(req, res, next);
		} else if (category === "medical") {
			await medicalComplaintStatusController(req, res, next);
		} else if (category === "ragging") {
			await raggingComplaintStatusController(req, res, next);
		} else if (category === "infrastructure") {
			await DepartmentComplaintStatusController(req, res, next);
		} else if (category === "administration") {
			await administrationComplaintStatusController(req, res, next);
		} else {
			return res.status(400).json({ message: "Invalid Category !!!" });
		}
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const StatsController = async (req, res, next) => {
	try {
		const category = req.params.category;
		if (category === "hostel") {
			await hostelRoleBasedStatsController(req, res, next);
		} else if (category === "academic") {
			await academicStatsController(req, res, next);
		} else if (category === "medical") {
			await medicalStatsController(req, res, next);
		} else if (category === "ragging") {
			await raggingStatsController(req, res, next);
		} else if (category === "infrastructure") {
			await DepartmentStatsController(req, res, next);
		} else if (category === "administration") {
			await administrationStatsController(req, res, next);
		} else {
			return res.status(400).json({ message: "Invalid Category !!!" });
		}
	} catch (error) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
