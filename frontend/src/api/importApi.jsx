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
    (error) => {
        return Promise.reject(error);
    }
);

export const uploadExcel = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
        "/import/excel",
        formData
    );

    return response.data;
};

export const getImportHistory = async () => {
    const response = await api.get(
        "/import/history"
    );

    return response.data;
};