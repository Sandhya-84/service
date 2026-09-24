import express from "express";
import multer from "multer";

import {
    importExcel,
    getImportHistory
} from "../controllers/importController.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
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