import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.name ||
            !formData.email ||
            !formData.password
        ) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);

            const response = await registerUser(formData);

            console.log("Register response:", response);

            setSuccess(
                "Registration successful. Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1200);

        } catch (error) {
            console.error("Registration error:", error);

            setError(
                error.response?.data?.message ||
                "Registration failed"
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
                        Create your account
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    <h2 className="text-2xl font-semibold text-[#0C1416]">
                        Register
                    </h2>

                    <p className="text-sm text-slate-500 mt-1 mb-6">
                        Create an account to access the tracker
                    </p>

                    {error && (
                        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

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
                                placeholder="Create a password"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create Account"}
                        </button>

                    </form>

                    {/* Login link */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            Login
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Register;