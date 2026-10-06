const ACTIVITY_STORAGE_KEY = "supportRecentActivities";

export const getStoredActivities = () => {
    try {
        const stored =
            localStorage.getItem(
                ACTIVITY_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Failed to read activities:",
            error
        );

        return [];
    }
};


export const logActivity = ({
    action,
    title,
    description,
    customerName = "",
    poNumber = "",
    unitCode = "",
    unitCount = 1,
    details = ""
}) => {

    const activity = {
        id:
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,

        action:
            action || "updated",

        title:
            title || "Record updated",

        description:
            description || "",

        customerName:
            customerName || "",

        poNumber:
            poNumber || "",

        unitCode:
            unitCode || "",

        unitCount:
            Number(unitCount) || 1,

        details:
            details || "",

        updatedAt:
            new Date().toISOString()
    };


    const existing =
        getStoredActivities();


    const updated = [
        activity,
        ...existing
    ].slice(0, 100);


    try {

        localStorage.setItem(
            ACTIVITY_STORAGE_KEY,
            JSON.stringify(updated)
        );


        /*
        |------------------------------------------------------------------
        | Notify RecentActivity immediately
        |------------------------------------------------------------------
        */

        window.dispatchEvent(
            new CustomEvent(
                "support:activity",
                {
                    detail: activity
                }
            )
        );

    } catch (error) {

        console.error(
            "Failed to save activity:",
            error
        );

    }


    return activity;
};


export const clearStoredActivities = () => {

    try {

        localStorage.removeItem(
            ACTIVITY_STORAGE_KEY
        );

        window.dispatchEvent(
            new CustomEvent(
                "support:activity"
            )
        );

    } catch (error) {

        console.error(
            "Failed to clear activities:",
            error
        );

    }

};


export default {
    getStoredActivities,
    logActivity,
    clearStoredActivities
};