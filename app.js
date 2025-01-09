import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import loginRoutes from './routes/loginRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import complaintRoutes from './routes/complainRoutes.js';
import utilityRoutes from './routes/utilityRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { getDashboardData, Resolution } from './controllers/DashboardController.js';
import { verifyToken } from './utils/tokenUtils.js';
import { calculateStats as hostelStats } from './controllerFunctions/hostelFunctions.js';
import { calculateStats as academicStats } from './controllerFunctions/academicFunctions.js';
import { calculateStats as medicalStats } from './controllerFunctions/medicalFunctions.js';
import { calculateStats as infrastructureStats } from './controllerFunctions/infrastructureFunctions.js';
import { calculateStats as raggingStats } from './controllerFunctions/raggingFunctions.js';
import  validateRoutes from './routes/validateRoutes.js';
import { fileURLToPath } from 'url';
import path from 'path';
import  fs from 'fs';
const app = express();
app.use(morgan('dev'));
app.use(cors({
    origin: ['http://localhost:5173','https://s9x3g1x0-5173.inc1.devtunnels.ms'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'csrf-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173','http://localhost:4000','https://s9x3g1x0-5173.inc1.devtunnels.ms'],
        credentials: true
    },
    pingTimeout: 120000, // How long to wait for pong response
    pingInterval: 25000, // How often to ping
    transports: ['websocket', 'polling'] // Prioritize WebSocket
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.headers?.cookie
            ?.split("jwt=")?.[1]?.split(";")?.[0];
        if (!token) return next(new Error("No token provided"));

        const decoded = verifyToken(token);
        if (!decoded) return next(new Error("Invalid or expired token"));
        socket.userId = decoded.id;
        next();
    } catch {
        next(new Error("Authentication failed"));
    }
});

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);
    
    // Track last heartbeat time
    let lastHeartbeat = Date.now();
    
    // Send heartbeat every 25 seconds
    const heartbeatInterval = setInterval(() => {
        socket.emit('ping');
    }, 25000);

    // Listen for heartbeat responses
    socket.on('pong', () => {
        lastHeartbeat = Date.now();
        console.log(`Heartbeat received from ${socket.id}`);
    });

    // Monitor connection health
    const connectionMonitor = setInterval(() => {
        if (Date.now() - lastHeartbeat > 60000) { // No heartbeat for 1 minute
            console.log(`Client ${socket.id} connection dead - no heartbeat`);
            socket.disconnect(true);
        }
    }, 30000);

    try {
        const [initialData, resolutionData] = await Promise.all([
            getDashboardData(),
            Resolution()
        ]);

        socket.emit("setResolution", resolutionData);
        socket.emit('analyticsUpdate', initialData);

        const updateInterval = setInterval(async () => {
            try {
                const [data, newResolutionData] = await Promise.all([
                    getDashboardData(),
                    Resolution()
                ]);
                if (socket.connected) {
                    socket.emit('analyticsUpdate', data);
                    socket.emit("setResolution", newResolutionData);
                }
            } catch (error) {
                console.error('Error fetching real-time data:', error);
            }
        }, 10000);

        socket.on("hostelStats", async () => {
            console.log("Received hostelStats request\n");
            const stats = await hostelStats();
            socket.emit("sethostelStats", stats);
        });

        socket.on("academicStats", async () => {
            const stats = await academicStats();
            socket.emit("setacademicStats", stats);
        });

        socket.on("medicalStats", async () => {
            const stats = await medicalStats();
            socket.emit("setmedicalStats", stats);
        });

        socket.on("infrastructureStats", async () => {
            const stats = await infrastructureStats();
            socket.emit("setinfrastructureStats", stats);
        });

        socket.on("raggingStats", async () => {
            const stats = await raggingStats();
            socket.emit("setraggingStats", stats);
        });

        // Custom heartbeat handler
        

        socket.on('disconnect', (reason) => {
            clearInterval(heartbeatInterval);
            clearInterval(connectionMonitor);
            clearInterval(updateInterval);
            console.log(`Client disconnected (${reason}):`, socket.id);
        });
    } catch (error) {
        console.error('Error in socket connection:', error);
        socket.disconnect();
    }
});
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(__dirname, 'uploads', req.path);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: `Cannot find ${req.originalUrl} on this server`
            });
        }
        express.static(path.join(__dirname, 'uploads'))(req, res, next);
    });
});
app.get('/ping', (req, res) => res.send('pong'));
app.use('/login', loginRoutes);
app.use('/logout', logoutRoutes);
app.use('/complaints', complaintRoutes);
app.use('/utility', utilityRoutes);
app.use('/dashboard', dashboardRoutes);
app.use("/validate",validateRoutes);
app.all('*', (req, res) => res.status(404).send({ message: "Route Not Found" }));


export { app, server };
