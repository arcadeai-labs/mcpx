import { join } from "node:path";

const HTTP_SERVER = join(import.meta.dir, "../fixtures/mock-http-server.ts");
const HTTP_SERVER_V2 = join(import.meta.dir, "../fixtures/mock-http-server-v2.ts");

export interface MockHttpServer {
	url: string;
	proc: ReturnType<typeof Bun.spawn>;
	stop(): void;
}

/** Start a Streamable HTTP mock MCP server and return its /mcp URL. */
export async function startMockHttpServer(script: string = HTTP_SERVER): Promise<MockHttpServer> {
	const proc = Bun.spawn(["bun", "run", script], {
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

/** Start the official MCP v2 Streamable HTTP mock (legacy initialize rejected). */
export function startMockHttpServerV2(): Promise<MockHttpServer> {
	return startMockHttpServer(HTTP_SERVER_V2);
}
