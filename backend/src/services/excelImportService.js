import XLSX from "xlsx";

import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import Import from "../models/Import.js";


/* =========================================================
   BASIC HELPERS
========================================================= */

const cleanText = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
};


const normalizeKey = (value) => {
    return cleanText(value)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim();
};


/* =========================================================
   CUSTOMER NAME NORMALIZATION
========================================================= */

const normalizeCustomerName = (
    sheetName
) => {

    const original =
        cleanText(sheetName);

    const key =
        original
            .toLowerCase()
            .replace(/[\s_-]+/g, "");


    /*
     * CMIN belongs to Comcast.
     */
    if (key === "cmin") {
        return "Comcast";
    }


    if (
        key === "tataelxsi" ||
        key === "tataelxsiindia"
    ) {
        return "TataElxsi";
    }


    if (
        key === "technicolorvantiva" ||
        key === "technicolor" ||
        key === "vantiva"
    ) {
        return "Technicolor-Vantiva";
    }


    if (key === "altice") {
        return "Altice";
    }


    if (key === "cambium") {
        return "Cambium";
    }


    if (key === "commscope") {
        return "CommScope";
    }


    if (key === "fpt") {
        return "FPT";
    }


    if (key === "skyuk") {
        return "SkyUK";
    }


    return original;
};


/* =========================================================
   STANDARD FIELD ALIASES
========================================================= */

const STANDARD_FIELDS = {

    unitCode: [
        "unit",
        "unit code",
        "unitcode",
        "serial number",
        "serial no",
        "serial"
    ],

    hostname: [
        "hostname",
        "host name"
    ],

    radioConfiguration: [
        "radio configuration",
        "radio config",
        "radio",
        "radios"
    ],

    poNumber: [
        "po-details",
        "po -details",
        "po details",
        "po",
        "po number",
        "purchase order",
        "purchase order number"
    ],

    invoiceNumber: [
        "invoice number",
        "invoice no",
        "invoice",
        "asa number"
    ],

    supportExpiryDate: [
        "support expiry date",
        "support expiry",
        "expiry date",
        "support expirydate",
        "support expiry date "
    ]
};


/* =========================================================
   FIELD FINDERS
========================================================= */

const findField = (
    row,
    aliases
) => {

    const keys =
        Object.keys(row);


    for (
        const alias
        of aliases
    ) {

        const normalizedAlias =
            normalizeKey(alias);


        const found =
            keys.find(
                (key) =>
                    normalizeKey(key) ===
                    normalizedAlias
            );


        if (
            found !== undefined
        ) {
            return found;
        }
    }


    return null;
};


const getField = (
    row,
    aliases
) => {

    const field =
        findField(
            row,
            aliases
        );


    if (!field) {
        return "";
    }


    return cleanText(
        row[field]
    );
};


/* =========================================================
   DATE PARSER
========================================================= */

const parseExcelDate = (
    value
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }


    if (
        value instanceof Date
    ) {

        return isNaN(
            value.getTime()
        )
            ? null
            : value;
    }


    if (
        typeof value === "number"
    ) {

        const parsed =
            XLSX.SSF.parse_date_code(
                value
            );


        if (!parsed) {
            return null;
        }


        return new Date(
            parsed.y,
            parsed.m - 1,
            parsed.d,
            parsed.H || 0,
            parsed.M || 0,
            parsed.S || 0
        );
    }


    const text =
        cleanText(value);


    if (!text) {
        return null;
    }


    const date =
        new Date(text);


    if (
        !isNaN(
            date.getTime()
        )
    ) {
        return date;
    }


    return null;
};


/* =========================================================
   HEADER DETECTION
========================================================= */

