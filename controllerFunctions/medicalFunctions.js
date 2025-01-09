import MedicalComplaint from "../models/MedicalComplaint.js";
import { Medical_logger as logger } from "../utils/logger.js";
import { checkActivityandProcess } from "../utils/email_automator.js";

export const calculateStats = async () => {
	const [result] = await MedicalComplaint.aggregate([
		{
			$group: {
				_id: null,
				totalComplaints: { $sum: 1 },
				resolvedComplaints: {
					$sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
				},
				unresolvedComplaints: {
					$sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
				},
				viewedComplaints: {
					$sum: { $cond: [{ $eq: ["$readStatus", "Viewed"] }, 1, 0] },
				},
				notViewedComplaints: {
					$sum: { $cond: [{ $eq: ["$readStatus", "Not viewed"] }, 1, 0] },
				},
			},
		},
	]);
	return result || {};
};

const validateDates = (startDate, endDate) => {
	const parseDate = (dateStr, defaultDate) => {
		const date = dateStr ? new Date(dateStr) : defaultDate;
		if (isNaN(date.getTime())) throw new Error("Invalid date format");
		return date;
	};

	return {
		start: parseDate(startDate, new Date(0)),
		end: parseDate(endDate, new Date()),
	};
};

export const medicalDataController = async (req, res, next) => {
	try {
		const filters = JSON.parse(req.query.filters || "{}");
		filters.scholarNumbers = filters.scholarNumbers.filter((num) =>
			/^\d{10}$/.test(num)
		);
		
		const { start: startDate, end: endDate } = validateDates(
			filters.startDate,
			filters.endDate
		);
		if (startDate > endDate)
			return res
				.status(400)
				.json({ error: "startDate must be before endDate" });

		const query = {
			createdAt: { $gte: startDate, $lte: endDate }, // Use validated endDate
			...(filters.complaintType && { complainType: filters.complaintType }),
			...(filters.scholarNumbers.length && {
				scholarNumber: { $in: filters.scholarNumbers },
			}),
			...(filters.readStatus && { readStatus: filters.readStatus }),
			...(filters.status && { status: filters.status }),
			...(filters.hostelNumber && { hostelNumber: filters.hostelNumber }),
		};

		console.log("\nThe query is : ", query, "\n");

		const limit = parseInt(req.query.limit) || 20;

		if (req.query.lastSeenId) {
			const lastComplaint = await MedicalComplaint.findById(
				req.query.lastSeenId
			).lean();
			if (!lastComplaint)
				return res.status(400).json({ error: "Invalid lastSeenId" });

			query.$or = [
				{ createdAt: { $gt: lastComplaint.createdAt } },
				{
					createdAt: lastComplaint.createdAt,
					_id: { $gt: req.query.lastSeenId },
				},
			];
		}

		const complaints = await MedicalComplaint.find(query)
			.sort({ createdAt: 1, _id: 1 }) 
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription attachments stream year  resolvedAt AdminRemarks AdminAttachments"
			)
			.lean();

		const nextLastSeenId =
			complaints.length === limit
				? complaints[complaints.length - 1]._id
				: null;

		return res.json({
			complaints: complaints.map((complaint) => ({
				...complaint,
				attachments: Array.isArray(complaint.attachments)
					? complaint.attachments.map((filePath) => ({
							url: `${req.protocol}://${req.get("host")}/${filePath}`,
					  }))
					: [],
				AdminAttachments: Array.isArray(complaint.AdminAttachments)
					? complaint.AdminAttachments.map((filePath) => ({
							url: `${req.protocol}://${req.get("host")}/${filePath}`,
					  }))
					: [],
				category: "Medical",
			})),
			nextLastSeenId,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error" });
	}
};



//Status will update the status like resolve or readStatus like viewed
export const medicalComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;

		if (!["resolved", "viewed"].includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		const update =
			status === "resolved"
				? { status: "Resolved", resolvedAt: new Date() }
				: { readStatus: "Viewed" };

		const complaint = await MedicalComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		if (status === "resolved") {
			await checkActivityandProcess({
				category: "medical",
				complaintId: id,
				activity: "resolved",
				complaint,
			});
		} else {
			await checkActivityandProcess({
				category: "medical",
				complaintId: id,
				activity: "viewed",
				complaint,
			});
		}

		logger.info(
			`Admin ${status} Medical complaint ${id} at ${
				new Date().toISOString().split("T")[0]
			}`
		);

		return res.json({ success: true, complaint });
	} catch (error) {
		console.error("Internal server error:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while updating complaint status",
		});
	}
};

export const medicalStatsController = async (req, res, next) => {
	try {
		const {
			totalComplaints = 0,
			resolvedComplaints = 0,
			unresolvedComplaints = 0,
			viewedComplaints = 0,
			notViewedComplaints = 0,
		} = await calculateStats();

		return res.status(200).json({
			success: true,
			totalComplaints,
			resolvedComplaints,
			unresolvedComplaints,
			viewedComplaints,
			notViewedComplaints,
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, message: "Error in fetching stats" });
	}
};

export const medicalRemarkController = async (req, res) => {
	try {
		const AdminAttachments = req.filePaths || [];
		const AdminRemarks = req.body.AdminRemarks;
		const id = req.body.complaintId;

		if (!id) {
			return res.status(400).json({ error: "Complaint ID is required" });
		}

		const update = {
			AdminRemarks: AdminRemarks,
			AdminAttachments: AdminAttachments,
			updatedAt: new Date(),
		};

		const complaint = await MedicalComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		logger.info(
			`Admin updated remarks for Medical complaint ${id} at ${new Date().toISOString()}`
		);
		res.json({ success: true, complaint });
	} catch (error) {
		logger.error(
			`Error updating remarks for Medical complaint: ${error.message}`
		);
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint remarks" });
	}
};
