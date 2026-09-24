import mongoose from "mongoose";

const networkUnitSchema =
    new mongoose.Schema(
        {
            customerId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref:
                    "Customer",
                required:
                    true
            },

            purchaseOrderId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref:
                    "PurchaseOrder",
                default:
                    null
            },

            unitCode: {
                type:
                    String,
                required:
                    true,
                trim:
                    true
            },

            hostname: {
                type:
                    String,
                trim:
                    true,
                default:
                    ""
            },

            radioConfiguration: {
                type:
                    String,
                trim:
                    true,
                default:
                    ""
            },

            additionalFields: {
                type:
                    mongoose.Schema.Types.Mixed,
                default:
                    {}
            }
        },

        {
            timestamps:
                true
        }
    );


/*
 * A unit is unique inside a customer + PO + hostname
 * combination.
 *
 * purchaseOrderId can be null for units that have
 * no PO.
 */
networkUnitSchema.index(
    {
        customerId:
            1,

        purchaseOrderId:
            1,

        unitCode:
            1,

        hostname:
            1
    },
    {
        unique:
            true
    }
);


const NetworkUnit =
    mongoose.model(
        "NetworkUnit",
        networkUnitSchema
    );

export default NetworkUnit;