import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import loginRoutes from './routes/loginRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import complaintRoutes from './routes/complainRoutes.js';
import cors from 'cors'
const app =express();
const corsConfig = cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization','csrf-token']
});
//set the url encoding extended true and use the helmet to secure the app , use cookie parser to parse the cookie , use the express.json() to parse the body of the request
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cookieParser());



app.get('/ping', (req, res) => {
    res.send('pong');
});

app.use('/login', loginRoutes);
app.use('/logout', logoutRoutes);
app.use('/complaints', complaintRoutes);

app.use('/*', (req, res) => {
    return res.status(404).send({message:"Ooopsie !! Route Not found"});
});


export default app;