import type {
	OAuthClientInformation,
	OAuthClientInformationMixed,
	OAuthTokens,
	Prompt,
	Resource,
	StoredOAuthClientInformation,
	Tool,
} from "@modelcontextprotocol/client";
import { type McpVersion, parseMcpVersion } from "../client/mcp-version.ts";

// Re-export SDK types we use throughout the codebase
export type {
	McpVersion,
	OAuthClientInformation,
	OAuthClientInformationMixed,
	OAuthTokens,
	Prompt,
	Resource,
	StoredOAuthClientInformation,
	Tool,
};

// --- Server config (our format, not MCP spec) ---

/** Stdio MCP server config */
export interface StdioServerConfig {
	command: string;
	args?: string[];
	env?: Record<string, string>;
	cwd?: string;
	allowedTools?: string[];
	disabledTools?: string[];
	/** MCP protocol era for this server (`v1`, `v2`, or `auto`). Overrides CLI/env. */
	mcp?: McpVersion;
}

/**
 * Pre-registered OAuth client for an HTTP server that does not support
 * dynamic client registration (for example Slack's MCP server).
 */
export interface OAuthClientConfig {
	/** OAuth client id registered with the authorization server. */
	clientId: string;
	/** Client secret for a confidential client. Omit for a public PKCE client. */
	clientSecret?: string;
	/**
	 * Fixed loopback port. The redirect URI is `http://127.0.0.1:<port>/callback`
	 * and must be registered on the OAuth app before `mcpx auth`.
	 */
	callbackPort?: number;
}

/** HTTP MCP server config */
export interface HttpServerConfig {
	url: string;
	headers?: Record<string, string>;
	transport?: "sse" | "streamable-http";
	allowedTools?: string[];
	disabledTools?: string[];
	/** MCP protocol era for this server (`v1`, `v2`, or `auto`). Overrides CLI/env. */
	mcp?: McpVersion;
	/** Static OAuth client. When set, mcpx skips dynamic client registration. */
	oauth?: OAuthClientConfig;
}

export type ServerConfig = StdioServerConfig | HttpServerConfig;

export function isStdioServer(config: ServerConfig): config is StdioServerConfig {
	return "command" in config;
}

export function isHttpServer(config: ServerConfig): config is HttpServerConfig {
	return "url" in config;
}

/** Top-level servers.json shape */
export interface ServersFile {
	mcpServers: Record<string, ServerConfig>;
}

// --- Auth storage (wraps SDK's OAuthTokens with our persistence fields) ---

/** Per-server auth entry stored in auth.json */
export interface AuthEntry {
	tokens: OAuthTokens;
	expires_at?: string;
	client_info?: StoredOAuthClientInformation;
	complete?: boolean;
}

/** Top-level auth.json shape */
export type AuthFile = Record<string, AuthEntry>;

// --- Search index (entirely our format) ---

/** A single tool entry in the search index */
export interface IndexedTool {
	server: string;
	tool: string;
	description: string;
	input_schema?: Tool["inputSchema"];
	scenarios: string[];
	keywords: string[];
	embedding: number[];
}

/** Top-level search.json shape */
export interface SearchIndex {
	version: number;
	indexed_at: string;
	embedding_model: string;
	tools: IndexedTool[];
}

// --- Combined config ---

/** Validated config returned by loadConfig */
export interface Config {
	configDir: string;
	servers: ServersFile;
	auth: AuthFile;
	searchIndex: SearchIndex;
}

// --- Validation ---

/** Validate that a parsed object looks like a valid servers.json */
export function validateServersFile(data: unknown): ServersFile {
	if (typeof data !== "object" || data === null) {
		throw new Error("servers.json must be a JSON object");
	}

	const obj = data as Record<string, unknown>;
	if (typeof obj.mcpServers !== "object" || obj.mcpServers === null) {
		throw new Error('servers.json must have a "mcpServers" object');
	}

	const servers = obj.mcpServers as Record<string, unknown>;
	for (const [name, config] of Object.entries(servers)) {
		if (typeof config !== "object" || config === null) {
			throw new Error(`Server "${name}" must be an object`);
		}
		const c = config as Record<string, unknown>;
		const hasCommand = typeof c.command === "string";
		const hasUrl = typeof c.url === "string";
		if (!hasCommand && !hasUrl) {
			throw new Error(`Server "${name}" must have either "command" (stdio) or "url" (http)`);
		}
		if (hasUrl && c.transport !== undefined) {
			if (c.transport !== "sse" && c.transport !== "streamable-http") {
				throw new Error(`Server "${name}" has invalid transport "${c.transport}" — must be "sse" or "streamable-http"`);
			}
		}
		if (c.oauth !== undefined) {
			if (!hasUrl) {
				throw new Error(`Server "${name}" oauth requires an HTTP server (url)`);
			}
			c.oauth = parseOAuthClientConfig(c.oauth, name);
		}
		if (c.mcp !== undefined) {
			if (typeof c.mcp !== "string") {
				throw new Error(`Server "${name}" has invalid mcp value — must be "v1", "v2", or "auto"`);
			}
			try {
				const parsed = parseMcpVersion(c.mcp);
				if (!parsed) {
					throw new Error("empty");
				}
				c.mcp = parsed;
			} catch {
				throw new Error(`Server "${name}" has invalid mcp "${c.mcp}" — must be "v1", "v2", or "auto"`);
			}
		}
	}

	return data as ServersFile;
}

/** Validate and normalize an `oauth` block from servers.json or CLI flags. */
export function parseOAuthClientConfig(value: unknown, serverName: string): OAuthClientConfig {
	if (typeof value !== "object" || value === null) {
		throw new Error(`Server "${serverName}" oauth must be an object`);
	}
	const oauth = value as Record<string, unknown>;
	if (typeof oauth.clientId !== "string" || oauth.clientId.length === 0) {
		throw new Error(`Server "${serverName}" oauth.clientId must be a non-empty string`);
	}

	const config: OAuthClientConfig = { clientId: oauth.clientId };
	if (oauth.clientSecret !== undefined) {
		if (typeof oauth.clientSecret !== "string" || oauth.clientSecret.length === 0) {
			throw new Error(`Server "${serverName}" oauth.clientSecret must be a non-empty string`);
		}
		config.clientSecret = oauth.clientSecret;
	}
	if (oauth.callbackPort !== undefined) {
		const port = oauth.callbackPort;
		if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
			throw new Error(`Server "${serverName}" oauth.callbackPort must be an integer from 1 to 65535`);
		}
		config.callbackPort = port;
	}
	return config;
}

/** Validate auth.json — lenient, just check shape */
export function validateAuthFile(data: unknown): AuthFile {
	if (typeof data !== "object" || data === null) {
		throw new Error("auth.json must be a JSON object");
	}
	return data as AuthFile;
}

/** Validate search.json — lenient, just check shape */
export function validateSearchIndex(data: unknown): SearchIndex {
	if (typeof data !== "object" || data === null) {
		throw new Error("search.json must be a JSON object");
	}
	const obj = data as Record<string, unknown>;
	if (!Array.isArray(obj.tools)) {
		throw new Error('search.json must have a "tools" array');
	}
	return data as SearchIndex;
}
