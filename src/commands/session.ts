import { cyan, dim, red } from "ansis";
import type { Command } from "commander";
import { getContext } from "../context.ts";
import { formatError } from "../output/formatter.ts";
import { logger } from "../output/logger.ts";

interface SessionResult {
	server: string;
	sessionId: string | null;
	error?: string;
}

export function registerSessionCommand(program: Command) {
	program
		.command("session [servers...]")
		.description("Print Streamable HTTP session ids after connecting")
		.action(async (servers: string[]) => {
			const { manager, formatOptions } = await getContext(program);

			const targetServers = servers.length > 0 ? servers : manager.getServerNames();

			if (targetServers.length === 0) {
				console.error(formatError("No servers configured", formatOptions));
				await manager.close();
				process.exit(1);
			}

			const spinner = logger.startSpinner(`Connecting to ${targetServers.length} server(s)...`, formatOptions);

			const results: SessionResult[] = [];

			try {
				await Promise.all(
					targetServers.map(async (serverName) => {
						try {
							const sessionId = (await manager.getSessionId(serverName)) ?? null;
							results.push({ server: serverName, sessionId });
						} catch (err) {
							results.push({ server: serverName, sessionId: null, error: String(err) });
						}
					}),
				);

				spinner.stop();

				if (formatOptions.json) {
					console.log(JSON.stringify(results, null, 2));
				} else {
					const maxName = Math.max(...results.map((r) => r.server.length));
					for (const r of results) {
						const name = cyan(r.server.padEnd(maxName));
						if (r.error) {
							console.log(`${name}  ${red(r.error)}`);
						} else if (r.sessionId) {
							console.log(`${name}  ${r.sessionId}`);
						} else {
							console.log(`${name}  ${dim("(none)")}`);
						}
					}
				}
			} finally {
				await manager.close();
			}

			const anyFailed = results.some((r) => r.error);
			if (anyFailed) process.exit(1);
		});
}
