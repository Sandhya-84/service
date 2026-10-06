import NetworkUnit from "../models/NetworkUnit.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Customer from "../models/Customer.js";
import ActivityLog from "../models/ActivityLog.js";


// =====================================================
// CREATE NETWORK UNIT
// =====================================================

export const createNetworkUnit = async (req, res) => {
    try {
        const {
            customerId,
            purchaseOrderId,
            unitCode,
            hostname,
            radioConfiguration,
            additionalFields
        } = req.body;

        if (!customerId || !unitCode) {
            return res.status(400).json({
                message: "Customer ID and Unit Code are required"
            });
        }

        const networkUnit = await NetworkUnit.create({
            customerId,
            purchaseOrderId: purchaseOrderId || null,
            unitCode,
            hostname: hostname || "",
            radioConfiguration: radioConfiguration || "",
            additionalFields: additionalFields || {}
        });

        // Log creation
        try {
            const customer = await Customer.findById(customerId).lean();
            const purchaseOrder = purchaseOrderId
                ? await PurchaseOrder.findById(purchaseOrderId).lean()
                : null;

            await ActivityLog.create({
                action: "created",
                title: "Network Unit Created",
                description: `Network unit ${unitCode} was created.`,
                customerName: customer?.name || "",
                customerId,
                purchaseOrderId: purchaseOrderId || null,
                poNumber: purchaseOrder?.poNumber || "",
                unitId: networkUnit._id,
                unitCode: networkUnit.unitCode,
                unitCount: 1,
                details: `Hostname: ${hostname || "—"}`
            });
        } catch (activityError) {
            console.error(
                "Activity log creation error:",
                activityError
            );
        }

        return res.status(201).json({
            message: "Network unit created successfully",
            networkUnit
        });

    } catch (error) {
        console.error(
            "Create network unit error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create network unit",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL NETWORK UNITS
// =====================================================

export const getNetworkUnits = async (req, res) => {
    try {
        const units = await NetworkUnit.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "Network units fetched successfully",
            units
        });

    } catch (error) {
        console.error(
            "Get network units error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch network units",
            error: error.message
        });
    }
};


// =====================================================
// GET UNITS BY CUSTOMER
// =====================================================

export const getUnitsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        const units = await NetworkUnit.find({
            customerId
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "Customer network units fetched successfully",
            units
        });

    } catch (error) {
        console.error(
            "Get customer network units error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch customer network units",
            error: error.message
        });
    }
};


// =====================================================
// GET UNITS BY PURCHASE ORDER
// =====================================================

export const getUnitsByPurchaseOrder = async (req, res) => {
    try {
        const { purchaseOrderId } = req.params;

        const units = await NetworkUnit.find({
            purchaseOrderId
        })
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            message: "Purchase order network units fetched successfully",
            units
        });

    } catch (error) {
        console.error(
            "Get purchase order network units error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch purchase order network units",
            error: error.message
        });
    }
};


// =====================================================
// GET SINGLE NETWORK UNIT
// =====================================================

