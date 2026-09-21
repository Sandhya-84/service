import PurchaseOrder from "../models/PurchaseOrder.js";
import Customer from "../models/Customer.js";


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