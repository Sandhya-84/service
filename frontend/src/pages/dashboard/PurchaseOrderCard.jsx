import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    updatePurchaseOrder,
    createRenewal,
    getRenewalHistory
} from "../../api/dashboardApi";

import NetworkUnitsTable from "./NetworkUnitsTable";

const PurchaseOrderCard = ({
    purchaseOrder,
    darkMode,
    onPurchaseOrderUpdated
}) => {

    const navigate = useNavigate();

    // =========================
    // STATES
    // =========================

    const [team, setTeam] = useState(
        purchaseOrder?.team || "Unassigned"
    );

    const [notes, setNotes] = useState(
        purchaseOrder?.notes || ""
    );

    const [renewed, setRenewed] = useState(
        purchaseOrder?.renewed || false
    );

    const [unitsExpanded, setUnitsExpanded] =
        useState(false);

    const [renewalOpen, setRenewalOpen] =
        useState(false);

    const [historyExpanded, setHistoryExpanded] =
        useState(false);

    const [newExpiryDate, setNewExpiryDate] =
        useState("");

    const [renewalNotes, setRenewalNotes] =
        useState("");

    const [renewalHistory, setRenewalHistory] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =========================
    // UPDATE LOCAL STATE
    // =========================

    useEffect(() => {

        if (!purchaseOrder) {
            return;
        }

        setTeam(
            purchaseOrder.team || "Unassigned"
        );

        setNotes(
            purchaseOrder.notes || ""
        );

        setRenewed(
            purchaseOrder.renewed || false
        );

    }, [purchaseOrder]);


    // =========================
    // SAFETY
    // =========================

    if (!purchaseOrder) {
        return null;
    }


    // =========================
    // DATA
    // =========================

    const {
        _id,
        poNumber,
        invoiceNumber,
        supportExpiryDate,
        nextRenewalDate,
        status,
        units = []
    } = purchaseOrder;


    // =========================
    // FORMAT DATE
    // =========================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
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


    // =========================
    // DATE INPUT FORMAT
    // =========================

    const formatDateForInput = (date) => {

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

        const year =
            parsedDate.getFullYear();

        const month =
            String(
                parsedDate.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                parsedDate.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };


    // =========================
    // STATUS
    // =========================

    const getStatusClass = () => {

        if (status === "Expired") {

            return darkMode
                ? "bg-red-950 text-red-300"
                : "bg-red-100 text-red-600";
        }

        if (status === "Expiring Soon") {

            return darkMode
                ? "bg-amber-950 text-amber-300"
                : "bg-amber-100 text-amber-700";
        }

        if (status === "Active") {

            return darkMode
                ? "bg-green-950 text-green-300"
                : "bg-green-100 text-green-700";
        }

        return darkMode
            ? "bg-slate-700 text-slate-300"
            : "bg-slate-100 text-slate-600";
    };


    // =========================
    // UPDATE PO
    // =========================

    const savePurchaseOrder = async (
        changes
    ) => {

        try {

            setError("");
            setSuccess("");

            const response =
                await updatePurchaseOrder(
                    _id,
                    changes
                );

            const updatedPO =
                response.purchaseOrder ||
                response.po ||
                response;

            if (onPurchaseOrderUpdated) {

                onPurchaseOrderUpdated(
                    _id,
                    updatedPO
                );
            }

            return updatedPO;

        } catch (error) {

            console.error(
                "Update purchase order error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to update purchase order"
            );

            return null;
        }
    };


    // =========================
    // TEAM
    // =========================

    const handleTeamBlur = async () => {

        const cleanedTeam =
            team.trim() || "Unassigned";

        setTeam(cleanedTeam);

        await savePurchaseOrder({
            team: cleanedTeam
        });
    };


    // =========================
    // NOTES
    // =========================

    const handleNotesBlur = async () => {

        await savePurchaseOrder({
            notes: notes.trim()
        });
    };


    // =========================
    // RENEWED
    // =========================

    const handleRenewedChange = async (
        event
    ) => {

        const checked =
            event.target.checked;

        setRenewed(checked);

        await savePurchaseOrder({
            renewed: checked
        });
    };


    // =========================
    // LOAD HISTORY
    // =========================

    const loadRenewalHistory =
        async () => {

            try {

                setHistoryLoading(true);
                setError("");

                const response =
                    await getRenewalHistory(
                        _id
                    );

                setRenewalHistory(
                    response.renewalHistory ||
                    response.history ||
                    []
                );

            } catch (error) {

                console.error(
                    "Get renewal history error:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load renewal history"
                );

            } finally {

                setHistoryLoading(false);
            }
        };


    // =========================
    // OPEN RENEWAL
    // =========================

    const handleOpenRenewal = async () => {

        setError("");
        setSuccess("");

        setRenewalOpen(true);

        setNewExpiryDate("");
        setRenewalNotes("");

        await loadRenewalHistory();
    };


    // =========================
    // CLOSE RENEWAL
    // =========================

    const handleCloseRenewal = () => {

        setRenewalOpen(false);

        setHistoryExpanded(false);

        setNewExpiryDate("");

        setRenewalNotes("");

        setError("");

        setSuccess("");
    };


    // =========================
    // HISTORY OPEN/CLOSE
    // =========================

    const handleToggleHistory = async () => {

        const nextState =
            !historyExpanded;

        setHistoryExpanded(nextState);

        if (nextState) {

            await loadRenewalHistory();
        }
    };


    // =========================
    // RENEW SUPPORT
    // =========================

    const handleRenew = async () => {

        setError("");
        setSuccess("");

        if (!newExpiryDate) {

            setError(
                "Please select a new expiry date"
            );

            return;
        }

        if (!supportExpiryDate) {

            setError(
                "This purchase order does not have an existing expiry date."
            );

            return;
        }

        const oldDate =
            new Date(
                supportExpiryDate
            );

        const selectedDate =
            new Date(
                `${newExpiryDate}T00:00:00`
            );

        if (
            Number.isNaN(
                selectedDate.getTime()
            )
        ) {

            setError(
                "Invalid expiry date"
            );

            return;
        }

        if (
            selectedDate <= oldDate
        ) {

            setError(
                "New expiry date must be later than the current expiry date"
            );

            return;
        }

        try {

            setLoading(true);

            const response =
                await createRenewal({

                    purchaseOrderId:
                        _id,

                    newExpiryDate:
                        selectedDate.toISOString(),

                    notes:
                        renewalNotes.trim()
                });


            const updatedPO =
                response.purchaseOrder;

            if (
                updatedPO &&
                onPurchaseOrderUpdated
            ) {

                onPurchaseOrderUpdated(
                    _id,
                    updatedPO
                );
            }

            setNewExpiryDate("");

            setRenewalNotes("");

            setRenewed(true);

            await loadRenewalHistory();

            setHistoryExpanded(true);

            setSuccess(
                "Support renewed successfully"
            );

        } catch (error) {

            console.error(
                "Renewal error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to renew support"
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================
    // ADD UNIT
    // =========================

    const handleAddUnit = () => {

        navigate(
            `/add-network-unit?purchaseOrderId=${_id}`
        );
    };


    // =========================
    // TEXT COLORS
    // =========================

    const primaryText =
        darkMode
            ? "text-white"
            : "text-slate-900";

    const secondaryText =
        darkMode
            ? "text-slate-400"
            : "text-slate-600";


    return (

        <>

            {/* ========================================= */}
            {/* PO ROW */}
            {/* ========================================= */}

            <tr
                className={
                    darkMode
                        ? "border-b border-slate-700"
                        : "border-b border-slate-200"
                }
            >

                {/* PO NUMBER */}

                <td
                    className={
                        `px-3 py-3 text-sm font-semibold ${primaryText}`
                    }
                >
                    {poNumber || "—"}
                </td>


                {/* UNITS */}

                <td
                    className="px-3 py-3"
                >

                    <button
                        type="button"
                        onClick={() =>
                            setUnitsExpanded(
                                !unitsExpanded
                            )
                        }
                        className={
                            darkMode
                                ? "rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-blue-300"
                                : "rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                        }
                    >

                        {units.length}

                        {units.length === 1
                            ? " unit"
                            : " units"}

                    </button>

                </td>


                {/* INVOICE */}

                <td
                    className={
                        `px-3 py-3 text-sm ${secondaryText}`
                    }
                >
                    {invoiceNumber || "—"}
                </td>


                {/* EXPIRY */}

                <td
                    className={
                        `px-3 py-3 text-sm ${secondaryText}`
                    }
                >
                    {formatDate(
                        supportExpiryDate
                    )}
                </td>


                {/* STATUS */}

                <td
                    className="px-3 py-3"
                >

                    <span
                        className={
                            `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass()}`
                        }
                    >
                        {status ||
                            "No Expiry Date"}
                    </span>

                </td>


                {/* TEAM */}

                <td
                    className="px-3 py-3"
                >

                    <input
                        type="text"
                        value={team}
                        onChange={(event) =>
                            setTeam(
                                event.target.value
                            )
                        }
                        onBlur={
                            handleTeamBlur
                        }
                        className={
                            darkMode
                                ? "w-32 rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white"
                                : "w-32 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                        }
                    />

                </td>


                {/* RENEWED */}

                <td
                    className="px-3 py-3 text-center"
                >

                    <input
                        type="checkbox"
                        checked={renewed}
                        onChange={
                            handleRenewedChange
                        }
                        className="h-4 w-4 cursor-pointer"
                    />

                </td>


                {/* NOTES */}

                <td
                    className="px-3 py-3"
                >

                    <input
                        type="text"
                        value={notes}
                        onChange={(event) =>
                            setNotes(
                                event.target.value
                            )
                        }
                        onBlur={
                            handleNotesBlur
                        }
                        placeholder="Add notes"
                        className={
                            darkMode
                                ? "w-40 rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white"
                                : "w-40 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                        }
                    />

                </td>

            </tr>


            {/* ========================================= */}
            {/* ACTION ROW */}
            {/* ========================================= */}

            <tr
                className={
                    darkMode
                        ? "border-b border-slate-700 bg-slate-900"
                        : "border-b border-slate-100 bg-slate-50"
                }
            >

                <td
                    colSpan="8"
                    className="px-3 py-2"
                >

                    <div className="flex flex-wrap items-center gap-2">

                        {/* ADD UNIT */}

                        <button
                            type="button"
                            onClick={
                                handleAddUnit
                            }
                            className={
                                darkMode
                                    ? "rounded-md bg-blue-950 px-3 py-1.5 text-xs font-semibold text-blue-300"
                                    : "rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                            }
                        >
                            + Add Unit
                        </button>


                        {/* RENEW / CLOSE */}

                        {!renewalOpen ? (

                            <button
                                type="button"
                                onClick={
                                    handleOpenRenewal
                                }
                                className={
                                    darkMode
                                        ? "rounded-md bg-green-950 px-3 py-1.5 text-xs font-semibold text-green-300"
                                        : "rounded-md bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
                                }
                            >
                                Renew Support
                            </button>

                        ) : (

                            <button
                                type="button"
                                onClick={
                                    handleCloseRenewal
                                }
                                className={
                                    darkMode
                                        ? "rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"
                                        : "rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                }
                            >
                                Close Renewal
                            </button>

                        )}


                        {/* NEXT RENEWAL */}

                        {nextRenewalDate && (

                            <span
                                className={
                                    `text-xs ${secondaryText}`
                                }
                            >

                                Next renewal:

                                {" "}

                                <strong>
                                    {formatDate(
                                        nextRenewalDate
                                    )}
                                </strong>

                            </span>

                        )}

                    </div>

                </td>

            </tr>


            {/* ========================================= */}
            {/* NETWORK UNITS */}
            {/* ========================================= */}

            {unitsExpanded && (

                <tr
                    className={
                        darkMode
                            ? "border-b border-slate-700 bg-slate-950"
                            : "border-b border-slate-200 bg-white"
                    }
                >

                    <td
                        colSpan="8"
                        className="p-0"
                    >

                        <div className="p-3">

                            <NetworkUnitsTable
                                purchaseOrderId={_id}
                                units={units}
                                darkMode={darkMode}
                            />

                        </div>

                    </td>

                </tr>

            )}


            {/* ========================================= */}
            {/* RENEW SUPPORT PANEL */}
            {/* ========================================= */}

            {renewalOpen && (

                <tr
                    className={
                        darkMode
                            ? "border-b border-slate-700 bg-slate-950"
                            : "border-b border-slate-200 bg-slate-50"
                    }
                >

                    <td
                        colSpan="8"
                        className="p-4"
                    >

                        <div
                            className={
                                darkMode
                                    ? "rounded-lg border border-slate-700 bg-slate-900 p-4"
                                    : "rounded-lg border border-slate-200 bg-white p-4"
                            }
                        >

                            {/* TITLE */}

                            <div className="mb-4">

                                <h3
                                    className={
                                        `text-sm font-semibold ${primaryText}`
                                    }
                                >
                                    Renew Support
                                </h3>

                                <p
                                    className={
                                        `mt-1 text-xs ${secondaryText}`
                                    }
                                >
                                    Current expiry:

                                    {" "}

                                    <strong>
                                        {formatDate(
                                            supportExpiryDate
                                        )}
                                    </strong>
                                </p>

                            </div>


                            {/* FORM */}

                            <div
                                className="grid gap-3 md:grid-cols-3"
                            >

                                <div>

                                    <label
                                        className={
                                            `mb-1 block text-xs font-medium ${secondaryText}`
                                        }
                                    >
                                        New Expiry Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            newExpiryDate
                                        }
                                        min={
                                            formatDateForInput(
                                                supportExpiryDate
                                            )
                                        }
                                        onChange={
                                            (event) =>
                                                setNewExpiryDate(
                                                    event.target.value
                                                )
                                        }
                                        className={
                                            darkMode
                                                ? "w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                                                : "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                        }
                                    />

                                </div>


                                <div
                                    className="md:col-span-2"
                                >

                                    <label
                                        className={
                                            `mb-1 block text-xs font-medium ${secondaryText}`
                                        }
                                    >
                                        Renewal Notes
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            renewalNotes
                                        }
                                        onChange={
                                            (event) =>
                                                setRenewalNotes(
                                                    event.target.value
                                                )
                                        }
                                        placeholder="Optional renewal notes"
                                        className={
                                            darkMode
                                                ? "w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                                                : "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                        }
                                    />

                                </div>

                            </div>


                            {/* CONFIRM */}

                            <div className="mt-3">

                                <button
                                    type="button"
                                    onClick={
                                        handleRenew
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    {loading
                                        ? "Renewing..."
                                        : "Confirm Renewal"}

                                </button>

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div
                                    className={
                                        darkMode
                                            ? "mt-3 rounded-md bg-red-950 px-3 py-2 text-xs text-red-300"
                                            : "mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600"
                                    }
                                >
                                    {error}
                                </div>

                            )}


                            {/* SUCCESS */}

                            {success && (

                                <div
                                    className={
                                        darkMode
                                            ? "mt-3 rounded-md bg-green-950 px-3 py-2 text-xs text-green-300"
                                            : "mt-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700"
                                    }
                                >
                                    {success}
                                </div>

                            )}


                            {/* ===================================== */}
                            {/* RENEWAL HISTORY */}
                            {/* ===================================== */}

                            <div className="mt-5">

                                {/* HISTORY HEADER */}

                                <button
                                    type="button"
                                    onClick={
                                        handleToggleHistory
                                    }
                                    className={
                                        darkMode
                                            ? "flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-slate-800"
                                            : "flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-slate-100"
                                    }
                                >

                                    <div className="flex items-center gap-2">

                                        {/* ARROW */}

                                        <span
                                            className={
                                                darkMode
                                                    ? "text-xs text-slate-400"
                                                    : "text-xs text-slate-500"
                                            }
                                        >

                                            {historyExpanded
                                                ? "▼"
                                                : "▶"}

                                        </span>


                                        <span
                                            className={
                                                darkMode
                                                    ? "text-xs font-semibold uppercase tracking-wide text-slate-300"
                                                    : "text-xs font-semibold uppercase tracking-wide text-slate-600"
                                            }
                                        >
                                            Renewal History
                                        </span>

                                    </div>


                                    <span
                                        className={
                                            darkMode
                                                ? "text-xs text-slate-500"
                                                : "text-xs text-slate-400"
                                        }
                                    >

                                        {renewalHistory.length}

                                        {renewalHistory.length === 1
                                            ? " record"
                                            : " records"}

                                    </span>

                                </button>


                                {/* HISTORY CONTENT */}

                                {historyExpanded && (

                                    <div
                                        className="mt-2 space-y-2"
                                    >

                                        {historyLoading ? (

                                            <p
                                                className={
                                                    `px-2 text-xs ${secondaryText}`
                                                }
                                            >
                                                Loading history...
                                            </p>

                                        ) : renewalHistory.length === 0 ? (

                                            <p
                                                className={
                                                    `px-2 text-xs ${secondaryText}`
                                                }
                                            >
                                                No renewal history found.
                                            </p>

                                        ) : (

                                            renewalHistory.map(
                                                (history) => (

                                                    <div
                                                        key={
                                                            history._id
                                                        }
                                                        className={
                                                            darkMode
                                                                ? "rounded-md border border-slate-700 bg-slate-800 p-3"
                                                                : "rounded-md border border-slate-200 bg-slate-50 p-3"
                                                        }
                                                    >

                                                        <div
                                                            className={
                                                                `grid gap-2 text-xs md:grid-cols-3 ${secondaryText}`
                                                            }
                                                        >

                                                            <div>
                                                                <span className="font-semibold">
                                                                    Old:
                                                                </span>

                                                                {" "}

                                                                {formatDate(
                                                                    history.oldExpiryDate
                                                                )}
                                                            </div>


                                                            <div>
                                                                <span className="font-semibold">
                                                                    New:
                                                                </span>

                                                                {" "}

                                                                {formatDate(
                                                                    history.newExpiryDate
                                                                )}
                                                            </div>


                                                            <div>
                                                                <span className="font-semibold">
                                                                    Updated:
                                                                </span>

                                                                {" "}

                                                                {formatDate(
                                                                    history.createdAt
                                                                )}
                                                            </div>

                                                        </div>


                                                        {history.notes && (

                                                            <p
                                                                className={
                                                                    `mt-2 text-xs ${secondaryText}`
                                                                }
                                                            >
                                                                {history.notes}
                                                            </p>

                                                        )}

                                                    </div>

                                                )
                                            )

                                        )}

                                    </div>

                                )}

                            </div>

                        </div>

                    </td>

                </tr>

            )}

        </>

    );
};

export default PurchaseOrderCard;