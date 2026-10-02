import { describe, expect, test } from "bun:test";
import { runJson } from "../helpers/run.ts";

describe("mcpx check", () => {
	test("grades a configured server as JSON", async () => {
		const proc = runJson("check", "mock", "--no-probe");
		const [exitCode, stdout, stderr] = await Promise.all([
			proc.exited,
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);
		expect(exitCode, stderr).toBe(0);
		const report = JSON.parse(stdout);
		expect(report.server).toBe("mock");
		expect(report.score).toBeGreaterThanOrEqual(0);
		expect(report.score).toBeLessThanOrEqual(100);
		expect(report.rules.length).toBeGreaterThan(20);
		expect(report.rules.find((rule: { id: string }) => rule.id === "security.https").status).toBe("skip");
	});

	test("enforces minimum score", async () => {
		const proc = runJson("check", "mock", "--no-probe", "--min-score", "100");
		expect(await proc.exited).toBe(1);
	});
});
