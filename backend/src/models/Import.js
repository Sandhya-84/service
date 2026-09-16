import mongoose from "mongoose";

const importSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
            trim: true
        },

        importedAt: {
            type: Date,
            default: Date.now
        },

        totalCustomers: {
            type: Number,
            default: 0
        },

        totalPurchaseOrders: {
            type: Number,
            default: 0
        },

        totalUnits: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["processing", "completed", "failed"],
            default: "processing"
        },

        errorMessage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Import = mongoose.model("Import", importSchema);

export default Import;