import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to generate random data
function generateAcademicComplaints(count = 50) {
    const complaints = [];
    const statuses = ["Pending", "Resolved"];
    const readStatuses = ["Not viewed", "Viewed"];
    const complainTypes = ["Faculty", "Timetable", "Course", "other"];
    const departments = ["Computer Science", "Mechanical", "Civil", "Electrical", "Electronics"];
    const streams = ["B.Tech", "M.Tech", "PhD", "MBA"];

    for (let i = 0; i < count; i++) {
        const scholarNumber = `2023${String(i + 1).padStart(4, '0')}`;
        const complaint = {
            scholarNumber,
            studentName: `Student ${i + 1}`,
            complainType: complainTypes[Math.floor(Math.random() * complainTypes.length)],
            stream: streams[Math.floor(Math.random() * streams.length)],
            department: departments[Math.floor(Math.random() * departments.length)],
            complainDescription: `Sample academic complaint ${i + 1}. Issue related to ${complainTypes[Math.floor(Math.random() * complainTypes.length)]}.`,
            attachments: [`document${i + 1}.pdf`],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            readStatus: readStatuses[Math.floor(Math.random() * readStatuses.length)],
            useremail: `student${i + 1}@example.com`,
            createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
        };
        complaints.push(complaint);
    }
    return complaints;
}

// Convert to CSV
function convertToCSV(complaints) {
    const headers = Object.keys(complaints[0]).join(',');
    const rows = complaints.map(complaint => {
        return Object.values(complaint).map(value => {
            if (Array.isArray(value)) return `"${value.join(';')}"`;
            return `"${value}"`;
        }).join(',');
    });
    return [headers, ...rows].join('\n');
}

// Generate and save CSV
const complaints = generateAcademicComplaints(50);
const csvContent = convertToCSV(complaints);
const outputPath = join(__dirname, 'academic_complaints.csv');

writeFileSync(outputPath, csvContent);
console.log(`CSV file generated at: ${outputPath}`);
