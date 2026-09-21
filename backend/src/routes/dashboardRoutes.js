import express from "express";

import {
    getDashboardSummary,
    getDashboardStatus,
    getDashboardData
} from "../controllers/dashboardController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


router.get(
    "/summary",
    authMiddleware,
    getDashboardSummary
);


router.get(
    "/status",
    authMiddleware,
    getDashboardStatus
);


router.get(
    "/data",
    authMiddleware,
    getDashboardData
);


export default router;