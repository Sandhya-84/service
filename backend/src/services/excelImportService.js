import XLSX from "xlsx";

import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import RenewalHistory from "../models/RenewalHistory.js";
import Import from "../models/Import.js";

const normalizeHeader = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
};

const cleanValue = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "string") {
        return value.trim();
    }

    return value;
};

const HEADER_ALIASES = {
    unitCode: [
        "unit",
        "unit code",
        "unitcode"
    ],

    hostname: [
        "hostname",
        "host name",
        "host"
    ],

    radioConfiguration: [
        "radio configuration",
        "radio config",
        "radios",
        "radio"
    ],

    poNumber: [
        "po details",
        "po detail",
        "po",
        "po number",
        "purchase order",
        "purchase order number"
    ],

    invoiceNumber: [
        "invoice number",
        "invoice no",
        "invoice",
        "invoice #"
    ],

    supportExpiryDate: [
        "support expiry date",
        "support expiry",
        "expiry date",
        "expiry"
    ]
};

const getStandardField = (header) => {
    const normalized =
        normalizeHeader(header);

    for (
        const [field, aliases]
        of Object.entries(
            HEADER_ALIASES
        )
    ) {
        if (
            aliases.includes(
                normalized
            )
        ) {
            return field;
        }
    }

    return null;
};

const parseDate = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (value instanceof Date) {
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

        if (parsed) {
            return new Date(
                parsed.y,
                parsed.m - 1,
                parsed.d
            );
        }
    }

    if (
        typeof value === "string"
    ) {
        const trimmed =
            value.trim();

        if (!trimmed) {
            return null;
        }

        const match =
            trimmed.match(
                /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
            );

        if (match) {
            const day =
                Number(match[1]);

            const month =
                Number(match[2]);

            const year =
                Number(match[3]);

            const date =
                new Date(
                    year,
                    month - 1,
                    day
                );

            return isNaN(
                date.getTime()
            )
                ? null
                : date;
        }

        const parsed =
            new Date(trimmed);

        if (
            !isNaN(
                parsed.getTime()
            )
        ) {
            return parsed;
        }
    }

    return null;
};

const detectHeaderRow = (rows) => {
    let bestRowIndex = -1;
    let bestScore = 0;

    rows.forEach(
        (row, rowIndex) => {
            let score = 0;

            row.forEach(
                (cell) => {
                    if (
                        getStandardField(
                            cell
                        )
                    ) {
                        score++;
                    }
                }
            );

            if (
                score >= 2 &&
                score > bestScore
            ) {
                bestScore = score;

                bestRowIndex =
                    rowIndex;
            }
        }
    );

    return {
        rowIndex:
            bestRowIndex,

        score:
            bestScore
    };
};

const buildColumnMap = (
    headerRow
) => {
    return headerRow.map(
        (header, index) => {
            const standardField =
                getStandardField(
                    header
                );

            return {
                index,

                originalHeader:
                    String(
                        header ?? ""
                    ).trim(),

                standardField
            };
        }
    );
};

const getRowObject = (
    row,
    columnMap
) => {
    const standardFields = {};
    const additionalFields = {};

    columnMap.forEach(
        (column) => {
            const value =
                cleanValue(
                    row[
                        column.index
                    ]
                );

            if (
                value === "" ||
                value === null ||
                value === undefined
            ) {
                return;
            }

            if (
                column.standardField
            ) {
                standardFields[
                    column.standardField
                ] = value;
            } else if (
                column.originalHeader
            ) {
                additionalFields[
                    column.originalHeader
                ] = value;
            }
        }
    );

    return {
        standardFields,
        additionalFields
    };
};

const mergeAdditionalFields = (
    existing,
    incoming
) => {
    return {
        ...(existing || {}),
        ...(incoming || {})
    };
};

const getOrCreateCustomer =
    async (
        customerName
    ) => {
        const cleanedName =
            customerName.trim();

        let customer =
            await Customer.findOne({
                name:
                    cleanedName
            });

        if (!customer) {
            customer =
                await Customer.create({
                    name:
                        cleanedName,

                    additionalFields:
                        {}
                });
        }

        return customer;
    };

