import mongoose from "mongoose";

const evalValueSchema = new mongoose.Schema(
    {
        unit: {
            type: String,
            trim: true,
            default: ""
        },

        hostname: {
            type: String,
            trim: true,
            default: ""
        },

        radioConfig: {
            type: String,
            trim: true,
            default: ""
        },

        shipmentDate: {
            type: String,
            trim: true,
            default: ""
        },

        customer: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const EvalValue = mongoose.model(
    "EvalValue",
    evalValueSchema
);

export default EvalValue;