import InfrastructureComplaint from "../models/InfrastructureComplaint.js";
import { checkActivityandProcess } from "../utils/email_automator.js";
import { Infrastructure_logger as logger } from "../utils/logger.js";

export const calculateStats = async () => {
	const [result] = await InfrastructureComplaint.aggregate([
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

export const InfrastructureDataController = async (req, res) => {
	try {
		console.log(req.query);
		const filtersString = req.query.filters || "{}";
		const filters = JSON.parse(filtersString);
		filters.scholarNumbers = filters.scholarNumbers.filter((num) =>
			/^\d{10}$/.test(num)
		);

		let filters_check = false;
		// Helper function to parse and validate dates
		const parseDate = (dateStr, defaultDate) => {
			const date = dateStr ? new Date(dateStr) : defaultDate;
			console.log("parsed date is : ", date);
			if (isNaN(date.getTime())) {
				throw new Error("Invalid date format");
			}
			return date;
		};

		// Parse startDate and endDate from filters
		let startDate = parseDate(filters.startDate, new Date(0));
		let endDate = parseDate(filters.endDate, new Date());
		if (startDate > endDate) {
			return res
				.status(400)
				.json({ error: "startDate must be before endDate" });
		}

		// Parse pagination parameters
		const limit = parseInt(req.query.limit) || 5; // Default limit to 20 if not provided
		const lastSeenId = req.query.lastSeenId;

		// Build the base query
		const query = {
			createdAt: { $gte: startDate, $lte: endDate },
		};

		// Apply additional filters
		if (filters.complaintType) {
			query.complainType = filters.complaintType;
		}

		if (filters.scholarNumbers.length > 0) {
			query.scholarNumber = { $in: filters.scholarNumbers };
		}

		if (filters.readStatus) {
			query.readStatus = filters.readStatus;
		}

		if (filters.status) {
			query.status = filters.status;
		}

		if (filters.hostelNumber) {
			query.hostelNumber = filters.hostelNumber;
		}

		// If lastSeenId is provided, adjust the query for pagination
		if (lastSeenId) {
			const lastComplaint = await InfrastructureComplaint.findById(
				lastSeenId
			).lean();
			if (!lastComplaint) {
				return res.status(400).json({ error: "Invalid lastSeenId" });
			}
			const lastCreatedAt = lastComplaint.createdAt;
			query.$or = [
				{ createdAt: { $gt: lastCreatedAt } },
				{ createdAt: lastCreatedAt, _id: { $gt: lastSeenId } },
			];
		}
		console.log("\nQuery is  :  ", query);

		// Fetch complaints based on the query with pagination
		const complaints = await InfrastructureComplaint.find(query)
			.sort({ createdAt: 1, _id: 1 }) // Sort by createdAt ascending and then _id ascending
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription attachments landmark"
			)
			.lean();

		// Determine the nextLastSeenId for pagination
		let nextLastSeenId = null;
		if (complaints.length === limit) {
			const lastComplaint = complaints[complaints.length - 1];
			nextLastSeenId = lastComplaint._id;
		}

		console.log("Complaints fetched:", complaints.length);

		// Map attachments to accessible URLs
		const complaintsWithUrls = complaints.map((complaint) => ({
			...complaint,
			attachments: Array.isArray(complaint.attachments)
				? complaint.attachments.map((filePath) => ({
						url: `${req.protocol}://${req.get("host")}/${filePath}`,
				  }))
				: [],
			category: "Infrastructure",
		}));

		return res.json({
			complaints: complaintsWithUrls,
			nextLastSeenId,
		});
	} catch (error) {
		console.error("Error fetching complaints:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

//Status will update the status like resolve or readStatus like viewed
export const InfrastructureComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;
		const validStatuses = {
			resolved: { field: "status", value: "Resolved" },
			viewed: { field: "readStatus", value: "Viewed" },
		};

		if (!validStatuses[status]) {
			return res
				.status(400)
				.json({ error: "Invalid status. Must be 'resolved' or 'viewed'" });
		}

		const update = {
			[validStatuses[status].field]: validStatuses[status].value,
			...(status === "resolved" && { resolvedAt: new Date() }),
		};

		const complaint = await InfrastructureComplaint.findByIdAndUpdate(
			id,
			update,
			{ new: true }
		);

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}
		
		if (status === "resolved") {
			await checkActivityandProcess({
				category: "infrastructure",
				complaintId: id,
				activity: "resolved",
				complaint,
			});
		} else {
			await checkActivityandProcess({
				category: "infrastructure",
				complaintId: id,
				activity: "viewed",
				complaint,
			});
		}

		

		logger.info(
			`Admin ${status} Infrastructure complaint ${id} at ${
				new Date().toISOString().split("T")[0]
			}`
		);

		return res.json({ success: true, complaint });
	} catch (error) {
		logger.error(`Error updating complaint status: ${error.message}`);
		return res.status(500).json({
			success: false,
			message: "An error occurred while updating complaint status",
		});
	}
};

export const InfrastructureStatsController = async (req, res, next) => {
	try {
		const stats = await calculateStats();

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
