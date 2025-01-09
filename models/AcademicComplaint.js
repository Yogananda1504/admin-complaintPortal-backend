/**
 * @file AcademicComplaint Model Module
 * @description This module defines the AcademicComplaint schema and model for handling academic-related complaints.
 */

import { model, Schema } from 'mongoose';

/**
 * @module models/AcademicComplaint
 */

/**
 * AcademicComplaint Schema
 * @typedef {Object} AcademicComplaint
 * @property {string} scholarNumber - Student ID
 * @property {string} studentName - Student name
 * @property {string} [complainType] - Type of the complaint
 * @property {string} stream - Stream of the complaint
 * @property {string} department - Department of the complaint
 * @property {string} [complainDescription] - Description of the complaint
 * @property {string[]} [attachments] - List of attachment URLs
 * @property {string} [status="Pending"] - Status of the complaint
 * @property {string} [readStatus="Not viewed"] - Read status of the complaint
 */
const academicComaplaint = new Schema({
    scholarNumber: {
        type: String,
        required: [true, "Student ID is required!"]
    },
    studentName: {
        type: String,
        required: [true, "Student name is required!"],
        trim: true
    },
    complainType: {
        type: String,
        trim: true,
        enum: ["Faculty", "Timetable", "Course", "Other"]
    },
    stream: {
        type: String,
        required: [true, "Stream is required!"],
    },
    year:{
        type: String,
        required: [true, "Year is required!"]
    },
    department: {
        type: String,
        required: [true, "Department is required!"]
    },
    complainDescription: {
        type: String,
        trim: true
    },
    attachments: {
        type: [String]
    },
    status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Resolved"]
    },
    readStatus: {
        type: String,
        default: "Not viewed",
        enum: ["Not viewed", "Viewed"]
    },
    useremail:{
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    AdminRemarks : {
        type: String,
        trim: true
    },
    AdminAttachments : {
        type: [String],
        default:[],
        trim:true
    },
    resolvedAt:{
        type: Date
    }

}, {
    timestamps: true
});

academicComaplaint.index({ scholarNumber: 1 });
academicComaplaint.index({ createdAt: 1,_id:1 });
academicComaplaint.index({ department: 1 });

/**
 * AcademicComplaint Model
 * @type {Model<AcademicComplaint>}
 */
const AcademicComplaint = model('AcademicComplaints', academicComaplaint);

export default AcademicComplaint;