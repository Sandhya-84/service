import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";


// =====================================================
// DASHBOARD SUMMARY
// =====================================================

export const getDashboardSummary = async (req, res) => {
    try {
        const customersCount = await Customer.countDocuments();

        const purchaseOrdersCount =
            await PurchaseOrder.countDocuments();

        const networkUnitsCount =
            await NetworkUnit.countDocuments();

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);

        thirtyDaysFromNow.setDate(
            thirtyDaysFromNow.getDate() + 30
        );

        // Active
        const activeCount =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $gt: thirtyDaysFromNow
                }
            });

        // Expiring within 30 days
        const expiringCount =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $gte: today,
                    $lte: thirtyDaysFromNow
                }
            });

        // Expired
        const expiredCount =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $lt: today
                }
            });

        // No expiry date
        const noExpiryCount =
            await PurchaseOrder.countDocuments({
                $or: [
                    {
                        supportExpiryDate: {
                            $exists: false
                        }
                    },
                    {
                        supportExpiryDate: null
                    }
                ]
            });

       res.status(200).json({
    message: "Dashboard summary fetched successfully",

    customers: customersCount,
    purchaseOrders: purchaseOrdersCount,
    networkUnits: networkUnitsCount,
    active: activeCount,
    expiring: expiringCount,
    expired: expiredCount,
    noExpiryDate: noExpiryCount,

    summary: {
        customers: customersCount,
        purchaseOrders: purchaseOrdersCount,
        networkUnits: networkUnitsCount,
        active: activeCount,
        expiring: expiringCount,
        expired: expiredCount,
        noExpiryDate: noExpiryCount
    }
});

    } catch (error) {

        console.error(
            "Dashboard summary error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message
        });
    }
};


// =====================================================
// DASHBOARD STATUS
// =====================================================

export const getDashboardStatus = async (req, res) => {
    try {

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);

        thirtyDaysFromNow.setDate(
            thirtyDaysFromNow.getDate() + 30
        );


        const active =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $gt: thirtyDaysFromNow
                }
            });


        const expiring =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $gte: today,
                    $lte: thirtyDaysFromNow
                }
            });


        const expired =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $lt: today
                }
            });


        const noExpiryDate =
            await PurchaseOrder.countDocuments({
                $or: [
                    {
                        supportExpiryDate: {
                            $exists: false
                        }
                    },
                    {
                        supportExpiryDate: null
                    }
                ]
            });


        res.status(200).json({

            message: "Dashboard status fetched successfully",

            status: {
                active,
                expiring,
                expired,
                noExpiryDate
            }

        });

    } catch (error) {

        console.error(
            "Dashboard status error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch dashboard status",
            error: error.message
        });
    }
};


// =====================================================
// COMPLETE DASHBOARD DATA
// Customer
//      ↓
// Purchase Order
//      ↓
// Network Units
// =====================================================

export const getDashboardData = async (req, res) => {

    try {

        const customers =
            await Customer.find()
                .sort({ name: 1 })
                .lean();


        const purchaseOrders =
            await PurchaseOrder.find()
                .sort({ createdAt: -1 })
                .lean();


        const networkUnits =
            await NetworkUnit.find()
                .sort({ createdAt: 1 })
                .lean();


        // -------------------------------------------------
        // DATE CALCULATIONS
        // -------------------------------------------------

        const today = new Date();

        today.setHours(0, 0, 0, 0);


        const thirtyDaysFromNow =
            new Date(today);

        thirtyDaysFromNow.setDate(
            thirtyDaysFromNow.getDate() + 30
        );


        // -------------------------------------------------
        // CUSTOMER MAP
        // -------------------------------------------------

        const customerMap = {};


        customers.forEach((customer) => {

            customerMap[
                customer._id.toString()
            ] = {

                _id: customer._id,

                name: customer.name,

                purchaseOrders: []

            };

        });


        // -------------------------------------------------
        // PURCHASE ORDER MAP
        // -------------------------------------------------

        const purchaseOrderMap = {};


        purchaseOrders.forEach((po) => {

            if (!po.customerId) {

                console.log(
                    `Skipping PO ${
                        po.poNumber || "unknown"
                    } because customerId is missing`
                );

                return;
            }


            // ---------------------------------------------
            // DETERMINE STATUS
            // ---------------------------------------------

            let status = "No Expiry Date";


            if (po.supportExpiryDate) {

                const expiryDate =
                    new Date(
                        po.supportExpiryDate
                    );

                expiryDate.setHours(
                    0,
                    0,
                    0,
                    0
                );


                if (expiryDate < today) {

                    status = "Expired";

                } else if (
                    expiryDate <=
                    thirtyDaysFromNow
                ) {

                    status =
                        "Expiring ≤ 30 Days";

                } else {

                    status = "Active";

                }

            }


            // ---------------------------------------------
            // CREATE PURCHASE ORDER OBJECT
            // ---------------------------------------------

            const purchaseOrder = {

                _id: po._id,

                poNumber:
                    po.poNumber || "",

                invoiceNumber:
                    po.invoiceNumber || "",

                supportExpiryDate:
                    po.supportExpiryDate || null,

                team:
                    po.team || "Unassigned",

                notes:
                    po.notes || "",

                renewed:
                    po.renewed || false,

                status,

                units: []

            };


            purchaseOrderMap[
                po._id.toString()
            ] = purchaseOrder;


            // ---------------------------------------------
            // ADD PO TO CUSTOMER
            // ---------------------------------------------

            const customerId =
                po.customerId.toString();


            if (
                customerMap[customerId]
            ) {

                customerMap[
                    customerId
                ].purchaseOrders.push(
                    purchaseOrder
                );

            }

        });


        // -------------------------------------------------
        // ADD NETWORK UNITS TO THEIR PO
        // -------------------------------------------------

        networkUnits.forEach((unit) => {

            if (!unit.purchaseOrderId) {

                console.log(
                    `Skipping unit ${
                        unit.unitCode || "unknown"
                    } because purchaseOrderId is missing`
                );

                return;

            }


            const purchaseOrder =
                purchaseOrderMap[
                    unit.purchaseOrderId.toString()
                ];


            if (purchaseOrder) {

                purchaseOrder.units.push({

                    _id: unit._id,

                    unitCode:
                        unit.unitCode || "",

                    hostname:
                        unit.hostname || "",

                    radioConfiguration:
                        unit.radioConfiguration || ""

                });

            }

        });


        // -------------------------------------------------
        // FINAL DATA
        // -------------------------------------------------

        const data =
            Object.values(customerMap);


        res.status(200).json({

            message:
                "Dashboard data fetched successfully",

            data

        });


    } catch (error) {

        console.error(
            "Dashboard data error:",
            error
        );


        res.status(500).json({

            message:
                "Failed to fetch dashboard data",

            error:
                error.message

        });

    }

};