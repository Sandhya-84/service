
import React, {
    useEffect,
    useState
} from "react";

import StatCards from "./StatCards";
import StatusChart from "./StatusChart";

import { useTheme } from "../../context/ThemeContext";

import {
    getDashboardSummary
} from "../../api/dashboardApi";

const Dashboard = () => {

    const { darkMode } = useTheme();

    const [summary, setSummary] = useState({
        customers: 0,
        purchaseOrders: 0,
        networkUnits: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        noExpiryDate: 0
    });

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await getDashboardSummary();

                setSummary(
                    response.summary || response
                );

            } catch (err) {

                console.error(
                    "Dashboard loading error:",
                    err
                );

                if (err.response?.status === 401) {

                    setError(
                        "Your login session has expired. Please login again."
                    );

                } else {

                    setError(
                        err.response?.data?.message ||
                        "Failed to load dashboard."
                    );

                }

            } finally {

                setLoading(false);

            }

        };

        loadDashboard();

    }, []);

    if (loading) {

        return (
            <div
                className={
                    darkMode
                        ? "flex min-h-[60vh] items-center justify-center text-white"
                        : "flex min-h-[60vh] items-center justify-center text-slate-900"
                }
            >
                <p>Loading dashboard...</p>
            </div>
        );

    }

    return (

        <div className="w-full">

            {error && (

                <div
                    className={
                        darkMode
                            ? "mb-6 rounded-xl border border-red-900 bg-red-950 p-4 text-sm text-red-300"
                            : "mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    }
                >
                    {error}
                </div>

            )}

            <StatCards
                summary={summary}
                darkMode={darkMode}
            />

            <StatusChart
                summary={summary}
                darkMode={darkMode}
            />

        </div>

    );

};

export default Dashboard;