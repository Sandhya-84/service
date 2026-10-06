import React, { useEffect, useState } from "react";
import { Edit3, X, Save } from "lucide-react";
import { updateNetworkUnits } from "../../api/dashboardApi";

const NetworkUnitsTable = ({
    units = [],
    darkMode,
    purchaseOrderId,
    onUnitsUpdated,
}) => {
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [editOpen, setEditOpen] = useState(false);
    const [editingUnits, setEditingUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const existingIds = new Set(
            units.map((unit) => String(unit._id))
        );

        setSelectedUnits((previous) =>
            previous.filter((id) =>
                existingIds.has(String(id))
            )
        );
    }, [units]);

    const toggleUnit = (unitId) => {
        const id = String(unitId);

        setSelectedUnits((previous) => {
            if (previous.includes(id)) {
                return previous.filter(
                    (selectedId) => selectedId !== id
                );
            }

            return [...previous, id];
        });
    };

    const toggleSelectAll = () => {
        if (selectedUnits.length === units.length) {
            setSelectedUnits([]);
            return;
        }

        setSelectedUnits(
            units.map((unit) => String(unit._id))
        );
    };

    const openEditModal = () => {
        if (selectedUnits.length === 0) {
            setError("Please select at least one unit.");
            return;
        }

        setError("");
        setSuccess("");

        const selected = units
            .filter((unit) =>
                selectedUnits.includes(String(unit._id))
            )
            .map((unit) => ({
                _id: unit._id,
                unitCode: unit.unitCode || "",
                hostname: unit.hostname || "",
                radioConfiguration:
                    unit.radioConfiguration || "",
            }));

        setEditingUnits(selected);
        setEditOpen(true);
    };

    const closeEditModal = () => {
        if (loading) return;

        setEditOpen(false);
        setEditingUnits([]);
        setError("");
    };

    const handleFieldChange = (
        index,
        field,
        value
    ) => {
        setEditingUnits((previous) =>
            previous.map((unit, unitIndex) =>
                unitIndex === index
                    ? {
                          ...unit,
                          [field]: value,
                      }
                    : unit
            )
        );
    };

    const handleSave = async () => {
        if (!purchaseOrderId) {
            setError("Purchase order ID is missing.");
            return;
        }

        if (editingUnits.length === 0) {
            setError("Please select at least one unit.");
            return;
        }

        for (const unit of editingUnits) {
            if (!unit.unitCode.trim()) {
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
                onUnitsUpdated(updatedUnits);
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

            setError(
                err?.response?.data?.message ||
                "Failed to update network units."
            );
        } finally {
            setLoading(false);
        }
    };

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

            {/* TOOLBAR */}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

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
                        className={`mt-1 text-xs ${
                            darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                        }`}
                    >
                        {units.length} unit
                        {units.length !== 1 ? "s" : ""} available
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openEditModal}
                    disabled={
                        selectedUnits.length === 0 ||
                        loading
                    }
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        selectedUnits.length === 0 ||
                        loading
                            ? darkMode
                                ? "cursor-not-allowed bg-slate-700 text-slate-500"
                                : "cursor-not-allowed bg-slate-200 text-slate-400"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    <Edit3 size={16} />

                    Edit Selected

                    {selectedUnits.length > 0 &&
                        ` (${selectedUnits.length})`}
                </button>
            </div>

            {/* SUCCESS */}

            {success && (
                <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            {/* ERROR */}

            {error && !editOpen && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* EMPTY */}

            {units.length === 0 ? (
                <div
                    className={`rounded-lg border p-6 text-center ${
                        darkMode
                            ? "border-slate-700 bg-slate-800 text-slate-400"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                >
                    No network units found for this purchase
                    order.
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

                                {/* SELECT ALL */}

                                <th className="w-12 px-4 py-3 text-left">

                                    <input
                                        type="checkbox"
                                        checked={
                                            units.length > 0 &&
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

                            </tr>
                        </thead>

                        <tbody>

                            {units.map((unit) => {

                                const unitId =
                                    String(unit._id);

                                const isSelected =
                                    selectedUnits.includes(
                                        unitId
                                    );

                                return (
                                    <tr
                                        key={unit._id}
                                        className={`border-t ${
                                            darkMode
                                                ? "border-slate-700"
                                                : "border-slate-200"
                                        } ${
                                            isSelected
                                                ? darkMode
                                                    ? "bg-blue-950/40"
                                                    : "bg-blue-50"
                                                : darkMode
                                                    ? "hover:bg-slate-800/70"
                                                    : "hover:bg-slate-50"
                                        }`}
                                    >

                                        {/* CHECKBOX */}

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

                                        {/* UNIT CODE */}

                                        <td
                                            className={`px-4 py-3 font-medium ${
                                                darkMode
                                                    ? "text-white"
                                                    : "text-slate-800"
                                            }`}
                                        >
                                            {unit.unitCode ||
                                                "-"}
                                        </td>

                                        {/* HOSTNAME */}

                                        <td
                                            className={`px-4 py-3 ${
                                                darkMode
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {unit.hostname ||
                                                "-"}
                                        </td>

                                        {/* RADIO */}

                                        <td
                                            className={`px-4 py-3 ${
                                                darkMode
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {unit.radioConfiguration ||
                                                "-"}
                                        </td>

                                    </tr>
                                );
                            })}

                        </tbody>
                    </table>
                </div>
            )}

            {/* ================================================= */}
            {/* EDIT SELECTED UNITS MODAL */}
            {/* ================================================= */}

            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

                    <div
                        className={`max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl shadow-2xl ${
                            darkMode
                                ? "bg-slate-900"
                                : "bg-white"
                        }`}
                    >

                        {/* HEADER */}

                        <div
                            className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 ${
                                darkMode
                                    ? "border-slate-700 bg-slate-900"
                                    : "border-slate-200 bg-white"
                            }`}
                        >

                            <div>

                                <h2
                                    className={`text-lg font-semibold ${
                                        darkMode
                                            ? "text-white"
                                            : "text-slate-800"
                                    }`}
                                >
                                    Edit Selected Network Units
                                </h2>

                                <p
                                    className={`mt-1 text-sm ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }`}
                                >
                                    Editing{" "}
                                    {editingUnits.length}{" "}
                                    selected unit
                                    {editingUnits.length !== 1
                                        ? "s"
                                        : ""}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                disabled={loading}
                                className={`rounded-lg p-2 ${
                                    darkMode
                                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* CONTENT */}

                        <div className="space-y-5 p-6">

                            {error && (
                                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {editingUnits.map(
                                (unit, index) => (
                                    <div
                                        key={unit._id}
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
                                                Unit {index + 1}
                                            </h3>

                                            <span
                                                className={`text-xs ${
                                                    darkMode
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                ID: {unit._id}
                                            </span>

                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">

                                            <div>

                                                <label
                                                    className={`mb-1 block text-xs font-medium ${
                                                        darkMode
                                                            ? "text-slate-300"
                                                            : "text-slate-600"
                                                    }`}
                                                >
                                                    Unit Code
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        unit.unitCode
                                                    }
                                                    onChange={(event) =>
                                                        handleFieldChange(
                                                            index,
                                                            "unitCode",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                />

                                            </div>

                                            <div>

                                                <label
                                                    className={`mb-1 block text-xs font-medium ${
                                                        darkMode
                                                            ? "text-slate-300"
                                                            : "text-slate-600"
                                                    }`}
                                                >
                                                    Hostname
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        unit.hostname
                                                    }
                                                    onChange={(event) =>
                                                        handleFieldChange(
                                                            index,
                                                            "hostname",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                />

                                            </div>

                                            <div>

                                                <label
                                                    className={`mb-1 block text-xs font-medium ${
                                                        darkMode
                                                            ? "text-slate-300"
                                                            : "text-slate-600"
                                                    }`}
                                                >
                                                    Radio Configuration
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        unit.radioConfiguration
                                                    }
                                                    onChange={(event) =>
                                                        handleFieldChange(
                                                            index,
                                                            "radioConfiguration",
                                                            event.target.value
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
                                onClick={closeEditModal}
                                disabled={loading}
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    darkMode
                                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
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

        </div>
    );
};

export default NetworkUnitsTable;