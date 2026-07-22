import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// import connectDB from "./config/db.js"; // we'll create db connect inline below to keep simple
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// simple db connect here
import mongoose from "mongoose";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blogapp";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// serve uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Centralized error handler — ensures multer errors (bad file type,
// file too large) and any other thrown errors reach the frontend as
// JSON instead of Express's default HTML error page.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
