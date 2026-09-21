import React, {
    useEffect,
    useState
} from "react";

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

    const {
        darkMode
    } = useTheme();


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


    useEffect(() => {

        const loadDashboard =
            async () => {

                try {

                    setLoading(
                        true
                    );

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
                        dataResponse.data ||
                        []
                    );


                } catch (err) {

                    console.error(
                        "Dashboard loading error:",
                        err
                    );


                    if (
                        err.response?.status ===
                        401
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

                    setLoading(
                        false
                    );

                }

            };


        loadDashboard();

    }, []);


    const handleShowAll = () => {

        setAllCustomersExpanded(
            true
        );

    };


    const handleCollapseAll = () => {

        setAllCustomersExpanded(
            false
        );

    };


    const teams = [

        ...new Set(

            dashboardData.flatMap(
                (customer) =>
                    customer.purchaseOrders?.map(
                        (po) =>
                            po.team
                    ) || []
            )

        )

    ]
        .filter(Boolean)
        .sort();


    const filteredDashboardData =

        dashboardData

            .map(
                (customer) => {

                    const filteredPurchaseOrders =

                        customer.purchaseOrders?.filter(
                            (po) => {

                                if (
                                    statusFilter &&
                                    po.status !==
                                    statusFilter
                                ) {

                                    return false;

                                }


                                if (
                                    teamFilter &&
                                    po.team !==
                                    teamFilter
                                ) {

                                    return false;

                                }


                                if (
                                    !search.trim()
                                ) {

                                    return true;

                                }


                                const searchText =
                                    search
                                        .toLowerCase()
                                        .trim();


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
                                                field ||
                                                ""
                                            )
                                                .toLowerCase()
                                                .includes(
                                                    searchText
                                                )
                                    );


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
                                                        field ||
                                                        ""
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

                }
            )

            .filter(
                (customer) =>
                    customer.purchaseOrders?.length >
                    0
            );


    const handlePurchaseOrderUpdated =
        (
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


    if (loading) {

        return (

            <div
                className={
                    darkMode
                        ? "flex min-h-[60vh] items-center justify-center text-white"
                        : "flex min-h-[60vh] items-center justify-center text-slate-900"
                }
            >

                <p>
                    Loading dashboard...
                </p>

            </div>

        );

    }


    return (

        <div
            className="
                w-full
            "
        >

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
                summary={
                    summary
                }

                darkMode={
                    darkMode
                }
            />


            <StatusChart
                summary={
                    summary
                }

                darkMode={
                    darkMode
                }
            />


            <DashboardFilters
                search={
                    search
                }

                setSearch={
                    setSearch
                }

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

                teams={
                    teams
                }

                darkMode={
                    darkMode
                }
            />


            <div
                className="
                    mb-4
                    flex
                    flex-wrap
                    justify-end
                    gap-2
                "
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


            <div
                className="
                    space-y-4
                "
            >

                {filteredDashboardData.length >
                0 ? (

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

        </div>

    );

};


export default Dashboard;