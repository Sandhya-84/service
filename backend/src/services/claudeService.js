import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import EvalValue from "../models/EvalValue.js";
import ActivityLog from "../models/ActivityLog.js";
import RenewalHistory from "../models/RenewalHistory.js";

const escapeRegex = (str) => (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Format purchase order with calculated days remaining and status
 */
const formatPurchaseOrder = (po) => {
    const doc = po.toObject ? po.toObject() : { ...po };
    const rawExpiry = doc.expiryDate || doc.supportExpiryDate || null;
    const customerName = doc.customerId?.name || (typeof doc.customerId === "string" ? doc.customerId : "Unknown Customer");

    let status = "no-date";
    let daysRemaining = null;

    if (rawExpiry) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expDate = new Date(rawExpiry);
        const diffMs = expDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
            status = "expired";
        } else if (daysRemaining <= 30) {
            status = "expiring";
        } else {
            status = "active";
        }
    }

    return {
        ...doc,
        expiryDate: rawExpiry,
        supportExpiryDate: rawExpiry,
        customerName,
        status,
        daysRemaining
    };
};

/**
 * Format network unit
 */
const formatNetworkUnit = (unit) => {
    const doc = unit.toObject ? unit.toObject() : { ...unit };
    return {
        ...doc,
        customerName: doc.customerId?.name || (typeof doc.customerId === "string" ? doc.customerId : "Unknown Customer"),
        poNumber: doc.purchaseOrderId?.poNumber || "No PO Assigned",
        hasPO: Boolean(doc.purchaseOrderId)
    };
};

/**
 * Claude Tool Definitions for MongoDB Collections
 */
const CLAUDE_TOOLS = [
    {
        name: "get_company_dossier",
        description: "Retrieve comprehensive customer dossier: customer profile, all purchase orders, all network units, evaluation lab items, and contract statistics for a specific company.",
        input_schema: {
            type: "object",
            properties: {
                companyName: {
                    type: "string",
                    description: "The name of the customer or company (e.g. 'Juniper', 'Cisco', 'Acme')."
                }
            },
            required: ["companyName"]
        }
    },
    {
        name: "query_purchase_orders",
        description: "Query purchase orders with filters for expiration status, relative day windows, customer, renewal status, or operational team.",
        input_schema: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["active", "expiring", "expired", "all"],
                    description: "Contract status filter: 'expiring' (soon), 'expired' (overdue), 'active' (>30 days remaining)."
                },
                maxDaysRemaining: {
                    type: "number",
                    description: "Maximum remaining days until expiration (e.g. 50 for contracts expiring within 50 days)."
                },
                minDaysRemaining: {
                    type: "number",
                    description: "Minimum remaining days until expiration."
                },
                customerName: {
                    type: "string",
                    description: "Optional customer name to filter orders by."
                },
                team: {
                    type: "string",
                    description: "Filter by operational team (e.g. 'Alpha', 'Unassigned')."
                },
                renewed: {
                    type: "boolean",
                    description: "Filter by whether the order has been marked renewed."
                },
                limit: {
                    type: "number",
                    description: "Maximum records to return (default 50)."
                }
            }
        }
    },
    {
        name: "query_network_units",
        description: "Query network hardware units to check for unassigned equipment (missing PO), hostname search, or radio configuration.",
        input_schema: {
            type: "object",
            properties: {
                hasPO: {
                    type: "boolean",
                    description: "Set false to find unassigned equipment (units without a PO). Set true for assigned units."
                },
                customerName: {
                    type: "string",
                    description: "Optional customer name to filter units by."
                },
                hostname: {
                    type: "string",
                    description: "Filter units matching hostname."
                },
                radio: {
                    type: "string",
                    description: "Filter units matching radio configuration (e.g. '5GHz', 'dual-band')."
                },
                limit: {
                    type: "number",
                    description: "Maximum records to return (default 50)."
                }
            }
        }
    },
    {
        name: "get_system_telemetry",
        description: "Retrieve high-level system metrics: total customers, total purchase orders, active, expiring, expired, total network units, and unassigned units count.",
        input_schema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_top_customers",
        description: "Retrieve top customers ranked by network fleet size (total hardware units).",
        input_schema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Number of top customers to return (default 10)."
                }
            }
        }
    },
    {
        name: "get_recent_activity",
        description: "Retrieve recent audit logs and activity history.",
        input_schema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Number of activity logs to return (default 20)."
                }
            }
        }
    }
];

