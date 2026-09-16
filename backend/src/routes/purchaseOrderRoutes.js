import express from "express";

import {
    createPurchaseOrder,
    getPurchaseOrders
} from "../controllers/purchaseOrderController.js";

const router = express.Router();

router.post("/", createPurchaseOrder);

router.get("/", getPurchaseOrders);

export default router;