import express from "express";
import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import EvalValue from "../models/EvalValue.js";

const router = express.Router();

/**
 * Helper to compute status and remaining days for a purchase order
 */
const formatPurchaseOrder = (po) => {
    const doc = po.toObject ? po.toObject() : { ...po };
    const rawExpiry = doc.expiryDate || doc.supportExpiryDate || null;
    const customerName = doc.customerId?.name || "Unknown Customer";

    let status = "unknown";
    let daysRemaining = null;

    if (rawExpiry) {
        const now = new Date();
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
 * Helper to format network unit
 */
const formatNetworkUnit = (unit) => {
    const doc = unit.toObject ? unit.toObject() : { ...unit };
    return {
        ...doc,
        customerName: doc.customerId?.name || "Unknown Customer",
        poNumber: doc.purchaseOrderId?.poNumber || "No PO Assigned",
        hasPO: Boolean(doc.purchaseOrderId)
    };
};

/**
 * POST /api/assistant/query
 * Natural language / prompt-based query endpoint
 */
router.post("/query", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
                summary: "Please provide a valid prompt or search query.",
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Check for "expiring" (optional N days, default 30)
        const isExpiring = /\bexpiring\b/i.test(lowerPrompt);

        // 2. Check for "expired" (when not strictly inquiring about upcoming expiring)
        const isExpired = /\bexpired\b/i.test(lowerPrompt) && !isExpiring;

        // 3. Check for "missing po" or "without po"
        const isMissingPO = /\b(missing\s*po|without\s*po|no\s*po)\b/i.test(lowerPrompt);

        // ------------------------------------------------------------------
        // CASE 1: Expiring within N days (default 30)
        // ------------------------------------------------------------------
        if (isExpiring) {
            let nDays = 30;

            // Extract optional N days: e.g. "expiring in 15 days", "expiring 60", "expiring within 45 days"
            const matchExpDays = lowerPrompt.match(/expiring[^\d]*(\d+)/i) || lowerPrompt.match(/(\d+)\s*days?/i);
            if (matchExpDays && matchExpDays[1]) {
                const parsed = parseInt(matchExpDays[1], 10);
                if (!isNaN(parsed) && parsed > 0) {
                    nDays = parsed;
                }
            }

            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + nDays);
            futureDate.setHours(23, 59, 59, 999);

            const dateFilter = { $gte: today, $lte: futureDate };

            const purchaseOrders = await PurchaseOrder.find({
                $or: [
                    { expiryDate: dateFilter },
                    { supportExpiryDate: dateFilter }
                ]
            })
                .populate("customerId", "name")
                .sort({ expiryDate: 1, supportExpiryDate: 1 });

            const formattedPOs = purchaseOrders.map(formatPurchaseOrder);

            const summary = formattedPOs.length === 0
                ? `No purchase orders found expiring within ${nDays} days.`
                : `Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"} expiring within ${nDays} days.`;

            return res.status(200).json({
                success: true,
                queryType: "expiring",
                nDays,
                prompt: trimmedPrompt,
                summary,
                count: {
                    purchaseOrders: formattedPOs.length,
                    total: formattedPOs.length
                },
                purchaseOrders: formattedPOs,
                customers: [],
                networkUnits: [],
                evalValues: [],
                data: {
                    purchaseOrders: formattedPOs,
                    customers: [],
                    networkUnits: [],
                    evalValues: []
                }
            });
        }

        // ------------------------------------------------------------------
        // CASE 2: Expired purchase orders (expiryDate < today)
        // ------------------------------------------------------------------
        if (isExpired) {
            const dateFilter = { $lt: today };

            const purchaseOrders = await PurchaseOrder.find({
                $or: [
                    { expiryDate: dateFilter },
                    { supportExpiryDate: dateFilter }
                ]
            })
                .populate("customerId", "name")
                .sort({ expiryDate: -1, supportExpiryDate: -1 });

            const formattedPOs = purchaseOrders.map(formatPurchaseOrder);

            const summary = formattedPOs.length === 0
                ? "No expired purchase orders found."
                : `Found ${formattedPOs.length} expired purchase order${formattedPOs.length === 1 ? "" : "s"}.`;

            return res.status(200).json({
                success: true,
                queryType: "expired",
                prompt: trimmedPrompt,
                summary,
                count: {
                    purchaseOrders: formattedPOs.length,
                    total: formattedPOs.length
                },
                purchaseOrders: formattedPOs,
                customers: [],
                networkUnits: [],
                evalValues: [],
                data: {
                    purchaseOrders: formattedPOs,
                    customers: [],
                    networkUnits: [],
                    evalValues: []
                }
            });
        }

        // ------------------------------------------------------------------
        // CASE 3: Missing PO or without PO
        // ------------------------------------------------------------------
        if (isMissingPO) {
            const networkUnits = await NetworkUnit.find({
                $or: [
                    { purchaseOrderId: null },
                    { purchaseOrderId: { $exists: false } }
                ]
            })
                .populate("customerId", "name")
                .sort({ createdAt: -1 });

            const formattedUnits = networkUnits.map(formatNetworkUnit);

            const summary = formattedUnits.length === 0
                ? "All network units are currently linked to purchase orders."
                : `Found ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"} without a purchase order.`;

            return res.status(200).json({
                success: true,
                queryType: "missing_po",
                prompt: trimmedPrompt,
                summary,
                count: {
                    networkUnits: formattedUnits.length,
                    total: formattedUnits.length
                },
                purchaseOrders: [],
                customers: [],
                networkUnits: formattedUnits,
                evalValues: [],
                data: {
                    purchaseOrders: [],
                    customers: [],
                    networkUnits: formattedUnits,
                    evalValues: []
                }
            });
        }

        // ------------------------------------------------------------------
        // CASE 4: Case-insensitive regex search across:
        // Customer.name, PurchaseOrder.poNumber, NetworkUnit.unitCode, NetworkUnit.hostname
        // ------------------------------------------------------------------
        const escaped = trimmedPrompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        const [customers, purchaseOrders, networkUnits, evalValues] = await Promise.all([
            Customer.find({ name: { $regex: regex } }).sort({ name: 1 }).limit(50),
            PurchaseOrder.find({ poNumber: { $regex: regex } })
                .populate("customerId", "name")
                .sort({ poNumber: 1 })
                .limit(50),
            NetworkUnit.find({
                $or: [
                    { unitCode: { $regex: regex } },
                    { hostname: { $regex: regex } }
                ]
            })
                .populate("customerId", "name")
                .populate("purchaseOrderId", "poNumber")
                .sort({ unitCode: 1 })
                .limit(50),
            EvalValue.find({
                $or: [
                    { unit: { $regex: regex } },
                    { hostname: { $regex: regex } },
                    { customer: { $regex: regex } },
                    { radioConfig: { $regex: regex } }
                ]
            }).limit(50)
        ]);

        const formattedPOs = purchaseOrders.map(formatPurchaseOrder);
        const formattedUnits = networkUnits.map(formatNetworkUnit);
        const formattedCustomers = customers.map((c) => (c.toObject ? c.toObject() : { ...c }));
        const formattedEval = evalValues.map((e) => (e.toObject ? e.toObject() : { ...e }));

        const totalMatches =
            formattedCustomers.length +
            formattedPOs.length +
            formattedUnits.length +
            formattedEval.length;

        let summary = "";
        if (totalMatches === 0) {
            summary = `No records found matching "${trimmedPrompt}".`;
        } else {
            const parts = [];
            if (formattedCustomers.length > 0) {
                parts.push(`${formattedCustomers.length} customer${formattedCustomers.length === 1 ? "" : "s"}`);
            }
            if (formattedPOs.length > 0) {
                parts.push(`${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"}`);
            }
            if (formattedUnits.length > 0) {
                parts.push(`${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"}`);
            }
            if (formattedEval.length > 0) {
                parts.push(`${formattedEval.length} eval unit${formattedEval.length === 1 ? "" : "s"}`);
            }
            summary = `Found ${parts.join(", ")} matching "${trimmedPrompt}".`;
        }

        return res.status(200).json({
            success: true,
            queryType: "search",
            prompt: trimmedPrompt,
            summary,
            count: {
                customers: formattedCustomers.length,
                purchaseOrders: formattedPOs.length,
                networkUnits: formattedUnits.length,
                evalValues: formattedEval.length,
                total: totalMatches
            },
            customers: formattedCustomers,
            purchaseOrders: formattedPOs,
            networkUnits: formattedUnits,
            evalValues: formattedEval,
            data: {
                customers: formattedCustomers,
                purchaseOrders: formattedPOs,
                networkUnits: formattedUnits,
                evalValues: formattedEval
            }
        });
    } catch (error) {
        console.error("Assistant query error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process assistant query",
            error: error.message
        });
    }
});

/**
 * GET /api/assistant/summary
 * Returns quick counts for dashboard and command center
 */
router.get("/summary", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);

        const [
            customersCount,
            posCount,
            unitsCount,
            expiringCount,
            expiredCount,
            missingPOCount
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
            NetworkUnit.countDocuments({
                $or: [
                    { purchaseOrderId: null },
                    { purchaseOrderId: { $exists: false } }
                ]
            })
        ]);

        return res.status(200).json({
            success: true,
            customers: customersCount,
            purchaseOrders: posCount,
            networkUnits: unitsCount,
            expiring: expiringCount,
            expired: expiredCount,
            missingPO: missingPOCount
        });
    } catch (error) {
        console.error("Assistant summary error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch assistant summary",
            error: error.message
        });
    }
});

export default router;
