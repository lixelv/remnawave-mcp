/**
 * MCP Server for Remnawave panel API — raw fetch, no SDK.
 *
 * Required env vars:
 *   REMNAWAVE_BASE_URL  - e.g. https://your-panel.example.com
 *   REMNAWAVE_API_TOKEN - JWT API token created in the panel
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.REMNAWAVE_BASE_URL ?? "").replace(/\/$/, "");
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN ?? "";

if (!BASE_URL || !API_TOKEN) {
    console.error("Error: REMNAWAVE_BASE_URL and REMNAWAVE_API_TOKEN must be set.");
    process.exit(1);
}

async function apiFetch(
    path: string,
    options: { method?: string; body?: unknown } = {}
): Promise<unknown> {
    const url = `${BASE_URL}/api${path}`;
    const init: RequestInit = {
        method: options.method ?? "GET",
        headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    const res = await fetch(url, init);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    if (!text.trim()) return null;
    return JSON.parse(text);
}

function ok(data: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    return { isError: true as const, content: [{ type: "text" as const, text: `Error: ${msg}` }] };
}

const server = new McpServer({ name: "remnawave_mcp", version: "0.2.0" });

// ============================================================
// AUTH
// ============================================================

server.registerTool("remnawave_auth_status", {
    title: "Get Auth Status",
    description: "Get the current authentication status and panel info.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/auth/status")); } catch (e) { return err(e); } });

// ============================================================
// SYSTEM
// ============================================================

server.registerTool("remnawave_system_stats", {
    title: "Get System Stats",
    description: "Overall system statistics: user counts, traffic totals, node status.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/stats")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_health", {
    title: "Get System Health",
    description: "Panel health check.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/health")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_metadata", {
    title: "Get System Metadata",
    description: "Panel metadata: version, build info.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/metadata")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_recap", {
    title: "Get System Recap",
    description: "Summary recap with key panel metrics.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/stats/recap")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_bandwidth_stats", {
    title: "Get Bandwidth Stats",
    description: "System-wide bandwidth statistics.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/stats/bandwidth")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_nodes_statistics", {
    title: "Get Nodes Statistics",
    description: "Per-node statistics: traffic, uptime, active connections.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/stats/nodes")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_nodes_metrics", {
    title: "Get Nodes Metrics",
    description: "Realtime metrics from all nodes.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/nodes/metrics")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_generate_x25519_keypair", {
    title: "Generate X25519 Key Pair",
    description: "Generate 30 X25519 key pairs for node configuration.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/system/tools/x25519/generate")); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_encrypt_happ_link", {
    title: "Encrypt Happ Crypto Link",
    description: "Encrypt a URL into a Happ crypto link.",
    inputSchema: z.object({
        linkToEncrypt: z.string().url().describe("URL to encrypt"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ linkToEncrypt }) => { try { return ok(await apiFetch("/system/tools/happ/encrypt", { method: "POST", body: { linkToEncrypt } })); } catch (e) { return err(e); } });

server.registerTool("remnawave_system_test_srr_matcher", {
    title: "Test SRR Matcher",
    description: "Debug/test the subscription response rules matcher.",
    inputSchema: z.object({
        payload: z.record(z.unknown()).describe("SRR matcher test payload (free-form JSON)"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ payload }) => { try { return ok(await apiFetch("/system/testers/srr-matcher", { method: "POST", body: payload })); } catch (e) { return err(e); } });

// ============================================================
// API TOKENS
// ============================================================

server.registerTool("remnawave_tokens_list", {
    title: "List API Tokens",
    description: "Get all API tokens.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/tokens")); } catch (e) { return err(e); } });

server.registerTool("remnawave_tokens_create", {
    title: "Create API Token",
    description: "Create a new API token.",
    inputSchema: z.object({
        tokenName: z.string().describe("Display name for this token"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ tokenName }) => { try { return ok(await apiFetch("/tokens", { method: "POST", body: { tokenName } })); } catch (e) { return err(e); } });

server.registerTool("remnawave_tokens_delete", {
    title: "Delete API Token",
    description: "Delete an API token by UUID.",
    inputSchema: z.object({
        uuid: z.string().uuid().describe("Token UUID"),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/tokens/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

// ============================================================
// KEYGEN
// ============================================================

server.registerTool("remnawave_keygen_generate", {
    title: "Generate Node Secret Key",
    description: "Generate SECRET_KEY for a Remnawave Node.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/keygen")); } catch (e) { return err(e); } });

// ============================================================
// USERS — read
// ============================================================

server.registerTool("remnawave_users_list", {
    title: "List Users",
    description: "Paginated list of all users.",
    inputSchema: z.object({
        start: z.number().int().min(0).default(0).describe("Offset"),
        size: z.number().int().min(1).max(500).default(50).describe("Page size"),
    }),
    annotations: { readOnlyHint: true },
}, async ({ start, size }) => { try { return ok(await apiFetch(`/users?start=${start}&size=${size}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_uuid", {
    title: "Get User by UUID",
    description: "Get full details of a user by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("User UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_username", {
    title: "Get User by Username",
    description: "Get a user by username.",
    inputSchema: z.object({ username: z.string().describe("Username") }),
    annotations: { readOnlyHint: true },
}, async ({ username }) => { try { return ok(await apiFetch(`/users/by-username/${encodeURIComponent(username)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_id", {
    title: "Get User by Numeric ID",
    description: "Get a user by their numeric ID.",
    inputSchema: z.object({ id: z.number().int().describe("Numeric user ID") }),
    annotations: { readOnlyHint: true },
}, async ({ id }) => { try { return ok(await apiFetch(`/users/by-id/${id}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_email", {
    title: "Get User by Email",
    description: "Find users by email address.",
    inputSchema: z.object({ email: z.string().email().describe("Email address") }),
    annotations: { readOnlyHint: true },
}, async ({ email }) => { try { return ok(await apiFetch(`/users/by-email/${encodeURIComponent(email)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_telegram_id", {
    title: "Get User by Telegram ID",
    description: "Find users by Telegram user ID.",
    inputSchema: z.object({ telegramId: z.number().int().describe("Telegram user ID") }),
    annotations: { readOnlyHint: true },
}, async ({ telegramId }) => { try { return ok(await apiFetch(`/users/by-telegram-id/${telegramId}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_short_uuid", {
    title: "Get User by Short UUID",
    description: "Get a user by their short UUID.",
    inputSchema: z.object({ shortUuid: z.string().describe("Short UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ shortUuid }) => { try { return ok(await apiFetch(`/users/by-short-uuid/${encodeURIComponent(shortUuid)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_by_tag", {
    title: "Get Users by Tag",
    description: "Find all users with a specific tag.",
    inputSchema: z.object({ tag: z.string().describe("Tag name") }),
    annotations: { readOnlyHint: true },
}, async ({ tag }) => { try { return ok(await apiFetch(`/users/by-tag/${encodeURIComponent(tag)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_tags", {
    title: "Get All User Tags",
    description: "Get all user tags that exist in the panel.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/users/tags")); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_accessible_nodes", {
    title: "Get User Accessible Nodes",
    description: "Get nodes accessible to a specific user.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("User UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}/accessible-nodes`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_get_subscription_history", {
    title: "Get User Subscription Request History",
    description: "Get subscription request history for a specific user.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("User UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}/subscription-request-history`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_resolve", {
    title: "Resolve User",
    description: "Resolve a user by any identifier (uuid, shortUuid, username, or id).",
    inputSchema: z.object({
        uuid: z.string().uuid().optional().describe("User UUID"),
        shortUuid: z.string().optional().describe("Short UUID"),
        username: z.string().optional().describe("Username"),
        id: z.number().int().optional().describe("Numeric user ID"),
    }),
    annotations: { readOnlyHint: true },
}, async (body) => { try { return ok(await apiFetch("/users/resolve", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// USERS — write
// ============================================================

server.registerTool("remnawave_users_create", {
    title: "Create User",
    description: "Create a new Remnawave user.",
    inputSchema: z.object({
        username: z.string().min(3).max(36).regex(/^[a-zA-Z0-9_-]+$/).describe("Username"),
        expireAt: z.string().describe("Expiration date ISO 8601"),
        trafficLimitBytes: z.number().int().min(0).optional().describe("Traffic limit in bytes (0=unlimited)"),
        trafficLimitStrategy: z.enum(["NO_RESET", "DAY", "WEEK", "MONTH"]).optional(),
        status: z.enum(["ACTIVE", "DISABLED", "LIMITED", "EXPIRED"]).optional(),
        description: z.string().optional(),
        tag: z.string().max(16).regex(/^[A-Z0-9_]+$/).optional().describe("Group tag"),
        telegramId: z.number().int().optional(),
        email: z.string().email().optional(),
        hwidDeviceLimit: z.number().int().min(0).optional().describe("Max devices (0=unlimited)"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_update", {
    title: "Update User",
    description: "Update an existing user by UUID or username.",
    inputSchema: z.object({
        uuid: z.string().uuid().optional(),
        username: z.string().optional(),
        expireAt: z.string().optional(),
        trafficLimitBytes: z.number().int().min(0).optional(),
        trafficLimitStrategy: z.enum(["NO_RESET", "DAY", "WEEK", "MONTH"]).optional(),
        status: z.enum(["ACTIVE", "DISABLED"]).optional(),
        description: z.string().nullable().optional(),
        tag: z.string().max(16).nullable().optional(),
        telegramId: z.number().int().nullable().optional(),
        email: z.string().email().nullable().optional(),
        hwidDeviceLimit: z.number().int().min(0).nullable().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_delete", {
    title: "Delete User",
    description: "Permanently delete a user.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("User UUID") }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_enable", {
    title: "Enable User",
    description: "Enable a disabled user.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}/actions/enable`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_disable", {
    title: "Disable User",
    description: "Disable an active user.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}/actions/disable`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_reset_traffic", {
    title: "Reset User Traffic",
    description: "Reset traffic counters for a user.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}/actions/reset-traffic`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_revoke_subscription", {
    title: "Revoke User Subscription",
    description: "Regenerate the subscription link for a user.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/users/${uuid}/actions/revoke`, { method: "POST" })); } catch (e) { return err(e); } });

// ============================================================
// USERS — bulk actions
// ============================================================

server.registerTool("remnawave_users_bulk_delete", {
    title: "Bulk Delete Users",
    description: "Delete multiple users at once (1-500 UUIDs).",
    inputSchema: z.object({ uuids: z.array(z.string().uuid()).min(1).max(500) }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/delete", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_delete_by_status", {
    title: "Bulk Delete Users by Status",
    description: "Delete all users matching a given status.",
    inputSchema: z.object({ status: z.enum(["ACTIVE", "DISABLED", "LIMITED", "EXPIRED"]) }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/delete-by-status", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_reset_traffic", {
    title: "Bulk Reset User Traffic",
    description: "Reset traffic counters for multiple users.",
    inputSchema: z.object({ uuids: z.array(z.string().uuid()).min(1).max(500) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/reset-traffic", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_reset_all_traffic", {
    title: "Bulk Reset All Users Traffic",
    description: "Reset traffic counters for ALL users.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: false },
}, async () => { try { return ok(await apiFetch("/users/bulk/all/reset-traffic", { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_revoke_subscription", {
    title: "Bulk Revoke User Subscriptions",
    description: "Regenerate subscription links for multiple users.",
    inputSchema: z.object({ uuids: z.array(z.string().uuid()).min(1).max(500) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/revoke-subscription", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_update", {
    title: "Bulk Update Users",
    description: "Update fields for multiple users at once.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1).max(500),
        status: z.enum(["ACTIVE", "DISABLED", "LIMITED", "EXPIRED"]).optional(),
        trafficLimitBytes: z.number().int().min(0).optional(),
        trafficLimitStrategy: z.enum(["NO_RESET", "DAY", "WEEK", "MONTH", "MONTH_ROLLING"]).optional(),
        expireAt: z.string().optional(),
        description: z.string().optional(),
        hwidDeviceLimit: z.number().int().min(0).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async ({ uuids, ...fields }) => { try { return ok(await apiFetch("/users/bulk/update", { method: "POST", body: { uuids, fields } })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_update_squads", {
    title: "Bulk Update Users Internal Squads",
    description: "Assign internal squads to multiple users at once.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        activeInternalSquads: z.array(z.string().uuid()).describe("Internal squad UUIDs to assign"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/update-squads", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_extend_expiration", {
    title: "Bulk Extend Users Expiration",
    description: "Extend expiration date for specific users by N days.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        extendDays: z.number().int().min(1).max(9999),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/extend-expiration-date", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_extend_all_expiration", {
    title: "Bulk Extend All Users Expiration",
    description: "Extend expiration date for ALL users by N days.",
    inputSchema: z.object({
        extendDays: z.number().int().min(1).max(9999),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/all/extend-expiration-date", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_users_bulk_update_all", {
    title: "Bulk Update All Users",
    description: "Update fields for ALL users in the panel at once.",
    inputSchema: z.object({
        status: z.enum(["ACTIVE", "DISABLED", "LIMITED", "EXPIRED"]).optional(),
        trafficLimitBytes: z.number().int().min(0).optional(),
        trafficLimitStrategy: z.enum(["NO_RESET", "DAY", "WEEK", "MONTH", "MONTH_ROLLING"]).optional(),
        expireAt: z.string().optional(),
        description: z.string().nullable().optional(),
        telegramId: z.number().int().nullable().optional(),
        email: z.string().email().nullable().optional(),
        tag: z.string().optional(),
        hwidDeviceLimit: z.number().int().nullable().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/users/bulk/all/update", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// NODES
// ============================================================

server.registerTool("remnawave_nodes_list", {
    title: "List Nodes",
    description: "Get all nodes.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/nodes")); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_get", {
    title: "Get Node",
    description: "Get a single node by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/nodes/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_get_tags", {
    title: "Get All Node Tags",
    description: "Get all existing node tags.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/nodes/tags")); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_create", {
    title: "Create Node",
    description: "Add a new node to the panel.",
    inputSchema: z.object({
        name: z.string().min(3).max(30),
        address: z.string().min(2),
        port: z.number().int().min(1).max(65535).optional(),
        configProfileUuid: z.string().uuid().describe("Config profile UUID"),
        activeInbounds: z.array(z.string().uuid()).default([]).describe("Inbound UUIDs to activate"),
        countryCode: z.string().length(2).default("XX"),
        trafficLimitBytes: z.number().int().min(0).optional(),
        notifyPercent: z.number().int().min(0).max(100).optional(),
        trafficResetDay: z.number().int().min(1).max(31).optional(),
        consumptionMultiplier: z.number().min(0.1).optional(),
        isTrafficTrackingActive: z.boolean().default(false),
        tags: z.array(z.string()).max(10).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async ({ configProfileUuid, activeInbounds, ...rest }) => {
    try {
        return ok(await apiFetch("/nodes", { method: "POST", body: { ...rest, configProfile: { activeConfigProfileUuid: configProfileUuid, activeInbounds: activeInbounds ?? [] } } }));
    } catch (e) { return err(e); }
});

server.registerTool("remnawave_nodes_update", {
    title: "Update Node",
    description: "Update an existing node.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().min(3).max(30).optional(),
        address: z.string().min(2).optional(),
        port: z.number().int().min(1).max(65535).optional(),
        configProfileUuid: z.string().uuid().optional(),
        activeInbounds: z.array(z.string().uuid()).optional(),
        countryCode: z.string().length(2).optional(),
        trafficLimitBytes: z.number().int().min(0).optional(),
        notifyPercent: z.number().int().min(0).max(100).optional(),
        trafficResetDay: z.number().int().min(1).max(31).optional(),
        consumptionMultiplier: z.number().min(0.1).optional(),
        isTrafficTrackingActive: z.boolean().optional(),
        tags: z.array(z.string()).max(10).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async ({ configProfileUuid, activeInbounds, ...rest }) => {
    try {
        return ok(await apiFetch("/nodes", { method: "PATCH", body: { ...rest, ...(configProfileUuid !== undefined ? { configProfile: { activeConfigProfileUuid: configProfileUuid, activeInbounds: activeInbounds ?? [] } } : {}) } }));
    } catch (e) { return err(e); }
});

server.registerTool("remnawave_nodes_delete", {
    title: "Delete Node",
    description: "Permanently delete a node.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/nodes/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_enable", {
    title: "Enable Node",
    description: "Enable a disabled node.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/nodes/${uuid}/actions/enable`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_disable", {
    title: "Disable Node",
    description: "Disable an active node.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/nodes/${uuid}/actions/disable`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_restart", {
    title: "Restart Node",
    description: "Restart a single node.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/nodes/${uuid}/actions/restart`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_restart_all", {
    title: "Restart All Nodes",
    description: "Restart all nodes simultaneously.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: false },
}, async () => { try { return ok(await apiFetch("/nodes/actions/restart-all", { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_reset_traffic", {
    title: "Reset Node Traffic",
    description: "Reset traffic counters for a node.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/nodes/${uuid}/actions/reset-traffic`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_reorder", {
    title: "Reorder Nodes",
    description: "Reorder nodes display order.",
    inputSchema: z.object({
        orderedUuids: z.array(z.string().uuid()).describe("Node UUIDs in desired order"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/nodes/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_bulk_action", {
    title: "Bulk Node Action",
    description: "Perform a bulk action (ENABLE/DISABLE/RESTART/RESET_TRAFFIC) on multiple nodes.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        action: z.enum(["ENABLE", "DISABLE", "RESTART", "RESET_TRAFFIC"]),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/nodes/bulk-actions", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_nodes_bulk_profile_modification", {
    title: "Bulk Node Profile Modification",
    description: "Modify inbounds & config profile for many nodes at once.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        configProfileUuid: z.string().uuid().describe("Config profile UUID to apply"),
        activeInbounds: z.array(z.string().uuid()).min(1).describe("Inbound UUIDs to activate"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ uuids, configProfileUuid, activeInbounds }) => {
    try {
        return ok(await apiFetch("/nodes/bulk-actions/profile-modification", { method: "POST", body: { uuids, configProfile: { activeConfigProfileUuid: configProfileUuid, activeInbounds } } }));
    } catch (e) { return err(e); }
});

server.registerTool("remnawave_nodes_bulk_update", {
    title: "Bulk Update Nodes",
    description: "Update fields (countryCode, multiplier, tags, plugin, provider) for many nodes.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        countryCode: z.string().length(2).optional(),
        consumptionMultiplier: z.number().min(0.1).optional(),
        providerUuid: z.string().uuid().nullable().optional(),
        tags: z.array(z.string()).optional(),
        activePluginUuid: z.string().uuid().nullable().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async ({ uuids, ...fields }) => {
    try {
        return ok(await apiFetch("/nodes/bulk-actions/update", { method: "POST", body: { uuids, fields } }));
    } catch (e) { return err(e); }
});

// ============================================================
// HOSTS
// ============================================================

server.registerTool("remnawave_hosts_list", {
    title: "List Hosts",
    description: "Get all hosts (proxy endpoints).",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/hosts")); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_get", {
    title: "Get Host",
    description: "Get a single host by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/hosts/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_get_tags", {
    title: "Get All Host Tags",
    description: "Get all host tags used in the panel.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/hosts/tags")); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_create", {
    title: "Create Host",
    description: "Create a new host (proxy endpoint).",
    inputSchema: z.object({
        remark: z.string().min(1).max(40),
        address: z.string(),
        port: z.number().int().min(1).max(65535),
        configProfileUuid: z.string().uuid(),
        configProfileInboundUuid: z.string().uuid(),
        path: z.string().optional(),
        sni: z.string().optional(),
        host: z.string().optional(),
        allowInsecure: z.boolean().default(false),
        tag: z.string().max(32).optional(),
        isDisabled: z.boolean().default(false),
    }),
    annotations: { readOnlyHint: false },
}, async ({ configProfileUuid, configProfileInboundUuid, ...rest }) => {
    try {
        return ok(await apiFetch("/hosts", { method: "POST", body: { ...rest, inbound: { configProfileUuid, configProfileInboundUuid } } }));
    } catch (e) { return err(e); }
});

server.registerTool("remnawave_hosts_update", {
    title: "Update Host",
    description: "Update an existing host.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        remark: z.string().min(1).max(40).optional(),
        address: z.string().optional(),
        port: z.number().int().min(1).max(65535).optional(),
        configProfileUuid: z.string().uuid().optional(),
        configProfileInboundUuid: z.string().uuid().optional(),
        path: z.string().optional(),
        sni: z.string().optional(),
        host: z.string().optional(),
        allowInsecure: z.boolean().optional(),
        tag: z.string().max(32).optional(),
        isDisabled: z.boolean().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async ({ configProfileUuid, configProfileInboundUuid, ...rest }) => {
    try {
        return ok(await apiFetch("/hosts", { method: "PATCH", body: { ...rest, ...(configProfileUuid !== undefined && configProfileInboundUuid !== undefined ? { inbound: { configProfileUuid, configProfileInboundUuid } } : {}) } }));
    } catch (e) { return err(e); }
});

server.registerTool("remnawave_hosts_delete", {
    title: "Delete Host",
    description: "Delete a host by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/hosts/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_reorder", {
    title: "Reorder Hosts",
    description: "Reorder hosts display order.",
    inputSchema: z.object({
        orderedUuids: z.array(z.string().uuid()).describe("Host UUIDs in desired order"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/hosts/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_bulk_delete", {
    title: "Bulk Delete Hosts",
    description: "Delete multiple hosts at once.",
    inputSchema: z.object({ uuids: z.array(z.string().uuid()).min(1) }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/hosts/bulk/delete", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_bulk_enable", {
    title: "Bulk Enable Hosts",
    description: "Enable multiple hosts at once.",
    inputSchema: z.object({ uuids: z.array(z.string().uuid()).min(1) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/hosts/bulk/enable", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_bulk_disable", {
    title: "Bulk Disable Hosts",
    description: "Disable multiple hosts at once.",
    inputSchema: z.object({ uuids: z.array(z.string().uuid()).min(1) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/hosts/bulk/disable", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_bulk_set_inbound", {
    title: "Bulk Set Host Inbound",
    description: "Set the same inbound on multiple hosts at once.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        configProfileUuid: z.string().uuid(),
        configProfileInboundUuid: z.string().uuid(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/hosts/bulk/set-inbound", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hosts_bulk_set_port", {
    title: "Bulk Set Host Port",
    description: "Set the same port on multiple hosts at once.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()).min(1),
        port: z.number().int().min(1).max(65535),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/hosts/bulk/set-port", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// CONFIG PROFILES
// ============================================================

server.registerTool("remnawave_config_profiles_list", {
    title: "List Config Profiles",
    description: "Get all config profiles.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/config-profiles")); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_get", {
    title: "Get Config Profile",
    description: "Get a config profile by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/config-profiles/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_get_computed", {
    title: "Get Computed Config Profile",
    description: "Get the computed (fully resolved) config profile by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/config-profiles/${uuid}/computed-config`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_get_all_inbounds", {
    title: "Get All Inbounds",
    description: "Get all inbounds from all config profiles.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/config-profiles/inbounds")); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_get_inbounds_by_profile", {
    title: "Get Inbounds by Profile",
    description: "Get inbounds for a specific config profile.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("Config profile UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/config-profiles/${uuid}/inbounds`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_create", {
    title: "Create Config Profile",
    description: "Create a new config profile.",
    inputSchema: z.object({
        name: z.string().describe("Profile name"),
        config: z.record(z.unknown()).describe("Raw Xray/core config JSON"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/config-profiles", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_update", {
    title: "Update Config Profile",
    description: "Update a config profile's name or config.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        config: z.record(z.unknown()).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/config-profiles", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_delete", {
    title: "Delete Config Profile",
    description: "Delete a config profile by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/config-profiles/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_config_profiles_reorder", {
    title: "Reorder Config Profiles",
    description: "Reorder config profiles.",
    inputSchema: z.object({
        orderedUuids: z.array(z.string().uuid()),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/config-profiles/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// INTERNAL SQUADS
// ============================================================

server.registerTool("remnawave_internal_squads_list", {
    title: "List Internal Squads",
    description: "Get all internal squads.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/internal-squads")); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_get", {
    title: "Get Internal Squad",
    description: "Get an internal squad by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/internal-squads/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_get_accessible_nodes", {
    title: "Get Internal Squad Accessible Nodes",
    description: "Get nodes accessible to an internal squad.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/internal-squads/${uuid}/accessible-nodes`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_create", {
    title: "Create Internal Squad",
    description: "Create a new internal squad.",
    inputSchema: z.object({
        name: z.string(),
        inbounds: z.array(z.string().uuid()).describe("Inbound UUIDs"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/internal-squads", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_update", {
    title: "Update Internal Squad",
    description: "Update an internal squad.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        inbounds: z.array(z.string().uuid()).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/internal-squads", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_delete", {
    title: "Delete Internal Squad",
    description: "Delete an internal squad by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/internal-squads/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_add_all_users", {
    title: "Add All Users to Internal Squad",
    description: "Trigger a background job to add all users to an internal squad.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("Internal squad UUID") }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/internal-squads/${uuid}/bulk-actions/add-users`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_remove_all_users", {
    title: "Remove All Users from Internal Squad",
    description: "Trigger a background job to remove all users from an internal squad.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("Internal squad UUID") }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/internal-squads/${uuid}/bulk-actions/remove-users`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_internal_squads_reorder", {
    title: "Reorder Internal Squads",
    description: "Reorder internal squads.",
    inputSchema: z.object({ orderedUuids: z.array(z.string().uuid()) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/internal-squads/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// EXTERNAL SQUADS
// ============================================================

server.registerTool("remnawave_external_squads_list", {
    title: "List External Squads",
    description: "Get all external squads.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/external-squads")); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_get", {
    title: "Get External Squad",
    description: "Get an external squad by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/external-squads/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_create", {
    title: "Create External Squad",
    description: "Create a new external squad.",
    inputSchema: z.object({ name: z.string() }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/external-squads", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_update", {
    title: "Update External Squad",
    description: "Update an external squad's settings.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        subpageConfigUuid: z.string().uuid().nullable().optional(),
        templates: z.array(z.object({
            templateUuid: z.string().uuid(),
            templateType: z.enum(["XRAY_JSON", "XRAY_BASE64", "MIHOMO", "STASH", "CLASH", "SINGBOX"]),
        })).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/external-squads", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_delete", {
    title: "Delete External Squad",
    description: "Delete an external squad by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/external-squads/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_add_all_users", {
    title: "Add All Users to External Squad",
    description: "Trigger a background job to add all users to an external squad.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/external-squads/${uuid}/bulk-actions/add-users`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_remove_all_users", {
    title: "Remove All Users from External Squad",
    description: "Trigger a background job to remove all users from an external squad.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/external-squads/${uuid}/bulk-actions/remove-users`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_external_squads_reorder", {
    title: "Reorder External Squads",
    description: "Reorder external squads.",
    inputSchema: z.object({ orderedUuids: z.array(z.string().uuid()) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/external-squads/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// HWID DEVICES
// ============================================================

server.registerTool("remnawave_hwid_devices_list", {
    title: "List HWID Devices",
    description: "Get all HWID devices (paginated).",
    inputSchema: z.object({
        start: z.number().int().min(0).default(0),
        size: z.number().int().min(1).default(50),
    }),
    annotations: { readOnlyHint: true },
}, async ({ start, size }) => { try { return ok(await apiFetch(`/hwid/devices?start=${start}&size=${size}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_hwid_devices_get_by_user", {
    title: "Get HWID Devices by User",
    description: "Get all HWID devices for a specific user.",
    inputSchema: z.object({ userUuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ userUuid }) => { try { return ok(await apiFetch(`/hwid/devices/${userUuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_hwid_devices_stats", {
    title: "Get HWID Devices Stats",
    description: "Get statistics about HWID devices.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/hwid/devices/stats")); } catch (e) { return err(e); } });

server.registerTool("remnawave_hwid_devices_top_users", {
    title: "Get Top Users by HWID Devices",
    description: "Get users with the most HWID devices.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/hwid/devices/top-users")); } catch (e) { return err(e); } });

server.registerTool("remnawave_hwid_devices_create", {
    title: "Create HWID Device",
    description: "Register a new HWID device for a user.",
    inputSchema: z.object({
        hwid: z.string(),
        userUuid: z.string().uuid(),
        platform: z.string().optional(),
        osVersion: z.string().optional(),
        deviceModel: z.string().optional(),
        userAgent: z.string().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/hwid/devices", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hwid_devices_delete", {
    title: "Delete HWID Device",
    description: "Delete a specific HWID device for a user.",
    inputSchema: z.object({
        userUuid: z.string().uuid(),
        hwid: z.string(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/hwid/devices/delete", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_hwid_devices_delete_all", {
    title: "Delete All HWID Devices for User",
    description: "Delete all HWID devices registered for a user.",
    inputSchema: z.object({ userUuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/hwid/devices/delete-all", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// IP CONTROL
// ============================================================

server.registerTool("remnawave_ip_control_fetch_user_ips", {
    title: "Fetch User IPs",
    description: "Request IP list for a user (async — returns jobId for polling).",
    inputSchema: z.object({ uuid: z.string().uuid().describe("User UUID") }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/ip-control/fetch-ips/${uuid}`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_ip_control_get_fetch_ips_result", {
    title: "Get Fetch IPs Result",
    description: "Poll result of a fetch-ips job by jobId.",
    inputSchema: z.object({ jobId: z.string().describe("Job ID returned by fetch-ips") }),
    annotations: { readOnlyHint: true },
}, async ({ jobId }) => { try { return ok(await apiFetch(`/ip-control/fetch-ips/result/${encodeURIComponent(jobId)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_ip_control_drop_connections", {
    title: "Drop Connections",
    description: "Drop connections for users (by UUIDs or IPs) on all or specific nodes.",
    inputSchema: z.object({
        dropByType: z.enum(["userUuids", "ipAddresses"]).describe("How to identify targets"),
        userUuids: z.array(z.string().uuid()).optional().describe("User UUIDs (when dropByType=userUuids)"),
        ipAddresses: z.array(z.string()).optional().describe("IP addresses (when dropByType=ipAddresses)"),
        targetType: z.enum(["allNodes", "specificNodes"]).describe("Which nodes to target"),
        nodeUuids: z.array(z.string().uuid()).optional().describe("Node UUIDs (when targetType=specificNodes)"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ dropByType, userUuids, ipAddresses, targetType, nodeUuids }) => {
    try {
        const dropBy = dropByType === "userUuids" ? { by: "userUuids", userUuids: userUuids ?? [] } : { by: "ipAddresses", ipAddresses: ipAddresses ?? [] };
        const targetNodes = targetType === "allNodes" ? { target: "allNodes" } : { target: "specificNodes", nodeUuids: nodeUuids ?? [] };
        return ok(await apiFetch("/ip-control/drop-connections", { method: "POST", body: { dropBy, targetNodes } }));
    } catch (e) { return err(e); }
});

server.registerTool("remnawave_ip_control_fetch_users_ips", {
    title: "Fetch Users IPs for Node",
    description: "Request users IPs list for a node (async — returns jobId).",
    inputSchema: z.object({ nodeUuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async ({ nodeUuid }) => { try { return ok(await apiFetch(`/ip-control/fetch-users-ips/${nodeUuid}`, { method: "POST" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_ip_control_get_fetch_users_ips_result", {
    title: "Get Fetch Users IPs Result",
    description: "Poll result of a fetch-users-ips job by jobId.",
    inputSchema: z.object({ jobId: z.string() }),
    annotations: { readOnlyHint: true },
}, async ({ jobId }) => { try { return ok(await apiFetch(`/ip-control/fetch-users-ips/result/${encodeURIComponent(jobId)}`)); } catch (e) { return err(e); } });

// ============================================================
// INFRA BILLING — Providers
// ============================================================

server.registerTool("remnawave_infra_billing_providers_list", {
    title: "List Infra Providers",
    description: "Get all infra billing providers.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/infra-billing/providers")); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_providers_get", {
    title: "Get Infra Provider",
    description: "Get an infra billing provider by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/infra-billing/providers/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_providers_create", {
    title: "Create Infra Provider",
    description: "Create a new infra billing provider.",
    inputSchema: z.object({
        name: z.string(),
        faviconLink: z.string().url().optional(),
        loginUrl: z.string().url().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/infra-billing/providers", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_providers_update", {
    title: "Update Infra Provider",
    description: "Update an infra billing provider.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        faviconLink: z.string().url().nullable().optional(),
        loginUrl: z.string().url().nullable().optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/infra-billing/providers", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_providers_delete", {
    title: "Delete Infra Provider",
    description: "Delete an infra billing provider by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/infra-billing/providers/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

// ============================================================
// INFRA BILLING — History
// ============================================================

server.registerTool("remnawave_infra_billing_history_list", {
    title: "List Infra Billing History",
    description: "Get infra billing history records.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/infra-billing/history")); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_history_create", {
    title: "Create Infra Billing Record",
    description: "Create an infra billing history record.",
    inputSchema: z.object({
        providerUuid: z.string().uuid(),
        amount: z.number(),
        billedAt: z.string().describe("ISO 8601 datetime"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/infra-billing/history", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_history_delete", {
    title: "Delete Infra Billing Record",
    description: "Delete an infra billing history record by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/infra-billing/history/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

// ============================================================
// INFRA BILLING — Nodes
// ============================================================

server.registerTool("remnawave_infra_billing_nodes_list", {
    title: "List Infra Billing Nodes",
    description: "Get infra billing node configurations.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/infra-billing/nodes")); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_nodes_create", {
    title: "Create Infra Billing Node",
    description: "Create an infra billing node configuration.",
    inputSchema: z.object({
        providerUuid: z.string().uuid(),
        nodeUuid: z.string().uuid(),
        nextBillingAt: z.string().optional().describe("ISO 8601 datetime"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/infra-billing/nodes", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_nodes_update", {
    title: "Update Infra Billing Nodes",
    description: "Update next billing date for multiple infra billing nodes.",
    inputSchema: z.object({
        uuids: z.array(z.string().uuid()),
        nextBillingAt: z.string().describe("ISO 8601 datetime"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/infra-billing/nodes", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_infra_billing_nodes_delete", {
    title: "Delete Infra Billing Node",
    description: "Delete an infra billing node configuration by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/infra-billing/nodes/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

// ============================================================
// METADATA
// ============================================================

server.registerTool("remnawave_metadata_get_user", {
    title: "Get User Metadata",
    description: "Get custom metadata for a user.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("User UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/metadata/user/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_metadata_upsert_user", {
    title: "Upsert User Metadata",
    description: "Create or update custom metadata for a user.",
    inputSchema: z.object({
        uuid: z.string().uuid().describe("User UUID"),
        metadata: z.record(z.unknown()).describe("Free-form key/value metadata object"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ uuid, metadata }) => { try { return ok(await apiFetch(`/metadata/user/${uuid}`, { method: "PUT", body: { metadata } })); } catch (e) { return err(e); } });

server.registerTool("remnawave_metadata_get_node", {
    title: "Get Node Metadata",
    description: "Get custom metadata for a node.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("Node UUID") }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/metadata/node/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_metadata_upsert_node", {
    title: "Upsert Node Metadata",
    description: "Create or update custom metadata for a node.",
    inputSchema: z.object({
        uuid: z.string().uuid().describe("Node UUID"),
        metadata: z.record(z.unknown()).describe("Free-form key/value metadata object"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ uuid, metadata }) => { try { return ok(await apiFetch(`/metadata/node/${uuid}`, { method: "PUT", body: { metadata } })); } catch (e) { return err(e); } });

// ============================================================
// NODE PLUGINS
// ============================================================

server.registerTool("remnawave_node_plugins_list", {
    title: "List Node Plugins",
    description: "Get all node plugins.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/node-plugins")); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_get", {
    title: "Get Node Plugin",
    description: "Get a node plugin by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/node-plugins/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_create", {
    title: "Create Node Plugin",
    description: "Create a new node plugin.",
    inputSchema: z.object({ name: z.string() }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/node-plugins", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_update", {
    title: "Update Node Plugin",
    description: "Update a node plugin's name or config.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        pluginConfig: z.record(z.unknown()).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/node-plugins", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_delete", {
    title: "Delete Node Plugin",
    description: "Delete a node plugin by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/node-plugins/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_reorder", {
    title: "Reorder Node Plugins",
    description: "Reorder node plugins.",
    inputSchema: z.object({ orderedUuids: z.array(z.string().uuid()) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/node-plugins/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_clone", {
    title: "Clone Node Plugin",
    description: "Clone an existing node plugin.",
    inputSchema: z.object({ cloneFromUuid: z.string().uuid() }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/node-plugins/actions/clone", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_node_plugins_execute", {
    title: "Execute Node Plugin Command",
    description: "Execute a command (blockIps / unblockIps / recreateTables) on node plugins.",
    inputSchema: z.object({
        commandType: z.enum(["blockIps", "unblockIps", "recreateTables"]).describe("Command to execute"),
        blockIps: z.array(z.object({ ip: z.string(), timeout: z.number() })).optional().describe("IPs to block (when commandType=blockIps)"),
        unblockIps: z.array(z.string()).optional().describe("IPs to unblock (when commandType=unblockIps)"),
        targetType: z.enum(["allNodes", "specificNodes"]),
        nodeUuids: z.array(z.string().uuid()).optional().describe("Node UUIDs (when targetType=specificNodes)"),
    }),
    annotations: { readOnlyHint: false },
}, async ({ commandType, blockIps, unblockIps, targetType, nodeUuids }) => {
    try {
        let command: unknown;
        if (commandType === "blockIps") command = { command: "blockIps", ips: blockIps ?? [] };
        else if (commandType === "unblockIps") command = { command: "unblockIps", ips: unblockIps ?? [] };
        else command = { command: "recreateTables" };
        const targetNodes = targetType === "allNodes" ? { target: "allNodes" } : { target: "specificNodes", nodeUuids: nodeUuids ?? [] };
        return ok(await apiFetch("/node-plugins/executor", { method: "POST", body: { command, targetNodes } }));
    } catch (e) { return err(e); }
});

// ============================================================
// TORRENT BLOCKER (node plugin sub-feature)
// ============================================================

server.registerTool("remnawave_torrent_blocker_reports", {
    title: "Get Torrent Blocker Reports",
    description: "Get torrent blocker reports from node plugins.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/node-plugins/torrent-blocker")); } catch (e) { return err(e); } });

server.registerTool("remnawave_torrent_blocker_stats", {
    title: "Get Torrent Blocker Stats",
    description: "Get torrent blocker reports statistics.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/node-plugins/torrent-blocker/stats")); } catch (e) { return err(e); } });

server.registerTool("remnawave_torrent_blocker_truncate", {
    title: "Truncate Torrent Blocker Reports",
    description: "Delete all torrent blocker reports.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async () => { try { return ok(await apiFetch("/node-plugins/torrent-blocker/truncate", { method: "DELETE" })); } catch (e) { return err(e); } });

// ============================================================
// BANDWIDTH STATS
// ============================================================

server.registerTool("remnawave_bandwidth_stats_nodes", {
    title: "Get Nodes Bandwidth Stats",
    description: "Get bandwidth statistics for all nodes in a date range.",
    inputSchema: z.object({
        topNodesLimit: z.number().int().min(1).describe("Max number of top nodes to return"),
        start: z.string().describe("Start date YYYY-MM-DD"),
        end: z.string().describe("End date YYYY-MM-DD"),
    }),
    annotations: { readOnlyHint: true },
}, async ({ topNodesLimit, start, end }) => { try { return ok(await apiFetch(`/bandwidth-stats/nodes?topNodesLimit=${topNodesLimit}&start=${start}&end=${end}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_bandwidth_stats_node_users", {
    title: "Get Node Users Bandwidth Stats",
    description: "Get bandwidth statistics for users on a specific node.",
    inputSchema: z.object({
        uuid: z.string().uuid().describe("Node UUID"),
        topUsersLimit: z.number().int().min(1).describe("Max number of top users to return"),
        start: z.string().describe("Start date YYYY-MM-DD"),
        end: z.string().describe("End date YYYY-MM-DD"),
    }),
    annotations: { readOnlyHint: true },
}, async ({ uuid, topUsersLimit, start, end }) => { try { return ok(await apiFetch(`/bandwidth-stats/nodes/${uuid}/users?topUsersLimit=${topUsersLimit}&start=${start}&end=${end}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_bandwidth_stats_user", {
    title: "Get User Bandwidth Stats",
    description: "Get bandwidth statistics for a specific user across nodes.",
    inputSchema: z.object({
        uuid: z.string().uuid().describe("User UUID"),
        topNodesLimit: z.number().int().min(1).describe("Max number of top nodes to return"),
        start: z.string().describe("Start date YYYY-MM-DD"),
        end: z.string().describe("End date YYYY-MM-DD"),
    }),
    annotations: { readOnlyHint: true },
}, async ({ uuid, topNodesLimit, start, end }) => { try { return ok(await apiFetch(`/bandwidth-stats/users/${uuid}?topNodesLimit=${topNodesLimit}&start=${start}&end=${end}`)); } catch (e) { return err(e); } });

// ============================================================
// SUBSCRIPTION REQUEST HISTORY
// ============================================================

server.registerTool("remnawave_subscription_request_history_list", {
    title: "List Subscription Request History",
    description: "Get all subscription request history (paginated).",
    inputSchema: z.object({
        start: z.number().int().min(0).default(0),
        size: z.number().int().min(1).default(50),
    }),
    annotations: { readOnlyHint: true },
}, async ({ start, size }) => { try { return ok(await apiFetch(`/subscription-request-history?start=${start}&size=${size}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_request_history_stats", {
    title: "Get Subscription Request History Stats",
    description: "Get statistics about subscription request history.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/subscription-request-history/stats")); } catch (e) { return err(e); } });

// ============================================================
// SUBSCRIPTIONS
// ============================================================

server.registerTool("remnawave_subscriptions_list", {
    title: "List Subscriptions",
    description: "Get all subscriptions.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/subscriptions")); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscriptions_get_by_username", {
    title: "Get Subscription by Username",
    description: "Get subscription data by username.",
    inputSchema: z.object({ username: z.string() }),
    annotations: { readOnlyHint: true },
}, async ({ username }) => { try { return ok(await apiFetch(`/subscriptions/by-username/${encodeURIComponent(username)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscriptions_get_by_short_uuid", {
    title: "Get Subscription by Short UUID",
    description: "Get subscription data by short UUID.",
    inputSchema: z.object({ shortUuid: z.string() }),
    annotations: { readOnlyHint: true },
}, async ({ shortUuid }) => { try { return ok(await apiFetch(`/subscriptions/by-short-uuid/${encodeURIComponent(shortUuid)}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscriptions_get_by_uuid", {
    title: "Get Subscription by UUID",
    description: "Get subscription data by user UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscriptions/by-uuid/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscriptions_get_raw", {
    title: "Get Raw Subscription",
    description: "Get raw subscription content by short UUID.",
    inputSchema: z.object({ shortUuid: z.string() }),
    annotations: { readOnlyHint: true },
}, async ({ shortUuid }) => { try { return ok(await apiFetch(`/subscriptions/by-short-uuid/${encodeURIComponent(shortUuid)}/raw`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscriptions_get_connection_keys", {
    title: "Get Connection Keys",
    description: "Get connection keys (base64) for a user by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscriptions/connection-keys/${uuid}`)); } catch (e) { return err(e); } });

// ============================================================
// SUBSCRIPTION SETTINGS
// ============================================================

server.registerTool("remnawave_subscription_settings_get", {
    title: "Get Subscription Settings",
    description: "Get subscription settings.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/subscription-settings")); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_settings_update", {
    title: "Update Subscription Settings",
    description: "Update subscription settings (profile title, support link, HWID, SRR rules, etc.).",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        profileTitle: z.string().optional(),
        supportLink: z.string().optional(),
        profileUpdateInterval: z.number().int().optional(),
        isProfileWebpageUrlEnabled: z.boolean().optional(),
        serveJsonAtBaseSubscription: z.boolean().optional(),
        happAnnounce: z.string().nullable().optional(),
        happRouting: z.string().nullable().optional(),
        isShowCustomRemarks: z.boolean().optional(),
        randomizeHosts: z.boolean().optional(),
        hwidSettings: z.object({
            enabled: z.boolean(),
            fallbackDeviceLimit: z.number(),
            maxDevicesAnnounce: z.string().nullable(),
        }).optional(),
        responseRules: z.unknown().optional().describe("SRR config (free-form — see API docs)"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-settings", { method: "PATCH", body })); } catch (e) { return err(e); } });

// ============================================================
// SUBSCRIPTION TEMPLATES
// ============================================================

server.registerTool("remnawave_subscription_templates_list", {
    title: "List Subscription Templates",
    description: "Get all subscription templates.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/subscription-templates")); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_templates_get", {
    title: "Get Subscription Template",
    description: "Get a subscription template by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscription-templates/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_templates_create", {
    title: "Create Subscription Template",
    description: "Create a new subscription template.",
    inputSchema: z.object({
        name: z.string(),
        templateType: z.enum(["XRAY_JSON", "XRAY_BASE64", "MIHOMO", "STASH", "CLASH", "SINGBOX"]),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-templates", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_templates_update", {
    title: "Update Subscription Template",
    description: "Update a subscription template's name or content.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        templateJson: z.record(z.unknown()).optional().describe("JSON template content"),
        encodedTemplateYaml: z.string().optional().describe("Base64/YAML template content"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-templates", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_templates_delete", {
    title: "Delete Subscription Template",
    description: "Delete a subscription template by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscription-templates/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_templates_reorder", {
    title: "Reorder Subscription Templates",
    description: "Reorder subscription templates.",
    inputSchema: z.object({ orderedUuids: z.array(z.string().uuid()) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-templates/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

// ============================================================
// SUBSCRIPTION PAGE CONFIGS
// ============================================================

server.registerTool("remnawave_subscription_page_configs_list", {
    title: "List Subscription Page Configs",
    description: "Get all subscription page configs.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/subscription-page-configs")); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_page_configs_get", {
    title: "Get Subscription Page Config",
    description: "Get a subscription page config by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscription-page-configs/${uuid}`)); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_page_configs_create", {
    title: "Create Subscription Page Config",
    description: "Create a new subscription page config.",
    inputSchema: z.object({ name: z.string() }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-page-configs", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_page_configs_update", {
    title: "Update Subscription Page Config",
    description: "Update a subscription page config.",
    inputSchema: z.object({
        uuid: z.string().uuid(),
        name: z.string().optional(),
        config: z.record(z.unknown()).optional().describe("Free-form config JSON"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-page-configs", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_page_configs_delete", {
    title: "Delete Subscription Page Config",
    description: "Delete a subscription page config by UUID.",
    inputSchema: z.object({ uuid: z.string().uuid() }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscription-page-configs/${uuid}`, { method: "DELETE" })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_page_configs_reorder", {
    title: "Reorder Subscription Page Configs",
    description: "Reorder subscription page configs.",
    inputSchema: z.object({ orderedUuids: z.array(z.string().uuid()) }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/subscription-page-configs/actions/reorder", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_subscription_page_configs_clone", {
    title: "Clone Subscription Page Config",
    description: "Clone an existing subscription page config.",
    inputSchema: z.object({ uuid: z.string().uuid().describe("UUID of config to clone") }),
    annotations: { readOnlyHint: false },
}, async ({ uuid }) => { try { return ok(await apiFetch(`/subscription-page-configs/actions/clone`, { method: "POST", body: { uuid } })); } catch (e) { return err(e); } });

// ============================================================
// SNIPPETS
// ============================================================

server.registerTool("remnawave_snippets_list", {
    title: "List Snippets",
    description: "Get all snippets.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/snippets")); } catch (e) { return err(e); } });

server.registerTool("remnawave_snippets_create", {
    title: "Create Snippet",
    description: "Create a new snippet.",
    inputSchema: z.object({
        name: z.string().min(2).max(255).regex(/^[A-Za-z0-9_\s-]+$/).describe("Snippet name"),
        snippet: z.array(z.record(z.unknown())).describe("Snippet content (array of objects)"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/snippets", { method: "POST", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_snippets_update", {
    title: "Update Snippet",
    description: "Update an existing snippet (identified by name).",
    inputSchema: z.object({
        name: z.string().min(2).max(255).describe("Snippet name (used as lookup key)"),
        snippet: z.array(z.record(z.unknown())).describe("New snippet content"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/snippets", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_snippets_delete", {
    title: "Delete Snippet",
    description: "Delete a snippet by name.",
    inputSchema: z.object({
        name: z.string().min(2).max(255).describe("Snippet name to delete"),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/snippets", { method: "DELETE", body })); } catch (e) { return err(e); } });

// ============================================================
// REMNAWAVE SETTINGS
// ============================================================

server.registerTool("remnawave_settings_get", {
    title: "Get Remnawave Settings",
    description: "Get global Remnawave settings (passkeys, OAuth2, branding, etc.).",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/remnawave-settings")); } catch (e) { return err(e); } });

server.registerTool("remnawave_settings_update", {
    title: "Update Remnawave Settings",
    description: "Update global Remnawave settings.",
    inputSchema: z.object({
        brandingSettings: z.object({
            title: z.string().nullable().optional(),
            logoUrl: z.string().url().nullable().optional(),
        }).optional(),
        passwordSettings: z.object({ enabled: z.boolean() }).optional(),
        passkeySettings: z.object({
            enabled: z.boolean(),
            rpId: z.string().nullable(),
            origin: z.string().nullable(),
        }).optional(),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/remnawave-settings", { method: "PATCH", body })); } catch (e) { return err(e); } });

// ============================================================
// PASSKEYS
// ============================================================

server.registerTool("remnawave_passkeys_list", {
    title: "List Passkeys",
    description: "Get all registered passkeys.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
}, async () => { try { return ok(await apiFetch("/passkeys")); } catch (e) { return err(e); } });

server.registerTool("remnawave_passkeys_update", {
    title: "Update Passkey",
    description: "Update a passkey's display name.",
    inputSchema: z.object({
        id: z.string().describe("Passkey ID"),
        name: z.string().describe("New display name"),
    }),
    annotations: { readOnlyHint: false },
}, async (body) => { try { return ok(await apiFetch("/passkeys", { method: "PATCH", body })); } catch (e) { return err(e); } });

server.registerTool("remnawave_passkeys_delete", {
    title: "Delete Passkey",
    description: "Delete a passkey by ID.",
    inputSchema: z.object({ id: z.string().describe("Passkey ID") }),
    annotations: { readOnlyHint: false, destructiveHint: true },
}, async (body) => { try { return ok(await apiFetch("/passkeys", { method: "DELETE", body })); } catch (e) { return err(e); } });

// ============================================================
// Run
// ============================================================

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
