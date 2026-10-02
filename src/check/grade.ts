import type { GradeBand } from "./rubric.ts";
import type { RuleExecution } from "./runner.ts";

export interface CategoryScore {
	category: string;
	score: number;
	earnedPoints: number;
	applicableWeight: number;
}

export interface GradeResult {
	score: number;
	grade: string;
	earnedPoints: number;
	applicableWeight: number;
	skippedWeight: number;
	categories: CategoryScore[];
}

export function gradeRules(executions: RuleExecution[], bands: GradeBand[]): GradeResult {
	const applicable = executions.filter((execution) => execution.result.status !== "skip");
	const applicableWeight = applicable.reduce((sum, execution) => sum + execution.weight, 0);
	const earnedPoints = applicable.reduce((sum, execution) => sum + execution.weight * execution.result.score, 0);
	const score = applicableWeight === 0 ? 0 : round((earnedPoints / applicableWeight) * 100);
	const categories = [...new Set(executions.map((execution) => execution.category))].map((category) => {
		const categoryRules = applicable.filter((execution) => execution.category === category);
		const weight = categoryRules.reduce((sum, execution) => sum + execution.weight, 0);
		const earned = categoryRules.reduce((sum, execution) => sum + execution.weight * execution.result.score, 0);
		return {
			category,
			score: weight === 0 ? 0 : round((earned / weight) * 100),
			earnedPoints: round(earned),
			applicableWeight: weight,
		};
	});
	const sortedBands = [...bands].sort((a, b) => b.minimum - a.minimum);
	const grade = sortedBands.find((band) => score >= band.minimum)?.grade ?? "F";
	return {
		score,
		grade,
		earnedPoints: round(earnedPoints),
		applicableWeight,
		skippedWeight: executions
			.filter((execution) => execution.result.status === "skip")
			.reduce((sum, execution) => sum + execution.weight, 0),
		categories,
	};
}

function round(value: number): number {
	return Math.round(value * 10) / 10;
}
