import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    useTheme
} from "../../context/ThemeContext";

import {
    getImportHistory
} from "../../api/dashboardApi";


const ImportHistory = () => {

    const navigate = useNavigate();

    const {
        darkMode
    } = useTheme();


    const [imports, setImports] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================
    // LOAD IMPORT HISTORY
    // =========================

    useEffect(() => {

        const loadImportHistory =
            async () => {

                try {

                    setLoading(true);
                    setError("");

                    const response =
                        await getImportHistory();

                    setImports(
                        response.imports || []
                    );

                } catch (error) {

                    console.error(
                        "Import history error:",
                        error
                    );

                    setError(
                        error.response?.data?.message ||
                        "Failed to load import history."
                    );

                } finally {

                    setLoading(false);

                }

            };


        loadImportHistory();

    }, []);


    // =========================
    // DATE FORMAT
    // =========================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    };


    // =========================
    // STATUS STYLE
    // =========================

    const getStatusClass = (status) => {

        if (status === "completed") {

            return darkMode
                ? "bg-green-950 text-green-300"
                : "bg-green-100 text-green-700";

        }

        if (status === "failed") {

            return darkMode
                ? "bg-red-950 text-red-300"
                : "bg-red-100 text-red-700";

        }

        return darkMode
            ? "bg-yellow-950 text-yellow-300"
            : "bg-yellow-100 text-yellow-700";

    };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (

            <div
                className={
                    darkMode
                        ? "flex min-h-screen items-center justify-center bg-slate-950 text-white"
                        : "flex min-h-screen items-center justify-center bg-[#F3F6F6] text-slate-900"
                }
            >

                <p className="text-sm">
                    Loading import history...
                </p>

            </div>

        );

    }


    return (

        <div
            className={
                darkMode
                    ? "min-h-screen bg-slate-950 text-white"
                    : "min-h-screen bg-[#F3F6F6] text-slate-900"
            }
        >


            {/* =========================
                HEADER
            ========================= */}

            <header
                className={
                    darkMode
                        ? "border-b border-slate-800 bg-slate-950"
                        : "border-b border-slate-200 bg-white"
                }
            >

                <div
                    className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8"
                >

                    <div>

                        <h1
                            className={
                                darkMode
                                    ? "font-sora text-2xl font-bold text-white"
                                    : "font-sora text-2xl font-bold text-slate-900"
                            }
                        >
                            Import History
                        </h1>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-sm text-slate-400"
                                    : "mt-1 text-sm text-slate-500"
                            }
                        >
                            View previous Excel imports and their results
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        }
                    >
                        ← Back to Dashboard
                    </button>

                </div>

            </header>


            {/* =========================
                MAIN
            ========================= */}

            <main
                className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
            >


                {/* =========================
                    ERROR
                ========================= */}

                {error && (

                    <div
                        className={
                            darkMode
                                ? "mb-6 rounded-xl border border-red-900 bg-red-950 px-5 py-4 text-sm text-red-300"
                                : "mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                        }
                    >
                        {error}
                    </div>

                )}


                {/* =========================
                    SUMMARY
                ========================= */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">


                    <div
                        className={
                            darkMode
                                ? "rounded-xl border border-slate-800 bg-slate-900 p-5"
                                : "rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        }
                    >

                        <p
                            className={
                                darkMode
                                    ? "text-xs font-medium uppercase tracking-wide text-slate-400"
                                    : "text-xs font-medium uppercase tracking-wide text-slate-500"
                            }
                        >
                            Total Imports
                        </p>


                        <p
                            className={
                                darkMode
                                    ? "mt-2 text-3xl font-bold text-white"
                                    : "mt-2 text-3xl font-bold text-slate-900"
                            }
                        >
                            {imports.length}
                        </p>

                    </div>


                    <div
                        className={
                            darkMode
                                ? "rounded-xl border border-slate-800 bg-slate-900 p-5"
                                : "rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        }
                    >

                        <p
                            className={
                                darkMode
                                    ? "text-xs font-medium uppercase tracking-wide text-slate-400"
                                    : "text-xs font-medium uppercase tracking-wide text-slate-500"
                            }
                        >
                            Completed
                        </p>


                        <p className="mt-2 text-3xl font-bold text-green-600">

                            {
                                imports.filter(
                                    item =>
                                        item.status === "completed"
                                ).length
                            }

                        </p>

                    </div>


                    <div
                        className={
                            darkMode
                                ? "rounded-xl border border-slate-800 bg-slate-900 p-5"
                                : "rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        }
                    >

                        <p
                            className={
                                darkMode
                                    ? "text-xs font-medium uppercase tracking-wide text-slate-400"
                                    : "text-xs font-medium uppercase tracking-wide text-slate-500"
                            }
                        >
                            Failed
                        </p>


                        <p className="mt-2 text-3xl font-bold text-red-600">

                            {
                                imports.filter(
                                    item =>
                                        item.status === "failed"
                                ).length
                            }

                        </p>

                    </div>

                </div>


                {/* =========================
                    IMPORT TABLE
                ========================= */}

                <div
                    className={
                        darkMode
                            ? "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                            : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    }
                >

                    <div
                        className={
                            darkMode
                                ? "border-b border-slate-800 px-5 py-4"
                                : "border-b border-slate-200 px-5 py-4"
                        }
                    >

                        <h2
                            className={
                                darkMode
                                    ? "font-sora text-lg font-bold text-white"
                                    : "font-sora text-lg font-bold text-slate-900"
                            }
                        >
                            Previous Imports
                        </h2>

                    </div>


                    {imports.length === 0 ? (

                        <div className="px-6 py-12 text-center">

                            <p
                                className={
                                    darkMode
                                        ? "text-sm text-slate-400"
                                        : "text-sm text-slate-500"
                                }
                            >
                                No Excel imports have been recorded yet.
                            </p>


                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/import-excel")
                                }
                                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Import Excel
                            </button>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="min-w-full">

                                <thead
                                    className={
                                        darkMode
                                            ? "bg-slate-950"
                                            : "bg-slate-50"
                                    }
                                >

                                    <tr>

                                        <th
                                            className={
                                                darkMode
                                                    ? "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            File Name
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Imported At
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Customers
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Purchase Orders
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Units
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {imports.map(
                                        (item, index) => (

                                            <tr
                                                key={
                                                    item._id ||
                                                    index
                                                }
                                                className={
                                                    darkMode
                                                        ? "border-t border-slate-800 hover:bg-slate-800/50"
                                                        : "border-t border-slate-200 hover:bg-slate-50"
                                                }
                                            >

                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-5 py-4 text-sm font-medium text-white"
                                                            : "px-5 py-4 text-sm font-medium text-slate-800"
                                                    }
                                                >
                                                    {item.fileName || "-"}
                                                </td>


                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-5 py-4 text-sm text-slate-300"
                                                            : "px-5 py-4 text-sm text-slate-600"
                                                    }
                                                >
                                                    {formatDate(
                                                        item.importedAt
                                                    )}
                                                </td>


                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-5 py-4 text-sm text-slate-300"
                                                            : "px-5 py-4 text-sm text-slate-600"
                                                    }
                                                >
                                                    {
                                                        item.totalCustomers ??
                                                        0
                                                    }
                                                </td>


                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-5 py-4 text-sm text-slate-300"
                                                            : "px-5 py-4 text-sm text-slate-600"
                                                    }
                                                >
                                                    {
                                                        item.totalPurchaseOrders ??
                                                        0
                                                    }
                                                </td>


                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-5 py-4 text-sm text-slate-300"
                                                            : "px-5 py-4 text-sm text-slate-600"
                                                    }
                                                >
                                                    {
                                                        item.totalUnits ??
                                                        0
                                                    }
                                                </td>


                                                <td className="px-5 py-4">

                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {item.status ||
                                                            "processing"}
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </main>

        </div>

    );

};


export default ImportHistory;