import AcademicComplaint from "../models/AcademicComplaint.js";
import { Academic_logger as logger } from "../utils/logger.js";
import { checkActivityandProcess } from "../utils/email_automator.js";//For the mailing purpose

export const calculateStats = async () => {
	const [result] = await AcademicComplaint.aggregate([
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

export const academicDataController = async (req, res) => {
	try {
		const filters = JSON.parse(req.query.filters || "{}");
		filters.scholarNumbers = (filters.scholarNumbers || []).filter((num) =>
			/^\d{10}$/.test(num)
		);

		const parseDate = (dateStr, defaultDate) => {
			const d = dateStr ? new Date(dateStr) : defaultDate;
			if (isNaN(d.getTime())) throw new Error("Invalid date format");
			return d;
		};

		const startDate = parseDate(filters.startDate, new Date(0));
		const endDate = parseDate(filters.endDate, new Date());
		if (startDate > endDate) {
			return res.status(400).json({ error: "startDate must be before endDate" });
		}

		const limit = parseInt(req.query.limit) || 20;
		const lastSeenId = req.query.lastSeenId;

		const query = {
			createdAt: { $gte: startDate, $lte: endDate },
		};
		if (filters.complaintType) query.complainType = filters.complaintType;
		if (filters.scholarNumbers?.length) {
			query.scholarNumber = { $in: filters.scholarNumbers };
		}
		if (filters.readStatus) query.readStatus = filters.readStatus;
		if (filters.status) query.status = filters.status;
		if (filters.hostelNumber) query.hostelNumber = filters.hostelNumber;

		if (lastSeenId) {
			const lastComplaint = await AcademicComplaint.findById(lastSeenId).lean();
			if (!lastComplaint) {
				return res.status(400).json({ error: "Invalid lastSeenId" });
			}
			query.$or = [
				{ createdAt: { $gt: lastComplaint.createdAt } },
				{ createdAt: lastComplaint.createdAt, _id: { $gt: lastSeenId } },
			];
		}

		const complaints = await AcademicComplaint.find(query)
			.sort({ createdAt: 1, _id: 1 })
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription attachments department stream year"
			)
			.lean();

		const nextLastSeenId =
			complaints.length === limit ? complaints[complaints.length - 1]._id : null;

		const complaintsWithUrls = complaints.map((c) => ({
			...c,
			attachments: Array.isArray(c.attachments)
				? c.attachments.map((path) => ({
						url: `${req.protocol}://${req.get("host")}/${path}`,
					}))
				: [],
			category: "Academic",
		}));

		return res.json({ complaints: complaintsWithUrls, nextLastSeenId });
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const academicComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;
		const normalizedStatus = status.trim().toLowerCase();

		if (!["resolved", "viewed"].includes(normalizedStatus)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		const update = {
			...(normalizedStatus === "resolved" 
				? { status: "Resolved" } 
				: { readStatus: "Viewed", resolvedAt: new Date() })
		};

		const complaint = await AcademicComplaint.findByIdAndUpdate(id, update, { new: true });
		
		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		await checkActivityandProcess({
			category: "academic",
			complaintId: id,
			activity: normalizedStatus,
			complaint
		});

		logger.info(
			`Admin ${normalizedStatus} Academic complaint ${id} on ${new Date().toISOString().split("T")[0]}`
		);

		return res.json({ success: true, complaint });
	} catch (error) {
		return res.status(500).json({ 
			success: false, 
			message: "Error updating complaint status" 
		});
	}
};

export const academicStatsController = async (req, res) => {
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
		return res.status(500).json({ success: false, message: "Error in fetching stats" });
	}
};
