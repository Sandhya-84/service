import PurchaseOrder from "../models/PurchaseOrder.js";

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

        const existingPO = await PurchaseOrder.findOne({
            customerId,
            poNumber: poNumber.trim()
        });
        if (nextRenewalDate !== undefined) {
    purchaseOrder.nextRenewalDate =
        nextRenewalDate || null;
}
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
        console.error("Create purchase order error:", error);

        res.status(500).json({
            message: "Failed to create purchase order",
            error: error.message
        });
    }
};


export const getPurchaseOrders = async (req, res) => {
    try {
        const purchaseOrders = await PurchaseOrder.find()
            .populate("customerId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: purchaseOrders.length,
            purchaseOrders
        });

    } catch (error) {
        console.error("Get purchase orders error:", error);

        res.status(500).json({
            message: "Failed to fetch purchase orders",
            error: error.message
        });
    }
};


export const updatePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            team,
            notes,
            renewed,
            nextRenewalDate
        } = req.body;

        const purchaseOrder =
            await PurchaseOrder.findById(id);

        if (!purchaseOrder) {
            return res.status(404).json({
                message: "Purchase order not found"
            });
        }

        if (team !== undefined) {
            purchaseOrder.team = team;
        }

        if (notes !== undefined) {
            purchaseOrder.notes = notes;
        }

        if (renewed !== undefined) {
            purchaseOrder.renewed = renewed;
        }

        if (nextRenewalDate !== undefined) {
            purchaseOrder.nextRenewalDate =
                nextRenewalDate || null;
        }

        await purchaseOrder.save();

        res.status(200).json({
            message: "Purchase order updated successfully",
            purchaseOrder
        });

    } catch (error) {

        console.error(
            "Update purchase order error:",
            error
        );

        res.status(500).json({
            message: "Failed to update purchase order",
            error: error.message
        });
    }
};