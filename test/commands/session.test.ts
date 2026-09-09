import { describe, expect, test } from "bun:test";
import { runJson } from "../helpers/run.ts";

describe("mcpx session", () => {
	test("stdio servers report a null session id", async () => {
		const proc = runJson("session", "mock");
		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();
		expect(exitCode).toBe(0);

		const results = JSON.parse(stdout) as Array<{ server: string; sessionId: string | null }>;
		expect(results).toEqual([{ server: "mock", sessionId: null }]);
	});

	test("errors on unknown server", async () => {
		const proc = runJson("session", "nonexistent");
		const exitCode = await proc.exited;
		expect(exitCode).toBe(1);
	});
});
