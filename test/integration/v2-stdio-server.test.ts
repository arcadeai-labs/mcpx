import { afterEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { ServerManager } from "../../src/client/manager.ts";

const MOCK_V2_SERVER = join(import.meta.dir, "../fixtures/mock-server-v2.ts");

describe("MCP v2 stdio integration", () => {
	let manager: ServerManager;

	afterEach(async () => {
		await manager?.close();
	});

	function createManager(): ServerManager {
		return new ServerManager({
			servers: {
				mcpServers: {
					modern: {
						command: "bun",
						args: ["run", MOCK_V2_SERVER],
						mcp: "v2",
					},
				},
			},
			configDir: "/tmp",
			auth: {},
			maxRetries: 0,
			timeout: 5_000,
		});
	}

	test("negotiates the modern 2026-07-28 protocol", async () => {
		manager = createManager();

		const info = await manager.getServerInfo("modern");

		expect(info.mcp).toBe("v2");
		expect(info.protocolEra).toBe("modern");
		expect(info.protocolVersion).toBe("2026-07-28");
		expect(info.version).toEqual({ name: "mock-server-v2", version: "2.0.0" });
	});

	test("calls a tool over an MCP v2 connection", async () => {
		manager = createManager();

		const result = (await manager.callTool("modern", "v2_echo")) as {
			content: { type: string; text: string }[];
		};

		expect(result.content[0]?.text).toBe("hello from MCP v2");
		expect((await manager.getServerInfo("modern")).protocolEra).toBe("modern");
	});

	test("reads a resource over an MCP v2 connection", async () => {
		manager = createManager();

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
});
