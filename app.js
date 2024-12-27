import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import loginRoutes from './routes/loginRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import complaintRoutes from './routes/complainRoutes.js';
import utilityRoutes from './routes/utilityRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { getDashboardData, Resolution } from './controllers/DashboardController.js';
import cors from 'cors'
import morgan from 'morgan';
import { verifyToken } from './utils/tokenUtils.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app =express();
const corsConfig = cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization','csrf-token']
});
app.use(morgan('dev'));
//set the url encoding extended true and use the helmet to secure the app , use cookie parser to parse the cookie , use the express.json() to parse the body of the request
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cookieParser());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

// Socket middleware for authentication
io.use((socket, next) => {
    try {
        const token = socket.handshake.headers?.cookie
            ?.split("jwt=")?.[1]?.split(";")?.[0];
        if (!token) return next(new Error("No token provided"));

        const decoded = verifyToken(token);
        if (!decoded) return next(new Error("Invalid or expired token"));
        socket.userId = decoded.id;
        next();
    } catch (err) {
        next(new Error("Authentication failed"));
    }
});

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);
    
    try {
        // Initial data emission
        const [initialData, resolutionData] = await Promise.all([
            getDashboardData(),
            Resolution()
        ]);

        socket.emit("setResolution", resolutionData);
        socket.emit('analyticsUpdate', initialData);

        // Set up data updates
        const updateInterval = setInterval(async () => {
            try {
                const [data, resolutionData] = await Promise.all([
                    getDashboardData(),
                    Resolution()
                ]);
                
                if (socket.connected) {
                    socket.emit('analyticsUpdate', data);
                    socket.emit("setResolution", resolutionData);
                }
            } catch (error) {
                console.error('Error fetching real-time data:', error);
            }
        }, 10000);

        // Handle reconnection
        socket.on('reconnect', (attemptNumber) => {
            console.log(`Client ${socket.id} reconnected after ${attemptNumber} attempts`);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            clearInterval(updateInterval);
            console.log(`Client disconnected (${reason}):`, socket.id);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            socket.disconnect();
        });

    } catch (error) {
        console.error('Error in socket connection:', error);
        socket.disconnect();
    }
});

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.use('/login', loginRoutes);
app.use('/logout', logoutRoutes);
app.use('/complaints', complaintRoutes);
app.use('/utility', utilityRoutes);
app.use('/dashboard', dashboardRoutes);

app.all('*', (req, res) => {
    console.error("Invalid route requested");
    return res.status(404).send({ message: "Route Not Found" });
});

export { app, server };