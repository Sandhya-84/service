import express from "express";

import {
    createCustomer
} from "../controllers/customerController.js";

const router = express.Router();

router.post("/", createCustomer);

export default router;