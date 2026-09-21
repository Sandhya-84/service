import XLSX from "xlsx";

import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import RenewalHistory from "../models/RenewalHistory.js";
import Import from "../models/Import.js";


// =====================================================
// REQUIRED EXCEL HEADERS
// =====================================================

const REQUIRED_HEADERS = [
    "unit",
    "hostname",
    "radio configuration",
    "po details",
    "invoice number",
    "support expiry date"
];


// =====================================================
// NORMALIZE HEADER
// =====================================================

const normalizeHeader = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ");
};


// =====================================================
// FIND HEADER ROW
// =====================================================

const findHeaderRow = (rows) => {

    for (let i = 0; i < rows.length; i++) {

        const row = rows[i];

        if (!Array.isArray(row)) {
            continue;
        }

        const headers = row.map(normalizeHeader);

        const hasAllRequiredHeaders =
            REQUIRED_HEADERS.every((requiredHeader) =>
                headers.includes(requiredHeader)
            );

        if (hasAllRequiredHeaders) {
            return i;
        }
    }

    return -1;
};


// =====================================================
// VALIDATE COMPLETE WORKBOOK
// =====================================================

const validateTrackerWorkbook = (workbook) => {

    if (!workbook || !workbook.SheetNames) {

        throw new Error(
            "Invalid Excel workbook."
        );
    }


    if (workbook.SheetNames.length === 0) {

        throw new Error(
            "The Excel workbook does not contain any sheets."
        );
    }


    let validSheetFound = false;


    for (const sheetName of workbook.SheetNames) {

        const worksheet =
            workbook.Sheets[sheetName];

        if (!worksheet) {
            continue;
        }


        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    header: 1,
                    defval: ""
                }
            );


        if (!rows || rows.length === 0) {
            continue;
        }


        const headerRowIndex =
            findHeaderRow(rows);


        if (headerRowIndex !== -1) {

            validSheetFound = true;

            break;
        }
    }


    if (!validSheetFound) {

        throw new Error(
            "This Excel file is not a valid Support Renewal Tracker file. The required columns Unit, Hostname, Radio configuration, PO-Details, Invoice Number and Support Expiry Date were not found."
        );
    }


    return true;
};


// =====================================================
// PARSE DATE
// =====================================================

const parseDate = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }


    if (value instanceof Date) {
        return value;
    }


    if (typeof value === "number") {

        const date =
            XLSX.SSF.parse_date_code(value);


        if (!date) {
            return null;
        }


        return new Date(
            date.y,
            date.m - 1,
            date.d
        );
    }


    const parsedDate =
        new Date(value);


    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }


    return parsedDate;
};


// =====================================================
// CLEAN VALUE
// =====================================================

const cleanValue = (value) => {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }


    return String(value).trim();
};


// =====================================================
// GET COLUMN VALUE
// =====================================================

const getColumnValue = (
    row,
    possibleNames
) => {

    const normalizedRow = {};


    Object.keys(row).forEach((key) => {

        const normalizedKey =
            normalizeHeader(key);

        normalizedRow[normalizedKey] =
            row[key];
    });


    for (const name of possibleNames) {

        const normalizedName =
            normalizeHeader(name);


        const value =
            normalizedRow[normalizedName];


        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }


    return "";
};


// =====================================================
// MAIN EXCEL IMPORT FUNCTION
// =====================================================

