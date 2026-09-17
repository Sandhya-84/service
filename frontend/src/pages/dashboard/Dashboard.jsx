import React, { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

import {
    getDashboardSummary,
    getDashboardStatus,
    getDashboardData
} from "../../api/dashboardApi";

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [customers, setCustomers] = useState([]);
const [expandedPO, setExpandedPO] = useState(null);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const summaryResponse = await getDashboardSummary();
            const statusResponse = await getDashboardStatus();
            const dataResponse = await getDashboardData();
            setCustomers(dataResponse.data);
            setSummary(summaryResponse.summary);

            const status = statusResponse.status;

            setStatusData([
                {
                    name: "Active",
                    value: status.active
                },
                {
                    name: "Expiring ≤ 30d",
                    value: status.expiringSoon
                },
                {
                    name: "Expired",
                    value: status.expired
                },
                {
                    name: "No Expiry",
                    value: status.noExpiryDate
                }
            ]);
        } catch (error) {
            console.error(error);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F6F6] p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-sm text-slate-500">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F3F6F6] p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                        <p className="text-sm font-medium text-red-700">
                            {error}
                        </p>

                        <button
                            onClick={loadDashboard}
                            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F6F6]">

            {/* ================= HEADER ================= */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#0C1416] sm:text-3xl">
                                Support Renewal Tracker
                            </h1>

                            <p className="mt-1 text-sm text-slate-500 sm:text-base">
                                Monitor customers, purchase orders and support expiry dates.
                            </p>
                        </div>

                        <button
                            className="
                                w-full rounded-lg
                                bg-[#0C1416]
                                px-5 py-3
                                text-sm font-semibold
                                text-white
                                transition
                                hover:opacity-90
                                sm:w-auto
                            "
                        >
                            Upload Excel
                        </button>

                    </div>

                </div>
            </header>


            {/* ================= MAIN ================= */}
            <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">


                {/* ================= TOP STAT CARDS ================= */}
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">

                    {/* Customers */}
                    <StatCard
                        title="Customers"
                        value={summary?.totalCustomers}
                    />

                    {/* Purchase Orders */}
                    <StatCard
                        title="Purchase Orders"
                        value={summary?.totalPurchaseOrders}
                    />

                    {/* Network Units */}
                    <StatCard
                        title="Network Units"
                        value={summary?.totalUnits}
                    />

                </section>


                {/* ================= STATUS CARDS ================= */}
                <section className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-4 sm:gap-5">

                    <StatusCard
                        title="Active"
                        value={summary?.active}
                        type="active"
                    />

                    <StatusCard
                        title="Expiring ≤ 30 Days"
                        value={summary?.expiringSoon}
                        type="expiring"
                    />

                    <StatusCard
                        title="Expired"
                        value={summary?.expired}
                        type="expired"
                    />

                    <StatusCard
                        title="No Expiry Date"
                        value={summary?.noExpiryDate}
                        type="none"
                    />

                </section>


                {/* ================= CHARTS ================= */}
                <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

                    {/* Status Chart */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">

                        <h2 className="text-lg font-semibold text-[#0C1416]">
                            Purchase Order Status
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Current support expiry status.
                        </p>

                        <div className="mt-4 h-[300px] sm:h-[350px]">

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart>

                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius="65%"
                                        label
                                    >
                                        {statusData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip />

                                    <Legend />

                                </PieChart>
                            </ResponsiveContainer>

                        </div>

                    </div>


                    {/* Renewal Overview */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">

                        <h2 className="text-lg font-semibold text-[#0C1416]">
                            Renewal Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Current support renewal information.
                        </p>

                        <div className="mt-6 space-y-4">

                            <OverviewRow
                                title="Active Purchase Orders"
                                value={summary?.active}
                            />

                            <OverviewRow
                                title="Expiring Within 30 Days"
                                value={summary?.expiringSoon}
                            />

                            <OverviewRow
                                title="Expired Purchase Orders"
                                value={summary?.expired}
                            />

                            <OverviewRow
                                title="Without Expiry Date"
                                value={summary?.noExpiryDate}
                                last
                            />

                        </div>

                    </div>

                </section>


                {/* ================= FILTER BAR ================= */}
                <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">

                    <div className="flex flex-col gap-3 lg:flex-row">

                        {/* Search */}
                        <div className="flex-1">

                            <input
                                type="text"
                                placeholder="Search customer, PO, hostname, unit, invoice..."
                                className="
                                    w-full rounded-lg
                                    border border-slate-300
                                    bg-white
                                    px-4 py-2.5
                                    text-sm
                                    outline-none
                                    transition
                                    focus:border-slate-500
                                    focus:ring-2
                                    focus:ring-slate-100
                                "
                            />

                        </div>


                        {/* Status */}
                        <select
                            className="
                                w-full rounded-lg
                                border border-slate-300
                                bg-white
                                px-4 py-2.5
                                text-sm
                                outline-none
                                lg:w-48
                            "
                        >
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Expiring ≤ 30 Days</option>
                            <option>Expired</option>
                            <option>No Expiry Date</option>
                        </select>


                        {/* Team */}
                        <select
                            className="
                                w-full rounded-lg
                                border border-slate-300
                                bg-white
                                px-4 py-2.5
                                text-sm
                                outline-none
                                lg:w-40
                            "
                        >
                            <option>All Teams</option>
                            <option>Unassigned</option>
                        </select>

                    </div>

                </section>


                {/* ================= DATA TABLE ================= */}
                <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">

                    {/* Table Header */}
                    <div className="border-b border-slate-200 px-5 py-4">

                        <h2 className="text-lg font-semibold text-[#0C1416]">
                            Customers & Purchase Orders
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Customer → Purchase Order → Network Units
                        </p>

                    </div>


                    {/* Horizontal scroll only inside table */}
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[850px] text-left">

                            <thead className="bg-slate-50">

                                <tr className="border-b border-slate-200">

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Customer
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        PO Number
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Units
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Support Expiry
                                    </th>

                                    <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 min-[640px]:table-cell">
                                        Invoice
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Team
                                    </th>

                                </tr>

                            </thead>

<tbody>
    {customers.map((customer) => (
        <React.Fragment key={customer._id}>

            {/* Customer Row */}
            <tr className="border-b border-slate-200 bg-slate-50">

                <td
                    colSpan="7"
                    className="px-5 py-3 font-semibold text-slate-800"
                >
                    {customer.name}
                </td>

            </tr>


            {/* Purchase Orders */}
            {customer.purchaseOrders.map((po) => (

                <React.Fragment key={po._id}>

                    <tr
                        className="border-b border-slate-100 hover:bg-slate-50"
                    >

                        <td className="px-5 py-4 text-sm text-slate-600">
                            {customer.name}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                            {po.poNumber}
                        </td>

                        <td className="px-5 py-4">

                            <button
                                onClick={() =>
                                    setExpandedPO(
                                        expandedPO === po._id
                                            ? null
                                            : po._id
                                    )
                                }
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                                {po.units.length} Units
                            </button>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                            {po.supportExpiryDate
                                ? new Date(
                                    po.supportExpiryDate
                                ).toLocaleDateString()
                                : "No Date"}
                        </td>

                        <td className="hidden px-5 py-4 text-sm text-slate-600 min-[640px]:table-cell">
                            {po.invoiceNumber || "-"}
                        </td>

                        <td className="px-5 py-4">

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {po.status}
                            </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                            {po.team}
                        </td>

                    </tr>


                    {/* Expanded Units */}
                    {expandedPO === po._id && (

                        <tr className="border-b border-slate-200 bg-slate-50">

                            <td
                                colSpan="7"
                                className="px-5 py-5"
                            >

                                <div className="rounded-lg border border-slate-200 bg-white">

                                    <div className="border-b border-slate-200 px-4 py-3">

                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Network Units
                                        </h3>

                                    </div>


                                    <div className="overflow-x-auto">

                                        <table className="w-full min-w-[600px]">

                                            <thead className="bg-slate-50">

                                                <tr>

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                                        Unit
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                                        Hostname
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                                        Radio Configuration
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {po.units.map((unit) => (

                                                    <tr
                                                        key={unit._id}
                                                        className="border-t border-slate-100"
                                                    >

                                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                                            {unit.unitCode}
                                                        </td>

                                                        <td className="px-4 py-3 text-sm text-slate-600">
                                                            {unit.hostname || "-"}
                                                        </td>

                                                        <td className="px-4 py-3 text-sm text-slate-600">
                                                            {unit.radioConfiguration || "-"}
                                                        </td>

                                                    </tr>

                                                ))}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                            </td>

                        </tr>

                    )}

                </React.Fragment>

            ))}

        </React.Fragment>
    ))}

    {customers.length === 0 && (

        <tr>

            <td
                colSpan="7"
                className="px-5 py-12 text-center text-sm text-slate-500"
            >
                No customer data found.
            </td>

        </tr>

    )}

</tbody>

                        </table>

                    </div>

                </section>

            </main>

        </div>
    );
};


/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ title, value }) => {
    return (
        <div
            className="
                rounded-xl
                border border-slate-200
                bg-white
                p-4
                sm:p-6
            "
        >
            <p className="text-sm font-medium text-slate-500">
                {title}
            </p>

            <p className="mt-2 text-2xl font-bold text-[#0C1416] sm:text-3xl">
                {value ?? 0}
            </p>
        </div>
    );
};


/* =========================================================
   STATUS CARD
========================================================= */

const StatusCard = ({ title, value, type }) => {

    const statusStyles = {
        active: "border-emerald-200",
        expiring: "border-amber-200",
        expired: "border-red-200",
        none: "border-slate-200"
    };

    const valueStyles = {
        active: "text-emerald-700",
        expiring: "text-amber-700",
        expired: "text-red-700",
        none: "text-slate-700"
    };

    return (
        <div
            className={`
                rounded-xl
                border
                bg-white
                p-4
                sm:p-5
                ${statusStyles[type]}
            `}
        >
            <p className="text-sm font-medium text-slate-500">
                {title}
            </p>

            <p
                className={`
                    mt-2 text-2xl font-bold
                    sm:text-3xl
                    ${valueStyles[type]}
                `}
            >
                {value ?? 0}
            </p>
        </div>
    );
};


/* =========================================================
   OVERVIEW ROW
========================================================= */

const OverviewRow = ({ title, value, last }) => {
    return (
        <div
            className={`
                flex items-center justify-between
                py-3
                ${!last ? "border-b border-slate-100" : ""}
            `}
        >
            <span className="text-sm text-slate-600">
                {title}
            </span>

            <span className="text-sm font-semibold text-[#0C1416]">
                {value ?? 0}
            </span>
        </div>
    );
};


export default Dashboard;