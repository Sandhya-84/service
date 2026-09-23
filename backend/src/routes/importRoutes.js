import express from "express";
import multer from "multer";

import {
    importExcel,
    getImportHistory
} from "../controllers/importController.js";

const router = express.Router();

const upload =
    multer({
        storage:
            multer.memoryStorage(),

        limits: {
            fileSize:
                10 * 1024 * 1024
        },

        fileFilter:
            (req, file, cb) => {
                const fileName =
                    file.originalname
                        .toLowerCase();

                const isExcelFile =
                    fileName.endsWith(".xlsx") ||
                    fileName.endsWith(".xls");

                if (!isExcelFile) {
                    return cb(
                        new Error(
                            "Only .xlsx and .xls files are allowed"
                        )
                    );
                }

                cb(null, true);
            }
    });

router.post(
    "/excel",
    upload.single("file"),
    importExcel
);

router.get(
    "/history",
    getImportHistory
);

export default router;