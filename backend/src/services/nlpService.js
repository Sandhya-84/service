import mongoose from "mongoose";
import Customer from "../models/Customer.js";

/**
 * Stopwords to filter out when tokenizing queries
 */
const STOPWORDS = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "from", "by", "with", "about", "into", "through",
    "during", "before", "after", "above", "below", "to", "of", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "can", "will", "just", "don", "should", "now", "please", "tell", "me", "show",
    "give", "list", "find", "get", "display", "check", "search", "lookup", "fetch",
    "what", "which", "who", "whom", "this", "that", "these", "those", "am",
    "have", "has", "had", "having", "do", "does", "did", "doing", "would", "could"
]);

/**
 * Compute Levenshtein distance between two strings
 */
export const levenshteinDistance = (str1, str2) => {
    const s1 = (str1 || "").toLowerCase().trim();
    const s2 = (str2 || "").toLowerCase().trim();
    if (s1 === s2) return 0;
    if (!s1.length) return s2.length;
    if (!s2.length) return s1.length;

    const row = [];
    for (let i = 0; i <= s2.length; i++) row[i] = i;

    for (let i = 1; i <= s1.length; i++) {
        let prev = i;
        for (let j = 1; j <= s2.length; j++) {
            let val;
            if (s1[i - 1] === s2[j - 1]) {
                val = row[j - 1];
            } else {
                val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
            }
            row[j - 1] = prev;
            prev = val;
        }
        row[s2.length] = prev;
    }
    return row[s2.length];
};

/**
 * Fuzzy match a candidate company name against all registered database customers
 */
