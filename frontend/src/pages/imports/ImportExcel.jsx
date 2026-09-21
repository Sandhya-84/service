import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";


const ImportExcel = () => {

    const navigate = useNavigate();

    const fileInputRef = useRef(null);

    const {
        darkMode
    } = useTheme();


    // =========================================
    // STATES
    // =========================================

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [uploading, setUploading] =
        useState(false);

    const [success, setSuccess] =
        useState("");

    const [error, setError] =
        useState("");


    // =========================================
    // SELECT FILE
    // =========================================

    const handleFileChange = (event) => {

        const file =
            event.target.files?.[0];

        setSuccess("");
        setError("");

        if (!file) {
            setSelectedFile(null);
            return;
        }


        const fileName =
            file.name.toLowerCase();


        if (
            !fileName.endsWith(".xlsx") &&
            !fileName.endsWith(".xls")
        ) {

            setError(
                "Please select an Excel file (.xlsx or .xls)."
            );

            setSelectedFile(null);

            event.target.value = "";

            return;
        }


        setSelectedFile(file);
    };


    // =========================================
    // UPLOAD EXCEL
    // =========================================

    const handleUpload = async () => {

        if (!selectedFile) {

            setError(
                "Please select an Excel file first."
            );

            return;
        }


        setUploading(true);

        setSuccess("");

        setError("");


        try {

            const formData =
                new FormData();

            formData.append(
                "file",
                selectedFile
            );


            const token =
                localStorage.getItem("token");


            const response =
                await fetch(
                    "http://localhost:5000/api/import/excel",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Excel upload failed."
                );
            }


            setSuccess(
                data?.message ||
                "Excel imported successfully."
            );


            setSelectedFile(null);


            if (fileInputRef.current) {

                fileInputRef.current.value =
                    "";
            }

        } catch (error) {

            console.error(
                "Excel upload error:",
                error
            );

            setError(
                error.message ||
                "Failed to upload Excel file."
            );

        } finally {

            setUploading(false);
        }
    };


    // =========================================
    // UPLOAD ANOTHER EXCEL
    // =========================================

    const handleUploadAnother = () => {

        setSelectedFile(null);

        setSuccess("");

        setError("");


        if (fileInputRef.current) {

            fileInputRef.current.value =
                "";

            fileInputRef.current.click();
        }
    };


    return (

        <div
            className={
                darkMode
                    ? "min-h-screen bg-slate-950 text-white"
                    : "min-h-screen bg-[#F3F6F6] text-slate-900"
            }
        >

            {/* ========================================= */}
            {/* HEADER */}
            {/* ========================================= */}

            <header
                className={
                    darkMode
                        ? "border-b border-slate-800 bg-slate-950"
                        : "border-b border-slate-200 bg-white"
                }
            >

                <div
                    className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5"
                >

                    <div>

                        <h1
                            className={
                                darkMode
                                    ? "font-sora text-xl font-bold text-white"
                                    : "font-sora text-xl font-bold text-slate-900"
                            }
                        >
                            Import Excel
                        </h1>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-sm text-slate-400"
                                    : "mt-1 text-sm text-slate-500"
                            }
                        >
                            Upload networking unit data into the Support Renewal Tracker
                        </p>

                    </div>


                    {/* BACK TO DASHBOARD */}

                </div>

            </header>


            {/* ========================================= */}
            {/* MAIN CONTENT */}
            {/* ========================================= */}

            <main
                className="mx-auto max-w-[900px] px-6 py-10"
            >

                {/* ===================================== */}
                {/* IMPORT CARD */}
                {/* ===================================== */}

                <div
                    className={
                        darkMode
                            ? "rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
                            : "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                    }
                >

                    {/* TITLE */}

                    <div className="mb-7">

                        <h2
                            className={
                                darkMode
                                    ? "font-sora text-lg font-bold text-white"
                                    : "font-sora text-lg font-bold text-slate-900"
                            }
                        >
                            Upload Excel File
                        </h2>


                        <p
                            className={
                                darkMode
                                    ? "mt-2 text-sm leading-6 text-slate-400"
                                    : "mt-2 text-sm leading-6 text-slate-500"
                            }
                        >
                            Select the Excel workbook containing customer,
                            purchase order and network unit information.
                        </p>

                    </div>


                    {/* ================================= */}
                    {/* FILE UPLOAD AREA */}
                    {/* ================================= */}

                    <div
                        className={
                            darkMode
                                ? "rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-8 text-center"
                                : "rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center"
                        }
                    >

                        {/* ICON */}

                        <div
                            className={
                                darkMode
                                    ? "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-2xl"
                                    : "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl"
                            }
                        >
                            📊
                        </div>


                        <h3
                            className={
                                darkMode
                                    ? "text-sm font-semibold text-white"
                                    : "text-sm font-semibold text-slate-800"
                            }
                        >
                            Select your Excel workbook
                        </h3>


                        <p
                            className={
                                darkMode
                                    ? "mt-2 text-xs text-slate-400"
                                    : "mt-2 text-xs text-slate-500"
                            }
                        >
                            Supported formats: .xlsx and .xls
                        </p>


                        {/* FILE INPUT */}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={
                                handleFileChange
                            }
                            className="hidden"
                        />


                        {/* CHOOSE FILE BUTTON */}

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className={
                                darkMode
                                    ? "mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
                                    : "mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                            }
                        >
                            Choose Excel File
                        </button>


                        {/* SELECTED FILE */}

                        {selectedFile && (

                            <div
                                className={
                                    darkMode
                                        ? "mx-auto mt-5 max-w-md rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left"
                                        : "mx-auto mt-5 max-w-md rounded-lg border border-slate-200 bg-white px-4 py-3 text-left"
                                }
                            >

                                <p
                                    className={
                                        darkMode
                                            ? "text-xs font-medium text-slate-400"
                                            : "text-xs font-medium text-slate-500"
                                    }
                                >
                                    Selected file
                                </p>


                                <p
                                    className={
                                        darkMode
                                            ? "mt-1 truncate text-sm font-semibold text-white"
                                            : "mt-1 truncate text-sm font-semibold text-slate-800"
                                    }
                                >
                                    {selectedFile.name}
                                </p>


                                <p
                                    className={
                                        darkMode
                                            ? "mt-1 text-xs text-slate-500"
                                            : "mt-1 text-xs text-slate-400"
                                    }
                                >
                                    {(
                                        selectedFile.size /
                                        1024
                                    ).toFixed(1)}
                                    {" KB"}
                                </p>

                            </div>

                        )}

                    </div>


                    {/* ================================= */}
                    {/* ERROR */}
                    {/* ================================= */}

                    {error && (

                        <div
                            className={
                                darkMode
                                    ? "mt-5 rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300"
                                    : "mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                            }
                        >
                            {error}
                        </div>

                    )}


                    {/* ================================= */}
                    {/* SUCCESS */}
                    {/* ================================= */}

                    {success && (

                        <div
                            className={
                                darkMode
                                    ? "mt-5 rounded-lg border border-green-900 bg-green-950 px-4 py-3 text-sm text-green-300"
                                    : "mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                            }
                        >
                            {success}
                        </div>

                    )}


                    {/* ================================= */}
                    {/* UPLOAD BUTTON */}
                    {/* ================================= */}

                    {!success && (

                        <button
                            type="button"
                            onClick={
                                handleUpload
                            }
                            disabled={
                                !selectedFile ||
                                uploading
                            }
                            className={
                                `mt-6 w-full rounded-lg px-5 py-3 text-sm font-semibold text-white ${
                                    !selectedFile ||
                                    uploading
                                        ? "cursor-not-allowed bg-slate-400"
                                        : darkMode
                                            ? "bg-emerald-700 hover:bg-emerald-600"
                                            : "bg-emerald-600 hover:bg-emerald-700"
                                }`
                            }
                        >

                            {uploading
                                ? "Uploading..."
                                : "Upload Excel"}

                        </button>

                    )}


                    {/* ================================= */}
                    {/* SUCCESS ACTIONS */}
                    {/* ================================= */}

                    {success && (

                        <div
                            className="mt-6 flex flex-col gap-3 sm:flex-row"
                        >

                            {/* UPLOAD ANOTHER */}

                            <button
                                type="button"
                                onClick={
                                    handleUploadAnother
                                }
                                className={
                                    darkMode
                                        ? "flex-1 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                                        : "flex-1 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                                }
                            >
                                Upload Another Excel
                            </button>


                            {/* DASHBOARD */}

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                                className={
                                    darkMode
                                        ? "flex-1 rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                                        : "flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                }
                            >
                                Back to Dashboard
                            </button>

                        </div>

                    )}

                </div>


                {/* ========================================= */}
                {/* IMPORT INFORMATION */}
                {/* ========================================= */}

                <div
                    className={
                        darkMode
                            ? "mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5"
                            : "mt-6 rounded-xl border border-slate-200 bg-white p-5"
                    }
                >

                    <h3
                        className={
                            darkMode
                                ? "text-sm font-semibold text-white"
                                : "text-sm font-semibold text-slate-800"
                        }
                    >
                        Import Information
                    </h3>


                    <ul
                        className={
                            darkMode
                                ? "mt-3 space-y-2 text-xs leading-5 text-slate-400"
                                : "mt-3 space-y-2 text-xs leading-5 text-slate-500"
                        }
                    >

                        <li>
                            • Customer names are taken from Excel sheet names.
                        </li>

                        <li>
                            • Purchase orders and network units are updated against existing records.
                        </li>

                        <li>
                            • Existing historical renewal information is preserved.
                        </li>

                        <li>
                            • Supported Excel formats are .xlsx and .xls.
                        </li>

                    </ul>

                </div>

            </main>

        </div>

    );
};


export default ImportExcel;