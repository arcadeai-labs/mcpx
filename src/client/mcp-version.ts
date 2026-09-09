import type { VersionNegotiationOptions } from "@modelcontextprotocol/client";

/** MCP protocol era to negotiate with the official SDK v2 client. */
export const MCP_VERSIONS = ["v1", "v2", "auto"] as const;
export type McpVersion = (typeof MCP_VERSIONS)[number];

/** Default: 2025 `initialize` handshake (legacy / MCP v1). */
export const DEFAULT_MCP_VERSION: McpVersion = "v1";

/** Protocol revision pinned when `--mcp-version v2` is selected. */
export const MCP_V2_PROTOCOL = "2026-07-28";

/**
 * Parse a user-supplied MCP version string.
 * Accepts `v1`/`1`/`legacy`, `v2`/`2`/`modern`, and `auto` (case-insensitive).
 * Returns `undefined` for empty input; throws on unrecognized values.
 */
export function parseMcpVersion(raw: string | undefined | null): McpVersion | undefined {
	if (raw == null) return undefined;
	const normalized = raw.trim().toLowerCase();
	if (normalized.length === 0) return undefined;
	if (normalized === "v1" || normalized === "1" || normalized === "legacy") return "v1";
	if (normalized === "v2" || normalized === "2" || normalized === "modern") return "v2";
	if (normalized === "auto") return "auto";
	throw new Error(`Invalid MCP version "${raw}". Use: v1, v2, or auto`);
}

/**
 * Resolve which MCP version to use for a connection.
 *
 * Precedence (most specific first):
 * 1. Per-server `mcp` config
 * 2. CLI `--mcp-version`
 * 3. `MCP_VERSION` environment variable
 * 4. Explicit fallback (e.g. SDK option)
 * 5. `v1`
 */
export function resolveMcpVersion(opts: {
	server?: string | undefined;
	cli?: string | undefined;
	env?: string | undefined;
	fallback?: McpVersion | undefined;
}): McpVersion {
	const candidates = [opts.server, opts.cli, opts.env];
	for (const raw of candidates) {
		const parsed = parseMcpVersion(raw);
		if (parsed) return parsed;
	}
	return opts.fallback ?? DEFAULT_MCP_VERSION;
}

/** Map an mcpx MCP version option onto the SDK v2 `versionNegotiation` setting. */
export function versionNegotiationFor(mcp: McpVersion): VersionNegotiationOptions {
	switch (mcp) {
		case "v1":
			return { mode: "legacy" };
		case "v2":
			return { mode: { pin: MCP_V2_PROTOCOL } };
		case "auto":
			return { mode: "auto" };
	}
}
