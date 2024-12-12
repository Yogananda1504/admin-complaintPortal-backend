import MedicalComplaint from "../models/MedicalComplaint.js";

export const medicalDataController = async (req, res, next) => {
	try {
		const limit = 30; // Fixed limit of 30 complaints per page

		// Parse and validate startDate
		const startDate = req.query.startDate
			? new Date(req.query.startDate)
			: new Date(0);
		if (isNaN(startDate.getTime())) {
			return res.status(400).json({ error: "Invalid startDate format" });
		}

		// Parse and validate endDate
		const endDate = req.query.endDate
			? new Date(req.query.endDate)
			: new Date();
		if (isNaN(endDate.getTime())) {
			return res.status(400).json({ error: "Invalid endDate format" });
		}

		// Ensure startDate is before endDate
		if (startDate > endDate) {
			return res
				.status(400)
				.json({ error: "startDate must be before endDate" });
		}

		// Parse lastSeenDate and lastSeenId for pagination
		const lastSeenDate = req.query.lastSeenDate
			? new Date(req.query.lastSeenDate)
			: null;
		const lastSeenId = req.query.lastSeenId
			? new mongoose.Types.ObjectId(req.query.lastSeenId)
			: null;

		const query = {
			createdAt: { $gte: startDate, $lte: endDate },
		};

		// Include cursor-based pagination criteria
		if (lastSeenDate && lastSeenId) {
			query.$or = [
				{ createdAt: { $gt: lastSeenDate } },
				{ createdAt: lastSeenDate, _id: { $gt: lastSeenId } },
			];
		}

		const complaints = await MedicalComplaint.find(query)
			.sort({ createdAt: 1, _id: 1 })
			.limit(limit)
			.select(
				"scholarNumber studentName hostelNumber complainType createdAt status"
			)
			.lean();

		// Prepare cursor information for the next page
		let nextLastSeenDate = null;
		let nextLastSeenId = null;
		if (complaints.length > 0) {
			const lastComplaint = complaints[complaints.length - 1];
			nextLastSeenDate = lastComplaint.createdAt;
			nextLastSeenId = lastComplaint._id;
		}

		return res.json({
			complaints,
			pagination: {
				nextLastSeenDate,
				nextLastSeenId,
			},
		});
	} catch (error) {
		console.error("Error fetching complaints:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

//Status will update the status like resolve or readStatus like viewed
export const medicalComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;

		if (status !== "Resolved" && status !== "Viewed") {
			return res.status(400).json({ error: "Invalid status" });
		}

		const update = {};
		if (status === "Resolved") {
			update.status = "Resolved";
		} else if (status === "Viewed") {
			update.readStatus = "Viewed";
		}

		const complaint = await MedicalComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});
		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		res.json({ success: true, complaint });
	} catch (error) {
		console.error("Internal server error:", error);
		res.status(500).json({
			success: false,
			message: "An error occurred while updating complaint status",
		});
	}
};

export const medicalStatsController = async (req, res, next) => {
	try {
		const stats = await MedicalComplaint.aggregate([
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

		const {
			totalComplaints = 0,
			resolvedComplaints = 0,
			unresolvedComplaints = 0,
			viewedComplaints = 0,
			notViewedComplaints = 0,
		} = stats.length > 0 ? stats[0] : {};

		res.status(200).json({
			success: true,
			totalComplaints,
			resolvedComplaints,
			unresolvedComplaints,
			viewedComplaints,
			notViewedComplaints,
		});
	} catch (err) {
		console.error("Error fetching stats:", err);
		res.status(500).json({
			success: false,
			message: "Error in fetching stats",
		});
	}
};
