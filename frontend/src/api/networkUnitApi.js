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
// GET NETWORK UNITS
// =====================================================

export const getNetworkUnits = async (
    purchaseOrderId
) => {

    const response =
        await api.get(
            "/network-units",
            {
                params: purchaseOrderId
                    ? { purchaseOrderId }
                    : {}
            }
        );


    return response.data;
};


// =====================================================
// CREATE NETWORK UNIT
// =====================================================

export const createNetworkUnit = async (
    data
) => {

    const response =
        await api.post(
            "/network-units",
            data
        );


    return response.data;
};