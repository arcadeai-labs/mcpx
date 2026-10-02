import type { CheckContext } from "../../../src/check/rules/rule.ts";

export function context(overrides: Partial<CheckContext> = {}): CheckContext {
	return {
		serverName: "example",
		config: { command: "example" },
		serverInfo: {
			version: { name: "example", version: "1.0.0" },
			capabilities: { tools: {} },
			instructions: "Use these tools for examples.",
			protocolVersion: "2026-07-28",
			protocolEra: "modern",
		},
		tools: [],
		resources: [],
		prompts: [],
		capabilityErrors: {},
		pingSucceeded: true,
		probes: [],
		probesEnabled: true,
		...overrides,
	};
}

export function httpContext(overrides: Partial<CheckContext> = {}): CheckContext {
	return context({
		config: { url: "https://example.com/mcp" },
		http: { url: "https://example.com/mcp", transport: "streamable-http" },
		...overrides,
	});
}
