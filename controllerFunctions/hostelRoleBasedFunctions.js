import HostelComplaint from "../models/HostelComplaints.js";
import { Hostel_logger as logger } from "../utils/logger.js";
import { checkActivityandProcess } from "../utils/email_automator.js";

const calculateStatsForHostel = async (hostelNumber1 = null) => {
	const pipeline = [];
	console.log(
		"The user has requested for the stats of the hostel : ",
		hostelNumber1
	);
	if (hostelNumber1 !== null) {
		pipeline.push({ $match: { hostelNumber: `H${hostelNumber1}` } });
	}
	pipeline.push({
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
	});
	const [result] = await HostelComplaint.aggregate(pipeline);
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

const getHostelNumberFromRole = (role) => {
	if (role === "cow") return null;
	return role.substring(1);
};

const mapAttachments = (paths, req) =>
	Array.isArray(paths)
		? paths.map((filePath) => ({
				url: `${req.protocol}://${req.get("host")}/${filePath}`,
		  }))
		: [];

export const hostelRoleBasedDataController = async (req, res) => {
	try {
		let role = req.role;
		if (role === "admin") role = "cow";
		const hostelNumber = getHostelNumberFromRole(role);

		if (!role.startsWith("H") && role !== "cow") {
			return res.status(403).json({ error: "Unauthorized access" });
		}

		const { filters: filtersStr = "{}", limit: qLimit, lastSeenId } = req.query;
		const filters = JSON.parse(filtersStr);
		if (filters.scholarNumbers) {
			filters.scholarNumbers = filters.scholarNumbers.filter((num) =>
				/^\d{10}$/.test(num)
			);
		} else {
			filters.scholarNumbers = [];
		}

		const { start: startDate, end: endDate } = validateDates(
			filters.startDate,
			filters.endDate
		);
		if (startDate > endDate) {
			return res
				.status(400)
				.json({ error: "startDate must be before endDate" });
		}

		const query = {
			createdAt: { $gte: startDate, $lte: endDate },
			...(filters.complaintType && { complainType: filters.complaintType }),
			...(filters.scholarNumbers.length && {
				scholarNumber: { $in: filters.scholarNumbers },
			}),
			...(filters.readStatus && { readStatus: filters.readStatus }),
			...(filters.status && { status: filters.status }),
			// Apply hostel restriction for roles H1, H2, H3, H4, H5
			...([
				"H1",
				"H2",
				"H3",
				"H4",
				"H5",
				"H6",
				"H7",
				"H8",
				"H9",
				"H10",
				"H11",
				"H12",
			].includes(role) && {
				hostelNumber: role,
			}),
			...(filters.hostelNumber &&
				role === "cow" && { hostelNumber: filters.hostelNumber }),
		};

		logger.info("User query:", query);

		const limit = parseInt(qLimit) || 20;

		if (lastSeenId) {
			const lastComplaint = await HostelComplaint.findById(lastSeenId).lean();
			if (!lastComplaint)
				return res.status(400).json({ error: "Invalid lastSeenId" });

			query.$or = [
				{ createdAt: { $gt: lastComplaint.createdAt } },
				{
					createdAt: lastComplaint.createdAt,
					_id: { $gt: lastSeenId },
				},
			];
		}

		const complaints = await HostelComplaint.find(query)
			.sort({ _id: 1 })
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription room hostelNumber attachments AdminRemarks AdminAttachments resolvedAt"
			)
			.lean();
		logger.info("Complaints for role", role, complaints);

		const nextLastSeenId =
			complaints.length === limit
				? complaints[complaints.length - 1]._id
				: null;

		return res.json({
			complaints: complaints.map((complaint) => ({
				...complaint,
				attachments: mapAttachments(complaint.attachments, req),
				AdminAttachments: mapAttachments(complaint.AdminAttachments, req),
				category: "Hostel",
			})),
			nextLastSeenId,
		});
	} catch (error) {
		logger.error(error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const hostelRoleBasedStatusController = async (req, res) => {
	try {
		let role = req.role;
		if (role === "admin") role = "cow";
		const { id, status } = req.body;
		const hostelNumber = getHostelNumberFromRole(role);

		const complaint = await HostelComplaint.findById(id);
		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		// Check authorization
		if (
			role !== "cow" &&
			complaint.hostelNumber.substring(1) !== hostelNumber
		) {
			return res.status(403).json({ error: "Unauthorized access" });
		}

		if (!["resolved", "viewed"].includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		const update =
			status === "resolved"
				? { status: "Resolved", resolvedAt: new Date() }
				: { readStatus: "Viewed" };

		const updatedComplaint = await HostelComplaint.findByIdAndUpdate(
			id,
			update,
			{ new: true }
		);

		await checkActivityandProcess({
			category: "hostel",
			complaintId: id,
			activity: status,
			complaint: updatedComplaint,
		});

		logger.info(
			`${role} ${status} Hostel complaint ${id} at ${new Date().toISOString()}`
		);
		res.json({ success: true, complaint: updatedComplaint });
	} catch (error) {
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint status" });
	}
};

export const hostelRoleBasedStatsController = async (req, res) => {
	try {
		let role = req.role;
		if (role === "admin") role = "cow";
		const hostelNumber = getHostelNumberFromRole(role);
		const stats = await calculateStatsForHostel(hostelNumber);
		res.status(200).json({ success: true, ...stats });
	} catch (err) {
		res
			.status(500)
			.json({ success: false, message: "Error in fetching stats" });
	}
};

export const hostelRoleBasedRemarkController = async (req, res) => {
	try {
		let role = req.role;
		if (role === "admin") role = "cow";
		const hostelNumber = getHostelNumberFromRole(role);
		const AdminAttachments = req.filePaths || [];
		const { AdminRemarks, id } = req.body;

		if (!id) {
			return res.status(400).json({ error: "Complaint ID is required" });
		}

		const complaint = await HostelComplaint.findById(id);
		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		// Check authorization - updated for consistent hostel number comparison.
		if (
			role !== "cow" &&
			complaint.hostelNumber.substring(1) !== hostelNumber
		) {
			return res.status(403).json({ error: "Unauthorized access" });
		}

		const update = {
			AdminRemarks,
			AdminAttachments,
		};

		const updatedComplaint = await HostelComplaint.findByIdAndUpdate(
			id,
			update,
			{ new: true }
		);

		logger.info(
			`${role} updated remarks for Hostel complaint ${id} at ${new Date().toISOString()}`
		);
		res.json({ success: true, complaint: updatedComplaint });
	} catch (error) {
		logger.error(
			`Error updating remarks for Hostel complaint: ${error.message}`
		);
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint remarks" });
	}
};
