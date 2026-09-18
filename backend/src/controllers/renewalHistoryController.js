import RenewalHistory from "../models/RenewalHistory.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

export const createRenewalHistory = async (req, res) => {
    try {
        const {
            purchaseOrderId,
            newExpiryDate,
            renewedBy,
            notes
        } = req.body;

        if (!purchaseOrderId || !newExpiryDate) {
            return res.status(400).json({
                message: "Purchase order and new expiry date are required"
            });
        }

        const purchaseOrder = await PurchaseOrder.findById(
            purchaseOrderId
        );

        if (!purchaseOrder) {
            return res.status(404).json({
                message: "Purchase order not found"
            });
        }

        if (!purchaseOrder.supportExpiryDate) {
            return res.status(400).json({
                message: "Purchase order does not have an existing expiry date"
            });
        }

        const oldExpiryDate =
            purchaseOrder.supportExpiryDate;

        const newDate = new Date(newExpiryDate);

        if (isNaN(newDate.getTime())) {
            return res.status(400).json({
                message: "Invalid new expiry date"
            });
        }

        if (newDate <= oldExpiryDate) {
            return res.status(400).json({
                message: "New expiry date must be later than the current expiry date"
            });
        }

        const renewalHistory = await RenewalHistory.create({
            purchaseOrderId,
            oldExpiryDate,
            newExpiryDate: newDate,
            renewedBy: renewedBy || undefined,
            notes: notes || ""
        });

        purchaseOrder.supportExpiryDate = newDate;
        purchaseOrder.renewed = true;

        await purchaseOrder.save();

        res.status(201).json({
            message: "Renewal recorded successfully",
            renewalHistory,
            purchaseOrder
        });

    } catch (error) {
        console.error(
            "Create renewal history error:",
            error
        );

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