export const findMatchingCustomer = async (candidateText) => {
    try {
        if (!candidateText || typeof candidateText !== "string" || candidateText.trim().length < 2) {
            return null;
        }

        // If mongoose is not connected, do not buffer and hang
        if (mongoose.connection?.readyState !== 1) {
            return null;
        }

        const cleaned = candidateText
            .trim()
            .toLowerCase()
            .replace(/^(the|our|all|any)\s+/i, "")
            .replace(/\b(company|inc|corp|ltd|llc|technologies|systems|networks|co)\b/gi, "")
            .trim();

        if (!cleaned) return null;

        // 1. Exact or Substring RegExp match in database
        const regex = new RegExp(cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const exactOrSub = await Customer.findOne({ name: { $regex: regex } });
        if (exactOrSub) return exactOrSub;

        // 2. Fetch all customers for fuzzy distance check if < 1000 customers
        const allCustomers = await Customer.find().limit(200);
        let bestMatch = null;
        let minDistance = Infinity;

        for (const cust of allCustomers) {
            const cName = cust.name.toLowerCase().trim();
            const dist = levenshteinDistance(cleaned, cName);

            // Allow distance of 1 for words >= 4 chars, distance of 2 for words >= 6 chars
            const maxAllowed = cleaned.length >= 6 ? 2 : (cleaned.length >= 4 ? 1 : 0);
            if (dist <= maxAllowed && dist < minDistance) {
                minDistance = dist;
                bestMatch = cust;
            }

            // Also test partial word matches (e.g. "juniper" in "Juniper Networks")
            const words = cName.split(/[\s\-_]+/);
            for (const w of words) {
                const wDist = levenshteinDistance(cleaned, w);
                if (wDist <= (cleaned.length >= 5 ? 1 : 0) && wDist < minDistance) {
                    minDistance = wDist;
                    bestMatch = cust;
                }
            }
        }

        return bestMatch;
    } catch (e) {
        console.error("Fuzzy customer match error:", e);
        return null;
    }
};

/**
 * Parse relative and colloquial date/time expressions into number of days
 */
export const parseRelativeTimeDays = (text) => {
    const lower = text.toLowerCase();

    // Check explicit numeric days (e.g. "in 45 days", "60 days", "within 15 days")
    const matchDays = lower.match(/(?:in|within|next|upcoming)?\s*(\d+)\s*days?/i);
    if (matchDays && matchDays[1]) {
        const d = parseInt(matchDays[1], 10);
        if (!isNaN(d) && d > 0) return d;
    }

    // "in 2 weeks", "3 weeks"
    const matchWeeks = lower.match(/(?:in|within|next)?\s*(\d+)\s*weeks?/i);
    if (matchWeeks && matchWeeks[1]) {
        const w = parseInt(matchWeeks[1], 10);
        if (!isNaN(w) && w > 0) return w * 7;
    }

    // "next week", "a week", "one week"
    if (/\b(?:next\s*week|a\s*week|one\s*week|this\s*week)\b/i.test(lower)) {
        return 7;
    }

    // "next month", "this month", "in a month", "1 month"
    if (/\b(?:next\s*month|this\s*month|in\s*a\s*month|1\s*month|one\s*month)\b/i.test(lower)) {
        return 30;
    }

    // "2 months", "3 months", "quarter"
    const matchMonths = lower.match(/(?:in|within|next)?\s*(\d+)\s*months?/i);
    if (matchMonths && matchMonths[1]) {
        const m = parseInt(matchMonths[1], 10);
        if (!isNaN(m) && m > 0) return m * 30;
    }

    if (/\b(?:next\s*quarter|this\s*quarter|quarter)\b/i.test(lower)) {
        return 90;
    }

    if (/\b(?:half\s*year|6\s*months?)\b/i.test(lower)) {
        return 180;
    }

    if (/\b(?:next\s*year|this\s*year|a\s*year|1\s*year)\b/i.test(lower)) {
        return 365;
    }

    // Default if "expiring" or "soon" is mentioned
    return 30;
};

/**
 * Natural Language Query Transfer Engine
 * Analyzes natural language input, extracts semantic intent and entities,
 * and transfers them into structured query parameters.
 */
export const transferNaturalLanguageQuery = async (rawPrompt) => {
    if (!rawPrompt || typeof rawPrompt !== "string") {
        return {
            intent: "GENERAL_SEARCH",
            prompt: "",
            targetCustomer: null,
            filters: {}
        };
    }

    const prompt = rawPrompt.trim();
    const lower = prompt.toLowerCase();

    // 1. Tokenize and extract keywords
    const rawTokens = lower.split(/[\s,?.!:;]+/).filter(Boolean);
    const meaningfulTokens = rawTokens.filter(t => !STOPWORDS.has(t));

    // 2. Detect Intent Patterns
    const isCompanyIntent = /(?:units|network\s*units|pos?|purchase\s*orders?|contracts?|everything|all|info|details|overview|telemetry|summary|hardware|fleet|devices)\s+(?:of|for|about|on|from)\s+([a-zA-Z0-9_\-\.\s']+)/i;
    const isCompanySuffix = /([a-zA-Z0-9_\-\.\s']+?)\s+(?:units|network\s*units|pos?|purchase\s*orders?|contracts?|info|details|overview|summary|hardware|fleet|devices)/i;
    const isTellMeAbout = /(?:everything\s+about|all\s+about|tell\s+me\s+about|what\s+about|info\s+about|how\s+is|status\s+of)\s+([a-zA-Z0-9_\-\.\s']+)/i;

    // Check for explicit company references
    let candidateCompanyName = null;
    const match1 = lower.match(isCompanyIntent);
    const match3 = lower.match(isTellMeAbout);

    if (match1 && match1[1]) {
        candidateCompanyName = match1[1].split(/\b(?:doesn['’]?t|does\s*not|that|which|with|where|who|having|has|without|and)\b/i)[0];
    } else if (match3 && match3[1]) {
        candidateCompanyName = match3[1].split(/\b(?:doesn['’]?t|does\s*not|that|which|with|where|who|having|has|without|and)\b/i)[0];
    } else {
        // Only use suffix pattern if prompt is short (<= 4 words)
        // e.g. "Juniper units", "Acme contracts" (not "can you please tell me which contracts")
        const wordCount = lower.trim().split(/\s+/).length;
        if (wordCount <= 4) {
            const match2 = lower.match(isCompanySuffix);
            if (match2 && match2[1]) {
                const cleanedPrefix = match2[1].replace(/^(can|could|please|tell|me|which|show|all|our|any|the)\s+/gi, "").trim();
                if (cleanedPrefix.length >= 2) {
                    candidateCompanyName = cleanedPrefix;
                }
            }
        }
    }

    // If candidate found, clean words like "expired", "active", "without po"
    if (candidateCompanyName) {
        candidateCompanyName = candidateCompanyName
            .replace(/\b(expired|expiring|active|without\s*po|missing\s*po|renewed|unrenewed|top|stats)\b/gi, "")
            .trim();
    }

    // Try finding customer by candidate name
    let targetCustomer = candidateCompanyName ? await findMatchingCustomer(candidateCompanyName) : null;

    // Check every meaningful token against registered customers if not yet resolved
    if (!targetCustomer) {
        for (const token of meaningfulTokens) {
            if (token.length >= 3 && !STOPWORDS.has(token)) {
                const candidate = await findMatchingCustomer(token);
                if (candidate) {
                    targetCustomer = candidate;
                    break;
                }
            }
        }
    }

    // Only test entire prompt as customer name if prompt is short (<= 3 words, e.g. "Juniper", "Cisco Systems")
    if (!targetCustomer && rawTokens.length <= 3) {
        targetCustomer = await findMatchingCustomer(prompt);
    }

    // 3. Status & Condition Detection with comprehensive synonym expansion
    const hasExpiring = /\b(expiring|expire|lapse|lapsing|due\s*for\s*renewal|upcoming\s*expir|nearing\s*expir|going\s*to\s*expire|going\s*to\s*lapse|ending\s*soon|contracts?\s*ending)\b/i.test(lower);
    const hasExpired = /\b(expired|lapsed|past\s*due|overdue|terminated|out\s*of\s*support|ended)\b/i.test(lower) && !hasExpiring;
    const hasActive = /\b(active\s*(?:pos?|contracts?|orders?)|active|valid|in\s*service|up\s*to\s*date|in\s*good\s*standing)\b/i.test(lower);
    const hasWithoutPO = /\b(without\s*(?:a\s*|any\s*|an\s*)?(?:po|purchase\s*order)|missing\s*(?:a\s*|any\s*|an\s*)?(?:po|purchase\s*order)|no\s*po|unassigned\s*(?:units?|equipment|hardware|devices?)|orphan\s*units?|unlinked\s*units?|not\s*assigned\s*to\s*(?:any\s*|a\s*)?po|doesn't\s*have\s*(?:any\s*)?purchase\s*order|no\s*order\s*attached|(?:hardware|equipment|units?|devices?)\s+without\s+(?:a\s*|any\s*|an\s*)?(?:po|purchase\s*order))\b/i.test(lower);
    const hasAssigned = /\b(assigned\s*units?|units\s*with\s*po|units\s*linked\s*to\s*po|linked\s*units?)\b/i.test(lower);
    const hasRenewed = /\b(renewed\s*(?:pos?|contracts?|orders?)?)\b/i.test(lower) && !/\b(not|un|un-)\b/i.test(lower);
    const hasUnrenewed = /\b(unrenewed|not\s*renewed|pending\s*renewal|un-renewed|needs?\s*renewal|awaiting\s*renewal)\b/i.test(lower);
    const hasNoExpiry = /\b(no\s*expiry|missing\s*expiry|without\s*expiry|no\s*date|undated)\b/i.test(lower);
    const hasUpcomingRenewal = /\b(next\s*renewal|upcoming\s*renewals?|renewal\s*schedule|renewal\s*dates?)\b/i.test(lower);
    const hasRenewalHistory = /\b(renewal\s*history|renewals?\s*history|renewal\s*logs?|history\s*of\s*renewals?)\b/i.test(lower);
    const hasActivity = /\b(recent\s*activity|activity\s*logs?|audit\s*logs?|audit\s*trail|recent\s*logs?|latest\s*changes?|latest\s*actions?|changed\s*recently|recently\s*changed)\b/i.test(lower);
    const hasImports = /\b(recent\s*imports?|import\s*history|excel\s*imports?|data\s*imports?|uploaded\s*files?|recent\s*uploads?)\b/i.test(lower);
    const hasStats = /\b(stats|system\s*stats|overview|executive\s*overview|executive\s*summary|briefing|metrics|how\s*many|total\s*(?:counts?|pos?|units?|customers?)|summary|dashboard\s*counts?|fleet\s*health|fleet\s*status)\b/i.test(lower);
    const hasTopCustomers = /\b(top\s*(?:customers?|clients?|accounts?)|(?:customer|client)\s*ranking|(?:customer|client)\s*breakdown|largest\s*(?:customers?|clients?|accounts?)|biggest\s*(?:customers?|clients?|accounts?)|leaderboard|most\s*(?:units|equipment|hardware|devices))\b/i.test(lower);
    const hasEval = /\b(eval|eval\s*units?|eval\s*values?|eval\s*data|lab\s*units?|lab\s*samples?)\b/i.test(lower);
    const hasRMA = /\b(rma|return\s*merchandise|damaged|defective|returned|broken\s*(?:units?|devices?|equipment))\b/i.test(lower);

    // 4. Hardware and Technical Entity Detection
    const matchRadio = lower.match(/\b(?:radio|radios|radio\s*config|radio\s*configuration)\s*[:=]?\s*([a-zA-Z0-9_.\-\s]+)/i);
    const matchHost = lower.match(/\b(?:hostname|host)\s*[:=]?\s*([a-zA-Z0-9_.\-]+)/i);
    const matchUnitCode = lower.match(/\b(?:unit\s*code|unit)\s*[:#]?\s*([a-zA-Z0-9_.\-]+)/i);
    const matchPO = lower.match(/\b(?:po\s*(?:#|number|num)?\s*[:=]?\s*|purchase\s*order\s*(?:#|number)?\s*[:=]?\s*)([a-zA-Z0-9_\-\.]+)/i);
    const matchInvoice = lower.match(/\b(?:invoice|invoice\s*number|inv)\s*[:#]?\s*([a-zA-Z0-9_.\-]+)/i);
    const matchTeam = lower.match(/\bteam\s+([a-zA-Z0-9_\-]+)/i) || lower.match(/\bassigned\s+to\s+team\s+([a-zA-Z0-9_\-]+)/i);
    const isUnassignedTeam = /\b(unassigned\s*teams?|team\s*unassigned|no\s*team)\b/i.test(lower);

    // 5. Transfer / Classify Final Primary Intent
    let intent = "GENERAL_SEARCH";

    if (targetCustomer) {
        intent = "COMPANY_DOSSIER";
    } else if (matchPO && matchPO[1] && matchPO[1].length >= 3 && !/\b(days?|weeks?|units?|customers?)\b/i.test(matchPO[1])) {
        intent = "PURCHASE_ORDER";
    } else if (hasStats) {
        intent = "SYSTEM_STATS";
    } else if (hasTopCustomers) {
        intent = "TOP_CUSTOMERS";
    } else if (hasRenewalHistory) {
        intent = "RENEWAL_HISTORY";
    } else if (hasActivity) {
        intent = "ACTIVITY_LOGS";
    } else if (hasImports) {
        intent = "IMPORT_HISTORY";
    } else if (hasRMA) {
        intent = "RMA";
    } else if (hasExpiring) {
        intent = "EXPIRING";
    } else if (hasExpired) {
        intent = "EXPIRED";
    } else if (hasActive) {
        intent = "ACTIVE";
    } else if (hasWithoutPO) {
        intent = "WITHOUT_PO";
    } else if (hasAssigned) {
        intent = "ASSIGNED_UNITS";
    } else if (hasRenewed) {
        intent = "RENEWED";
    } else if (hasUnrenewed) {
        intent = "UNRENEWED";
    } else if (hasNoExpiry) {
        intent = "NO_EXPIRY";
    } else if (hasUpcomingRenewal) {
        intent = "UPCOMING_RENEWAL";
    } else if (isUnassignedTeam) {
        intent = "UNASSIGNED_TEAM";
    } else if (matchTeam && matchTeam[1]) {
        intent = "TEAM";
    } else if (matchRadio && matchRadio[1]) {
        intent = "RADIO_CONFIG";
    } else if (matchHost && matchHost[1]) {
        intent = "HOSTNAME";
    } else if (matchInvoice && matchInvoice[1]) {
        intent = "INVOICE";
    } else if (matchUnitCode && matchUnitCode[1]) {
        intent = "UNIT_CODE";
    } else if (hasEval) {
        intent = "EVAL_UNITS";
    }

    return {
        intent,
        prompt,
        targetCustomer,
        nDays: hasExpiring ? parseRelativeTimeDays(lower) : 30,
        subFilters: {
            hasExpiring,
            hasExpired,
            hasActive,
            hasWithoutPO,
            hasAssigned,
            hasRenewed,
            hasUnrenewed,
            hasNoExpiry,
            hasRMA,
            poNumber: matchPO && matchPO[1] ? matchPO[1].trim() : null,
            team: matchTeam && matchTeam[1] ? matchTeam[1].trim() : (isUnassignedTeam ? "Unassigned" : null),
            radio: matchRadio && matchRadio[1] ? matchRadio[1].trim() : null,
            hostname: matchHost && matchHost[1] ? matchHost[1].trim() : null,
            unitCode: matchUnitCode && matchUnitCode[1] ? matchUnitCode[1].trim() : null,
            invoice: matchInvoice && matchInvoice[1] ? matchInvoice[1].trim() : null
        }
    };
};

export default {
    levenshteinDistance,
    findMatchingCustomer,
    parseRelativeTimeDays,
    transferNaturalLanguageQuery
};
