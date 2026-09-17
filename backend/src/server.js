import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerroutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import networkUnitRoutes from "./routes/networkUnitRoutes.js";
import renewalHistoryRoutes from "./routes/renewalHistoryRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

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

app.use("/api/renewal-history", renewalHistoryRoutes);

app.use("/api/import", importRoutes);

app.use("/api/dashboard",dashboardRoutes);




// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});