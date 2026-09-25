import express from "express";

import {
    getAllEvalValues,
    getEvalValuesSummary
} from "../controllers/evalValueController.js";


const router =
    express.Router();


// =====================================================
// GET ALL EVAL RECORDS
// =====================================================

router.get(
    "/",
    getAllEvalValues
);


// =====================================================
// GET EVAL SUMMARY
// =====================================================

router.get(
    "/summary",
    getEvalValuesSummary
);


export default router;