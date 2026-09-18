import express from "express";

import {
    getDashboardSummary,
    getDashboardStatus,
    getDashboardData
} from "../controllers/dashboardController.js";
const router = express.Router();
import authMiddleware from "../middleware/authMiddleware.js";
router.get("/summary",authMiddleware, getDashboardSummary);
router.get("/status",authMiddleware, getDashboardStatus);
router.get("/data",authMiddleware, getDashboardData);
export default router;