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
import {
	InfrastructureDataController,
	InfrastructureComplaintStatusController,
	InfrastructureStatsController,
} from "../controllerFunctions/infrastructureFunctions.js";
import {
	raggingDataController,
	raggingComplaintStatusController,
	raggingStatsController,
} from "../controllerFunctions/raggingFunctions.js";

export const DataController = async (req, res, next) => {
    console.log(req.query)
	try {
		const category = req.params.category;
		if (category === "hostel") {
			await hostelDataController(req, res, next);
		} else if (category === "academic") {
			await academicDataController(req, res, next);
		} else if (category === "medical") {
			await medicalDataController(req, res, next);
		} else if (category === "ragging") {
			await raggingDataController(req, res, next);
		} else if (category === "infrastructure") {
			await InfrastructureDataController(req, res, next);
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
		const category = req.params.category;
		console.log("Upating the status of the complaint as : ",req.body.status);
		if (category == "hostel") {
			await hostelComplaintStatusController(req, res, next);
		} else if (category === "academic") {
			await academicComplaintStatusController(req, res, next);
		} else if (category === "medical") {
			await medicalComplaintStatusController(req, res, next);
		} else if (category === "ragging") {
			await raggingComplaintStatusController(req, res, next);
		} else if (category === "infrastructure") {
			await InfrastructureComplaintStatusController(req, res, next);
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
			await hostelStatsController(req, res, next);
		} else if (category === "academic") {
			await academicStatsController(req, res, next);
		} else if (category === "medical") {
			await medicalStatsController(req, res, next);
		} else if (category === "ragging") {
			await raggingStatsController(req, res, next);
		} else if (category === "infrastructure") {
			await InfrastructureStatsController(req, res, next);
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
