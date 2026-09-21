import express from "express";

import {
    createNetworkUnit,
    getNetworkUnits
} from "../controllers/networkUnitController.js";

import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();


// =====================================================
// GET NETWORK UNITS
// =====================================================

router.get(
    "/",
    authMiddleware,
    getNetworkUnits
);


// =====================================================
// CREATE NETWORK UNIT
// =====================================================

router.post(
    "/",
    authMiddleware,
    createNetworkUnit
);


export default router;