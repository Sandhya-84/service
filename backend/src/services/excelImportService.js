import XLSX from "xlsx";

import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import Import from "../models/Import.js";
import EvalValue from "../models/EvalValue.js";


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
     * IMPORTANT:
     *
     * Comcast and CMIN are the SAME customer.
     *
     * Both sheets are stored under:
     *
     *             Comcast
     *
     * Therefore their POs and units are
     * combined under the same customerId.
     */
    if (
        key === "comcast" ||
        key === "cmin"
    ) {
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
   EVAL / DEMOS FIELD ALIASES
========================================================= */

const EVAL_FIELDS = {

    unit: [
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

    radioConfig: [
        "radio config",
        "radio configuration",
        "radios",
        "radio"
    ],

    shipmentDate: [
        "shipment date",
        "shipmentdate",
        "shipped date",
        "ship date"
    ],

    customer: [
        "customer",
        "customer name"
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


        /*
         * IMPORTANT:
         *
         * PO identity is:
         *
         * customerId + poNumber
         *
         * Because CMIN and Comcast use the
         * SAME Comcast customerId, a PO existing
         * in both sheets is stored only once.
         */
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


        /*
         * If the PO already exists,
         * fill missing information from
         * the second sheet.
         */
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


        /*
         * IMPORTANT:
         *
         * A unit is unique by:
         *
         * customerId
         * purchaseOrderId
         * unitCode
         * hostname
         *
         * Therefore the same unit under two
         * different POs is NOT merged.
         *
         * This preserves historical records.
         */
        const filter = {

            customerId,

            purchaseOrderId:
                purchaseOrderId ||
                null,

            unitCode,

            hostname:
                hostname ||
                ""
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
                        hostname ||
                        "",

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

        /*
         * This is where the Comcast/CMIN
         * union happens.
         *
         * Comcast → Comcast
         * CMIN    → Comcast
         */
        const customerName =
            normalizeCustomerName(
                sheetName
            );


        /*
         * Demos is handled separately
         * by importDemosSheet().
         */
        if (
            normalizeKey(
                sheetName
            ) === "demos"
        ) {
            return;
        }


        /*
         * IMPORTANT:
         *
         * If Comcast sheet is processed first,
         * a Comcast customer is created.
         *
         * When CMIN is processed later,
         * normalizeCustomerName("CMIN")
         * returns "Comcast".
         *
         * Therefore getOrCreateCustomer()
         * finds the SAME customer.
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
   EVAL / DEMOS HEADER DETECTION
========================================================= */

const isEvalHeaderRow =
    (row) => {

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


        const hasRadio =
            values.includes(
                "radio config"
            ) ||
            values.includes(
                "radio configuration"
            ) ||
            values.includes(
                "radios"
            ) ||
            values.includes(
                "radio"
            );


        const hasShipmentDate =
            values.includes(
                "shipment date"
            ) ||
            values.includes(
                "shipmentdate"
            ) ||
            values.includes(
                "shipped date"
            ) ||
            values.includes(
                "ship date"
            );


        const hasCustomer =
            values.includes(
                "customer"
            ) ||
            values.includes(
                "customer name"
            );


        return (
            hasUnit ||
            hasHostname ||
            hasRadio ||
            hasShipmentDate ||
            hasCustomer
        );
    };


/* =========================================================
   EVAL / DEMOS ROW READER
========================================================= */

const getEvalRows =
    (worksheet) => {

        /*
         * raw:false is intentional.
         *
         * Shipment Date remains the displayed
         * Excel value as a string.
         */
        const matrix =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    header: 1,
                    defval: "",
                    raw: false
                }
            );


        const rows = [];


        let headers =
            null;


        for (
            const row
            of matrix
        ) {

            if (
                !row ||
                row.length === 0
            ) {
                continue;
            }


            if (
                isEvalHeaderRow(row)
            ) {

                headers =
                    row.map(
                        (header) =>
                            cleanText(header)
                    );


                continue;
            }


            if (!headers) {
                continue;
            }


            const objectRow = {};


            headers.forEach(
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

                rows.push(
                    objectRow
                );
            }
        }


        return rows;
    };


/* =========================================================
   IMPORT DEMOS → EVAL VALUE
========================================================= */

const importDemosSheet =
    async (
        worksheet
    ) => {

        if (!worksheet) {

            return {
                found: false,
                totalRows: 0,
                imported: 0,
                skipped: 0
            };
        }


        const rows =
            getEvalRows(
                worksheet
            );


        const operations = [];


        let skipped = 0;


        for (
            const row
            of rows
        ) {

            const unit =
                getField(
                    row,
                    EVAL_FIELDS.unit
                );


            const hostname =
                getField(
                    row,
                    EVAL_FIELDS.hostname
                );


            const radioConfig =
                getField(
                    row,
                    EVAL_FIELDS.radioConfig
                );


            const shipmentDate =
                getField(
                    row,
                    EVAL_FIELDS.shipmentDate
                );


            const customer =
                getField(
                    row,
                    EVAL_FIELDS.customer
                );


            const normalizedUnit =
                normalizeKey(
                    unit
                );


            const normalizedHostname =
                normalizeKey(
                    hostname
                );


            /*
             * Ignore completely empty rows.
             */
            if (
                !unit &&
                !hostname &&
                !radioConfig &&
                !shipmentDate &&
                !customer
            ) {

                skipped++;

                continue;
            }


            /*
             * Ignore header-like rows.
             */
            if (
                normalizedUnit === "unit" ||
                normalizedHostname === "hostname"
            ) {

                skipped++;

                continue;
            }


            operations.push({

                updateOne: {

                    /*
                     * Same customer + unit + hostname
                     * means same EVAL record.
                     */
                    filter: {
                        customer,
                        unit,
                        hostname
                    },

                    update: {
                        $set: {
                            unit,
                            hostname,
                            radioConfig,
                            shipmentDate,
                            customer
                        }
                    },

                    upsert: true
                }
            });
        }


        /*
         * Demos represents the latest EVAL
         * snapshot from the latest main Excel upload.
         *
         * Therefore remove the old EVAL snapshot
         * before inserting the newly uploaded one.
         */
        await EvalValue.deleteMany({});


        if (
            operations.length > 0
        ) {

            await EvalValue.bulkWrite(
                operations,
                {
                    ordered: false
                }
            );
        }


        return {

            found: true,

            totalRows:
                rows.length,

            imported:
                operations.length,

            skipped
        };
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
             * Keep cellDates:true.
             *
             * Normal Support Expiry Dates
             * are stored as MongoDB Date values.
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


            /* =================================================
               DEMOS → EVAL
            ================================================= */

            /*
             * Find Demos in the SAME main Excel file.
             *
             * No separate EVAL upload is required.
             */
            const demosSheetName =
                workbook.SheetNames.find(
                    (sheetName) =>
                        normalizeKey(
                            sheetName
                        ) === "demos"
                );


            const evalResult =
                demosSheetName
                    ? await importDemosSheet(
                        workbook.Sheets[
                            demosSheetName
                        ]
                    )
                    : {
                        found: false,
                        totalRows: 0,
                        imported: 0,
                        skipped: 0
                    };


            /* =================================================
               NORMAL SHEETS
            ================================================= */

            for (
                const sheetName
                of workbook.SheetNames
            ) {

                const normalizedSheet =
                    normalizeKey(
                        sheetName
                    );


                /*
                 * Demos has already been processed
                 * into EvalValue.
                 *
                 * Do NOT create a Customer called Demos.
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
                    ) => {

                        const isDemos =
                            normalizeKey(
                                sheetName
                            ) === "demos";


                        return {

                            sheetName,

                            /*
                             * CMIN will appear as Comcast.
                             */
                            customerName:
                                normalizeCustomerName(
                                    sheetName
                                ),

                            isImported:
                                !isDemos,

                            isEval:
                                isDemos,

                            evalRowsImported:
                                isDemos
                                    ? evalResult.imported
                                    : 0
                        };
                    }
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


            /* =================================================
               RETURN RESULT
            ================================================= */

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

                eval:
                    evalResult,

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