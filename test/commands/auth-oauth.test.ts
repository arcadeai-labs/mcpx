import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface SeenAuth {
	serverUrl: string;
	clientId?: string;
	clientSecret?: string;
}

const seen: SeenAuth[] = [];

mock.module("../../src/client/oauth.ts", () => {
	class McpOAuthProvider {
		oauth?: { clientId: string; clientSecret?: string };

		constructor(opts: { oauth?: { clientId: string; clientSecret?: string } }) {
			this.oauth = opts.oauth;
		}

		clientInformation() {
			if (!this.oauth) return undefined;
			return {
				client_id: this.oauth.clientId,
				...(this.oauth.clientSecret ? { client_secret: this.oauth.clientSecret } : {}),
			};
		}
	}

	return {
		McpOAuthProvider,
		explainAuthFailure(err: unknown) {
			return err instanceof Error ? err.message : String(err);
		},
		async runOAuthFlow(serverUrl: string, provider: McpOAuthProvider) {
			const info = provider.clientInformation();
			seen.push({ serverUrl, clientId: info?.client_id, clientSecret: info?.client_secret });
		},
	};
});

import { Command } from "commander";
import { registerAuthCommand } from "../../src/commands/auth.ts";

describe("mcpx auth static client", () => {
	let tmpDir: string;

	afterEach(async () => {
		seen.length = 0;
		if (tmpDir) await rm(tmpDir, { recursive: true });
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
	});
});
