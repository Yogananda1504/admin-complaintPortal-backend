/**
 * @file MedicalComplaint Model Module
 * @description This module defines the MedicalComplaint schema and model for handling medical-related complaints.
 */

import { model, Schema } from 'mongoose';

/**
 * @module models/MedicalComplaint
 */

/**
 * MedicalComplaint Schema
 * @typedef {Object} MedicalComplaint
 * @property {string} scholarNumber - Student ID
 * @property {string} studentName - Student name
 * @property {string} [complainType] - Type of the complaint
 * @property {string} [complainDescription] - Description of the complaint
 * @property {string[]} [attachments] - List of attachment URLs
 * @property {string} [status="Pending"] - Status of the complaint
 * @property {string} [readStatus="Not viewed"] - Read status of the complaint
 */
const medicalComplaint = new Schema({
    scholarNumber: {
        type: String,
        required: [true, "Student ID is required!"]
    },
    studentName: {
        type: String,
        required: [true, "Student name is required!"],
        trim: true
    },
    stream: {
        type: String,
        required: [true, "Stream is required!"],
    },
    year:{
        type: String,
        required: [true, "Year is required!"]
    },
    complainType: {
        type: String,
        trim: true,
        enum: ["Doctor", "Medicine", "Ambulance", "Other"]
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
    },useremail:{
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
    AdminAttachments: {
        type: [String],
        default: [],
        trim: true
        
    },
    resolvedAt:{
        type: Date
    }
}, {
    timestamps: true
});

medicalComplaint.index({ scholarNumber: 1 });
medicalComplaint.index({ createdAt: 1,_id:1 });

/**
 * MedicalComplaint Model
 * @type {Model<MedicalComplaint>}
 */
const MedicalComplaint = model('MedicalComplaints', medicalComplaint);

export default MedicalComplaint;