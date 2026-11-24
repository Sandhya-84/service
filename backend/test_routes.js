import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import express from "express";
import assistantRoutes from "./src/routes/assistantRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/assistant", assistantRoutes);

async function runTests() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB!");

        const server = app.listen(5099, async () => {
            console.log("Test server running on port 5099");

            const prompts = [
                "give me the pos of Capgemini",
                "units without po",
                "rma units",
                "summary",
                "expiring in 30 days"
            ];

            for (const p of prompts) {
                console.log(`\n========================================`);
                console.log(`TEST PROMPT: "${p}"`);
                console.log(`========================================`);
                try {
                    const res = await fetch("http://localhost:5099/api/assistant/query", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: p })
                    });
                    const data = await res.json();
                    console.log(`Status: ${res.status}`);
                    console.log(`Engine: ${data.engine}`);
                    console.log(`QueryType: ${data.queryType}`);
                    console.log(`Summary: ${data.summary}`);
                    console.log(`Records count: ${data.records?.length || 0}`);
                    console.log(`POs count: ${data.purchaseOrders?.length || 0}`);
                    console.log(`Units count: ${data.networkUnits?.length || 0}`);
                    if (data.companyDetails) {
                        console.log(`Company Dossier: ${data.companyDetails.customer?.name} - Total POs: ${data.companyDetails.stats?.totalPOs}`);
                    }
                } catch (e) {
                    console.error("Fetch error for prompt:", p, e);
                }
            }

            console.log("\nAll prompt tests completed successfully!");
            server.close();
            await mongoose.disconnect();
            process.exit(0);
        });
    } catch (err) {
        console.error("Test error:", err);
        process.exit(1);
    }
}

runTests();
