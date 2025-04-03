import HostelComplaint from "../models/HostelComplaints.js";

// Function to get Cow Dashboard data (returns data instead of emitting events)
export const updateCowDashboardData = async () => {
	try {
		console.log("This is the COW Dashboard Controller \n");
		// Aggregate hostel-wise statistics
		const hostelStats = await HostelComplaint.aggregate([
			{
				$group: {
					_id: "$hostelNumber",
					total: { $sum: 1 },
					resolved: {
						$sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
					},
					unresolved: {
						$sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
					},
				},
			},
		]);
		hostelStats.forEach(
			(h) => (h.resolutionRate = h.total ? h.resolved / h.total : 0)
		);
		const bestHostel = hostelStats.reduce(
			(prev, curr) => (curr.resolutionRate > prev.resolutionRate ? curr : prev),
			hostelStats[0]
		);

		// Sort hostelStats by hostel number (numeric order)
		hostelStats.sort((a, b) => {
			const numA = parseInt(a._id.replace(/[^\d]/g, ""));
			const numB = parseInt(b._id.replace(/[^\d]/g, ""));
			return numA - numB;
		});

		// Aggregate trending complaint types per hostel
		const trending = await HostelComplaint.aggregate([
			{
				$group: {
					_id: { hostelNumber: "$hostelNumber", complainType: "$complainType" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { "_id.hostelNumber": 1, count: -1 } },
		]);
		const trendingByHostel = {};
		trending.forEach((item) => {
			const hostel = item._id.hostelNumber;
			if (!trendingByHostel[hostel]) trendingByHostel[hostel] = [];
			trendingByHostel[hostel].push({
				complainType: item._id.complainType,
				count: item.count,
			});
		});
		// Convert trendingByHostel object into an array ordered by hostel number
		const trendingArray = Object.keys(trendingByHostel)
			.sort((a, b) => {
				const numA = parseInt(a.replace(/[^\d]/g, ""));
				const numB = parseInt(b.replace(/[^\d]/g, ""));
				return numA - numB;
			})
			.map((hostel) => ({
				hostelNumber: hostel,
				complaints: trendingByHostel[hostel],
			}));

		return {
			hostelStats,
			bestMaintainedHostel: bestHostel,
			trendingComplaintTypes: trendingArray,
		};
	} catch (error) {
		throw new Error("Failed to load Cow dashboard data");
	}
};

// Function to get Warden Dashboard data (returns data rather than emitting events)
export const updateWardenDashboardData = async (role) => {
	try {
		console.log("The  role is : ",role);
		// Get hostel number from user (expected to be "H1", "H2", etc.)
		const hostelNumber = role.substring(1);

		// Aggregate category stats for this hostel
		const categoryStats = await HostelComplaint.aggregate([
			{ $match: { hostelNumber: { $regex: `^H${hostelNumber}$` } } },
			{
				$group: {
					_id: "$complainType",
					total: { $sum: 1 },
					resolved: {
						$sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
					},
					pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
				},
			},
		]);

		// Overall stats for the hostel
		const overallStatsAgg = await HostelComplaint.aggregate([
			{ $match: { hostelNumber: { $regex: `^H${hostelNumber}$` } } },
			{
				$group: {
					_id: null,
					total: { $sum: 1 },
					resolved: {
						$sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
					},
					pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
					avgResponseTime: {
						$avg: {
							$cond: [
								{ $eq: ["$status", "Resolved"] },
								{ $subtract: ["$resolvedAt", "$createdAt"] },
								null,
							],
						},
					},
				},
			},
		]);
		const overall = overallStatsAgg[0] || {
			total: 0,
			resolved: 0,
			pending: 0,
			avgResponseTime: 0,
		};

		// Calculate resolution ratio for each category
		categoryStats.forEach((s) => {
			s.resolutionRate = s.total ? s.resolved / s.total : 0;
		});
		const bestCategory = categoryStats.reduce(
			(prev, curr) => (curr.resolutionRate > prev.resolutionRate ? curr : prev),
			categoryStats[0] || {}
		);
		const worstCategory = categoryStats.reduce(
			(prev, curr) => (curr.resolutionRate < prev.resolutionRate ? curr : prev),
			categoryStats[0] || {}
		);

		return {
			overall,
			categoryStats,
			bestMaintainedCategory: bestCategory,
			worstMaintainedCategory: worstCategory,
		};
	} catch (error) {
		throw new Error("Failed to load Warden dashboard data");
	}
};
