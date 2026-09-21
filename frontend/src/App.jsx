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
import ImportExcel from "./pages/imports/ImportExcel";
import ImportHistory from "./pages/imports/ImportHistory";
import AddCustomer from "./pages/customer/AddCustomer";
import AddPurchaseOrder from "./pages/purchaseOrder/AddPurchaseOrder";

import AddNetworkUnit from "./pages/networkUnit/AddNetworkUnit";
import ProtectedRoute from "./components/ProtectedRoute";


const App = () => {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />


                <Route
                    path="/login"
                    element={<Login />}
                />


                <Route
                    path="/register"
                    element={<Register />}
                />


                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/import-excel"
                    element={
                        <ProtectedRoute>
                            <ImportExcel />
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/import-history"
                    element={
                        <ProtectedRoute>
                            <ImportHistory />
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/add-customer"
                    element={
                        <ProtectedRoute>
                            <AddCustomer />
                        </ProtectedRoute>
                    }
                />
                <Route
    path="/add-purchase-order"
    element={
        <ProtectedRoute>
            <AddPurchaseOrder />
        </ProtectedRoute>
    }
/>

<Route
    path="/add-network-unit"
    element={
        <ProtectedRoute>
            <AddNetworkUnit />
        </ProtectedRoute>
    }
/>

            </Routes>

        </BrowserRouter>

    );
};


export default App;