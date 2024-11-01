import HostelComplaint from "../models/hostelComplaint.js";
import mongoose from "mongoose";

const hostelDataController = async (req, res, next) => {
  try {
    const limit = 15; // Fixed limit of 10 complaints per page

    // Parse and validate startDate
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
    if (isNaN(startDate)) {
      return res.status(400).json({ error: "Invalid startDate format" });
    }

    // Parse and validate endDate
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    if (isNaN(endDate)) {
      return res.status(400).json({ error: "Invalid endDate format" });
    }

    // Ensure startDate is before endDate
    if (startDate > endDate) {
      return res.status(400).json({ error: "startDate must be before endDate" });
    }

    // Parse lastSeenDate and lastSeenId for pagination
    const lastSeenDate = req.query.lastSeenDate ? new Date(req.query.lastSeenDate) : null;
    const lastSeenId = req.query.lastSeenId ? mongoose.Types.ObjectId(req.query.lastSeenId) : null;

    const query = {
      date: { $gte: startDate, $lte: endDate },
    };

    // Include cursor-based pagination criteria if navigating to subsequent pages
    if (lastSeenDate && lastSeenId) {
      query.$or = [
        { date: { $gt: lastSeenDate } }, // Later dates
        { date: lastSeenDate, _id: { $gt: lastSeenId } }, // Same date, larger `_id`
      ];
    }

    const complaints = await HostelComplaint.find(query)
      .sort({ date: 1, _id: 1 }) // Sort by date and `_id` in ascending order
      .limit(limit);

    // Prepare cursor information for the next page
    let nextLastSeenDate = null;
    let nextLastSeenId = null;
    if (complaints.length > 0) {
      const lastComplaint = complaints[complaints.length - 1];
      nextLastSeenDate = lastComplaint.date;
      nextLastSeenId = lastComplaint._id;
    }

    res.json({
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
}

export default hostelDataController;