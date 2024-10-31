import { connect } from "http2";
import app from "./app.js";
import dotenv from "dotenv";
import connectToDB from "./db/connectToDB.js";
dotenv.config();


connectToDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {    
    console.log(`Server is running on port ${PORT}`);
});