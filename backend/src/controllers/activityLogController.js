import ActivityLog from "../models/ActivityLog.js";

export const createActivityLog = async (req, res) => {
    try {
        const {
            action,
            title,
            description,
            customerName,
            customerId,
            purchaseOrderId,
            poNumber,
            unitId,
            unitCode,
            unitCount,
            details
        } = req.body;

        if (!action || !title || !description) {
            return res.status(400).json({
                message:
                    "Action, title and description are required"
            });
        }

        const performedBy =
            req.user?._id ||
            req.user?.id ||
            null;

        const activity =
            await ActivityLog.create({
                action,
                title,
                description,
                customerName:
                    customerName || "",
                customerId:
                    customerId || null,
                purchaseOrderId:
                    purchaseOrderId || null,
                poNumber:
                    poNumber || "",
                unitId:
                    unitId || null,
                unitCode:
                    unitCode || "",
                unitCount:
                    unitCount || 1,
                details:
                    details || "",
                performedBy
            });

        return res.status(201).json({
            message:
                "Activity logged successfully",
            activity
        });

    } catch (error) {
        console.error(
            "Create activity log error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create activity log",
            error:
                error.message
        });
    }
};

export const getActivityLogs = async (
    req,
    res
) => {
    try {
        let limit =
            Number(req.query.limit) || 50;

        if (limit < 1) {
            limit = 50;
        }

        if (limit > 100) {
            limit = 100;
        }

        const activities =
            await ActivityLog.find()
                .sort({
                    createdAt: -1
                })
                .limit(limit)
                .lean();

        return res.status(200).json({
            message:
                "Activity logs fetched successfully",
            activities
        });

    } catch (error) {
        console.error(
            "Get activity logs error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch activity logs",
            error:
                error.message
        });
    }
};