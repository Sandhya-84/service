import axios from "axios";


const API_URL =
    "http://localhost:5000/api";


const api = axios.create({

    baseURL: API_URL

});


api.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem(
                "token"
            );


        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }


        return config;

    },

    (error) => {

        return Promise.reject(
            error
        );

    }

);


// =====================================================
// GET ALL EVAL VALUES
// =====================================================

export const getEvalValues =
    async () => {

        const response =
            await api.get(
                "/eval-values"
            );


        return response.data;

    };


// =====================================================
// GET EVAL SUMMARY
// =====================================================

export const getEvalSummary =
    async () => {

        const response =
            await api.get(
                "/eval-values/summary"
            );


        return response.data;

    };


export default api;