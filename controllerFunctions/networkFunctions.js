import InfrastructureComplaint from "../models/InfrastructureComplaint.js";
import { checkActivityandProcess } from "../utils/email_automator.js";
import { Network_logger as logger } from "../utils/logger.js";

export const calculateNetworkStats = async () => {
    const [result] = await InfrastructureComplaint.aggregate([
        {
            $match: { complainType: "Internet" }
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

export const NetworkDataController = async (req, res) => {
    try {
        console.log("\nFetching the Network Complaints from the database\n");
        const filters = JSON.parse(req.query.filters || "{}");
        
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
            complainType: "Internet",
            createdAt: { $gte: startDate, $lte: endDate },
            ...(filters.scholarNumbers.length && {
                scholarNumber: { $in: filters.scholarNumbers },
            }),
            ...(filters.readStatus && { readStatus: filters.readStatus }),
            ...(filters.status && { status: filters.status }),
        };

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

        const nextLastSeenId = complaints.length === limit ? complaints[complaints.length - 1]._id : null;

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
                category: "Network",
            })),
            nextLastSeenId,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const NetworkComplaintStatusController = async (req, res) => {
    try {
        const { id, status } = req.body;
        const validStatuses = {
            resolved: { field: "status", value: "Resolved" },
            viewed: { field: "readStatus", value: "Viewed" },
        };

        if (!validStatuses[status]) {
            return res.status(400).json({ error: "Invalid status. Must be 'resolved' or 'viewed'" });
        }

        const complaint = await InfrastructureComplaint.findOneAndUpdate(
            { _id: id, complainType: "Internet" },
            {
                [validStatuses[status].field]: validStatuses[status].value,
                ...(status === "resolved" && { resolvedAt: new Date() }),
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ error: "Network complaint not found" });
        }

        await checkActivityandProcess({
            category: "network",
            complaintId: id,
            activity: status,
            complaint,
        });

        logger.info(`Admin ${status} Network complaint ${id} at ${new Date().toISOString()}`);
        return res.json({ success: true, complaint });
    } catch (error) {
        logger.error(`Error updating network complaint status: ${error.message}`);
        return res.status(500).json({ success: false, message: "Error updating complaint status" });
    }
};

export const NetworkStatsController = async (req, res) => {
    try {
        const stats = await calculateNetworkStats();
        return res.status(200).json({
            success: true,
            ...stats
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error in fetching network stats" });
    }
};

export const networkRemarkController = async (req, res) => {
    try {
        const AdminAttachments = req.filePaths || [];
        const AdminRemarks = req.body.AdminRemarks;
        const id = req.body.complaintId;

        if (!id) {
            return res.status(400).json({ error: "Complaint ID is required" });
        }

        const complaint = await InfrastructureComplaint.findOneAndUpdate(
            { _id: id, complainType: "Internet" },
            {
                AdminRemarks,
                AdminAttachments,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ error: "Network complaint not found" });
        }

        logger.info(`Admin updated remarks for Network complaint ${id} at ${new Date().toISOString()}`);
        res.json({ success: true, complaint });
    } catch (error) {
        logger.error(`Error updating remarks for Network complaint: ${error.message}`);
        res.status(500).json({ success: false, message: "Error updating complaint remarks" });
    }
};
