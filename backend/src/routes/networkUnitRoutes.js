import express from "express";

import {
    createUnit,
    getUnits
} from "../controllers/networkUnitController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/",authMiddleware, createUnit);

router.get("/", authMiddleware,getUnits);

export default router;