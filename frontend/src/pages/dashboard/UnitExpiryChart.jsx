import React, { useMemo, useState } from "react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const UnitExpiryChart = ({ customers = [], darkMode }) => {
    const [selectedCompany, setSelectedCompany] = useState("all");

    const chartData = useMemo(() => {
        const selectedCustomers =
            selectedCompany === "all"
                ? customers
                : customers.filter(
                      (customer) => customer._id === selectedCompany
                  );

        const counts = {
            Expired: 0,
            "0–30 Days": 0,
            "31–60 Days": 0,
            "61–90 Days": 0,
            "90+ Days": 0,
            "No Expiry": 0
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        selectedCustomers.forEach((customer) => {
            (customer.purchaseOrders || []).forEach((po) => {
                (po.units || []).forEach((unit) => {
                    const expiryDate =
                        unit.supportExpiryDate ||
                        unit.expiryDate ||
                        po.supportExpiryDate;

                    if (!expiryDate) {
                        counts["No Expiry"]++;
                        return;
                    }

                    const expiry = new Date(expiryDate);

                    if (Number.isNaN(expiry.getTime())) {
                        counts["No Expiry"]++;
                        return;
                    }

                    expiry.setHours(0, 0, 0, 0);

                    const daysLeft = Math.ceil(
                        (expiry.getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24)
                    );

                    if (daysLeft < 0) {
                        counts.Expired++;
                    } else if (daysLeft <= 30) {
                        counts["0–30 Days"]++;
                    } else if (daysLeft <= 60) {
                        counts["31–60 Days"]++;
                    } else if (daysLeft <= 90) {
                        counts["61–90 Days"]++;
                    } else {
                        counts["90+ Days"]++;
                    }
                });
            });
        });

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));
    }, [customers, selectedCompany]);

    return (
        <div
            className={
                darkMode
                    ? "mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5"
                    : "mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            }
        >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-sora text-lg font-semibold">
                        Company-wise Unit Expiry Analysis
                    </h2>

                    <p
                        className={
                            darkMode
                                ? "text-sm text-slate-400"
                                : "text-sm text-slate-500"
                        }
                    >
                        Number of network units by expiry period
                    </p>
                </div>

                <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className={
                        darkMode
                            ? "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                            : "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    }
                >
                    <option value="all">All Companies</option>

                    {customers.map((customer) => (
                        <option
                            key={customer._id}
                            value={customer._id}
                        >
                            {customer.companyName ||
                                customer.name ||
                                "Unnamed Company"}
                        </option>
                    ))}
                </select>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={darkMode ? "#334155" : "#e2e8f0"}
                        />

                        <XAxis
                            dataKey="name"
                            interval={0}
                            tick={{
                                fill: darkMode ? "#cbd5e1" : "#475569",
                                fontSize: 12
                            }}
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{
                                fill: darkMode ? "#cbd5e1" : "#475569"
                            }}
                        />

                        <Tooltip />

                        <Bar
                            dataKey="value"
                            name="Network Units"
                            fill="#0d9488"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UnitExpiryChart;