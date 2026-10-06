import RenewalHistory from "../models/RenewalHistory.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Customer from "../models/Customer.js";
import ActivityLog from "../models/ActivityLog.js";


// =====================================================
// CREATE RENEWAL HISTORY
// =====================================================

export const createRenewalHistory = async (req, res) => {
    try {

        const {
            purchaseOrderId,
            newExpiryDate,
            renewedBy,
            notes
        } = req.body;


        // ---------------------------------------------
        // VALIDATE INPUT
        // ---------------------------------------------

        if (!purchaseOrderId || !newExpiryDate) {
            return res.status(400).json({
                message:
                    "Purchase order and new expiry date are required"
            });
        }


        // ---------------------------------------------
        // FIND PURCHASE ORDER
        // ---------------------------------------------

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


        // ---------------------------------------------
        // CHECK EXISTING EXPIRY DATE
        // ---------------------------------------------

        if (!purchaseOrder.supportExpiryDate) {
            return res.status(400).json({
                message:
                    "Purchase order does not have an existing expiry date"
            });
        }


        const oldExpiryDate =
            purchaseOrder.supportExpiryDate;


        // ---------------------------------------------
        // VALIDATE NEW DATE
        // ---------------------------------------------

        const newDate =
            new Date(newExpiryDate);


        if (
            Number.isNaN(
                newDate.getTime()
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid new expiry date"
            });
        }


        // ---------------------------------------------
        // NEW DATE MUST BE LATER
        // ---------------------------------------------

        if (newDate <= oldExpiryDate) {
            return res.status(400).json({
                message:
                    "New expiry date must be later than the current expiry date"
            });
        }


        // ---------------------------------------------
        // CREATE RENEWAL HISTORY
        // ---------------------------------------------

        const renewalHistory =
            await RenewalHistory.create({

                purchaseOrderId,

                oldExpiryDate,

                newExpiryDate:
                    newDate,

                renewedBy:
                    renewedBy ||
                    undefined,

                notes:
                    notes || ""

            });


        // ---------------------------------------------
        // UPDATE PURCHASE ORDER
        // ---------------------------------------------

        purchaseOrder.supportExpiryDate =
            newDate;

        purchaseOrder.renewed =
            true;


        await purchaseOrder.save();


        // ---------------------------------------------
        // GET CUSTOMER
        // ---------------------------------------------

        const customer =
            await Customer.findById(
                purchaseOrder.customerId
            ).lean();


        // ---------------------------------------------
        // LOG ACTIVITY
        // ---------------------------------------------

        try {

            await ActivityLog.create({

                action: "renewed",

                title:
                    `Purchase Order ${
                        purchaseOrder.poNumber ||
                        ""
                    } renewed`,

                description:
                    `Support for purchase order ${
                        purchaseOrder.poNumber ||
                        ""
                    } was renewed.`,

                customerName:
                    customer?.name ||
                    "",

                customerId:
                    purchaseOrder.customerId ||
                    null,

                purchaseOrderId:
                    purchaseOrder._id,

                poNumber:
                    purchaseOrder.poNumber ||
                    "",

                unitCount:
                    0,

                details:
                    `Expiry: ${
                        oldExpiryDate
                            ? new Date(
                                oldExpiryDate
                            ).toLocaleDateString(
                                "en-IN"
                            )
                            : "No previous expiry"
                    } → ${
                        newDate.toLocaleDateString(
                            "en-IN"
                        )
                    }${
                        notes?.trim()
                            ? ` • Notes: ${notes.trim()}`
                            : ""
                    }`,

                performedBy:
                    req.user?._id ||
                    req.user?.id ||
                    null

            });

        } catch (activityError) {

            console.error(
                "Renewal activity logging error:",
                activityError
            );

        }


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(201).json({

            message:
                "Renewal recorded successfully",

            renewalHistory,

            purchaseOrder

        });

    } catch (error) {

        console.error(
            "Create renewal history error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to record renewal",

            error:
                error.message

        });
    }
};


// =====================================================
// GET RENEWAL HISTORY
// =====================================================

export const getRenewalHistory = async (
    req,
    res
) => {

    try {

        const {
            purchaseOrderId
        } = req.query;


        let query = {};


        if (purchaseOrderId) {

            query.purchaseOrderId =
                purchaseOrderId;

        }


        const history =
            await RenewalHistory.find(query)
                .populate(
                    "purchaseOrderId",
                    "poNumber supportExpiryDate"
                )
                .populate(
                    "renewedBy",
                    "name email"
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            count:
                history.length,

            history

        });

    } catch (error) {

        console.error(
            "Get renewal history error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch renewal history",

            error:
                error.message

        });
    }
};