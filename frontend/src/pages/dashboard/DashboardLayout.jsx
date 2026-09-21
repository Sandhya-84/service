import React from "react";

import DashboardHeader from "./DashboardHeader";

import { useTheme } from "../../context/ThemeContext";


const DashboardLayout = ({
    children
}) => {

    const {
        darkMode
    } = useTheme();


    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "userName"
        );

        window.location.href =
            "/login";

    };


    return (

        <div
            className={
                darkMode
                    ? "min-h-screen bg-slate-950 text-white"
                    : "min-h-screen bg-slate-100 text-slate-900"
            }
        >

            <DashboardHeader
                onLogout={
                    handleLogout
                }
            />


            <main
                className="
                    ml-[280px]
                    mt-20
                    min-h-screen
                    px-4
                    py-6
                    sm:px-6
                    lg:px-8
                "
            >

                <div
                    className="
                        mx-auto
                        w-full
                        max-w-7xl
                    "
                >

                    {children}

                </div>

            </main>

        </div>

    );

};


export default DashboardLayout;