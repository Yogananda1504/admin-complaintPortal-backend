import AcademicComplaint from "../models/AcademicComplaint.js";
import mongoose from "mongoose";
import { Academic_logger as logger } from "../utils/logger.js";
export const academicDataController = async (req, res, next) => {
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
		const limit = parseInt(req.query.limit) || 20; // Default limit to 20 if not provided
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
			const lastComplaint = await AcademicComplaint.findById(lastSeenId).lean();
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
		const complaints = await AcademicComplaint.find(query)
			.sort({ createdAt: 1, _id: 1 }) // Sort by createdAt ascending and then _id ascending
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription attachments"
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
			category: "Academic",
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
export const academicComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;
		console.log("The id and status are : ", id, status);
		if (status.trim() !== "resolved" && status.trim() !== "viewed") {
			console.log(status);
			return res.status(400).json({ error: "Invalid status" });
		}
		let complaint;
		const update = {};
		if (status === "resolved") {
			update.status = "Resolved";
			complaint = await AcademicComplaint.findByIdAndUpdate(id, update, {
				new: true,
			});
			logger.info(
				`Admin resolved Academic complaint  ${id}  at ${
					new Date().toISOString.split("T")[0]
				}`
			);
		} else if (status === "viewed") {
			update.readStatus = "Viewed";
			complaint = await AcademicComplaint.findByIdAndUpdate(id, { ...update, resolvedAt: new Date() }, {
				new: true,
			});
			logger.info(
				`Admin viewed Academic complaint  ${id}  at ${
					new Date().toISOString().split("T")[0]
				}`
			);
		}

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

export const academicStatsController = async (req, res, next) => {
	try {
		const stats = await AcademicComplaint.aggregate([
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
