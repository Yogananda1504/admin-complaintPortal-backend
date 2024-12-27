import MedicalComplaint from "../models/MedicalComplaint.js";
import InfrastructureComplaint from "../models/InfrastructureComplaint.js";
import HostelComplaint from "../models/HostelComplaints.js";
import AdministrationComplaint from "../models/AdministrationComplaint.js";
import AcademicComplaint from "../models/AcademicComplaint.js";
import RaggingComplaint from "../models/RaggingComplaint.js";
import mongoose from "mongoose";

const computeStats = async (Model) => {
	const stats = await Model.aggregate([
		{
			$group: {
				_id: "$complainType",
				total: { $sum: 1 },
				viewed: {
					$sum: {
						$cond: [{ $eq: ["$readStatus", "Viewed"] }, 1, 0],
					},
				},
				resolved: {
					$sum: {
						$cond: [{ $eq: ["$status", "Resolved"] }, 1, 0],
					},
				},
			},
		},
	]);

	let overall = { total: 0, viewed: 0, resolved: 0 };
	stats.forEach((s) => {
		overall.total += s.total;
		overall.viewed += s.viewed;
		overall.resolved += s.resolved;
	});

	return { details: stats, overall };
};
export const Resolution = async () => {
	const Medical_rr = await resolutionRate(MedicalComplaint) / (1000 * 60 * 60);
	const Infrastructure_rr = await resolutionRate(InfrastructureComplaint) / (1000 * 60 * 60);
	const Hostel_rr = await resolutionRate(HostelComplaint) / (1000 * 60 * 60);
	const Admin_rr = await resolutionRate(AdministrationComplaint) / (1000 * 60 * 60);
	const Academic_rr = await resolutionRate(AcademicComplaint) / (1000 * 60 * 60);
	const Ragging_rr = await resolutionRate(RaggingComplaint) / (1000 * 60 * 60);

	const overall_rr =
		(Medical_rr +
			Infrastructure_rr +
			Hostel_rr +
			Admin_rr +
			Academic_rr +
			Ragging_rr) /
		6;

	const Resolution = {
		Medical: Medical_rr,
		Infrastructure: Infrastructure_rr,
		Hostel: Hostel_rr,
		Admin: Admin_rr,
		Academic: Academic_rr,
		Ragging: Ragging_rr,
		Overall: overall_rr,
	};
	console.log("Resolution Rate (hours): ", Resolution);
	return Resolution;
};

// Function to get the dashboard data
export const getDashboardData = async () => {
	try {
		const Medical = await computeStats(MedicalComplaint);
		const Infrastructure = await computeStats(InfrastructureComplaint);
		const Hostel = await computeStats(HostelComplaint);
		const Admin = await computeStats(AdministrationComplaint);
		const Academic = await computeStats(AcademicComplaint);
		const Ragging = await computeStats(RaggingComplaint);
        Resolution();
		return {
			Medical,
			Infrastructure,
			Hostel,
			Admin,
			Academic,
			Ragging,
			
		};
	} catch (error) {
		return new Error("Error fetching dashboard data");
	}
};

//Reolution rate of the categories of a particular complaint type
//Its the avg of difference between the time of complaint and time of resolution
export const resolutionRate = async (Model) => {
	const complaints = await Model.find({ status: "Resolved" });
	let total = 0;
	complaints.forEach((complaint) => {
		total += complaint.resolvedAt - complaint.createdAt;
	});
	return complaints.length > 0 ? total / complaints.length : 0;
};
