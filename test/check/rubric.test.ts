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
