import type { GradeResult } from "./grade.ts";
import type { Rubric } from "./rubric.ts";
import type { RuleExecution } from "./runner.ts";

export interface GradeReportRule {
	id: string;
	category: string;
	name: string;
	weight: number;
	status: string;
	score: number;
	evidence: string;
	remediation?: string;
}

export interface GradeReport {
	schemaVersion: 1;
	server: string;
	score: number;
	grade: string;
	rubricVersion: number;
	earnedPoints: number;
	applicableWeight: number;
	skippedWeight: number;
	categories: GradeResult["categories"];
	summary: {
		passed: number;
		warnings: number;
		failed: number;
		skipped: number;
	};
	rules: GradeReportRule[];
}

export function buildGradeReport(
	server: string,
	grade: GradeResult,
	rubric: Rubric,
	executions: RuleExecution[],
): GradeReport {
	const rules = executions.map((execution) => ({
		id: execution.id,
		category: execution.category,
		name: execution.name,
		weight: execution.weight,
		status: execution.result.status,
		score: Math.round(execution.result.score * 1000) / 10,
		evidence: execution.result.evidence,
		remediation: execution.result.remediation,
	}));
	return {
		schemaVersion: 1,
		server,
		score: grade.score,
		grade: grade.grade,
		rubricVersion: rubric.version,
		earnedPoints: grade.earnedPoints,
		applicableWeight: grade.applicableWeight,
		skippedWeight: grade.skippedWeight,
		categories: grade.categories,
		summary: {
			passed: rules.filter((rule) => rule.status === "pass").length,
			warnings: rules.filter((rule) => rule.status === "warn").length,
			failed: rules.filter((rule) => rule.status === "fail").length,
			skipped: rules.filter((rule) => rule.status === "skip").length,
		},
		rules,
	};
}