const isHeaderRow = (
    row
) => {

    if (
        !Array.isArray(row)
    ) {
        return false;
    }


    const values =
        row.map(
            normalizeKey
        );


    const hasUnit =
        values.includes("unit") ||
        values.includes("unit code") ||
        values.includes("unitcode");


    const hasHostname =
        values.includes("hostname") ||
        values.includes("host name");


    const hasPO =
        values.includes("po-details") ||
        values.includes("po details") ||
        values.includes("po -details") ||
        values.includes("po");


    const hasRadio =
        values.includes(
            "radio configuration"
        ) ||
        values.includes(
            "radio config"
        ) ||
        values.includes(
            "radios"
        );


    return (
        hasUnit ||
        hasHostname ||
        hasPO ||
        hasRadio
    );
};


/* =========================================================
   SHEET → ROW OBJECTS
========================================================= */

const sheetToRows = (
    worksheet
) => {

    const matrix =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                header: 1,
                defval: ""
            }
        );


    const result = [];


    let currentHeaders =
        null;


    for (
        let rowIndex = 0;
        rowIndex < matrix.length;
        rowIndex++
    ) {

        const row =
            matrix[rowIndex];


        if (
            !row ||
            row.length === 0
        ) {
            continue;
        }


        if (
            isHeaderRow(row)
        ) {

            currentHeaders =
                row.map(
                    (header) =>
                        cleanText(header)
                );

            continue;
        }


        if (
            !currentHeaders
        ) {
            continue;
        }


        const objectRow = {};


        currentHeaders.forEach(
            (
                header,
                index
            ) => {

                if (!header) {
                    return;
                }


                objectRow[header] =
                    row[index] ?? "";
            }
        );


        const hasAnyValue =
            Object.values(
                objectRow
            ).some(
                (value) =>
                    cleanText(
                        value
                    ) !== ""
            );


        if (hasAnyValue) {

            result.push(
                objectRow
            );
        }
    }


    return result;
};


/* =========================================================
   JUNIPER SPECIAL SHEET
========================================================= */

const processJuniperSheet =
    async (
        worksheet,
        sheetName,
        stats
    ) => {

        const matrix =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    header: 1,
                    defval: ""
                }
            );


        const sections = [];


        for (
            let i = 0;
            i < matrix.length;
            i++
        ) {

            const row =
                matrix[i] || [];


            const normalized =
                row.map(
                    normalizeKey
                );


            const unitIndex =
                normalized.indexOf(
                    "unit"
                );


            const hostnameIndex =
                normalized.indexOf(
                    "hostname"
                );


            if (
                unitIndex !== -1 &&
                hostnameIndex !== -1
            ) {

                sections.push({
                    rowIndex: i,
                    startColumn:
                        unitIndex
                });
            }
        }


        if (
            sections.length === 0
        ) {

            const rows =
                sheetToRows(
                    worksheet
                );


            await processNormalRows(
                rows,
                sheetName,
                stats
            );

            return;
        }


        for (
            let sectionIndex = 0;
            sectionIndex <
            sections.length;
            sectionIndex++
        ) {

            const section =
                sections[
                    sectionIndex
                ];


            const nextSection =
                sections[
                    sectionIndex + 1
                ];


            const startRow =
                section.rowIndex + 1;


            const endRow =
                nextSection
                    ? nextSection.rowIndex
                    : matrix.length;


            const headers =
                matrix[
                    section.rowIndex
                ];


            const startColumn =
                section.startColumn;


            let endColumn =
                headers.length;


            for (
                let c =
                    startColumn + 1;
                c < headers.length;
                c++
            ) {

                const value =
                    normalizeKey(
                        headers[c]
                    );


                if (
                    value === "unit"
                ) {

                    endColumn = c;

                    break;
                }
            }


            const rows = [];


            for (
                let r =
                    startRow;
                r < endRow;
                r++
            ) {

                const source =
                    matrix[r];


                if (!source) {
                    continue;
                }


                const row = {};


                for (
                    let c =
                        startColumn;
                    c < endColumn;
                    c++
                ) {

                    const header =
                        cleanText(
                            headers[c]
                        );


                    if (!header) {
                        continue;
                    }


                    row[header] =
                        source[c] ?? "";
                }


                const hasValue =
                    Object.values(
                        row
                    ).some(
                        (value) =>
                            cleanText(
                                value
                            ) !== ""
                    );


                if (hasValue) {

                    rows.push(
                        row
                    );
                }
            }


            await processNormalRows(
                rows,
                sheetName,
                stats
            );
        }
    };


