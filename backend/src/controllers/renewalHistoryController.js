import RenewalHistory from "../models/RenewalHistory.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

export const createRenewalHistory = async (req, res) => {
    try {
        const {
            purchaseOrderId,
            oldExpiryDate,
            newExpiryDate,
            renewedBy,
            notes
        } = req.body;

        if (!purchaseOrderId || !oldExpiryDate || !newExpiryDate) {
            return res.status(400).json({
                message:
                    "Purchase order, old expiry date and new expiry date are required"
            });
        }

        // Check whether purchase order exists
        const purchaseOrder = await PurchaseOrder.findById(
            purchaseOrderId
        );

        if (!purchaseOrder) {
            return res.status(404).json({
                message: "Purchase order not found"
            });
        }

        // Create renewal history
        const renewalHistory = await RenewalHistory.create({
            purchaseOrderId,
            oldExpiryDate,
            newExpiryDate,
            renewedBy,
            notes
        });

        // Update current expiry date of the PO
        purchaseOrder.supportExpiryDate = newExpiryDate;
        purchaseOrder.renewed = true;

        await purchaseOrder.save();

        res.status(201).json({
            message: "Renewal recorded successfully",
            renewalHistory,
            purchaseOrder
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to record renewal",
            error: error.message
        });
    }
};


export const getRenewalHistory = async (req, res) => {
    try {
        const { purchaseOrderId } = req.query;

        let query = {};

        if (purchaseOrderId) {
            query.purchaseOrderId = purchaseOrderId;
        }

        const history = await RenewalHistory.find(query)
            .populate("purchaseOrderId", "poNumber supportExpiryDate")
            .populate("renewedBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: history.length,
            history
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch renewal history",
            error: error.message
        });
    }
};