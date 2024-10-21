import mongoose from "mongoose";
import dotenv from "dotenv";
import { ServerApiVersion } from "mongodb";
dotenv.config();

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      ssl:true,
      serverApi: {
        version: ServerApiVersion.v1
      }
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default dbConnect;