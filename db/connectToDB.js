import mongoose from "mongoose";

mongoose.set('strictQuery', false)
import dotenv from 'dotenv';
dotenv.config();

const connectToDB = async () => {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI)

        if (client) {
            console.log("Connected to DB: ", client.connection.host);
            const admin = client.connection.db.admin();
            const databases = await admin.listDatabases();
            console.log("Databases:");
            databases.databases.forEach(db => {
                console.log(` - ${db.name}`);
            });

                    }
    } catch (error) {
        console.log(error);
        
    }
}

export default connectToDB;