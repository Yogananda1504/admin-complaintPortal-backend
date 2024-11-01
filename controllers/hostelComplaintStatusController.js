import HostelComplaints from "../models/hostelComplaint.js";

//When the admin clicks the resolved , or view button the status of the complaint will be changed to resolved or viewed
const hostelComplaintStatusController = async (req, res) => {
    try {
        const { id, status } = req.body;
        const complaint = await HostelComplaints.findById(id);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }
        if (status === "Resolved") {
            complaint.status = "Resolved";
        } else if (status === "Viewed") {
            complaint.readStatus = "Viewed";
        } else {
            return res.status(400).json({ error: "Invalid status" });
        }
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (error) {
        console.log('Internal server error : ' + error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating complaint status",
        });
    }
}

export default hostelComplaintStatusController;