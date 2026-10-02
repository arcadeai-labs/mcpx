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
	const http = isHttpServer(serverConfig) ? await collectHttpEvidence(serverConfig) : undefined;
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

async function collectHttpEvidence(config: HttpServerConfig): Promise<HttpEvidence> {
	const evidence: HttpEvidence = {
		url: config.url,
		transport: config.transport ?? "auto",
	};
	const [unauthenticated, origin, oauth] = await Promise.all([
		probeHttp(config.url),
		probeHttp(config.url, "https://attacker.invalid"),
		discoverOAuthServerInfo(config.url).catch(() => undefined),
	]);
	evidence.unauthenticatedStatus = unauthenticated?.status;
	evidence.wwwAuthenticate = unauthenticated?.wwwAuthenticate;
	evidence.originStatus = origin?.status;

	if (oauth?.authorizationServerMetadata || oauth?.resourceMetadata) {
		const authorization = oauth.authorizationServerMetadata as Record<string, unknown> | undefined;
		evidence.oauth = {
			resource: oauth.resourceMetadata?.resource,
			scopesSupported: stringArray(authorization?.scopes_supported),
			codeChallengeMethodsSupported: stringArray(authorization?.code_challenge_methods_supported),
		};
	}
	return evidence;
}

async function probeHttp(
	url: string,
	origin?: string,
): Promise<{ status: number; wwwAuthenticate?: string } | undefined> {
	try {
		const response = await fetch(url, {
			method: "POST",
			redirect: "manual",
			signal: AbortSignal.timeout(10_000),
			headers: {
				"content-type": "application/json",
				accept: "application/json, text/event-stream",
				...(origin ? { origin } : {}),
			},
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: "mcpx-quality-check",
				method: "initialize",
				params: {
					protocolVersion: "2025-06-18",
					capabilities: {},
					clientInfo: { name: "mcpx-quality-check", version: "1" },
				},
			}),
		});
		return {
			status: response.status,
			wwwAuthenticate: response.headers.get("www-authenticate") ?? undefined,
		};
	} catch {
		return undefined;
	}
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
