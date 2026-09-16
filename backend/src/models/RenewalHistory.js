import mongoose from "mongoose";

const renewalHistorySchema = new mongoose.Schema(
    {
        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: true
        },

        oldExpiryDate: {
            type: Date,
            required: true
        },

        newExpiryDate: {
            type: Date,
            required: true
        },

        renewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const RenewalHistory = mongoose.model(
    "RenewalHistory",
    renewalHistorySchema
);

export default RenewalHistory;