const getOrCreatePurchaseOrder =
    async ({
        customerId,
        poNumber,
        invoiceNumber,
        supportExpiryDate,
        additionalFields
    }) => {
        if (!poNumber) {
            return null;
        }

        const cleanedPO =
            String(
                poNumber
            ).trim();

        if (!cleanedPO) {
            return null;
        }

        let purchaseOrder =
            await PurchaseOrder.findOne({
                customerId,

                poNumber:
                    cleanedPO
            });

        if (!purchaseOrder) {
            purchaseOrder =
                await PurchaseOrder.create({
                    customerId,

                    poNumber:
                        cleanedPO,

                    invoiceNumber:
                        invoiceNumber
                            ? String(
                                invoiceNumber
                            ).trim()
                            : "",

                    supportExpiryDate:
                        supportExpiryDate ||
                        undefined,

                    additionalFields:
                        additionalFields ||
                        {}
                });

            return purchaseOrder;
        }

        if (
            invoiceNumber !==
                undefined &&
            invoiceNumber !== ""
        ) {
            purchaseOrder.invoiceNumber =
                String(
                    invoiceNumber
                ).trim();
        }

        if (
            supportExpiryDate
        ) {
            const oldExpiry =
                purchaseOrder
                    .supportExpiryDate;

            const newExpiry =
                supportExpiryDate;

            if (
                oldExpiry &&
                newExpiry &&
                oldExpiry.getTime() !==
                    newExpiry.getTime()
            ) {
                await RenewalHistory.create({
                    purchaseOrderId:
                        purchaseOrder._id,

                    oldExpiryDate:
                        oldExpiry,

                    newExpiryDate:
                        newExpiry,

                    notes:
                        "Updated through Excel import"
                });
            }

            purchaseOrder
                .supportExpiryDate =
                newExpiry;
        }

        purchaseOrder.additionalFields =
            mergeAdditionalFields(
                purchaseOrder
                    .additionalFields,

                additionalFields
            );

        await purchaseOrder.save();

        return purchaseOrder;
    };

const createOrUpdateNetworkUnit =
    async ({
        purchaseOrderId,
        unitCode,
        hostname,
        radioConfiguration,
        additionalFields
    }) => {
        if (!unitCode) {
            return null;
        }

        const cleanedUnitCode =
            String(
                unitCode
            ).trim();

        if (!cleanedUnitCode) {
            return null;
        }

        const cleanedHostname =
            hostname
                ? String(
                    hostname
                ).trim()
                : "";

        let networkUnit;

        if (purchaseOrderId) {
            networkUnit =
                await NetworkUnit.findOne({
                    purchaseOrderId,

                    unitCode:
                        cleanedUnitCode,

                    hostname:
                        cleanedHostname
                });
        } else {
            networkUnit =
                await NetworkUnit.findOne({
                    purchaseOrderId:
                        null,

                    unitCode:
                        cleanedUnitCode,

                    hostname:
                        cleanedHostname
                });
        }

        if (!networkUnit) {
            networkUnit =
                await NetworkUnit.create({
                    purchaseOrderId:
                        purchaseOrderId ||
                        null,

                    unitCode:
                        cleanedUnitCode,

                    hostname:
                        cleanedHostname,

                    radioConfiguration:
                        radioConfiguration
                            ? String(
                                radioConfiguration
                            ).trim()
                            : "",

                    additionalFields:
                        additionalFields ||
                        {}
                });

            return networkUnit;
        }

        if (
            purchaseOrderId &&
            !networkUnit.purchaseOrderId
        ) {
            networkUnit.purchaseOrderId =
                purchaseOrderId;
        }

        if (
            hostname !== undefined &&
            hostname !== ""
        ) {
            networkUnit.hostname =
                cleanedHostname;
        }

        if (
            radioConfiguration !==
                undefined &&
            radioConfiguration !== ""
        ) {
            networkUnit
                .radioConfiguration =
                String(
                    radioConfiguration
                ).trim();
        }

        networkUnit.additionalFields =
            mergeAdditionalFields(
                networkUnit
                    .additionalFields,

                additionalFields
            );

        await networkUnit.save();

        return networkUnit;
    };

