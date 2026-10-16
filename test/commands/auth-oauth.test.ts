import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import * as oauth from "../../src/client/oauth.ts";
import { registerAuthCommand } from "../../src/commands/auth.ts";

describe("mcpx auth static client", () => {
	let tmpDir: string | undefined;

	afterEach(async () => {
		if (tmpDir) await rm(tmpDir, { recursive: true });
		tmpDir = undefined;
	});

	test("passes the server oauth client into the auth flow", async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "mcpx-auth-"));
		await Bun.write(
			join(tmpDir, "servers.json"),
			JSON.stringify({
				mcpServers: {
					slack: {
						url: "https://mcp.slack.com/mcp",
						oauth: { clientId: "123.456", clientSecret: "from-config", callbackPort: 3118 },
					},
				},
			}),
		);

		const seen: Array<{ serverUrl: string; clientId?: string; clientSecret?: string }> = [];
		const flow = spyOn(oauth, "runOAuthFlow").mockImplementation(async (serverUrl, provider) => {
			const info = provider.clientInformation();
			seen.push({ serverUrl, clientId: info?.client_id, clientSecret: info?.client_secret });
		});

		try {
			const program = new Command();
			program.name("mcpx").option("-c, --config <path>");
			registerAuthCommand(program);
			await program.parseAsync(["node", "mcpx", "-c", tmpDir, "auth", "slack", "--no-index"]);

			expect(seen).toEqual([
				{
					serverUrl: "https://mcp.slack.com/mcp",
					clientId: "123.456",
					clientSecret: "from-config",
				},
			]);
		} finally {
			flow.mockRestore();
		}
	});
});
