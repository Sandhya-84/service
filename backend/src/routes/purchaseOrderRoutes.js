import express from "express";

import {
    createPurchaseOrder,
    getPurchaseOrders,
    updatePurchaseOrder
} from "../controllers/purchaseOrderController.js";

import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();


// =====================================================
// GET PURCHASE ORDERS
// =====================================================

router.get(
    "/",
    authMiddleware,
    getPurchaseOrders
);


// =====================================================
// CREATE PURCHASE ORDER
// =====================================================

router.post(
    "/",
    authMiddleware,
    createPurchaseOrder
);


// =====================================================
// UPDATE PURCHASE ORDER
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    updatePurchaseOrder
);


export default router;