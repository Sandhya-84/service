import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_URL
});

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const loginUser = async (loginData) => {
    const response = await api.post("/auth/login", loginData);
    return response.data;
};