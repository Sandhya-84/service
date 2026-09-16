import express from "express";
import multer from "multer";

import { importExcelData } from "../services/excelImportService.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = [".xlsx", ".xls"];

        const fileName = file.originalname.toLowerCase();

        const isExcelFile = allowedExtensions.some((extension) =>
            fileName.endsWith(extension)
        );

        if (!isExcelFile) {
            return cb(new Error("Only Excel files are allowed"));
        }

        cb(null, true);
    }
});


router.post("/excel", upload.single("file"), async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Excel file is required"
            });
        }

        const result = await importExcelData(
            req.file.buffer,
            req.file.originalname
        );

        res.status(200).json({
            message: "Excel data imported successfully",
            result
        });

    } catch (error) {

        console.error("Excel import error:", error);

        res.status(500).json({
            message: "Excel import failed",
            error: error.message
        });
    }
});


export default router;