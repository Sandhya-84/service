import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";


export const getDashboardSummary = async (req, res) => {
    try {

        // Total counts
        const totalCustomers = await Customer.countDocuments();

        const totalPurchaseOrders =
            await PurchaseOrder.countDocuments();

        const totalUnits =
            await NetworkUnit.countDocuments();


        // Today's date
        const today = new Date();

        today.setHours(0, 0, 0, 0);


        // Date after 30 days
        const thirtyDaysFromNow = new Date(today);

        thirtyDaysFromNow.setDate(
            thirtyDaysFromNow.getDate() + 30
        );


        // Expired
        const expired =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $lt: today
                }
            });


        // Expiring within next 30 days
        const expiringSoon =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $gte: today,
                    $lte: thirtyDaysFromNow
                }
            });


        // Active = expiry date more than 30 days away
        const active =
            await PurchaseOrder.countDocuments({
                supportExpiryDate: {
                    $gt: thirtyDaysFromNow
                }
            });


        // No expiry date
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
            message: "Dashboard summary fetched successfully",

            summary: {
                totalCustomers,
                totalPurchaseOrders,
                totalUnits,
                active,
                expiringSoon,
                expired,
                noExpiryDate
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

export const getDashboardStatus = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expired = await PurchaseOrder.countDocuments({
            supportExpiryDate: { $lt: today }
        });

        const expiringSoon = await PurchaseOrder.countDocuments({
            supportExpiryDate: {
                $gte: today,
                $lte: thirtyDaysFromNow
            }
        });

        const active = await PurchaseOrder.countDocuments({
            supportExpiryDate: { $gt: thirtyDaysFromNow }
        });

        const noExpiryDate = await PurchaseOrder.countDocuments({
            $or: [
                { supportExpiryDate: { $exists: false } },
                { supportExpiryDate: null }
            ]
        });

        res.status(200).json({
            message: "Dashboard status fetched successfully",
            status: {
                active,
                expiringSoon,
                expired,
                noExpiryDate
            }
        });

    } catch (error) {
        console.error("Dashboard status error:", error);

        res.status(500).json({
            message: "Failed to fetch dashboard status",
            error: error.message
        });
    }
};
export const getDashboardData = async (req, res) => {
    try {
        const customers = await Customer.find()
            .sort({ name: 1 })
            .lean();

        const purchaseOrders = await PurchaseOrder.find()
            .sort({ createdAt: -1 })
            .lean();

        const networkUnits = await NetworkUnit.find()
            .sort({ createdAt: 1 })
            .lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(
            thirtyDaysFromNow.getDate() + 30
        );

        const customerMap = {};

        customers.forEach((customer) => {
            customerMap[customer._id.toString()] = {
                _id: customer._id,
                name: customer.name,
                purchaseOrders: []
            };
        });

        const purchaseOrderMap = {};

        purchaseOrders.forEach((po) => {

            // Skip invalid purchase orders
            // that don't have a customer
            if (!po.customerId) {
                console.log(
                    `Skipping PO ${po.poNumber || "unknown"} because customerId is missing`
                );
                return;
            }

            let status = "No Expiry Date";

            if (po.supportExpiryDate) {
                const expiryDate = new Date(
                    po.supportExpiryDate
                );

                expiryDate.setHours(0, 0, 0, 0);

                if (expiryDate < today) {
                    status = "Expired";
                } else if (expiryDate <= thirtyDaysFromNow) {
                    status = "Expiring ≤ 30 Days";
                } else {
                    status = "Active";
                }
            }

            const purchaseOrder = {
                _id: po._id,
                poNumber: po.poNumber,
                invoiceNumber: po.invoiceNumber || "",
                supportExpiryDate:
                    po.supportExpiryDate || null,
                team: po.team || "Unassigned",
                notes: po.notes || "",
                renewed: po.renewed || false,
                status,
                units: []
            };

            purchaseOrderMap[po._id.toString()] =
                purchaseOrder;

            const customerId =
                po.customerId.toString();

            if (customerMap[customerId]) {
                customerMap[customerId].purchaseOrders.push(
                    purchaseOrder
                );
            }
        });

        networkUnits.forEach((unit) => {

            // Skip units without a purchase order
            if (!unit.purchaseOrderId) {
                console.log(
                    `Skipping unit ${unit.unitCode || "unknown"} because purchaseOrderId is missing`
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
                    unitCode: unit.unitCode,
                    hostname: unit.hostname || "",
                    radioConfiguration:
                        unit.radioConfiguration || ""
                });
            }
        });

        const data = Object.values(customerMap);

        res.status(200).json({
            message: "Dashboard data fetched successfully",
            data
        });

    } catch (error) {
        console.error(
            "Dashboard data error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    }
};