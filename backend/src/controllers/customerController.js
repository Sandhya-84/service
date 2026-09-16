import Customer from "../models/Customer.js";

export const createCustomer = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

        const existingCustomer = await Customer.findOne({ name });

        if (existingCustomer) {
            return res.status(400).json({
                message: "Customer already exists"
            });
        }

        const customer = await Customer.create({
            name
        });

        res.status(201).json({
            message: "Customer created successfully",
            customer
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create customer",
            error: error.message
        });
    }
};