const processSheet = async (
    workbook,
    sheetName
) => {
    const worksheet =
        workbook.Sheets[
            sheetName
        ];

    const rows =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                header: 1,
                defval: ""
            }
        );

    if (!rows.length) {
        return {
            customerName:
                sheetName.trim(),

            purchaseOrders: 0,

            units: 0,

            warnings: [
                "Sheet is empty"
            ]
        };
    }

    const {
        rowIndex,
        score
    } =
        detectHeaderRow(rows);

    if (
        rowIndex === -1 ||
        score < 2
    ) {
        return {
            customerName:
                sheetName.trim(),

            purchaseOrders: 0,

            units: 0,

            warnings: [
                "Could not detect a valid header row"
            ]
        };
    }

    const customer =
        await getOrCreateCustomer(
            sheetName
        );

    let currentColumnMap =
        buildColumnMap(
            rows[rowIndex]
        );

    let currentPO = "";
    let currentInvoice = "";
    let currentExpiry = null;

    const processedPOs =
        new Set();

    const processedUnits =
        new Set();

    const warnings = [];

    for (
        let currentRowIndex =
            rowIndex + 1;

        currentRowIndex <
        rows.length;

        currentRowIndex++
    ) {
        const row =
            rows[
                currentRowIndex
            ];

        /*
         * Check whether this row
         * is another header section.
         *
         * This is important for sheets
         * such as Juniper.
         */

        const detectedFields =
            row.filter(
                (cell) =>
                    getStandardField(
                        cell
                    ) !== null
            );

        if (
            detectedFields.length >= 2
        ) {
            currentColumnMap =
                buildColumnMap(
                    row
                );

            /*
             * IMPORTANT:
             * Reset the previous section's
             * PO information.
             */

            currentPO = "";
            currentInvoice = "";
            currentExpiry = null;

            continue;
        }

        const {
            standardFields,
            additionalFields
        } =
            getRowObject(
                row,
                currentColumnMap
            );

        const hasAnyValue =
            Object.keys(
                standardFields
            ).length > 0 ||
            Object.keys(
                additionalFields
            ).length > 0;

        if (!hasAnyValue) {
            continue;
        }

        /*
         * Update the current PO
         * when a new PO appears.
         */

        if (
            standardFields.poNumber
        ) {
            currentPO =
                String(
                    standardFields
                        .poNumber
                ).trim();
        }

        /*
         * Update invoice information.
         */

        if (
            standardFields.invoiceNumber
        ) {
            currentInvoice =
                String(
                    standardFields
                        .invoiceNumber
                ).trim();
        }

        /*
         * Update expiry information.
         */

        if (
            standardFields
                .supportExpiryDate
        ) {
            const parsedExpiry =
                parseDate(
                    standardFields
                        .supportExpiryDate
                );

            if (parsedExpiry) {
                currentExpiry =
                    parsedExpiry;
            }
        }

        const unitCode =
            standardFields.unitCode
                ? String(
                    standardFields
                        .unitCode
                ).trim()
                : "";

        const hostname =
            standardFields.hostname
                ? String(
                    standardFields
                        .hostname
                ).trim()
                : "";

        /*
         * No unit on this row.
         *
         * It may simply be a PO
         * information row.
         */

        if (
            !unitCode &&
            !hostname
        ) {
            if (currentPO) {
                const purchaseOrder =
                    await getOrCreatePurchaseOrder({
                        customerId:
                            customer._id,

                        poNumber:
                            currentPO,

                        invoiceNumber:
                            currentInvoice,

                        supportExpiryDate:
                            currentExpiry,

                        additionalFields
                    });

                if (
                    purchaseOrder
                ) {
                    processedPOs.add(
                        purchaseOrder
                            ._id
                            .toString()
                    );
                }
            }

            continue;
        }

        /*
         * A unit exists.
         *
         * PO is optional.
         */

        let purchaseOrder = null;

        if (currentPO) {
            purchaseOrder =
                await getOrCreatePurchaseOrder({
                    customerId:
                        customer._id,

                    poNumber:
                        currentPO,

                    invoiceNumber:
                        currentInvoice,

                    supportExpiryDate:
                        currentExpiry,

                    additionalFields
                });

            if (purchaseOrder) {
                processedPOs.add(
                    purchaseOrder
                        ._id
                        .toString()
                );
            }
        }

        /*
         * Store the unit even if
         * there is no PO.
         */

        const networkUnit =
            await createOrUpdateNetworkUnit({
                purchaseOrderId:
                    purchaseOrder
                        ? purchaseOrder._id
                        : null,

                unitCode:
                    unitCode ||
                    hostname,

                hostname,

                radioConfiguration:
                    standardFields
                        .radioConfiguration,

                additionalFields
            });

        if (networkUnit) {
            processedUnits.add(
                networkUnit
                    ._id
                    .toString()
            );
        }
    }

    return {
        customerName:
            customer.name,

        purchaseOrders:
            processedPOs.size,

        units:
            processedUnits.size,

        warnings
    };
};

export const importExcelFile =
    async ({
        buffer,
        fileName
    }) => {
        let importRecord = null;

        try {
            const workbook =
                XLSX.read(
                    buffer,
                    {
                        type: "buffer",

                        cellDates:
                            true
                    }
                );

            importRecord =
                await Import.create({
                    fileName,

                    status:
                        "processing",

                    importedAt:
                        new Date(),

                    totalCustomers:
                        0,

                    totalPurchaseOrders:
                        0,

                    totalUnits:
                        0,

                    sheetResults:
                        []
                });

            let totalCustomers = 0;
            let totalPurchaseOrders = 0;
            let totalUnits = 0;

            const sheetResults = [];

            for (
                const sheetName
                of workbook.SheetNames
            ) {
                try {
                    const result =
                        await processSheet(
                            workbook,
                            sheetName
                        );

                    totalCustomers++;

                    totalPurchaseOrders +=
                        result.purchaseOrders;

                    totalUnits +=
                        result.units;

                    sheetResults.push({
                        sheetName,

                        ...result
                    });
                } catch (
                    sheetError
                ) {
                    console.error(
                        `Error importing sheet ${sheetName}:`,
                        sheetError
                    );

                    sheetResults.push({
                        sheetName,

                        customerName:
                            sheetName,

                        purchaseOrders:
                            0,

                        units:
                            0,

                        warnings: [
                            sheetError.message
                        ]
                    });
                }
            }

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
                importId:
                    importRecord._id,

                totalCustomers,

                totalPurchaseOrders,

                totalUnits,

                sheets:
                    sheetResults
            };
        } catch (error) {
            console.error(
                "Excel import failed:",
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