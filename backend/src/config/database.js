// mongoose connection
import mongoose from "mongoose";

// local module import 
import config from "./config.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoURI);
        console.log("Database connected");
    } catch (error) {
        console.error("Error connecting to database:", error.message);
        throw error;
    }
};

export default connectDB;