/* =========================================================
   ADDITIONAL FIELDS
========================================================= */

const buildAdditionalFields = (
    row,
    knownAliases
) => {

    const additional = {};


    const knownKeys =
        new Set(
            knownAliases.map(
                normalizeKey
            )
        );


    for (
        const [key, value]
        of Object.entries(row)
    ) {

        const normalized =
            normalizeKey(key);


        if (
            knownKeys.has(
                normalized
            )
        ) {
            continue;
        }


        const cleaned =
            cleanText(value);


        if (
            cleaned !== ""
        ) {

            additional[key] =
                cleaned;
        }
    }


    return additional;
};


/* =========================================================
   CUSTOMER
========================================================= */

const getOrCreateCustomer =
    async (
        customerName
    ) => {

        const cleanName =
            cleanText(
                customerName
            );


        if (!cleanName) {
            return null;
        }


        let customer =
            await Customer.findOne({
                name: cleanName
            });


        if (!customer) {

            customer =
                await Customer.create({
                    name:
                        cleanName,

                    additionalFields:
                        {}
                });
        }


        return customer;
    };


/* =========================================================
   PURCHASE ORDER
========================================================= */

const getOrCreatePO =
    async ({
        customerId,
        poNumber,
        invoiceNumber,
        supportExpiryDate,
        additionalFields
    }) => {

        if (
            !poNumber ||
            !customerId
        ) {
            return null;
        }


        let purchaseOrder =
            await PurchaseOrder.findOne({
                customerId,
                poNumber
            });


        if (!purchaseOrder) {

            purchaseOrder =
                await PurchaseOrder.create({

                    customerId,

                    poNumber,

                    invoiceNumber:
                        invoiceNumber ||
                        "",

                    supportExpiryDate:
                        supportExpiryDate ||
                        undefined,

                    additionalFields:
                        additionalFields ||
                        {}
                });


            return purchaseOrder;
        }


        let changed =
            false;


        if (
            invoiceNumber &&
            !purchaseOrder.invoiceNumber
        ) {

            purchaseOrder.invoiceNumber =
                invoiceNumber;

            changed = true;
        }


        if (
            supportExpiryDate &&
            !purchaseOrder.supportExpiryDate
        ) {

            purchaseOrder.supportExpiryDate =
                supportExpiryDate;

            changed = true;
        }


        if (
            additionalFields &&
            Object.keys(
                additionalFields
            ).length > 0
        ) {

            purchaseOrder.additionalFields =
                {
                    ...(purchaseOrder.additionalFields ||
                        {}),
                    ...additionalFields
                };

            changed = true;
        }


        if (changed) {
            await purchaseOrder.save();
        }


        return purchaseOrder;
    };


/* =========================================================
   NETWORK UNIT
========================================================= */

const getOrCreateUnit =
    async ({
        customerId,
        purchaseOrderId,
        unitCode,
        hostname,
        radioConfiguration,
        additionalFields
    }) => {

        if (
            !customerId ||
            !unitCode
        ) {
            return null;
        }


        const filter = {

            customerId,

            purchaseOrderId:
                purchaseOrderId ||
                null,

            unitCode,

            hostname:
                hostname || ""
        };


        let unit =
            await NetworkUnit.findOne(
                filter
            );


        if (!unit) {

            unit =
                await NetworkUnit.create({

                    customerId,

                    purchaseOrderId:
                        purchaseOrderId ||
                        null,

                    unitCode,

                    hostname:
                        hostname || "",

                    radioConfiguration:
                        radioConfiguration ||
                        "",

                    additionalFields:
                        additionalFields ||
                        {}
                });


            return unit;
        }


        let changed =
            false;


        if (
            radioConfiguration &&
            !unit.radioConfiguration
        ) {

            unit.radioConfiguration =
                radioConfiguration;

            changed = true;
        }


        if (
            additionalFields &&
            Object.keys(
                additionalFields
            ).length > 0
        ) {

            unit.additionalFields =
                {
                    ...(unit.additionalFields ||
                        {}),
                    ...additionalFields
                };

            changed = true;
        }


        if (changed) {
            await unit.save();
        }


        return unit;
    };


