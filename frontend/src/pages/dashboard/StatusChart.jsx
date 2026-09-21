import React from "react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";


const StatusChart = ({
    summary,
    darkMode
}) => {

    const chartData = [
        {
            name: "Active",
            value: Number(summary.active) || 0,
            color: "#16a34a"
        },
        {
            name: "Expiring ≤ 30 Days",
            value: Number(summary.expiring) || 0,
            color: "#f59e0b"
        },
        {
            name: "Expired",
            value: Number(summary.expired) || 0,
            color: "#dc2626"
        },
        {
            name: "No Expiry Date",
            value: Number(summary.noExpiryDate) || 0,
            color: "#64748b"
        }
    ];

    const total =
        chartData.reduce(
            (sum, item) => sum + item.value,
            0
        );


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
                    Purchase Order Status
                </h2>

                <p
                    className={
                        darkMode
                            ? "text-sm text-slate-400"
                            : "text-sm text-slate-500"
                    }
                >
                    Current support expiry status
                </p>

            </div>


            <div className="h-80 w-full">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <PieChart>

                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={115}
                            paddingAngle={3}
                            label
                        >

                            {chartData.map(
                                (entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                )
                            )}

                        </Pie>


                        <Tooltip />


                        <Legend />

                    </PieChart>

                </ResponsiveContainer>

            </div>


            <div className="text-center">

                <p className="text-sm text-slate-500">
                    Total Purchase Orders
                </p>

                <p className="font-sora text-2xl font-bold">
                    {total}
                </p>

            </div>

        </div>
    );
};


export default StatusChart;