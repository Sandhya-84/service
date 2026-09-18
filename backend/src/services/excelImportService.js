import XLSX from "xlsx";

import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import RenewalHistory from "../models/RenewalHistory.js";
import Import from "../models/Import.js";


const findHeaderRow = (sheet) => {
    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: ""
    });

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].map((value) =>
            String(value).trim().toLowerCase()
        );

        const hasUnit = row.includes("unit");
        const hasHostname = row.includes("hostname");
        const hasExpiry = row.includes("support expiry date");

        if (hasUnit && hasHostname && hasExpiry) {
            return i;
        }
    }

    return -1;
};


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
        const date = XLSX.SSF.parse_date_code(value);

        if (!date) {
            return null;
        }

        return new Date(
            date.y,
            date.m - 1,
            date.d
        );
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};


const cleanValue = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
};


const getColumnValue = (row, possibleNames) => {
    const normalizedRow = {};

    Object.keys(row).forEach((key) => {
        const normalizedKey = String(key)
            .trim()
            .toLowerCase();

        normalizedRow[normalizedKey] = row[key];
    });

    for (const name of possibleNames) {
        const normalizedName = String(name)
            .trim()
            .toLowerCase();

        const value = normalizedRow[normalizedName];

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


export const importExcelData = async (
    buffer,
    fileName
) => {

    const workbook = XLSX.read(buffer, {
        type: "buffer",
        cellDates: true
    });

    const importRecord = await Import.create({
        fileName,
        status: "processing"
    });

    let totalCustomers = 0;
    let totalPurchaseOrders = 0;
    let totalUnits = 0;

    try {

        for (const sheetName of workbook.SheetNames) {

            const sheet = workbook.Sheets[sheetName];

            const headerRowIndex =
                findHeaderRow(sheet);

            if (headerRowIndex === -1) {
                console.log(
                    `Skipping sheet "${sheetName}" - header row not found`
                );

                continue;
            }

            const rows =
                XLSX.utils.sheet_to_json(sheet, {
                    range: headerRowIndex,
                    defval: ""
                });

            if (rows.length === 0) {
                continue;
            }

            const customerName =
                cleanValue(sheetName);

            if (!customerName) {
                continue;
            }

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

            let currentPO = "";
            let currentInvoice = "";
            let currentExpiry = null;

            for (const row of rows) {

                const unitCode =
                    cleanValue(
                        getColumnValue(row, [
                            "Unit"
                        ])
                    );

                const hostname =
                    cleanValue(
                        getColumnValue(row, [
                            "Hostname"
                        ])
                    );

                const radioConfiguration =
                    cleanValue(
                        getColumnValue(row, [
                            "Radio Configuration"
                        ])
                    );

                const poValue =
                    cleanValue(
                        getColumnValue(row, [
                            "PO-Details",
                            "PO Details",
                            "PO",
                            "PO Number",
                            "poNumber"
                        ])
                    );

                const invoiceValue =
                    cleanValue(
                        getColumnValue(row, [
                            "Invoice Number"
                        ])
                    );

                const expiryValue =
                    getColumnValue(row, [
                        "Support Expiry Date"
                    ]);

                if (poValue) {
                    currentPO = poValue;
                }

                if (invoiceValue) {
                    currentInvoice = invoiceValue;
                }

                if (expiryValue) {
                    const parsedExpiry =
                        parseDate(expiryValue);

                    if (parsedExpiry) {
                        currentExpiry =
                            parsedExpiry;
                    }
                }

                if (
                    !unitCode &&
                    !hostname
                ) {
                    continue;
                }

                if (!currentPO) {
                    console.log(
                        `Skipping unit without PO in sheet "${sheetName}"`
                    );

                    continue;
                }

                let purchaseOrder =
                    await PurchaseOrder.findOne({
                        customerId: customer._id,
                        poNumber: currentPO
                    });

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

                } else {

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

                    if (currentInvoice) {
                        purchaseOrder.invoiceNumber =
                            currentInvoice;
                    }

                    if (currentExpiry) {
                        purchaseOrder.supportExpiryDate =
                            currentExpiry;
                    }

                    await purchaseOrder.save();
                }

                let networkUnit =
                    await NetworkUnit.findOne({
                        purchaseOrderId:
                            purchaseOrder._id,

                        unitCode,

                        hostname
                    });

                if (!networkUnit) {

                    await NetworkUnit.create({
                        purchaseOrderId:
                            purchaseOrder._id,

                        unitCode,

                        hostname,

                        radioConfiguration
                    });

                    totalUnits++;

                } else {

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

        importRecord.status =
            "failed";

        importRecord.errorMessage =
            error.message;

        await importRecord.save();

        throw error;
    }
};