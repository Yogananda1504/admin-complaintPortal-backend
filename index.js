import { connect } from "http2";
import { app, server } from "./app.js";
import dotenv from "dotenv";
import connectToDB from "./db/connectToDB.js";
dotenv.config();


connectToDB();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {    
    console.log(`Server is running on port ${PORT}`);
});