export const getNetworkUnitById = async (req, res) => {
    try {
        const { id } = req.params;

        const networkUnit = await NetworkUnit.findById(id);

        if (!networkUnit) {
            return res.status(404).json({
                message: "Network unit not found"
            });
        }

        return res.status(200).json({
            message: "Network unit fetched successfully",
            networkUnit
        });

    } catch (error) {
        console.error(
            "Get network unit error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch network unit",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE SINGLE NETWORK UNIT
// =====================================================

export const updateNetworkUnit = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            unitCode,
            hostname,
            radioConfiguration,
            additionalFields
        } = req.body;

        const networkUnit =
            await NetworkUnit.findById(id);

        if (!networkUnit) {
            return res.status(404).json({
                message: "Network unit not found"
            });
        }

        const oldUnitCode =
            networkUnit.unitCode;

        const oldHostname =
            networkUnit.hostname;

        const oldRadioConfiguration =
            networkUnit.radioConfiguration;

        if (unitCode !== undefined) {
            networkUnit.unitCode = unitCode;
        }

        if (hostname !== undefined) {
            networkUnit.hostname = hostname;
        }

        if (
            radioConfiguration !== undefined
        ) {
            networkUnit.radioConfiguration =
                radioConfiguration;
        }

        if (additionalFields !== undefined) {
            networkUnit.additionalFields =
                additionalFields;
        }

        await networkUnit.save();

        // Log edit
        try {
            const customer = await Customer.findById(
                networkUnit.customerId
            ).lean();

            const purchaseOrder =
                networkUnit.purchaseOrderId
                    ? await PurchaseOrder.findById(
                          networkUnit.purchaseOrderId
                      ).lean()
                    : null;

            const changedFields = [];

            if (
                oldUnitCode !==
                networkUnit.unitCode
            ) {
                changedFields.push(
                    `Unit Code: ${oldUnitCode} → ${networkUnit.unitCode}`
                );
            }

            if (
                oldHostname !==
                networkUnit.hostname
            ) {
                changedFields.push(
                    `Hostname: ${oldHostname || "—"} → ${networkUnit.hostname || "—"}`
                );
            }

            if (
                oldRadioConfiguration !==
                networkUnit.radioConfiguration
            ) {
                changedFields.push(
                    `Radio Configuration: ${oldRadioConfiguration || "—"} → ${networkUnit.radioConfiguration || "—"}`
                );
            }

            await ActivityLog.create({
                action: "edited",
                title: "Network Unit Edited",
                description: `Network unit ${networkUnit.unitCode} was edited.`,
                customerName: customer?.name || "",
                customerId: networkUnit.customerId,
                purchaseOrderId:
                    networkUnit.purchaseOrderId ||
                    null,
                poNumber:
                    purchaseOrder?.poNumber || "",
                unitId: networkUnit._id,
                unitCode: networkUnit.unitCode,
                unitCount: 1,
                details:
                    changedFields.length > 0
                        ? changedFields.join(" | ")
                        : "Network unit details updated."
            });

        } catch (activityError) {
            console.error(
                "Activity log creation error:",
                activityError
            );
        }

        return res.status(200).json({
            message: "Network unit updated successfully",
            networkUnit
        });

    } catch (error) {
        console.error(
            "Update network unit error:",
            error
        );

        return res.status(500).json({
            message: "Failed to update network unit",
            error: error.message
        });
    }
};


// =====================================================
// DELETE NETWORK UNIT
// =====================================================

