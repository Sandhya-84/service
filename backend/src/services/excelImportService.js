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
    if (!value) {
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
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
};


const getColumnValue = (row, possibleNames) => {
    for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== "") {
            return row[name];
        }
    }

    return "";
};


export const importExcelData = async (buffer, fileName) => {

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

        // Process every sheet in the workbook
        for (const sheetName of workbook.SheetNames) {

            const sheet = workbook.Sheets[sheetName];

            const headerRowIndex = findHeaderRow(sheet);

            if (headerRowIndex === -1) {
                console.log(
                    `Skipping sheet "${sheetName}" - header row not found`
                );

                continue;
            }

            const rows = XLSX.utils.sheet_to_json(sheet, {
                range: headerRowIndex,
                defval: ""
            });

            if (rows.length === 0) {
                continue;
            }


            // Sheet name = Customer name
            const customerName = cleanValue(sheetName);

            if (!customerName) {
                continue;
            }


            // Find or create customer
            let customer = await Customer.findOne({
                name: customerName
            });

            if (!customer) {
                customer = await Customer.create({
                    name: customerName
                });

                totalCustomers++;
            }


            // Values from merged Excel cells may be blank.
            // Keep the previous PO-level value.
            let currentPO = "";
            let currentInvoice = "";
            let currentExpiry = null;


            for (const row of rows) {

                const unitCode = cleanValue(
                    getColumnValue(row, [
                        "Unit",
                        "unit"
                    ])
                );

                const hostname = cleanValue(
                    getColumnValue(row, [
                        "Hostname",
                        "hostname"
                    ])
                );

                const radioConfiguration = cleanValue(
                    getColumnValue(row, [
                        "Radio configuration",
                        "radio configuration"
                    ])
                );

                const poValue = cleanValue(
                    getColumnValue(row, [
                        "PO-Details",
                        "PO Details",
                        "PO",
                        "poNumber"
                    ])
                );

                const invoiceValue = cleanValue(
                    getColumnValue(row, [
                        "Invoice Number",
                        "invoice number"
                    ])
                );

                const expiryValue = getColumnValue(row, [
                    "Support Expiry Date",
                    "support expiry date"
                ]);


                // Carry forward merged/blank PO cells
                if (poValue) {
                    currentPO = poValue;
                }

                if (invoiceValue) {
                    currentInvoice = invoiceValue;
                }

                if (expiryValue) {
                    currentExpiry = parseDate(expiryValue);
                }


                // Ignore completely empty rows
                if (!unitCode && !hostname) {
                    continue;
                }

                // A unit without a PO cannot be linked correctly
                if (!currentPO) {
                    console.log(
                        `Skipping unit without PO in sheet "${sheetName}"`
                    );

                    continue;
                }


                // Find or create PO
                let purchaseOrder = await PurchaseOrder.findOne({
                    customerId: customer._id,
                    poNumber: currentPO
                });


                if (!purchaseOrder) {

                    purchaseOrder = await PurchaseOrder.create({
                        customerId: customer._id,
                        poNumber: currentPO,
                        invoiceNumber: currentInvoice,
                        supportExpiryDate: currentExpiry
                    });

                    totalPurchaseOrders++;

                } else {

                    // If expiry changed, save old expiry first
                    if (
                        currentExpiry &&
                        purchaseOrder.supportExpiryDate &&
                        purchaseOrder.supportExpiryDate.getTime() !==
                        currentExpiry.getTime()
                    ) {

                        await RenewalHistory.create({
                            purchaseOrderId: purchaseOrder._id,
                            oldExpiryDate:
                                purchaseOrder.supportExpiryDate,
                            newExpiryDate: currentExpiry,
                            notes: `Imported from ${fileName}`
                        });
                    }


                    // Update PO source fields
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


                // Find or create unit
                let networkUnit = await NetworkUnit.findOne({
                    purchaseOrderId: purchaseOrder._id,
                    unitCode,
                    hostname
                });


                if (!networkUnit) {

                    await NetworkUnit.create({
                        purchaseOrderId: purchaseOrder._id,
                        unitCode,
                        hostname,
                        radioConfiguration
                    });

                    totalUnits++;

                } else {

                    // Update unit information if Excel changed it
                    networkUnit.hostname = hostname;
                    networkUnit.radioConfiguration =
                        radioConfiguration;

                    await networkUnit.save();
                }
            }
        }


        // Update import record
        importRecord.totalCustomers = totalCustomers;
        importRecord.totalPurchaseOrders =
            totalPurchaseOrders;
        importRecord.totalUnits = totalUnits;

        importRecord.status = "completed";

        await importRecord.save();


        return {
            importId: importRecord._id,
            totalCustomers,
            totalPurchaseOrders,
            totalUnits
        };


    } catch (error) {

        importRecord.status = "failed";
        importRecord.errorMessage = error.message;

        await importRecord.save();

        throw error;
    }
};