import NetworkUnit from "../models/NetworkUnit.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Customer from "../models/Customer.js";


/* =========================================================
   CREATE NETWORK UNIT
========================================================= */

export const createNetworkUnit = async (
    req,
    res
) => {
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
                success: false,
                message:
                    "Customer is required"
            });
        }


        if (!unitCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Unit code is required"
            });
        }


        const customer =
            await Customer.findById(
                customerId
            );


        if (!customer) {
            return res.status(404).json({
                success: false,
                message:
                    "Customer not found"
            });
        }


        let finalPurchaseOrderId =
            purchaseOrderId || null;


        if (finalPurchaseOrderId) {
            const purchaseOrder =
                await PurchaseOrder.findById(
                    finalPurchaseOrderId
                );


            if (!purchaseOrder) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found"
                });
            }


            if (
                purchaseOrder.customerId.toString() !==
                customerId.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order does not belong to this customer"
                });
            }
        }


        const existingUnit =
            await NetworkUnit.findOne({
                customerId,
                purchaseOrderId:
                    finalPurchaseOrderId,
                unitCode:
                    unitCode.trim(),
                hostname:
                    hostname
                        ? hostname.trim()
                        : ""
            });


        if (existingUnit) {
            return res.status(409).json({
                success: false,
                message:
                    "Network unit already exists"
            });
        }


        const networkUnit =
            await NetworkUnit.create({
                customerId,

                purchaseOrderId:
                    finalPurchaseOrderId,

                unitCode:
                    unitCode.trim(),

                hostname:
                    hostname
                        ? hostname.trim()
                        : "",

                radioConfiguration:
                    radioConfiguration
                        ? radioConfiguration.trim()
                        : "",

                additionalFields:
                    additionalFields || {}
            });


        return res.status(201).json({
            success: true,
            message:
                "Network unit created successfully",
            data: networkUnit
        });

    } catch (error) {

        console.error(
            "Error creating network unit:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create network unit",
            error:
                error.message
        });
    }
};


/* =========================================================
   GET ALL NETWORK UNITS
========================================================= */

export const getNetworkUnits = async (
    req,
    res
) => {
    try {

        const units =
            await NetworkUnit.find()
                .populate("customerId")
                .populate("purchaseOrderId")
                .sort({
                    createdAt:
                        -1
                });


        return res.status(200).json({
            success: true,
            count:
                units.length,
            data:
                units
        });

    } catch (error) {

        console.error(
            "Error fetching network units:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch network units",
            error:
                error.message
        });
    }
};


/* =========================================================
   GET NETWORK UNIT BY ID
========================================================= */

export const getNetworkUnitById = async (
    req,
    res
) => {
    try {

        const unit =
            await NetworkUnit.findById(
                req.params.id
            )
                .populate("customerId")
                .populate("purchaseOrderId");


        if (!unit) {
            return res.status(404).json({
                success: false,
                message:
                    "Network unit not found"
            });
        }


        return res.status(200).json({
            success: true,
            data:
                unit
        });

    } catch (error) {

        console.error(
            "Error fetching network unit:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch network unit",
            error:
                error.message
        });
    }
};


/* =========================================================
   GET UNITS BY PURCHASE ORDER
========================================================= */

export const getUnitsByPurchaseOrder =
    async (
        req,
        res
    ) => {

        try {

            const {
                purchaseOrderId
            } = req.params;


            const purchaseOrder =
                await PurchaseOrder.findById(
                    purchaseOrderId
                );


            if (!purchaseOrder) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found"
                });
            }


            const units =
                await NetworkUnit.find({
                    purchaseOrderId
                })
                    .populate("customerId")
                    .sort({
                        createdAt:
                            -1
                    });


            return res.status(200).json({
                success: true,
                count:
                    units.length,
                data:
                    units
            });

        } catch (error) {

            console.error(
                "Error fetching units by purchase order:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch units for purchase order",
                error:
                    error.message
            });
        }
    };


/* =========================================================
   GET UNITS BY CUSTOMER
========================================================= */

export const getUnitsByCustomer =
    async (
        req,
        res
    ) => {

        try {

            const {
                customerId
            } = req.params;


            const customer =
                await Customer.findById(
                    customerId
                );


            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Customer not found"
                });
            }


            const units =
                await NetworkUnit.find({
                    customerId
                })
                    .populate("purchaseOrderId")
                    .sort({
                        createdAt:
                            -1
                    });


            return res.status(200).json({
                success: true,
                count:
                    units.length,
                data:
                    units
            });

        } catch (error) {

            console.error(
                "Error fetching units by customer:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch units for customer",
                error:
                    error.message
            });
        }
    };


/* =========================================================
   UPDATE NETWORK UNIT
========================================================= */

export const updateNetworkUnit = async (
    req,
    res
) => {

    try {

        const {
            customerId,
            purchaseOrderId,
            unitCode,
            hostname,
            radioConfiguration,
            additionalFields
        } = req.body;


        const unit =
            await NetworkUnit.findById(
                req.params.id
            );


        if (!unit) {
            return res.status(404).json({
                success: false,
                message:
                    "Network unit not found"
            });
        }


        if (customerId !== undefined) {

            const customer =
                await Customer.findById(
                    customerId
                );


            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Customer not found"
                });
            }


            unit.customerId =
                customerId;
        }


        if (
            purchaseOrderId !==
            undefined
        ) {

            if (purchaseOrderId) {

                const purchaseOrder =
                    await PurchaseOrder.findById(
                        purchaseOrderId
                    );


                if (!purchaseOrder) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Purchase order not found"
                    });
                }


                if (
                    purchaseOrder.customerId.toString() !==
                    unit.customerId.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Purchase order does not belong to this customer"
                    });
                }


                unit.purchaseOrderId =
                    purchaseOrderId;

            } else {

                /*
                 * Allows a unit to become
                 * standalone without a PO.
                 */
                unit.purchaseOrderId =
                    null;
            }
        }


        if (
            unitCode !==
            undefined
        ) {
            unit.unitCode =
                unitCode.trim();
        }


        if (
            hostname !==
            undefined
        ) {
            unit.hostname =
                hostname.trim();
        }


        if (
            radioConfiguration !==
            undefined
        ) {
            unit.radioConfiguration =
                radioConfiguration.trim();
        }


        if (
            additionalFields !==
            undefined
        ) {
            unit.additionalFields =
                additionalFields;
        }


        await unit.save();


        return res.status(200).json({
            success: true,
            message:
                "Network unit updated successfully",
            data:
                unit
        });

    } catch (error) {

        console.error(
            "Error updating network unit:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update network unit",
            error:
                error.message
        });
    }
};


/* =========================================================
   DELETE NETWORK UNIT
========================================================= */

export const deleteNetworkUnit =
    async (
        req,
        res
    ) => {

        try {

            const unit =
                await NetworkUnit.findByIdAndDelete(
                    req.params.id
                );


            if (!unit) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Network unit not found"
                });
            }


            return res.status(200).json({
                success: true,
                message:
                    "Network unit deleted successfully"
            });

        } catch (error) {

            console.error(
                "Error deleting network unit:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete network unit",
                error:
                    error.message
            });
        }
    };