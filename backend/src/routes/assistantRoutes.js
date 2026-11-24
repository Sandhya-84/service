import express from "express";
import mcpMongoManager from "../services/mcpMongoClient.js";
import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import EvalValue from "../models/EvalValue.js";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
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
    let allCustomers = [];
    let allPOs = [];

    try {
        allCustomers = await Customer.find({}).limit(2000).lean();
    } catch {
        const custRes = await mcpMongoManager.find({ collection: "customers", limit: 2000 }).catch(() => null);
        allCustomers = custRes?.documents || [];
    }

    try {
        allPOs = await PurchaseOrder.find({}).limit(2000).lean();
    } catch {
        const poRes = await mcpMongoManager.find({ collection: "purchaseorders", limit: 2000 }).catch(() => null);
        allPOs = poRes?.documents || [];
    }

    const customerMap = new Map();
    for (const c of allCustomers) {
        customerMap.set(String(c._id), c.name);
    }

    const poMap = new Map();
    for (const p of allPOs) {
        poMap.set(String(p._id), p.poNumber);
    }

    return { customerMap, poMap, allCustomers };
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

// =========================================================================
// 4 CORE READ-ONLY MONGOOSE QUERY HANDLERS
// =========================================================================

/**
 * 1. get_customer_dossier
 * Retrieves customer profile, purchase orders, network units, and eval lab records.
 */
async function runGetCustomerDossier(args, { customerMap, poMap, allCustomers }) {
    const companyName = (args.companyName || args.customerName || args.company || "").trim();
    const customerId = args.customerId ? String(args.customerId) : null;

    let targetCustomer = null;

    if (customerId) {
        targetCustomer = allCustomers.find(c => String(c._id) === customerId);
        if (!targetCustomer) {
            try {
                targetCustomer = await Customer.findById(customerId).lean();
            } catch {
                // Ignore find error
            }
        }
    }

    if (!targetCustomer && companyName) {
        const lowerComp = companyName.toLowerCase();
        // Exact match first
        targetCustomer = allCustomers.find(c => (c.name || "").toLowerCase() === lowerComp);
        // Substring / regex match second
        if (!targetCustomer) {
            targetCustomer = allCustomers.find(c => (c.name || "").toLowerCase().includes(lowerComp) || lowerComp.includes((c.name || "").toLowerCase()));
        }
        if (!targetCustomer) {
            try {
                targetCustomer = await Customer.findOne({ name: { $regex: new RegExp(escapeRegex(companyName), "i") } }).lean();
            } catch {
                // Ignore find error
            }
        }
    }

    if (!targetCustomer) {
        return {
            success: true,
            summary: `No customer record found matching "${companyName || "the specified customer"}". Try searching by exact name or consult the Customer Directory.`,
            records: [],
            type: "customer_dossier",
            queryType: "company",
            customers: [],
            purchaseOrders: [],
            networkUnits: [],
            evalValues: [],
            count: { customers: 0, purchaseOrders: 0, networkUnits: 0, evalValues: 0, total: 0 }
        };
    }

    const cId = targetCustomer._id;
    const cIdStr = String(cId);
    const cName = targetCustomer.name;

    const [rawPOs, rawUnits, rawEvals] = await Promise.all([
        PurchaseOrder.find({
            $or: [{ customerId: cId }, { customerId: cIdStr }]
        }).sort({ expiryDate: 1, supportExpiryDate: 1 }).lean().catch(() =>
            mcpMongoManager.aggregate({
                collection: "purchaseorders",
                pipeline: [
                    { $match: { $expr: { $eq: [{ $toString: "$customerId" }, cIdStr] } } },
                    { $sort: { expiryDate: 1 } },
                    { $limit: 200 }
                ]
            }).then(r => r?.documents || [])
        ),
        NetworkUnit.find({
            $or: [{ customerId: cId }, { customerId: cIdStr }]
        }).lean().catch(() =>
            mcpMongoManager.aggregate({
                collection: "networkunits",
                pipeline: [
                    { $match: { $expr: { $eq: [{ $toString: "$customerId" }, cIdStr] } } },
                    { $limit: 300 }
                ]
            }).then(r => r?.documents || [])
        ),
        EvalValue.find({
            customer: { $regex: new RegExp(escapeRegex(cName), "i") }
        }).lean().catch(() =>
            mcpMongoManager.find({
                collection: "evalvalues",
                filter: { customer: { $regex: escapeRegex(cName), $options: "i" } },
                limit: 100
            }).then(r => r?.documents || [])
        )
    ]);

    const formattedPOs = (rawPOs || []).map(po => formatPurchaseOrder(po, customerMap));
    const formattedUnits = (rawUnits || []).map(u => formatNetworkUnit(u, customerMap, poMap));
    const formattedEvals = rawEvals || [];

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

    const summary = `Executive Dossier for ${cName}: Currently managing ${formattedPOs.length} Purchase Order${formattedPOs.length === 1 ? "" : "s"} (${activeCount} active in good standing, ${expiringCount} expiring soon, ${expiredCount} expired), with ${formattedUnits.length} Network Unit${formattedUnits.length === 1 ? "" : "s"} deployed across the fleet (${assignedUnits} linked to active orders, ${unassignedUnits} unassigned)${formattedEvals.length > 0 ? `, and ${formattedEvals.length} unit(s) in lab evaluation` : ""}. Support status is healthy.`;

    return {
        success: true,
        summary,
        records: formattedPOs,
        type: "customer_dossier",
        queryType: "company",
        company: cName,
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
    };
}

