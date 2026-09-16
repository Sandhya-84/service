import NetworkUnit from "../models/NetworkUnit.js";

export const createUnit = async (req, res) => {
    try {
        const {
            unitCode,
            hostname,
            radioConfiguration,
            poNumber,
            invoiceNumber,
            supportExpiryDate,
            team,
            notes,
            renewed
        } = req.body;

        if (!unitCode) {
            return res.status(400).json({
                message: "Unit code is required"
            });
        }

        const existingUnit = await NetworkUnit.findOne({
            unitCode
        });

        if (existingUnit) {
            return res.status(400).json({
                message: "Unit already exists"
            });
        }

        const unit = await NetworkUnit.create({
            unitCode,
            hostname,
            radioConfiguration,
            poNumber,
            invoiceNumber,
            supportExpiryDate,
            team,
            notes,
            renewed
        });

        res.status(201).json({
            message: "Unit created successfully",
            unit
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create unit",
            error: error.message
        });
    }
};


export const getUnits = async (req, res) => {
    try {
        const units = await NetworkUnit.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: units.length,
            units
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch units",
            error: error.message
        });
    }
};