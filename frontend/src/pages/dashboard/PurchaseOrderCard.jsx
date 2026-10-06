import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Edit3,
    X,
    Save
} from "lucide-react";

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

    const [team, setTeam] = useState(
        purchaseOrder?.team || "Unassigned"
    );

    const [notes, setNotes] = useState(
        purchaseOrder?.notes || ""
    );

    const [renewed, setRenewed] = useState(
        purchaseOrder?.renewed || false
    );

    const [nextRenewalDateValue, setNextRenewalDateValue] =
        useState(
            purchaseOrder?.nextRenewalDate
                ? formatDateForInput(
                      purchaseOrder.nextRenewalDate
                  )
                : ""
        );

    const [units, setUnits] = useState(
        purchaseOrder?.units || []
    );

    const [unitsExpanded, setUnitsExpanded] =
        useState(false);

    const [editPOOpen, setEditPOOpen] =
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
            Boolean(purchaseOrder.renewed)
        );

        setNextRenewalDateValue(
            purchaseOrder.nextRenewalDate
                ? formatDateForInput(
                      purchaseOrder.nextRenewalDate
                  )
                : ""
        );

        setUnits(
            purchaseOrder.units || []
        );

    }, [purchaseOrder]);


    if (!purchaseOrder) {
        return null;
    }


    const {
        _id,
        poNumber,
        invoiceNumber,
        supportExpiryDate,
        nextRenewalDate,
        status
    } = purchaseOrder;


    function formatDate(date) {

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
    }


    function formatDateForInput(date) {

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
    }


    const getStatusClass = () => {

        if (status === "Expired") {
            return darkMode
                ? "bg-red-950 text-red-300"
                : "bg-red-100 text-red-600";
        }

        if (
            status === "Expiring Soon" ||
            status === "Expiring ≤ 30 Days"
        ) {
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
                response?.purchaseOrder ||
                response?.po ||
                response;

            if (onPurchaseOrderUpdated) {

                onPurchaseOrderUpdated(
                    _id,
                    {
                        ...purchaseOrder,
                        ...updatedPO,
                        units
                    }
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


    const handleTeamBlur = async () => {

        const cleanedTeam =
            team.trim() || "Unassigned";

        setTeam(cleanedTeam);

        await savePurchaseOrder({
            team: cleanedTeam
        });
    };


    const handleNotesBlur = async () => {

        await savePurchaseOrder({
            notes: notes.trim()
        });
    };


    const openEditPO = () => {

        setError("");

        setSuccess("");

        setTeam(
            purchaseOrder.team ||
            "Unassigned"
        );

        setNotes(
            purchaseOrder.notes || ""
        );

        setRenewed(
            Boolean(purchaseOrder.renewed)
        );

        setNextRenewalDateValue(
            purchaseOrder.nextRenewalDate
                ? formatDateForInput(
                      purchaseOrder.nextRenewalDate
                  )
                : ""
        );

        setEditPOOpen(true);
    };


    const closeEditPO = () => {

        if (loading) {
            return;
        }

        setEditPOOpen(false);

        setError("");
    };


    const handleSavePO = async () => {

        try {

            setLoading(true);

            setError("");

            const changes = {
                team:
                    team.trim() ||
                    "Unassigned",

                notes:
                    notes.trim(),

                renewed:
                    Boolean(renewed),

                nextRenewalDate:
                    nextRenewalDateValue
                        ? new Date(
                              `${nextRenewalDateValue}T00:00:00`
                          ).toISOString()
                        : null
            };

            const updatedPO =
                await savePurchaseOrder(
                    changes
                );

            if (!updatedPO) {
                return;
            }

            setEditPOOpen(false);

            setSuccess(
                "Purchase order updated successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 3000);

        } finally {

            setLoading(false);
        }
    };


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
                    response?.renewalHistory ||
                    response?.history ||
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


    const handleOpenRenewal =
        async () => {

            setError("");

            setSuccess("");

            setRenewalOpen(true);

            setNewExpiryDate("");

            setRenewalNotes("");

            await loadRenewalHistory();
        };


    const handleCloseRenewal = () => {

        setRenewalOpen(false);

        setHistoryExpanded(false);

        setNewExpiryDate("");

        setRenewalNotes("");

        setError("");

        setSuccess("");
    };


    const handleToggleHistory =
        async () => {

            const nextState =
                !historyExpanded;

            setHistoryExpanded(
                nextState
            );

            if (nextState) {
                await loadRenewalHistory();
            }
        };


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
                response?.purchaseOrder;

            if (
                updatedPO &&
                onPurchaseOrderUpdated
            ) {

                onPurchaseOrderUpdated(
                    _id,
                    {
                        ...purchaseOrder,
                        ...updatedPO,
                        units
                    }
                );
            }

            setNewExpiryDate("");

            setRenewalNotes("");

            setRenewed(true);

            setHistoryExpanded(true);

            await loadRenewalHistory();

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


    const handleAddUnit = () => {

        navigate(
            `/add-network-unit?purchaseOrderId=${_id}`
        );
    };


    const handleUnitsUpdated = (
        updatedUnits
    ) => {

        setUnits(updatedUnits);

        if (onPurchaseOrderUpdated) {

            onPurchaseOrderUpdated(
                _id,
                {
                    ...purchaseOrder,
                    units: updatedUnits
                }
            );
        }
    };


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
                    className={`px-3 py-3 text-sm font-semibold ${primaryText}`}
                >
                    {poNumber || "—"}
                </td>


                {/* UNITS */}

                <td className="px-3 py-3">

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
                    className={`px-3 py-3 text-sm ${secondaryText}`}
                >
                    {invoiceNumber || "—"}
                </td>


                {/* EXPIRY */}

                <td
                    className={`px-3 py-3 text-sm ${secondaryText}`}
                >
                    {formatDate(
                        supportExpiryDate
                    )}
                </td>


                {/* STATUS */}

                <td className="px-3 py-3">

                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass()}`}
                    >
                        {status ||
                            "No Expiry Date"}
                    </span>

                </td>


                {/* TEAM */}

                <td className="px-3 py-3">

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


                {/* RENEWED REMOVED FROM HERE */}


                {/* NOTES */}

                <td className="px-3 py-3">

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

                        {/* EDIT PO */}

                        <button
                            type="button"
                            onClick={
                                openEditPO
                            }
                            className={
                                darkMode
                                    ? "inline-flex items-center gap-1.5 rounded-md bg-blue-950 px-3 py-1.5 text-xs font-semibold text-blue-300"
                                    : "inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                            }
                        >
                            <Edit3 size={14} />
                            Edit PO
                        </button>


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


                        {/* RENEW SUPPORT */}

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


                        {nextRenewalDate && (

                            <span
                                className={`text-xs ${secondaryText}`}
                            >
                                Next renewal:{" "}
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
                                onUnitsUpdated={
                                    handleUnitsUpdated
                                }
                            />

                        </div>

                    </td>

                </tr>

            )}


            {/* ========================================= */}
            {/* EDIT PO MODAL */}
            {/* ========================================= */}

            {editPOOpen && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">

                    <div
                        className={`w-full max-w-lg rounded-2xl shadow-2xl ${
                            darkMode
                                ? "bg-slate-900"
                                : "bg-white"
                        }`}
                    >

                        {/* HEADER */}

                        <div
                            className={`flex items-center justify-between border-b px-6 py-4 ${
                                darkMode
                                    ? "border-slate-700"
                                    : "border-slate-200"
                            }`}
                        >

                            <div>

                                <h2
                                    className={`text-lg font-semibold ${
                                        darkMode
                                            ? "text-white"
                                            : "text-slate-900"
                                    }`}
                                >
                                    Edit Purchase Order
                                </h2>

                                <p
                                    className={`mt-1 text-xs ${secondaryText}`}
                                >
                                    PO:{" "}
                                    {poNumber || "—"}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeEditPO
                                }
                                disabled={loading}
                                className={`rounded-lg p-2 ${
                                    darkMode
                                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                <X size={20} />
                            </button>

                        </div>


                        {/* FORM */}

                        <div className="space-y-4 p-6">

                            {error && (

                                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>

                            )}


                            {/* TEAM */}

                            <div>

                                <label
                                    className={`mb-1 block text-sm font-medium ${secondaryText}`}
                                >
                                    Team
                                </label>

                                <input
                                    type="text"
                                    value={team}
                                    onChange={(event) =>
                                        setTeam(
                                            event.target.value
                                        )
                                    }
                                    className={
                                        darkMode
                                            ? "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                                            : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                    }
                                />

                            </div>


                            {/* NOTES */}

                            <div>

                                <label
                                    className={`mb-1 block text-sm font-medium ${secondaryText}`}
                                >
                                    Notes
                                </label>

                                <textarea
                                    rows="3"
                                    value={notes}
                                    onChange={(event) =>
                                        setNotes(
                                            event.target.value
                                        )
                                    }
                                    className={
                                        darkMode
                                            ? "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                                            : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                    }
                                />

                            </div>


                            {/* NEXT RENEWAL DATE */}

                            <div>

                                <label
                                    className={`mb-1 block text-sm font-medium ${secondaryText}`}
                                >
                                    Next Renewal Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        nextRenewalDateValue
                                    }
                                    onChange={(event) =>
                                        setNextRenewalDateValue(
                                            event.target.value
                                        )
                                    }
                                    className={
                                        darkMode
                                            ? "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                                            : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                    }
                                />

                            </div>


                            {/* RENEWED */}

                            <div
                                className={`flex items-center justify-between rounded-lg border p-4 ${
                                    darkMode
                                        ? "border-slate-700 bg-slate-800"
                                        : "border-slate-200 bg-slate-50"
                                }`}
                            >

                                <div>

                                    <p
                                        className={`text-sm font-medium ${
                                            darkMode
                                                ? "text-white"
                                                : "text-slate-800"
                                        }`}
                                    >
                                        Renewed
                                    </p>

                                    <p
                                        className={`mt-1 text-xs ${secondaryText}`}
                                    >
                                        Mark this purchase order as renewed.
                                    </p>

                                </div>

                                <input
                                    type="checkbox"
                                    checked={renewed}
                                    onChange={(event) =>
                                        setRenewed(
                                            event.target.checked
                                        )
                                    }
                                    className="h-5 w-5 cursor-pointer"
                                />

                            </div>

                        </div>


                        {/* FOOTER */}

                        <div
                            className={`flex justify-end gap-3 border-t px-6 py-4 ${
                                darkMode
                                    ? "border-slate-700"
                                    : "border-slate-200"
                            }`}
                        >

                            <button
                                type="button"
                                onClick={
                                    closeEditPO
                                }
                                disabled={loading}
                                className={
                                    darkMode
                                        ? "rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                                        : "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleSavePO
                                }
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={16} />

                                {loading
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                        </div>

                    </div>

                </div>

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

                            <div className="mb-4">

                                <h3
                                    className={`text-sm font-semibold ${primaryText}`}
                                >
                                    Renew Support
                                </h3>

                                <p
                                    className={`mt-1 text-xs ${secondaryText}`}
                                >
                                    Current expiry:{" "}
                                    <strong>
                                        {formatDate(
                                            supportExpiryDate
                                        )}
                                    </strong>
                                </p>

                            </div>


                            <div className="grid gap-3 md:grid-cols-3">

                                <div>

                                    <label
                                        className={`mb-1 block text-xs font-medium ${secondaryText}`}
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
                                        onChange={(event) =>
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


                                <div className="md:col-span-2">

                                    <label
                                        className={`mb-1 block text-xs font-medium ${secondaryText}`}
                                    >
                                        Renewal Notes
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            renewalNotes
                                        }
                                        onChange={(event) =>
                                            setRenewalNotes(
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

                            </div>


                            {error && (

                                <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>

                            )}


                            {success && (

                                <div className="mt-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
                                    {success}
                                </div>

                            )}


                            <div className="mt-4 flex flex-wrap gap-2">

                                <button
                                    type="button"
                                    onClick={
                                        handleRenew
                                    }
                                    disabled={loading}
                                    className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                    {loading
                                        ? "Renewing..."
                                        : "Confirm Renewal"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleToggleHistory
                                    }
                                    className={
                                        darkMode
                                            ? "rounded-md bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
                                            : "rounded-md bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                                    }
                                >
                                    {historyExpanded
                                        ? "Hide History"
                                        : "Renewal History"}
                                </button>

                            </div>


                            {historyExpanded && (

                                <div className="mt-4">

                                    {historyLoading ? (

                                        <p
                                            className={`text-xs ${secondaryText}`}
                                        >
                                            Loading renewal history...
                                        </p>

                                    ) : renewalHistory.length ===
                                      0 ? (

                                        <p
                                            className={`text-xs ${secondaryText}`}
                                        >
                                            No renewal history found.
                                        </p>

                                    ) : (

                                        <div className="space-y-2">

                                            {renewalHistory.map(
                                                (
                                                    history,
                                                    index
                                                ) => (

                                                    <div
                                                        key={
                                                            history._id ||
                                                            index
                                                        }
                                                        className={
                                                            darkMode
                                                                ? "rounded-md border border-slate-700 bg-slate-800 p-3"
                                                                : "rounded-md border border-slate-200 bg-slate-50 p-3"
                                                        }
                                                    >

                                                        <div
                                                            className={`grid gap-2 text-xs md:grid-cols-3 ${secondaryText}`}
                                                        >

                                                            <div>
                                                                <span className="font-semibold">
                                                                    Old:
                                                                </span>{" "}
                                                                {formatDate(
                                                                    history.oldExpiryDate
                                                                )}
                                                            </div>

                                                            <div>
                                                                <span className="font-semibold">
                                                                    New:
                                                                </span>{" "}
                                                                {formatDate(
                                                                    history.newExpiryDate
                                                                )}
                                                            </div>

                                                            <div>
                                                                <span className="font-semibold">
                                                                    Updated:
                                                                </span>{" "}
                                                                {formatDate(
                                                                    history.createdAt
                                                                )}
                                                            </div>

                                                        </div>

                                                        {history.notes && (

                                                            <p
                                                                className={`mt-2 text-xs ${secondaryText}`}
                                                            >
                                                                {history.notes}
                                                            </p>

                                                        )}

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>

                    </td>

                </tr>

            )}

        </>
    );
};

export default PurchaseOrderCard;