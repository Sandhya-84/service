import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    useTheme
} from "../../context/ThemeContext";

import {
    getCustomers
} from "../../api/customerApi";

import {
    createPurchaseOrder
} from "../../api/purchaseOrderApi";


const AddPurchaseOrder = () => {

    const navigate = useNavigate();

    const {
        darkMode
    } = useTheme();


    // =========================
    // CUSTOMERS
    // =========================

    const [customers, setCustomers] =
        useState([]);

    const [customersLoading, setCustomersLoading] =
        useState(true);


    // =========================
    // FORM
    // =========================

    const [formData, setFormData] =
        useState({
            customerId: "",
            poNumber: "",
            invoiceNumber: "",
            supportExpiryDate: "",
            nextRenewalDate: "",
            team: "",
            notes: "",
            renewed: false
        });


    // =========================
    // STATES
    // =========================

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [createdPurchaseOrder, setCreatedPurchaseOrder] =
        useState(null);


    // =========================
    // LOAD CUSTOMERS
    // =========================

    useEffect(() => {

        const loadCustomers =
            async () => {

                try {

                    setCustomersLoading(true);
                    setError("");

                    const response =
                        await getCustomers();

                    setCustomers(
                        response.customers || []
                    );

                } catch (error) {

                    console.error(
                        "Load customers error:",
                        error
                    );

                    setError(
                        error.response?.data?.message ||
                        "Failed to load customers."
                    );

                } finally {

                    setCustomersLoading(false);

                }

            };


        loadCustomers();

    }, []);


    // =========================
    // HANDLE INPUT
    // =========================

    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setFormData(
            previous => ({
                ...previous,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value
            })
        );


        setError("");
        setSuccess("");

    };


    // =========================
    // SUBMIT
    // =========================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (!formData.customerId) {

            setError(
                "Please select a customer."
            );

            return;

        }


        if (!formData.poNumber.trim()) {

            setError(
                "Purchase order number is required."
            );

            return;

        }


        try {

            setLoading(true);


            const data = {

                customerId:
                    formData.customerId,

                poNumber:
                    formData.poNumber.trim(),

                invoiceNumber:
                    formData.invoiceNumber.trim(),

                supportExpiryDate:
                    formData.supportExpiryDate ||
                    undefined,

                nextRenewalDate:
                    formData.nextRenewalDate ||
                    undefined,

                team:
                    formData.team.trim(),

                notes:
                    formData.notes.trim(),

                renewed:
                    formData.renewed

            };


            const response =
                await createPurchaseOrder(
                    data
                );


            const purchaseOrder =
                response.purchaseOrder;


            setCreatedPurchaseOrder(
                purchaseOrder
            );


            setSuccess(
                response.message ||
                "Purchase order created successfully."
            );


        } catch (error) {

            console.error(
                "Create purchase order error:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Failed to create purchase order."
            );

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // ADD ANOTHER PO
    // =========================

    const handleAddAnother = () => {

        setFormData(
            previous => ({
                ...previous,

                poNumber: "",
                invoiceNumber: "",
                supportExpiryDate: "",
                nextRenewalDate: "",
                team: "",
                notes: "",
                renewed: false
            })
        );

        setCreatedPurchaseOrder(null);
        setSuccess("");
        setError("");

    };


    // =========================
    // INPUT CLASS
    // =========================

    const inputClass =
        darkMode
            ? "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            : "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60";


    const labelClass =
        darkMode
            ? "mb-2 block text-sm font-semibold text-slate-200"
            : "mb-2 block text-sm font-semibold text-slate-700";


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
                            Add Purchase Order
                        </h1>


                        <p
                            className={
                                darkMode
                                    ? "mt-1 text-sm text-slate-400"
                                    : "mt-1 text-sm text-slate-500"
                            }
                        >
                            Create a purchase order and link it to a customer
                        </p>

                    </div>


                    

                </div>

            </header>


            {/* =========================
                MAIN
            ========================= */}

            <main
                className="mx-auto max-w-4xl px-4 py-10 sm:px-6"
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

                    <div className="mb-8">

                        <h2
                            className={
                                darkMode
                                    ? "font-sora text-lg font-bold text-white"
                                    : "font-sora text-lg font-bold text-slate-900"
                            }
                        >
                            Purchase Order Information
                        </h2>


                        <p
                            className={
                                darkMode
                                    ? "mt-2 text-sm leading-6 text-slate-400"
                                    : "mt-2 text-sm leading-6 text-slate-500"
                            }
                        >
                            Enter the purchase order details. After creating
                            the PO, you can add its network units.
                        </p>

                    </div>


                    {/* =========================
                        FORM
                    ========================= */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >


                        {/* =========================
                            CUSTOMER
                        ========================= */}

                        <div>

                            <label
                                htmlFor="customerId"
                                className={labelClass}
                            >
                                Customer
                            </label>


                            <select
                                id="customerId"
                                name="customerId"
                                value={
                                    formData.customerId
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    customersLoading ||
                                    loading ||
                                    !!createdPurchaseOrder
                                }
                                className={inputClass}
                            >

                                <option value="">
                                    {customersLoading
                                        ? "Loading customers..."
                                        : "Select customer"}
                                </option>


                                {customers.map(
                                    customer => (

                                        <option
                                            key={
                                                customer._id
                                            }
                                            value={
                                                customer._id
                                            }
                                        >
                                            {customer.name}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* =========================
                            PO + INVOICE
                        ========================= */}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">


                            <div>

                                <label
                                    htmlFor="poNumber"
                                    className={labelClass}
                                >
                                    Purchase Order Number
                                </label>


                                <input
                                    id="poNumber"
                                    name="poNumber"
                                    type="text"
                                    value={
                                        formData.poNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter PO number"
                                    disabled={
                                        loading ||
                                        !!createdPurchaseOrder
                                    }
                                    className={inputClass}
                                />

                            </div>


                            <div>

                                <label
                                    htmlFor="invoiceNumber"
                                    className={labelClass}
                                >
                                    Invoice Number
                                </label>


                                <input
                                    id="invoiceNumber"
                                    name="invoiceNumber"
                                    type="text"
                                    value={
                                        formData.invoiceNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter invoice number"
                                    disabled={
                                        loading ||
                                        !!createdPurchaseOrder
                                    }
                                    className={inputClass}
                                />

                            </div>

                        </div>


                        {/* =========================
                            EXPIRY DATES
                        ========================= */}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">


                            <div>

                                <label
                                    htmlFor="supportExpiryDate"
                                    className={labelClass}
                                >
                                    Support Expiry Date
                                </label>


                                <input
                                    id="supportExpiryDate"
                                    name="supportExpiryDate"
                                    type="date"
                                    value={
                                        formData.supportExpiryDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loading ||
                                        !!createdPurchaseOrder
                                    }
                                    className={inputClass}
                                />

                            </div>


                            <div>

                                <label
                                    htmlFor="nextRenewalDate"
                                    className={labelClass}
                                >
                                    Next Renewal Date
                                </label>


                                <input
                                    id="nextRenewalDate"
                                    name="nextRenewalDate"
                                    type="date"
                                    value={
                                        formData.nextRenewalDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loading ||
                                        !!createdPurchaseOrder
                                    }
                                    className={inputClass}
                                />

                            </div>

                        </div>


                        {/* =========================
                            TEAM
                        ========================= */}

                        <div>

                            <label
                                htmlFor="team"
                                className={labelClass}
                            >
                                Team
                            </label>


                            <input
                                id="team"
                                name="team"
                                type="text"
                                value={
                                    formData.team
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter responsible team"
                                disabled={
                                    loading ||
                                    !!createdPurchaseOrder
                                }
                                className={inputClass}
                            />

                        </div>


                        {/* =========================
                            NOTES
                        ========================= */}

                        <div>

                            <label
                                htmlFor="notes"
                                className={labelClass}
                            >
                                Notes
                            </label>


                            <textarea
                                id="notes"
                                name="notes"
                                rows="4"
                                value={
                                    formData.notes
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Add notes about this purchase order"
                                disabled={
                                    loading ||
                                    !!createdPurchaseOrder
                                }
                                className={inputClass}
                            />

                        </div>


                        {/* =========================
                            RENEWED
                        ========================= */}

                        <div
                            className={
                                darkMode
                                    ? "rounded-lg border border-slate-700 bg-slate-950 p-4"
                                    : "rounded-lg border border-slate-200 bg-slate-50 p-4"
                            }
                        >

                            <label className="flex cursor-pointer items-center gap-3">

                                <input
                                    type="checkbox"
                                    name="renewed"
                                    checked={
                                        formData.renewed
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loading ||
                                        !!createdPurchaseOrder
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />


                                <span
                                    className={
                                        darkMode
                                            ? "text-sm font-medium text-slate-200"
                                            : "text-sm font-medium text-slate-700"
                                    }
                                >
                                    Support has already been renewed
                                </span>

                            </label>

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

                        {!createdPurchaseOrder && (

                            <div className="flex flex-col gap-3 sm:flex-row">

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
                                        !formData.customerId ||
                                        !formData.poNumber.trim()
                                    }
                                    className={
                                        loading ||
                                        !formData.customerId ||
                                        !formData.poNumber.trim()
                                            ? "flex-1 cursor-not-allowed rounded-lg bg-slate-400 px-5 py-3 text-sm font-semibold text-white"
                                            : "flex-1 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    }
                                >
                                    {loading
                                        ? "Creating..."
                                        : "Create Purchase Order"}
                                </button>

                            </div>

                        )}


                    </form>


                    {/* =========================
                        AFTER SUCCESS
                    ========================= */}

                    {createdPurchaseOrder && (

                        <div
                            className={
                                darkMode
                                    ? "mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5"
                                    : "mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
                            }
                        >

                            <h3
                                className={
                                    darkMode
                                        ? "text-sm font-semibold text-white"
                                        : "text-sm font-semibold text-slate-800"
                                }
                            >
                                Purchase Order Created
                            </h3>


                            <p
                                className={
                                    darkMode
                                        ? "mt-2 text-sm text-slate-400"
                                        : "mt-2 text-sm text-slate-600"
                                }
                            >
                                PO{" "}
                                <span className="font-semibold">
                                    {
                                        createdPurchaseOrder.poNumber
                                    }
                                </span>{" "}
                                has been successfully created.
                            </p>


                            <div
                                className="mt-5 flex flex-col gap-3 sm:flex-row"
                            >

                                {/* ADD UNITS */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/add-network-unit?purchaseOrderId=${createdPurchaseOrder._id}`
                                        )
                                    }
                                    className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    Add Units to this PO
                                </button>


                                {/* ADD ANOTHER PO */}

                                <button
                                    type="button"
                                    onClick={
                                        handleAddAnother
                                    }
                                    className={
                                        darkMode
                                            ? "flex-1 rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                                            : "flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    }
                                >
                                    Add Another PO
                                </button>


                                {/* DASHBOARD */}

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


export default AddPurchaseOrder;