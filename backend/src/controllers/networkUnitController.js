import NetworkUnit from "../models/NetworkUnit.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

export const createUnit = async (req, res) => {
    try {
        const {
            purchaseOrderId,
            unitCode,
            hostname,
            radioConfiguration
        } = req.body;

        if (!purchaseOrderId || !unitCode) {
            return res.status(400).json({
                message: "Purchase order and unit code are required"
            });
        }

        // Check whether the PO exists
        const purchaseOrder = await PurchaseOrder.findById(
            purchaseOrderId
        );

        if (!purchaseOrder) {
            return res.status(404).json({
                message: "Purchase order not found"
            });
        }

        // Check whether this unit already exists under this PO
        const existingUnit = await NetworkUnit.findOne({
            purchaseOrderId,
            unitCode,
            hostname
        });

        if (existingUnit) {
            return res.status(400).json({
                message: "Unit already exists under this purchase order"
            });
        }

        const unit = await NetworkUnit.create({
            purchaseOrderId,
            unitCode,
            hostname,
            radioConfiguration
        });

        res.status(201).json({
            message: "Unit created successfully",
            unit
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create unit",
            error: error.message
        });
    }
};


export const getUnits = async (req, res) => {
    try {
        const { purchaseOrderId } = req.query;

        let query = {};

        // If PO ID is provided, get only units belonging to that PO
        if (purchaseOrderId) {
            query.purchaseOrderId = purchaseOrderId;
        }

        const units = await NetworkUnit.find(query)
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: units.length,
            units
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch units",
            error: error.message
        });
    }
};