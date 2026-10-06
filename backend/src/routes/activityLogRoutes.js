import express from "express";

import {
    createActivityLog,
    getActivityLogs
} from "../controllers/activityLogController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getActivityLogs
);

router.post(
    "/",
    authMiddleware,
    createActivityLog
);

export default router;