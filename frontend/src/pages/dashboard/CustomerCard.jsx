import React, { useState } from "react";
import PurchaseOrderCard from "./PurchaseOrderCard";

const CustomerCard = ({
    customer,
    darkMode = false,
    expanded = false,
    onPurchaseOrderUpdated
}) => {

    const [manuallyExpanded, setManuallyExpanded] =
        useState(null);

    if (!customer) {
        return null;
    }

    const purchaseOrders =
        customer.purchaseOrders || [];

    const totalUnits =
        purchaseOrders.reduce(
            (total, po) =>
                total + (po.units?.length || 0),
            0
        );

    const expiredCount =
        purchaseOrders.filter(
            (po) =>
                po.status === "Expired"
        ).length;

    const noExpiryCount =
        purchaseOrders.filter(
            (po) =>
                po.status === "No Expiry Date"
        ).length;

    /*
     * If Dashboard opens/closes all customers,
     * use that value initially.
     *
     * After the user clicks one customer,
     * its own state takes control.
     */
    const isExpanded =
        manuallyExpanded === null
            ? expanded
            : manuallyExpanded;

    const toggleCustomer = () => {
        setManuallyExpanded(
            (previous) => {
                const current =
                    previous === null
                        ? expanded
                        : previous;

                return !current;
            }
        );
    };

    return (
        <div
            className={
                darkMode
                    ? "overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
                    : "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            }
        >

            {/* ================================================= */}
            {/* CUSTOMER HEADER */}
            {/* ================================================= */}

            <div
                role="button"
                tabIndex={0}
                onClick={toggleCustomer}
                onKeyDown={(event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        toggleCustomer();
                    }
                }}
                className={
                    darkMode
                        ? "flex w-full cursor-pointer items-center justify-between gap-4 border-b border-slate-700 px-4 py-3 text-left transition hover:bg-slate-800"
                        : "flex w-full cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
                }
            >

                {/* LEFT SIDE */}

                <div className="flex min-w-0 items-center gap-2">

                    {/* DOWN / RIGHT ARROW */}

                    <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center text-lg leading-none transition-transform duration-200 ${
                            isExpanded
                                ? "rotate-0"
                                : "-rotate-90"
                        } ${
                            darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                        }`}
                    >
                        ⌄
                    </span>


                    {/* CUSTOMER NAME */}

                    <span
                        className={
                            darkMode
                                ? "font-sora text-sm font-semibold text-white"
                                : "font-sora text-sm font-semibold text-slate-900"
                        }
                    >
                        {customer.name}
                    </span>


                    {/* PO COUNT */}

                    <span
                        className={
                            darkMode
                                ? "text-xs text-slate-400"
                                : "text-xs text-slate-500"
                        }
                    >
                        {purchaseOrders.length}{" "}
                        {purchaseOrders.length === 1
                            ? "PO"
                            : "POs"}
                    </span>


                    <span
                        className={
                            darkMode
                                ? "text-xs text-slate-600"
                                : "text-xs text-slate-400"
                        }
                    >
                        •
                    </span>


                    {/* UNIT COUNT */}

                    <span
                        className={
                            darkMode
                                ? "text-xs text-slate-400"
                                : "text-xs text-slate-500"
                        }
                    >
                        {totalUnits}{" "}
                        {totalUnits === 1
                            ? "unit"
                            : "units"}
                    </span>

                </div>


                {/* RIGHT SIDE */}

                <div className="flex shrink-0 items-center gap-3">

                    {expiredCount > 0 && (
                        <span
                            className={
                                darkMode
                                    ? "rounded-full bg-red-950 px-3 py-1 text-xs font-semibold text-red-300"
                                    : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600"
                            }
                        >
                            {expiredCount} expired
                        </span>
                    )}


                    {noExpiryCount > 0 && (
                        <span
                            className={
                                darkMode
                                    ? "hidden rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 sm:inline-flex"
                                    : "hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex"
                            }
                        >
                            {noExpiryCount} no expiry
                        </span>
                    )}

                </div>

            </div>


            {/* ================================================= */}
            {/* PURCHASE ORDER TABLE */}
            {/* ================================================= */}

            {isExpanded && (

                <div className="overflow-x-auto">

                    <table className="min-w-[1050px] w-full border-collapse">

                        {/* TABLE HEADER */}

                        <thead
                            className={
                                darkMode
                                    ? "bg-slate-800"
                                    : "bg-[#eaf1f2]"
                            }
                        >

                            <tr>

                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    PO Number
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    Units
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    Invoice
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    Support Expiry
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    Status
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    Team
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                                            : "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                    }
                                >
                                    Notes
                                </th>

                            </tr>

                        </thead>


                        {/* TABLE BODY */}

                        <tbody>

                            {purchaseOrders.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className={
                                            darkMode
                                                ? "px-4 py-6 text-center text-sm text-slate-400"
                                                : "px-4 py-6 text-center text-sm text-slate-500"
                                        }
                                    >
                                        No purchase orders found.
                                    </td>

                                </tr>

                            ) : (

                                purchaseOrders.map(
                                    (po) => (

                                        <PurchaseOrderCard
                                            key={po._id}
                                            purchaseOrder={po}
                                            darkMode={darkMode}
                                            onPurchaseOrderUpdated={
                                                onPurchaseOrderUpdated
                                            }
                                        />

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </div>
    );
};

export default CustomerCard;