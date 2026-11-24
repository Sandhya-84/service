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
    RefreshCw,
    Activity,
    BarChart2,
    Users,
    History,
    Calendar,
    Layers
} from "lucide-react";
import { queryAssistant, getAssistantSummary, getAssistantHealth } from "../../api/assistantApi";

const HomeCommand = () => {
    const navigate = useNavigate();

    // User State
    const [userName, setUserName] = useState("User");

    // Query State
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [mcpConnected, setMcpConnected] = useState(true);

    // Quick Action Menu State
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const quickMenuRef = useRef(null);

    // Input Ref
    const inputRef = useRef(null);

    // Load User and Health on mount
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

        getAssistantHealth()
            .then(health => {
                if (health?.mcp) {
                    setMcpConnected(health.mcp.connected !== false);
                }
            })
            .catch(() => {});
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
        if (po.status === "active") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Active {po.daysRemaining !== null ? `(${po.daysRemaining}d left)` : ""}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                No Expiry Date
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
                        <span className="text-base font-semibold text-slate-900 tracking-tight">
                            Command Center
                        </span>
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
                        <span>Open Dashboard</span>
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
                
                {/* Minimal Greeting Header */}
                <div className="text-center pt-4 pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
                        <span>Welcome back, {userName}</span>
                        <Sparkles size={22} className="text-amber-500 fill-amber-400/40" />
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500 max-w-lg mx-auto">
                        Ask anything about Customers, Purchase Orders, Hardware Units, or Expirations.
                    </p>
                </div>

                {/* Clean Prompt Container */}
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
                                placeholder="Ask anything about Customers, POs, Units, or Expiries..."
                                className="w-full pl-9 pr-10 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent rounded-xl focus:outline-none"
                                autoFocus
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
                            
                            {/* Left: Quick Actions Button (+) */}
                            <div className="flex items-center gap-2">
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
                            </div>

                            {/* Right: AI Ready & Submit Button */}
                            <div className="flex items-center gap-2.5">
                                {mcpConnected && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span>AI Ready</span>
                                    </div>
                                )}

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
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs">
                                        <Sparkles size={11} className="text-amber-400" />
                                        {result.engine || "AI Assistant"}
                                    </span>
                                    {result.nlp?.intent && (
                                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            Intent: {result.nlp.intent}
                                        </span>
                                    )}
                                    {result.nlp?.resolvedCompany && (
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Target: {result.nlp.resolvedCompany}
                                        </span>
                                    )}
                                    {result.nlp?.parsedDays && (
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                            Period: {result.nlp.parsedDays}d
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400 truncate max-w-xs">"{result.prompt}"</span>
                                </div>
                                <p className="text-sm font-medium text-slate-900 mt-2 leading-relaxed">
                                    {result.summary}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/dashboard")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shrink-0"
                            >
                                <span>Go to Dashboard</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Company Dossier Card */}
                        {result.companyDetails && (
                            <div className="bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                                            {result.companyDetails.customer?.name?.charAt(0)?.toUpperCase() || "C"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-slate-900">
                                                    {result.companyDetails.customer?.name}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    Company Dossier
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Unified profile · Contracts, hardware fleet & support routing
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/customers")}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                                    >
                                        <Building2 size={13} />
                                        <span>Customer Directory</span>
                                    </button>
                                </div>

                                {/* Stats Breakdown Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                                            Purchase Orders
                                        </span>
                                        <span className="text-xl font-bold text-slate-900 mt-1 block">
                                            {result.companyDetails.stats?.totalPOs ?? result.purchaseOrders?.length ?? 0}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                            <span className="text-emerald-600 font-semibold">{result.companyDetails.stats?.activePOs || 0} active</span>
                                            <span>·</span>
                                            <span className="text-amber-600 font-semibold">{result.companyDetails.stats?.expiringPOs || 0} exp</span>
                                            <span>·</span>
                                            <span className="text-rose-600 font-semibold">{result.companyDetails.stats?.expiredPOs || 0} past</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                                            Network Units
                                        </span>
                                        <span className="text-xl font-bold text-slate-900 mt-1 block">
                                            {result.companyDetails.stats?.totalUnits ?? result.networkUnits?.length ?? 0}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                            <span className="text-blue-600 font-semibold">{result.companyDetails.stats?.assignedUnits || 0} on PO</span>
                                            <span>·</span>
                                            <span className="text-rose-600 font-semibold">{result.companyDetails.stats?.unassignedUnits || 0} unassigned</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                                            Assigned Teams
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800 mt-1 block truncate">
                                            {result.companyDetails.stats?.teams?.length > 0
                                                ? result.companyDetails.stats.teams.join(", ")
                                                : "General Support"}
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-1 block">
                                            Internal operational team
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                                            Eval Lab Records
                                        </span>
                                        <span className="text-xl font-bold text-slate-900 mt-1 block">
                                            {result.evalValues?.length || 0}
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-1 block">
                                            Test & shipment units
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Stats Section */}
                        {result.systemStats && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                                    <BarChart2 size={16} className="text-indigo-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        System-Wide Fleet & Contract Telemetry
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total Customers</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">{result.systemStats.customers}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Active accounts</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Purchase Orders</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">{result.systemStats.purchaseOrders}</div>
                                        <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                                            {result.systemStats.expiring} expiring
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Network Units</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">{result.systemStats.networkUnits}</div>
                                        <div className="text-[11px] text-amber-600 font-medium mt-0.5">
                                            {result.systemStats.missingPO} unassigned
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Expired Contracts</div>
                                        <div className="text-2xl font-bold text-rose-600 mt-1">{result.systemStats.expired}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Requires renewal</div>
                                    </div>
                                </div>
                            </div>
                        )}

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

                                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                                    {result.purchaseOrders.map((po) => (
                                        <div
                                            key={po._id}
                                            className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-slate-900 font-mono">
                                                            {po.poNumber}
                                                        </span>
                                                        {renderExpiryBadge(po)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                        <span>{po.customerName}</span>
                                                        {po.invoiceNumber && (
                                                            <>
                                                                <span>·</span>
                                                                <span>Inv: {po.invoiceNumber}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-left sm:text-right text-xs">
                                                <div className="font-medium text-slate-700">
                                                    Expiry: {po.expiryDate ? new Date(po.expiryDate).toLocaleDateString() : "No Date"}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {po.team ? `Team: ${po.team}` : "Candela Support"}
                                                </div>
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
                                        <Server size={16} className="text-blue-600" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Network Units ({result.networkUnits.length})
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/dashboard")}
                                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                                    >
                                        Full Inventory →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto p-1">
                                    {result.networkUnits.map((unit) => (
                                        <div
                                            key={unit._id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between text-xs"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                                                    <span>{unit.unitCode}</span>
                                                    {unit.hasPO ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Linked
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                            No PO
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-slate-600 mt-1 font-sans truncate font-medium">
                                                    {unit.hostname || "No Hostname"}
                                                </div>
                                                <div className="text-slate-400 text-[11px] mt-0.5 truncate">
                                                    {unit.customerName}
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                                                <span className="font-mono truncate">{unit.poNumber}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Customer List Section */}
                        {result.customers && result.customers.length > 0 && !result.companyDetails && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-indigo-600" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Customer Accounts ({result.customers.length})
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
                                            onClick={() => handleExecuteQuery(`units of ${c.name}`)}
                                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                                    {c.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-xs text-slate-900 block">{c.name}</span>
                                                    <span className="text-[11px] text-slate-400">Click to view dossier</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty results message */}
                        {(!result.purchaseOrders || result.purchaseOrders.length === 0) &&
                         (!result.networkUnits || result.networkUnits.length === 0) &&
                         (!result.customers || result.customers.length === 0) &&
                         (!result.evalValues || result.evalValues.length === 0) &&
                         !result.systemStats && !result.companyDetails && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                                <p className="font-medium">No matching records found.</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Try searching by company name (e.g. "Capgemini"), PO number, unit code, or type "summary".
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Subtle Minimal Footer */}
            <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
                Command Center · Support Renewal Tracker
            </footer>
        </div>
    );
};

export default HomeCommand;
