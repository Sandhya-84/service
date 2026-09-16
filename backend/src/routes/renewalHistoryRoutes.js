import express from "express";

import {
    createRenewalHistory,
    getRenewalHistory
} from "../controllers/renewalHistoryController.js";

const router = express.Router();

router.post("/", createRenewalHistory);

router.get("/", getRenewalHistory);

export default router;