/**
 * Execute a Claude Tool against MongoDB
 */
const executeTool = async (toolName, input) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    switch (toolName) {
        case "get_company_dossier": {
            const regex = new RegExp(escapeRegex(input.companyName), "i");
            const customer = await Customer.findOne({ name: { $regex: regex } });

            if (!customer) {
                return {
                    found: false,
                    message: `No customer found matching "${input.companyName}".`
                };
            }

            const [pos, units, evals, logs] = await Promise.all([
                PurchaseOrder.find({ customerId: customer._id })
                    .populate("customerId", "name")
                    .sort({ supportExpiryDate: 1, expiryDate: 1 }),
                NetworkUnit.find({ customerId: customer._id })
                    .populate("customerId", "name")
                    .populate("purchaseOrderId", "poNumber")
                    .sort({ unitCode: 1 }),
                EvalValue.find({ customer: { $regex: new RegExp(escapeRegex(customer.name), "i") } }),
                ActivityLog.find({
                    $or: [
                        { customerId: customer._id },
                        { customerName: { $regex: new RegExp(escapeRegex(customer.name), "i") } }
                    ]
                }).sort({ createdAt: -1 }).limit(10)
            ]);

            const formattedPOs = pos.map(formatPurchaseOrder);
            const formattedUnits = units.map(formatNetworkUnit);

            let activeCount = 0;
            let expiringCount = 0;
            let expiredCount = 0;
            const teamsSet = new Set();

            formattedPOs.forEach(p => {
                if (p.status === "active") activeCount++;
                else if (p.status === "expiring") expiringCount++;
                else if (p.status === "expired") expiredCount++;
                if (p.team && p.team !== "Unassigned") teamsSet.add(p.team);
            });

            const assignedUnits = formattedUnits.filter(u => u.hasPO).length;
            const unassignedUnits = formattedUnits.filter(u => !u.hasPO).length;

            return {
                found: true,
                customer: customer.toObject ? customer.toObject() : customer,
                stats: {
                    totalPOs: formattedPOs.length,
                    activePOs: activeCount,
                    expiringPOs: expiringCount,
                    expiredPOs: expiredCount,
                    totalUnits: formattedUnits.length,
                    assignedUnits,
                    unassignedUnits,
                    teams: Array.from(teamsSet)
                },
                purchaseOrders: formattedPOs,
                networkUnits: formattedUnits,
                evalValues: evals,
                activityLogs: logs
            };
        }

        case "query_purchase_orders": {
            const query = {};

            if (input.customerName) {
                const cust = await Customer.findOne({ name: { $regex: new RegExp(escapeRegex(input.customerName), "i") } });
                if (cust) query.customerId = cust._id;
            }

            if (typeof input.renewed === "boolean") {
                query.renewed = input.renewed;
            }

            if (input.team) {
                query.team = { $regex: new RegExp(escapeRegex(input.team), "i") };
            }

            if (input.status === "expired") {
                query.$or = [{ expiryDate: { $lt: today } }, { supportExpiryDate: { $lt: today } }];
            } else if (input.status === "active") {
                query.$or = [{ expiryDate: { $gt: thirtyDaysFromNow } }, { supportExpiryDate: { $gt: thirtyDaysFromNow } }];
            } else if (input.status === "expiring" || input.maxDaysRemaining !== undefined) {
                const days = input.maxDaysRemaining || 30;
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + days);
                futureDate.setHours(23, 59, 59, 999);

                query.$or = [
                    { expiryDate: { $gte: today, $lte: futureDate } },
                    { supportExpiryDate: { $gte: today, $lte: futureDate } }
                ];
            }

            const pos = await PurchaseOrder.find(query)
                .populate("customerId", "name")
                .sort({ supportExpiryDate: 1, expiryDate: 1 })
                .limit(input.limit || 50);

            return {
                count: pos.length,
                purchaseOrders: pos.map(formatPurchaseOrder)
            };
        }

        case "query_network_units": {
            const query = {};

            if (input.customerName) {
                const cust = await Customer.findOne({ name: { $regex: new RegExp(escapeRegex(input.customerName), "i") } });
                if (cust) query.customerId = cust._id;
            }

            if (input.hasPO === false) {
                query.$or = [{ purchaseOrderId: null }, { purchaseOrderId: { $exists: false } }];
            } else if (input.hasPO === true) {
                query.purchaseOrderId = { $ne: null, $exists: true };
            }

            if (input.hostname) {
                query.hostname = { $regex: new RegExp(escapeRegex(input.hostname), "i") };
            }

            if (input.radio) {
                query.radioConfiguration = { $regex: new RegExp(escapeRegex(input.radio), "i") };
            }

            const units = await NetworkUnit.find(query)
                .populate("customerId", "name")
                .populate("purchaseOrderId", "poNumber")
                .sort({ unitCode: 1 })
                .limit(input.limit || 50);

            return {
                count: units.length,
                networkUnits: units.map(formatNetworkUnit)
            };
        }

        case "get_system_telemetry": {
            const [
                totalCustomers,
                totalPOs,
                totalUnits,
                expiringCount,
                expiredCount,
                activeCount,
                unassignedUnitsCount,
                renewedCount
            ] = await Promise.all([
                Customer.countDocuments(),
                PurchaseOrder.countDocuments(),
                NetworkUnit.countDocuments(),
                PurchaseOrder.countDocuments({
                    $or: [
                        { expiryDate: { $gte: today, $lte: thirtyDaysFromNow } },
                        { supportExpiryDate: { $gte: today, $lte: thirtyDaysFromNow } }
                    ]
                }),
                PurchaseOrder.countDocuments({
                    $or: [
                        { expiryDate: { $lt: today } },
                        { supportExpiryDate: { $lt: today } }
                    ]
                }),
                PurchaseOrder.countDocuments({
                    $or: [
                        { expiryDate: { $gt: thirtyDaysFromNow } },
                        { supportExpiryDate: { $gt: thirtyDaysFromNow } }
                    ]
                }),
                NetworkUnit.countDocuments({
                    $or: [{ purchaseOrderId: null }, { purchaseOrderId: { $exists: false } }]
                }),
                PurchaseOrder.countDocuments({ renewed: true })
            ]);

            return {
                systemStats: {
                    customers: totalCustomers,
                    purchaseOrders: totalPOs,
                    networkUnits: totalUnits,
                    active: activeCount,
                    expiring: expiringCount,
                    expired: expiredCount,
                    renewed: renewedCount,
                    missingPO: unassignedUnitsCount,
                    assignedUnits: totalUnits - unassignedUnitsCount
                }
            };
        }

        case "get_top_customers": {
            const customerAgg = await NetworkUnit.aggregate([
                { $group: { _id: "$customerId", unitCount: { $sum: 1 } } },
                { $sort: { unitCount: -1 } },
                { $limit: input.limit || 10 }
            ]);

            const topCustomers = await Promise.all(
                customerAgg.map(async (item) => {
                    const cust = await Customer.findById(item._id);
                    const poCount = await PurchaseOrder.countDocuments({ customerId: item._id });
                    return {
                        _id: item._id,
                        name: cust?.name || "Unknown Customer",
                        unitCount: item.unitCount,
                        poCount
                    };
                })
            );

            return { topCustomers };
        }

        case "get_recent_activity": {
            const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(input.limit || 20);
            return { activityLogs: logs };
        }

        default:
            return { error: `Unknown tool: ${toolName}` };
    }
};

