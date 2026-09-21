import React from "react";

const DashboardFilters = ({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    teamFilter,
    setTeamFilter,
    teams,
    darkMode
}) => {

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setTeamFilter("");
    };


    const hasFilters =
        search ||
        statusFilter ||
        teamFilter;


    const inputClass = darkMode
        ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
        : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500";


    const selectClass = darkMode
        ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
        : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500";


    return (
        <div
            className={
                darkMode
                    ? "mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5"
                    : "mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            }
        >

            <div className="grid gap-3 md:grid-cols-4">

                {/* SEARCH */}

                <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    placeholder="Search customer, PO, hostname, unit..."
                    className={`${inputClass} md:col-span-2`}
                />


                {/* STATUS */}

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                    className={selectClass}
                >

                    <option value="">
                        All Status
                    </option>

                    <option value="Active">
                        Active
                    </option>

                    <option value="Expiring ≤ 30 Days">
                        Expiring ≤ 30 Days
                    </option>

                    <option value="Expired">
                        Expired
                    </option>

                    <option value="No Expiry Date">
                        No Expiry Date
                    </option>

                </select>


                {/* TEAM */}

                <select
                    value={teamFilter}
                    onChange={(e) =>
                        setTeamFilter(
                            e.target.value
                        )
                    }
                    className={selectClass}
                >

                    <option value="">
                        All Teams
                    </option>

                    {teams.map((team) => (

                        <option
                            key={team}
                            value={team}
                        >
                            {team}
                        </option>

                    ))}

                </select>

            </div>


            {/* CLEAR FILTERS */}

            {hasFilters && (

                <button
                    type="button"
                    onClick={clearFilters}
                    className={
                        darkMode
                            ? "mt-3 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                            : "mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    }
                >
                    Clear Filters
                </button>

            )}

        </div>
    );
};


export default DashboardFilters;