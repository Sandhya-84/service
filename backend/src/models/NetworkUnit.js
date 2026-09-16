import mongoose from "mongoose";

const networkUnitSchema = new mongoose.Schema(
    {
        unitCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        hostname: {
            type: String,
            trim: true
        },

        radioConfiguration: {
            type: String,
            trim: true
        },

        poNumber: {
            type: String,
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
            trim: true
        },

        notes: {
            type: String,
            trim: true
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

const NetworkUnit = mongoose.model(
    "NetworkUnit",
    networkUnitSchema
);

export default NetworkUnit;