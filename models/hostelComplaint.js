// This for the hostel wise complaints
import { model, Schema } from 'mongoose';

const hostelComplaint = new Schema({
    scholarNumber: {
        type: String,
        required: [true, "Student ID is required!"],
    },
    studentName: {
        type: String,
        required: [true, "Student name is required!"],
        trim: true
    },
    hostelNumber: {
        type: String,
        required: [true, "Hostel number is required!"],
    },
    complainType: {
        type: String,
        trim: true,
        enum: ["Maintenance", "Hygiene", "Security", "Mess", "Bathroom", "Room", "Noise","Other"]
    },
    complainDescription: {
        type: String,
        trim: true,
    },
    attachments: {
        type: [String],
    },
    room: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Resolved"],
    },
    readStatus:{ 
        type: String,
        default: "Not viewed",
        enum: ["Not viewed", "Viewed"]
    }
}, {
    timestamps: true
});

hostelComplaint.index({ scholarNumber: 1 });
hostelComplaint.index({ createdAt: 1 });


const HostelComplaint = model('Complaints', hostelComplaint);

export default HostelComplaint;