import HostelComplaint from "../models/HostelComplaints.js";
import { Hostel_logger as logger } from "../utils/logger.js";
import { checkActivityandProcess } from "../utils/email_automator.js";
// Moved stats calculation to a more efficient single aggregation
export const calculateStats = async () => {
	const [result] = await HostelComplaint.aggregate([
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

// Helper function for date validation
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

export const hostelDataController = async (req, res) => {
	try {
		const filters = JSON.parse(req.query.filters || "{}");
		filters.scholarNumbers = filters.scholarNumbers.filter((num) =>
			/^\d{10}$/.test(num)
		);
		console.log("Initiated the hostelDataController\n");

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

		console.log("\nThe query is : ", query,"\n");

		const limit = parseInt(req.query.limit) || 20;

		if (req.query.lastSeenId) {
			const lastComplaint = await HostelComplaint.findById(
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

		const complaints = await HostelComplaint.find(query)
			.sort({  _id: 1 })
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription room hostelNumber attachments AdminRemarks AdminAttachments resolvedAt"
			)
			.lean();
		console.log(complaints);
		console.log("\n", complaints.length);

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
				category: "Hostel",
			})),
			nextLastSeenId,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const hostelComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;
		if (!["resolved", "viewed"].includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		const update =
			status === "resolved"
				? { status: "Resolved", resolvedAt: new Date() }
				: { readStatus: "Viewed" };

		const complaint = await HostelComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});
		if (!complaint)
			return res.status(404).json({ error: "Complaint not found" });
		if (status === "resolved") {
			await checkActivityandProcess({
				category: "hostel",
				complaintId: id,
				activity: "resolved",
				complaint,
			});
		} else {
			await checkActivityandProcess({
				category: "hostel",
				complaintId: id,
				activity: "viewed",
				complaint,
			});
		}

		//I need to create a which will take the complaint of the complaint and then forwards the viewing resolution of the complaint to  the student
		logger.info(
			`Admin ${status} Hostel complaint ${id} at ${
				new Date().toISOString().split("T")[0]
			}`
		);
		res.json({ success: true, complaint });
	} catch (error) {
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint status" });
	}
};

export const hostelStatsController = async (req, res) => {
	try {
		const stats = await calculateStats();
		res.status(200).json({ success: true, ...stats });
	} catch (err) {
		res
			.status(500)
			.json({ success: false, message: "Error in fetching stats" });
	}
};

export const hostelRemarkController = async (req, res) => {
	try {
		const AdminAttachments = req.filePaths || [];
		console.log(req.body);
		const AdminRemarks = req.body.AdminRemarks;
		const id = req.body.id;

		if (!id) {
			return res.status(400).json({ error: "Complaint ID is required" });
		}
        
		const update = {
			AdminRemarks: AdminRemarks,
			AdminAttachments: AdminAttachments,
		};

		const complaint = await HostelComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});

		console.log(complaint);

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		logger.info(
			`Admin updated remarks for Hostel complaint ${id} at ${new Date().toISOString()}`
		);
		res.json({ success: true, complaint });
	} catch (error) {
		logger.error(
			`Error updating remarks for Hostel complaint: ${error.message}`
		);
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint remarks" });
	}
};

