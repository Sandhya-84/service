import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi";

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            const response = await loginUser(formData);

            console.log("Login response:", response);

            // Save JWT token
            localStorage.setItem(
                "token",
                response.token
            );

            // Save user information
            localStorage.setItem(
                "user",
                JSON.stringify(response.user)
            );

            console.log(
                "Token saved:",
                localStorage.getItem("token")
            );

            navigate("/dashboard");

        } catch (error) {
            console.error("Login error:", error);

            setError(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F6F6] flex items-center justify-center px-4 py-8">

            <div className="w-full max-w-md">

                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#0C1416]">
                        Support Renewal Tracker
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage support, units and renewals
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    <h2 className="text-2xl font-semibold text-[#0C1416]">
                        Welcome Back
                    </h2>

                    <p className="text-sm text-slate-500 mt-1 mb-6">
                        Login to continue to your dashboard
                    </p>

                    {error && (
                        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                autoComplete="email"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Logging in..."
                                : "Login"}
                        </button>

                    </form>

                    {/* Register */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            Create Account
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Login;