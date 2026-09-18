import express from "express";

import {
    createPurchaseOrder,
    getPurchaseOrders,
    updatePurchaseOrder
} from "../controllers/purchaseOrderController.js";

const router = express.Router();

router.post("/", createPurchaseOrder);

router.get("/", getPurchaseOrders);

router.put("/:id", updatePurchaseOrder);

export default router;