import axios from "axios";


const API_URL =
    "http://localhost:5000/api";


const api = axios.create({
    baseURL: API_URL
});


// =====================================================
// ADD TOKEN TO REQUEST
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
// GET CUSTOMERS
// =====================================================

export const getCustomers = async () => {

    const response =
        await api.get(
            "/customers"
        );


    return response.data;
};


// =====================================================
// CREATE CUSTOMER
// =====================================================

export const createCustomer = async (
    name
) => {

    const response =
        await api.post(
            "/customers",
            {
                name
            }
        );


    return response.data;
};