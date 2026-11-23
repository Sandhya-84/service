import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import NetworkUnit from "../models/NetworkUnit.js";
import EvalValue from "../models/EvalValue.js";

/**
 * Auto-detect database name from MongoDB connection string
 * e.g. mongodb://user:pass@host1,host2/database_name?replicaSet=... -> "database_name"
 */
export function getDatabaseNameFromUri(uri = process.env.MONGO_URI) {
    if (!uri) return "network_support_tracker";
    try {
        const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
        const pathPart = withoutProtocol.split("/")[1];
        if (pathPart) {
            const dbName = pathPart.split("?")[0];
            if (dbName && dbName.trim()) {
                return dbName.trim();
            }
        }
    } catch {
        // Fallback to default
    }
    return "network_support_tracker";
}

// Map collection name to Mongoose Model for seamless fallback
const MODEL_MAP = {
    customers: Customer,
    customer: Customer,
    purchaseorders: PurchaseOrder,
    purchaseorder: PurchaseOrder,
    purchase_orders: PurchaseOrder,
    networkunits: NetworkUnit,
    networkunit: NetworkUnit,
    network_units: NetworkUnit,
    evalvalues: EvalValue,
    evalvalue: EvalValue,
    eval_values: EvalValue
};

class McpMongoManager {
    constructor() {
        this.client = null;
        this.transport = null;
        this.isConnected = false;
        this.initPromise = null;
        this.lastError = null;
        this.databaseName = getDatabaseNameFromUri();
    }

