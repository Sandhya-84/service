import express from "express";

import {
    createUnit,
    getUnits
} from "../controllers/networkUnitController.js";

const router = express.Router();

router.post("/", createUnit);

router.get("/", getUnits);

export default router;