import React, {
    useEffect,
    useState
} from "react";

import { useTheme } from "../../context/ThemeContext";

import {
    getDashboardData
} from "../../api/dashboardApi";


const RecentActivity = () => {

    const {
        darkMode
    } = useTheme();


    const [dashboardData, setDashboardData] =
        useState([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    const [showAll, setShowAll] =
        useState(false);


    useEffect(() => {

        const loadActivity =
            async () => {

                try {

                    setLoading(
                        true
                    );

                    setError("");


                    const response =
                        await getDashboardData();


                    setDashboardData(
                        response.data ||
                        []
                    );


                } catch (err) {

                    console.error(
                        "Recent activity loading error:",
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
                            "Failed to load recent activity."
                        );

                    }

                } finally {

                    setLoading(
                        false
                    );

                }

            };


        loadActivity();

    }, []);


    const activities = [];


    dashboardData.forEach(
        (customer) => {

            customer.purchaseOrders?.forEach(
                (po) => {

                    activities.push({

                        customerName:
                            customer.name ||
                            "Unknown Customer",

                        poNumber:
                            po.poNumber ||
                            "N/A",

                        invoiceNumber:
                            po.invoiceNumber ||
                            "N/A",

                        supportExpiryDate:
                            po.supportExpiryDate,

                        renewed:
                            po.renewed === true,

                        team:
                            po.team ||
                            "Unassigned",

                        updatedAt:
                            po.updatedAt ||
                            po.createdAt

                    });

                }
            );

        }
    );


    activities.sort(
        (a, b) => {

            const dateA =
                a.updatedAt
                    ? new Date(
                        a.updatedAt
                    ).getTime()
                    : 0;


            const dateB =
                b.updatedAt
                    ? new Date(
                        b.updatedAt
                    ).getTime()
                    : 0;


            return dateB - dateA;

        }
    );


    const visibleActivities =
        showAll
            ? activities
            : activities.slice(
                0,
                5
            );


    const formatDate = (
        date
    ) => {

        if (!date) {

            return "N/A";

        }


        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            return "N/A";

        }


        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    if (loading) {

        return (

            <div
                className="
                    flex
                    min-h-[60vh]
                    items-center
                    justify-center
                "
            >

                <p
                    className={
                        darkMode
                            ? "text-slate-300"
                            : "text-slate-600"
                    }
                >
                    Loading recent activity...
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

            {/* PAGE TITLE */}

            <div
                className="
                    mb-6
                "
            >

                <h1
                    className={
                        darkMode
                            ? "text-2xl font-bold text-white"
                            : "text-2xl font-bold text-slate-900"
                    }
                >
                    Recent Activity
                </h1>


                <p
                    className={
                        darkMode
                            ? "mt-1 text-sm text-slate-400"
                            : "mt-1 text-sm text-slate-500"
                    }
                >
                    View recent purchase order updates
                    and renewal activity.
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
                </div>

            )}


            {/* ACTIVITY CARD */}

            <div
                className={
                    darkMode
                        ? "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                        : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                }
            >

                {/* HEADER */}

                <div
                    className={
                        darkMode
                            ? "flex items-center justify-between border-b border-slate-800 px-6 py-5"
                            : "flex items-center justify-between border-b border-slate-200 px-6 py-5"
                    }
                >

                    <div>

                        <h2
                            className={
                                darkMode
                                    ? "text-lg font-bold text-white"
                                    : "text-lg font-bold text-slate-900"
                            }
                        >
                            Latest Updates
                        </h2>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-sm text-slate-400"
                                    : "mt-1 text-sm text-slate-500"
                            }
                        >
                            {activities.length} purchase
                            order activities found
                        </p>

                    </div>


                    {activities.length > 5 && (

                        <button
                            type="button"
                            onClick={() =>
                                setShowAll(
                                    (previous) =>
                                        !previous
                                )
                            }
                            className={
                                darkMode
                                    ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                                    : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            }
                        >
                            {showAll
                                ? "Show Less"
                                : "View All"}
                        </button>

                    )}

                </div>


                {/* EMPTY */}

                {activities.length === 0 ? (

                    <div
                        className="
                            px-6
                            py-12
                            text-center
                        "
                    >

                        <p
                            className={
                                darkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                            }
                        >
                            No recent activity found.
                        </p>

                    </div>

                ) : (

                    <div>

                        {visibleActivities.map(
                            (
                                activity,
                                index
                            ) => (

                                <div
                                    key={`${activity.poNumber}-${index}`}
                                    className={`
                                        border-b
                                        px-6
                                        py-5
                                        last:border-b-0
                                        ${
                                            darkMode
                                                ? "border-slate-800 hover:bg-slate-800/50"
                                                : "border-slate-100 hover:bg-slate-50"
                                        }
                                    `}
                                >

                                    <div
                                        className="
                                            flex
                                            flex-col
                                            gap-4
                                            lg:flex-row
                                            lg:items-center
                                            lg:justify-between
                                        "
                                    >

                                        <div
                                            className="
                                                min-w-0
                                                flex-1
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    flex-wrap
                                                    items-center
                                                    gap-2
                                                "
                                            >

                                                <h3
                                                    className={
                                                        darkMode
                                                            ? "font-semibold text-white"
                                                            : "font-semibold text-slate-900"
                                                    }
                                                >
                                                    {
                                                        activity.customerName
                                                    }
                                                </h3>


                                                <span
                                                    className={
                                                        darkMode
                                                            ? "text-slate-500"
                                                            : "text-slate-400"
                                                    }
                                                >
                                                    •
                                                </span>


                                                <span
                                                    className={
                                                        darkMode
                                                            ? "font-medium text-slate-300"
                                                            : "font-medium text-slate-700"
                                                    }
                                                >
                                                    PO:{" "}
                                                    {
                                                        activity.poNumber
                                                    }
                                                </span>

                                            </div>


                                            <div
                                                className="
                                                    mt-3
                                                    grid
                                                    grid-cols-1
                                                    gap-3
                                                    sm:grid-cols-2
                                                    lg:grid-cols-4
                                                "
                                            >

                                                <div>

                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "text-xs text-slate-500"
                                                                : "text-xs text-slate-400"
                                                        }
                                                    >
                                                        Invoice
                                                    </p>


                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "mt-1 text-sm text-slate-300"
                                                                : "mt-1 text-sm text-slate-700"
                                                        }
                                                    >
                                                        {
                                                            activity.invoiceNumber
                                                        }
                                                    </p>

                                                </div>


                                                <div>

                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "text-xs text-slate-500"
                                                                : "text-xs text-slate-400"
                                                        }
                                                    >
                                                        Support Expiry
                                                    </p>


                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "mt-1 text-sm text-slate-300"
                                                                : "mt-1 text-sm text-slate-700"
                                                        }
                                                    >
                                                        {formatDate(
                                                            activity.supportExpiryDate
                                                        )}
                                                    </p>

                                                </div>


                                                <div>

                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "text-xs text-slate-500"
                                                                : "text-xs text-slate-400"
                                                        }
                                                    >
                                                        Team
                                                    </p>


                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "mt-1 text-sm text-slate-300"
                                                                : "mt-1 text-sm text-slate-700"
                                                        }
                                                    >
                                                        {
                                                            activity.team
                                                        }
                                                    </p>

                                                </div>


                                                <div>

                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "text-xs text-slate-500"
                                                                : "text-xs text-slate-400"
                                                        }
                                                    >
                                                        Updated
                                                    </p>


                                                    <p
                                                        className={
                                                            darkMode
                                                                ? "mt-1 text-sm text-slate-300"
                                                                : "mt-1 text-sm text-slate-700"
                                                        }
                                                    >
                                                        {formatDate(
                                                            activity.updatedAt
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>


                                        <div
                                            className="
                                                shrink-0
                                            "
                                        >

                                            {activity.renewed ? (

                                                <span
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        rounded-full
                                                        bg-emerald-100
                                                        px-4
                                                        py-2
                                                        text-xs
                                                        font-semibold
                                                        text-emerald-700
                                                    "
                                                >
                                                    ✓ Renewed
                                                </span>

                                            ) : (

                                                <span
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        rounded-full
                                                        bg-amber-100
                                                        px-4
                                                        py-2
                                                        text-xs
                                                        font-semibold
                                                        text-amber-700
                                                    "
                                                >
                                                    ○ Not Renewed
                                                </span>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}


                {/* VIEW ALL */}

                {activities.length > 5 && (

                    <div
                        className={
                            darkMode
                                ? "border-t border-slate-800 px-6 py-4 text-center"
                                : "border-t border-slate-100 px-6 py-4 text-center"
                        }
                    >

                        <button
                            type="button"
                            onClick={() =>
                                setShowAll(
                                    (previous) =>
                                        !previous
                                )
                            }
                            className={
                                darkMode
                                    ? "text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                                    : "text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                            }
                        >
                            {showAll
                                ? "Show Less"
                                : `View All ${activities.length} Activities`}
                        </button>

                    </div>

                )}

            </div>

        </div>

    );

};


export default RecentActivity;