#!/usr/bin/env bun

import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createV2MockServer } from "./create-v2-mock-server.ts";

const handle = serveStdio(
	() => createV2MockServer(),
	// Reject the legacy initialize handshake so this fixture cannot
	// accidentally pass while exercising only SDK v2's compatibility path.
	{ legacy: "reject" },
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => {
		void handle.close().finally(() => process.exit(0));
	});
}
