import {
    getEvalValues,
    getEvalSummary
} from "../services/evalValueImportService.js";


// =====================================================
// GET ALL EVAL VALUES
// =====================================================

export const getAllEvalValues =
    async (
        req,
        res
    ) => {

        try {

            const records =
                await getEvalValues();


            return res.status(
                200
            ).json({

                success: true,

                count:
                    records.length,

                data:
                    records

            });

        } catch (error) {

            console.error(
                "Get EVAL values error:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    "Failed to load EVAL values"

            });

        }

    };


// =====================================================
// GET EVAL SUMMARY
// =====================================================

export const getEvalValuesSummary =
    async (
        req,
        res
    ) => {

        try {

            const summary =
                await getEvalSummary();


            return res.status(
                200
            ).json({

                success: true,

                data:
                    summary

            });

        } catch (error) {

            console.error(
                "Get EVAL summary error:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    "Failed to load EVAL summary"

            });

        }

    };