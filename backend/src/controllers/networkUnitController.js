import NetworkUnit from "../models/NetworkUnit.js";
import PurchaseOrder from "../models/PurchaseOrder.js";


// =====================================================
// CREATE NETWORK UNIT
// =====================================================

export const createNetworkUnit = async (req, res) => {
    try {

        const {
            purchaseOrderId,
            unitCode,
            hostname,
            radioConfiguration
        } = req.body;


        // ---------------------------------------------
        // VALIDATE PURCHASE ORDER
        // ---------------------------------------------

        if (!purchaseOrderId) {
            return res.status(400).json({
                message: "Purchase order is required"
            });
        }


        // ---------------------------------------------
        // VALIDATE UNIT CODE
        // ---------------------------------------------

        if (!unitCode || !unitCode.trim()) {
            return res.status(400).json({
                message: "Unit code is required"
            });
        }


        // ---------------------------------------------
        // CHECK PURCHASE ORDER
        // ---------------------------------------------

        const purchaseOrder =
            await PurchaseOrder.findById(
                purchaseOrderId
            );


        if (!purchaseOrder) {
            return res.status(404).json({
                message: "Purchase order not found"
            });
        }


        const cleanedUnitCode =
            unitCode.trim();


        const cleanedHostname =
            hostname?.trim() || "";


        // ---------------------------------------------
        // CHECK DUPLICATE UNIT
        // ---------------------------------------------

        const existingUnit =
            await NetworkUnit.findOne({
                purchaseOrderId,
                unitCode: cleanedUnitCode,
                hostname: cleanedHostname
            });


        if (existingUnit) {
            return res.status(409).json({
                message:
                    "This unit already exists for this purchase order"
            });
        }


        // ---------------------------------------------
        // CREATE UNIT
        // ---------------------------------------------

        const networkUnit =
            await NetworkUnit.create({

                purchaseOrderId,

                unitCode:
                    cleanedUnitCode,

                hostname:
                    cleanedHostname,

                radioConfiguration:
                    radioConfiguration?.trim() || ""

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


        return res.status(500).json({

            message:
                "Failed to create network unit",

            error:
                error.message

        });
    }
};


// =====================================================
// GET NETWORK UNITS
// =====================================================

export const getNetworkUnits = async (req, res) => {
    try {

        const {
            purchaseOrderId
        } = req.query;


        const query = {};


        if (purchaseOrderId) {
            query.purchaseOrderId =
                purchaseOrderId;
        }


        const networkUnits =
            await NetworkUnit.find(query)
                .populate(
                    "purchaseOrderId",
                    "poNumber"
                )
                .sort({
                    createdAt: 1
                });


        return res.status(200).json({

            count:
                networkUnits.length,

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

            error:
                error.message

        });
    }
};