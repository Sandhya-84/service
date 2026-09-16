import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        poNumber: {
            type: String,
            required: true,
            trim: true
        },

        invoiceNumber: {
            type: String,
            trim: true
        },

        supportExpiryDate: {
            type: Date
        },

        team: {
            type: String,
            trim: true,
            default: "Unassigned"
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        },

        renewed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

purchaseOrderSchema.index(
    {
        customerId: 1,
        poNumber: 1
    },
    {
        unique: true
    }
);

const PurchaseOrder = mongoose.model(
    "PurchaseOrder",
    purchaseOrderSchema
);

export default PurchaseOrder;