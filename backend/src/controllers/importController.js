import Import from "../models/Import.js";

export const getImportHistory = async (req, res) => {
    try {
        const imports = await Import.find()
            .sort({ importedAt: -1 });

        res.status(200).json({
            count: imports.length,
            imports
        });

    } catch (error) {
        console.error("Import history error:", error);

        res.status(500).json({
            message: "Failed to fetch import history",
            error: error.message
        });
    }
};