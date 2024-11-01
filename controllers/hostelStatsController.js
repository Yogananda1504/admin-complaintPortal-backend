/*This will display the following output:
  -no.of complaints
  -no.of resolve complaints
  -no.of unresolved complaints
  -no.of viewed complaints but not resolved
  -no.of not viewed complaints
*/
import HostelComplaints from "../models/hostelComplaint.js";
import appError from "../utils/appError.js";

const statsController = async ( req,res,next ) => {
    try{
        const complaints = await HostelComplaints.find();
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(complaint => complaint.status === "Resolved").length;
        const unresolvedComplaints = complaints.filter(complaint => complaint.status === "Pending").length;
        const viewedComplaints = complaints.filter(complaint => complaint.readStatus === "Viewed").length;
        const notViewedComplaints = complaints.filter(complaint => complaint.readStatus === "Not viewed").length;
        res.status(200).json({
            success : true,
            totalComplaints,
            resolvedComplaints,
            unresolvedComplaints,
            viewedComplaints,
            notViewedComplaints
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Error in fetching stats"
        });
    }
}

export default statsController;