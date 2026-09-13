import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

const app = express();

connectDB();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Network Support Tracker API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});