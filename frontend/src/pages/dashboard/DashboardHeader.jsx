import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";

const DashboardHeader = ({
    onLogout
}) => {

    const navigate = useNavigate();

    const {
        darkMode,
        toggleDarkMode
    } = useTheme();


    // =========================
    // USER NAME
    // =========================

    const [userName, setUserName] =
        useState("User");


    useEffect(() => {

        try {

            const savedUser =
                localStorage.getItem("user");

            const savedUserName =
                localStorage.getItem("userName");


            if (savedUserName) {

                setUserName(
                    savedUserName
                );

                return;

            }


            if (savedUser) {

                const parsedUser =
                    JSON.parse(
                        savedUser
                    );


                if (parsedUser?.name) {

                    setUserName(
                        parsedUser.name
                    );

                    return;

                }


                if (parsedUser?.user?.name) {

                    setUserName(
                        parsedUser.user.name
                    );

                    return;

                }

            }

        } catch (error) {

            console.error(
                "Failed to load user information:",
                error
            );

        }

    }, []);


    return (

        <>

            {/* ================================================= */}
            {/* TOP HEADER */}
            {/* ================================================= */}

            <header
                className={`
                    fixed
                    left-0
                    right-0
                    top-0
                    z-50
                    h-20
                    border-b
                    shadow-sm
                    ${
                        darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-white"
                    }
                `}
            >

                <div
                    className="
                        ml-60
                        flex
                        h-full
                        items-center
                        px-4
                        sm:px-6
                        lg:px-8
                    "
                >

                    <div
                        className="
                            mx-auto
                            flex
                            w-full
                            max-w-7xl
                            items-center
                            justify-between
                        "
                    >

                        {/* ========================= */}
                        {/* APP NAME */}
                        {/* ========================= */}

                        <div>

                            <h1
                                className={`
                                    text-2xl
                                    font-bold
                                    tracking-tight
                                    ${
                                        darkMode
                                            ? "text-white"
                                            : "text-slate-900"
                                    }
                                `}
                            >
                                Support Tracking System
                            </h1>


                            <p
                                className={`
                                    mt-0.5
                                    text-xs
                                    ${
                                        darkMode
                                            ? "text-slate-400"
                                            : "text-slate-500"
                                    }
                                `}
                            >
                                Customer support and purchase
                                order expiry management
                            </p>

                        </div>


                        {/* ========================= */}
                        {/* USER INFORMATION */}
                        {/* ========================= */}

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            {/* USER AVATAR */}

                            <div
                                className={`
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    font-semibold
                                    ${
                                        darkMode
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-emerald-100 text-emerald-700"
                                    }
                                `}
                            >
                                {userName
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>


                            {/* USER NAME */}

                            <div className="block">

                                <p
                                    className={`
                                        text-sm
                                        font-semibold
                                        leading-tight
                                        ${
                                            darkMode
                                                ? "text-white"
                                                : "text-slate-900"
                                        }
                                    `}
                                >
                                    {userName}
                                </p>


                                <p
                                    className={`
                                        mt-0.5
                                        text-xs
                                        font-medium
                                        leading-tight
                                        ${
                                            darkMode
                                                ? "text-slate-400"
                                                : "text-slate-500"
                                        }
                                    `}
                                >
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </header>


            {/* ================================================= */}
            {/* LEFT SIDEBAR */}
            {/* ================================================= */}

            <aside
                className={`
                    fixed
                    bottom-0
                    left-0
                    top-20
                    z-40
                    flex
                    w-60
                    flex-col
                    border-r
                    ${
                        darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-white"
                    }
                `}
            >

                {/* ========================= */}
                {/* NAVIGATION */}
                {/* ========================= */}

                <div
                    className="
                        flex-1
                        space-y-3
                        overflow-y-auto
                        p-4
                    "
                >

                    {/* ========================= */}
                    {/* ADD CUSTOMER */}
                    {/* ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/add-customer"
                            )
                        }
                        className="
                            w-full
                            rounded-lg
                            bg-blue-600
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-blue-700
                        "
                    >
                        Add Customer
                    </button>


                    {/* ========================= */}
                    {/* ADD PO */}
                    {/* ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/add-purchase-order"
                            )
                        }
                        className="
                            w-full
                            rounded-lg
                            bg-indigo-600
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-indigo-700
                        "
                    >
                        Add PO
                    </button>


                    {/* ========================= */}
                    {/* IMPORT EXCEL */}
                    {/* ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/import-excel"
                            )
                        }
                        className="
                            w-full
                            rounded-lg
                            bg-emerald-600
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-emerald-700
                        "
                    >
                        Import Excel
                    </button>


                    {/* ========================= */}
                    {/* IMPORT HISTORY */}
                    {/* ========================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/import-history"
                            )
                        }
                        className={`
                            w-full
                            rounded-lg
                            border
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            transition
                            ${
                                darkMode
                                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            }
                        `}
                    >
                        Import History
                    </button>

                </div>


                {/* ========================= */}
                {/* BOTTOM ACTIONS */}
                {/* ========================= */}

                <div
                    className={`
                        border-t
                        p-4
                        ${
                            darkMode
                                ? "border-slate-800"
                                : "border-slate-200"
                        }
                    `}
                >

                    {/* ========================= */}
                    {/* DARK MODE */}
                    {/* ========================= */}

                    <button
                        type="button"
                        onClick={
                            toggleDarkMode
                        }
                        className={`
                            mb-3
                            w-full
                            rounded-lg
                            border
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            transition
                            ${
                                darkMode
                                    ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            }
                        `}
                    >
                        {darkMode
                            ? "Light Mode"
                            : "Dark Mode"}
                    </button>


                    {/* ========================= */}
                    {/* LOGOUT */}
                    {/* ========================= */}

                    <button
                        type="button"
                        onClick={
                            onLogout
                        }
                        className="
                            w-full
                            rounded-lg
                            bg-red-600
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-red-700
                        "
                    >
                        Logout
                    </button>

                </div>

            </aside>

        </>

    );

};

export default DashboardHeader;