/* =========================================================
   PROCESS STANDARD ROW
========================================================= */

const processStandardRow =
    async ({
        row,
        customer,
        sheetName,
        stats
    }) => {

        const unitCode =
            getField(
                row,
                STANDARD_FIELDS.unitCode
            );


        const hostname =
            getField(
                row,
                STANDARD_FIELDS.hostname
            );


        const radioConfiguration =
            getField(
                row,
                STANDARD_FIELDS
                    .radioConfiguration
            );


        const poNumber =
            getField(
                row,
                STANDARD_FIELDS.poNumber
            );


        const invoiceNumber =
            getField(
                row,
                STANDARD_FIELDS
                    .invoiceNumber
            );


        const expiryField =
            findField(
                row,
                STANDARD_FIELDS
                    .supportExpiryDate
            );


        const supportExpiryDate =
            expiryField
                ? parseExcelDate(
                    row[expiryField]
                )
                : null;


        if (
            !unitCode &&
            !hostname &&
            !poNumber &&
            !radioConfiguration
        ) {
            return;
        }


        /*
         * FPT "New Systems" is a heading,
         * not a network unit.
         */
        const unitKey =
            normalizeKey(
                unitCode
            );


        if (
            unitKey ===
            "new systems"
        ) {
            return;
        }


        if (
            unitKey === "unit" ||
            unitKey === "hostname"
        ) {
            return;
        }


        const additionalFields =
            buildAdditionalFields(
                row,
                [
                    ...STANDARD_FIELDS
                        .unitCode,

                    ...STANDARD_FIELDS
                        .hostname,

                    ...STANDARD_FIELDS
                        .radioConfiguration,

                    ...STANDARD_FIELDS
                        .poNumber,

                    ...STANDARD_FIELDS
                        .invoiceNumber,

                    ...STANDARD_FIELDS
                        .supportExpiryDate
                ]
            );


        let purchaseOrder =
            null;


        /*
         * Create/reuse PO only when
         * the row actually contains a PO.
         */
        if (poNumber) {

            purchaseOrder =
                await getOrCreatePO({

                    customerId:
                        customer._id,

                    poNumber,

                    invoiceNumber,

                    supportExpiryDate,

                    additionalFields
                });


            if (
                purchaseOrder
            ) {

                stats
                    .purchaseOrdersCreatedOrFound++;
            }
        }


        /*
         * Customer is ALWAYS stored.
         *
         * If there is no PO,
         * purchaseOrderId is null.
         */
        const unit =
            await getOrCreateUnit({

                customerId:
                    customer._id,

                purchaseOrderId:
                    purchaseOrder
                        ? purchaseOrder._id
                        : null,

                unitCode,

                hostname,

                radioConfiguration,

                additionalFields
            });


        if (unit) {

            stats
                .unitsCreatedOrFound++;
        }
    };


/* =========================================================
   PROCESS NORMAL SHEET
========================================================= */

const processNormalRows =
    async (
        rows,
        sheetName,
        stats
    ) => {

        const customerName =
            normalizeCustomerName(
                sheetName
            );


        /*
         * Demos is no longer imported
         * into the main dashboard.
         *
         * EVAL_VALUE functionality was
         * removed from this project.
         */
        if (
            customerName.toLowerCase() ===
            "demos"
        ) {
            return;
        }


        /*
         * IMPORTANT:
         *
         * Customer is created even when
         * the sheet contains no data.
         *
         * This is required for SkyUK.
         */
        const customer =
            await getOrCreateCustomer(
                customerName
            );


        if (!customer) {
            return;
        }


        stats.customersSeen.add(
            customerName
        );


        for (
            const row
            of rows
        ) {

            await processStandardRow({
                row,
                customer,
                sheetName,
                stats
            });
        }
    };


