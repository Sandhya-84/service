import React from "react";
import { useNavigate } from "react-router-dom";

import {
    useTheme
} from "../../context/ThemeContext";


const DashboardHeader = ({
    onLogout
}) => {

    const navigate = useNavigate();

    const {
        darkMode,
        toggleDarkMode
    } = useTheme();


    return (

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

                {/* =========================
                    TITLE
                ========================= */}

                <div>

                    <h1
                        className={
                            darkMode
                                ? "font-sora text-2xl font-bold text-white"
                                : "font-sora text-2xl font-bold text-slate-900"
                        }
                    >
                        Support Renewal Tracker
                    </h1>


                    <p
                        className={
                            darkMode
                                ? "mt-1 text-sm text-slate-400"
                                : "mt-1 text-sm text-slate-500"
                        }
                    >
                        Customer support and purchase order expiry management
                    </p>

                </div>


                {/* =========================
                    BUTTONS
                ========================= */}

                <div className="flex flex-wrap gap-2">


                    {/* =========================
                        ADD CUSTOMER
                    ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/add-customer")
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Add Customer
                    </button>


                    {/* =========================
                        ADD PURCHASE ORDER
                    ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/add-purchase-order")
                        }
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Add PO
                    </button>


                    {/* =========================
                        IMPORT EXCEL
                    ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/import-excel")
                        }
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        Import Excel
                    </button>


                    {/* =========================
                        IMPORT HISTORY
                    ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/import-history")
                        }
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        }
                    >
                        Import History
                    </button>


                    {/* =========================
                        DARK / LIGHT MODE
                    ========================= */}

                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        }
                    >
                        {darkMode
                            ? "Light Mode"
                            : "Dark Mode"}
                    </button>


                    {/* =========================
                        LOGOUT
                    ========================= */}

                    <button
                        type="button"
                        onClick={onLogout}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Logout
                    </button>

                </div>

            </div>

        </header>
    );
};


export default DashboardHeader;