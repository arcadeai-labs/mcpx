import { expect, test } from "bun:test";
import { gradeRules } from "../../src/check/grade.ts";
import type { RuleExecution } from "../../src/check/runner.ts";

test("grading renormalizes skipped rule weight", () => {
	const executions: RuleExecution[] = [
		{
			id: "pass",
			category: "security",
			name: "Pass",
			weight: 50,
			result: { score: 1, status: "pass", evidence: "ok" },
		},
		{
			id: "skip",
			category: "protocol",
			name: "Skip",
			weight: 50,
			result: { score: 0, status: "skip", evidence: "n/a" },
		},
	];
	const grade = gradeRules(executions, [
		{ grade: "A", minimum: 80 },
		{ grade: "F", minimum: 0 },
	]);
	expect(grade.score).toBe(100);
	expect(grade.grade).toBe("A");
	expect(grade.skippedWeight).toBe(50);
});
