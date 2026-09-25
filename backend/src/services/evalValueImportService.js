import XLSX from "xlsx";

import EvalValue from "../models/EvalValue.js";


const cleanText = (value) => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim();

};


const normalizeKey = (value) => {

    return cleanText(value)
        .toLowerCase()
        .replace(/[\s_-]+/g, " ")
        .trim();

};


const findField = (
    row,
    aliases
) => {

    const keys =
        Object.keys(row);

    for (
        const key of keys
    ) {

        const normalized =
            normalizeKey(key);

        if (
            aliases.includes(
                normalized
            )
        ) {

            return key;

        }

    }

    return null;

};


const getField = (
    row,
    aliases
) => {

    const key =
        findField(
            row,
            aliases
        );

    if (!key) {

        return "";

    }

    return cleanText(
        row[key]
    );

};


// =====================================================
// EVAL FIELD ALIASES
// =====================================================

const UNIT_ALIASES = [
    "unit",
    "unit code",
    "unitcode"
];


const HOSTNAME_ALIASES = [
    "hostname",
    "host name"
];


const RADIO_ALIASES = [
    "radio config",
    "radio configuration",
    "radios",
    "radio"
];


const SHIPMENT_DATE_ALIASES = [
    "shipment date",
    "shipmentdate",
    "shipped date",
    "ship date"
];


const CUSTOMER_ALIASES = [
    "customer",
    "customer name"
];


// =====================================================
// FIND DEMOS SHEET
// =====================================================

const findDemosSheet = (
    workbook
) => {

    const sheetName =
        workbook.SheetNames.find(
            (name) =>
                name
                    .trim()
                    .toLowerCase() ===
                "demos"
        );

    if (!sheetName) {

        return null;

    }

    return workbook.Sheets[
        sheetName
    ];

};


// =====================================================
// FIND HEADER ROW
// =====================================================

const findHeaderRow = (
    sheet
) => {

    const rows =
        XLSX.utils.sheet_to_json(
            sheet,
            {
                header: 1,
                defval: ""
            }
        );


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i] || [];


        const normalized =
            row.map(
                (value) =>
                    normalizeKey(
                        value
                    )
            );


        const hasUnit =
            normalized.some(
                (value) =>
                    UNIT_ALIASES.includes(
                        value
                    )
            );


        const hasHostname =
            normalized.some(
                (value) =>
                    HOSTNAME_ALIASES.includes(
                        value
                    )
            );


        const hasCustomer =
            normalized.some(
                (value) =>
                    CUSTOMER_ALIASES.includes(
                        value
                    )
            );


        if (
            hasUnit &&
            hasHostname &&
            (
                hasCustomer ||
                normalized.some(
                    (value) =>
                        RADIO_ALIASES.includes(
                            value
                        )
                )
            )
        ) {

            return i;

        }

    }


    return -1;

};


// =====================================================
// GET DEMOS ROWS
// =====================================================

const getDemosRows = (
    workbook
) => {

    const sheet =
        findDemosSheet(
            workbook
        );


    if (!sheet) {

        return [];

    }


    const headerRow =
        findHeaderRow(
            sheet
        );


    if (
        headerRow === -1
    ) {

        return [];

    }


    return XLSX.utils.sheet_to_json(
        sheet,
        {
            range: headerRow,
            defval: "",
            raw: false
        }
    );

};


// =====================================================
// CHECK HEADER-LIKE ROW
// =====================================================

const isHeaderLikeRow = (
    row
) => {

    const unit =
        getField(
            row,
            UNIT_ALIASES
        );

    const hostname =
        getField(
            row,
            HOSTNAME_ALIASES
        );

    const customer =
        getField(
            row,
            CUSTOMER_ALIASES
        );


    const text =
        `${unit} ${hostname} ${customer}`
            .toLowerCase();


    return (
        text.includes("hostname") ||
        text === "unit" ||
        text === "customer"
    );

};


// =====================================================
// SAVE / UPDATE EVAL VALUE
// =====================================================

const saveEvalValue = async (
    row
) => {

    const unit =
        getField(
            row,
            UNIT_ALIASES
        );


    const hostname =
        getField(
            row,
            HOSTNAME_ALIASES
        );


    const radioConfig =
        getField(
            row,
            RADIO_ALIASES
        );


    const shipmentDate =
        getField(
            row,
            SHIPMENT_DATE_ALIASES
        );


    const customer =
        getField(
            row,
            CUSTOMER_ALIASES
        );


    if (
        !unit &&
        !hostname
    ) {

        return {
            skipped: true
        };

    }


    if (
        isHeaderLikeRow(
            row
        )
    ) {

        return {
            skipped: true
        };

    }


    const filter = {

        customer,

        unit,

        hostname

    };


    const update = {

        unit,

        hostname,

        radioConfig,

        shipmentDate,

        customer

    };


    await EvalValue.findOneAndUpdate(

        filter,

        update,

        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }

    );


    return {
        skipped: false
    };

};


// =====================================================
// IMPORT EVAL FROM SAME MAIN EXCEL
// =====================================================

export const importEvalValuesFromWorkbook =
    async (
        workbook
    ) => {

        const demosRows =
            getDemosRows(
                workbook
            );


        if (
            demosRows.length === 0
        ) {

            return {

                found: false,

                totalRows: 0,

                imported: 0,

                skipped: 0

            };

        }


        let imported = 0;

        let skipped = 0;


        for (
            const row of demosRows
        ) {

            const result =
                await saveEvalValue(
                    row
                );


            if (
                result.skipped
            ) {

                skipped++;

            } else {

                imported++;

            }

        }


        return {

            found: true,

            totalRows:
                demosRows.length,

            imported,

            skipped

        };

    };


// =====================================================
// GET ALL EVAL VALUES
// =====================================================

export const getEvalValues =
    async () => {

        return await EvalValue
            .find({})
            .sort({
                customer: 1,
                unit: 1
            })
            .lean();

    };


// =====================================================
// GET EVAL SUMMARY
// =====================================================

export const getEvalSummary =
    async () => {

        const records =
            await EvalValue
                .find({})
                .lean();


        const customers =
            new Set();


        const units =
            new Set();


        records.forEach(
            (record) => {

                if (
                    record.customer
                ) {

                    customers.add(
                        record.customer
                    );

                }


                if (
                    record.unit
                ) {

                    units.add(
                        record.unit
                    );

                }

            }
        );


        return {

            total:
                records.length,

            customers:
                customers.size,

            units:
                units.size

        };

    };