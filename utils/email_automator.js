import transporter from "./transporter.js";
import dotenv from "dotenv";
import Queue from "bull";
import { EmailActivity_logger as logger } from "./logger.js"; // Ensure logger is imported
import { generateViewData, generateResolvedData } from "./mail/functions.js"; // Ensure email data generation functions are imported
dotenv.config();

const getViewSubject = (category, complaint) => {
	return `Update: Complaint #${complaint._id} regarding ${
		complaint.complainType || ""
	}, ${category}`;
};

const getResolvedSubject = (category, complaint) => {
	return `Resolved: Complaint #${complaint._id} regarding ${
		complaint.complainType || ""
	}, ${category}`;
};

const emailQueue = new Queue("emailQueue", {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT,
		password: process.env.REDIS_PASSWORD,
		maxRetriesPerRequest: null,
	},
});

const processor = async (job) => {
	logger.info(`Processing job for email to ${job.data.email}`); // New logging
	console.log("\nThe job data is  : ", job.data);
	const { email, subject, html, text, attachments } = job.data;
	try {
		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject,
			html,
			text,
			attachments,
		});
		logger.info(`Email sent to ${email}`);
	} catch (err) {
		logger.error(`Error sending email to ${email}:`, err);
		throw new Error("Email sending failed");
	}
};

emailQueue.process(processor);

export const checkActivityandProcess = async (data) => {
	const { category, complaintId, activity, complaint } = data;
	try {
		let emailData;
		if (!complaint) {
			throw new Error(`Complaint not found for ID: ${complaintId}`);
		}

		if (!complaint.useremail) {
			logger.error(
				`Complaint ID "${complaintId}" does not have an email address.`
			);
			return;
		}

		if (activity === "viewed") {
			emailData = generateViewData(category, complaint);
		} else if (activity === "resolved") {
			emailData = await generateResolvedData(category, complaint);
		} else {
			throw new Error(`Unknown activity: ${activity}`);
		}

		logger.info(`Adding email job to queue: ${complaintId}`); // New logging
		await emailQueue.add(emailData, {
			attempts: 3,
			backoff: { type: "exponential", delay: 5000 },
		});
	} catch (error) {
		logger.error(
			`Error processing activity "${activity}" for complaint ID "${complaintId}":`,
			error
		);
	}
};
