import express from "express";
import mcpMongoManager from "../services/mcpMongoClient.js";
import { transferNaturalLanguageQuery } from "../services/nlpService.js";

const router = express.Router();

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str) => (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Fetch lookup maps for Customer IDs and PO IDs to enrich documents
 */
const fetchEntityMaps = async () => {
    const [custRes, poRes] = await Promise.all([
        mcpMongoManager.find({ collection: "customers", limit: 1000 }),
        mcpMongoManager.find({ collection: "purchaseorders", limit: 1000 })
    ]);

    const customerMap = new Map();
    if (custRes?.documents) {
        for (const c of custRes.documents) {
            customerMap.set(String(c._id), c.name);
        }
    }

    const poMap = new Map();
    if (poRes?.documents) {
        for (const p of poRes.documents) {
            poMap.set(String(p._id), p.poNumber);
        }
    }

    return { customerMap, poMap, allCustomers: custRes?.documents || [] };
};

/**
 * Helper to compute status, days remaining, and join customer name for a Purchase Order
 */
const formatPurchaseOrder = (po, customerMap) => {
    const rawExpiry = po.expiryDate || po.supportExpiryDate || null;
    let customerName = "Unknown Customer";

    if (po.customerId) {
        if (typeof po.customerId === "object" && po.customerId.name) {
            customerName = po.customerId.name;
        } else {
            const cId = String(po.customerId._id || po.customerId);
            customerName = customerMap.get(cId) || `Customer (${cId.slice(-6)})`;
        }
    }

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
        ...po,
        _id: String(po._id || ""),
        expiryDate: rawExpiry,
        supportExpiryDate: rawExpiry,
        customerName,
        status,
        daysRemaining
    };
};

/**
 * Helper to compute status and join customer name and PO number for a Network Unit
 */
const formatNetworkUnit = (unit, customerMap, poMap) => {
    let customerName = "Unknown Customer";
    if (unit.customerId) {
        if (typeof unit.customerId === "object" && unit.customerId.name) {
            customerName = unit.customerId.name;
        } else {
            const cId = String(unit.customerId._id || unit.customerId);
            customerName = customerMap.get(cId) || `Customer (${cId.slice(-6)})`;
        }
    }

    let poNumber = "No PO Assigned";
    let hasPO = false;
    if (unit.purchaseOrderId) {
        hasPO = true;
        if (typeof unit.purchaseOrderId === "object" && unit.purchaseOrderId.poNumber) {
            poNumber = unit.purchaseOrderId.poNumber;
        } else {
            const pId = String(unit.purchaseOrderId._id || unit.purchaseOrderId);
            poNumber = poMap.get(pId) || `PO (${pId.slice(-6)})`;
        }
    }

    return {
        ...unit,
        _id: String(unit._id || ""),
        customerName,
        poNumber,
        hasPO
    };
};

/**
 * GET /api/assistant/health
 * Returns live MCP server connection status and summary counts
 */
