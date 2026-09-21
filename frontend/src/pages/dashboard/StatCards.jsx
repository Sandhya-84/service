import React from "react";

const StatCards = ({
    summary,
    darkMode
}) => {

    const topCards = [
        {
            title: "Customers",
            value: summary.customers
        },
        {
            title: "Purchase Orders",
            value: summary.purchaseOrders
        },
        {
            title: "Network Units",
            value: summary.networkUnits
        }
    ];

    const statusCards = [
        {
            title: "Active",
            value: summary.active,
            color: "green"
        },
        {
            title: "Expiring ≤ 30 Days",
            value: summary.expiring,
            color: "amber"
        },
        {
            title: "Expired",
            value: summary.expired,
            color: "red"
        },
        {
            title: "No Expiry Date",
            value: summary.noExpiryDate,
            color: "slate"
        }
    ];


    return (
        <div className="mb-6 space-y-4">

            {/* ========================= */}
            {/* MAIN STATISTICS */}
            {/* ========================= */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                {topCards.map((card) => (

                    <div
                        key={card.title}
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
                                : "rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        }
                    >

                        <p
                            className={
                                darkMode
                                    ? "text-xs font-medium text-slate-400"
                                    : "text-xs font-medium text-slate-500"
                            }
                        >
                            {card.title}
                        </p>

                        <p
                            className={
                                darkMode
                                    ? "mt-1 font-sora text-2xl font-bold text-white"
                                    : "mt-1 font-sora text-2xl font-bold text-slate-900"
                            }
                        >
                            {Number(card.value) || 0}
                        </p>

                    </div>

                ))}

            </div>


            {/* ========================= */}
            {/* STATUS STATISTICS */}
            {/* ========================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {statusCards.map((card) => {

                    let borderClass = "";
                    let valueClass = "";

                    if (card.color === "green") {
                        borderClass = darkMode
                            ? "border-emerald-800"
                            : "border-emerald-200";

                        valueClass = "text-emerald-600";
                    }

                    if (card.color === "amber") {
                        borderClass = darkMode
                            ? "border-amber-800"
                            : "border-amber-200";

                        valueClass = "text-amber-600";
                    }

                    if (card.color === "red") {
                        borderClass = darkMode
                            ? "border-red-800"
                            : "border-red-200";

                        valueClass = "text-red-600";
                    }

                    if (card.color === "slate") {
                        borderClass = darkMode
                            ? "border-slate-700"
                            : "border-slate-200";

                        valueClass = darkMode
                            ? "text-slate-300"
                            : "text-slate-700";
                    }

                    return (
                        <div
                            key={card.title}
                            className={
                                darkMode
                                    ? `rounded-lg border ${borderClass} bg-slate-900 px-4 py-3`
                                    : `rounded-lg border ${borderClass} bg-white px-4 py-3 shadow-sm`
                            }
                        >

                            <p
                                className={
                                    darkMode
                                        ? "text-xs font-medium text-slate-400"
                                        : "text-xs font-medium text-slate-500"
                                }
                            >
                                {card.title}
                            </p>

                            <p
                                className={`mt-1 font-sora text-2xl font-bold ${valueClass}`}
                            >
                                {Number(card.value) || 0}
                            </p>

                        </div>
                    );
                })}

            </div>

        </div>
    );
};

export default StatCards;