import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) =>
        Promise.reject(error)
);

// DASHBOARD

export const getDashboardSummary =
    async () => {
        const response =
            await api.get(
                "/dashboard/summary"
            );

        return response.data;
    };

export const getDashboardStatus =
    async () => {
        const response =
            await api.get(
                "/dashboard/status"
            );

        return response.data;
    };

export const getDashboardData =
    async () => {
        const response =
            await api.get(
                "/dashboard/data"
            );

        return response.data;
    };

// PURCHASE ORDER

export const updatePurchaseOrder =
    async (id, data) => {
        const response =
            await api.put(
                `/purchase-orders/${id}`,
                data
            );

        return response.data;
    };

// NETWORK UNITS

export const updateNetworkUnits =
    async (
        purchaseOrderId,
        units
    ) => {
        const response =
            await api.put(
                `/purchase-orders/${purchaseOrderId}/units`,
                { units }
            );

        return response.data;
    };

export const deleteNetworkUnit =
    async (unitId) => {
        const response =
            await api.delete(
                `/network-units/${unitId}`
            );

        return response.data;
    };

// RENEWAL

export const createRenewal =
    async (data) => {
        const response =
            await api.post(
                "/renewal-history",
                data
            );

        return response.data;
    };

export const getRenewalHistory =
    async (purchaseOrderId) => {
        const response =
            await api.get(
                "/renewal-history",
                {
                    params: {
                        purchaseOrderId
                    }
                }
            );

        return response.data;
    };

// IMPORT

export const getImportHistory =
    async () => {
        const response =
            await api.get(
                "/import/history"
            );

        return response.data;
    };

// ACTIVITY LOGS

export const createActivityLog =
    async (data) => {
        const response =
            await api.post(
                "/activity-logs",
                data
            );

        return response.data;
    };

export const getActivityLogs =
    async (limit = 50) => {
        const response =
            await api.get(
                "/activity-logs",
                {
                    params: {
                        limit
                    }
                }
            );

        return response.data;
    };

export default api;