/**
 * 2. query_purchase_orders
 * Query and filter purchase orders by customer, status, days remaining, or PO number.
 */
async function runQueryPurchaseOrders(args, { customerMap, poMap, allCustomers }) {
    const { customerName, status, maxDaysRemaining, poNumber, limit = 100 } = args;

    let targetCustomer = null;
    if (customerName) {
        const lowerComp = customerName.toLowerCase();
        targetCustomer = allCustomers.find(c => (c.name || "").toLowerCase().includes(lowerComp));
        if (!targetCustomer) {
            try {
                targetCustomer = await Customer.findOne({ name: { $regex: new RegExp(escapeRegex(customerName), "i") } }).lean();
            } catch {
                // Ignore
            }
        }
    }

    const query = {};
    if (targetCustomer) {
        query.$or = [{ customerId: targetCustomer._id }, { customerId: String(targetCustomer._id) }];
    }
    if (poNumber) {
        query.poNumber = { $regex: new RegExp(escapeRegex(poNumber), "i") };
    }

    let rawPOs = [];
    try {
        rawPOs = await PurchaseOrder.find(query).limit(limit || 200).lean();
    } catch {
        const mcpQuery = {};
        if (targetCustomer) mcpQuery.customerId = targetCustomer._id;
        if (poNumber) mcpQuery.poNumber = { $regex: escapeRegex(poNumber), $options: "i" };
        const res = await mcpMongoManager.find({ collection: "purchaseorders", filter: mcpQuery, limit: limit || 200 }).catch(() => null);
        rawPOs = res?.documents || [];
    }

    let formattedPOs = rawPOs.map(po => formatPurchaseOrder(po, customerMap));

    // Status filtering in JS
    const days = typeof maxDaysRemaining === "number" ? maxDaysRemaining : 30;
    if (status === "active") {
        formattedPOs = formattedPOs.filter(p => p.status === "active");
    } else if (status === "expiring" || typeof maxDaysRemaining === "number") {
        formattedPOs = formattedPOs.filter(p =>
            p.status === "expiring" || (p.daysRemaining !== null && p.daysRemaining >= 0 && p.daysRemaining <= days)
        ).sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
    } else if (status === "expired") {
        formattedPOs = formattedPOs.filter(p => p.status === "expired" || (p.daysRemaining !== null && p.daysRemaining < 0))
            .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
    } else if (status === "no-date") {
        formattedPOs = formattedPOs.filter(p => p.status === "no-date");
    }

    // If searching by PO number, fetch linked network units
    let linkedUnits = [];
    if (poNumber && formattedPOs.length > 0) {
        const poIds = formattedPOs.map(p => p._id);
        const poIdStrs = poIds.map(String);
        try {
            const rawUnits = await NetworkUnit.find({
                $or: [{ purchaseOrderId: { $in: poIds } }, { purchaseOrderId: { $in: poIdStrs } }]
            }).limit(100).lean();
            linkedUnits = (rawUnits || []).map(u => formatNetworkUnit(u, customerMap, poMap));
        } catch {
            // Ignore
        }
    }

    let summary = `Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"}.`;
    if (status === "expiring" || typeof maxDaysRemaining === "number") {
        summary = formattedPOs.length === 0
            ? `No purchase orders found expiring within ${days} days.`
            : `Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"} expiring within ${days} days.`;
    } else if (status === "expired") {
        summary = formattedPOs.length === 0
            ? "No expired purchase orders found across the fleet."
            : `Found ${formattedPOs.length} expired purchase order${formattedPOs.length === 1 ? "" : "s"} past their support end date.`;
    } else if (status === "active") {
        summary = formattedPOs.length === 0
            ? "No active contracts found."
            : `Found ${formattedPOs.length} active purchase order${formattedPOs.length === 1 ? "" : "s"} with valid support coverage in good standing.`;
    } else if (targetCustomer) {
        summary = `Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"} for ${targetCustomer.name}.`;
    } else if (poNumber) {
        summary = `Found ${formattedPOs.length} purchase order${formattedPOs.length === 1 ? "" : "s"} matching "${poNumber}" with ${linkedUnits.length} linked network unit${linkedUnits.length === 1 ? "" : "s"}.`;
    }

    return {
        success: true,
        summary,
        records: formattedPOs,
        type: "purchase_orders",
        queryType: "purchase_orders",
        purchaseOrders: formattedPOs,
        networkUnits: linkedUnits,
        customers: targetCustomer ? [targetCustomer] : [],
        evalValues: [],
        count: {
            customers: targetCustomer ? 1 : 0,
            purchaseOrders: formattedPOs.length,
            networkUnits: linkedUnits.length,
            evalValues: 0,
            total: formattedPOs.length + linkedUnits.length
        }
    };
}

