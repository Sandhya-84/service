import express from "express";

import {
    createRenewalHistory,
    getRenewalHistory
} from "../controllers/renewalHistoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/",authMiddleware, createRenewalHistory);

router.get("/",authMiddleware, getRenewalHistory);

export default router;