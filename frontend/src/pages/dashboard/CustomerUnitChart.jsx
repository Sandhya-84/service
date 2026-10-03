import React, { useMemo } from "react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const CustomerUnitChart = ({ customers = [], darkMode }) => {
    const chartData = useMemo(() => {
        return customers
            .map((customer) => {
                const totalUnits = (customer.purchaseOrders || []).reduce(
                    (total, po) => total + (po.units || []).length,
                    0
                );

                return {
                    name:
                        customer.companyName ||
                        customer.name ||
                        "Unnamed Company",
                    units: totalUnits
                };
            })
            .sort((a, b) => b.units - a.units);
    }, [customers]);

    return (
        <div
            className={
                darkMode
                    ? "mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5"
                    : "mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            }
        >
            <div className="mb-4">
                <h2 className="font-sora text-lg font-semibold">
                    Customer-wise Network Unit Distribution
                </h2>

                <p
                    className={
                        darkMode
                            ? "text-sm text-slate-400"
                            : "text-sm text-slate-500"
                    }
                >
                    Total network units registered under each company
                </p>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={darkMode ? "#334155" : "#e2e8f0"}
                        />

                        <XAxis
                            dataKey="name"
                            tick={{
                                fill: darkMode ? "#cbd5e1" : "#475569",
                                fontSize: 12
                            }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={65}
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{
                                fill: darkMode ? "#cbd5e1" : "#475569"
                            }}
                        />

                        <Tooltip />

                        <Bar
                            dataKey="units"
                            name="Network Units"
                            fill="#2563eb"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomerUnitChart;