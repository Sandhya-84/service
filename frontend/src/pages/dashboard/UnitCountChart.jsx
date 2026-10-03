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

const UnitCountChart = ({ customers = [], darkMode }) => {
    const [selectedCompany, setSelectedCompany] = useState("all");

    const chartData = useMemo(() => {
        const selectedCustomers =
            selectedCompany === "all"
                ? customers
                : customers.filter(
                      (customer) => customer._id === selectedCompany
                  );

        const unitCounts = {};

        selectedCustomers.forEach((customer) => {
            (customer.purchaseOrders || []).forEach((po) => {
                (po.units || []).forEach((unit) => {
                    const unitCode = unit.unitCode || "Unknown";

                    unitCounts[unitCode] =
                        (unitCounts[unitCode] || 0) + 1;
                });
            });
        });

        return Object.entries(unitCounts)
            .map(([name, count]) => ({
                name,
                count
            }))
            .sort((a, b) => b.count - a.count);
    }, [customers, selectedCompany]);

    // Add space above the highest value
    const maxCount = Math.max(
        0,
        ...chartData.map((item) => item.count)
    );

    const yAxisMax = Math.max(
        5,
        Math.ceil(maxCount * 1.25)
    );

    const axisColor = darkMode ? "#cbd5e1" : "#475569";
    const gridColor = darkMode ? "#334155" : "#e2e8f0";

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
                        Network Unit Distribution
                    </h2>

                    <p
                        className={
                            darkMode
                                ? "text-sm text-slate-400"
                                : "text-sm text-slate-500"
                        }
                    >
                        Number of network units by unit code
                    </p>
                </div>

                <select
                    value={selectedCompany}
                    onChange={(e) =>
                        setSelectedCompany(e.target.value)
                    }
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
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 15,
                            right: 20,
                            bottom: 10,
                            left: 10
                        }}
                        barCategoryGap="60%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                        />

                        <XAxis
                            dataKey="name"
                            interval={0}
                            tick={{
                                fill: axisColor,
                                fontSize: 11
                            }}
                        />

                        <YAxis
                            allowDecimals={false}
                            domain={[0, yAxisMax]}
                            tick={{
                                fill: axisColor
                            }}
                            label={{
                                value: "Number of Units",
                                angle: -90,
                                position: "insideLeft",
                                fill: axisColor
                            }}
                        />

                        <Tooltip />

                        <Bar
                            dataKey="count"
                            name="Number of Units"
                            fill="#3B82F6"
                            maxBarSize={42}
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UnitCountChart;