import XLSX from "xlsx";

import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import Import from "../models/Import.js";
import EvalValue from "../models/EvalValue.js";

const cleanText = (value) => {
    if (value === undefined || value === null) return "";
    return String(value).trim();
};

const normalizeKey = (value) => {
    return cleanText(value)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim();
};

const normalizeCustomerName = (sheetName) => {
    const original = cleanText(sheetName);
    const key = original.toLowerCase().replace(/[\s_-]+/g, "");

    if (key === "cmin") return "Comcast";

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

    if (key === "altice") return "Altice";
    if (key === "cambium") return "Cambium";
    if (key === "commscope") return "CommScope";
    if (key === "fpt") return "FPT";
    if (key === "skyuk") return "SkyUK";

    return original;
};

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

const findField = (row, aliases) => {
    const keys = Object.keys(row);

    for (const alias of aliases) {
        const normalizedAlias = normalizeKey(alias);

        const found = keys.find(
            (key) => normalizeKey(key) === normalizedAlias
        );

        if (found !== undefined) {
            return found;
        }
    }

    return null;
};

const getField = (row, aliases) => {
    const field = findField(row, aliases);

    if (!field) return "";

    return cleanText(row[field]);
};

const parseExcelDate = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value);

        if (!parsed) return null;

        return new Date(
            parsed.y,
            parsed.m - 1,
            parsed.d,
            parsed.H || 0,
            parsed.M || 0,
            parsed.S || 0
        );
    }

    const text = cleanText(value);

    if (!text) return null;

    const date = new Date(text);

    return !isNaN(date.getTime()) ? date : null;
};

const isHeaderRow = (row) => {
    if (!Array.isArray(row)) return false;

    const values = row.map(normalizeKey);

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
        values.includes("radio configuration") ||
        values.includes("radio config") ||
        values.includes("radios");

    return hasUnit || hasHostname || hasPO || hasRadio;
};

const sheetToRows = (worksheet) => {
    const matrix = XLSX.utils.sheet_to_json(
        worksheet,
        {
            header: 1,
            defval: ""
        }
    );

    const result = [];
    let currentHeaders = null;

    for (const row of matrix) {
        if (!row || row.length === 0) continue;

        if (isHeaderRow(row)) {
            currentHeaders = row.map(
                (header) => cleanText(header)
            );

            continue;
        }

        if (!currentHeaders) continue;

        const objectRow = {};

        currentHeaders.forEach(
            (header, index) => {
                if (!header) return;

                objectRow[header] =
                    row[index] ?? "";
            }
        );

        const hasAnyValue =
            Object.values(objectRow).some(
                (value) =>
                    cleanText(value) !== ""
            );

        if (hasAnyValue) {
            result.push(objectRow);
        }
    }

    return result;
};

const processJuniperSheet = async (
    worksheet,
    sheetName,
    stats
) => {
    const matrix = XLSX.utils.sheet_to_json(
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
        const row = matrix[i] || [];

        const normalized =
            row.map(normalizeKey);

        const unitIndex =
            normalized.indexOf("unit");

        const hostnameIndex =
            normalized.indexOf("hostname");

        if (
            unitIndex !== -1 &&
            hostnameIndex !== -1
        ) {
            sections.push({
                rowIndex: i,
                startColumn: unitIndex
            });
        }
    }

    if (sections.length === 0) {
        await processNormalRows(
            sheetToRows(worksheet),
            sheetName,
            stats
        );

        return;
    }

    for (
        let sectionIndex = 0;
        sectionIndex < sections.length;
        sectionIndex++
    ) {
        const section =
            sections[sectionIndex];

        const nextSection =
            sections[sectionIndex + 1];

        const startRow =
            section.rowIndex + 1;

        const endRow =
            nextSection
                ? nextSection.rowIndex
                : matrix.length;

        const headers =
            matrix[section.rowIndex];

        const startColumn =
            section.startColumn;

        let endColumn =
            headers.length;

        for (
            let column =
                startColumn + 1;
            column < headers.length;
            column++
        ) {
            if (
                normalizeKey(
                    headers[column]
                ) === "unit"
            ) {
                endColumn = column;
                break;
            }
        }

        const rows = [];

        for (
            let rowIndex = startRow;
            rowIndex < endRow;
            rowIndex++
        ) {
            const source =
                matrix[rowIndex];

            if (!source) continue;

            const row = {};

            for (
                let column = startColumn;
                column < endColumn;
                column++
            ) {
                const header =
                    cleanText(
                        headers[column]
                    );

                if (!header) continue;

                row[header] =
                    source[column] ?? "";
            }

            const hasValue =
                Object.values(row).some(
                    (value) =>
                        cleanText(value) !== ""
                );

            if (hasValue) {
                rows.push(row);
            }
        }

        await processNormalRows(
            rows,
            sheetName,
            stats
        );
    }
};

const buildAdditionalFields = (
    row,
    knownAliases
) => {
    const additional = {};

    const knownKeys =
        new Set(
            knownAliases.map(normalizeKey)
        );

    for (
        const [key, value]
        of Object.entries(row)
    ) {
        const normalized =
            normalizeKey(key);

        if (
            knownKeys.has(normalized)
        ) {
            continue;
        }

        const cleaned =
            cleanText(value);

        if (cleaned !== "") {
            additional[key] =
                cleaned;
        }
    }

    return additional;
};

