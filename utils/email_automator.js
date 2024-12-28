import transporter from "./transporter.js";
import dotenv from "dotenv";
import Queue from "bull";
import {EmailActivity_logger as logger} from "./logger.js"; // Ensure logger is imported
dotenv.config();

const getViewSubject = (category, complaint) => {
    return `Update: Complaint #${complaint._id} regarding ${complaint.complainType || ''}, ${category}`;
}

const getResolvedSubject = (category, complaint) => {
    return `Resolved: Complaint #${complaint._id} regarding ${complaint.complainType || ''}, ${category}`;
}

const generateViewData = (category, complaint) => {
    return {
        email: complaint.useremail,
        subject: getViewSubject(category, complaint),
        text: `Hello ${complaint.studentName}, your complaint (#${complaint._id}) about ${complaint.complainType || ''}, ${category} has been viewed. Details: ${complaint.complainDescription}. Designated authority will be looking into the issue.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">Complaint Viewed</h2>
                <p>Hello <strong>${complaint.studentName}</strong>,</p>
                <p>Your complaint (<strong>#${complaint._id}</strong>) about <strong>${category}, ${complaint.complainType || ''}</strong> has been viewed.</p>
                <p><strong>Details:</strong> ${complaint.complainDescription}</p>
                <p style="color: #555;">Designated authority will be looking into the issue.</p>
                <hr>
                <footer style="font-size: 12px; color: #999;">
                    &copy; 2024 Complaint Portal. All rights reserved.
                </footer>
            </div>
        `
    };
}

const generateResolvedData = (category, complaint) => {
    return {
        email: complaint.useremail,
        subject: getResolvedSubject(category, complaint),
        text: `Hello ${complaint.studentName}, your complaint (#${complaint._id}) about ${complaint.complainType || ''}, ${category} has been resolved. Details: ${complaint.complainDescription}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">Complaint Resolved</h2>
                <p>Hello <strong>${complaint.studentName}</strong>,</p>
                <p>Your complaint (<strong>#${complaint._id}</strong>) about <strong>${complaint.complainType || ''}, ${category}</strong> has been resolved.</p>
                <p><strong>Details:</strong> ${complaint.complainDescription}</p>
                <hr>
                <footer style="font-size: 12px; color: #999;">
                    &copy; 2024 Complaint Portal. All rights reserved.
                </footer>
            </div>
        `
    };
}

const emailQueue = new Queue("emailQueue", {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    },
});

const processor = async (job) => {
    logger.info(`Processing job for email to ${job.data.email}`); // New logging
    const { email, subject, html, text } = job.data;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html,
            text,
        });
        logger.info(`Email sent to ${email}`);
    } catch (err) {
        logger.error(`Error sending email to ${email}:`, err);
        throw new Error("Email sending failed");
    }
};

emailQueue.process(processor);

export const checkActivityandProcess = async (data) => {
    const { category, complaintId, activity ,complaint} = data;
    try {
        let emailData;
        if (!complaint) {
            throw new Error(`Complaint not found for ID: ${complaintId}`);
        }

        if (activity === "viewed") {
            emailData = generateViewData(category, complaint);
        } else if (activity === "resolved") {
            emailData = generateResolvedData(category, complaint);
        } else {
            throw new Error(`Unknown activity: ${activity}`);
        }

        logger.info(`Adding email job to queue: ${complaintId}`); // New logging
        await emailQueue.add(emailData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
    } catch (error) {
        logger.error(`Error processing activity "${activity}" for complaint ID "${complaintId}":`, error);
    }
};
