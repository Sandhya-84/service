import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import networkUnitRoutes from "./routes/networkUnitRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import renewalHistoryRoutes from "./routes/renewalHistoryRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/network-units", networkUnitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/renewal-history", renewalHistoryRoutes);
app.use("/api/import", importRoutes);
app.use("/api/activity-logs", activityLogRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Network Support Renewal Tracker API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});