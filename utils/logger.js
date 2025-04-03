import { createLogger, format, transports } from 'winston';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

const createCustomLogger = (name) => {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
      new transports.File({ filename: join(__dirname, `../logs/${name}.log`) }),
      new transports.Console()
    ],
  });
};

export const getLogsBetweenDates = async (logPath, startDate, endDate) => {
    try {
        const data = await fs.readFile(logPath, 'utf8');
        
        // If file is empty, return empty array
        if (!data.trim()) {
            return [];
        }

        const lines = data.split('\n').filter(line => line.trim());
        
        if (!startDate || !endDate || startDate === 'null' || endDate === 'null') {
            return lines;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        return lines.filter(line => {
            const dateMatch = line.match(/\[(.*?)\]/);
            if (dateMatch) {
                const logDate = new Date(dateMatch[1]);
                return logDate >= start && logDate <= end;
            }
            return false;
        });
    } catch (error) {
        console.error('Error reading log file:', error);
        throw error;
    }
};



// Create loggers for different categories
const Infrastructure_logger = createCustomLogger('Infrastructure');
const Academic_logger = createCustomLogger('Academic');
const Administration_logger = createCustomLogger('Administration');
const Hostel_logger = createCustomLogger('Hostel');
const Medical_logger = createCustomLogger('Medical');
const Ragging_logger = createCustomLogger('Ragging');
const EmailActivity_logger = createCustomLogger('EmailActivity');
const Network_logger = createCustomLogger('Network');
const Electricity_logger = createCustomLogger('Electricity');
const Error_logger = createCustomLogger('Error');

export {
  Infrastructure_logger,
  Academic_logger,
  Administration_logger,
  Hostel_logger,
  Medical_logger,
  Ragging_logger,
  EmailActivity_logger,
  Network_logger,
  Electricity_logger,
};