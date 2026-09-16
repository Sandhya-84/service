import XLSX from "xlsx";
import NetworkUnit from "../models/NetworkUnit.js";

export const importExcelFile = async (filePath) => {
    try {
        // Read Excel file
        const workbook = XLSX.readFile(filePath);

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert Excel data into JSON
        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: ""
        });

        const results = {
            created: 0,
            updated: 0,
            skipped: 0
        };

        for (const row of rows) {

            // Map Excel columns to our database fields
            const unitCode = String(row["Unit"]).trim();

            if (!unitCode) {
                results.skipped++;
                continue;
            }

            const unitData = {
                unitCode,
                hostname: String(row["Hostname"] || "").trim(),
                radioConfiguration: String(
                    row["Radio configuration"] || ""
                ).trim(),
                poNumber: String(
                    row["PO-Details"] || ""
                ).trim(),
                invoiceNumber: String(
                    row["Invoice Number"] || ""
                ).trim(),
                supportExpiryDate:
                    row["Support Expiry Date"] || null
            };

            // Check whether this unit already exists
            const existingUnit = await NetworkUnit.findOne({
                unitCode
            });

            if (existingUnit) {

                // Update existing unit
                await NetworkUnit.updateOne(
                    { unitCode },
                    {
                        $set: {
                            hostname: unitData.hostname,
                            radioConfiguration:
                                unitData.radioConfiguration,
                            poNumber: unitData.poNumber,
                            invoiceNumber:
                                unitData.invoiceNumber,
                            supportExpiryDate:
                                unitData.supportExpiryDate
                        }
                    }
                );

                results.updated++;

            } else {

                // Create new unit
                await NetworkUnit.create(unitData);

                results.created++;
            }
        }

        return results;

    } catch (error) {
        throw new Error(
            `Excel import failed: ${error.message}`
        );
    }
};