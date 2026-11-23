import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    Search,
    Plus,
    Upload,
    UserPlus,
    FilePlus,
    LayoutDashboard,
    ArrowUpRight,
    ArrowUp,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    Server,
    FileText,
    Building2,
    Radio,
    ChevronRight,
    LogOut,
    RefreshCw
} from "lucide-react";
import { queryAssistant, getAssistantSummary } from "../../api/assistantApi";

const HomeCommand = () => {
    const navigate = useNavigate();

    // User State
    const [userName, setUserName] = useState("User");

    // Live Summary Counts
    const [summary, setSummary] = useState({
        customers: 0,
        purchaseOrders: 0,
        networkUnits: 0,
        expiring: 0,
        expired: 0,
        missingPO: 0
    });
    const [summaryLoading, setSummaryLoading] = useState(true);

    // Query State
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    // Quick Action Menu State
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const quickMenuRef = useRef(null);

    // Input Ref
    const inputRef = useRef(null);

    // Load User and Summary on mount
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem("user");
            const savedUserName = localStorage.getItem("userName");

            if (savedUserName) {
                setUserName(savedUserName);
            } else if (savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed?.name) setUserName(parsed.name);
                else if (parsed?.user?.name) setUserName(parsed.user.name);
            }
        } catch (e) {
            console.error("Error loading user info:", e);
        }

        fetchSummary();
    }, []);

    // Close quick action menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (quickMenuRef.current && !quickMenuRef.current.contains(event.target)) {
                setShowQuickMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSummary = async () => {
        try {
            setSummaryLoading(true);
            const data = await getAssistantSummary();
            setSummary({
                customers: data.customers || 0,
                purchaseOrders: data.purchaseOrders || 0,
                networkUnits: data.networkUnits || 0,
                expiring: data.expiring || 0,
                expired: data.expired || 0,
                missingPO: data.missingPO || 0
            });
        } catch (err) {
            console.error("Failed to load assistant summary:", err);
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userName");
        window.location.href = "/login";
    };

    const handleExecuteQuery = async (queryText) => {
        const textToQuery = (queryText ?? prompt).trim();
        if (!textToQuery) return;

        setPrompt(textToQuery);
        setLoading(true);
        setError("");

        try {
            const response = await queryAssistant(textToQuery);
            setResult(response);
        } catch (err) {
            console.error("Assistant query error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to execute assistant query. Please try again."
            );
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        handleExecuteQuery();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleExecuteQuery();
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const renderExpiryBadge = (po) => {
        if (po.status === "expired" || (po.daysRemaining !== null && po.daysRemaining < 0)) {
            const daysAgo = Math.abs(po.daysRemaining || 0);
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle size={12} className="text-rose-500" />
                    Expired {daysAgo > 0 ? `(${daysAgo}d ago)` : ""}
                </span>
            );
        }
        if (po.status === "expiring" || (po.daysRemaining !== null && po.daysRemaining <= 30)) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock size={12} className="text-amber-500" />
                    Expiring in {po.daysRemaining}d
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Active {po.daysRemaining !== null ? `(${po.daysRemaining}d left)` : ""}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white font-bold shadow-sm">
                        <Sparkles size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-slate-900 tracking-tight">
                                Command Center
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                Window 1
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Support Renewal Tracker</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
                    >
                        <LayoutDashboard size={14} className="text-slate-500" />
                        <span>Open Full Dashboard</span>
                        <ArrowUpRight size={14} className="text-slate-400" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-xs border border-emerald-200">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-700 hidden sm:inline">
                            {userName}
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Sign out"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
                
                {/* Header Greeting */}
                <div className="text-center sm:text-left pt-2 pb-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium mb-3">
                        <Sparkles size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
                        <span>Interactive Command Interface</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                        <span>{getGreeting()}, {userName}</span>
                        <Sparkles size={22} className="text-amber-500" />
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 max-w-xl">
                        Search equipment units, audit support contracts, or ask the assistant about expiring purchase orders across all customer accounts.
                    </p>
                </div>

                {/* Top Alert Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className={`p-2.5 rounded-xl shrink-0 ${summary.expiring > 0 || summary.expired > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Support Expiry Overview
                                    </h2>
                                    {summaryLoading ? (
                                        <RefreshCw size={12} className="animate-spin text-slate-400" />
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                            Live Monitor
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1">
                                    {summaryLoading ? (
                                        "Calculating contract statuses..."
                                    ) : (
                                        <>
                                            <span className="font-semibold text-amber-600">{summary.expiring}</span> purchase order{summary.expiring === 1 ? "" : "s"} expiring within 30 days
                                            {summary.expired > 0 && (
                                                <> and <span className="font-semibold text-rose-600">{summary.expired}</span> expired contract{summary.expired === 1 ? "" : "s"}</>
                                            )}.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Alert Card Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={() => handleExecuteQuery("expiring in 30 days")}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full transition-colors shadow-xs"
                            >
                                <Clock size={13} className="text-amber-600" />
                                <span>View Expiring POs</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard")}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-colors shadow-xs"
                            >
                                <LayoutDashboard size={13} className="text-slate-600" />
                                <span>Open Full Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conversational Prompt Box */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400 transition-all p-3.5 sm:p-4">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="relative flex items-center">
                            <Search size={18} className="absolute left-3 text-slate-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search by Customer, PO Number, Unit Code, or Hostname..."
                                className="w-full pl-9 pr-10 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent rounded-xl focus:outline-none"
                            />
                            {prompt && (
                                <button
                                    type="button"
                                    onClick={() => setPrompt("")}
                                    className="absolute right-2 text-xs text-slate-400 hover:text-slate-600 p-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Bottom Toolbar inside Prompt Box */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                            
                            {/* Left: Quick Actions Button (+) & Segmented Toggle Pill */}
                            <div className="flex items-center gap-2">
                                {/* Quick Actions (+) Button with Dropdown Menu */}
                                <div className="relative" ref={quickMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickMenu(!showQuickMenu)}
                                        title="Quick Actions"
                                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                                    >
                                        <Plus size={16} className={`transition-transform duration-200 ${showQuickMenu ? "rotate-45" : ""}`} />
                                    </button>

                                    {showQuickMenu && (
                                        <div className="absolute left-0 bottom-10 z-50 w-52 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                            <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Quick Create
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQuickMenu(false);
                                                    navigate("/import-excel");
                                                }}
                                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                                            >
                                                <Upload size={14} className="text-emerald-600" />
                                                <span>Import Excel Data</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQuickMenu(false);
                                                    navigate("/add-customer");
                                                }}
                                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                                            >
                                                <UserPlus size={14} className="text-blue-600" />
                                                <span>Add New Customer</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQuickMenu(false);
                                                    navigate("/add-purchase-order");
                                                }}
                                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                                            >
                                                <FilePlus size={14} className="text-amber-600" />
                                                <span>Add Purchase Order</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Segmented Toggle Pill: Quick Lookup | Full Dashboard */}
                                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                                    <button
                                        type="button"
                                        className="px-2.5 py-1 rounded-md font-semibold bg-white text-slate-900 shadow-xs"
                                    >
                                        Quick Lookup
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/dashboard")}
                                        className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        Full Dashboard
                                    </button>
                                </div>
                            </div>

                            {/* Right: Live Sync Counts & Submit Button */}
                            <div className="flex items-center gap-3">
                                <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                    <span>{summary.customers} Customers</span>
                                    <span>·</span>
                                    <span>{summary.purchaseOrders} POs</span>
                                    <span>·</span>
                                    <span>{summary.networkUnits} Units</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!prompt.trim() || loading}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors shadow-xs"
                                    title="Run Query"
                                >
                                    {loading ? (
                                        <RefreshCw size={14} className="animate-spin text-white" />
                                    ) : (
                                        <ArrowUp size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Quick Queries:</span>
                    <button
                        type="button"
                        onClick={() => handleExecuteQuery("expiring in 30 days")}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
                    >
                        Expiring in 30 days
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExecuteQuery("expired")}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
                    >
                        Expired POs
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExecuteQuery("without po")}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
                    >
                        Units without PO
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExecuteQuery("expiring in 60 days")}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
                    >
                        Expiring in 60 days
                    </button>
                </div>

                {/* Inline Results Area */}
                {loading && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center gap-3 text-center">
                        <RefreshCw size={24} className="animate-spin text-slate-600" />
                        <p className="text-sm font-medium text-slate-600">Querying support records & fleet units...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-700 text-sm">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-xs underline hover:no-underline font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {result && !loading && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                        {/* Summary Header */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                        Assistant Query
                                    </span>
                                    <span className="text-xs text-slate-400">"{result.prompt}"</span>
                                </div>
                                <p className="text-sm font-medium text-slate-900 mt-1">
                                    {result.summary}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/dashboard")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shrink-0"
                            >
                                <span>Jump to /dashboard</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Purchase Orders Section */}
                        {result.purchaseOrders && result.purchaseOrders.length > 0 && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-amber-500" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Purchase Orders ({result.purchaseOrders.length})
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/dashboard")}
                                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                                    >
                                        View in Dashboard →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.purchaseOrders.map((po) => (
                                        <div
                                            key={po._id}
                                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between gap-2.5"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 font-mono">
                                                        {po.poNumber}
                                                    </span>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        {po.customerName}
                                                    </p>
                                                </div>
                                                {renderExpiryBadge(po)}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
                                                <span>
                                                    Expiry: {po.expiryDate ? new Date(po.expiryDate).toLocaleDateString() : "No Date"}
                                                </span>
                                                {po.invoiceNumber && (
                                                    <span className="text-slate-400">
                                                        Inv: {po.invoiceNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Network Units Section */}
                        {result.networkUnits && result.networkUnits.length > 0 && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Server size={16} className="text-blue-500" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Network Units ({result.networkUnits.length})
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/dashboard")}
                                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                                    >
                                        Manage Fleet →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.networkUnits.map((unit) => (
                                        <div
                                            key={unit._id}
                                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between gap-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 font-mono">
                                                        {unit.unitCode}
                                                    </span>
                                                    {unit.hostname && (
                                                        <span className="text-xs text-slate-500 ml-2 font-mono">
                                                            ({unit.hostname})
                                                        </span>
                                                    )}
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        {unit.customerName}
                                                    </p>
                                                </div>
                                                {unit.hasPO ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        PO: {unit.poNumber}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                        Missing PO
                                                    </span>
                                                )}
                                            </div>

                                            {unit.radioConfiguration && (
                                                <div className="text-[11px] text-slate-400 font-mono pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5">
                                                    <Radio size={12} />
                                                    <span>{unit.radioConfiguration}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Customers Section */}
                        {result.customers && result.customers.length > 0 && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-indigo-500" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Customers ({result.customers.length})
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/customers")}
                                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                                    >
                                        Customer Directory →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {result.customers.map((c) => (
                                        <div
                                            key={c._id}
                                            onClick={() => navigate(`/customers`)}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-900 truncate max-w-[150px]">
                                                    {c.name}
                                                </span>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Eval Values Section */}
                        {result.evalValues && result.evalValues.length > 0 && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Radio size={16} className="text-purple-500" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            EVAL Units ({result.evalValues.length})
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/eval")}
                                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                                    >
                                        Open Eval Page →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.evalValues.map((ev) => (
                                        <div
                                            key={ev._id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono"
                                        >
                                            <div className="font-semibold text-slate-900">{ev.unit || "N/A"}</div>
                                            <div className="text-slate-500">Customer: {ev.customer || "N/A"}</div>
                                            <div className="text-slate-400">Host: {ev.hostname || "N/A"}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty results message */}
                        {(!result.purchaseOrders || result.purchaseOrders.length === 0) &&
                         (!result.networkUnits || result.networkUnits.length === 0) &&
                         (!result.customers || result.customers.length === 0) &&
                         (!result.evalValues || result.evalValues.length === 0) && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                                <p className="font-medium">No matching records found.</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Try searching by customer name, PO number (e.g. PO-100), or unit code.
                                </p>
                            </div>
                        )}

                        {/* Jump to Full Dashboard Banner */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                            <div>
                                <h4 className="text-sm font-semibold text-white">
                                    Need complete telemetry and visual analytics?
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Window 2 includes KPI summary cards, renewal donut charts, expiry timeline curves, and directory filters.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard")}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm shrink-0"
                            >
                                <LayoutDashboard size={14} />
                                <span>Switch to Dashboard (Window 2)</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Subtle Minimal Footer */}
            <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
                Command Center · Support Renewal Tracker · Window 1
            </footer>
        </div>
    );
};

export default HomeCommand;
