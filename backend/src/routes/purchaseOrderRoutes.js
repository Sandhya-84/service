import express from "express";

import {
    createPurchaseOrder,
    getPurchaseOrders,
    updatePurchaseOrder
} from "../controllers/purchaseOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware,createPurchaseOrder);

router.get("/", authMiddleware,getPurchaseOrders);

router.put("/:id",authMiddleware, updatePurchaseOrder);

export default router;