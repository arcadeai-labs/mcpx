import { afterEach, describe, expect, test } from "bun:test";
import { ServerManager } from "../../src/client/manager.ts";
import type { HttpServerConfig } from "../../src/config/schemas.ts";
import { startMockHttpServerV2 } from "../helpers/mock-http.ts";

describe("MCP v2 Streamable HTTP integration", () => {
	let manager: ServerManager;
	let http: Awaited<ReturnType<typeof startMockHttpServerV2>>;

	afterEach(async () => {
		await manager?.close();
		http?.stop();
	});

	async function createManager(mcp: HttpServerConfig["mcp"]): Promise<ServerManager> {
		http = await startMockHttpServerV2();
		return new ServerManager({
			servers: {
				mcpServers: {
					modern: {
						url: http.url,
						transport: "streamable-http",
						mcp,
					},
				},
			},
			configDir: "/tmp",
			auth: {},
			maxRetries: 0,
			timeout: 10_000,
		});
	}

	test("negotiates the modern 2026-07-28 protocol over HTTP", async () => {
		manager = await createManager("v2");

		const info = await manager.getServerInfo("modern");

		expect(info.mcp).toBe("v2");
		expect(info.protocolEra).toBe("modern");
		expect(info.protocolVersion).toBe("2026-07-28");
		expect(info.version).toEqual({ name: "mock-server-v2", version: "2.0.0" });
	});

	test("calls a tool over MCP v2 Streamable HTTP", async () => {
		manager = await createManager("v2");

		const result = (await manager.callTool("modern", "v2_echo")) as {
			content: { type: string; text: string }[];
		};

		expect(result.content[0]?.text).toBe("hello from MCP v2");
		expect((await manager.getServerInfo("modern")).protocolEra).toBe("modern");
	});

	test("reads a resource over MCP v2 Streamable HTTP", async () => {
		manager = await createManager("v2");

		const result = (await manager.readResource("modern", "test://v2/status")) as {
			contents: { uri: string; mimeType?: string; text?: string }[];
		};

		expect(result.contents).toEqual([
			{
				uri: "test://v2/status",
				mimeType: "text/plain",
				text: "resource from MCP v2",
			},
		]);
		expect((await manager.getServerInfo("modern")).protocolVersion).toBe("2026-07-28");
	});

	test("mcp auto still lands on the modern HTTP handshake", async () => {
		manager = await createManager("auto");

		const info = await manager.getServerInfo("modern");
		expect(info.mcp).toBe("auto");
		expect(info.protocolEra).toBe("modern");
		expect(info.protocolVersion).toBe("2026-07-28");
	});

	test("mcp v1 cannot connect to a modern-only HTTP server", async () => {
		manager = await createManager("v1");

		await expect(manager.getServerInfo("modern")).rejects.toThrow();
	});
});
