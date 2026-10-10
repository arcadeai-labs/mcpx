import { expect, test } from "bun:test";
import defaultRubric from "../../rubric/mcp-quality.json";
import { validateRubric } from "../../src/check/rubric.ts";

test("default rubric contains all rules and totals 100", () => {
	const rubric = validateRubric(defaultRubric);
	expect(rubric.rules.reduce((sum, rule) => sum + rule.weight, 0)).toBe(100);
});

test("rubric rejects totals other than 100", () => {
	const changed = structuredClone(defaultRubric);
	changed.rules[0]!.weight++;
	expect(() => validateRubric(changed)).toThrow("must total 100");
});

test("default rubric grades on a US school scale", () => {
	const { gradeBands } = validateRubric(defaultRubric);
	const gradeFor = (score: number) => gradeBands.find((band) => score >= band.minimum)?.grade;
	expect(gradeFor(97)).toBe("A+");
	expect(gradeFor(90)).toBe("A");
	expect(gradeFor(89.9)).toBe("B");
	expect(gradeFor(80)).toBe("B");
	expect(gradeFor(79.9)).toBe("C");
	expect(gradeFor(60)).toBe("D");
	expect(gradeFor(59.9)).toBe("F");
});
