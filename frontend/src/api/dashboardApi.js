import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getDashboardSummary = async () => {
    const response = await axios.get(
        `${API_URL}/dashboard/summary`
    );

    return response.data;
};

export const getDashboardStatus = async () => {
    const response = await axios.get(
        `${API_URL}/dashboard/status`
    );

    return response.data;
};
export const getDashboardData = async () => {
    const response = await axios.get(
        `${API_URL}/dashboard/data`
    );

    return response.data;
};