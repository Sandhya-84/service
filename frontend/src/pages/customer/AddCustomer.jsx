import React, {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    useTheme
} from "../../context/ThemeContext";

import {
    createCustomer
} from "../../api/customerApi";


const AddCustomer = () => {

    const navigate = useNavigate();

    const {
        darkMode
    } = useTheme();


    const [name, setName] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =========================
    // CREATE CUSTOMER
    // =========================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (!name.trim()) {

            setError(
                "Customer name is required."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await createCustomer(
                    name.trim()
                );


            setSuccess(
                response.message ||
                "Customer created successfully."
            );


            setName("");


        } catch (error) {

            console.error(
                "Create customer error:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Failed to create customer."
            );


        } finally {

            setLoading(false);

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
                            Add Customer
                        </h1>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-sm text-slate-400"
                                    : "mt-1 text-sm text-slate-500"
                            }
                        >
                            Create a new customer for the support renewal tracker
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
                className="mx-auto max-w-2xl px-4 py-10 sm:px-6"
            >

                <div
                    className={
                        darkMode
                            ? "rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
                            : "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                    }
                >


                    {/* =========================
                        FORM TITLE
                    ========================= */}

                    <div className="mb-7">

                        <h2
                            className={
                                darkMode
                                    ? "font-sora text-lg font-bold text-white"
                                    : "font-sora text-lg font-bold text-slate-900"
                            }
                        >
                            Customer Information
                        </h2>


                        <p
                            className={
                                darkMode
                                    ? "mt-2 text-sm leading-6 text-slate-400"
                                    : "mt-2 text-sm leading-6 text-slate-500"
                            }
                        >
                            Enter the customer name. You can add purchase
                            orders and network units after creating the customer.
                        </p>

                    </div>


                    {/* =========================
                        FORM
                    ========================= */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >


                        {/* CUSTOMER NAME */}

                        <div>

                            <label
                                htmlFor="customerName"
                                className={
                                    darkMode
                                        ? "mb-2 block text-sm font-semibold text-slate-200"
                                        : "mb-2 block text-sm font-semibold text-slate-700"
                                }
                            >
                                Customer Name
                            </label>


                            <input
                                id="customerName"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter customer name"
                                disabled={loading}
                                className={
                                    darkMode
                                        ? "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                        : "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                }
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
                                Cancel
                            </button>


                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !name.trim()
                                }
                                className={
                                    loading ||
                                    !name.trim()
                                        ? "flex-1 cursor-not-allowed rounded-lg bg-slate-400 px-5 py-3 text-sm font-semibold text-white"
                                        : "flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                }
                            >
                                {loading
                                    ? "Creating..."
                                    : "Create Customer"}
                            </button>

                        </div>


                    </form>


                    {/* =========================
                        AFTER SUCCESS
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
                                Customer has been added successfully.
                                You can now create a purchase order for this
                                customer.
                            </p>


                            <div
                                className="mt-4 flex flex-col gap-3 sm:flex-row"
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/add-purchase-order"
                                        )
                                    }
                                    className="flex-1 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    Add Purchase Order
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

            </main>

        </div>

    );

};


export default AddCustomer;