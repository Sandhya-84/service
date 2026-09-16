import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import networkUnitRoutes from "./routes/networkUnitRoutes.js";

const app = express();

console.log("Mongo URI exists:", !!process.env.MONGO_URI);

connectDB();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());


// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Support Renewal Tracker API is running"
    });
});


// API routes
app.use("/api/auth", authRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/purchase-orders", purchaseOrderRoutes);

app.use("/api/network-units", networkUnitRoutes);


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});