/* =========================================================
   PROCESS STANDARD SHEET
========================================================= */

const processStandardSheet =
    async (
        workbook,
        sheetName,
        stats
    ) => {

        const worksheet =
            workbook.Sheets[
                sheetName
            ];


        if (!worksheet) {
            return;
        }


        /*
         * Juniper contains two separate
         * header/data sections.
         */
        if (
            normalizeKey(
                sheetName
            ) === "juniper"
        ) {

            await processJuniperSheet(
                worksheet,
                sheetName,
                stats
            );

            return;
        }


        const rows =
            sheetToRows(
                worksheet
            );


        await processNormalRows(
            rows,
            sheetName,
            stats
        );
    };


/* =========================================================
   MAIN IMPORT FUNCTION
========================================================= */

export const importExcelFile =
    async (
        file
    ) => {

        const stats = {

            customersSeen:
                new Set(),

            purchaseOrdersCreatedOrFound:
                0,

            unitsCreatedOrFound:
                0
        };


        let importRecord =
            null;


        try {

            if (!file) {

                throw new Error(
                    "No Excel file received"
                );
            }


            /*
             * cellDates MUST remain true
             * because Support Expiry Date
             * is stored as a MongoDB Date.
             */
            const workbook =
                XLSX.read(
                    file.buffer,
                    {
                        type:
                            "buffer",

                        cellDates:
                            true
                    }
                );


            importRecord =
                await Import.create({

                    fileName:
                        file.originalname ||
                        "uploaded.xlsx",

                    status:
                        "processing",

                    importedAt:
                        new Date()
                });


            /*
             * Process every worksheet.
             */
            for (
                const sheetName
                of workbook.SheetNames
            ) {

                const normalizedSheet =
                    normalizeKey(
                        sheetName
                    );


                /*
                 * Demos/EVAL is no longer
                 * part of the main dashboard.
                 */
                if (
                    normalizedSheet ===
                    "demos"
                ) {
                    continue;
                }


                await processStandardSheet(
                    workbook,
                    sheetName,
                    stats
                );
            }


            /* =================================================
               FINAL COUNTS
            ================================================= */

            const totalCustomers =
                await Customer.countDocuments();


            const totalPurchaseOrders =
                await PurchaseOrder.countDocuments();


            const totalUnits =
                await NetworkUnit.countDocuments();


            /* =================================================
               SHEET RESULTS
            ================================================= */

            const sheetResults =
                workbook.SheetNames.map(
                    (
                        sheetName
                    ) => ({

                        sheetName,

                        customerName:
                            normalizeCustomerName(
                                sheetName
                            ),

                        isImported:
                            normalizeKey(
                                sheetName
                            ) !==
                            "demos"
                    })
                );


            /* =================================================
               SAVE IMPORT RESULT
            ================================================= */

            importRecord.status =
                "completed";


            importRecord.totalCustomers =
                totalCustomers;


            importRecord.totalPurchaseOrders =
                totalPurchaseOrders;


            importRecord.totalUnits =
                totalUnits;


            importRecord.sheetResults =
                sheetResults;


            await importRecord.save();


            return {

                message:
                    "Excel imported successfully",

                fileName:
                    file.originalname,

                customers:
                    totalCustomers,

                purchaseOrders:
                    totalPurchaseOrders,

                networkUnits:
                    totalUnits,

                sheets:
                    workbook.SheetNames
            };

        } catch (error) {

            console.error(
                "Excel import error:",
                error
            );


            if (importRecord) {

                importRecord.status =
                    "failed";


                importRecord.errorMessage =
                    error.message;


                await importRecord.save();
            }


            throw error;
        }
    };