import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

import {
    useTheme
} from "../../context/ThemeContext";

import {
    createNetworkUnit,
    getNetworkUnits
} from "../../api/networkUnitApi";


const AddNetworkUnit = () => {

    const navigate = useNavigate();

    const [
        searchParams
    ] = useSearchParams();

    const {
        darkMode
    } = useTheme();


    // =========================
    // PURCHASE ORDER ID
    // =========================

    const purchaseOrderId =
        searchParams.get(
            "purchaseOrderId"
        );


    // =========================
    // FORM
    // =========================

    const [formData, setFormData] =
        useState({
            unitCode: "",
            hostname: "",
            radioConfiguration: ""
        });


    // =========================
    // EXISTING UNITS
    // =========================

    const [existingUnits, setExistingUnits] =
        useState([]);


    // =========================
    // STATES
    // =========================

    const [loading, setLoading] =
        useState(false);

    const [unitsLoading, setUnitsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =========================
    // LOAD EXISTING UNITS
    // =========================

    useEffect(() => {

        const loadUnits =
            async () => {

                if (!purchaseOrderId) {

                    setUnitsLoading(false);

                    return;

                }


                try {

                    setUnitsLoading(true);

                    const response =
                        await getNetworkUnits(
                            purchaseOrderId
                        );

                    setExistingUnits(
                        response.networkUnits || []
                    );

                } catch (error) {

                    console.error(
                        "Load network units error:",
                        error
                    );

                } finally {

                    setUnitsLoading(false);

                }

            };


        loadUnits();

    }, [purchaseOrderId]);


    // =========================
    // HANDLE INPUT
    // =========================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value
        } = event.target;


        setFormData(
            previous => ({
                ...previous,
                [name]: value
            })
        );


        setError("");
        setSuccess("");

    };


    // =========================
    // SUBMIT
    // =========================

    const handleSubmit =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");


            if (!purchaseOrderId) {

                setError(
                    "Purchase order information is missing."
                );

                return;

            }


            if (
                !formData.unitCode.trim()
            ) {

                setError(
                    "Unit code is required."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await createNetworkUnit({

                        purchaseOrderId,

                        unitCode:
                            formData.unitCode.trim(),

                        hostname:
                            formData.hostname.trim(),

                        radioConfiguration:
                            formData.radioConfiguration.trim()

                    });


                setSuccess(
                    response.message ||
                    "Network unit created successfully."
                );


                setExistingUnits(
                    previous => [
                        ...previous,
                        response.networkUnit
                    ]
                );


                setFormData({
                    unitCode: "",
                    hostname: "",
                    radioConfiguration: ""
                });


            } catch (error) {

                console.error(
                    "Create network unit error:",
                    error
                );


                setError(
                    error.response?.data?.message ||
                    "Failed to create network unit."
                );

            } finally {

                setLoading(false);

            }

        };


    // =========================
    // INPUT STYLES
    // =========================

    const inputClass =
        darkMode
            ? "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            : "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60";


    const labelClass =
        darkMode
            ? "mb-2 block text-sm font-semibold text-slate-200"
            : "mb-2 block text-sm font-semibold text-slate-700";


    // =========================
    // MISSING PO
    // =========================

    if (!purchaseOrderId) {

        return (

            <div
                className={
                    darkMode
                        ? "flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"
                        : "flex min-h-screen items-center justify-center bg-[#F3F6F6] px-4 text-slate-900"
                }
            >

                <div
                    className={
                        darkMode
                            ? "w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"
                            : "w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                    }
                >

                    <h1
                        className={
                            darkMode
                                ? "font-sora text-xl font-bold text-white"
                                : "font-sora text-xl font-bold text-slate-900"
                        }
                    >
                        Purchase Order Not Selected
                    </h1>


                    <p
                        className={
                            darkMode
                                ? "mt-3 text-sm text-slate-400"
                                : "mt-3 text-sm text-slate-500"
                        }
                    >
                        Please create a purchase order first,
                        or open this page from an existing PO.
                    </p>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="mt-6 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        Back to Dashboard
                    </button>

                </div>

            </div>

        );

    }


    return (

        <div
            className={
                darkMode
                    ? "min-h-screen bg-slate-950 text-white"
                    : "min-h-screen bg-[#F3F6F6] text-slate-900"
            }
        >


            {/* =========================
                HEADER
            ========================= */}

            <header
                className={
                    darkMode
                        ? "border-b border-slate-800 bg-slate-950"
                        : "border-b border-slate-200 bg-white"
                }
            >

                <div
                    className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8"
                >

                    <div>

                        <h1
                            className={
                                darkMode
                                    ? "font-sora text-2xl font-bold text-white"
                                    : "font-sora text-2xl font-bold text-slate-900"
                            }
                        >
                            Add Network Unit
                        </h1>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-sm text-slate-400"
                                    : "mt-1 text-sm text-slate-500"
                            }
                        >
                            Add networking units to this purchase order
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className={
                            darkMode
                                ? "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        }
                    >
                        ← Dashboard
                    </button>

                </div>

            </header>


            {/* =========================
                MAIN
            ========================= */}

            <main
                className="mx-auto max-w-5xl px-4 py-10 sm:px-6"
            >


                {/* =========================
                    ADD UNIT FORM
                ========================= */}

                <div
                    className={
                        darkMode
                            ? "rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
                            : "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                    }
                >

                    <div className="mb-8">

                        <h2
                            className={
                                darkMode
                                    ? "font-sora text-lg font-bold text-white"
                                    : "font-sora text-lg font-bold text-slate-900"
                            }
                        >
                            Network Unit Information
                        </h2>


                        <p
                            className={
                                darkMode
                                    ? "mt-2 text-sm text-slate-400"
                                    : "mt-2 text-sm text-slate-500"
                            }
                        >
                            Enter the unit details below. You can add
                            multiple units to the same purchase order.
                        </p>

                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >


                        {/* =========================
                            UNIT CODE
                        ========================= */}

                        <div>

                            <label
                                htmlFor="unitCode"
                                className={labelClass}
                            >
                                Unit Code
                            </label>


                            <input
                                id="unitCode"
                                name="unitCode"
                                type="text"
                                value={
                                    formData.unitCode
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Example: CT523C"
                                disabled={loading}
                                className={inputClass}
                            />

                        </div>


                        {/* =========================
                            HOSTNAME
                        ========================= */}

                        <div>

                            <label
                                htmlFor="hostname"
                                className={labelClass}
                            >
                                Hostname
                            </label>


                            <input
                                id="hostname"
                                name="hostname"
                                type="text"
                                value={
                                    formData.hostname
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter hostname"
                                disabled={loading}
                                className={inputClass}
                            />

                        </div>


                        {/* =========================
                            RADIO CONFIGURATION
                        ========================= */}

                        <div>

                            <label
                                htmlFor="radioConfiguration"
                                className={labelClass}
                            >
                                Radio Configuration
                            </label>


                            <input
                                id="radioConfiguration"
                                name="radioConfiguration"
                                type="text"
                                value={
                                    formData.radioConfiguration
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Example: mt7915"
                                disabled={loading}
                                className={inputClass}
                            />

                        </div>


                        {/* =========================
                            ERROR
                        ========================= */}

                        {error && (

                            <div
                                className={
                                    darkMode
                                        ? "rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300"
                                        : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                }
                            >
                                {error}
                            </div>

                        )}


                        {/* =========================
                            SUCCESS
                        ========================= */}

                        {success && (

                            <div
                                className={
                                    darkMode
                                        ? "rounded-lg border border-green-900 bg-green-950 px-4 py-3 text-sm text-green-300"
                                        : "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                                }
                            >
                                {success}
                            </div>

                        )}


                        {/* =========================
                            BUTTONS
                        ========================= */}

                        <div
                            className="flex flex-col gap-3 sm:flex-row"
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/dashboard")
                                }
                                disabled={loading}
                                className={
                                    darkMode
                                        ? "flex-1 rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        : "flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                }
                            >
                                Dashboard
                            </button>


                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !formData.unitCode.trim()
                                }
                                className={
                                    loading ||
                                    !formData.unitCode.trim()
                                        ? "flex-1 cursor-not-allowed rounded-lg bg-slate-400 px-5 py-3 text-sm font-semibold text-white"
                                        : "flex-1 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                }
                            >
                                {loading
                                    ? "Adding..."
                                    : "Add Network Unit"}
                            </button>

                        </div>

                    </form>


                    {/* =========================
                        SUCCESS ACTIONS
                    ========================= */}

                    {success && (

                        <div
                            className={
                                darkMode
                                    ? "mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5"
                                    : "mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
                            }
                        >

                            <p
                                className={
                                    darkMode
                                        ? "text-sm text-slate-300"
                                        : "text-sm text-slate-600"
                                }
                            >
                                The unit was added successfully.
                                You can continue adding units to this PO
                                or return to the dashboard.
                            </p>


                            <div
                                className="mt-4 flex flex-col gap-3 sm:flex-row"
                            >

                                <button
                                    type="button"
                                    onClick={() => {

                                        setSuccess("");
                                        setError("");

                                    }}
                                    className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    Add Another Unit
                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/dashboard")
                                    }
                                    className={
                                        darkMode
                                            ? "flex-1 rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                                            : "flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    }
                                >
                                    Dashboard
                                </button>

                            </div>

                        </div>

                    )}

                </div>


                {/* =========================
                    EXISTING UNITS
                ========================= */}

                <div
                    className={
                        darkMode
                            ? "mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                            : "mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    }
                >

                    <div
                        className={
                            darkMode
                                ? "border-b border-slate-800 px-6 py-4"
                                : "border-b border-slate-200 px-6 py-4"
                        }
                    >

                        <h2
                            className={
                                darkMode
                                    ? "font-sora text-lg font-bold text-white"
                                    : "font-sora text-lg font-bold text-slate-900"
                            }
                        >
                            Units Already Added
                        </h2>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-xs text-slate-400"
                                    : "mt-1 text-xs text-slate-500"
                            }
                        >
                            {existingUnits.length} unit
                            {existingUnits.length !== 1
                                ? "s"
                                : ""}{" "}
                            currently linked to this PO.
                        </p>

                    </div>


                    {unitsLoading ? (

                        <div className="px-6 py-8 text-center">

                            <p
                                className={
                                    darkMode
                                        ? "text-sm text-slate-400"
                                        : "text-sm text-slate-500"
                                }
                            >
                                Loading units...
                            </p>

                        </div>

                    ) : existingUnits.length === 0 ? (

                        <div className="px-6 py-8 text-center">

                            <p
                                className={
                                    darkMode
                                        ? "text-sm text-slate-400"
                                        : "text-sm text-slate-500"
                                }
                            >
                                No units have been added to this PO yet.
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="min-w-full">

                                <thead
                                    className={
                                        darkMode
                                            ? "bg-slate-950"
                                            : "bg-slate-50"
                                    }
                                >

                                    <tr>

                                        <th
                                            className={
                                                darkMode
                                                    ? "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Unit Code
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Hostname
                                        </th>


                                        <th
                                            className={
                                                darkMode
                                                    ? "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                                                    : "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                            }
                                        >
                                            Radio Configuration
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {existingUnits.map(
                                        (unit, index) => (

                                            <tr
                                                key={
                                                    unit._id ||
                                                    index
                                                }
                                                className={
                                                    darkMode
                                                        ? "border-t border-slate-800"
                                                        : "border-t border-slate-200"
                                                }
                                            >

                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-6 py-4 text-sm font-medium text-white"
                                                            : "px-6 py-4 text-sm font-medium text-slate-800"
                                                    }
                                                >
                                                    {
                                                        unit.unitCode ||
                                                        "-"
                                                    }
                                                </td>


                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-6 py-4 text-sm text-slate-300"
                                                            : "px-6 py-4 text-sm text-slate-600"
                                                    }
                                                >
                                                    {
                                                        unit.hostname ||
                                                        "-"
                                                    }
                                                </td>


                                                <td
                                                    className={
                                                        darkMode
                                                            ? "px-6 py-4 text-sm text-slate-300"
                                                            : "px-6 py-4 text-sm text-slate-600"
                                                    }
                                                >
                                                    {
                                                        unit.radioConfiguration ||
                                                        "-"
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </main>

        </div>

    );

};


export default AddNetworkUnit;