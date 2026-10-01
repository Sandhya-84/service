
import React, {
    useEffect,
    useState
} from "react";

import DashboardFilters from "../dashboard/DashboardFilters";
import CustomerCard from "../dashboard/CustomerCard";

import { useTheme } from "../../context/ThemeContext";

import {
    getDashboardData
} from "../../api/dashboardApi";

const CustomerDirectory = () => {

    const { darkMode } = useTheme();

    const [dashboardData, setDashboardData] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [teamFilter, setTeamFilter] =
        useState("");

    const [
        allCustomersExpanded,
        setAllCustomersExpanded
    ] = useState(true);


    // =========================================
    // LOAD EXISTING CUSTOMER DATA
    // =========================================

    const loadCustomers = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await getDashboardData();

            setDashboardData(
                response.data || []
            );

        } catch (err) {

            console.error(
                "Customer Directory loading error:",
                err
            );

            if (err.response?.status === 401) {

                setError(
                    "Your login session has expired. Please login again."
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Failed to load customer data."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadCustomers();

    }, []);


    // =========================================
    // TEAMS
    // =========================================

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


    // =========================================
    // FILTER EXISTING DATA
    // =========================================

    const filteredDashboardData =

        dashboardData

            .map((customer) => {

                const searchText =
                    search.toLowerCase().trim();

                const customerNameMatches =
                    searchText
                        ? String(customer.name || "")
                            .toLowerCase()
                            .includes(searchText)
                        : false;

                const filteredPurchaseOrders =

                    customer.purchaseOrders?.filter(
                        (po) => {

                            // STATUS FILTER

                            if (
                                statusFilter &&
                                po.status !== statusFilter
                            ) {
                                return false;
                            }

                            // TEAM FILTER

                            if (
                                teamFilter &&
                                po.team !== teamFilter
                            ) {
                                return false;
                            }

                            // NO SEARCH

                            if (!searchText) {
                                return true;
                            }

                            // PO SEARCH

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
                                        String(field || "")
                                            .toLowerCase()
                                            .includes(searchText)
                                );

                            // UNIT SEARCH

                            const unitMatches =
                                po.units?.some((unit) => {

                                    const unitFields = [
                                        unit.unitCode,
                                        unit.hostname,
                                        unit.radioConfiguration
                                    ];

                                    return unitFields.some(
                                        (field) =>
                                            String(field || "")
                                                .toLowerCase()
                                                .includes(searchText)
                                    );

                                });

                            return (
                                poMatches ||
                                unitMatches
                            );

                        }
                    ) || [];

                return {
                    ...customer,
                    purchaseOrders: filteredPurchaseOrders,
                    customerNameMatches
                };

            })

            .filter((customer) => {

                const hasSearch =
                    search.trim().length > 0;

                const hasStatusFilter =
                    statusFilter.length > 0;

                const hasTeamFilter =
                    teamFilter.length > 0;

                // No filters: keep every customer,
                // including customers with zero POs.

                if (
                    !hasSearch &&
                    !hasStatusFilter &&
                    !hasTeamFilter
                ) {
                    return true;
                }

                // Keep exact customer-name matches.

                if (
                    hasSearch &&
                    customer.customerNameMatches
                ) {
                    return true;
                }

                // Keep customers with matching POs.

                if (
                    customer.purchaseOrders?.length > 0
                ) {
                    return true;
                }

                return false;

            });


    // =========================================
    // SHOW ALL / COLLAPSE ALL
    // =========================================

    const handleShowAll = () => {
        setAllCustomersExpanded(true);
    };

    const handleCollapseAll = () => {
        setAllCustomersExpanded(false);
    };


    // =========================================
    // UPDATE EXISTING PO IN LOCAL DATA
    // =========================================

    const handlePurchaseOrderUpdated = (
        purchaseOrderId,
        updatedPurchaseOrder
    ) => {

        // Supports the existing callback signature:
        // onPurchaseOrderUpdated(_id, updatedPO)

        // Also supports a single updated PO object.

        if (
            typeof purchaseOrderId === "object" &&
            purchaseOrderId !== null
        ) {
            updatedPurchaseOrder = purchaseOrderId;
            purchaseOrderId = updatedPurchaseOrder._id;
        }

        if (!updatedPurchaseOrder || !purchaseOrderId) {
            return;
        }

        setDashboardData((previousData) =>

            previousData.map((customer) => ({

                ...customer,

                purchaseOrders:
                    customer.purchaseOrders?.map((po) => {

                        if (po._id !== purchaseOrderId) {
                            return po;
                        }

                        return {
                            ...po,
                            ...updatedPurchaseOrder
                        };

                    })

            }))

        );

    };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <div
                className={
                    darkMode
                        ? "flex min-h-[60vh] items-center justify-center text-white"
                        : "flex min-h-[60vh] items-center justify-center text-slate-900"
                }
            >
                <p>Loading customer directory...</p>
            </div>

        );

    }


    // =========================================
    // PAGE
    // =========================================

    return (

        <div className="w-full">

            {/* HEADER */}

            <div className="mb-6">

                <h1
                    className={
                        darkMode
                            ? "font-sora text-2xl font-bold text-white"
                            : "font-sora text-2xl font-bold text-slate-900"
                    }
                >
                    Customer Directory
                </h1>

                <p
                    className={
                        darkMode
                            ? "mt-1 text-sm text-slate-400"
                            : "mt-1 text-sm text-slate-500"
                    }
                >
                    Search and manage existing customers,
                    purchase orders, and network units.
                </p>

            </div>


            {/* ERROR */}

            {error && (

                <div
                    className={
                        darkMode
                            ? "mb-6 rounded-xl border border-red-900 bg-red-950 p-4 text-sm text-red-300"
                            : "mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    }
                >

                    {error}

                    <button
                        type="button"
                        onClick={loadCustomers}
                        className="ml-3 font-semibold underline"
                    >
                        Retry
                    </button>

                </div>

            )}


            {/* EXISTING SEARCH AND FILTERS */}

            <DashboardFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                teamFilter={teamFilter}
                setTeamFilter={setTeamFilter}
                teams={teams}
                darkMode={darkMode}
            />


            {/* SHOW ALL / COLLAPSE ALL */}

            <div className="mb-4 flex flex-wrap justify-end gap-2">

                <button
                    type="button"
                    onClick={handleShowAll}
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
                    onClick={handleCollapseAll}
                    className={
                        darkMode
                            ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                            : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    }
                >
                    Collapse All
                </button>

            </div>


            {/* EXISTING CUSTOMER CARDS */}

            <div className="space-y-4">

                {filteredDashboardData.length > 0 ? (

                    filteredDashboardData.map((customer) => (

                        <CustomerCard
                            key={customer._id}
                            customer={customer}
                            darkMode={darkMode}
                            expanded={allCustomersExpanded}
                            onPurchaseOrderUpdated={
                                handlePurchaseOrderUpdated
                            }
                        />

                    ))

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
                            No matching customers or purchase orders found.
                        </p>

                    </div>

                )}

            </div>

        </div>

    );

};

export default CustomerDirectory;