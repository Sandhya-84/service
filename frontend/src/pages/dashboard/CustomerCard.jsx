import React, { useState } from "react";
import PurchaseOrderCard from "./PurchaseOrderCard";

const CustomerCard = ({
    customer,
    darkMode,
    expanded,
    onPurchaseOrderUpdated
}) => {

    // =========================
    // MANUAL CUSTOMER EXPANSION
    // =========================

    const [
        manuallyExpanded,
        setManuallyExpanded
    ] = useState(null);


    // =========================
    // PURCHASE ORDERS
    // =========================

    const purchaseOrders =
        customer?.purchaseOrders || [];


    // =========================
    // TOTAL UNITS
    // =========================

    const totalUnits =
        purchaseOrders.reduce(
            (total, po) =>
                total + (po.units?.length || 0),
            0
        );


    // =========================
    // EXPIRED COUNT
    // =========================

    const expiredCount =
        purchaseOrders.filter(
            (po) =>
                po.status === "Expired"
        ).length;


    // =========================
    // NO EXPIRY COUNT
    // =========================

    const noExpiryCount =
        purchaseOrders.filter(
            (po) =>
                po.status === "No Expiry Date"
        ).length;


    // =========================
    // ACTUAL EXPANDED STATE
    // =========================

    const isExpanded =
        manuallyExpanded === null
            ? expanded
            : manuallyExpanded;


    // =========================
    // TOGGLE CUSTOMER
    // =========================

    const toggleCustomer = () => {

        setManuallyExpanded(
            !isExpanded
        );

    };


    // =========================
    // SAFETY CHECK
    // =========================

    if (!customer) {
        return null;
    }


    return (

        <div
            className={
                darkMode
                    ? "overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
                    : "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            }
        >

            {/* ========================= */}
            {/* CUSTOMER HEADER */}
            {/* ========================= */}

            <button
                type="button"
                onClick={toggleCustomer}
                className={
                    darkMode
                        ? "flex w-full items-center justify-between gap-4 border-b border-slate-700 px-4 py-3 text-left hover:bg-slate-800"
                        : "flex w-full items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                }
            >

                {/* LEFT SIDE */}

                <div className="flex min-w-0 items-center gap-2">

                    {/* ARROW */}

                    <span className="w-4 text-lg leading-none text-slate-500">

                        {isExpanded
                            ? "⌄"
                            : "›"}

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


                    {/* PO + UNIT COUNT */}

                    <span
                        className={
                            darkMode
                                ? "text-xs text-slate-400"
                                : "text-xs text-slate-500"
                        }
                    >

                        {purchaseOrders.length}

                        {" "}

                        {purchaseOrders.length === 1
                            ? "PO"
                            : "POs"}

                        {" · "}

                        {totalUnits}

                        {" "}

                        {totalUnits === 1
                            ? "unit"
                            : "units"}

                    </span>

                </div>


                {/* ========================= */}
                {/* STATUS BADGES */}
                {/* ========================= */}

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">

                    {/* EXPIRED */}

                    {expiredCount > 0 && (

                        <span
                            className={
                                darkMode
                                    ? "rounded-full bg-red-950 px-3 py-1 text-xs font-semibold text-red-300"
                                    : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600"
                            }
                        >

                            {expiredCount}

                            {" expired"}

                        </span>

                    )}


                    {/* NO EXPIRY */}

                    {noExpiryCount > 0 && (

                        <span
                            className={
                                darkMode
                                    ? "rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-300"
                                    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                            }
                        >

                            {noExpiryCount}

                            {" no date on file"}

                        </span>

                    )}

                </div>

            </button>


            {/* ========================= */}
            {/* PURCHASE ORDER TABLE */}
            {/* ========================= */}

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

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    PO Number
                                </th>

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Units
                                </th>

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Invoice
                                </th>

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Support Expiry
                                </th>

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Team
                                </th>

                                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Renewed
                                </th>

                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Notes
                                </th>

                            </tr>

                        </thead>


                        {/* TABLE BODY */}

                        <tbody>

                            {purchaseOrders.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="8"
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