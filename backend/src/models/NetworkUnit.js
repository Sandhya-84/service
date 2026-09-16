import mongoose from "mongoose";

const networkUnitSchema = new mongoose.Schema(
    {
        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: true
        },

        unitCode: {
            type: String,
            required: true,
            trim: true
        },

        hostname: {
            type: String,
            trim: true
        },

        radioConfiguration: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

networkUnitSchema.index(
    {
        purchaseOrderId: 1,
        unitCode: 1,
        hostname: 1
    },
    {
        unique: true
    }
);

const NetworkUnit = mongoose.model(
    "NetworkUnit",
    networkUnitSchema
);

export default NetworkUnit;