export const importExcelData = async (
    buffer,
    fileName
) => {

    // -------------------------------------------------
    // READ EXCEL WORKBOOK
    // -------------------------------------------------

    const workbook =
        XLSX.read(buffer, {
            type: "buffer",
            cellDates: true
        });


    // -------------------------------------------------
    // CREATE IMPORT HISTORY RECORD
    // -------------------------------------------------

    const importRecord =
        await Import.create({
            fileName,
            status: "processing"
        });


    let totalCustomers = 0;
    let totalPurchaseOrders = 0;
    let totalUnits = 0;


    try {

        // -------------------------------------------------
        // IMPORTANT:
        // VALIDATE BEFORE TOUCHING CUSTOMER / PO / UNIT DATA
        // -------------------------------------------------

        validateTrackerWorkbook(workbook);


        // -------------------------------------------------
        // PROCESS EVERY SHEET
        // -------------------------------------------------

        for (const sheetName of workbook.SheetNames) {

            const sheet =
                workbook.Sheets[sheetName];


            if (!sheet) {
                continue;
            }


            // Convert sheet into rows first
            const rawRows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        header: 1,
                        defval: ""
                    }
                );


            // Find actual header row
            const headerRowIndex =
                findHeaderRow(rawRows);


            // Skip unrelated/empty sheets inside a valid workbook
            if (headerRowIndex === -1) {

                console.log(
                    `Skipping sheet "${sheetName}" - valid header row not found`
                );

                continue;
            }


            // Convert data rows using the detected header
            const rows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        range: headerRowIndex,
                        defval: ""
                    }
                );


            if (rows.length === 0) {
                continue;
            }


            // -------------------------------------------------
            // SHEET NAME = CUSTOMER NAME
            // -------------------------------------------------

            const customerName =
                cleanValue(sheetName);


            if (!customerName) {
                continue;
            }


            // -------------------------------------------------
            // FIND OR CREATE CUSTOMER
            // -------------------------------------------------

            let customer =
                await Customer.findOne({
                    name: customerName
                });


            if (!customer) {

                customer =
                    await Customer.create({
                        name: customerName
                    });


                totalCustomers++;
            }


            // -------------------------------------------------
            // VALUES CARRIED FORWARD FROM MERGED / BLANK CELLS
            // -------------------------------------------------

            let currentPO = "";

            let currentInvoice = "";

            let currentExpiry = null;


            // -------------------------------------------------
            // PROCESS EACH ROW
            // -------------------------------------------------

            for (const row of rows) {

                // ---------------------------------------------
                // UNIT
                // ---------------------------------------------

                const unitCode =
                    cleanValue(
                        getColumnValue(
                            row,
                            [
                                "Unit"
                            ]
                        )
                    );


                // ---------------------------------------------
                // HOSTNAME
                // ---------------------------------------------

                const hostname =
                    cleanValue(
                        getColumnValue(
                            row,
                            [
                                "Hostname"
                            ]
                        )
                    );


                // ---------------------------------------------
                // RADIO CONFIGURATION
                // ---------------------------------------------

                const radioConfiguration =
                    cleanValue(
                        getColumnValue(
                            row,
                            [
                                "Radio Configuration"
                            ]
                        )
                    );


                // ---------------------------------------------
                // PURCHASE ORDER
                // ---------------------------------------------

                const poValue =
                    cleanValue(
                        getColumnValue(
                            row,
                            [
                                "PO-Details",
                                "PO Details",
                                "PO",
                                "PO Number",
                                "poNumber"
                            ]
                        )
                    );


                // ---------------------------------------------
                // INVOICE
                // ---------------------------------------------

                const invoiceValue =
                    cleanValue(
                        getColumnValue(
                            row,
                            [
                                "Invoice Number"
                            ]
                        )
                    );


                // ---------------------------------------------
                // EXPIRY DATE
                // ---------------------------------------------

                const expiryValue =
                    getColumnValue(
                        row,
                        [
                            "Support Expiry Date"
                        ]
                    );


                // ---------------------------------------------
                // CARRY FORWARD MERGED / BLANK VALUES
                // ---------------------------------------------

                if (poValue) {
                    currentPO = poValue;
                }


                if (invoiceValue) {
                    currentInvoice =
                        invoiceValue;
                }


                if (expiryValue) {

                    const parsedExpiry =
                        parseDate(expiryValue);


                    if (parsedExpiry) {

                        currentExpiry =
                            parsedExpiry;
                    }
                }


                // ---------------------------------------------
                // IGNORE EMPTY ROW
                // ---------------------------------------------

                if (
                    !unitCode &&
                    !hostname
                ) {
                    continue;
                }


                // ---------------------------------------------
                // UNIT WITHOUT PO
                // ---------------------------------------------

                if (!currentPO) {

                    console.log(
                        `Skipping unit without PO in sheet "${sheetName}"`
                    );

                    continue;
                }


                // ---------------------------------------------
                // FIND PURCHASE ORDER
                // ---------------------------------------------

                let purchaseOrder =
                    await PurchaseOrder.findOne({
                        customerId:
                            customer._id,

                        poNumber:
                            currentPO
                    });


                // ---------------------------------------------
                // CREATE PURCHASE ORDER
                // ---------------------------------------------

                if (!purchaseOrder) {

                    purchaseOrder =
                        await PurchaseOrder.create({
                            customerId:
                                customer._id,

                            poNumber:
                                currentPO,

                            invoiceNumber:
                                currentInvoice,

                            supportExpiryDate:
                                currentExpiry
                        });


                    totalPurchaseOrders++;

                }

                // ---------------------------------------------
                // UPDATE EXISTING PURCHASE ORDER
                // ---------------------------------------------

                else {

                    // -----------------------------------------
                    // EXPIRY DATE CHANGED
                    // -----------------------------------------

                    if (
                        currentExpiry &&
                        purchaseOrder.supportExpiryDate &&
                        purchaseOrder.supportExpiryDate.getTime() !==
                            currentExpiry.getTime()
                    ) {

                        await RenewalHistory.create({

                            purchaseOrderId:
                                purchaseOrder._id,

                            oldExpiryDate:
                                purchaseOrder.supportExpiryDate,

                            newExpiryDate:
                                currentExpiry,

                            notes:
                                `Imported from ${fileName}`
                        });
                    }


                    // -----------------------------------------
                    // UPDATE INVOICE
                    // -----------------------------------------

                    if (currentInvoice) {

                        purchaseOrder.invoiceNumber =
                            currentInvoice;
                    }


                    // -----------------------------------------
                    // UPDATE EXPIRY
                    // -----------------------------------------

                    if (currentExpiry) {

                        purchaseOrder.supportExpiryDate =
                            currentExpiry;
                    }


                    await purchaseOrder.save();
                }


                // ---------------------------------------------
                // FIND NETWORK UNIT
                // ---------------------------------------------

                let networkUnit =
                    await NetworkUnit.findOne({

                        purchaseOrderId:
                            purchaseOrder._id,

                        unitCode,

                        hostname
                    });


                // ---------------------------------------------
                // CREATE NETWORK UNIT
                // ---------------------------------------------

                if (!networkUnit) {

                    await NetworkUnit.create({

                        purchaseOrderId:
                            purchaseOrder._id,

                        unitCode,

                        hostname,

                        radioConfiguration
                    });


                    totalUnits++;

                }

                // ---------------------------------------------
                // UPDATE NETWORK UNIT
                // ---------------------------------------------

                else {

                    networkUnit.hostname =
                        hostname;


                    if (radioConfiguration) {

                        networkUnit.radioConfiguration =
                            radioConfiguration;
                    }


                    await networkUnit.save();
                }
            }
        }


        // -------------------------------------------------
        // IMPORT COMPLETED
        // -------------------------------------------------

        importRecord.totalCustomers =
            totalCustomers;


        importRecord.totalPurchaseOrders =
            totalPurchaseOrders;


        importRecord.totalUnits =
            totalUnits;


        importRecord.status =
            "completed";


        await importRecord.save();


        return {

            importId:
                importRecord._id,

            totalCustomers,

            totalPurchaseOrders,

            totalUnits
        };


    } catch (error) {

        // -------------------------------------------------
        // IMPORT FAILED
        // -------------------------------------------------

        importRecord.status =
            "failed";


        importRecord.errorMessage =
            error.message;


        await importRecord.save();


        throw error;
    }
};