router.get("/health", async (req, res) => {
    try {
        const mcpStatus = mcpMongoManager.getStatus();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);

        // Fetch exact counts across collections via MCP count
        const [
            custCountRes,
            poCountRes,
            unitCountRes,
            expiringRes,
            expiredRes,
            missingPORes
        ] = await Promise.all([
            mcpMongoManager.count({ collection: "customers" }),
            mcpMongoManager.count({ collection: "purchaseorders" }),
            mcpMongoManager.count({ collection: "networkunits" }),
            mcpMongoManager.count({
                collection: "purchaseorders",
                query: {
                    $or: [
                        { expiryDate: { $gte: today, $lte: thirtyDaysFromNow } },
                        { supportExpiryDate: { $gte: today, $lte: thirtyDaysFromNow } }
                    ]
                }
            }),
            mcpMongoManager.count({
                collection: "purchaseorders",
                query: {
                    $or: [
                        { expiryDate: { $lt: today } },
                        { supportExpiryDate: { $lt: today } }
                    ]
                }
            }),
            mcpMongoManager.count({
                collection: "networkunits",
                query: {
                    $or: [
                        { purchaseOrderId: null },
                        { purchaseOrderId: { $exists: false } }
                    ]
                }
            })
        ]);

        const counts = {
            totalCustomers: custCountRes?.count ?? 0,
            totalPOs: poCountRes?.count ?? 0,
            expiringWithin30Days: expiringRes?.count ?? 0,
            expired: expiredRes?.count ?? 0,
            totalUnits: unitCountRes?.count ?? 0,
            missingPO: missingPORes?.count ?? 0
        };

        return res.status(200).json({
            success: true,
            status: "healthy",
            mcp: {
                connected: mcpStatus.connected,
                initializing: mcpStatus.initializing,
                server: mcpStatus.server,
                mode: mcpStatus.readOnly ? "read-only" : "read-write",
                database: mcpStatus.database,
                lastError: mcpStatus.lastError
            },
            counts,
            summary: {
                customers: counts.totalCustomers,
                purchaseOrders: counts.totalPOs,
                networkUnits: counts.totalUnits,
                expiring: counts.expiringWithin30Days,
                expired: counts.expired,
                missingPO: counts.missingPO
            }
        });
    } catch (error) {
        console.error("[Assistant Health Error]:", error);
        return res.status(200).json({
            success: true,
            status: "degraded",
            mcp: {
                connected: false,
                server: "@mongodb-js/mongodb-mcp-server",
                mode: "read-only",
                database: mcpMongoManager.getDatabaseNameFromUri?.() || "network_support_tracker",
                error: error.message
            },
            counts: {
                totalCustomers: 0,
                totalPOs: 0,
                expiringWithin30Days: 0,
                expired: 0,
                totalUnits: 0,
                missingPO: 0
            },
            summary: {
                customers: 0,
                purchaseOrders: 0,
                networkUnits: 0,
                expiring: 0,
                expired: 0,
                missingPO: 0
            }
        });
    }
});

/**
 * GET /api/assistant/summary
 * Backward-compatible alias for assistant summary counts
 */
router.get("/summary", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);

        const [
            custRes,
            poRes,
            unitRes,
            expiringRes,
            expiredRes,
            missingPORes
        ] = await Promise.all([
            mcpMongoManager.count({ collection: "customers" }),
            mcpMongoManager.count({ collection: "purchaseorders" }),
            mcpMongoManager.count({ collection: "networkunits" }),
            mcpMongoManager.count({
                collection: "purchaseorders",
                query: {
                    $or: [
                        { expiryDate: { $gte: today, $lte: thirtyDaysFromNow } },
                        { supportExpiryDate: { $gte: today, $lte: thirtyDaysFromNow } }
                    ]
                }
            }),
            mcpMongoManager.count({
                collection: "purchaseorders",
                query: {
                    $or: [
                        { expiryDate: { $lt: today } },
                        { supportExpiryDate: { $lt: today } }
                    ]
                }
            }),
            mcpMongoManager.count({
                collection: "networkunits",
                query: {
                    $or: [
                        { purchaseOrderId: null },
                        { purchaseOrderId: { $exists: false } }
                    ]
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            customers: custRes?.count ?? 0,
            purchaseOrders: poRes?.count ?? 0,
            networkUnits: unitRes?.count ?? 0,
            expiring: expiringRes?.count ?? 0,
            expired: expiredRes?.count ?? 0,
            missingPO: missingPORes?.count ?? 0
        });
    } catch (error) {
        console.error("Assistant summary error:", error);
        return res.status(200).json({
            success: true,
            customers: 0,
            purchaseOrders: 0,
            networkUnits: 0,
            expiring: 0,
            expired: 0,
            missingPO: 0
        });
    }
});

/**
 * POST /api/assistant/query
 * Translates natural-language questions into structured read-only MCP queries
 * across customers, purchaseorders, networkunits, and evalvalues.
 */