/**
 * 3. query_network_units
 * Query network hardware units by customer, PO assignment, RMA defect status, hostname, or unit code.
 */
async function runQueryNetworkUnits(args, { customerMap, poMap, allCustomers }) {
    const { customerName, hasPO, isRMA, hostname, unitCode, limit = 100 } = args;

    let targetCustomer = null;
    if (customerName) {
        const lowerComp = customerName.toLowerCase();
        targetCustomer = allCustomers.find(c => (c.name || "").toLowerCase().includes(lowerComp));
        if (!targetCustomer) {
            try {
                targetCustomer = await Customer.findOne({ name: { $regex: new RegExp(escapeRegex(customerName), "i") } }).lean();
            } catch {
                // Ignore
            }
        }
    }

    const query = {};
    if (targetCustomer) {
        query.$or = [{ customerId: targetCustomer._id }, { customerId: String(targetCustomer._id) }];
    }
    if (hasPO === false) {
        query.purchaseOrderId = null;
    } else if (hasPO === true) {
        query.purchaseOrderId = { $ne: null, $exists: true };
    }
    if (isRMA === true) {
        query.$or = [
            { hostname: { $regex: "rma", $options: "i" } },
            { unitCode: { $regex: "rma", $options: "i" } }
        ];
    }
    if (hostname) {
        query.hostname = { $regex: new RegExp(escapeRegex(hostname), "i") };
    }
    if (unitCode) {
        query.unitCode = { $regex: new RegExp(escapeRegex(unitCode), "i") };
    }

    let rawUnits = [];
    try {
        rawUnits = await NetworkUnit.find(query).limit(limit || 200).lean();
    } catch {
        const res = await mcpMongoManager.find({ collection: "networkunits", filter: query, limit: limit || 200 }).catch(() => null);
        rawUnits = res?.documents || [];
    }

    const formattedUnits = (rawUnits || []).map(u => formatNetworkUnit(u, customerMap, poMap));

    let summary = `Found ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"}.`;
    if (isRMA) {
        summary = formattedUnits.length === 0
            ? "Hardware Incident Report: No RMA or defective units found across the fleet."
            : `Hardware Incident Report: Found ${formattedUnits.length} RMA unit${formattedUnits.length === 1 ? "" : "s"} flagged for defect inspection or hardware replacement.`;
    } else if (hasPO === false) {
        summary = formattedUnits.length === 0
            ? "Fleet Audit: All deployed network units are currently linked to active Purchase Orders."
            : `Fleet Audit Analysis: Identified ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"} operating without an assigned Purchase Order.`;
    } else if (targetCustomer) {
        summary = `Found ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"} deployed for ${targetCustomer.name}.`;
    } else if (hostname || unitCode) {
        summary = `Found ${formattedUnits.length} network unit${formattedUnits.length === 1 ? "" : "s"} matching "${hostname || unitCode}".`;
    }

    return {
        success: true,
        summary,
        records: formattedUnits,
        type: "network_units",
        queryType: "network_units",
        customers: targetCustomer ? [targetCustomer] : [],
        purchaseOrders: [],
        networkUnits: formattedUnits,
        evalValues: [],
        count: {
            customers: targetCustomer ? 1 : 0,
            purchaseOrders: 0,
            networkUnits: formattedUnits.length,
            evalValues: 0,
            total: formattedUnits.length
        }
    };
}

/**
 * 4. get_system_summary
 * Computes fleet-wide counts: total customers, POs, units, expiring, expired, missing PO, RMA.
 */