export const deleteNetworkUnit = async (req, res) => {
    try {
        const { id } = req.params;

        const networkUnit =
            await NetworkUnit.findById(id);

        if (!networkUnit) {
            return res.status(404).json({
                message: "Network unit not found"
            });
        }

        // Save information BEFORE deleting
        const deletedUnitId =
            networkUnit._id;

        const deletedUnitCode =
            networkUnit.unitCode;

        const customerId =
            networkUnit.customerId;

        const purchaseOrderId =
            networkUnit.purchaseOrderId;

        const customer = await Customer.findById(
            customerId
        ).lean();

        const purchaseOrder =
            purchaseOrderId
                ? await PurchaseOrder.findById(
                      purchaseOrderId
                  ).lean()
                : null;

        await NetworkUnit.findByIdAndDelete(id);

        // Log deletion AFTER successful deletion
        try {
            await ActivityLog.create({
                action: "deleted",
                title: "Network Unit Deleted",
                description: `Network unit ${deletedUnitCode} was deleted.`,
                customerName: customer?.name || "",
                customerId: customerId || null,
                purchaseOrderId:
                    purchaseOrderId || null,
                poNumber:
                    purchaseOrder?.poNumber || "",
                unitId: deletedUnitId,
                unitCode: deletedUnitCode,
                unitCount: 1,
                details: "Network unit permanently removed."
            });
        } catch (activityError) {
            console.error(
                "Activity log creation error:",
                activityError
            );
        }

        return res.status(200).json({
            message: "Network unit deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete network unit error:",
            error
        );

        return res.status(500).json({
            message: "Failed to delete network unit",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE MULTIPLE NETWORK UNITS
// =====================================================

export const updateNetworkUnits = async (req, res) => {
    try {
        const { purchaseOrderId } =
            req.params;

        const { units } = req.body;

        if (!purchaseOrderId) {
            return res.status(400).json({
                message: "Purchase order ID is required"
            });
        }

        if (!Array.isArray(units)) {
            return res.status(400).json({
                message: "Units must be an array"
            });
        }

        if (units.length === 0) {
            return res.status(400).json({
                message: "No network units selected"
            });
        }

        const purchaseOrder =
            await PurchaseOrder.findById(
                purchaseOrderId
            ).lean();

        if (!purchaseOrder) {
            return res.status(404).json({
                message: "Purchase order not found"
            });
        }

        const unitIds = units.map(
            (unit) => unit._id
        );

        const existingUnits =
            await NetworkUnit.find({
                _id: {
                    $in: unitIds
                },
                purchaseOrderId
            });

        if (
            existingUnits.length !==
            units.length
        ) {
            return res.status(400).json({
                message:
                    "One or more selected units do not belong to this purchase order"
            });
        }

        const customer =
            purchaseOrder.customerId
                ? await Customer.findById(
                      purchaseOrder.customerId
                  ).lean()
                : null;

        const oldUnitsMap = {};

        existingUnits.forEach((unit) => {
            oldUnitsMap[
                unit._id.toString()
            ] = {
                unitCode:
                    unit.unitCode || "",
                hostname:
                    unit.hostname || "",
                radioConfiguration:
                    unit.radioConfiguration || ""
            };
        });

        // Update each selected unit
        for (const unit of units) {
            const existingUnit =
                existingUnits.find(
                    (item) =>
                        item._id.toString() ===
                        String(unit._id)
                );

            if (!existingUnit) {
                continue;
            }

            existingUnit.unitCode =
                unit.unitCode;

            existingUnit.hostname =
                unit.hostname || "";

            existingUnit.radioConfiguration =
                unit.radioConfiguration || "";

            await existingUnit.save();
        }

        // Create ONE activity entry for the bulk edit
        try {
            const changedUnits = [];

            for (const unit of units) {
                const oldUnit =
                    oldUnitsMap[
                        String(unit._id)
                    ];

                if (!oldUnit) {
                    continue;
                }

                const changes = [];

                if (
                    oldUnit.unitCode !==
                    (unit.unitCode || "")
                ) {
                    changes.push(
                        `Unit Code: ${oldUnit.unitCode} → ${unit.unitCode}`
                    );
                }

                if (
                    oldUnit.hostname !==
                    (unit.hostname || "")
                ) {
                    changes.push(
                        `Hostname: ${oldUnit.hostname || "—"} → ${unit.hostname || "—"}`
                    );
                }

                if (
                    oldUnit.radioConfiguration !==
                    (unit.radioConfiguration || "")
                ) {
                    changes.push(
                        `Radio Configuration: ${oldUnit.radioConfiguration || "—"} → ${unit.radioConfiguration || "—"}`
                    );
                }

                if (changes.length > 0) {
                    changedUnits.push(
                        `${unit.unitCode}: ${changes.join(", ")}`
                    );
                }
            }

            await ActivityLog.create({
                action: "edited",
                title:
                    units.length === 1
                        ? "Network Unit Edited"
                        : "Network Units Edited",
                description:
                    units.length === 1
                        ? `Network unit ${units[0].unitCode} was edited.`
                        : `${units.length} network units were edited.`,
                customerName:
                    customer?.name || "",
                customerId:
                    purchaseOrder.customerId ||
                    null,
                purchaseOrderId:
                    purchaseOrder._id,
                poNumber:
                    purchaseOrder.poNumber || "",
                unitId:
                    units.length === 1
                        ? units[0]._id
                        : null,
                unitCode:
                    units.length === 1
                        ? units[0].unitCode
                        : "",
                unitCount:
                    units.length,
                details:
                    changedUnits.length > 0
                        ? changedUnits.join(" | ")
                        : "Selected network unit details updated."
            });

        } catch (activityError) {
            console.error(
                "Activity log creation error:",
                activityError
            );
        }

        const updatedUnits =
            await NetworkUnit.find({
                purchaseOrderId
            }).sort({
                createdAt: 1
            });

        return res.status(200).json({
            message:
                "Network units updated successfully",
            units: updatedUnits
        });

    } catch (error) {
        console.error(
            "Update network units error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update network units",
            error: error.message
        });
    }
};