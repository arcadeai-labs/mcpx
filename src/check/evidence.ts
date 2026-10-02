import type { ServerManager } from "../client/manager.ts";
import { discoverOAuthServerInfo } from "../client/oauth-api.ts";
import type { Config, HttpServerConfig, Tool } from "../config/schemas.ts";
import { isHttpServer } from "../config/schemas.ts";
import { asObject, propertiesOf, toolAnnotations } from "./rules/helpers/schema.ts";
import type { CheckContext, HttpEvidence, ProbeResult } from "./rules/rule.ts";

export interface EvidenceOptions {
	expectedDomain?: string;
	probesEnabled: boolean;
	maxProbes?: number;
}

export async function collectEvidence(
	manager: ServerManager,
	config: Config,
	serverName: string,
	options: EvidenceOptions,
): Promise<CheckContext> {
	const serverConfig = config.servers.mcpServers[serverName];
	if (!serverConfig) throw new Error(`Unknown server: "${serverName}"`);

	const serverInfo = await manager.getServerInfo(serverName);
	const client = await manager.getClient(serverName);
	const capabilities = serverInfo.capabilities as Record<string, unknown> | undefined;
	const [pingResult, toolsResult, resourcesResult, promptsResult] = await Promise.allSettled([
		client.ping(),
		manager.listTools(serverName),
		capabilities?.resources !== undefined ? manager.listResources(serverName) : Promise.resolve([]),
		capabilities?.prompts !== undefined ? manager.listPrompts(serverName) : Promise.resolve([]),
	]);

	const capabilityErrors: CheckContext["capabilityErrors"] = {};
	const tools = settledValue(toolsResult, "tools", capabilityErrors);
	const resources = settledValue(resourcesResult, "resources", capabilityErrors);
	const prompts = settledValue(promptsResult, "prompts", capabilityErrors);
	const http = isHttpServer(serverConfig)
		? await collectHttpEvidence(serverConfig, config.auth[serverName]?.tokens.access_token)
		: undefined;
	const probes = options.probesEnabled ? await runErrorProbes(manager, serverName, tools, options.maxProbes ?? 3) : [];

	return {
		serverName,
		expectedDomain: options.expectedDomain,
		config: serverConfig,
		serverInfo,
		tools,
		resources,
		prompts,
		capabilityErrors,
		pingSucceeded: pingResult.status === "fulfilled",
		http,
		probes,
		probesEnabled: options.probesEnabled,
	};
}

function settledValue<T>(
	value: PromiseSettledResult<T[]>,
	name: "tools" | "resources" | "prompts",
	errors: CheckContext["capabilityErrors"],
): T[] {
	if (value.status === "fulfilled") return value.value;
	errors[name] = value.reason instanceof Error ? value.reason.message : String(value.reason);
	return [];
}