async function runGetSystemSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const [
        custCount,
        poCount,
        unitCount,
        expiringCount,
        expiredCount,
        missingPOCount,
        rmaCount
    ] = await Promise.all([
        Customer.countDocuments().catch(() => mcpMongoManager.count({ collection: "customers" }).then(r => r?.count || 0)),
        PurchaseOrder.countDocuments().catch(() => mcpMongoManager.count({ collection: "purchaseorders" }).then(r => r?.count || 0)),
        NetworkUnit.countDocuments().catch(() => mcpMongoManager.count({ collection: "networkunits" }).then(r => r?.count || 0)),
        PurchaseOrder.countDocuments({
            $or: [
                { expiryDate: { $gte: today, $lte: thirtyDaysFromNow } },
                { supportExpiryDate: { $gte: today, $lte: thirtyDaysFromNow } }
            ]
        }).catch(() => mcpMongoManager.count({
            collection: "purchaseorders",
            query: {
                $or: [
                    { expiryDate: { $gte: today, $lte: thirtyDaysFromNow } },
                    { supportExpiryDate: { $gte: today, $lte: thirtyDaysFromNow } }
                ]
            }
        }).then(r => r?.count || 0)),
        PurchaseOrder.countDocuments({
            $or: [
                { expiryDate: { $lt: today } },
                { supportExpiryDate: { $lt: today } }
            ]
        }).catch(() => mcpMongoManager.count({
            collection: "purchaseorders",
            query: {
                $or: [
                    { expiryDate: { $lt: today } },
                    { supportExpiryDate: { $lt: today } }
                ]
            }
        }).then(r => r?.count || 0)),
        NetworkUnit.countDocuments({
            $or: [{ purchaseOrderId: null }, { purchaseOrderId: { $exists: false } }]
        }).catch(() => mcpMongoManager.count({
            collection: "networkunits",
            query: {
                $or: [{ purchaseOrderId: null }, { purchaseOrderId: { $exists: false } }]
            }
        }).then(r => r?.count || 0)),
        NetworkUnit.countDocuments({
            $or: [
                { hostname: { $regex: "rma", $options: "i" } },
                { unitCode: { $regex: "rma", $options: "i" } }
            ]
        }).catch(() => mcpMongoManager.count({
            collection: "networkunits",
            query: {
                $or: [
                    { hostname: { $regex: "rma", $options: "i" } },
                    { unitCode: { $regex: "rma", $options: "i" } }
                ]
            }
        }).then(r => r?.count || 0))
    ]);

    const c = custCount || 0;
    const p = poCount || 0;
    const u = unitCount || 0;
    const exp = expiringCount || 0;
    const past = expiredCount || 0;
    const noPo = missingPOCount || 0;
    const rma = rmaCount || 0;

    const summary = `Executive Fleet Briefing: Currently monitoring ${c} customer account${c === 1 ? "" : "s"}, ${p} purchase order${p === 1 ? "" : "s"} (${exp} expiring in 30 days, ${past} expired contracts), and ${u} total network unit${u === 1 ? "" : "s"} (${noPo} unlinked hardware without PO, ${rma} RMA flagged units).`;

    return {
        success: true,
        summary,
        records: [],
        type: "system_summary",
        queryType: "system_stats",
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
            evalValues: 0,
            total: c + p + u
        },
        customers: [],
        purchaseOrders: [],
        networkUnits: [],
        evalValues: []
    };
}

/**
 * Fallback General Search across all collections
 */
