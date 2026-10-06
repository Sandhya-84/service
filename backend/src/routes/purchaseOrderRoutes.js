import express from "express";

import {
  createPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrder,
} from "../controllers/purchaseOrderController.js";

import {
  updateNetworkUnits,
} from "../controllers/networkUnitController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Purchase Orders
router.get("/", authMiddleware, getPurchaseOrders);

router.post("/", authMiddleware, createPurchaseOrder);

router.put("/:id", authMiddleware, updatePurchaseOrder);

// Network Units belonging to a Purchase Order
router.put(
  "/:purchaseOrderId/units",
  authMiddleware,
  updateNetworkUnits
);

export default router;