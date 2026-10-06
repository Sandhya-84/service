import React, {
    useEffect,
    useState
} from "react";

import { useTheme } from "../../context/ThemeContext";

import {
    getActivityLogs
} from "../../api/dashboardApi";

import {
    PlusCircle,
    Edit3,
    Trash2,
    RefreshCw,
    FileEdit,
    Upload,
    Activity,
    Clock
} from "lucide-react";


const RecentActivity = () => {

    const {
        darkMode
    } = useTheme();


    const [activities, setActivities] =
        useState([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    const [showAll, setShowAll] =
        useState(false);


    // =====================================================
    // LOAD ACTIVITY LOGS
    // =====================================================

    useEffect(() => {

        const loadActivities =
            async () => {

                try {

                    setLoading(true);

                    setError("");

                    const response =
                        await getActivityLogs(100);

                    setActivities(
                        response?.activities || []
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

                    setLoading(false);

                }

            };


        loadActivities();

    }, []);


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

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


    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (date) => {

        if (!date) {
            return "";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "";
        }

        return parsedDate.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // =====================================================
    // ACTION DETAILS
    // =====================================================

    const getActionDetails = (
        action
    ) => {

        switch (action) {

            case "created":
                return {
                    label: "Created",
                    icon: PlusCircle,
                    iconClass:
                        darkMode
                            ? "bg-green-950 text-green-400"
                            : "bg-green-100 text-green-600"
                };


            case "edited":
                return {
                    label: "Edited",
                    icon: Edit3,
                    iconClass:
                        darkMode
                            ? "bg-blue-950 text-blue-400"
                            : "bg-blue-100 text-blue-600"
                };


            case "deleted":
                return {
                    label: "Deleted",
                    icon: Trash2,
                    iconClass:
                        darkMode
                            ? "bg-red-950 text-red-400"
                            : "bg-red-100 text-red-600"
                };


            case "renewed":
                return {
                    label: "Renewed",
                    icon: RefreshCw,
                    iconClass:
                        darkMode
                            ? "bg-emerald-950 text-emerald-400"
                            : "bg-emerald-100 text-emerald-600"
                };


            case "po-updated":
                return {
                    label: "PO Updated",
                    icon: FileEdit,
                    iconClass:
                        darkMode
                            ? "bg-purple-950 text-purple-400"
                            : "bg-purple-100 text-purple-600"
                };


            case "imported":
                return {
                    label: "Imported",
                    icon: Upload,
                    iconClass:
                        darkMode
                            ? "bg-amber-950 text-amber-400"
                            : "bg-amber-100 text-amber-600"
                };


            default:
                return {
                    label: "Activity",
                    icon: Activity,
                    iconClass:
                        darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                };
        }
    };


    // =====================================================
    // VISIBLE ACTIVITIES
    // =====================================================

    const visibleActivities =
        showAll
            ? activities
            : activities.slice(0, 5);


    // =====================================================
    // LOADING
    // =====================================================

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


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="w-full">

            {/* ================================================= */}
            {/* PAGE TITLE */}
            {/* ================================================= */}

            <div className="mb-6">

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
                    View recent changes, renewals,
                    imports and network unit activity.
                </p>

            </div>


            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

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


            {/* ================================================= */}
            {/* ACTIVITY CARD */}
            {/* ================================================= */}

            <div
                className={
                    darkMode
                        ? "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                        : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                }
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

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
                            {activities.length} activities found
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


                {/* ================================================= */}
                {/* EMPTY */}
                {/* ================================================= */}

                {activities.length === 0 ? (

                    <div
                        className="
                            px-6
                            py-12
                            text-center
                        "
                    >

                        <Activity
                            size={36}
                            className={
                                darkMode
                                    ? "mx-auto mb-3 text-slate-600"
                                    : "mx-auto mb-3 text-slate-300"
                            }
                        />

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
                            ) => {

                                const action =
                                    getActionDetails(
                                        activity.action
                                    );

                                const ActionIcon =
                                    action.icon;

                                return (

                                    <div
                                        key={
                                            activity._id ||
                                            `${activity.action}-${activity.createdAt}-${index}`
                                        }
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
                                                lg:items-start
                                            "
                                        >

                                            {/* ================================================= */}
                                            {/* ICON */}
                                            {/* ================================================= */}

                                            <div
                                                className={`
                                                    flex
                                                    h-10
                                                    w-10
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    ${action.iconClass}
                                                `}
                                            >

                                                <ActionIcon
                                                    size={19}
                                                />

                                            </div>


                                            {/* ================================================= */}
                                            {/* CONTENT */}
                                            {/* ================================================= */}

                                            <div className="min-w-0 flex-1">

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
                                                            activity.title ||
                                                            action.label
                                                        }
                                                    </h3>


                                                    <span
                                                        className={`
                                                            rounded-full
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-semibold
                                                            ${
                                                                darkMode
                                                                    ? "bg-slate-800 text-slate-300"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }
                                                        `}
                                                    >
                                                        {action.label}
                                                    </span>

                                                </div>


                                                <p
                                                    className={
                                                        darkMode
                                                            ? "mt-2 text-sm text-slate-300"
                                                            : "mt-2 text-sm text-slate-600"
                                                    }
                                                >
                                                    {
                                                        activity.description
                                                    }
                                                </p>


                                                {/* ================================================= */}
                                                {/* DETAILS */}
                                                {/* ================================================= */}

                                                <div
                                                    className="
                                                        mt-4
                                                        grid
                                                        grid-cols-1
                                                        gap-3
                                                        sm:grid-cols-2
                                                        lg:grid-cols-4
                                                    "
                                                >

                                                    {activity.customerName && (

                                                        <div>

                                                            <p
                                                                className={
                                                                    darkMode
                                                                        ? "text-xs text-slate-500"
                                                                        : "text-xs text-slate-400"
                                                                }
                                                            >
                                                                Customer
                                                            </p>

                                                            <p
                                                                className={
                                                                    darkMode
                                                                        ? "mt-1 text-sm font-medium text-slate-300"
                                                                        : "mt-1 text-sm font-medium text-slate-700"
                                                                }
                                                            >
                                                                {
                                                                    activity.customerName
                                                                }
                                                            </p>

                                                        </div>

                                                    )}


                                                    {activity.poNumber && (

                                                        <div>

                                                            <p
                                                                className={
                                                                    darkMode
                                                                        ? "text-xs text-slate-500"
                                                                        : "text-xs text-slate-400"
                                                                }
                                                            >
                                                                Purchase Order
                                                            </p>

                                                            <p
                                                                className={
                                                                    darkMode
                                                                        ? "mt-1 text-sm font-medium text-slate-300"
                                                                        : "mt-1 text-sm font-medium text-slate-700"
                                                                }
                                                            >
                                                                {
                                                                    activity.poNumber
                                                                }
                                                            </p>

                                                        </div>

                                                    )}


                                                    {activity.unitCode && (

                                                        <div>

                                                            <p
                                                                className={
                                                                    darkMode
                                                                        ? "text-xs text-slate-500"
                                                                        : "text-xs text-slate-400"
                                                                }
                                                            >
                                                                Network Unit
                                                            </p>

                                                            <p
                                                                className={
                                                                    darkMode
                                                                        ? "mt-1 text-sm font-medium text-slate-300"
                                                                        : "mt-1 text-sm font-medium text-slate-700"
                                                                }
                                                            >
                                                                {
                                                                    activity.unitCode
                                                                }

                                                                {activity.unitCount >
                                                                    1 &&
                                                                    ` + ${
                                                                        activity.unitCount -
                                                                        1
                                                                    } more`}
                                                            </p>

                                                        </div>

                                                    )}


                                                    <div>

                                                        <p
                                                            className={
                                                                darkMode
                                                                    ? "text-xs text-slate-500"
                                                                    : "text-xs text-slate-400"
                                                            }
                                                        >
                                                            Date & Time
                                                        </p>

                                                        <div
                                                            className={
                                                                darkMode
                                                                    ? "mt-1 flex items-center gap-1.5 text-sm text-slate-300"
                                                                    : "mt-1 flex items-center gap-1.5 text-sm text-slate-700"
                                                            }
                                                        >

                                                            <Clock
                                                                size={14}
                                                            />

                                                            <span>
                                                                {
                                                                    formatDate(
                                                                        activity.createdAt
                                                                    )
                                                                }
                                                                {" "}
                                                                {formatTime(
                                                                    activity.createdAt
                                                                )}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </div>


                                                {/* ================================================= */}
                                                {/* DETAILS TEXT */}
                                                {/* ================================================= */}

                                                {activity.details && (

                                                    <div
                                                        className={
                                                            darkMode
                                                                ? "mt-4 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300"
                                                                : "mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600"
                                                        }
                                                    >
                                                        {activity.details}
                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}


                {/* ================================================= */}
                {/* VIEW ALL */}
                {/* ================================================= */}

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