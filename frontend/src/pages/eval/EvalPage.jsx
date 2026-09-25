import React, {
    useEffect,
    useState
} from "react";

import {
    getEvalValues,
    getEvalSummary
} from "../../api/evalValueApi";

import { useTheme } from "../../context/ThemeContext";


const EvalPage = () => {

    const {
        darkMode
    } = useTheme();


    const [records, setRecords] =
        useState([]);


    const [summary, setSummary] =
        useState({

            total: 0,

            customers: 0,

            units: 0

        });


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    const loadEvalData =
        async () => {

            try {

                setLoading(
                    true
                );

                setError("");


                const [
                    valuesResponse,
                    summaryResponse
                ] = await Promise.all([

                    getEvalValues(),

                    getEvalSummary()

                ]);


                setRecords(
                    valuesResponse.data || []
                );


                setSummary(
                    summaryResponse.data || {

                        total: 0,

                        customers: 0,

                        units: 0

                    }
                );


            } catch (err) {

                console.error(
                    "EVAL loading error:",
                    err
                );


                setError(

                    err.response?.data?.message ||

                    "Failed to load EVAL data."

                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    useEffect(() => {

        loadEvalData();

    }, []);


    return (

        <div
            className={`
                min-h-screen
                px-6
                py-8
                ${
                    darkMode
                        ? "bg-slate-950 text-white"
                        : "bg-slate-50 text-slate-900"
                }
            `}
        >

            <div
                className="
                    mx-auto
                    max-w-[1500px]
                "
            >

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div
                    className="
                        mb-8
                        flex
                        items-start
                        justify-between
                        gap-4
                    "
                >

                    <div>

                        <h1
                            className="
                                text-3xl
                                font-bold
                            "
                        >
                            EVAL Units
                        </h1>


                        <p
                            className={`
                                mt-2
                                text-sm
                                ${
                                    darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            EVAL unit information extracted
                            from the main Excel import.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            loadEvalData
                        }
                        disabled={loading}
                        className={`
                            rounded-xl
                            px-5
                            py-3
                            text-sm
                            font-semibold
                            transition
                            ${
                                darkMode
                                    ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                            }
                        `}
                    >
                        {loading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </div>


                {/* =================================================
                    INFO
                ================================================= */}

                <div
                    className={`
                        mb-8
                        rounded-2xl
                        border
                        px-6
                        py-5
                        ${
                            darkMode
                                ? "border-emerald-900/50 bg-emerald-950/20"
                                : "border-emerald-100 bg-emerald-50"
                        }
                    `}
                >

                    <p
                        className={`
                            text-sm
                            ${
                                darkMode
                                    ? "text-emerald-300"
                                    : "text-emerald-800"
                            }
                        `}
                    >
                        EVAL data is automatically extracted
                        from the <strong>Demos</strong> sheet
                        whenever the main Excel file is uploaded
                        through <strong>Import Excel</strong>.
                        No separate EVAL upload is required.
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div
                        className="
                            mb-6
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-5
                            py-4
                            text-sm
                            text-red-700
                        "
                    >
                        {error}
                    </div>

                )}


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div
                    className="
                        mb-8
                        grid
                        grid-cols-1
                        gap-5
                        sm:grid-cols-2
                        lg:grid-cols-3
                    "
                >

                    {/* TOTAL RECORDS */}

                    <div
                        className={`
                            rounded-2xl
                            border
                            p-6
                            shadow-sm
                            ${
                                darkMode
                                    ? "border-slate-800 bg-slate-900"
                                    : "border-slate-200 bg-white"
                            }
                        `}
                    >

                        <p
                            className={`
                                text-sm
                                font-medium
                                ${
                                    darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Total EVAL Records
                        </p>


                        <p
                            className="
                                mt-3
                                text-3xl
                                font-bold
                            "
                        >
                            {summary.total || 0}
                        </p>

                    </div>


                    {/* CUSTOMERS */}

                    <div
                        className={`
                            rounded-2xl
                            border
                            p-6
                            shadow-sm
                            ${
                                darkMode
                                    ? "border-slate-800 bg-slate-900"
                                    : "border-slate-200 bg-white"
                            }
                        `}
                    >

                        <p
                            className={`
                                text-sm
                                font-medium
                                ${
                                    darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Customers
                        </p>


                        <p
                            className="
                                mt-3
                                text-3xl
                                font-bold
                            "
                        >
                            {summary.customers || 0}
                        </p>

                    </div>


                    {/* UNITS */}

                    <div
                        className={`
                            rounded-2xl
                            border
                            p-6
                            shadow-sm
                            ${
                                darkMode
                                    ? "border-slate-800 bg-slate-900"
                                    : "border-slate-200 bg-white"
                            }
                        `}
                    >

                        <p
                            className={`
                                text-sm
                                font-medium
                                ${
                                    darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Units
                        </p>


                        <p
                            className="
                                mt-3
                                text-3xl
                                font-bold
                            "
                        >
                            {summary.units || 0}
                        </p>

                    </div>

                </div>


                {/* =================================================
                    EVAL TABLE
                ================================================= */}

                <div
                    className={`
                        overflow-hidden
                        rounded-2xl
                        border
                        shadow-sm
                        ${
                            darkMode
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-200 bg-white"
                        }
                    `}
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            border-b
                            px-6
                            py-5
                        "
                    >

                        <div>

                            <h2
                                className="
                                    text-xl
                                    font-semibold
                                "
                            >
                                EVAL Unit Records
                            </h2>


                            <p
                                className={`
                                    mt-1
                                    text-sm
                                    ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }
                                `}
                            >
                                Data from the Demos sheet
                                of the latest main Excel import
                            </p>

                        </div>

                    </div>


                    <div
                        className="
                            overflow-x-auto
                        "
                    >

                        {loading ? (

                            <div
                                className={`
                                    px-6
                                    py-14
                                    text-center
                                    text-sm
                                    ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }
                                `}
                            >
                                Loading EVAL records...
                            </div>

                        ) : records.length === 0 ? (

                            <div
                                className={`
                                    px-6
                                    py-14
                                    text-center
                                    text-sm
                                    ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }
                                `}
                            >

                                No EVAL records found.

                                <div
                                    className="
                                        mt-2
                                    "
                                >
                                    Upload the main Excel file
                                    from <strong>Import Excel</strong>
                                    containing the Demos sheet.
                                </div>

                            </div>

                        ) : (

                            <table
                                className="
                                    min-w-full
                                    text-left
                                "
                            >

                                <thead
                                    className={`
                                        text-sm
                                        ${
                                            darkMode
                                                ? "bg-slate-950 text-slate-400"
                                                : "bg-slate-50 text-slate-500"
                                        }
                                    `}
                                >

                                    <tr>

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-6
                                                py-4
                                                font-semibold
                                            "
                                        >
                                            #
                                        </th>


                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-6
                                                py-4
                                                font-semibold
                                            "
                                        >
                                            Unit
                                        </th>


                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-6
                                                py-4
                                                font-semibold
                                            "
                                        >
                                            Hostname
                                        </th>


                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-6
                                                py-4
                                                font-semibold
                                            "
                                        >
                                            Radio Configuration
                                        </th>


                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-6
                                                py-4
                                                font-semibold
                                            "
                                        >
                                            Shipment Date
                                        </th>


                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-6
                                                py-4
                                                font-semibold
                                            "
                                        >
                                            Customer
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {records.map(
                                        (
                                            record,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    record._id ||
                                                    index
                                                }
                                                className={`
                                                    border-t
                                                    ${
                                                        darkMode
                                                            ? "border-slate-800 hover:bg-slate-800/50"
                                                            : "border-slate-100 hover:bg-slate-50"
                                                    }
                                                `}
                                            >

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-6
                                                        py-4
                                                        text-sm
                                                    "
                                                >
                                                    {index + 1}
                                                </td>


                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-6
                                                        py-4
                                                        text-sm
                                                        font-medium
                                                    "
                                                >
                                                    {record.unit ||
                                                        "-"}
                                                </td>


                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-6
                                                        py-4
                                                        text-sm
                                                    "
                                                >
                                                    {record.hostname ||
                                                        "-"}
                                                </td>


                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-6
                                                        py-4
                                                        text-sm
                                                    "
                                                >
                                                    {record.radioConfig ||
                                                        "-"}
                                                </td>


                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-6
                                                        py-4
                                                        text-sm
                                                    "
                                                >
                                                    {record.shipmentDate ||
                                                        "-"}
                                                </td>


                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-6
                                                        py-4
                                                        text-sm
                                                    "
                                                >
                                                    {record.customer ||
                                                        "-"}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

};


export default EvalPage;