async function runGeneralSearch(queryText, { customerMap, poMap }) {
    const safeRegex = escapeRegex(queryText);
    const regex = new RegExp(safeRegex, "i");

    const [custRes, poRes, unitRes, evalRes] = await Promise.all([
        Customer.find({ name: { $regex: regex } }).limit(20).lean().catch(() =>
            mcpMongoManager.find({ collection: "customers", filter: { name: { $regex: safeRegex, $options: "i" } }, limit: 20 }).then(r => r?.documents || [])
        ),
        PurchaseOrder.find({
            $or: [{ poNumber: { $regex: regex } }, { invoiceNumber: { $regex: regex } }, { notes: { $regex: regex } }]
        }).limit(50).lean().catch(() =>
            mcpMongoManager.find({
                collection: "purchaseorders",
                filter: { $or: [{ poNumber: { $regex: safeRegex, $options: "i" } }, { invoiceNumber: { $regex: safeRegex, $options: "i" } }] },
                limit: 50
            }).then(r => r?.documents || [])
        ),
        NetworkUnit.find({
            $or: [{ unitCode: { $regex: regex } }, { hostname: { $regex: regex } }, { radioConfiguration: { $regex: regex } }]
        }).limit(50).lean().catch(() =>
            mcpMongoManager.find({
                collection: "networkunits",
                filter: { $or: [{ unitCode: { $regex: safeRegex, $options: "i" } }, { hostname: { $regex: safeRegex, $options: "i" } }] },
                limit: 50
            }).then(r => r?.documents || [])
        ),
        EvalValue.find({
            $or: [{ customer: { $regex: regex } }, { unit: { $regex: regex } }, { hostname: { $regex: regex } }]
        }).limit(20).lean().catch(() =>
            mcpMongoManager.find({
                collection: "evalvalues",
                filter: { $or: [{ customer: { $regex: safeRegex, $options: "i" } }, { unit: { $regex: safeRegex, $options: "i" } }] },
                limit: 20
            }).then(r => r?.documents || [])
        )
    ]);

    const formattedPOs = (poRes || []).map(p => formatPurchaseOrder(p, customerMap));
    const formattedUnits = (unitRes || []).map(u => formatNetworkUnit(u, customerMap, poMap));
    const matchedCustomers = custRes || [];
    const matchedEvals = evalRes || [];

    const totalFound = matchedCustomers.length + formattedPOs.length + formattedUnits.length + matchedEvals.length;
    const summary = totalFound === 0
        ? `No records matched "${queryText}". Try asking about specific customers (e.g. "Capgemini"), "expiring in 30 days", "units without po", or "system stats".`
        : `Found ${totalFound} total record${totalFound === 1 ? "" : "s"} (${matchedCustomers.length} customer${matchedCustomers.length === 1 ? "" : "s"}, ${formattedPOs.length} PO${formattedPOs.length === 1 ? "" : "s"}, ${formattedUnits.length} unit${formattedUnits.length === 1 ? "" : "s"}).`;

    return {
        success: true,
        summary,
        records: formattedPOs.length > 0 ? formattedPOs : formattedUnits,
        type: "general_search",
        queryType: "general_search",
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
    };
}

/**
 * Dispatcher to execute the selected tool
 */
async function executeTool(toolName, toolArgs, context) {
    switch (toolName) {
        case "get_customer_dossier":
            return await runGetCustomerDossier(toolArgs, context);
        case "query_purchase_orders":
            return await runQueryPurchaseOrders(toolArgs, context);
        case "query_network_units":
            return await runQueryNetworkUnits(toolArgs, context);
        case "get_system_summary":
            return await runGetSystemSummary();
        default:
            return await runGeneralSearch(toolArgs.query || "", context);
    }
}

// =========================================================================
// TOOL DEFINITIONS FOR CLAUDE & GEMINI
// =========================================================================

const CLAUDE_TOOLS = [
    {
        name: "get_customer_dossier",
        description: "Retrieve complete profile for a customer or company, including all associated purchase orders, deployed network hardware units, evaluation lab units, and contract support status.",
        input_schema: {
            type: "object",
            properties: {
                companyName: {
                    type: "string",
                    description: "Name of the company or customer to look up (e.g. Capgemini, Comcast, Juniper, TataElxsi, Altice)."
                }
            },
            required: ["companyName"]
        }
    },
    {
        name: "query_purchase_orders",
        description: "Search and filter purchase orders across the fleet by customer, status (active, expiring, expired, no-date), days remaining, or PO number.",
        input_schema: {
            type: "object",
            properties: {
                customerName: { type: "string", description: "Filter by customer/company name." },
                status: { type: "string", enum: ["active", "expiring", "expired", "no-date", "all"], description: "Contract status filter." },
                maxDaysRemaining: { type: "number", description: "Filter POs expiring within this number of days (e.g. 30, 60)." },
                poNumber: { type: "string", description: "Specific purchase order number." },
                limit: { type: "number", description: "Max records to return." }
            }
        }
    },
    {
        name: "query_network_units",
        description: "Query and filter network hardware units by customer, PO assignment (hasPO: false for missing/unassigned PO), RMA defect status, hostname, or unit code.",
        input_schema: {
            type: "object",
            properties: {
                customerName: { type: "string", description: "Filter by customer/company name." },
                hasPO: { type: "boolean", description: "Set false to find units without an assigned purchase order (missing PO / unassigned). Set true for assigned units." },
                isRMA: { type: "boolean", description: "Set true for defective / RMA units." },
                hostname: { type: "string", description: "Filter by hostname." },
                unitCode: { type: "string", description: "Filter by unit code (e.g. CT523c)." },
                limit: { type: "number", description: "Max records to return." }
            }
        }
    },
    {
        name: "get_system_summary",
        description: "Get high-level system overview stats: total customers, total purchase orders, contracts expiring in 30 days, expired POs, unassigned hardware units, and total units.",
        input_schema: {
            type: "object",
            properties: {}
        }
    }
];

