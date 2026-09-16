import PurchaseOrder from "../models/PurchaseOrder.js";
import Customer from "../models/Customer.js";

export const createPurchaseOrder = async (req, res) => {
    try {
        const {
            customerId,
            poNumber,
            invoiceNumber,
            supportExpiryDate,
            team,
            notes,
            renewed
        } = req.body;

        if (!customerId || !poNumber) {
            return res.status(400).json({
                message: "Customer and PO number are required"
            });
        }

        // Check whether customer exists
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        // Check whether this PO already exists for this customer
        const existingPO = await PurchaseOrder.findOne({
            customerId,
            poNumber: poNumber.trim()
        });

        if (existingPO) {
            return res.status(400).json({
                message: "Purchase order already exists for this customer"
            });
        }

        const purchaseOrder = await PurchaseOrder.create({
            customerId,
            poNumber: poNumber.trim(),
            invoiceNumber,
            supportExpiryDate,
            team,
            notes,
            renewed
        });

        res.status(201).json({
            message: "Purchase order created successfully",
            purchaseOrder
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create purchase order",
            error: error.message
        });
    }
};


export const getPurchaseOrders = async (req, res) => {
    try {
        const { customerId } = req.query;

        let query = {};

        if (customerId) {
            query.customerId = customerId;
        }

        const purchaseOrders = await PurchaseOrder.find(query)
            .populate("customerId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: purchaseOrders.length,
            purchaseOrders
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch purchase orders",
            error: error.message
        });
    }
};