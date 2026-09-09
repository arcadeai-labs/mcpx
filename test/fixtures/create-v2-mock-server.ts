import { McpServer } from "@modelcontextprotocol/server";

/** Shared MCP v2 mock used by the stdio and Streamable HTTP fixtures. */
export function createV2MockServer(): McpServer {
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
}
