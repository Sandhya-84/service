import Customer from "../models/Customer.js";


// =====================================================
// CREATE CUSTOMER
// =====================================================

export const createCustomer = async (req, res) => {

    try {

        const { name } = req.body;


        // Validate name
        if (!name || !name.trim()) {

            return res.status(400).json({
                message: "Customer name is required"
            });
        }


        const customerName =
            name.trim();


        // Check duplicate customer
        const existingCustomer =
            await Customer.findOne({
                name: customerName
            });


        if (existingCustomer) {

            return res.status(409).json({
                message: "Customer already exists"
            });
        }


        // Create customer
        const customer =
            await Customer.create({
                name: customerName
            });


        return res.status(201).json({

            message:
                "Customer created successfully",

            customer

        });


    } catch (error) {

        console.error(
            "Create customer error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to create customer",

            error:
                error.message

        });
    }
};



// =====================================================
// GET ALL CUSTOMERS
// =====================================================

export const getCustomers = async (req, res) => {

    try {

        const customers =
            await Customer.find()
                .sort({
                    name: 1
                });


        return res.status(200).json({

            count:
                customers.length,

            customers

        });


    } catch (error) {

        console.error(
            "Get customers error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch customers",

            error:
                error.message

        });
    }
};