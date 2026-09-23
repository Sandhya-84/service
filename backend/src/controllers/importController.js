import {
    importExcelFile
} from "../services/excelImportService.js";

import Import from "../models/Import.js";

export const importExcel = async (
    req,
    res
) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message:
                    "Excel file is required"
            });
        }

        const result =
            await importExcelFile({
                buffer:
                    req.file.buffer,

                fileName:
                    req.file.originalname
            });

        return res.status(200).json({
            message:
                "Excel file imported successfully",

            result
        });
    } catch (error) {
        console.error(
            "Excel import controller error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to import Excel file",

            error:
                error.message
        });
    }
};

export const getImportHistory =
    async (req, res) => {
        try {
            const imports =
                await Import.find()
                    .sort({
                        importedAt: -1
                    })
                    .limit(20);

            return res.status(200).json({
                imports
            });
        } catch (error) {
            console.error(
                "Get import history error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch import history",

                error:
                    error.message
            });
        }
    };