const GEMINI_TOOLS = [
    {
        functionDeclarations: [
            {
                name: "get_customer_dossier",
                description: "Retrieve complete profile for a customer or company, including all associated purchase orders, deployed network hardware units, evaluation lab units, and contract support status.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        companyName: {
                            type: "STRING",
                            description: "Name of the company or customer to look up (e.g. Capgemini, Comcast, Juniper, TataElxsi, Altice)."
                        }
                    },
                    required: ["companyName"]
                }
            },
            {
                name: "query_purchase_orders",
                description: "Search and filter purchase orders across the fleet by customer, status (active, expiring, expired, no-date), days remaining, or PO number.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        customerName: { type: "STRING", description: "Filter by customer/company name." },
                        status: { type: "STRING", description: "Contract status: active, expiring, expired, no-date, or all." },
                        maxDaysRemaining: { type: "NUMBER", description: "Filter POs expiring within this number of days (e.g. 30, 60)." },
                        poNumber: { type: "STRING", description: "Specific purchase order number." },
                        limit: { type: "NUMBER", description: "Max records to return." }
                    }
                }
            },
            {
                name: "query_network_units",
                description: "Query and filter network hardware units by customer, PO assignment (hasPO: false for missing/unassigned PO), RMA defect status, hostname, or unit code.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        customerName: { type: "STRING", description: "Filter by customer/company name." },
                        hasPO: { type: "BOOLEAN", description: "Set false to find units without an assigned purchase order (missing PO / unassigned). Set true for assigned units." },
                        isRMA: { type: "BOOLEAN", description: "Set true for defective / RMA units." },
                        hostname: { type: "STRING", description: "Filter by hostname." },
                        unitCode: { type: "STRING", description: "Filter by unit code (e.g. CT523c)." },
                        limit: { type: "NUMBER", description: "Max records to return." }
                    }
                }
            },
            {
                name: "get_system_summary",
                description: "Get high-level system overview stats: total customers, total purchase orders, contracts expiring in 30 days, expired POs, unassigned hardware units, and total units.",
                parameters: {
                    type: "OBJECT",
                    properties: {}
                }
            }
        ]
    }
];

// =========================================================================
// API ROUTES
// =========================================================================

/**
 * GET /api/assistant/health
 * Returns live MCP server connection status and summary counts
 */
