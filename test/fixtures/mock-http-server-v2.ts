#!/usr/bin/env bun

/**
 * Official MCP v2 mock over Streamable HTTP.
 * Starts on a random port and prints the /mcp URL to stdout for test discovery.
 * Rejects the 2025 initialize handshake so tests cannot pass on the legacy path.
 */

import { createMcpHandler } from "@modelcontextprotocol/server";
import { createV2MockServer } from "./create-v2-mock-server.ts";

const handler = createMcpHandler(() => createV2MockServer(), { legacy: "reject" });

const server = Bun.serve({
	hostname: "127.0.0.1",
	port: 0,
	fetch: (req) => handler.fetch(req),
});

console.log(`http://127.0.0.1:${server.port}/mcp`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => {
		void handler.close().finally(() => {
			server.stop();
			process.exit(0);
		});
	});
}
