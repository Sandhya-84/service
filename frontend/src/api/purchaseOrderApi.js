import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export const createPurchaseOrder = async (purchaseOrder) => {
    const response = await api.post(
        "/purchase-orders",
        purchaseOrder
    );

    return response.data;
};