import PurchaseOrder from "../models/PurchaseOrder.js";
import Customer from "../models/Customer.js";
import ActivityLog from "../models/ActivityLog.js";


// =====================================================
// CREATE PURCHASE ORDER
// =====================================================

export const createPurchaseOrder = async (req, res) => {
    try {

        const {
            customerId,
            poNumber,
            invoiceNumber,
            supportExpiryDate,
            nextRenewalDate,
            team,
            notes,
            renewed
        } = req.body;


        // ---------------------------------------------
        // VALIDATE CUSTOMER
        // ---------------------------------------------

        if (!customerId) {
            return res.status(400).json({
                message: "Customer is required"
            });
        }


        // ---------------------------------------------
        // VALIDATE PO NUMBER
        // ---------------------------------------------

        if (!poNumber || !poNumber.trim()) {
            return res.status(400).json({
                message: "PO number is required"
            });
        }


        // ---------------------------------------------
        // CHECK CUSTOMER EXISTS
        // ---------------------------------------------

        const customer =
            await Customer.findById(customerId);


        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }


        const cleanedPONumber =
            poNumber.trim();


        // ---------------------------------------------
        // CHECK DUPLICATE PO
        // ---------------------------------------------

        const existingPurchaseOrder =
            await PurchaseOrder.findOne({
                customerId,
                poNumber: cleanedPONumber
            });


        if (existingPurchaseOrder) {
            return res.status(409).json({
                message:
                    "This purchase order already exists for this customer"
            });
        }


        // ---------------------------------------------
        // CREATE PURCHASE ORDER
        // ---------------------------------------------

        const purchaseOrder =
            await PurchaseOrder.create({

                customerId,

                poNumber:
                    cleanedPONumber,

                invoiceNumber:
                    invoiceNumber?.trim() || "",

                supportExpiryDate:
                    supportExpiryDate || null,

                nextRenewalDate:
                    nextRenewalDate || null,

                team:
                    team?.trim() || "Unassigned",

                notes:
                    notes?.trim() || "",

                renewed:
                    renewed === true

            });


        // ---------------------------------------------
        // LOG ACTIVITY
        // ---------------------------------------------

        try {

            await ActivityLog.create({

                action: "created",

                title:
                    `Purchase Order ${purchaseOrder.poNumber} created`,

                description:
                    `Purchase order ${purchaseOrder.poNumber} was created.`,

                customerName:
                    customer.name || "",

                customerId:
                    purchaseOrder.customerId,

                purchaseOrderId:
                    purchaseOrder._id,

                poNumber:
                    purchaseOrder.poNumber,

                unitCount: 0,

                details:
                    `Invoice: ${
                        purchaseOrder.invoiceNumber ||
                        "Not provided"
                    }`,

                performedBy:
                    req.user?._id ||
                    req.user?.id ||
                    null

            });

        } catch (activityError) {

            console.error(
                "Create PO activity logging error:",
                activityError
            );

        }


        return res.status(201).json({

            message:
                "Purchase order created successfully",

            purchaseOrder

        });

    } catch (error) {

        console.error(
            "Create purchase order error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to create purchase order",

            error:
                error.message

        });
    }
};


// =====================================================
// GET PURCHASE ORDERS
// =====================================================

export const getPurchaseOrders = async (req, res) => {
    try {

        const {
            customerId
        } = req.query;


        const query = {};


        if (customerId) {
            query.customerId = customerId;
        }


        const purchaseOrders =
            await PurchaseOrder.find(query)
                .populate(
                    "customerId",
                    "name"
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            count:
                purchaseOrders.length,

            purchaseOrders

        });

    } catch (error) {

        console.error(
            "Get purchase orders error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch purchase orders",

            error:
                error.message

        });
    }
};


// =====================================================
// UPDATE PURCHASE ORDER
// =====================================================

export const updatePurchaseOrder = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


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

                message:
                    "Purchase order not found"

            });
        }


        // ---------------------------------------------
        // STORE OLD VALUES
        // ---------------------------------------------

        const oldValues = {

            team:
                purchaseOrder.team || "",

            notes:
                purchaseOrder.notes || "",

            renewed:
                Boolean(
                    purchaseOrder.renewed
                ),

            nextRenewalDate:
                purchaseOrder.nextRenewalDate ||
                null

        };


        // ---------------------------------------------
        // UPDATE FIELDS
        // ---------------------------------------------

        if (team !== undefined) {

            purchaseOrder.team =
                team;
        }


        if (notes !== undefined) {

            purchaseOrder.notes =
                notes;
        }


        if (renewed !== undefined) {

            purchaseOrder.renewed =
                renewed;
        }


        if (
            nextRenewalDate !== undefined
        ) {

            purchaseOrder.nextRenewalDate =
                nextRenewalDate || null;
        }


        await purchaseOrder.save();


        // ---------------------------------------------
        // DETECT CHANGES
        // ---------------------------------------------

        const changes = [];


        if (
            team !== undefined &&
            oldValues.team !==
                (purchaseOrder.team || "")
        ) {

            changes.push(
                `Team: ${
                    oldValues.team ||
                    "Unassigned"
                } → ${
                    purchaseOrder.team ||
                    "Unassigned"
                }`
            );

        }


        if (
            notes !== undefined &&
            oldValues.notes !==
                (purchaseOrder.notes || "")
        ) {

            changes.push(
                "Notes updated"
            );

        }


        if (
            renewed !== undefined &&
            oldValues.renewed !==
                Boolean(
                    purchaseOrder.renewed
                )
        ) {

            changes.push(
                `Renewed: ${
                    oldValues.renewed
                        ? "Yes"
                        : "No"
                } → ${
                    purchaseOrder.renewed
                        ? "Yes"
                        : "No"
                }`
            );

        }


        if (
            nextRenewalDate !== undefined &&
            String(
                oldValues.nextRenewalDate || ""
            ) !==
                String(
                    purchaseOrder.nextRenewalDate || ""
                )
        ) {

            changes.push(
                "Next Renewal Date updated"
            );

        }


        // ---------------------------------------------
        // LOG PO UPDATE ACTIVITY
        // ---------------------------------------------

        if (changes.length > 0) {

            try {

                const customer =
                    await Customer.findById(
                        purchaseOrder.customerId
                    ).lean();


                await ActivityLog.create({

                    action: "po-updated",

                    title:
                        `Purchase Order ${
                            purchaseOrder.poNumber ||
                            ""
                        } updated`,

                    description:
                        `Purchase order ${
                            purchaseOrder.poNumber ||
                            ""
                        } was updated.`,

                    customerName:
                        customer?.name || "",

                    customerId:
                        purchaseOrder.customerId ||
                        null,

                    purchaseOrderId:
                        purchaseOrder._id,

                    poNumber:
                        purchaseOrder.poNumber ||
                        "",

                    unitCount: 0,

                    details:
                        changes.join(" • "),

                    performedBy:
                        req.user?._id ||
                        req.user?.id ||
                        null

                });

            } catch (activityError) {

                console.error(
                    "PO activity logging error:",
                    activityError
                );

            }

        }


        return res.status(200).json({

            message:
                "Purchase order updated successfully",

            purchaseOrder

        });

    } catch (error) {

        console.error(
            "Update purchase order error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to update purchase order",

            error:
                error.message

        });
    }
};