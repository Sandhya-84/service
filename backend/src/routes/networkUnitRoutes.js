import express from "express";

import {
    createNetworkUnit,
    getNetworkUnits,
    getNetworkUnitById,
    getUnitsByPurchaseOrder,
    getUnitsByCustomer,
    updateNetworkUnit,
    deleteNetworkUnit
} from "../controllers/networkUnitController.js";

const router =
    express.Router();


router.post(
    "/",
    createNetworkUnit
);


router.get(
    "/",
    getNetworkUnits
);


router.get(
    "/customer/:customerId",
    getUnitsByCustomer
);


router.get(
    "/purchase-order/:purchaseOrderId",
    getUnitsByPurchaseOrder
);


router.get(
    "/:id",
    getNetworkUnitById
);


router.put(
    "/:id",
    updateNetworkUnit
);


router.delete(
    "/:id",
    deleteNetworkUnit
);


export default router;