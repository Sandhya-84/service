import express from "express";

import {
    createCustomer,
    getCustomers
} from "../controllers/customerController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// Get all customers
router.get(
    "/",
    authMiddleware,
    getCustomers
);


// Create new customer
router.post(
    "/",
    authMiddleware,
    createCustomer
);


export default router;