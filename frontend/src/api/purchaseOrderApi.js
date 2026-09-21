import axios from "axios";


const API_URL =
    "http://localhost:5000/api";


const api = axios.create({
    baseURL: API_URL
});


// =====================================================
// ADD TOKEN
// =====================================================

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

    (error) => {
        return Promise.reject(error);
    }
);


// =====================================================
// GET PURCHASE ORDERS
// =====================================================

export const getPurchaseOrders = async (
    customerId
) => {

    const response =
        await api.get(
            "/purchase-orders",
            {
                params: customerId
                    ? { customerId }
                    : {}
            }
        );


    return response.data;
};


// =====================================================
// CREATE PURCHASE ORDER
// =====================================================

export const createPurchaseOrder = async (
    data
) => {

    const response =
        await api.post(
            "/purchase-orders",
            data
        );


    return response.data;
};