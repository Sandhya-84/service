import React from "react";

const NetworkUnitsTable = ({
    units,
    darkMode
}) => {

    return (
        <div className="mt-4">

            <h4 className="mb-3 text-sm font-semibold">
                Network Units
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200">

                <table className="min-w-full text-left text-sm">

                    <thead
                        className={
                            darkMode
                                ? "bg-slate-800"
                                : "bg-slate-100"
                        }
                    >

                        <tr>

                            <th className="px-4 py-3 font-semibold">
                                Unit
                            </th>

                            <th className="px-4 py-3 font-semibold">
                                Hostname
                            </th>

                            <th className="px-4 py-3 font-semibold">
                                Radio Configuration
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {units?.length > 0 ? (

                            units.map((unit) => (

                                <tr
                                    key={unit._id}
                                    className={
                                        darkMode
                                            ? "border-t border-slate-800"
                                            : "border-t border-slate-200"
                                    }
                                >

                                    <td className="data-text px-4 py-3">
                                        {unit.unitCode}
                                    </td>

                                    <td className="data-text px-4 py-3">
                                        {unit.hostname || "—"}
                                    </td>

                                    <td className="data-text px-4 py-3">
                                        {unit.radioConfiguration || "—"}
                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="3"
                                    className="px-4 py-6 text-center text-slate-500"
                                >
                                    No network units found.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default NetworkUnitsTable;