import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
const app =express();

//set the url encoding extended true
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cookieParser());

app.get('/ping', (req, res) => {
    res.send('pong');
});

export default app;