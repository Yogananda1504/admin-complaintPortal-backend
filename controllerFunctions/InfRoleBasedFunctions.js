import InfrastructureComplaint from "../models/InfrastructureComplaint.js";
import { checkActivityandProcess } from "../utils/email_automator.js";
import { Network_logger } from "../utils/logger.js";
import { Electricity_logger } from "../utils/logger.js";

// Add helper function to select logger based on role
const getLogger = (role) => {
    if (role === "electric_admin") return Electricity_logger;
    if(role === "internet_admin") return Network_logger;
    // network_admin and fallback
    return Network_logger;
};

const getComplainTypeFromRole = (role) => {
	const roleToComplaintType = {
		internet_admin: "Internet",
		electric_admin: "Electricity",
		
	};
	if (role === "admin") return null;
	return roleToComplaintType[role] || null;
};

export const calculateDepartmentStats = async (role) => {
	if (role === "admin") {
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
	}

	const complainType = getComplainTypeFromRole(role);
	if (!complainType) throw new Error("Invalid role");

	const [result] = await InfrastructureComplaint.aggregate([
		{
			$match: { complainType },
		},
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

export const DepartmentDataController = async (req, res) => {
    try {
        const role = req.role;
        console.log("\nrole: ",role,"\n")
        const complainType = getComplainTypeFromRole(role);

        if (!complainType && role !== "admin") {
            console.log("\nUnauthorized access\n");
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const filters = JSON.parse(req.query.filters || "{}");
        console.log("Applied filters:", filters);

        filters.scholarNumbers = filters.scholarNumbers.filter((num) =>
            /^\d{10}$/.test(num)
        );

        const { start: startDate, end: endDate } = validateDates(
            filters.startDate,
            filters.endDate
        );
        if (startDate > endDate) {
            return res.status(400).json({ error: "startDate must be before endDate" });
        }

        const query = {
            createdAt: { $gte: startDate, $lte: endDate },
            ...(filters.scholarNumbers.length && {
                scholarNumber: { $in: filters.scholarNumbers },
            }),
            ...(filters.readStatus && { readStatus: filters.readStatus }),
            ...(filters.status && { status: filters.status }),
        };

        if (role !== "admin") {
            query.complainType = complainType;
        }

        const limit = parseInt(req.query.limit) || 20;

        if (req.query.lastSeenId) {
            const lastComplaint = await InfrastructureComplaint.findById(
                req.query.lastSeenId
            ).lean();
            if (!lastComplaint) {
                return res.status(400).json({ error: "Invalid lastSeenId" });
            }

            query.$or = [
                { createdAt: { $gt: lastComplaint.createdAt } },
                {
                    createdAt: lastComplaint.createdAt,
                    _id: { $gt: req.query.lastSeenId },
                },
            ];
        }

        const complaints = await InfrastructureComplaint.find(query)
            .sort({ createdAt: 1, _id: 1 })
            .limit(limit)
            .select("scholarNumber studentName complainType createdAt status readStatus complainDescription attachments resolvedAt AdminRemarks AdminAttachments landmark")
            .lean();

        const nextLastSeenId = complaints.length === limit
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
                category: "Infrastructure",
            })),
            nextLastSeenId,
        });
    } catch (error) {
        getLogger(req.role).error(`Error fetching department data: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const DepartmentComplaintStatusController = async (req, res) => {
    try {
        const { id, status } = req.body;
        const role = req.role;
        const complainType = getComplainTypeFromRole(role);

        if (!complainType && role !== "admin") {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const validStatuses = {
            resolved: { field: "status", value: "Resolved" },
            viewed: { field: "readStatus", value: "Viewed" },
        };

        if (!validStatuses[status]) {
            return res.status(400).json({ error: "Invalid status. Must be 'resolved' or 'viewed'" });
        }

        let complaint;
        if (role === "admin") {
            complaint = await InfrastructureComplaint.findOneAndUpdate(
                { _id: id },
                {
                    [validStatuses[status].field]: validStatuses[status].value,
                    ...(status === "resolved" && { resolvedAt: new Date() }),
                },
                { new: true }
            );
        } else {
            complaint = await InfrastructureComplaint.findOneAndUpdate(
                { _id: id, complainType },
                {
                    [validStatuses[status].field]: validStatuses[status].value,
                    ...(status === "resolved" && { resolvedAt: new Date() }),
                },
                { new: true }
            );
        }

        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        await checkActivityandProcess({
            category: complainType.toLowerCase(),
            complaintId: id,
            activity: status,
            complaint,
        });

        getLogger(role).info(`${complainType} admin ${status} complaint ${id} at ${new Date().toISOString()}`);
        return res.json({ success: true, complaint });
    } catch (error) {
        getLogger(req.role).error(`Error updating complaint status: ${error.message}`);
        return res.status(500).json({ success: false, message: "Error updating complaint status" });
    }
};

export const DepartmentStatsController = async (req, res) => {
	try {
		const role = req.role;
		const stats = await calculateDepartmentStats(role);
		return res.status(200).json({
			success: true,
			...stats,
		});
	} catch (err) {
        console.log(err);
		return res
			.status(500)
			.json({ success: false, message: "Error in fetching department stats" });
	}
};

export const departmentRemarkController = async (req, res) => {
    try {
        const role = req.role;
        const complainType = getComplainTypeFromRole(role);

        if (!complainType) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const AdminAttachments = req.filePaths || [];
        const AdminRemarks = req.body.AdminRemarks;
        const id = req.body.id;
        console.log("Request Body: ",req.body);

        if (!id) {
            return res.status(400).json({ error: "Complaint ID is required" });
        }

        const complaint = await InfrastructureComplaint.findOneAndUpdate(
            { _id: id, complainType },
            {
                AdminRemarks,
                AdminAttachments,
                updatedAt: new Date(),
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        getLogger(role).info(`${complainType} admin updated remarks for complaint ${id} at ${new Date().toISOString()}`);
        res.json({ success: true, complaint });
    } catch (error) {
        getLogger(req.role).error(`Error updating remarks: ${error.message}`);
        res.status(500).json({ success: false, message: "Error updating complaint remarks" });
    }
};