/**
 * Execute a conversational query through Anthropic Claude Messages API
 * @param {string} prompt 
 * @returns {Promise<Object>}
 */
export const runClaudeQuery = async (prompt) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey.includes("your_api_key_here")) {
        return { success: false, reason: "NO_API_KEY" };
    }

    const model = process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022";

    const systemPrompt = `You are Candela Assistant, an AI expert connected directly to the Candela Network Support Renewal Tracker MongoDB database.
You have access to live database tools to inspect Customers, Purchase Orders (support contracts), Network Units (hardware equipment), and telemetry.
When a user asks any query:
1. Call the appropriate database tools to fetch the exact records.
2. Formulate a concise, clear, and professional summary answering the user's question directly.
3. Highlight key numbers (e.g. days remaining, unassigned count, status).`;

    const messages = [
        {
            role: "user",
            content: prompt
        }
    ];

    const accumulatedData = {
        purchaseOrders: [],
        networkUnits: [],
        customers: [],
        evalValues: [],
        activityLogs: [],
        companyDetails: null,
        systemStats: null,
        topCustomers: null
    };

    try {
        // Initial call to Claude
        let response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                model,
                max_tokens: 1024,
                system: systemPrompt,
                messages,
                tools: CLAUDE_TOOLS
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Claude API error response:", response.status, errBody);
            return { success: false, reason: "API_ERROR", status: response.status, error: errBody };
        }

        let responseData = await response.json();

        // If Claude decides to call tools, execute them and send tool results back
        let iterations = 0;
        while (responseData.stop_reason === "tool_use" && iterations < 5) {
            iterations++;
            const toolUseBlocks = responseData.content.filter(b => b.type === "tool_use");

            messages.push({
                role: "assistant",
                content: responseData.content
            });

            const toolResultContents = [];

            for (const toolUse of toolUseBlocks) {
                const toolResult = await executeTool(toolUse.name, toolUse.input);

                // Accumulate records for React UI cards
                if (toolResult.purchaseOrders) accumulatedData.purchaseOrders.push(...toolResult.purchaseOrders);
                if (toolResult.networkUnits) accumulatedData.networkUnits.push(...toolResult.networkUnits);
                if (toolResult.customer) accumulatedData.customers.push(toolResult.customer);
                if (toolResult.companyDetails || (toolResult.found && toolResult.stats)) {
                    accumulatedData.companyDetails = {
                        customer: toolResult.customer,
                        stats: toolResult.stats
                    };
                }
                if (toolResult.systemStats) accumulatedData.systemStats = toolResult.systemStats;
                if (toolResult.topCustomers) accumulatedData.topCustomers = toolResult.topCustomers;
                if (toolResult.activityLogs) accumulatedData.activityLogs.push(...toolResult.activityLogs);
                if (toolResult.evalValues) accumulatedData.evalValues.push(...toolResult.evalValues);

                toolResultContents.push({
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(toolResult)
                });
            }

            messages.push({
                role: "user",
                content: toolResultContents
            });

            // Follow-up call so Claude can review the DB output and write final answer
            response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages,
                    tools: CLAUDE_TOOLS
                })
            });

            if (!response.ok) {
                break;
            }

            responseData = await response.json();
        }

        // Extract Claude's final text analysis
        const textBlocks = responseData.content?.filter(b => b.type === "text") || [];
        const claudeAnalysis = textBlocks.map(b => b.text).join("\n").trim();

        return {
            success: true,
            claudePowered: true,
            model,
            summary: claudeAnalysis || "Claude analyzed and retrieved records from MongoDB.",
            ...accumulatedData,
            count: {
                purchaseOrders: accumulatedData.purchaseOrders.length,
                networkUnits: accumulatedData.networkUnits.length,
                customers: accumulatedData.customers.length,
                total: accumulatedData.purchaseOrders.length + accumulatedData.networkUnits.length + accumulatedData.customers.length
            }
        };
    } catch (err) {
        console.error("Claude Service execution error:", err);
        return { success: false, reason: "EXCEPTION", error: err.message };
    }
};

export default {
    runClaudeQuery,
    CLAUDE_TOOLS
};