    /**
     * Initialize singleton MCP Client connected to read-only MongoDB MCP Server
     */
    async init() {
        if (this.isConnected && this.client) {
            return this.client;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            const mongoUri = process.env.MONGO_URI;
            this.databaseName = getDatabaseNameFromUri(mongoUri);

            if (!mongoUri) {
                this.lastError = "MONGO_URI is not defined in environment";
                console.warn("[MCP MongoDB] Cannot start MCP Server: MONGO_URI not configured. Falling back to Mongoose.");
                this.isConnected = false;
                return null;
            }

            try {
                const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
                const logDirectory = path.resolve(process.cwd(), ".mcp-logs");

                // Initialize Stdio transport to npx -y @mongodb-js/mongodb-mcp-server --readOnly
                this.transport = new StdioClientTransport({
                    command: npxCmd,
                    args: ["-y", "@mongodb-js/mongodb-mcp-server", "--readOnly"],
                    env: {
                        ...process.env,
                        MDB_MCP_CONNECTION_STRING: mongoUri,
                        MDB_MCP_LOG_PATH: logDirectory
                    }
                });

                this.client = new Client(
                    {
                        name: "candela-assistant-client",
                        version: "1.0.0"
                    },
                    {
                        capabilities: {}
                    }
                );

                console.log("[MCP MongoDB] Spawning read-only MongoDB MCP server child process...");
                await this.client.connect(this.transport);

                // Authenticate and bind the MongoDB session to the connection string
                try {
                    const connRes = await this.client.callTool({
                        name: "connect",
                        arguments: { connectionStringOrClusterName: mongoUri }
                    });

                    if (connRes && !connRes.isError) {
                        this.isConnected = true;
                        this.lastError = null;
                        console.log(`[MCP MongoDB] Connected to database: ${this.databaseName} (readOnly: true)`);
                    } else {
                        const errMsg = connRes?.content?.[0]?.text || "Failed to connect session";
                        console.warn("[MCP MongoDB] MCP connect tool reported:", errMsg);
                        this.lastError = errMsg;
                        // MCP client initialized, but connection failed; graceful Mongoose fallback enabled
                        this.isConnected = false;
                    }
                } catch (connErr) {
                    console.warn("[MCP MongoDB] MCP connect session error:", connErr.message);
                    this.lastError = connErr.message;
                    this.isConnected = false;
                }

                return this.client;
            } catch (err) {
                this.lastError = err.message;
                this.isConnected = false;
                console.warn("[MCP MongoDB] Initialization failed, will use resilient Mongoose fallback:", err.message);
                return null;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    /**
     * Get live status of MCP engine
     */
    getStatus() {
        return {
            connected: this.isConnected,
            initializing: Boolean(this.initPromise),
            database: this.databaseName || getDatabaseNameFromUri(),
            server: "@mongodb-js/mongodb-mcp-server",
            readOnly: true,
            lastError: this.lastError
        };
    }

    /**
     * Parse documents array from MCP find/aggregate tool content
     */
    _parseToolDocuments(content) {
        if (!Array.isArray(content)) return [];
        const docs = [];
        for (let i = 0; i < content.length; i++) {
            const item = content[i];
            if (!item || !item.text) continue;
            // The first item is often a human header like "Found N documents in collection `name`:"
            if (item.text.startsWith("Found ") && item.text.includes("documents in the collection")) {
                continue;
            }
            try {
                const parsed = JSON.parse(item.text);
                docs.push(parsed);
            } catch {
                // Not JSON or text note, ignore
            }
        }
        return docs;
    }

    /**
     * Parse document count from MCP count tool content
     */
    _parseCountResult(content) {
        if (!Array.isArray(content) || !content[0]?.text) return null;
        const text = content[0].text;
        const match = text.match(/Found\s+(\d+)\s+documents/i);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
        return null;
    }

    /**
     * Execute a find query via MCP `find` tool, falling back seamlessly to Mongoose
     */
    async find({ collection, filter = {}, projection, limit = 100, sort }) {
        const col = collection.toLowerCase();
        const dbName = this.databaseName || getDatabaseNameFromUri();

        if (this.isConnected && this.client) {
            try {
                const args = {
                    database: dbName,
                    collection: col,
                    filter: filter || {},
                    limit: Math.min(limit, 500)
                };
                if (projection) args.projection = projection;
                if (sort) args.sort = sort;

                const result = await this.client.callTool({
                    name: "find",
                    arguments: args
                });

                if (result && !result.isError) {
                    const documents = this._parseToolDocuments(result.content);
                    return {
                        success: true,
                        source: "mcp",
                        count: documents.length,
                        documents
                    };
                }
            } catch (mcpErr) {
                console.warn(`[MCP MongoDB] find on '${col}' failed, falling back to Mongoose:`, mcpErr.message);
                this.lastError = mcpErr.message;
            }
        }

        // Resilient Mongoose Fallback
        const Model = MODEL_MAP[col];
        if (!Model || mongoose.connection?.readyState !== 1) {
            return { success: true, source: "fallback_empty", count: 0, documents: [] };
        }

        try {
            let query = Model.find(filter);
            if (projection) query = query.select(projection);
            if (sort) query = query.sort(sort);
            if (limit) query = query.limit(limit);

            const documents = await query.lean();
            return {
                success: true,
                source: "mongoose_fallback",
                count: documents.length,
                documents: documents.map(d => ({
                    ...d,
                    _id: d._id ? d._id.toString() : d._id
                }))
            };
        } catch (mongooseErr) {
            console.error(`[Mongoose Fallback] find on '${col}' error:`, mongooseErr.message);
            return { success: false, source: "error", count: 0, documents: [], error: mongooseErr.message };
        }
    }

    /**
     * Execute a count query via MCP `count` tool, falling back seamlessly to Mongoose
     */
    async count({ collection, query = {} }) {
        const col = collection.toLowerCase();
        const dbName = this.databaseName || getDatabaseNameFromUri();

        if (this.isConnected && this.client) {
            try {
                const result = await this.client.callTool({
                    name: "count",
                    arguments: {
                        database: dbName,
                        collection: col,
                        query: query || {}
                    }
                });

                if (result && !result.isError) {
                    const parsedCount = this._parseCountResult(result.content);
                    if (parsedCount !== null) {
                        return {
                            success: true,
                            source: "mcp",
                            count: parsedCount
                        };
                    }
                }
            } catch (mcpErr) {
                console.warn(`[MCP MongoDB] count on '${col}' failed, falling back to Mongoose:`, mcpErr.message);
                this.lastError = mcpErr.message;
            }
        }

        // Resilient Mongoose Fallback
        const Model = MODEL_MAP[col];
        if (!Model || mongoose.connection?.readyState !== 1) {
            return { success: true, source: "fallback_empty", count: 0 };
        }

        try {
            const count = await Model.countDocuments(query);
            return {
                success: true,
                source: "mongoose_fallback",
                count
            };
        } catch (mongooseErr) {
            console.error(`[Mongoose Fallback] count on '${col}' error:`, mongooseErr.message);
            return { success: false, source: "error", count: 0, error: mongooseErr.message };
        }
    }

    /**
     * Execute an aggregate query via MCP `aggregate` tool, falling back seamlessly to Mongoose
     */
    async aggregate({ collection, pipeline = [], limit = 100 }) {
        const col = collection.toLowerCase();
        const dbName = this.databaseName || getDatabaseNameFromUri();

        if (this.isConnected && this.client) {
            try {
                const result = await this.client.callTool({
                    name: "aggregate",
                    arguments: {
                        database: dbName,
                        collection: col,
                        pipeline: pipeline || [],
                        limit: Math.min(limit, 500)
                    }
                });

                if (result && !result.isError) {
                    const documents = this._parseToolDocuments(result.content);
                    return {
                        success: true,
                        source: "mcp",
                        count: documents.length,
                        documents
                    };
                }
            } catch (mcpErr) {
                console.warn(`[MCP MongoDB] aggregate on '${col}' failed, falling back to Mongoose:`, mcpErr.message);
                this.lastError = mcpErr.message;
            }
        }

        // Resilient Mongoose Fallback
        const Model = MODEL_MAP[col];
        if (!Model || mongoose.connection?.readyState !== 1) {
            return { success: true, source: "fallback_empty", count: 0, documents: [] };
        }

        try {
            const documents = await Model.aggregate(pipeline);
            return {
                success: true,
                source: "mongoose_fallback",
                count: documents.length,
                documents: documents.map(d => ({
                    ...d,
                    _id: d._id ? d._id.toString() : d._id
                }))
            };
        } catch (mongooseErr) {
            console.error(`[Mongoose Fallback] aggregate on '${col}' error:`, mongooseErr.message);
            return { success: false, source: "error", count: 0, documents: [], error: mongooseErr.message };
        }
    }
}

// Export singleton instance
export const mcpMongoManager = new McpMongoManager();

// Automatically trigger background connection attempt on module import
mcpMongoManager.init().catch(err => {
    console.warn("[MCP MongoDB] Background init non-fatal note:", err.message);
});

export default mcpMongoManager;
