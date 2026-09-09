#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

const handle = serveStdio(
	() => {
		const server = new McpServer({
			name: "mock-server-v2",
			version: "2.0.0",
		});

		server.registerTool(
			"v2_echo",
			{
				description: "Returns a marker proving a modern MCP tool call completed",
			},
			async () => ({
				content: [{ type: "text", text: "hello from MCP v2" }],
			}),
		);

		server.registerResource(
			"v2-status",
			"test://v2/status",
			{
				description: "A resource served over the modern MCP protocol",
				mimeType: "text/plain",
			},
			async (uri) => ({
				contents: [{ uri: uri.href, mimeType: "text/plain", text: "resource from MCP v2" }],
			}),
		);

		return server;
	},
	// Reject the legacy initialize handshake so this fixture cannot
	// accidentally pass while exercising only SDK v2's compatibility path.
	{ legacy: "reject" },
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => {
		void handle.close().finally(() => process.exit(0));
	});
}