async function collectHttpEvidence(config: HttpServerConfig, accessToken?: string): Promise<HttpEvidence> {
	const evidence: HttpEvidence = {
		url: config.url,
		transport: config.transport ?? "auto",
	};
	const [unauthenticated, origin, invalidToken, discovered] = await Promise.all([
		postJsonRpc(config.url, initializeRequest()),
		postJsonRpc(config.url, initializeRequest(), { origin: "https://attacker.invalid" }),
		postJsonRpc(config.url, initializeRequest(), { authorization: "Bearer mcpx-invalid-token-probe" }),
		discoverOAuthServerInfo(config.url).catch(() => undefined),
	]);
	evidence.unauthenticatedStatus = unauthenticated?.status;
	evidence.wwwAuthenticate = unauthenticated?.headers["www-authenticate"];
	evidence.challenge = parseWwwAuthenticate(evidence.wwwAuthenticate);
	evidence.originStatus = origin?.status;
	evidence.invalidTokenStatus = invalidToken?.status;

	const resourceMetadataUrl = evidence.challenge?.params.resource_metadata ?? protectedResourceMetadataUrl(config.url);
	const resourceResponse = await getJson(resourceMetadataUrl);
	const resourceMetadata = asObject(resourceResponse?.body);
	const authorizationServerUrls = stringArray(resourceMetadata?.authorization_servers);
	const authorizationServer =
		authorizationServerUrls?.[0] ?? (discovered?.authorizationServerMetadata?.issuer as string | undefined);
	const rfc8414 = authorizationServer
		? await getJson(wellKnownUrl(authorizationServer, "oauth-authorization-server"))
		: undefined;
	const oidc = authorizationServer
		? await getJson(wellKnownUrl(authorizationServer, "openid-configuration"))
		: undefined;
	const authorization =
		asObject(rfc8414?.body) ??
		asObject(oidc?.body) ??
		(discovered?.authorizationServerMetadata as Record<string, unknown> | undefined);

	if (resourceMetadata || authorization || discovered?.resourceMetadata) {
		evidence.oauth = {
			resource: (resourceMetadata?.resource as string | undefined) ?? discovered?.resourceMetadata?.resource,
			resourceMetadataUrl,
			resourceMetadata,
			resourceMetadataStatus: resourceResponse?.status,
			authorizationServerUrls,
			scopesSupported: stringArray(resourceMetadata?.scopes_supported) ?? stringArray(authorization?.scopes_supported),
			rfc8414Status: rfc8414?.status,
			oidcStatus: oidc?.status,
			rfc8414Metadata: asObject(rfc8414?.body),
			oidcMetadata: asObject(oidc?.body),
			authorizationServerMetadata: authorization,
			codeChallengeMethodsSupported: stringArray(authorization?.code_challenge_methods_supported),
		};
	}

	const authenticatedHeaders: Record<string, string> = accessToken ? { authorization: `Bearer ${accessToken}` } : {};
	const initialized = await postJsonRpc(config.url, initializeRequest(), authenticatedHeaders);
	const sessionId = initialized?.headers["mcp-session-id"];
	const requestHeaders: Record<string, string> = {
		...authenticatedHeaders,
		...(sessionId ? { "mcp-session-id": sessionId } : {}),
	};
	if (initialized && initialized.status >= 200 && initialized.status < 300) {
		await postJsonRpc(config.url, { jsonrpc: "2.0", method: "notifications/initialized" }, requestHeaders);
	}
	const [invalidJsonRpc, invalidProtocolVersion, jsonRpcResult, reservedMeta, jsonRpcError, notification] =
		await Promise.all([
			postJsonRpc(config.url, { jsonrpc: "1.0", id: "invalid", method: "ping" }, requestHeaders),
			postJsonRpc(
				config.url,
				{ jsonrpc: "2.0", id: "bad-version", method: "ping" },
				{
					...requestHeaders,
					"mcp-protocol-version": "invalid-version",
				},
			),
			postJsonRpc(config.url, { jsonrpc: "2.0", id: "result", method: "ping" }, requestHeaders),
			postJsonRpc(
				config.url,
				{ jsonrpc: "2.0", id: "meta", method: "ping", params: { _meta: { "mcpx/check": true } } },
				requestHeaders,
			),
			postJsonRpc(config.url, { jsonrpc: "2.0", id: "error", method: "mcpx/unknown-method" }, requestHeaders),
			postJsonRpc(config.url, { jsonrpc: "2.0", method: "notifications/initialized" }, requestHeaders),
		]);
	evidence.invalidJsonRpc = invalidJsonRpc;
	evidence.invalidProtocolVersion = invalidProtocolVersion;
	evidence.jsonRpcResult = jsonRpcResult;
	evidence.reservedMeta = reservedMeta;
	evidence.jsonRpcError = jsonRpcError;
	evidence.notification = notification;
	if (sessionId) evidence.sessionTermination = await deleteSession(config.url, requestHeaders);
	return evidence;
}

async function postJsonRpc(
	url: string,
	body: unknown,
	extraHeaders: Record<string, string> = {},
): Promise<NonNullable<HttpEvidence["jsonRpcResult"]> | undefined> {
	try {
		const response = await fetch(url, {
			method: "POST",
			redirect: "manual",
			signal: AbortSignal.timeout(10_000),
			headers: {
				"content-type": "application/json",
				accept: "application/json, text/event-stream",
				...extraHeaders,
			},
			body: JSON.stringify(body),
		});
		return {
			status: response.status,
			contentType: response.headers.get("content-type") ?? undefined,
			body: await parseResponseBody(response),
			headers: Object.fromEntries(response.headers.entries()),
		};
	} catch {
		return undefined;
	}
}

