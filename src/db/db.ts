import mongoose from "mongoose";

const MONGODB_URI = process.env.mongodbUri;

export const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error("MongoDB URI is missing in environment variables.");
    }
    console.log(MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
