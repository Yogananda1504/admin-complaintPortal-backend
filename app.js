import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import loginRoutes from './routes/loginRoutes.js';
const app =express();

//set the url encoding extended true and use the helmet to secure the app , use cookie parser to parse the cookie , use the express.json() to parse the body of the request
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cookieParser());

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.use('/login', loginRoutes);

export default app;