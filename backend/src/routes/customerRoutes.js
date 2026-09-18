import express from "express";

import {
    createCustomer,
    getCustomers
} from "../controllers/customerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware,createCustomer);

router.get("/", authMiddleware,getCustomers);

export default router;