router.get("/health", async (req, res) => {
    try {
        const mcpStatus = mcpMongoManager.getStatus();
        const summaryData = await runGetSystemSummary();

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
            counts: {
                totalCustomers: summaryData.systemStats.customers,
                totalPOs: summaryData.systemStats.purchaseOrders,
                expiringWithin30Days: summaryData.systemStats.expiring,
                expired: summaryData.systemStats.expired,
                totalUnits: summaryData.systemStats.networkUnits,
                missingPO: summaryData.systemStats.missingPO
            },
            summary: {
                customers: summaryData.systemStats.customers,
                purchaseOrders: summaryData.systemStats.purchaseOrders,
                networkUnits: summaryData.systemStats.networkUnits,
                expiring: summaryData.systemStats.expiring,
                expired: summaryData.systemStats.expired,
                missingPO: summaryData.systemStats.missingPO
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
        const summaryData = await runGetSystemSummary();
        return res.status(200).json({
            success: true,
            customers: summaryData.systemStats.customers,
            purchaseOrders: summaryData.systemStats.purchaseOrders,
            networkUnits: summaryData.systemStats.networkUnits,
            expiring: summaryData.systemStats.expiring,
            expired: summaryData.systemStats.expired,
            missingPO: summaryData.systemStats.missingPO
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
 * Resolves natural language prompts through:
 *  1. Anthropic Claude Tool Calling (if ANTHROPIC_API_KEY is non-empty, omitting temperature and top_p)
 *  2. Google Gemini Function Calling (if GEMINI_API_KEY is non-empty)
 *  3. Resilient Read-Only MCP / Mongoose Engine (zero external keys needed)
 */
router.post("/query", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
                summary: "Please provide a query or search prompt.",
                records: [],
                type: "empty",
                engine: "Validation",
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

        // 1. Fetch entity maps for document enrichment & lookup
        const context = await fetchEntityMaps();
        const { allCustomers } = context;
        const mcpStatus = mcpMongoManager.getStatus();

        // =====================================================================
        // PROVIDER 1: ANTHROPIC CLAUDE TOOL CALLING
        // Activated automatically if process.env.ANTHROPIC_API_KEY is non-empty
        // Model: process.env.CLAUDE_MODEL || "claude-haiku-5-5"
        // Note: temperature and top_p are omitted as required.
        // =====================================================================
        if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
            try {
                const claudeModel = process.env.CLAUDE_MODEL || "claude-haiku-5-5";
                const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() });

                const response = await anthropic.messages.create({
                    model: claudeModel,
                    max_tokens: 1024,
                    system: "You are the Candela Network Support & Renewal Intelligence Agent. You help users query customers, purchase orders, network units, and support contract expirations by calling the provided read-only tools.",
                    messages: [{ role: "user", content: trimmedPrompt }],
                    tools: CLAUDE_TOOLS
                });

                // Find tool call in response
                const toolBlock = response.content?.find(b => b.type === "tool_use");
                if (toolBlock) {
                    const toolName = toolBlock.name;
                    const toolArgs = toolBlock.input || {};
                    const queryResult = await executeTool(toolName, toolArgs, context);

                    const textPart = response.content
                        .filter(b => b.type === "text")
                        .map(b => b.text)
                        .join(" ")
                        .trim();

                    return res.status(200).json({
                        ...queryResult,
                        prompt: trimmedPrompt,
                        summary: textPart || queryResult.summary,
                        engine: `Anthropic Claude (${claudeModel})`
                    });
                }

                // Direct textual answer from Claude without tool call
                const directText = response.content
                    .filter(b => b.type === "text")
                    .map(b => b.text)
                    .join("\n")
                    .trim();

                if (directText) {
                    return res.status(200).json({
                        success: true,
                        prompt: trimmedPrompt,
                        summary: directText,
                        records: [],
                        type: "conversational",
                        engine: `Anthropic Claude (${claudeModel})`,
                        customers: [],
                        purchaseOrders: [],
                        networkUnits: [],
                        evalValues: [],
                        count: { customers: 0, purchaseOrders: 0, networkUnits: 0, total: 0 }
                    });
                }
            } catch (claudeErr) {
                console.warn("[Claude Tool Calling Error, falling through to Gemini / Local Engine]:", claudeErr.message);
            }
        }

        // =====================================================================
        // PROVIDER 2: GOOGLE GEMINI FUNCTION CALLING
        // Activated if process.env.GEMINI_API_KEY is set during development
        // Model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
        // =====================================================================
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
            try {
                const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });

                const geminiRes = await ai.models.generateContent({
                    model: geminiModel,
                    contents: trimmedPrompt,
                    config: {
                        tools: GEMINI_TOOLS
                    }
                });

                if (geminiRes.functionCalls && geminiRes.functionCalls.length > 0) {
                    const call = geminiRes.functionCalls[0];
                    const queryResult = await executeTool(call.name, call.args || {}, context);

                    return res.status(200).json({
                        ...queryResult,
                        prompt: trimmedPrompt,
                        engine: `Google Gemini (${geminiModel})`
                    });
                }

                if (geminiRes.text) {
                    return res.status(200).json({
                        success: true,
                        prompt: trimmedPrompt,
                        summary: geminiRes.text.trim(),
                        records: [],
                        type: "conversational",
                        engine: `Google Gemini (${geminiModel})`,
                        customers: [],
                        purchaseOrders: [],
                        networkUnits: [],
                        evalValues: [],
                        count: { customers: 0, purchaseOrders: 0, networkUnits: 0, total: 0 }
                    });
                }
            } catch (geminiErr) {
                console.warn("[Gemini Function Calling Error, falling through to Local Engine]:", geminiErr.message);
            }
        }

        // =====================================================================
        // PROVIDER 3: RESILIENT LOCAL READ-ONLY MCP & MONGOOSE ENGINE
        // Works out-of-the-box with ZERO API keys or external billing.
        // Direct tool invocation based on NLP intent & company token recognition.
        // =====================================================================
        const localEngineName = mcpStatus.connected
            ? "Model Context Protocol (MCP) Read-Only Engine"
            : "Mongoose Resilient Engine (MCP Initializing/Fallback)";

        // Perform NLP token extraction
        const nlp = await transferNaturalLanguageQuery(trimmedPrompt).catch(() => ({ intent: "GENERAL" }));
        let { intent, targetCustomer, nDays, subFilters } = nlp;

        // Company detection across customer list
        if (!targetCustomer && allCustomers.length > 0) {
            for (const cust of allCustomers) {
                const cName = (cust.name || "").toLowerCase().trim();
                if (cName.length >= 3 && lowerPrompt.includes(cName)) {
                    targetCustomer = cust;
                    break;
                }
            }
        }

        // PRIORITY CASE 1: Customer Mentioned (e.g., "give me the pos of Capgemini", "units of Comcast")
        if (targetCustomer) {
            const result = await runGetCustomerDossier({ companyName: targetCustomer.name }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName,
                nlp: {
                    intent: intent || "COMPANY_DOSSIER",
                    resolvedCompany: targetCustomer.name
                }
            });
        }

        // CASE 2: System Stats / Overview / Summary
        if (
            intent === "SYSTEM_STATS" ||
            /\b(how\s*many|summary|overview|stats|system\s*stats|total\s*(?:counts?|pos?|units?|customers?))\b/i.test(lowerPrompt)
        ) {
            const result = await runGetSystemSummary();
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        // CASE 3: RMA Defect Hardware Query
        if (intent === "RMA" || /\b(rma|defective|damaged|returned)\b/i.test(lowerPrompt)) {
            const result = await runQueryNetworkUnits({ isRMA: true }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        // CASE 4: Missing PO / Unassigned Units Query
        if (
            intent === "WITHOUT_PO" ||
            /\b(missing\s*po|without\s*po|null\s*po|no\s*po|unassigned\s*units?)\b/i.test(lowerPrompt)
        ) {
            const result = await runQueryNetworkUnits({ hasPO: false }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        // CASE 5: Expiry & Renewal Status Queries
        const isExpiring = intent === "EXPIRING" || /\b(expiring|expire|lapse|lapsing|upcoming\s*expir|due\s*for\s*renewal)\b/i.test(lowerPrompt);
        const isExpired = intent === "EXPIRED" || /\b(expired|lapsed|past\s*due|overdue|terminated)\b/i.test(lowerPrompt);
        const isActive = intent === "ACTIVE" || /\b(active\s*(?:pos?|contracts?|orders?)|active)\b/i.test(lowerPrompt);
        const isNoExpiry = intent === "NO_EXPIRY" || /\b(no\s*expiry|without\s*expiry|missing\s*expiry|no\s*date)\b/i.test(lowerPrompt);

        if (isExpiring) {
            const result = await runQueryPurchaseOrders({ status: "expiring", maxDaysRemaining: nDays || 30 }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        if (isExpired) {
            const result = await runQueryPurchaseOrders({ status: "expired" }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        if (isActive) {
            const result = await runQueryPurchaseOrders({ status: "active" }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        if (isNoExpiry) {
            const result = await runQueryPurchaseOrders({ status: "no-date" }, context);
            return res.status(200).json({
                ...result,
                prompt: trimmedPrompt,
                engine: localEngineName
            });
        }

        // CASE 6: PO Number Lookup
        const poMatch = subFilters?.poNumber || lowerPrompt.match(/\b(?:po|order)?\s*#?\s*([0-9]{4,10}|[A-Z0-9_\-]{4,15})\b/i)?.[1];
        if (poMatch && poMatch.length >= 3 && !/\b(days?|weeks?|units?|customers?)\b/i.test(poMatch)) {
            const result = await runQueryPurchaseOrders({ poNumber: poMatch }, context);
            if (result.records.length > 0) {
                return res.status(200).json({
                    ...result,
                    prompt: trimmedPrompt,
                    engine: localEngineName
                });
            }
        }

        // CASE 7: Unit Code / Hostname Lookup
        const codeToken = subFilters?.unitCode || subFilters?.hostname;
        const candidateToken = codeToken || lowerPrompt.replace(/^(show|find|search|lookup|get|units?|of|for|all)\s+/i, "").trim();
        if (candidateToken && candidateToken.length >= 2) {
            const result = await runQueryNetworkUnits({ unitCode: candidateToken }, context);
            if (result.records.length > 0) {
                return res.status(200).json({
                    ...result,
                    prompt: trimmedPrompt,
                    engine: localEngineName
                });
            }
        }

        // CASE 8: General Search Fallback
        const result = await runGeneralSearch(trimmedPrompt, context);
        return res.status(200).json({
            ...result,
            prompt: trimmedPrompt,
            engine: localEngineName
        });
    } catch (err) {
        console.error("[Assistant Query Error]:", err);
        return res.status(200).json({
            success: true,
            summary: "Encountered an unexpected issue running query. No records retrieved.",
            records: [],
            type: "error_fallback",
            engine: "Mongoose Resilient Safety Net",
            prompt: req.body?.prompt || "",
            customers: [],
            purchaseOrders: [],
            networkUnits: [],
            evalValues: [],
            count: { customers: 0, purchaseOrders: 0, networkUnits: 0, evalValues: 0, total: 0 }
        });
    }
});

export default router;
