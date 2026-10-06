import NetworkUnit from "../models/NetworkUnit.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

/*
|--------------------------------------------------------------------------
| CREATE NETWORK UNIT
|--------------------------------------------------------------------------
*/

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

        if (!customerId) {
            return res.status(400).json({
                message: "Customer ID is required"
            });
        }

        if (!unitCode || !unitCode.trim()) {
            return res.status(400).json({
                message: "Unit code is required"
            });
        }

        if (purchaseOrderId) {
            const purchaseOrder =
                await PurchaseOrder.findById(
                    purchaseOrderId
                );

            if (!purchaseOrder) {
                return res.status(404).json({
                    message:
                        "Purchase order not found"
                });
            }
        }

        const networkUnit =
            await NetworkUnit.create({
                customerId,
                purchaseOrderId:
                    purchaseOrderId || null,
                unitCode:
                    unitCode.trim(),
                hostname:
                    hostname?.trim() || "",
                radioConfiguration:
                    radioConfiguration?.trim() || "",
                additionalFields:
                    additionalFields || {}
            });

        return res.status(201).json({
            message:
                "Network unit created successfully",
            networkUnit
        });

    } catch (error) {

        console.error(
            "Create network unit error:",
            error
        );

        if (
            error.code === 11000
        ) {
            return res.status(409).json({
                message:
                    "A network unit with the same details already exists"
            });
        }

        return res.status(500).json({
            message:
                "Failed to create network unit",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ALL NETWORK UNITS
|--------------------------------------------------------------------------
*/

export const getNetworkUnits = async (
    req,
    res
) => {
    try {

        const networkUnits =
            await NetworkUnit.find()
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            message:
                "Network units fetched successfully",
            networkUnits
        });

    } catch (error) {

        console.error(
            "Get network units error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch network units",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET NETWORK UNIT BY ID
|--------------------------------------------------------------------------
*/

export const getNetworkUnitById = async (
    req,
    res
) => {
    try {

        const { id } = req.params;

        const networkUnit =
            await NetworkUnit.findById(id);

        if (!networkUnit) {
            return res.status(404).json({
                message:
                    "Network unit not found"
            });
        }

        return res.status(200).json({
            message:
                "Network unit fetched successfully",
            networkUnit
        });

    } catch (error) {

        console.error(
            "Get network unit by ID error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch network unit",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET NETWORK UNITS BY CUSTOMER
|--------------------------------------------------------------------------
*/

export const getUnitsByCustomer = async (
    req,
    res
) => {
    try {

        const { customerId } = req.params;

        const networkUnits =
            await NetworkUnit.find({
                customerId
            }).sort({
                createdAt: 1
            });

        return res.status(200).json({
            message:
                "Customer network units fetched successfully",
            networkUnits
        });

    } catch (error) {

        console.error(
            "Get units by customer error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch customer network units",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET NETWORK UNITS BY PURCHASE ORDER
|--------------------------------------------------------------------------
*/

export const getUnitsByPurchaseOrder =
    async (req, res) => {

        try {

            const {
                purchaseOrderId
            } = req.params;

            const networkUnits =
                await NetworkUnit.find({
                    purchaseOrderId
                }).sort({
                    createdAt: 1
                });

            return res.status(200).json({
                message:
                    "Purchase order network units fetched successfully",
                networkUnits
            });

        } catch (error) {

            console.error(
                "Get units by purchase order error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch purchase order network units",
                error: error.message
            });
        }
    };


/*
|--------------------------------------------------------------------------
| UPDATE SINGLE NETWORK UNIT
|--------------------------------------------------------------------------
*/

export const updateNetworkUnit = async (
    req,
    res
) => {
    try {

        const { id } = req.params;

        const {
            unitCode,
            hostname,
            radioConfiguration,
            additionalFields,
            purchaseOrderId
        } = req.body;

        const networkUnit =
            await NetworkUnit.findById(id);

        if (!networkUnit) {
            return res.status(404).json({
                message:
                    "Network unit not found"
            });
        }

        if (
            unitCode !== undefined
        ) {
            if (!unitCode.trim()) {
                return res.status(400).json({
                    message:
                        "Unit code cannot be empty"
                });
            }

            networkUnit.unitCode =
                unitCode.trim();
        }

        if (
            hostname !== undefined
        ) {
            networkUnit.hostname =
                hostname?.trim() || "";
        }

        if (
            radioConfiguration !== undefined
        ) {
            networkUnit.radioConfiguration =
                radioConfiguration?.trim() || "";
        }

        if (
            additionalFields !== undefined
        ) {
            networkUnit.additionalFields =
                additionalFields;
        }

        if (
            purchaseOrderId !== undefined
        ) {

            if (purchaseOrderId) {

                const purchaseOrder =
                    await PurchaseOrder.findById(
                        purchaseOrderId
                    );

                if (!purchaseOrder) {
                    return res.status(404).json({
                        message:
                            "Purchase order not found"
                    });
                }
            }

            networkUnit.purchaseOrderId =
                purchaseOrderId || null;
        }

        await networkUnit.save();

        return res.status(200).json({
            message:
                "Network unit updated successfully",
            networkUnit
        });

    } catch (error) {

        console.error(
            "Update network unit error:",
            error
        );

        if (
            error.code === 11000
        ) {
            return res.status(409).json({
                message:
                    "A network unit with the same details already exists"
            });
        }

        return res.status(500).json({
            message:
                "Failed to update network unit",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| BULK UPDATE NETWORK UNITS
|--------------------------------------------------------------------------
|
| Used by:
| frontend/src/pages/dashboard/NetworkUnitsTable.jsx
|
| PUT:
| /api/purchase-orders/:purchaseOrderId/units
|
| Body:
| {
|     units: [
|         {
|             _id,
|             unitCode,
|             hostname,
|             radioConfiguration
|         }
|     ]
| }
|
|--------------------------------------------------------------------------
*/

export const updateNetworkUnits = async (
    req,
    res
) => {
    try {

        const {
            purchaseOrderId
        } = req.params;

        const { units } = req.body;

        if (!purchaseOrderId) {
            return res.status(400).json({
                message:
                    "Purchase order ID is required"
            });
        }

        if (!Array.isArray(units)) {
            return res.status(400).json({
                message:
                    "Units must be an array"
            });
        }

        if (units.length === 0) {
            return res.status(400).json({
                message:
                    "At least one unit is required"
            });
        }

        const purchaseOrder =
            await PurchaseOrder.findById(
                purchaseOrderId
            );

        if (!purchaseOrder) {
            return res.status(404).json({
                message:
                    "Purchase order not found"
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Make sure all selected units belong
        | to this purchase order
        |--------------------------------------------------------------------------
        */

        const unitIds =
            units.map(
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

        /*
        |--------------------------------------------------------------------------
        | Update each selected unit
        |--------------------------------------------------------------------------
        */

        for (const unit of units) {

            if (
                !unit._id
            ) {
                return res.status(400).json({
                    message:
                        "Each selected unit must have an ID"
                });
            }

            if (
                unit.unitCode !== undefined &&
                !String(
                    unit.unitCode
                ).trim()
            ) {
                return res.status(400).json({
                    message:
                        "Unit code cannot be empty"
                });
            }

            const updateData = {};

            if (
                unit.unitCode !== undefined
            ) {
                updateData.unitCode =
                    String(
                        unit.unitCode
                    ).trim();
            }

            if (
                unit.hostname !== undefined
            ) {
                updateData.hostname =
                    String(
                        unit.hostname || ""
                    ).trim();
            }

            if (
                unit.radioConfiguration !==
                undefined
            ) {
                updateData.radioConfiguration =
                    String(
                        unit.radioConfiguration ||
                            ""
                    ).trim();
            }

            await NetworkUnit.findOneAndUpdate(
                {
                    _id: unit._id,
                    purchaseOrderId
                },
                {
                    $set: updateData
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Return updated units
        |--------------------------------------------------------------------------
        */

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
            "Bulk update network units error:",
            error
        );

        if (
            error.code === 11000
        ) {
            return res.status(409).json({
                message:
                    "A network unit with the same details already exists"
            });
        }

        return res.status(500).json({
            message:
                "Failed to update network units",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| DELETE NETWORK UNIT
|--------------------------------------------------------------------------
*/

export const deleteNetworkUnit = async (
    req,
    res
) => {
    try {

        const { id } = req.params;

        const networkUnit =
            await NetworkUnit.findByIdAndDelete(
                id
            );

        if (!networkUnit) {
            return res.status(404).json({
                message:
                    "Network unit not found"
            });
        }

        return res.status(200).json({
            message:
                "Network unit deleted successfully",
            networkUnit
        });

    } catch (error) {

        console.error(
            "Delete network unit error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete network unit",
            error: error.message
        });
    }
};