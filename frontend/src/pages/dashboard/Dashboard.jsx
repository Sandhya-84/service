import React, { useEffect, useState } from "react";

import DashboardHeader from "./DashboardHeader";
import StatCards from "./StatCards";
import StatusChart from "./StatusChart";
import DashboardFilters from "./DashboardFilters";
import CustomerCard from "./CustomerCard";

import { useTheme } from "../../context/ThemeContext";

import {
    getDashboardSummary,
    getDashboardData
} from "../../api/dashboardApi";


const Dashboard = () => {

    // =========================
    // GLOBAL DARK MODE
    // =========================

    const {
        darkMode
    } = useTheme();


    // =========================
    // DASHBOARD SUMMARY
    // =========================

    const [summary, setSummary] =
        useState({
            customers: 0,
            purchaseOrders: 0,
            networkUnits: 0,
            active: 0,
            expiring: 0,
            expired: 0,
            noExpiryDate: 0
        });


    // =========================
    // DASHBOARD DATA
    // =========================

    const [dashboardData, setDashboardData] =
        useState([]);


    // =========================
    // LOADING
    // =========================

    const [loading, setLoading] =
        useState(true);


    // =========================
    // ERROR
    // =========================

    const [error, setError] =
        useState("");


    // =========================
    // SEARCH
    // =========================

    const [search, setSearch] =
        useState("");


    // =========================
    // FILTERS
    // =========================

    const [statusFilter, setStatusFilter] =
        useState("");

    const [teamFilter, setTeamFilter] =
        useState("");


    // =========================
    // SHOW / COLLAPSE ALL
    // =========================

    const [
        allCustomersExpanded,
        setAllCustomersExpanded
    ] = useState(true);


    // =========================
    // LOAD DASHBOARD
    // =========================

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                setLoading(true);

                setError("");


                const summaryResponse =
                    await getDashboardSummary();


                const dataResponse =
                    await getDashboardData();


                setSummary(
                    summaryResponse.summary ||
                    summaryResponse
                );


                setDashboardData(
                    dataResponse.data || []
                );


            } catch (err) {

                console.error(
                    "Dashboard loading error:",
                    err
                );


                if (
                    err.response?.status === 401
                ) {

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


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem("token");

        window.location.href = "/login";

    };


    // =========================
    // SHOW ALL
    // =========================

    const handleShowAll = () => {

        setAllCustomersExpanded(true);

    };


    // =========================
    // COLLAPSE ALL
    // =========================

    const handleCollapseAll = () => {

        setAllCustomersExpanded(false);

    };


    // =========================
    // TEAMS
    // =========================

    const teams = [
        ...new Set(
            dashboardData.flatMap(
                (customer) =>
                    customer.purchaseOrders?.map(
                        (po) => po.team
                    ) || []
            )
        )
    ]
        .filter(Boolean)
        .sort();


    // =========================
    // FILTER DATA
    // =========================

    const filteredDashboardData =
        dashboardData
            .map((customer) => {

                const filteredPurchaseOrders =
                    customer.purchaseOrders?.filter(
                        (po) => {

                            // =====================
                            // STATUS FILTER
                            // =====================

                            if (
                                statusFilter &&
                                po.status !== statusFilter
                            ) {

                                return false;

                            }


                            // =====================
                            // TEAM FILTER
                            // =====================

                            if (
                                teamFilter &&
                                po.team !== teamFilter
                            ) {

                                return false;

                            }


                            // =====================
                            // NO SEARCH
                            // =====================

                            if (!search.trim()) {

                                return true;

                            }


                            // =====================
                            // SEARCH TEXT
                            // =====================

                            const searchText =
                                search
                                    .toLowerCase()
                                    .trim();


                            // =====================
                            // PO SEARCH FIELDS
                            // =====================

                            const poFields = [
                                customer.name,
                                po.poNumber,
                                po.invoiceNumber,
                                po.team,
                                po.notes,
                                po.status
                            ];


                            const poMatches =
                                poFields.some(
                                    (field) =>
                                        String(
                                            field || ""
                                        )
                                            .toLowerCase()
                                            .includes(
                                                searchText
                                            )
                                );


                            // =====================
                            // UNIT SEARCH
                            // =====================

                            const unitMatches =
                                po.units?.some(
                                    (unit) => {

                                        const unitFields = [
                                            unit.unitCode,
                                            unit.hostname,
                                            unit.radioConfiguration
                                        ];


                                        return unitFields.some(
                                            (field) =>
                                                String(
                                                    field || ""
                                                )
                                                    .toLowerCase()
                                                    .includes(
                                                        searchText
                                                    )
                                        );

                                    }
                                );


                            return (
                                poMatches ||
                                unitMatches
                            );

                        }
                    ) || [];


                return {
                    ...customer,

                    purchaseOrders:
                        filteredPurchaseOrders

                };

            })
            .filter(
                (customer) =>
                    customer.purchaseOrders?.length > 0
            );


    // =========================
    // UPDATE PO IN FRONTEND
    // =========================

    const handlePurchaseOrderUpdated = (
        updatedPurchaseOrder
    ) => {

        setDashboardData(
            (previousData) =>
                previousData.map(
                    (customer) => ({

                        ...customer,

                        purchaseOrders:
                            customer.purchaseOrders?.map(
                                (po) => {

                                    if (
                                        po._id ===
                                        updatedPurchaseOrder._id
                                    ) {

                                        return {
                                            ...po,

                                            team:
                                                updatedPurchaseOrder.team,

                                            notes:
                                                updatedPurchaseOrder.notes,

                                            renewed:
                                                updatedPurchaseOrder.renewed,

                                            nextRenewalDate:
                                                updatedPurchaseOrder.nextRenewalDate,

                                            supportExpiryDate:
                                                updatedPurchaseOrder.supportExpiryDate,

                                            status:
                                                updatedPurchaseOrder.status ||
                                                po.status
                                        };

                                    }


                                    return po;

                                }
                            )

                    })
                )
        );

    };


    // =========================
    // LOADING SCREEN
    // =========================

    if (loading) {

        return (

            <div
                className={
                    darkMode
                        ? "flex min-h-screen items-center justify-center bg-slate-950 text-white"
                        : "flex min-h-screen items-center justify-center bg-slate-100 text-slate-900"
                }
            >

                <p>
                    Loading dashboard...
                </p>

            </div>

        );

    }


    // =========================
    // DASHBOARD
    // =========================

    return (

        <div
            className={
                darkMode
                    ? "min-h-screen bg-slate-950 text-white"
                    : "min-h-screen bg-slate-100 text-slate-900"
            }
        >

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}

            <DashboardHeader
                onLogout={handleLogout}
            />


            <main
                className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
            >

                {/* ========================= */}
                {/* ERROR */}
                {/* ========================= */}

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


                {/* ========================= */}
                {/* STAT CARDS */}
                {/* ========================= */}

                <StatCards
                    summary={summary}
                    darkMode={darkMode}
                />


                {/* ========================= */}
                {/* STATUS CHART */}
                {/* ========================= */}

                <StatusChart
                    summary={summary}
                    darkMode={darkMode}
                />


                {/* ========================= */}
                {/* FILTERS */}
                {/* ========================= */}

                <DashboardFilters
                    search={search}
                    setSearch={setSearch}

                    statusFilter={
                        statusFilter
                    }

                    setStatusFilter={
                        setStatusFilter
                    }

                    teamFilter={
                        teamFilter
                    }

                    setTeamFilter={
                        setTeamFilter
                    }

                    teams={teams}

                    darkMode={darkMode}
                />


                {/* ========================= */}
                {/* SHOW / COLLAPSE */}
                {/* ========================= */}

                <div
                    className="mb-4 flex flex-wrap justify-end gap-2"
                >

                    <button
                        type="button"
                        onClick={
                            handleShowAll
                        }
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        }
                    >
                        Show All
                    </button>


                    <button
                        type="button"
                        onClick={
                            handleCollapseAll
                        }
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        }
                    >
                        Collapse All
                    </button>

                </div>


                {/* ========================= */}
                {/* CUSTOMER LIST */}
                {/* ========================= */}

                <div
                    className="space-y-4"
                >

                    {filteredDashboardData.length > 0 ? (

                        filteredDashboardData.map(
                            (customer) => (

                                <CustomerCard
                                    key={
                                        customer._id
                                    }

                                    customer={
                                        customer
                                    }

                                    darkMode={
                                        darkMode
                                    }

                                    expanded={
                                        allCustomersExpanded
                                    }

                                    onPurchaseOrderUpdated={
                                        handlePurchaseOrderUpdated
                                    }
                                />

                            )
                        )

                    ) : (

                        <div
                            className={
                                darkMode
                                    ? "rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"
                                    : "rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                            }
                        >

                            <p
                                className={
                                    darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                }
                            >
                                No matching purchase orders found.
                            </p>

                        </div>

                    )}

                </div>

            </main>

        </div>

    );

};


export default Dashboard;