router.post("/query", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
                summary: "Please provide a query or search prompt.",
                data: {
                    purchaseOrders: [],
                    customers: [],
                    networkUnits: [],
                    evalValues: []
                }
            });
        }

        const trimmedPrompt = prompt.trim();
        const lowerPrompt = trimmedPrompt.toLowerCase();

        // 1. Fetch customer and PO mapping for entity resolution & joining
        const { customerMap, poMap, allCustomers } = await fetchEntityMaps();
        const mcpStatus = mcpMongoManager.getStatus();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);

        // 2. Perform NLP classification
        const nlp = await transferNaturalLanguageQuery(trimmedPrompt);
        let { intent, targetCustomer, nDays, subFilters } = nlp;

        // If targetCustomer wasn't detected by nlpService, check allCustomers directly against prompt
        if (!targetCustomer && allCustomers.length > 0) {
            for (const cust of allCustomers) {
                const cName = (cust.name || "").toLowerCase().trim();
                if (cName.length >= 3 && lowerPrompt.includes(cName)) {
                    targetCustomer = cust;
                    intent = "COMPANY_DOSSIER";
                    break;
                }
            }
        }

        // ==================================================================
        // CASE 1: COUNT & SUMMARY QUERIES
        // Phrases: "how many customers/POs/units", "summary", "stats", "overview"
        // ==================================================================
        if (
            intent === "SYSTEM_STATS" ||
            /\b(how\s*many|summary|overview|stats|system\s*stats|total\s*(?:counts?|pos?|units?|customers?))\b/i.test(lowerPrompt)
        ) {
            const [
                custCount,
                poCount,
                unitCount,
                expiringCount,
                expiredCount,
                missingPOCount,
                rmaCount
            ] = await Promise.all([
                mcpMongoManager.count({ collection: "customers" }),
                mcpMongoManager.count({ collection: "purchaseorders" }),
                mcpMongoManager.count({ collection: "networkunits" }),
                mcpMongoManager.count({
                    collection: "purchaseorders",
                    query: {
                        $or: [
                            { expiryDate: { $gte: today, $lte: thirtyDaysFromNow } },
                            { supportExpiryDate: { $gte: today, $lte: thirtyDaysFromNow } }
                        ]
                    }
                }),
                mcpMongoManager.count({
                    collection: "purchaseorders",
                    query: {
                        $or: [
                            { expiryDate: { $lt: today } },
                            { supportExpiryDate: { $lt: today } }
                        ]
                    }
                }),
                mcpMongoManager.count({
                    collection: "networkunits",
                    query: {
                        $or: [
                            { purchaseOrderId: null },
                            { purchaseOrderId: { $exists: false } }
                        ]
                    }
                }),
                mcpMongoManager.count({
                    collection: "networkunits",
                    query: {
                        $or: [
                            { hostname: { $regex: "rma", $options: "i" } },
                            { unitCode: { $regex: "rma", $options: "i" } }
                        ]
                    }
                })
            ]);

            const c = custCount?.count ?? 0;
            const p = poCount?.count ?? 0;
            const u = unitCount?.count ?? 0;
            const exp = expiringCount?.count ?? 0;
            const past = expiredCount?.count ?? 0;
            const noPo = missingPOCount?.count ?? 0;
            const rma = rmaCount?.count ?? 0;

            const summary = `MCP Summary: Tracking ${c} customer${c === 1 ? "" : "s"}, ${p} purchase order${p === 1 ? "" : "s"} (${exp} expiring in 30 days, ${past} expired), and ${u} network unit${u === 1 ? "" : "s"} (${noPo} without PO, ${rma} RMA).`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "system_stats",
                prompt: trimmedPrompt,
                summary,
                systemStats: {
                    customers: c,
                    purchaseOrders: p,
                    networkUnits: u,
                    expiring: exp,
                    expired: past,
                    missingPO: noPo,
                    rma
                },
                count: {
                    customers: c,
                    purchaseOrders: p,
                    networkUnits: u,
                    total: c + p + u
                },
                customers: [],
                purchaseOrders: [],
                networkUnits: [],
                evalValues: []
            });
        }

        // ==================================================================
        // CASE 2: MISSING PO & RMA QUERIES
        // Phrases: "missing po", "without po", "null po", "no po", "rma"
        // ==================================================================
        const isRmaQuery = intent === "RMA" || /\b(rma|damaged|defective|returned)\b/i.test(lowerPrompt);
        const isWithoutPoQuery = intent === "WITHOUT_PO" || /\b(missing\s*po|without\s*po|null\s*po|no\s*po|unassigned\s*units?)\b/i.test(lowerPrompt);

        if (isRmaQuery) {
            const filter = {
                $or: [
                    { hostname: { $regex: "rma", $options: "i" } },
                    { unitCode: { $regex: "rma", $options: "i" } }
                ]
            };
            const result = await mcpMongoManager.find({
                collection: "networkunits",
                filter,
                limit: 200
            });

            const formattedUnits = (result?.documents || []).map(u => formatNetworkUnit(u, customerMap, poMap));
            const summary = formattedUnits.length === 0
                ? "MCP Query: No RMA units found in current fleet."
                : `MCP Query: Found ${formattedUnits.length} RMA unit${formattedUnits.length === 1 ? "" : "s"} flagged for return or hardware replacement.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "rma_units",
                prompt: trimmedPrompt,
                summary,
                customers: [],
                purchaseOrders: [],
                networkUnits: formattedUnits,
                evalValues: [],
                count: {
                    customers: 0,
                    purchaseOrders: 0,
                    networkUnits: formattedUnits.length,
                    total: formattedUnits.length
                }
            });
        }

        if (isWithoutPoQuery) {
            const filter = {
                $or: [
                    { purchaseOrderId: null },
                    { purchaseOrderId: { $exists: false } }
                ]
            };
            const result = await mcpMongoManager.find({
                collection: "networkunits",
                filter,
                limit: 200
            });

            const formattedUnits = (result?.documents || []).map(u => formatNetworkUnit(u, customerMap, poMap));
            const summary = formattedUnits.length === 0
                ? "MCP Query: All network units are currently linked to active Purchase Orders."
                : `MCP Query: Found ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"} without an assigned Purchase Order.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "without_po",
                prompt: trimmedPrompt,
                summary,
                customers: [],
                purchaseOrders: [],
                networkUnits: formattedUnits,
                evalValues: [],
                count: {
                    customers: 0,
                    purchaseOrders: 0,
                    networkUnits: formattedUnits.length,
                    total: formattedUnits.length
                }
            });
        }

        // ==================================================================
        // CASE 3: EXPIRY & RENEWAL QUERIES
        // Phrases: "expiring soon", "expiring in 30 days", "expiring within N days",
        // "expired", "active POs", "no expiry", "renewed", "unrenewed"
        // ==================================================================
        const isExpiring = intent === "EXPIRING" || /\b(expiring|expire|lapse|lapsing|upcoming\s*expir|due\s*for\s*renewal)\b/i.test(lowerPrompt);
        const isExpired = intent === "EXPIRED" || /\b(expired|lapsed|past\s*due|overdue|terminated)\b/i.test(lowerPrompt);
        const isActive = intent === "ACTIVE" || /\b(active\s*(?:pos?|contracts?|orders?)|active)\b/i.test(lowerPrompt);
        const isNoExpiry = intent === "NO_EXPIRY" || /\b(no\s*expiry|without\s*expiry|missing\s*expiry|no\s*date)\b/i.test(lowerPrompt);

        if (isExpiring) {
            const days = nDays || 30;
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + days);
            targetDate.setHours(23, 59, 59, 999);

            const filter = {
                $or: [
                    { expiryDate: { $gte: today, $lte: targetDate } },
                    { supportExpiryDate: { $gte: today, $lte: targetDate } }
                ]
            };

            const result = await mcpMongoManager.find({
                collection: "purchaseorders",
                filter,
                sort: { expiryDate: 1, supportExpiryDate: 1 },
                limit: 200
            });

            const formattedPOs = (result?.documents || []).map(po => formatPurchaseOrder(po, customerMap));
            const summary = formattedPOs.length === 0
                ? `MCP Query: No purchase orders found expiring within ${days} days.`
                : `MCP Query: Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"} expiring within ${days} days.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "expiring",
                nDays: days,
                prompt: trimmedPrompt,
                summary,
                customers: [],
                purchaseOrders: formattedPOs,
                networkUnits: [],
                evalValues: [],
                count: {
                    customers: 0,
                    purchaseOrders: formattedPOs.length,
                    networkUnits: 0,
                    total: formattedPOs.length
                }
            });
        }

        if (isExpired) {
            const filter = {
                $or: [
                    { expiryDate: { $lt: today } },
                    { supportExpiryDate: { $lt: today } }
                ]
            };

            const result = await mcpMongoManager.find({
                collection: "purchaseorders",
                filter,
                sort: { expiryDate: -1, supportExpiryDate: -1 },
                limit: 200
            });

            const formattedPOs = (result?.documents || []).map(po => formatPurchaseOrder(po, customerMap));
            const summary = formattedPOs.length === 0
                ? "MCP Query: No expired purchase orders found."
                : `MCP Query: Found ${formattedPOs.length} expired purchase order${formattedPOs.length === 1 ? "" : "s"} past their support end date.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "expired",
                prompt: trimmedPrompt,
                summary,
                customers: [],
                purchaseOrders: formattedPOs,
                networkUnits: [],
                evalValues: [],
                count: {
                    customers: 0,
                    purchaseOrders: formattedPOs.length,
                    networkUnits: 0,
                    total: formattedPOs.length
                }
            });
        }

        if (isActive) {
            const filter = {
                $or: [
                    { expiryDate: { $gt: thirtyDaysFromNow } },
                    { supportExpiryDate: { $gt: thirtyDaysFromNow } }
                ]
            };

            const result = await mcpMongoManager.find({
                collection: "purchaseorders",
                filter,
                sort: { expiryDate: 1, supportExpiryDate: 1 },
                limit: 200
            });

            const formattedPOs = (result?.documents || []).map(po => formatPurchaseOrder(po, customerMap));
            const summary = formattedPOs.length === 0
                ? "MCP Query: No active contracts found beyond the next 30 days."
                : `MCP Query: Found ${formattedPOs.length} active purchase order${formattedPOs.length === 1 ? "" : "s"} with valid support coverage.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "active",
                prompt: trimmedPrompt,
                summary,
                customers: [],
                purchaseOrders: formattedPOs,
                networkUnits: [],
                evalValues: [],
                count: {
                    customers: 0,
                    purchaseOrders: formattedPOs.length,
                    networkUnits: 0,
                    total: formattedPOs.length
                }
            });
        }

        if (isNoExpiry) {
            const filter = {
                $or: [
                    { expiryDate: null },
                    { expiryDate: { $exists: false } },
                    { supportExpiryDate: null },
                    { supportExpiryDate: { $exists: false } }
                ]
            };

            const result = await mcpMongoManager.find({
                collection: "purchaseorders",
                filter,
                limit: 200
            });

            const formattedPOs = (result?.documents || []).map(po => formatPurchaseOrder(po, customerMap));
            const summary = formattedPOs.length === 0
                ? "MCP Query: All purchase orders have documented expiry dates."
                : `MCP Query: Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"} with no recorded expiry date.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "no_expiry",
                prompt: trimmedPrompt,
                summary,
                customers: [],
                purchaseOrders: formattedPOs,
                networkUnits: [],
                evalValues: [],
                count: {
                    customers: 0,
                    purchaseOrders: formattedPOs.length,
                    networkUnits: 0,
                    total: formattedPOs.length
                }
            });
        }

        // ==================================================================
        // CASE 4: CUSTOMER-SCOPED LOOKUP
        // Detected Customer (e.g. Comcast, Juniper, Capgemini, TataElxsi, etc.)
        // ==================================================================
        if (targetCustomer) {
            const cId = String(targetCustomer._id);
            const cName = targetCustomer.name;

            const [poResult, unitResult, evalResult] = await Promise.all([
                mcpMongoManager.aggregate({
                    collection: "purchaseorders",
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$customerId" }, cId] } } },
                        { $sort: { expiryDate: 1 } },
                        { $limit: 200 }
                    ]
                }),
                mcpMongoManager.aggregate({
                    collection: "networkunits",
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$customerId" }, cId] } } },
                        { $limit: 300 }
                    ]
                }),
                mcpMongoManager.find({
                    collection: "evalvalues",
                    filter: { customer: { $regex: escapeRegex(cName), $options: "i" } },
                    limit: 100
                })
            ]);

            const formattedPOs = (poResult?.documents || []).map(po => formatPurchaseOrder(po, customerMap));
            const formattedUnits = (unitResult?.documents || []).map(u => formatNetworkUnit(u, customerMap, poMap));
            const formattedEvals = evalResult?.documents || [];

            let activeCount = 0;
            let expiringCount = 0;
            let expiredCount = 0;
            formattedPOs.forEach(p => {
                if (p.status === "active") activeCount++;
                else if (p.status === "expiring") expiringCount++;
                else if (p.status === "expired") expiredCount++;
            });

            const assignedUnits = formattedUnits.filter(u => u.hasPO).length;
            const unassignedUnits = formattedUnits.length - assignedUnits;

            const summary = `MCP Entity Resolved: ${cName}. Found ${formattedPOs.length} Purchase Order${formattedPOs.length === 1 ? "" : "s"} (${activeCount} active, ${expiringCount} expiring, ${expiredCount} expired), and ${formattedUnits.length} Network Unit${formattedUnits.length === 1 ? "" : "s"} (${assignedUnits} assigned, ${unassignedUnits} unassigned)${formattedEvals.length > 0 ? `, plus ${formattedEvals.length} eval unit(s)` : ""}.`;

            return res.status(200).json({
                success: true,
                mcpPowered: true,
                engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                queryType: "company",
                prompt: trimmedPrompt,
                company: cName,
                summary,
                companyDetails: {
                    customer: targetCustomer,
                    stats: {
                        totalPOs: formattedPOs.length,
                        activePOs: activeCount,
                        expiringPOs: expiringCount,
                        expiredPOs: expiredCount,
                        totalUnits: formattedUnits.length,
                        assignedUnits,
                        unassignedUnits
                    }
                },
                customers: [targetCustomer],
                purchaseOrders: formattedPOs,
                networkUnits: formattedUnits,
                evalValues: formattedEvals,
                count: {
                    customers: 1,
                    purchaseOrders: formattedPOs.length,
                    networkUnits: formattedUnits.length,
                    evalValues: formattedEvals.length,
                    total: formattedPOs.length + formattedUnits.length + formattedEvals.length
                }
            });
        }

        // ==================================================================
        // CASE 5: PO NUMBER LOOKUP
        // e.g. "find PO 202021", "PO 202021", "202021"
        // ==================================================================
        const poMatch = subFilters?.poNumber || lowerPrompt.match(/\b(?:po|order)?\s*#?\s*([0-9]{4,10}|[A-Z0-9_\-]{4,15})\b/i)?.[1];
        if (poMatch && poMatch.length >= 3 && !/\b(days?|weeks?|units?|customers?)\b/i.test(poMatch)) {
            const poResult = await mcpMongoManager.find({
                collection: "purchaseorders",
                filter: { poNumber: { $regex: escapeRegex(poMatch), $options: "i" } },
                limit: 50
            });

            if (poResult?.documents && poResult.documents.length > 0) {
                const formattedPOs = poResult.documents.map(p => formatPurchaseOrder(p, customerMap));
                const poIds = formattedPOs.map(p => String(p._id));

                const unitResult = await mcpMongoManager.aggregate({
                    collection: "networkunits",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: [{ $toString: "$purchaseOrderId" }, poIds]
                                }
                            }
                        },
                        { $limit: 100 }
                    ]
                });

                const formattedUnits = (unitResult?.documents || []).map(u => formatNetworkUnit(u, customerMap, poMap));
                const summary = `MCP Query: Found ${formattedPOs.length} Purchase Order${formattedPOs.length === 1 ? "" : "s"} matching '${poMatch}' with ${formattedUnits.length} linked network unit${formattedUnits.length === 1 ? "" : "s"}.`;

                return res.status(200).json({
                    success: true,
                    mcpPowered: true,
                    engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                    queryType: "purchase_order",
                    prompt: trimmedPrompt,
                    summary,
                    customers: [],
                    purchaseOrders: formattedPOs,
                    networkUnits: formattedUnits,
                    evalValues: [],
                    count: {
                        customers: 0,
                        purchaseOrders: formattedPOs.length,
                        networkUnits: formattedUnits.length,
                        total: formattedPOs.length + formattedUnits.length
                    }
                });
            }
        }

        // ==================================================================
        // CASE 6: UNIT CODE OR HOSTNAME LOOKUP
        // e.g. "CT523c", "AT7", "candela-rma-01"
        // ==================================================================
        const codeToken = subFilters?.unitCode || subFilters?.hostname;
        const candidateToken = codeToken || lowerPrompt.replace(/^(show|find|search|lookup|get|units?|of|for|all)\s+/i, "").trim();

        if (candidateToken && candidateToken.length >= 2) {
            const unitResult = await mcpMongoManager.find({
                collection: "networkunits",
                filter: {
                    $or: [
                        { unitCode: { $regex: escapeRegex(candidateToken), $options: "i" } },
                        { hostname: { $regex: escapeRegex(candidateToken), $options: "i" } }
                    ]
                },
                limit: 100
            });

            if (unitResult?.documents && unitResult.documents.length > 0) {
                const formattedUnits = unitResult.documents.map(u => formatNetworkUnit(u, customerMap, poMap));
                const summary = `MCP Query: Found ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"} matching '${candidateToken}'.`;

                return res.status(200).json({
                    success: true,
                    mcpPowered: true,
                    engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
                    queryType: "network_units",
                    prompt: trimmedPrompt,
                    summary,
                    customers: [],
                    purchaseOrders: [],
                    networkUnits: formattedUnits,
                    evalValues: [],
                    count: {
                        customers: 0,
                        purchaseOrders: 0,
                        networkUnits: formattedUnits.length,
                        total: formattedUnits.length
                    }
                });
            }
        }

        // ==================================================================
        // CASE 7: GENERAL SEARCH FALLBACK (Across all collections)
        // ==================================================================
        const safeRegex = escapeRegex(trimmedPrompt);
        const [custRes, poRes, unitRes, evalRes] = await Promise.all([
            mcpMongoManager.find({
                collection: "customers",
                filter: { name: { $regex: safeRegex, $options: "i" } },
                limit: 20
            }),
            mcpMongoManager.find({
                collection: "purchaseorders",
                filter: {
                    $or: [
                        { poNumber: { $regex: safeRegex, $options: "i" } },
                        { invoiceNumber: { $regex: safeRegex, $options: "i" } },
                        { notes: { $regex: safeRegex, $options: "i" } }
                    ]
                },
                limit: 50
            }),
            mcpMongoManager.find({
                collection: "networkunits",
                filter: {
                    $or: [
                        { unitCode: { $regex: safeRegex, $options: "i" } },
                        { hostname: { $regex: safeRegex, $options: "i" } },
                        { radioConfiguration: { $regex: safeRegex, $options: "i" } }
                    ]
                },
                limit: 50
            }),
            mcpMongoManager.find({
                collection: "evalvalues",
                filter: {
                    $or: [
                        { customer: { $regex: safeRegex, $options: "i" } },
                        { unit: { $regex: safeRegex, $options: "i" } },
                        { hostname: { $regex: safeRegex, $options: "i" } }
                    ]
                },
                limit: 20
            })
        ]);

        const formattedPOs = (poRes?.documents || []).map(p => formatPurchaseOrder(p, customerMap));
        const formattedUnits = (unitRes?.documents || []).map(u => formatNetworkUnit(u, customerMap, poMap));
        const matchedCustomers = custRes?.documents || [];
        const matchedEvals = evalRes?.documents || [];

        const totalFound = matchedCustomers.length + formattedPOs.length + formattedUnits.length + matchedEvals.length;
        const summary = totalFound === 0
            ? `MCP Query: No records matched '${trimmedPrompt}'. Try asking about specific customers, 'expiring in 30 days', 'without po', or 'rma units'.`
            : `MCP Query: Found ${totalFound} total record${totalFound === 1 ? "" : "s"} (${matchedCustomers.length} customer${matchedCustomers.length === 1 ? "" : "s"}, ${formattedPOs.length} PO${formattedPOs.length === 1 ? "" : "s"}, ${formattedUnits.length} unit${formattedUnits.length === 1 ? "" : "s"}).`;

        return res.status(200).json({
            success: true,
            mcpPowered: true,
            engine: mcpStatus.connected ? "Model Context Protocol (MCP) Read-Only Engine" : "Mongoose Resilient Engine (MCP Initializing/Fallback)",
            queryType: "general_search",
            prompt: trimmedPrompt,
            summary,
            customers: matchedCustomers,
            purchaseOrders: formattedPOs,
            networkUnits: formattedUnits,
            evalValues: matchedEvals,
            count: {
                customers: matchedCustomers.length,
                purchaseOrders: formattedPOs.length,
                networkUnits: formattedUnits.length,
                evalValues: matchedEvals.length,
                total: totalFound
            }
        });
    } catch (err) {
        console.error("[Assistant Query Error]:", err);
        return res.status(200).json({
            success: true,
            mcpPowered: true,
            engine: "Mongoose Resilient Engine (Safety Net)",
            queryType: "error_fallback",
            prompt: req.body?.prompt || "",
            summary: "Encountered an unexpected issue running query. No records retrieved.",
            customers: [],
            purchaseOrders: [],
            networkUnits: [],
            evalValues: [],
            count: { customers: 0, purchaseOrders: 0, networkUnits: 0, total: 0 }
        });
    }
});

export default router;
