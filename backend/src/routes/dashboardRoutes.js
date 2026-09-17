import express from "express";

import {
    getDashboardSummary,
    getDashboardStatus,
    getDashboardData
} from "../controllers/dashboardController.js";
const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/status", getDashboardStatus);
router.get("/data", getDashboardData);
export default router;