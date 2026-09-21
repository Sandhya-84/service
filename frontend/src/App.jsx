import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import RecentActivity from "./pages/dashboard/RecentActivity";

import ImportExcel from "./pages/imports/ImportExcel";
import ImportHistory from "./pages/imports/ImportHistory";

import AddCustomer from "./pages/customer/AddCustomer";
import AddPurchaseOrder from "./pages/purchaseOrder/AddPurchaseOrder";

import AddNetworkUnit from "./pages/networkUnit/AddNetworkUnit";

import ProtectedRoute from "./components/ProtectedRoute";

import DashboardLayout from "./pages/dashboard/DashboardLayout";


const App = () => {

    return (

        <BrowserRouter>

            <Routes>

                {/* DEFAULT */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />


                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                {/* REGISTER */}

                <Route
                    path="/register"
                    element={
                        <Register />
                    }
                />


                {/* DASHBOARD */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <Dashboard />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />


                {/* RECENT ACTIVITY */}

                <Route
                    path="/recent-activity"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <RecentActivity />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />


                {/* IMPORT EXCEL */}

                <Route
                    path="/import-excel"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <ImportExcel />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />


                {/* IMPORT HISTORY */}

                <Route
                    path="/import-history"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <ImportHistory />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />


                {/* ADD CUSTOMER */}

                <Route
                    path="/add-customer"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <AddCustomer />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />


                {/* ADD PURCHASE ORDER */}

                <Route
                    path="/add-purchase-order"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <AddPurchaseOrder />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />


                {/* ADD NETWORK UNIT */}

                <Route
                    path="/add-network-unit"
                    element={
                        <ProtectedRoute>

                            <DashboardLayout>

                                <AddNetworkUnit />

                            </DashboardLayout>

                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>

    );

};


export default App;