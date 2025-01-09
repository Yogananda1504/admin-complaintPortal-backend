/**
 * @file RaggingComplaint Model Module
 * @module models/RaggingComplaint
 * @description This module defines the RaggingComplaint schema and model for handling ragging-related complaints.
 */

import { model, Schema } from "mongoose";

/**
 * RaggingComplaint Schema
 * @typedef {Object} RaggingComplaint
 * @property {string} scholarNumber - Student ID
 * @property {string} studentName - Student name
 * @property {string} [complainDescription] - Description of the complaint
 * @property {string[]} [attachments] - List of attachment URLs
 * @property {string} [status="Pending"] - Status of the complaint
 * @property {string} [readStatus="Not viewed"] - Read status of the complaint
 */
const raggingComplaint = new Schema({
    scholarNumber: {
        type: String,
        required: [true, "Student ID is required!"]
    },
    stream: {
        type: String,
        required: [true, "Stream is required!"],
    },
    studentName: {
        type: String,
        required: [true, "Student name is required!"],
        trim: true
    },
    year:{
        type: String,
        required: [true, "Year is required!"]
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
        default: [],
        trim: true
    },
    resolvedAt:{
        type: Date
    }
}, {
    timestamps: true
});

raggingComplaint.index({ scholarNumber: 1 });
raggingComplaint.index({ createdAt: 1,_id:1 });



/**
 * RaggingComplaint Model
 * @type {Model<RaggingComplaint>}
 */
const RaggingComplaint = model('RaggingComplaints', raggingComplaint);
export default RaggingComplaint;