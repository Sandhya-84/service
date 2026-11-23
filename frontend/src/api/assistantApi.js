import api from "./dashboardApi";

/**
 * Send natural language or keyword prompt to backend assistant
 * @param {string} prompt 
 * @returns {Promise<Object>}
 */
export const queryAssistant = async (prompt) => {
    const response = await api.post("/assistant/query", { prompt });
    return response.data;
};

/**
 * Fetch summary counts for the Command Center
 * @returns {Promise<Object>}
 */
export const getAssistantSummary = async () => {
    try {
        const response = await api.get("/assistant/summary");
        return response.data;
    } catch {
        // Fallback to dashboard summary if assistant summary endpoint is unreachable
        const fallback = await api.get("/dashboard/summary");
        const data = fallback.data.summary || fallback.data;
        return {
            customers: data.customers || 0,
            purchaseOrders: data.purchaseOrders || 0,
            networkUnits: data.networkUnits || 0,
            expiring: data.expiring || 0,
            expired: data.expired || 0,
            missingPO: 0
        };
    }
};

export default {
    queryAssistant,
    getAssistantSummary
};
