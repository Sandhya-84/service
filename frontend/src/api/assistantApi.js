import api from "./dashboardApi.js";

/**
 * Client-side NLP Intent & Prompt Normalizer
 * Extracts semantic intent from natural conversational phrasing.
 * Acts as a resilient bridge to guarantee prompt transformation even if
 * the backend process hasn't been restarted yet.
 */
export const normalizePromptWithNLP = (rawPrompt) => {
    if (!rawPrompt || typeof rawPrompt !== "string") return rawPrompt;
    const lower = rawPrompt.trim().toLowerCase();

    // 1. Time / Expiry expressions: "lapse in 50 days", "expire in 2 weeks", "lapsing soon"
    const hasExpiring = /\b(expiring|expire|lapse|lapsing|due\s*for\s*renewal|upcoming\s*expir|nearing\s*expir|going\s*to\s*expire|going\s*to\s*lapse)\b/i.test(lower);
    if (hasExpiring) {
        // Parse days
        const matchDays = lower.match(/(?:in|within|next|upcoming)?\s*(\d+)\s*days?/i);
        if (matchDays && matchDays[1]) {
            return `expiring in ${matchDays[1]} days`;
        }
        const matchWeeks = lower.match(/(?:in|within|next)?\s*(\d+)\s*weeks?/i);
        if (matchWeeks && matchWeeks[1]) {
            return `expiring in ${parseInt(matchWeeks[1], 10) * 7} days`;
        }
        if (/\b(?:next\s*month|this\s*month|in\s*a\s*month|1\s*month)\b/i.test(lower)) {
            return `expiring in 30 days`;
        }
        if (/\b(?:next\s*quarter|quarter|3\s*months?)\b/i.test(lower)) {
            return `expiring in 90 days`;
        }
        return `expiring in 30 days`;
    }

    // 2. Expired
    if (/\b(expired|lapsed|past\s*due|overdue|terminated|out\s*of\s*support)\b/i.test(lower)) {
        return `expired`;
    }

    // 3. Without PO / Unassigned equipment
    if (/\b(without\s*(?:a\s*)?(?:po|purchase\s*order)|missing\s*po|no\s*po|unassigned\s*(?:units?|equipment|hardware)|orphan|unlinked|no\s*order\s*attached)\b/i.test(lower)) {
        return `without po`;
    }

    // 4. Active contracts
    if (/\b(active\s*(?:pos?|contracts?|orders?)|active|valid|in\s*service)\b/i.test(lower)) {
        return `active`;
    }

    // 5. System Stats / Telemetry
    if (/\b(stats|system\s*stats|overview|metrics|how\s*many|total\s*(?:counts?|pos?|units?|customers?)|summary)\b/i.test(lower)) {
        return `stats`;
    }

    // 6. Top Customers
    if (/\b(top\s*(?:customers?|clients?|accounts?)|(?:customer|client)\s*ranking|largest\s*(?:customers?|clients?)|biggest\s*(?:customers?|clients?)|leaderboard)\b/i.test(lower)) {
        return `top customers`;
    }

    // 7. Recent Activity
    if (/\b(recent\s*activity|activity\s*logs?|audit\s*logs?|audit\s*trail|recent\s*logs?|latest\s*changes?|latest\s*actions?|changed\s*recently)\b/i.test(lower)) {
        return `recent activity`;
    }

    // 8. Company dossier: "units of X", "tell me about X", "everything about X"
    const companyMatch = lower.match(/(?:units|equipment|hardware|devices|pos?|purchase\s*orders?|contracts?|everything|all|tell\s*me\s*about|what\s*about|status\s*of)\s+(?:of|for|about|on|from)\s+([a-zA-Z0-9_\-\.\s']+)/i)
        || lower.match(/([a-zA-Z0-9_\-\.\s']+?)\s+(?:units|pos?|contracts?|equipment|hardware|devices)/i);

    if (companyMatch && companyMatch[1]) {
        // Stop before conjunctions or verbs like doesn't, that, which, with, where
        let companyPart = companyMatch[1].split(/\b(?:doesn['’]?t|does\s*not|that|which|with|where|who|having|has|without|and)\b/i)[0];
        const cleaned = companyPart
            .replace(/\b(the|our|all|any|company|inc|corp|ltd|llc)\b/gi, "")
            .trim();
        if (cleaned.length >= 2) {
            return `units of ${cleaned}`;
        }
    }

    return rawPrompt;
};

/**
 * Send natural language or keyword prompt to backend assistant with resilient NLP fallback
 * @param {string} prompt 
 * @returns {Promise<Object>}
 */
export const queryAssistant = async (prompt) => {
    try {
        const response = await api.post("/assistant/query", { prompt });
        const data = response.data;

        const totalMatches = data.count?.total ?? (
            (data.purchaseOrders?.length || 0) +
            (data.networkUnits?.length || 0) +
            (data.customers?.length || 0) +
            (data.evalValues?.length || 0) +
            (data.systemStats ? 1 : 0) +
            (data.companyDetails ? 1 : 0)
        );

        // If backend handled it or found records, return it directly
        if (totalMatches > 0 || data.queryType !== "search") {
            return data;
        }

        // If backend fell back to literal search with 0 matches (e.g. backend not restarted yet),
        // transfer query client-side and retry with recognized canonical command
        const normalizedPrompt = normalizePromptWithNLP(prompt);
        if (normalizedPrompt && normalizedPrompt.toLowerCase() !== prompt.toLowerCase().trim()) {
            const fallbackResponse = await api.post("/assistant/query", { prompt: normalizedPrompt });
            const fallbackData = fallbackResponse.data;
            if (fallbackData) {
                return {
                    ...fallbackData,
                    prompt: prompt,
                    originalPrompt: prompt,
                    nlp: fallbackData.nlp || {
                        intent: fallbackData.queryType?.toUpperCase() || "EXPIRING",
                        transferredTo: normalizedPrompt
                    }
                };
            }
        }

        return data;
    } catch (err) {
        // If query fails, attempt normalized query as fallback
        const normalized = normalizePromptWithNLP(prompt);
        if (normalized && normalized.toLowerCase() !== prompt.toLowerCase().trim()) {
            const retryRes = await api.post("/assistant/query", { prompt: normalized });
            return {
                ...retryRes.data,
                prompt: prompt,
                nlp: retryRes.data.nlp || { intent: "FALLBACK_NORMALIZED" }
            };
        }
        throw err;
    }
};

/**
 * Fetch live MCP server health and summary counts
 * @returns {Promise<Object>}
 */
export const getAssistantHealth = async () => {
    try {
        const response = await api.get("/assistant/health");
        return response.data;
    } catch (err) {
        console.warn("Assistant health call failed, falling back to summary:", err.message);
        return {
            success: false,
            status: "offline",
            mcp: { connected: false, server: "@mongodb-js/mongodb-mcp-server", mode: "read-only" },
            counts: { totalCustomers: 0, totalPOs: 0, expiringWithin30Days: 0, expired: 0, totalUnits: 0, missingPO: 0 },
            summary: { customers: 0, purchaseOrders: 0, networkUnits: 0, expiring: 0, expired: 0, missingPO: 0 }
        };
    }
};

/**
 * Fetch summary counts for the Command Center
 * @returns {Promise<Object>}
 */
export const getAssistantSummary = async () => {
    try {
        const health = await getAssistantHealth();
        if (health && (health.counts || health.summary)) {
            const counts = health.counts || {};
            const summary = health.summary || {};
            return {
                customers: counts.totalCustomers ?? summary.customers ?? 0,
                purchaseOrders: counts.totalPOs ?? summary.purchaseOrders ?? 0,
                networkUnits: counts.totalUnits ?? summary.networkUnits ?? 0,
                expiring: counts.expiringWithin30Days ?? summary.expiring ?? 0,
                expired: counts.expired ?? summary.expired ?? 0,
                missingPO: counts.missingPO ?? summary.missingPO ?? 0,
                mcp: health.mcp || { connected: false }
            };
        }
        const response = await api.get("/assistant/summary");
        return response.data;
    } catch {
        // Fallback to dashboard summary if assistant summary endpoint is unreachable
        try {
            const fallback = await api.get("/dashboard/summary");
            const data = fallback.data.summary || fallback.data;
            return {
                customers: data.customers || 0,
                purchaseOrders: data.purchaseOrders || 0,
                networkUnits: data.networkUnits || 0,
                expiring: data.expiring || 0,
                expired: data.expired || 0,
                missingPO: 0,
                mcp: { connected: false }
            };
        } catch {
            return {
                customers: 0,
                purchaseOrders: 0,
                networkUnits: 0,
                expiring: 0,
                expired: 0,
                missingPO: 0,
                mcp: { connected: false }
            };
        }
    }
};

export default {
    normalizePromptWithNLP,
    queryAssistant,
    getAssistantHealth,
    getAssistantSummary
};
