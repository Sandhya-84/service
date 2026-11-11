import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define schema models matching your database collections
// If you already have models exported from your src/models directory,
// you can import them instead (e.g., import Customer from "./src/models/Customer.js").
const Customer = mongoose.models.Customer || mongoose.model("Customer", new mongoose.Schema({}, { strict: false }));
const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", new mongoose.Schema({}, { strict: false }));
const Unit = mongoose.models.Unit || mongoose.model("Unit", new mongoose.Schema({}, { strict: false }));

const clearDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully...");

    // 2. Delete all records from specified collections
    const customerResult = await Customer.deleteMany({});
    console.log(`Cleared Customers: ${customerResult.deletedCount} records deleted.`);

    const orderResult = await PurchaseOrder.deleteMany({});
    console.log(`Cleared Purchase Orders: ${orderResult.deletedCount} records deleted.`);

    const unitResult = await Unit.deleteMany({});
    console.log(`Cleared Units: ${unitResult.deletedCount} records deleted.`);

    console.log("\nDatabase cleanup completed successfully!");
  } catch (error) {
    console.error("Error clearing database:", error.message);
  } finally {
    // 3. Disconnect from database
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
    process.exit(0);
  }
};

clearDatabase();