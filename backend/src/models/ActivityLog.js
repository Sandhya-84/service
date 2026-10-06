import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            trim: true,
            enum: [
                "created",
                "edited",
                "deleted",
                "renewed",
                "po-updated",
                "imported"
            ]
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        customerName: {
            type: String,
            trim: true,
            default: ""
        },

        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null
        },

        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            default: null
        },

        poNumber: {
            type: String,
            trim: true,
            default: ""
        },

        unitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NetworkUnit",
            default: null
        },

        unitCode: {
            type: String,
            trim: true,
            default: ""
        },

        unitCount: {
            type: Number,
            default: 1
        },

        details: {
            type: String,
            trim: true,
            default: ""
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

activityLogSchema.index({
    createdAt: -1
});

activityLogSchema.index({
    action: 1,
    createdAt: -1
});

const ActivityLog = mongoose.model(
    "ActivityLog",
    activityLogSchema
);

export default ActivityLog;