import { green, red } from "ansis";
import type { Command } from "commander";
import { getContext } from "../context.ts";
import { formatError } from "../output/formatter.ts";
import { logger } from "../output/logger.ts";

interface PingResult {
	server: string;
	success: boolean;
	latencyMs?: number;
	sessionId?: string;
	error?: string;
}

export function registerPingCommand(program: Command) {
	program
		.command("ping [servers...]")
		.description("Check connectivity to MCP servers")
		.action(async (servers: string[]) => {
			const { manager, formatOptions } = await getContext(program);

			const targetServers = servers.length > 0 ? servers : manager.getServerNames();

			if (targetServers.length === 0) {
				console.error(formatError("No servers configured", formatOptions));
				await manager.close();
				process.exit(1);
			}

			const spinner = logger.startSpinner(`Pinging ${targetServers.length} server(s)...`, formatOptions);

			const results: PingResult[] = [];

			try {
				await Promise.all(
					targetServers.map(async (serverName) => {
						const start = Date.now();
						try {
							await manager.getClient(serverName);
							const sessionId = await manager.getSessionId(serverName);
							results.push({
								server: serverName,
								success: true,
								latencyMs: Date.now() - start,
								...(sessionId ? { sessionId } : {}),
							});
						} catch (err) {
							results.push({ server: serverName, success: false, error: String(err) });
						}
					}),
				);

				spinner.stop();

				if (formatOptions.json) {
					console.log(JSON.stringify(results, null, 2));
				} else {
					for (const r of results) {
						if (r.success) {
							const session = r.sessionId ? `  session ${r.sessionId}` : "";
							console.log(`${green("✔")} ${r.server} connected (${r.latencyMs}ms)${session}`);
						} else {
							console.log(`${red("✖")} ${r.server} failed: ${r.error}`);
						}
					}
				}
			} finally {
				await manager.close();
			}

			const anyFailed = results.some((r) => !r.success);
			if (anyFailed) process.exit(1);
		});
}
