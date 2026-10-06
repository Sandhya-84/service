import React, { useEffect, useState } from "react";
import {
    Edit3,
    X,
    Save,
    Trash2,
    AlertTriangle
} from "lucide-react";

import {
    updateNetworkUnits
} from "../../api/dashboardApi";

const NetworkUnitsTable = ({
    units = [],
    darkMode = false,
    purchaseOrderId,
    onUnitsUpdated
}) => {

    const [safeUnits, setSafeUnits] = useState(
        Array.isArray(units) ? units : []
    );

    const [selectedIds, setSelectedIds] = useState([]);

    const [editing, setEditing] = useState(false);

    const [editUnits, setEditUnits] = useState([]);

    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | CUSTOM DELETE MODAL
    |--------------------------------------------------------------------------
    */

    const [deleteModal, setDeleteModal] = useState({
        open: false,
        unit: null
    });


    useEffect(() => {

        setSafeUnits(
            Array.isArray(units)
                ? units
                : []
        );

    }, [units]);


    /*
    |--------------------------------------------------------------------------
    | SELECT / UNSELECT
    |--------------------------------------------------------------------------
    */

    const toggleSelection = (id) => {

        setSelectedIds((previous) => {

            if (previous.includes(id)) {

                return previous.filter(
                    (item) => item !== id
                );

            }

            return [
                ...previous,
                id
            ];

        });

    };


    /*
    |--------------------------------------------------------------------------
    | SELECT ALL
    |--------------------------------------------------------------------------
    */

    const toggleSelectAll = () => {

        if (
            selectedIds.length ===
            safeUnits.length
        ) {

            setSelectedIds([]);

        } else {

            setSelectedIds(
                safeUnits.map(
                    (unit) => unit._id
                )
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | START EDIT
    |--------------------------------------------------------------------------
    */

    const startEditing = () => {

        const selectedUnits =
            safeUnits.filter(
                (unit) =>
                    selectedIds.includes(
                        unit._id
                    )
            );

        setEditUnits(
            selectedUnits.map(
                (unit) => ({
                    ...unit
                })
            )
        );

        setEditing(true);

    };


    /*
    |--------------------------------------------------------------------------
    | CANCEL EDIT
    |--------------------------------------------------------------------------
    */

    const cancelEditing = () => {

        setEditing(false);

        setEditUnits([]);

    };


    /*
    |--------------------------------------------------------------------------
    | UPDATE EDIT FIELD
    |--------------------------------------------------------------------------
    */

    const updateEditField = (
        id,
        field,
        value
    ) => {

        setEditUnits(
            (previous) =>
                previous.map(
                    (unit) =>
                        unit._id === id
                            ? {
                                ...unit,
                                [field]:
                                    value
                            }
                            : unit
                )
        );

    };


    /*
    |--------------------------------------------------------------------------
    | SAVE EDIT
    |--------------------------------------------------------------------------
    */

    const saveChanges = async () => {

        if (
            !purchaseOrderId ||
            editUnits.length === 0
        ) {
            return;
        }

        try {

            setSaving(true);

            const response =
                await updateNetworkUnits(
                    purchaseOrderId,
                    editUnits
                );

            const updatedUnits =
                response?.units ||
                response?.networkUnits ||
                editUnits;

            setSafeUnits(
                Array.isArray(updatedUnits)
                    ? updatedUnits
                    : safeUnits
            );

            setSelectedIds([]);

            setEditing(false);

            setEditUnits([]);

            if (onUnitsUpdated) {

                onUnitsUpdated(
                    updatedUnits
                );

            }

        } catch (error) {

            console.error(
                "Failed to update network units:",
                error
            );

            alert(
                error?.response?.data?.message ||
                "Failed to update network units"
            );

        } finally {

            setSaving(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | OPEN DELETE MODAL
    |--------------------------------------------------------------------------
    */

    const openDeleteModal = (unit) => {

        setDeleteModal({
            open: true,
            unit
        });

    };


    /*
    |--------------------------------------------------------------------------
    | CLOSE DELETE MODAL
    |--------------------------------------------------------------------------
    */

    const closeDeleteModal = () => {

        if (deletingId) {
            return;
        }

        setDeleteModal({
            open: false,
            unit: null
        });

    };


    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    const deleteUnit = async () => {

        const unit =
            deleteModal.unit;

        if (!unit?._id) {
            return;
        }

        try {

            setDeletingId(
                unit._id
            );

            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await fetch(
                    `http://localhost:5000/api/network-units/${unit._id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Failed to delete network unit"
                );

            }


            /*
            |--------------------------------------------------------------------------
            | REMOVE FROM TABLE
            |--------------------------------------------------------------------------
            */

            const updatedUnits =
                safeUnits.filter(
                    (item) =>
                        item._id !==
                        unit._id
                );

            setSafeUnits(
                updatedUnits
            );


            /*
            |--------------------------------------------------------------------------
            | REMOVE FROM SELECTION
            |--------------------------------------------------------------------------
            */

            setSelectedIds(
                (previous) =>
                    previous.filter(
                        (id) =>
                            id !== unit._id
                    )
            );


            /*
            |--------------------------------------------------------------------------
            | CLOSE MODAL
            |--------------------------------------------------------------------------
            */

            setDeleteModal({
                open: false,
                unit: null
            });


            /*
            |--------------------------------------------------------------------------
            | INFORM PARENT
            |--------------------------------------------------------------------------
            */

            if (onUnitsUpdated) {

                onUnitsUpdated(
                    updatedUnits
                );

            }

        } catch (error) {

            console.error(
                "Delete unit error:",
                error
            );

            alert(
                error?.message ||
                "Failed to delete network unit"
            );

        } finally {

            setDeletingId(null);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE
    |--------------------------------------------------------------------------
    */

    if (safeUnits.length === 0) {

        return (
            <div
                className={`rounded-lg border p-5 text-center ${
                    darkMode
                        ? "border-slate-700 text-slate-400"
                        : "border-slate-200 text-slate-500"
                }`}
            >
                No network units found.
            </div>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | EDIT MODE
    |--------------------------------------------------------------------------
    */

    if (editing) {

        return (
            <div
                className={`rounded-xl border ${
                    darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-white"
                }`}
            >

                {/* EDIT HEADER */}

                <div
                    className={`flex items-center justify-between border-b px-4 py-3 ${
                        darkMode
                            ? "border-slate-700"
                            : "border-slate-200"
                    }`}
                >

                    <div>

                        <h3
                            className={
                                darkMode
                                    ? "text-sm font-semibold text-white"
                                    : "text-sm font-semibold text-slate-900"
                            }
                        >
                            Edit Selected Units
                        </h3>

                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-xs text-slate-400"
                                    : "mt-1 text-xs text-slate-500"
                            }
                        >
                            {editUnits.length} unit
                            {editUnits.length !== 1
                                ? "s"
                                : ""} selected
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <X size={18} />
                    </button>

                </div>


                {/* EDIT FIELDS */}

                <div className="space-y-4 p-4">

                    {editUnits.map(
                        (unit) => (

                            <div
                                key={unit._id}
                                className={`rounded-lg border p-4 ${
                                    darkMode
                                        ? "border-slate-700 bg-slate-900"
                                        : "border-slate-200 bg-slate-50"
                                }`}
                            >

                                <div
                                    className={
                                        darkMode
                                            ? "mb-3 text-xs font-semibold text-blue-300"
                                            : "mb-3 text-xs font-semibold text-blue-600"
                                    }
                                >
                                    {unit.unitCode ||
                                        "Network Unit"}
                                </div>


                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                    {/* UNIT CODE */}

                                    <div>

                                        <label
                                            className={
                                                darkMode
                                                    ? "mb-1 block text-xs text-slate-400"
                                                    : "mb-1 block text-xs text-slate-600"
                                            }
                                        >
                                            Unit Code
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                unit.unitCode ||
                                                ""
                                            }
                                            onChange={(event) =>
                                                updateEditField(
                                                    unit._id,
                                                    "unitCode",
                                                    event.target.value
                                                )
                                            }
                                            className={
                                                darkMode
                                                    ? "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                    : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                                            }
                                        />

                                    </div>


                                    {/* HOSTNAME */}

                                    <div>

                                        <label
                                            className={
                                                darkMode
                                                    ? "mb-1 block text-xs text-slate-400"
                                                    : "mb-1 block text-xs text-slate-600"
                                            }
                                        >
                                            Hostname
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                unit.hostname ||
                                                ""
                                            }
                                            onChange={(event) =>
                                                updateEditField(
                                                    unit._id,
                                                    "hostname",
                                                    event.target.value
                                                )
                                            }
                                            className={
                                                darkMode
                                                    ? "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                    : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                                            }
                                        />

                                    </div>


                                    {/* RADIO CONFIGURATION */}

                                    <div>

                                        <label
                                            className={
                                                darkMode
                                                    ? "mb-1 block text-xs text-slate-400"
                                                    : "mb-1 block text-xs text-slate-600"
                                            }
                                        >
                                            Radio Configuration
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                unit.radioConfiguration ||
                                                ""
                                            }
                                            onChange={(event) =>
                                                updateEditField(
                                                    unit._id,
                                                    "radioConfiguration",
                                                    event.target.value
                                                )
                                            }
                                            className={
                                                darkMode
                                                    ? "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                    : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                                            }
                                        />

                                    </div>

                                </div>

                            </div>

                        )
                    )}

                </div>


                {/* EDIT ACTIONS */}

                <div
                    className={`flex justify-end gap-2 border-t px-4 py-3 ${
                        darkMode
                            ? "border-slate-700"
                            : "border-slate-200"
                    }`}
                >

                    <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                                : "rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        }
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onClick={saveChanges}
                        disabled={
                            saving ||
                            editUnits.length === 0
                        }
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <Save size={16} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"}

                    </button>

                </div>

            </div>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | NORMAL TABLE
    |--------------------------------------------------------------------------
    */

    const allSelected =
        safeUnits.length > 0 &&
        selectedIds.length ===
            safeUnits.length;


    return (
        <>
            <div
                className={`rounded-xl border ${
                    darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-white"
                }`}
            >

                {/* HEADER */}

                <div
                    className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${
                        darkMode
                            ? "border-slate-700"
                            : "border-slate-200"
                    }`}
                >

                    <div>

                        <h3
                            className={
                                darkMode
                                    ? "text-sm font-semibold text-white"
                                    : "text-sm font-semibold text-slate-900"
                            }
                        >
                            Network Units
                        </h3>

                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-xs text-slate-400"
                                    : "mt-1 text-xs text-slate-500"
                            }
                        >
                            {safeUnits.length} unit
                            {safeUnits.length !== 1
                                ? "s"
                                : ""}
                        </p>

                    </div>


                    {/* EDIT SELECTED */}

                    <button
                        type="button"
                        onClick={startEditing}
                        disabled={
                            selectedIds.length ===
                            0
                        }
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                        <Edit3 size={16} />

                        Edit Selected

                        {selectedIds.length >
                            0 && (
                            <span>
                                ({selectedIds.length})
                            </span>
                        )}

                    </button>

                </div>


                {/* TABLE */}

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                        <thead
                            className={
                                darkMode
                                    ? "bg-slate-800"
                                    : "bg-slate-50"
                            }
                        >

                            <tr>

                                <th className="w-12 px-4 py-3 text-center">

                                    <input
                                        type="checkbox"
                                        checked={
                                            allSelected
                                        }
                                        onChange={
                                            toggleSelectAll
                                        }
                                        className="h-4 w-4 cursor-pointer accent-blue-600"
                                    />

                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-4 py-3 text-left text-sm font-semibold text-slate-300"
                                            : "px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                    }
                                >
                                    Unit
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-4 py-3 text-left text-sm font-semibold text-slate-300"
                                            : "px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                    }
                                >
                                    Hostname
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-4 py-3 text-left text-sm font-semibold text-slate-300"
                                            : "px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                    }
                                >
                                    Radio Configuration
                                </th>


                                <th
                                    className={
                                        darkMode
                                            ? "px-4 py-3 text-center text-sm font-semibold text-slate-300"
                                            : "px-4 py-3 text-center text-sm font-semibold text-slate-700"
                                    }
                                >
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {safeUnits.map(
                                (unit) => {

                                    const selected =
                                        selectedIds.includes(
                                            unit._id
                                        );

                                    const deleting =
                                        deletingId ===
                                        unit._id;

                                    return (

                                        <tr
                                            key={
                                                unit._id
                                            }
                                            className={
                                                selected
                                                    ? darkMode
                                                        ? "border-t border-slate-700 bg-blue-950/30"
                                                        : "border-t border-slate-200 bg-blue-50"
                                                    : darkMode
                                                        ? "border-t border-slate-700"
                                                        : "border-t border-slate-200"
                                            }
                                        >

                                            {/* CHECKBOX */}

                                            <td className="px-4 py-3 text-center">

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selected
                                                    }
                                                    onChange={() =>
                                                        toggleSelection(
                                                            unit._id
                                                        )
                                                    }
                                                    className="h-4 w-4 cursor-pointer accent-blue-600"
                                                />

                                            </td>


                                            {/* UNIT */}

                                            <td
                                                className={
                                                    darkMode
                                                        ? "px-4 py-3 text-sm font-medium text-white"
                                                        : "px-4 py-3 text-sm font-medium text-slate-900"
                                                }
                                            >
                                                {unit.unitCode ||
                                                    "-"}
                                            </td>


                                            {/* HOSTNAME */}

                                            <td
                                                className={
                                                    darkMode
                                                        ? "px-4 py-3 text-sm text-slate-300"
                                                        : "px-4 py-3 text-sm text-slate-700"
                                                }
                                            >
                                                {unit.hostname ||
                                                    "-"}
                                            </td>


                                            {/* RADIO */}

                                            <td
                                                className={
                                                    darkMode
                                                        ? "px-4 py-3 text-sm text-slate-300"
                                                        : "px-4 py-3 text-sm text-slate-700"
                                                }
                                            >
                                                {unit.radioConfiguration ||
                                                    "-"}
                                            </td>


                                            {/* DELETE */}

                                            <td className="px-4 py-3 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            unit
                                                        )
                                                    }
                                                    disabled={
                                                        deleting
                                                    }
                                                    title="Delete unit"
                                                    className="inline-flex items-center justify-center rounded-lg p-2 text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                                                >

                                                    <Trash2
                                                        size={17}
                                                    />

                                                </button>

                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* ========================================================== */}
            {/* CUSTOM DELETE CONFIRMATION MODAL */}
            {/* ========================================================== */}

            {deleteModal.open &&
                deleteModal.unit && (

                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeDeleteModal();
                            }

                        }}
                    >

                        <div
                            className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${
                                darkMode
                                    ? "border-slate-700 bg-slate-900"
                                    : "border-slate-200 bg-white"
                            }`}
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >

                            {/* MODAL TOP */}

                            <div className="flex items-start gap-4 px-6 pt-6">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-950">

                                    <AlertTriangle
                                        size={22}
                                        className="text-red-400"
                                    />

                                </div>


                                <div className="min-w-0 flex-1">

                                    <h2
                                        className={
                                            darkMode
                                                ? "text-lg font-semibold text-white"
                                                : "text-lg font-semibold text-slate-900"
                                        }
                                    >
                                        Delete Network Unit?
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={
                                            closeDeleteModal
                                        }
                                        disabled={
                                            Boolean(
                                                deletingId
                                            )
                                        }
                                        className="absolute mr-6 mt-[-34px] right-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>

                                </div>

                            </div>


                            {/* MESSAGE */}

                            <div className="px-6 pb-2 pt-4">

                                <p
                                    className={
                                        darkMode
                                            ? "text-sm leading-6 text-slate-300"
                                            : "text-sm leading-6 text-slate-600"
                                    }
                                >
                                    Are you sure you want to
                                    delete this network unit?
                                    This action cannot be
                                    undone.
                                </p>


                                {/* UNIT INFO */}

                                <div
                                    className={
                                        darkMode
                                            ? "mt-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                                            : "mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                    }
                                >

                                    <p
                                        className={
                                            darkMode
                                                ? "text-sm font-semibold text-white"
                                                : "text-sm font-semibold text-slate-900"
                                        }
                                    >
                                        {deleteModal.unit.unitCode ||
                                            "Unknown Unit"}
                                    </p>

                                    {deleteModal.unit.hostname && (

                                        <p
                                            className={
                                                darkMode
                                                    ? "mt-1 text-xs text-slate-400"
                                                    : "mt-1 text-xs text-slate-500"
                                            }
                                        >
                                            {deleteModal.unit.hostname}
                                        </p>

                                    )}

                                </div>

                            </div>


                            {/* BUTTONS */}

                            <div
                                className={`mt-5 flex justify-end gap-3 border-t px-6 py-4 ${
                                    darkMode
                                        ? "border-slate-700 bg-slate-950/50"
                                        : "border-slate-200 bg-slate-50"
                                }`}
                            >

                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        Boolean(
                                            deletingId
                                        )
                                    }
                                    className={
                                        darkMode
                                            ? "rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                                            : "rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white disabled:opacity-50"
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        deleteUnit
                                    }
                                    disabled={
                                        Boolean(
                                            deletingId
                                        )
                                    }
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    <Trash2
                                        size={16}
                                    />

                                    {deletingId
                                        ? "Deleting..."
                                        : "Delete Unit"}

                                </button>

                            </div>

                        </div>

                    </div>

                )}

        </>
    );
};

export default NetworkUnitsTable;