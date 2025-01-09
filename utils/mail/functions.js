import path from 'path' 
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs'
import { EmailActivity_logger as logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const CONFIG = {
  mimeTypes: {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".txt": "text/plain",
      ".zip": "application/zip",
  },
  colors: {
      primary: "#1e40af", // Deeper blue
      secondary: "#dc2626", // Vibrant red
      success: "#15803d", // Rich green
      warning: "#f59e0b", // Warm amber
      text: "#1f2937", // Dark gray
      lightText: "#6b7280", // Medium gray
      border: "#e5e7eb", // Light gray
      background: "#f8fafc", // Very light blue-gray
      cardBg: "#ffffff",
      gradientStart: "#1e40af",
      gradientEnd: "#3b82f6",
  },
  fonts: {
      primary: "'Segoe UI', system-ui, sans-serif",
      heading: "'Arial', 'Helvetica Neue', sans-serif",
  },
  spacing: {
      xs: "8px",
      sm: "12px",
      md: "16px",
      lg: "24px",
      xl: "32px",
  }
};

const MANIT_COLORS = {
    primary: '#1a4f8b',    // MANIT Blue
    secondary: '#e44d26',  // Accent Orange
    success: '#2e7d32',    // Success Green
    text: '#2d3748',       // Dark Text
    lightText: '#718096',  // Light Text
    border: '#e2e8f0'      // Border Color
  };
  
  const baseTemplate = `
    <div style="
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    ">
      <header style="text-align: center; margin-bottom: 24px;">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWhBHSMEY1Pa5xcGH5Pj2HLZOPlfyraJ0STQ&s" 
             alt="MANIT Bhopal Logo" 
             style="max-width: 150px; height: auto;"
        />
        <h1 style="
          color: ${MANIT_COLORS.primary};
          margin: 16px 0 8px;
          font-size: 24px;
          font-weight: 600;
        ">
          MANIT Complaint Management Portal
        </h1>
      </header>
      {{content}}
      <footer style="
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid ${MANIT_COLORS.border};
        text-align: center;
        font-size: 12px;
        color: ${MANIT_COLORS.lightText};
      ">
        <p>Maulana Azad National Institute of Technology</p>
        <p>Link Road Number 3, Near Kali Mata Mandir, Bhopal, Madhya Pradesh 462003</p>
        <p style="margin-top: 16px;">&copy; ${new Date().getFullYear()} MANIT Complaint Portal. All rights reserved.</p>
      </footer>
    </div>
  `;
  
export  const generateViewData = (category, complaint) => {
    const content = `
      <div style="color: ${MANIT_COLORS.text};">
        <div style="
          background-color: #f7fafc;
          border-left: 4px solid ${MANIT_COLORS.primary};
          padding: 16px;
          margin-bottom: 24px;
          border-radius: 4px;
        ">
          <h2 style="
            color: ${MANIT_COLORS.primary};
            margin: 0 0 8px;
            font-size: 20px;
          ">Complaint Viewed</h2>
          <p style="margin: 0;">Complaint ID: <strong>#${complaint._id}</strong></p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Dear <strong>${complaint.scholarNumber}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Your complaint regarding <strong>${complaint.complainType || ''}</strong> under the category <strong>${category}</strong> has been viewed by our team.
        </p>
        
        <div style="
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
          margin: 16px 0;
        ">
          <h3 style="
            color: ${MANIT_COLORS.secondary};
            margin: 0 0 8px;
            font-size: 16px;
          ">Complaint Details:</h3>
          <p style="margin: 0; line-height: 1.6;">${complaint.complainDescription}</p>
        </div>
        
        <p style="
          font-size: 16px;
          line-height: 1.6;
          color: ${MANIT_COLORS.success};
          font-weight: 500;
        ">
          The designated authority has been notified and will be reviewing your complaint shortly.
        </p>
      </div>
    `;
  
    return {
      email: complaint.useremail,
      subject: `[MANIT Complaints] Your ${category} Complaint #${complaint._id} Has Been Viewed`,
      text: `Hello ${complaint.scholarNumber}, your complaint (#${complaint._id}) about ${complaint.complainType || ''}, ${category} has been viewed. Details: ${complaint.complainDescription}. Designated authority will be looking into the issue.`,
      html: baseTemplate.replace('{{content}}', content)
    };
  };
  
// Add the processAttachment function
const processAttachment = async (filePath) => {
    if (!filePath || typeof filePath !== 'string') {
        logger.warn(`Invalid attachment path: ${JSON.stringify(filePath)}`);
        return null;
    }

    try {
        const projectRoot = path.join(__dirname, '../..');
        const absolutePath = path.isAbsolute(filePath)
            ? path.normalize(filePath)
            : path.join(projectRoot, path.normalize(filePath));
        console.log('Absolute Path:', absolutePath);
        if (!fs.existsSync(absolutePath)) {
            logger.warn(`File not found: ${absolutePath}`);
            return null;
        }

        const fileContent = await fs.promises.readFile(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();
       
        return {
            filename: path.basename(absolutePath),
            content: fileContent.toString("base64"),
            encoding: "base64",
            contentType: CONFIG.mimeTypes[ext] || "application/octet-stream"
        };
    } catch (error) {
      console.log(error);
        logger.error(`Attachment processing error: ${filePath}`, error);
        return null;
    }
};

// Modify the generateResolvedData function to include AdminAttachments
export const generateResolvedData = async (category, complaint) => {
    const adminAttachmentsProcessed = await Promise.all(
        complaint.AdminAttachments.map(processAttachment)
    );

    const attachmentsProcessed = await Promise.all(
        complaint.attachments.map(processAttachment)
    );

    const content = `
      <div style="color: ${MANIT_COLORS.text};">
        <div style="
          background-color: #f7fafc;
          border-left: 4px solid ${MANIT_COLORS.primary};
          padding: 16px;
          margin-bottom: 24px;
          border-radius: 4px;
        ">
          <h2 style="
            color: ${MANIT_COLORS.primary};
            margin: 0 0 8px;
            font-size: 20px;
          ">Complaint Resolved</h2>
          <p style="margin: 0;">Complaint ID: <strong>#${complaint._id}</strong></p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Dear <strong>${complaint.scholarNumber}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Your complaint regarding <strong>${complaint.complainType || ''}</strong> under the category <strong>${category}</strong> has been resolved by our team.
        </p>
        
        <div style="
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
          margin: 16px 0;
        ">
          <h3 style="
            color: ${MANIT_COLORS.secondary};
            margin: 0 0 8px;
            font-size: 16px;
          ">Complaint Details:</h3>
          <p style="margin: 0; line-height: 1.6;">${complaint.complainDescription}</p>
        </div>
        
        <p style="
          font-size: 16px;
          line-height: 1.6;
          color: ${MANIT_COLORS.success};
          font-weight: 500;
        ">
          The designated authority has resolved your complaint. Thank you for your patience.
        </p>
      </div>
    `;

    return {
        email: complaint.useremail,
        subject: `[MANIT Complaints] Your ${category} Complaint #${complaint._id} Has Been Resolved`,
        text: `Hello ${complaint.scholarNumber}, your complaint (#${complaint._id}) about ${complaint.complainType || ''}, ${category} has been resolved. Details: ${complaint.complainDescription}`,
        html: baseTemplate.replace(`{{content}}`, content),
        attachments: [
            ...attachmentsProcessed.filter(a => a !== null),
            ...adminAttachmentsProcessed.filter(a => a !== null)
        ]
    };
};