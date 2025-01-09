// Upon making the reuest to the server, the controller will be called to handle the request of serving the log file for the respective Category , providing the details regarding a single Complaint  Etc....
import HostelComplaint from '../models/HostelComplaints.js';
import AcademicComplaint from '../models/AcademicComplaint.js';
import MedicalComplaint from '../models/MedicalComplaint.js';
import AdministrationComplaint from '../models/AdministrationComplaint.js';
import RaggingComplaint from '../models/RaggingComplaint.js';
import InfrastructureComplaint from '../models/InfrastructureComplaint.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLogsBetweenDates } from '../utils/logger.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const serve_complaint = async (req,res)=>{
    const id = req.query.id;
    console.log("Id is ",id);
    const category = req.params.category;
    if(category==="hostel"){
        let complaint = await HostelComplaint.findById(id);
        complaint = {...complaint._doc,category:"Hostel"};
        console.log("Admin has requested for the complaint details : ",complaint);
        if(!complaint){
            return res.status(404).json({message:"Complaint not found"});
        }
        return res.status(200).json({complaint});
    }
    else if(category==="academic"){
        let complaint = await AcademicComplaint.findById(id);
        complaint = {...complaint._doc,category:"Academic"};
        if(!complaint){
            return res.status(404).json({message:"Complaint not found"});
        }
        return res.status(200).json({complaint});
    }
    else if(category==="medical"){
        let complaint = await MedicalComplaint.findById(id);
        complaint = {...complaint._doc,category:"Medical"};
        if(!complaint){
            return res.status(404).json({message:"Complaint not found"});
        }
        return res.status(200).json({complaint});
    }
    else if(category==="administration"){
        let complaint = await AdministrationComplaint.findById(id);
        complaint = {...complaint._doc,category:"Administration"};
        if(!complaint){
            return res.status(404).json({message:"Complaint not found"});
        }
        return res.status(200).json({complaint});
    }
    else if(category==="ragging"){
        let complaint = await RaggingComplaint.findById(id);
        complaint = {...complaint._doc,category:"Ragging"};
        if(!complaint){
            return res.status(404).json({message:"Complaint not found"});
        }
        return res.status(200).json({complaint});
    }
    else if(category==="infrastructure"){
        let complaint = await InfrastructureComplaint.findById(id);
        complaint = {...complaint._doc,category:"Infrastructure"}; 
        if(!complaint){
            console.log("No complaint found in infrastructure");
            return res.status(404).json({message:"Complaint not found"});
        }
        return res.status(200).json({complaint});
    }
    else {
        return res.status(400).json({message:"Invalid category"});
    }
}

export const serve_logs = async (req, res) => {
    const category = req.params.category;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    try {
        let logFileName;
        switch (category) {
            case 'hostel':
                logFileName = 'Hostel.log';
                break;
            case 'academic':
                logFileName = 'Academic.log';
                break;
            case 'medical':
                logFileName = 'Medical.log';
                break;
            case 'administration':
                logFileName = 'Administration.log';
                break;
            case 'ragging':
                logFileName = 'Ragging.log';
                break;
            case 'infrastructure':
                logFileName = 'Infrastructure.log';
                break;
            default:
                return res.status(400).json({ message: "Invalid category" });
        }

        const logsDir = path.join(__dirname, '..', 'logs');
        const logPath = path.join(logsDir, logFileName);
        
        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Check if file exists
        if (!fs.existsSync(logPath)) {
            // Create empty log file if it doesn't exist
            fs.writeFileSync(logPath, '');
        }

        if (startDate && endDate) {
            const logs = await getLogsBetweenDates(logPath, startDate, endDate);
            const tempFileName = `temp_${Date.now()}_${logFileName}`;
            const tempFilePath = path.join(logsDir, tempFileName);
            fs.writeFileSync(tempFilePath, logs.join('\n'));

            return res.download(tempFilePath, logFileName, (err) => {
                if (err) {
                    console.error("Error downloading file:", err);
                    return res.status(500).json({ message: "Error downloading file", error: err.message });
                }
                // Delete temporary file after download
                fs.unlinkSync(tempFilePath);
            });
        }

        return res.download(logPath, logFileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                return res.status(500).json({ message: "Error downloading file", error: err.message });
            }
        });
    } catch (error) {
        console.error("Error serving log file:", error);
        return res.status(500).json({ message: "Error serving log file", error: error.message });
    }
};


