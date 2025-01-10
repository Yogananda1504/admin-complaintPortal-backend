//This will take the details of the complaints and inform the user about his submission regarding the complaint
//This handles the task of the email transporting functionality
import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config();
/**
 * Creates a Nodemailer transporter object using Gmail service.
 * The transporter is configured with authentication details
 * provided by environment variables.
 *
 * @constant {Object} transporter - The Nodemailer transporter object.
 * @property {string} service - The email service to use (Gmail).
 * @property {Object} auth - The authentication details.
 * @property {string} auth.user - The email address to use for sending emails.
 * @property {string} auth.pass - The password for the email address.
 */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
});

// Verify the connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log("Error verifying transport:", error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

export default transporter;