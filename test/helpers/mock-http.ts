import { join } from "node:path";

const HTTP_SERVER = join(import.meta.dir, "../fixtures/mock-http-server.ts");

export interface MockHttpServer {
	url: string;
	proc: ReturnType<typeof Bun.spawn>;
	stop(): void;
}

/** Start the Streamable HTTP mock MCP server and return its /mcp URL. */
export async function startMockHttpServer(): Promise<MockHttpServer> {
	const proc = Bun.spawn(["bun", "run", HTTP_SERVER], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const reader = (proc.stdout as ReadableStream<Uint8Array>).getReader();
	const { value } = await reader.read();
	reader.releaseLock();
	const url = new TextDecoder().decode(value).trim();
	return {
		url,
		proc,
		stop() {
			proc.kill();
		},
	};
}
