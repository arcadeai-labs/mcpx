import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ServerManager } from "../../src/client/manager.ts";
import type { HttpServerConfig } from "../../src/config/schemas.ts";
import { McpxClient } from "../../src/sdk.ts";
import { startMockHttpServerV2 } from "../helpers/mock-http.ts";
import { CLI, CWD } from "../helpers/run.ts";

function v2HttpServer(url: string, mcp?: HttpServerConfig["mcp"]): HttpServerConfig {
	return {
		url,
		transport: "streamable-http",
		...(mcp ? { mcp } : {}),
	};
}

describe("MCP v2 Streamable HTTP integration", () => {
	let manager: ServerManager;
	let client: McpxClient;
	let http: Awaited<ReturnType<typeof startMockHttpServerV2>>;
	let configDir: string | undefined;

	afterEach(async () => {
		await manager?.close();
		await client?.close();
		http?.stop();
		if (configDir) {
			rmSync(configDir, { recursive: true, force: true });
			configDir = undefined;
		}
	});

	async function createManager(mcp?: HttpServerConfig["mcp"]): Promise<ServerManager> {
		http = await startMockHttpServerV2();
		return new ServerManager({
			servers: { mcpServers: { modern: v2HttpServer(http.url, mcp) } },
			configDir: "/tmp",
			auth: {},
			maxRetries: 0,
			timeout: 10_000,
		});
	}

	async function pingCli(url: string, extraArgs: string[] = []) {
		configDir = mkdtempSync(join(tmpdir(), "mcpx-v2-http-"));
		writeFileSync(join(configDir, "servers.json"), JSON.stringify({ mcpServers: { modern: v2HttpServer(url) } }));

		const env = { ...process.env };
		delete env.MCP_VERSION;

		const proc = Bun.spawn(["bun", "run", CLI, ...extraArgs, "-c", configDir, "--json", "ping", "modern"], {
			stdout: "pipe",
			stderr: "pipe",
			cwd: CWD,
			env,
		});
		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();
		return { exitCode, stdout, stderr };
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

	test("default v1 McpxClient cannot connect to a v2 HTTP server", async () => {
		http = await startMockHttpServerV2();
		client = new McpxClient({
			servers: { mcpServers: { modern: v2HttpServer(http.url) } },
			timeout: 10_000,
			maxRetries: 0,
		});

		await expect(client.getServerInfo("modern")).rejects.toThrow();
	});

	test("mcpx CLI defaults to v1 and cannot ping a v2 HTTP server", async () => {
		http = await startMockHttpServerV2();

		const { exitCode, stdout } = await pingCli(http.url);
		const results = JSON.parse(stdout) as Array<{ server: string; success: boolean; error?: string }>;

		expect(exitCode).toBe(1);
		expect(results).toEqual([
			expect.objectContaining({
				server: "modern",
				success: false,
			}),
		]);
		expect(results[0]?.error).toBeDefined();
	});

	test("mcpx --mcp-version v1 cannot ping a v2 HTTP server", async () => {
		http = await startMockHttpServerV2();

		const { exitCode, stdout } = await pingCli(http.url, ["--mcp-version", "v1"]);
		const results = JSON.parse(stdout) as Array<{ server: string; success: boolean }>;

		expect(exitCode).toBe(1);
		expect(results[0]?.success).toBe(false);
	});
});
