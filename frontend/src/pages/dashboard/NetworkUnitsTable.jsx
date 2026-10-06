import React, {
    useEffect,
    useState
} from "react";

import {
    Edit3,
    X,
    Save,
    Trash2,
    AlertTriangle
} from "lucide-react";

import {
    updateNetworkUnits,
    deleteNetworkUnit
} from "../../api/dashboardApi";


const NetworkUnitsTable = ({
    units = [],
    darkMode = false,
    purchaseOrderId,
    onUnitsUpdated,
    customerName = "",
    poNumber = ""
}) => {

    const [selectedUnits, setSelectedUnits] =
        useState([]);

    const [editOpen, setEditOpen] =
        useState(false);

    const [editingUnits, setEditingUnits] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [deleteOpen, setDeleteOpen] =
        useState(false);

    const [unitToDelete, setUnitToDelete] =
        useState(null);


    // =====================================================
    // KEEP SELECTED IDS VALID
    // =====================================================

    useEffect(() => {

        const existingIds = new Set(
            units.map((unit) =>
                String(unit._id)
            )
        );

        setSelectedUnits((previous) =>
            previous.filter((id) =>
                existingIds.has(
                    String(id)
                )
            )
        );

    }, [units]);


    // =====================================================
    // SELECT / UNSELECT
    // =====================================================

    const toggleUnit = (unitId) => {

        const id = String(unitId);

        setSelectedUnits((previous) => {

            if (previous.includes(id)) {

                return previous.filter(
                    (selectedId) =>
                        selectedId !== id
                );

            }

            return [
                ...previous,
                id
            ];
        });
    };


    const toggleSelectAll = () => {

        if (
            units.length > 0 &&
            selectedUnits.length ===
                units.length
        ) {
            setSelectedUnits([]);

            return;
        }

        setSelectedUnits(
            units.map((unit) =>
                String(unit._id)
            )
        );
    };


    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = () => {

        setError("");
        setSuccess("");

        const selected =
            units
                .filter((unit) =>
                    selectedUnits.includes(
                        String(unit._id)
                    )
                )
                .map((unit) => ({
                    _id: unit._id,

                    unitCode:
                        unit.unitCode || "",

                    hostname:
                        unit.hostname || "",

                    radioConfiguration:
                        unit.radioConfiguration ||
                        ""
                }));

        if (selected.length === 0) {

            setError(
                "Please select at least one network unit."
            );

            return;
        }

        setEditingUnits(selected);

        setEditOpen(true);
    };


    // =====================================================
    // CLOSE EDIT MODAL
    // =====================================================

    const closeEditModal = () => {

        if (loading) {
            return;
        }

        setEditOpen(false);

        setEditingUnits([]);

        setError("");
    };


    // =====================================================
    // CHANGE EDIT FIELD
    // =====================================================

    const handleFieldChange = (
        index,
        field,
        value
    ) => {

        setEditingUnits(
            (previous) =>
                previous.map(
                    (unit, unitIndex) =>
                        unitIndex === index
                            ? {
                                ...unit,
                                [field]:
                                    value
                            }
                            : unit
                )
        );
    };


    // =====================================================
    // SAVE EDITED UNITS
    // =====================================================

    const handleSave = async () => {

        if (!purchaseOrderId) {

            setError(
                "Purchase order ID is missing."
            );

            return;
        }

        if (
            editingUnits.length === 0
        ) {

            setError(
                "Please select at least one unit."
            );

            return;
        }

        for (
            const unit of editingUnits
        ) {

            if (
                !unit.unitCode ||
                !unit.unitCode.trim()
            ) {

                setError(
                    "Unit Code cannot be empty."
                );

                return;
            }
        }

        try {

            setLoading(true);

            setError("");

            setSuccess("");

            const response =
                await updateNetworkUnits(
                    purchaseOrderId,
                    editingUnits
                );

            const updatedUnits =
                response?.units || [];

            if (onUnitsUpdated) {

                onUnitsUpdated(
                    updatedUnits
                );
            }

            setSelectedUnits([]);

            setEditOpen(false);

            setEditingUnits([]);

            setSuccess(
                "Selected network units updated successfully."
            );

            setTimeout(() => {

                setSuccess("");

            }, 3000);

        } catch (err) {

            console.error(
                "Update network units error:",
                err
            );

            const message =
                err?.response?.data
                    ?.message ||
                "Failed to update network units.";

            setError(message);

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // OPEN DELETE CONFIRMATION
    // =====================================================

    const openDeleteModal = (unit) => {

        setError("");

        setSuccess("");

        setUnitToDelete(unit);

        setDeleteOpen(true);
    };


    // =====================================================
    // CLOSE DELETE MODAL
    // =====================================================

    const closeDeleteModal = () => {

        if (loading) {
            return;
        }

        setDeleteOpen(false);

        setUnitToDelete(null);
    };


    // =====================================================
    // DELETE UNIT
    // =====================================================

    const handleDelete = async () => {

        if (!unitToDelete?._id) {
            return;
        }

        try {

            setLoading(true);

            setError("");

            setSuccess("");

            await deleteNetworkUnit(
                unitToDelete._id
            );

            const updatedUnits =
                units.filter(
                    (unit) =>
                        String(unit._id) !==
                        String(
                            unitToDelete._id
                        )
                );

            if (onUnitsUpdated) {

                onUnitsUpdated(
                    updatedUnits
                );
            }

            setSelectedUnits(
                (previous) =>
                    previous.filter(
                        (id) =>
                            String(id) !==
                            String(
                                unitToDelete._id
                            )
                    )
            );

            setDeleteOpen(false);

            setUnitToDelete(null);

            setSuccess(
                `Network unit ${
                    unitToDelete.unitCode ||
                    ""
                } deleted successfully.`
            );

            setTimeout(() => {

                setSuccess("");

            }, 3000);

        } catch (err) {

            console.error(
                "Delete network unit error:",
                err
            );

            const message =
                err?.response?.data
                    ?.message ||
                "Failed to delete network unit.";

            setError(message);

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // INPUT CLASS
    // =====================================================

    const inputClass = `
        w-full
        rounded-lg
        border
        px-3
        py-2
        text-sm
        outline-none
        transition
        ${
            darkMode
                ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                : "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500"
        }
    `;


    return (

        <div className="w-full">

            {/* ================================================= */}
            {/* TOOLBAR */}
            {/* ================================================= */}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

                <div>

                    <h3
                        className={`text-base font-semibold ${
                            darkMode
                                ? "text-white"
                                : "text-slate-800"
                        }`}
                    >
                        Network Units
                    </h3>

                    <p
                        className={`text-xs mt-1 ${
                            darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                        }`}
                    >
                        {units.length} unit
                        {units.length !== 1
                            ? "s"
                            : ""}{" "}
                        available
                    </p>

                </div>


                <button
                    type="button"
                    onClick={
                        openEditModal
                    }
                    disabled={
                        selectedUnits.length ===
                            0 ||
                        loading
                    }
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedUnits.length ===
                            0 ||
                        loading
                            ? darkMode
                                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >

                    <Edit3 size={16} />

                    Edit Selected

                    {selectedUnits.length >
                        0 &&
                        ` (${selectedUnits.length})`}

                </button>

            </div>


            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && !editOpen && !deleteOpen && (

                <div
                    className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                        darkMode
                            ? "border-red-800 bg-red-950 text-red-300"
                            : "border-red-300 bg-red-50 text-red-700"
                    }`}
                >
                    {error}
                </div>

            )}


            {/* ================================================= */}
            {/* SUCCESS */}
            {/* ================================================= */}

            {success && (

                <div
                    className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                        darkMode
                            ? "border-green-800 bg-green-950 text-green-300"
                            : "border-green-300 bg-green-50 text-green-700"
                    }`}
                >
                    {success}
                </div>

            )}


            {/* ================================================= */}
            {/* EMPTY STATE */}
            {/* ================================================= */}

            {units.length === 0 ? (

                <div
                    className={`rounded-lg border p-6 text-center ${
                        darkMode
                            ? "border-slate-700 bg-slate-800 text-slate-400"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                >
                    No network units found for this purchase order.
                </div>

            ) : (

                <div
                    className={`overflow-x-auto rounded-lg border ${
                        darkMode
                            ? "border-slate-700"
                            : "border-slate-200"
                    }`}
                >

                    <table className="w-full text-sm">

                        <thead
                            className={
                                darkMode
                                    ? "bg-slate-800"
                                    : "bg-slate-50"
                            }
                        >

                            <tr>

                                <th className="px-4 py-3 text-left w-12">

                                    <input
                                        type="checkbox"
                                        checked={
                                            units.length >
                                                0 &&
                                            selectedUnits.length ===
                                                units.length
                                        }
                                        onChange={
                                            toggleSelectAll
                                        }
                                        className="h-4 w-4 cursor-pointer"
                                    />

                                </th>


                                <th
                                    className={`px-4 py-3 text-left font-semibold ${
                                        darkMode
                                            ? "text-slate-200"
                                            : "text-slate-700"
                                    }`}
                                >
                                    Unit Code
                                </th>


                                <th
                                    className={`px-4 py-3 text-left font-semibold ${
                                        darkMode
                                            ? "text-slate-200"
                                            : "text-slate-700"
                                    }`}
                                >
                                    Hostname
                                </th>


                                <th
                                    className={`px-4 py-3 text-left font-semibold ${
                                        darkMode
                                            ? "text-slate-200"
                                            : "text-slate-700"
                                    }`}
                                >
                                    Radio Configuration
                                </th>


                                <th
                                    className={`px-4 py-3 text-center font-semibold ${
                                        darkMode
                                            ? "text-slate-200"
                                            : "text-slate-700"
                                    }`}
                                >
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {units.map(
                                (unit) => {

                                    const unitId =
                                        String(
                                            unit._id
                                        );

                                    const isSelected =
                                        selectedUnits.includes(
                                            unitId
                                        );

                                    return (

                                        <tr
                                            key={
                                                unit._id
                                            }
                                            className={`border-t ${
                                                darkMode
                                                    ? "border-slate-700 hover:bg-slate-800/70"
                                                    : "border-slate-200 hover:bg-slate-50"
                                            } ${
                                                isSelected
                                                    ? darkMode
                                                        ? "bg-blue-950/40"
                                                        : "bg-blue-50"
                                                    : ""
                                            }`}
                                        >

                                            <td className="px-4 py-3">

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        isSelected
                                                    }
                                                    onChange={() =>
                                                        toggleUnit(
                                                            unit._id
                                                        )
                                                    }
                                                    className="h-4 w-4 cursor-pointer"
                                                />

                                            </td>


                                            <td
                                                className={`px-4 py-3 font-medium ${
                                                    darkMode
                                                        ? "text-white"
                                                        : "text-slate-800"
                                                }`}
                                            >
                                                {
                                                    unit.unitCode ||
                                                    "—"
                                                }
                                            </td>


                                            <td
                                                className={`px-4 py-3 ${
                                                    darkMode
                                                        ? "text-slate-300"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {
                                                    unit.hostname ||
                                                    "—"
                                                }
                                            </td>


                                            <td
                                                className={`px-4 py-3 ${
                                                    darkMode
                                                        ? "text-slate-300"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {
                                                    unit.radioConfiguration ||
                                                    "—"
                                                }
                                            </td>


                                            <td className="px-4 py-3 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            unit
                                                        )
                                                    }
                                                    disabled={
                                                        loading
                                                    }
                                                    className={`inline-flex items-center justify-center rounded-lg p-2 transition ${
                                                        loading
                                                            ? "cursor-not-allowed opacity-50"
                                                            : darkMode
                                                                ? "text-red-400 hover:bg-red-950 hover:text-red-300"
                                                                : "text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    }`}
                                                    title="Delete unit"
                                                >

                                                    <Trash2
                                                        size={
                                                            17
                                                        }
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

            )}


            {/* ================================================= */}
            {/* EDIT MODAL */}
            {/* ================================================= */}

            {editOpen && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                >

                    <div
                        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                            darkMode
                                ? "bg-slate-900 border border-slate-700"
                                : "bg-white border border-slate-200"
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
                                    className={`text-lg font-bold ${
                                        darkMode
                                            ? "text-white"
                                            : "text-slate-900"
                                    }`}
                                >
                                    Edit Selected Network Units
                                </h2>

                                <p
                                    className={`mt-1 text-xs ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }`}
                                >
                                    {editingUnits.length} selected unit
                                    {editingUnits.length !==
                                        1
                                        ? "s"
                                        : ""}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeEditModal
                                }
                                disabled={
                                    loading
                                }
                                className={`rounded-lg p-2 ${
                                    darkMode
                                        ? "text-slate-400 hover:bg-slate-800"
                                        : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >

                                <X size={20} />

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="space-y-5 p-6">

                            {error && (

                                <div
                                    className={`rounded-lg border px-4 py-3 text-sm ${
                                        darkMode
                                            ? "border-red-800 bg-red-950 text-red-300"
                                            : "border-red-300 bg-red-50 text-red-700"
                                    }`}
                                >
                                    {error}
                                </div>

                            )}


                            {editingUnits.map(
                                (
                                    unit,
                                    index
                                ) => (

                                    <div
                                        key={
                                            unit._id
                                        }
                                        className={`rounded-xl border p-5 ${
                                            darkMode
                                                ? "border-slate-700 bg-slate-800/60"
                                                : "border-slate-200 bg-slate-50"
                                        }`}
                                    >

                                        <div className="mb-4 flex items-center justify-between">

                                            <h3
                                                className={`font-semibold ${
                                                    darkMode
                                                        ? "text-white"
                                                        : "text-slate-800"
                                                }`}
                                            >
                                                Unit{" "}
                                                {index +
                                                    1}
                                            </h3>

                                            <span
                                                className={`text-xs ${
                                                    darkMode
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                ID:{" "}
                                                {String(
                                                    unit._id
                                                )}
                                            </span>

                                        </div>


                                        <div className="grid gap-4 md:grid-cols-3">

                                            <div>

                                                <label
                                                    className={`mb-1 block text-sm font-medium ${
                                                        darkMode
                                                            ? "text-slate-300"
                                                            : "text-slate-700"
                                                    }`}
                                                >
                                                    Unit Code
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        unit.unitCode
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleFieldChange(
                                                            index,
                                                            "unitCode",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                />

                                            </div>


                                            <div>

                                                <label
                                                    className={`mb-1 block text-sm font-medium ${
                                                        darkMode
                                                            ? "text-slate-300"
                                                            : "text-slate-700"
                                                    }`}
                                                >
                                                    Hostname
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        unit.hostname
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleFieldChange(
                                                            index,
                                                            "hostname",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                />

                                            </div>


                                            <div>

                                                <label
                                                    className={`mb-1 block text-sm font-medium ${
                                                        darkMode
                                                            ? "text-slate-300"
                                                            : "text-slate-700"
                                                    }`}
                                                >
                                                    Radio Configuration
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        unit.radioConfiguration
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleFieldChange(
                                                            index,
                                                            "radioConfiguration",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                />

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

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
                                    closeEditModal
                                }
                                disabled={
                                    loading
                                }
                                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                                    darkMode
                                        ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={
                                    handleSave
                                }
                                disabled={
                                    loading
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                <Save
                                    size={16}
                                />

                                {loading
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ================================================= */}
            {/* DELETE CONFIRMATION MODAL */}
            {/* ================================================= */}

            {deleteOpen && unitToDelete && (

                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                >

                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl ${
                            darkMode
                                ? "border border-slate-700 bg-slate-900"
                                : "border border-slate-200 bg-white"
                        }`}
                    >

                        <div className="p-6">

                            <div className="flex items-start gap-4">

                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                                        darkMode
                                            ? "bg-red-950 text-red-400"
                                            : "bg-red-100 text-red-600"
                                    }`}
                                >

                                    <AlertTriangle
                                        size={22}
                                    />

                                </div>


                                <div>

                                    <h2
                                        className={`text-lg font-bold ${
                                            darkMode
                                                ? "text-white"
                                                : "text-slate-900"
                                        }`}
                                    >
                                        Delete Network Unit?
                                    </h2>

                                    <p
                                        className={`mt-2 text-sm leading-6 ${
                                            darkMode
                                                ? "text-slate-400"
                                                : "text-slate-600"
                                        }`}
                                    >
                                        Are you sure you want to delete this network unit?
                                        This action cannot be undone.
                                    </p>

                                </div>

                            </div>


                            <div
                                className={`mt-5 rounded-lg border p-4 ${
                                    darkMode
                                        ? "border-slate-700 bg-slate-800"
                                        : "border-slate-200 bg-slate-50"
                                }`}
                            >

                                <p
                                    className={`text-xs font-medium uppercase tracking-wide ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }`}
                                >
                                    Unit Code
                                </p>

                                <p
                                    className={`mt-1 font-semibold ${
                                        darkMode
                                            ? "text-white"
                                            : "text-slate-800"
                                    }`}
                                >
                                    {
                                        unitToDelete.unitCode ||
                                        "—"
                                    }
                                </p>


                                {unitToDelete.hostname && (

                                    <>

                                        <p
                                            className={`mt-3 text-xs font-medium uppercase tracking-wide ${
                                                darkMode
                                                    ? "text-slate-400"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            Hostname
                                        </p>

                                        <p
                                            className={`mt-1 text-sm ${
                                                darkMode
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {
                                                unitToDelete.hostname
                                            }
                                        </p>

                                    </>

                                )}

                            </div>


                            <div className="mt-6 flex justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        loading
                                    }
                                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                                        darkMode
                                            ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    <Trash2
                                        size={16}
                                    />

                                    {loading
                                        ? "Deleting..."
                                        : "Delete Unit"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};


export default NetworkUnitsTable;