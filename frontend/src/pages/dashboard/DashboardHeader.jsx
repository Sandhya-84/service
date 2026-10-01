
import React, {
    useEffect,
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    LayoutDashboard,
    Building2,
    UserPlus,
    FilePlus,
    Upload,
    Square,
    ArrowUpDown,
    Activity,
    Sun,
    Moon,
    LogOut
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

const DashboardHeader = ({ onLogout }) => {

    const navigate = useNavigate();
    const location = useLocation();

    const {
        darkMode,
        toggleDarkMode
    } = useTheme();

    const [userName, setUserName] = useState("User");

    useEffect(() => {

        try {

            const savedUser =
                localStorage.getItem("user");

            const savedUserName =
                localStorage.getItem("userName");

            if (savedUserName) {
                setUserName(savedUserName);
                return;
            }

            if (savedUser) {

                const parsedUser = JSON.parse(savedUser);

                if (parsedUser?.name) {
                    setUserName(parsedUser.name);
                    return;
                }

                if (parsedUser?.user?.name) {
                    setUserName(parsedUser.user.name);
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


    const menuItems = [

        {
            label: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard
        },

        {
            label: "Customer Directory",
            path: "/customers",
            icon: Building2
        },

        {
            label: "Add Customer",
            path: "/add-customer",
            icon: UserPlus
        },

        {
            label: "Add PO",
            path: "/add-purchase-order",
            icon: FilePlus
        },

        {
            label: "Import Excel",
            path: "/import-excel",
            icon: Upload
        },

        {
            label: "EVAL Units",
            path: "/eval",
            icon: Square
        },

        {
            label: "Import History",
            path: "/import-history",
            icon: ArrowUpDown
        },

        {
            label: "Recent Activity",
            path: "/recent-activity",
            icon: Activity
        }

    ];


    return (

        <>

            {/* TOP HEADER */}

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
                        ml-[280px]
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
                            max-w-[1500px]
                            items-center
                            justify-between
                        "
                    >

                        <div>

                            <h1
                                className={`
                                    text-3xl
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
                                    text-sm
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


                        {/* USER */}

                        <div className="flex items-center gap-5">

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
                                {userName.charAt(0).toUpperCase()}
                            </div>

                            <div>

                                <p
                                    className={`
                                        text-base
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

                            </div>

                        </div>

                    </div>

                </div>

            </header>


            {/* SIDEBAR */}

            <aside
                className={`
                    fixed
                    bottom-0
                    left-0
                    top-20
                    z-40
                    flex
                    w-[280px]
                    flex-col
                    border-r
                    ${
                        darkMode
                            ? "border-slate-800 bg-slate-950"
                            : "border-slate-200 bg-white"
                    }
                `}
            >

                <nav className="flex-1 overflow-y-auto px-4 py-6">

                    <p
                        className={`
                            mb-4
                            px-3
                            text-sm
                            font-semibold
                            uppercase
                            tracking-wider
                            ${
                                darkMode
                                    ? "text-slate-500"
                                    : "text-slate-400"
                            }
                        `}
                    >
                        Navigation
                    </p>

                    <div className="space-y-2">

                        {menuItems.map((item) => {

                            const active =
                                location.pathname === item.path;

                            const Icon = item.icon;

                            return (

                                <button
                                    key={item.path}
                                    type="button"
                                    onClick={() => navigate(item.path)}
                                    className={`
                                        flex
                                        w-full
                                        items-center
                                        gap-4
                                        rounded-xl
                                        px-4
                                        py-3
                                        text-left
                                        text-base
                                        font-medium
                                        transition-all
                                        ${
                                            active
                                                ? darkMode
                                                    ? "bg-emerald-500/15 text-emerald-400"
                                                    : "bg-emerald-50 text-emerald-700"
                                                : darkMode
                                                    ? "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        }
                                    `}
                                >

                                    <Icon
                                        size={20}
                                        strokeWidth={1.8}
                                        className="shrink-0"
                                    />

                                    <span className="whitespace-nowrap">
                                        {item.label}
                                    </span>

                                </button>

                            );

                        })}

                    </div>

                </nav>


                {/* BOTTOM MENU */}

                <div
                    className={`
                        border-t
                        px-4
                        py-5
                        ${
                            darkMode
                                ? "border-slate-800"
                                : "border-slate-200"
                        }
                    `}
                >

                    {/* DARK MODE */}

                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className={`
                            mb-2
                            flex
                            w-full
                            items-center
                            gap-4
                            rounded-xl
                            px-4
                            py-3
                            text-left
                            text-sm
                            font-medium
                            transition
                            ${
                                darkMode
                                    ? "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }
                        `}
                    >

                        {darkMode
                            ? <Sun size={20} />
                            : <Moon size={20} />
                        }

                        <span>
                            {darkMode ? "Light Mode" : "Dark Mode"}
                        </span>

                    </button>


                    {/* LOGOUT */}

                    <button
                        type="button"
                        onClick={onLogout}
                        className={`
                            flex
                            w-full
                            items-center
                            gap-4
                            rounded-xl
                            px-4
                            py-3
                            text-left
                            text-sm
                            font-medium
                            transition
                            ${
                                darkMode
                                    ? "text-red-400 hover:bg-red-950/40"
                                    : "text-red-600 hover:bg-red-50"
                            }
                        `}
                    >

                        <LogOut size={20} />

                        <span>Logout</span>

                    </button>

                </div>

            </aside>

        </>

    );

};

export default DashboardHeader;