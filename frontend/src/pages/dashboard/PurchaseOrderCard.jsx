import React, { useState } from "react";

import {
    updatePurchaseOrder,
    createRenewal,
    getRenewalHistory
} from "../../api/dashboardApi";

import NetworkUnitsTable from "./NetworkUnitsTable";


const PurchaseOrderCard = ({
    po,
    darkMode,
    onPurchaseOrderUpdated
}) => {

    const [expanded, setExpanded] =
        useState(false);

    const [team, setTeam] =
        useState(po.team || "");

    const [notes, setNotes] =
        useState(po.notes || "");

    const [renewed, setRenewed] =
        useState(po.renewed || false);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [showRenewalModal, setShowRenewalModal] =
        useState(false);

    const [newExpiryDate, setNewExpiryDate] =
        useState("");

    const [renewalNotes, setRenewalNotes] =
        useState("");

    const [renewing, setRenewing] =
        useState(false);

    const [renewalMessage, setRenewalMessage] =
        useState("");

    const [renewalHistory, setRenewalHistory] =
        useState([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [showHistory, setShowHistory] =
        useState(false);


    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    const getDaysText = (date) => {

        if (!date) {
            return "";
        }

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const expiry = new Date(date);

        expiry.setHours(
            0,
            0,
            0,
            0
        );

        const difference =
            Math.ceil(
                (
                    expiry.getTime() -
                    today.getTime()
                ) /
                (1000 * 60 * 60 * 24)
            );


        if (difference < 0) {
            return `${Math.abs(difference)}d ago`;
        }

        if (difference === 0) {
            return "Today";
        }

        return `in ${difference}d`;
    };


    const handleSave = async () => {

        try {

            setSaving(true);
            setMessage("");

            const response =
                await updatePurchaseOrder(
                    po._id,
                    {
                        team,
                        notes,
                        renewed
                    }
                );


            setMessage(
                "Saved successfully."
            );


            if (
                onPurchaseOrderUpdated &&
                response.purchaseOrder
            ) {

                onPurchaseOrderUpdated(
                    response.purchaseOrder
                );

            }

        } catch (error) {

            console.error(
                "Update purchase order error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Failed to save changes."
            );

        } finally {

            setSaving(false);

        }

    };


    const handleOpenRenewal = () => {

        setNewExpiryDate("");
        setRenewalNotes("");
        setRenewalMessage("");
        setShowRenewalModal(true);

    };


    const handleCloseRenewal = () => {

        if (renewing) {
            return;
        }

        setShowRenewalModal(false);

    };


    const handleRenew = async () => {

        if (!newExpiryDate) {

            setRenewalMessage(
                "Please select a new expiry date."
            );

            return;

        }


        try {

            setRenewing(true);
            setRenewalMessage("");


            const response =
                await createRenewal({
                    purchaseOrderId: po._id,
                    newExpiryDate,
                    notes: renewalNotes
                });


            setRenewalMessage(
                "Renewal recorded successfully."
            );


            setRenewed(true);


            if (
                onPurchaseOrderUpdated &&
                response.purchaseOrder
            ) {

                onPurchaseOrderUpdated(
                    response.purchaseOrder
                );

            }


            setTimeout(() => {

                setShowRenewalModal(false);

            }, 800);


        } catch (error) {

            console.error(
                "Renewal error:",
                error
            );

            setRenewalMessage(
                error.response?.data?.message ||
                "Failed to record renewal."
            );

        } finally {

            setRenewing(false);

        }

    };


    const handleLoadHistory = async () => {

        try {

            setHistoryLoading(true);

            const response =
                await getRenewalHistory(
                    po._id
                );

            setRenewalHistory(
                response.history || []
            );

            setShowHistory(true);

        } catch (error) {

            console.error(
                "Renewal history error:",
                error
            );

        } finally {

            setHistoryLoading(false);

        }

    };


    const statusClass =
        po.status === "Active"
            ? "bg-green-100 text-green-700"
            : po.status ===
              "Expiring ≤ 30 Days"
            ? "bg-amber-100 text-amber-700"
            : po.status === "Expired"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-600";


    const statusDot =
        po.status === "Active"
            ? "bg-green-500"
            : po.status ===
              "Expiring ≤ 30 Days"
            ? "bg-amber-500"
            : po.status === "Expired"
            ? "bg-red-500"
            : "bg-slate-400";


    return (
        <>
            {/* PO ROW */}

            <tr
                className={
                    darkMode
                        ? "border-t border-slate-800"
                        : "border-t border-slate-200"
                }
            >

                {/* PO NUMBER */}

                <td className="px-3 py-2">

                    <span className="data-text text-sm">
                        {po.poNumber || "—"}
                    </span>

                </td>


                {/* UNITS */}

                <td className="px-3 py-2">

                    <button
                        type="button"
                        onClick={() =>
                            setExpanded(!expanded)
                        }
                        className={
                            darkMode
                                ? "rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
                                : "rounded-full bg-[#edf3f4] px-3 py-1 text-xs font-medium text-slate-700 hover:bg-[#e2ebec]"
                        }
                    >

                        {po.units?.length || 0}

                        {po.units?.length === 1
                            ? " unit"
                            : " units"}

                        {" "}
                        {expanded
                            ? "⌃"
                            : "⌄"}

                    </button>

                </td>


                {/* INVOICE */}

                <td className="px-3 py-2">

                    <span className="data-text text-sm">
                        {po.invoiceNumber || "—"}
                    </span>

                </td>


                {/* SUPPORT EXPIRY */}

                <td className="px-3 py-2">

                    <div className="text-sm">

                        <div className="data-text">
                            {formatDate(
                                po.supportExpiryDate
                            )}
                        </div>

                        {po.supportExpiryDate && (
                            <div className="text-[11px] text-slate-500">
                                {getDaysText(
                                    po.supportExpiryDate
                                )}
                            </div>
                        )}

                    </div>

                </td>


                {/* STATUS */}

                <td className="px-3 py-2">

                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                    >

                        <span
                            className={`h-2 w-2 rounded-full ${statusDot}`}
                        />

                        {po.status}

                    </span>

                </td>


                {/* TEAM */}

                <td className="px-3 py-2">

                    <input
                        type="text"
                        value={team}
                        onChange={(e) =>
                            setTeam(
                                e.target.value
                            )
                        }
                        onBlur={handleSave}
                        placeholder="Unassigned"
                        className={
                            darkMode
                                ? "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                : "w-full rounded-md border border-slate-200 bg-[#edf3f4] px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                        }
                    />

                </td>


                {/* RENEWED */}

                <td className="px-3 py-2 text-center">

                    <input
                        type="checkbox"
                        checked={renewed}
                        onChange={(e) => {

                            setRenewed(
                                e.target.checked
                            );

                            setTimeout(
                                handleSave,
                                0
                            );

                        }}
                        className="h-4 w-4"
                    />

                </td>


                {/* NOTES */}

                <td className="px-3 py-2">

                    <input
                        type="text"
                        value={notes}
                        onChange={(e) =>
                            setNotes(
                                e.target.value
                            )
                        }
                        onBlur={handleSave}
                        placeholder="Add note..."
                        className={
                            darkMode
                                ? "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                : "w-full rounded-md border border-slate-200 bg-[#edf3f4] px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                        }
                    />

                </td>

            </tr>


            {/* EXPANDED UNITS */}

            {expanded && (

                <tr>

                    <td
                        colSpan="8"
                        className={
                            darkMode
                                ? "bg-slate-950 px-6 py-4"
                                : "bg-slate-50 px-6 py-4"
                        }
                    >

                        <NetworkUnitsTable
                            units={po.units}
                            darkMode={darkMode}
                        />


                        <div className="mt-4 flex flex-wrap gap-2">

                            <button
                                type="button"
                                onClick={
                                    handleOpenRenewal
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Renew Support
                            </button>


                            <button
                                type="button"
                                onClick={
                                    handleLoadHistory
                                }
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                            >
                                {historyLoading
                                    ? "Loading..."
                                    : "Renewal History"}
                            </button>

                        </div>


                        {message && (
                            <p className="mt-2 text-sm text-slate-500">
                                {message}
                            </p>
                        )}


                        {/* RENEWAL HISTORY */}

                        {showHistory && (

                            <div
                                className={
                                    darkMode
                                        ? "mt-4 rounded-xl bg-slate-900 p-4"
                                        : "mt-4 rounded-xl bg-white p-4"
                                }
                            >

                                <div className="mb-3 flex items-center justify-between">

                                    <h4 className="font-semibold">
                                        Renewal History
                                    </h4>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowHistory(
                                                false
                                            )
                                        }
                                        className="text-sm text-slate-500"
                                    >
                                        Hide
                                    </button>

                                </div>


                                {renewalHistory.length === 0 ? (

                                    <p className="text-sm text-slate-500">
                                        No renewal history available.
                                    </p>

                                ) : (

                                    <div className="space-y-3">

                                        {renewalHistory.map(
                                            (history) => (

                                                <div
                                                    key={
                                                        history._id
                                                    }
                                                    className="rounded-lg border border-slate-200 p-3"
                                                >

                                                    <div className="grid gap-3 md:grid-cols-3">

                                                        <div>

                                                            <p className="text-xs text-slate-500">
                                                                Previous Expiry
                                                            </p>

                                                            <p className="font-semibold">
                                                                {formatDate(
                                                                    history.oldExpiryDate
                                                                )}
                                                            </p>

                                                        </div>


                                                        <div>

                                                            <p className="text-xs text-slate-500">
                                                                New Expiry
                                                            </p>

                                                            <p className="font-semibold">
                                                                {formatDate(
                                                                    history.newExpiryDate
                                                                )}
                                                            </p>

                                                        </div>


                                                        <div>

                                                            <p className="text-xs text-slate-500">
                                                                Renewed On
                                                            </p>

                                                            <p className="font-semibold">
                                                                {formatDate(
                                                                    history.createdAt
                                                                )}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        )}

                    </td>

                </tr>

            )}


            {/* RENEWAL MODAL */}

            {showRenewalModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div
                        className={
                            darkMode
                                ? "w-full max-w-lg rounded-2xl bg-slate-900 p-6 text-white"
                                : "w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900"
                        }
                    >

                        <div className="flex items-center justify-between">

                            <h3 className="font-sora text-lg font-semibold">
                                Renew Support
                            </h3>

                            <button
                                type="button"
                                onClick={
                                    handleCloseRenewal
                                }
                                className="text-xl text-slate-500"
                            >
                                ×
                            </button>

                        </div>


                        <div className="mt-5">

                            <p className="text-sm text-slate-500">
                                Current expiry date
                            </p>

                            <p className="font-semibold">
                                {formatDate(
                                    po.supportExpiryDate
                                )}
                            </p>

                        </div>


                        <div className="mt-4">

                            <label className="mb-1 block text-sm font-semibold">
                                New Expiry Date
                            </label>

                            <input
                                type="date"
                                value={newExpiryDate}
                                onChange={(e) =>
                                    setNewExpiryDate(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />

                        </div>


                        <div className="mt-4">

                            <label className="mb-1 block text-sm font-semibold">
                                Renewal Notes
                            </label>

                            <textarea
                                value={renewalNotes}
                                onChange={(e) =>
                                    setRenewalNotes(
                                        e.target.value
                                    )
                                }
                                rows="3"
                                placeholder="Optional renewal notes..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />

                        </div>


                        {renewalMessage && (

                            <p className="mt-3 text-sm text-slate-500">
                                {renewalMessage}
                            </p>

                        )}


                        <div className="mt-5 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={
                                    handleCloseRenewal
                                }
                                disabled={renewing}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={handleRenew}
                                disabled={renewing}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {renewing
                                    ? "Renewing..."
                                    : "Renew Support"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
};

export default PurchaseOrderCard;