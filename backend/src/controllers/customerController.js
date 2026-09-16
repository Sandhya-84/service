import Customer from "../models/Customer.js";

export const createCustomer = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

        const existingCustomer = await Customer.findOne({
            name: name.trim()
        });

        if (existingCustomer) {
            return res.status(400).json({
                message: "Customer already exists"
            });
        }

        const customer = await Customer.create({
            name: name.trim()
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


export const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find()
            .sort({ name: 1 });

        res.status(200).json({
            count: customers.length,
            customers
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch customers",
            error: error.message
        });
    }
};