const getOrCreateCustomer =
    async (customerName) => {
        const cleanName =
            cleanText(customerName);

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
                    name: cleanName,
                    additionalFields: {}
                });
        }

        return customer;
    };

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
            return PurchaseOrder.create({
                customerId,
                poNumber,

                invoiceNumber:
                    invoiceNumber || "",

                supportExpiryDate:
                    supportExpiryDate ||
                    undefined,

                additionalFields:
                    additionalFields || {}
            });
        }

        let changed = false;

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
                    ...(purchaseOrder.additionalFields || {}),
                    ...additionalFields
                };

            changed = true;
        }

        if (changed) {
            await purchaseOrder.save();
        }

        return purchaseOrder;
    };

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
                purchaseOrderId || null,

            unitCode,

            hostname:
                hostname || ""
        };

        let unit =
            await NetworkUnit.findOne(
                filter
            );

        if (!unit) {
            return NetworkUnit.create({
                customerId,

                purchaseOrderId:
                    purchaseOrderId || null,

                unitCode,

                hostname:
                    hostname || "",

                radioConfiguration:
                    radioConfiguration || "",

                additionalFields:
                    additionalFields || {}
            });
        }

        let changed = false;

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
                    ...(unit.additionalFields || {}),
                    ...additionalFields
                };

            changed = true;
        }

        if (changed) {
            await unit.save();
        }

        return unit;
    };

const processStandardRow =
    async ({
        row,
        customer,
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
            normalizeKey(unitCode);

        if (
            unitKey === "new systems" ||
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

        let purchaseOrder = null;

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

            if (purchaseOrder) {
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
                stats
            });
        }
    };

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

        await processNormalRows(
            sheetToRows(
                worksheet
            ),
            sheetName,
            stats
        );
    };

/* =========================================================
   EVAL / DEMOS
========================================================= */

const isEvalHeaderRow =
    (row) => {
        if (!Array.isArray(row)) {
            return false;
        }

        const values =
            row.map(normalizeKey);

        const hasUnit =
            values.includes("unit") ||
            values.includes("unit code") ||
            values.includes("unitcode");

        const hasHostname =
            values.includes("hostname") ||
            values.includes("host name");

        const hasRadio =
            values.includes("radio config") ||
            values.includes("radio configuration") ||
            values.includes("radios") ||
            values.includes("radio");

        const hasShipmentDate =
            values.includes("shipment date") ||
            values.includes("shipmentdate") ||
            values.includes("shipped date") ||
            values.includes("ship date");

        const hasCustomer =
            values.includes("customer") ||
            values.includes("customer name");

        return (
            hasUnit ||
            hasHostname ||
            hasRadio ||
            hasShipmentDate ||
            hasCustomer
        );
    };

const getEvalRows =
    (worksheet) => {
        /*
         * raw:false is important here.
         *
         * Shipment Date in EVAL is kept as the
         * displayed Excel value rather than
         * converting it to a MongoDB Date.
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
        let headers = null;

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
                (header, index) => {
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
                        cleanText(value) !== ""
                );

            if (hasAnyValue) {
                rows.push(
                    objectRow
                );
            }
        }

        return rows;
    };

const importDemosSheet =
    async (worksheet) => {
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
                normalizeKey(unit);

            const normalizedHostname =
                normalizeKey(hostname);

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

            if (
                normalizedUnit === "unit" ||
                normalizedHostname === "hostname"
            ) {
                skipped++;
                continue;
            }

            operations.push({
                updateOne: {
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
         * Demos represents the latest EVAL snapshot.
         * Clear the old EVAL data and insert the data
         * from this main Excel upload.
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
            totalRows: rows.length,
            imported: operations.length,
            skipped
        };
    };

/* =========================================================
   MAIN IMPORT
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

        let importRecord = null;

        try {
            if (!file) {
                throw new Error(
                    "No Excel file received"
                );
            }

            /*
             * Keep cellDates:true because normal
             * Support Expiry Date values are stored
             * as MongoDB Date values.
             */
            const workbook =
                XLSX.read(
                    file.buffer,
                    {
                        type: "buffer",
                        cellDates: true
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
             * Find the Demos sheet from the same
             * Excel workbook.
             */
            const demosSheetName =
                workbook.SheetNames.find(
                    (sheetName) =>
                        normalizeKey(
                            sheetName
                        ) === "demos"
                );

            /*
             * Import Demos into EvalValue.
             *
             * Demos does NOT become a normal
             * Customer / PO / NetworkUnit record.
             */
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

            /*
             * Process all normal worksheets.
             *
             * Demos has already been processed
             * separately above.
             */
            for (
                const sheetName
                of workbook.SheetNames
            ) {
                const normalizedSheet =
                    normalizeKey(
                        sheetName
                    );

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

            /*
             * Final dashboard counts.
             */
            const totalCustomers =
                await Customer.countDocuments();

            const totalPurchaseOrders =
                await PurchaseOrder.countDocuments();

            const totalUnits =
                await NetworkUnit.countDocuments();

            /*
             * Import history.
             */
            const sheetResults =
                workbook.SheetNames.map(
                    (sheetName) => {
                        const isDemos =
                            normalizeKey(
                                sheetName
                            ) === "demos";

                        return {
                            sheetName,

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