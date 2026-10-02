import type { Command } from "commander";
import { collectEvidence } from "../check/evidence.ts";
import { gradeRules } from "../check/grade.ts";
import { buildGradeReport } from "../check/report.ts";
import { loadRubric } from "../check/rubric.ts";
import { runRules } from "../check/runner.ts";
import { formatGradeReport } from "../output/grade-report.ts";
import { ExitError } from "../shutdown.ts";
import { withCommand } from "./with-command.ts";

interface GradeOptions {
	rubric?: string;
	expect?: string;
	probe: boolean;
	minScore?: string;
}

export function registerGradeCommand(program: Command) {
	program
		.command("grade [server]")
		.description("grade the quality of an MCP server")
		.option("--rubric <path>", "path to a custom quality rubric")
		.option("--expect <company-or-host>", "expected company or hostname for domain validation")
		.option("--no-probe", "skip safe invalid-argument probes")
		.option("--min-score <number>", "exit nonzero when the score is below this threshold")
		.action(
			withCommand(
				program,
				{
					spinnerText: "Grading MCP server quality...",
					errorLabel: "Quality grading failed",
					contextOverrides: { mcp: "auto", forceMcp: true },
				},
				async ({ config, manager, formatOptions, spinner }, server: string | undefined, options: GradeOptions) => {
					const serverName = selectServer(server, manager.getServerNames());
					const minimum = parseMinimum(options.minScore);
					const rubric = await loadRubric(options.rubric);
					const context = await collectEvidence(manager, config, serverName, {
						expectedDomain: options.expect,
						probesEnabled: options.probe,
					});
					const executions = await runRules(context, rubric);
					const grade = gradeRules(executions, rubric.gradeBands);
					spinner.stop();

					const report = buildGradeReport(serverName, grade, rubric, executions);

					if (formatOptions.json || formatOptions.format === "json") {
						console.log(JSON.stringify(report, null, 2));
					} else {
						console.log(formatGradeReport(report));
					}
					if (minimum !== undefined && grade.score < minimum) throw new ExitError(1);
				},
			),
		);
}

function selectServer(requested: string | undefined, configured: string[]): string {
	if (requested) return requested;
	if (configured.length === 1) return configured[0]!;
	if (configured.length === 0) throw new Error("No servers configured");
	throw new Error(`Multiple servers configured; choose one: ${configured.join(", ")}`);
}

function parseMinimum(raw: string | undefined): number | undefined {
	if (raw === undefined) return undefined;
	const value = Number(raw);
	if (!Number.isFinite(value) || value < 0 || value > 100) {
		throw new Error("--min-score must be a number between 0 and 100");
	}
	return value;
}
