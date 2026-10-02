import { describe, expect, test } from "bun:test";
import { run, runJson } from "../helpers/run.ts";

describe("mcpx grade", () => {
	test("grades a configured server as JSON", async () => {
		const proc = runJson("grade", "mock", "--no-probe");
		const [exitCode, stdout, stderr] = await Promise.all([
			proc.exited,
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);
		expect(exitCode, stderr).toBe(0);
		const report = JSON.parse(stdout);
		expect(report.schemaVersion).toBe(1);
		expect(report.server).toBe("mock");
		expect(report.score).toBeGreaterThanOrEqual(0);
		expect(report.score).toBeLessThanOrEqual(100);
		expect(report.rules.length).toBeGreaterThan(20);
		expect(report.summary.passed + report.summary.warnings + report.summary.failed + report.summary.skipped).toBe(
			report.rules.length,
		);
		expect(report.rules.find((rule: { id: string }) => rule.id === "security.https").status).toBe("skip");
	});

	test("renders a visual terminal report", async () => {
		const proc = run("grade", "mock", "--no-probe");
		const [exitCode, stdout] = await Promise.all([proc.exited, new Response(proc.stdout).text()]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("MCP SERVER QUALITY REPORT");
		expect(stdout).toContain("CATEGORY PIES");
		expect(stdout).toMatch(/[●◕◑◔○]/);
		expect(stdout).toContain("Machine output: mcpx grade <server> --json");
		expect(stdout).not.toContain("\x1b[");
	});

	test("colors visual output when color is forced", async () => {
		const proc = run("grade", "mock", "--no-probe", "--force-color");
		const [exitCode, stdout] = await Promise.all([proc.exited, new Response(proc.stdout).text()]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("\x1b[");
	});

	test("enforces minimum score", async () => {
		const proc = runJson("grade", "mock", "--no-probe", "--min-score", "100");
		expect(await proc.exited).toBe(1);
	});
});
