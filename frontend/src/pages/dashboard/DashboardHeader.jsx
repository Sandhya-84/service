import React from "react";

const DashboardHeader = ({
    darkMode,
    setDarkMode,
    handleLogout
}) => {

    return (
        <header
            className={
                darkMode
                    ? "border-b border-slate-800 bg-slate-900"
                    : "border-b border-slate-200 bg-white"
            }
        >

            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">

                <div>

                    <h1 className="font-sora text-2xl font-bold">
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


                <div className="flex flex-wrap gap-2">

                    <button
                        type="button"
                        onClick={() =>
                            setDarkMode(!darkMode)
                        }
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                : "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                        }
                    >
                        {darkMode
                            ? "Light Mode"
                            : "Dark Mode"}
                    </button>


                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Logout
                    </button>

                </div>

            </div>

        </header>
    );
};

export default DashboardHeader;