async function getJson(url: string): Promise<NonNullable<HttpEvidence["jsonRpcResult"]> | undefined> {
	try {
		const response = await fetch(url, {
			headers: { accept: "application/json" },
			redirect: "manual",
			signal: AbortSignal.timeout(10_000),
		});
		return {
			status: response.status,
			contentType: response.headers.get("content-type") ?? undefined,
			body: await parseResponseBody(response),
			headers: Object.fromEntries(response.headers.entries()),
		};
	} catch {
		return undefined;
	}
}

async function deleteSession(
	url: string,
	headers: Record<string, string>,
): Promise<NonNullable<HttpEvidence["jsonRpcResult"]> | undefined> {
	try {
		const response = await fetch(url, { method: "DELETE", headers, signal: AbortSignal.timeout(10_000) });
		return {
			status: response.status,
			contentType: response.headers.get("content-type") ?? undefined,
			body: await parseResponseBody(response),
			headers: Object.fromEntries(response.headers.entries()),
		};
	} catch {
		return undefined;
	}
}

function initializeRequest() {
	return {
		jsonrpc: "2.0",
		id: "mcpx-quality-check",
		method: "initialize",
		params: {
			protocolVersion: "2025-11-25",
			capabilities: {},
			clientInfo: { name: "mcpx-quality-check", version: "1" },
		},
	};
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return undefined;
	const candidate = text
		.split("\n")
		.find((line) => line.startsWith("data:"))
		?.slice(5)
		.trim();
	try {
		return JSON.parse(candidate ?? text);
	} catch {
		return text;
	}
}

function parseWwwAuthenticate(header: string | undefined): HttpEvidence["challenge"] {
	if (!header) return undefined;
	const [scheme, ...rest] = header.trim().split(/\s+/);
	const params: Record<string, string> = {};
	for (const match of rest.join(" ").matchAll(/([a-zA-Z_][\w-]*)=(?:"([^"]*)"|([^,\s]+))/g)) {
		params[match[1]!.toLowerCase()] = match[2] ?? match[3] ?? "";
	}
	return { scheme, params };
}

function protectedResourceMetadataUrl(serverUrl: string): string {
	const url = new URL(serverUrl);
	return `${url.origin}/.well-known/oauth-protected-resource${url.pathname === "/" ? "" : url.pathname}`;
}

function wellKnownUrl(issuer: string, suffix: string): string {
	const url = new URL(issuer);
	const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
	return `${url.origin}/.well-known/${suffix}${path}`;
}

async function runErrorProbes(
	manager: ServerManager,
	serverName: string,
	tools: Tool[],
	maxProbes: number,
): Promise<ProbeResult[]> {
	const candidates = tools
		.filter((tool) => toolAnnotations(tool)?.readOnlyHint === true)
		.flatMap((tool) => {
			const required = asObject(tool.inputSchema)?.required;
			const field = Array.isArray(required)
				? required.find((value): value is string => typeof value === "string")
				: undefined;
			return field ? [{ tool, field }] : [];
		})
		.slice(0, maxProbes);

	return Promise.all(
		candidates.map(async ({ tool, field }) => {
			const property = propertiesOf(tool)[field];
			const args = { [field]: invalidValueFor(property?.type) };
			try {
				const response = await manager.callTool(serverName, tool.name, args);
				const record = asObject(response);
				const isError = record?.isError === true;
				const message = JSON.stringify(response);
				return {
					tool: tool.name,
					field,
					isError,
					error: isError ? message : undefined,
					actionable: isError && isActionable(message, field),
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					tool: tool.name,
					field,
					isError: true,
					error: message,
					actionable: isActionable(message, field),
				};
			}
		}),
	);
}

function invalidValueFor(type: unknown): unknown {
	const resolved = Array.isArray(type) ? type[0] : type;
	switch (resolved) {
		case "string":
			return 42;
		case "number":
		case "integer":
			return "not-a-number";
		case "boolean":
			return "not-a-boolean";
		case "array":
			return {};
		case "object":
			return "not-an-object";
		default:
			return null;
	}
}

function isActionable(message: string, field: string): boolean {
	const lower = message.toLowerCase();
	return lower.includes(field.toLowerCase()) && !lower.includes("stack") && !lower.includes("internal server error");
}

function stringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.filter((item): item is string => typeof item === "string");
}
