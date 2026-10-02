import { expect, test } from "bun:test";
import { ActionableErrorsRule } from "../../../src/check/rules/tool-quality/actionable-errors-rule.ts";
import { context } from "./helpers.ts";

test("actionable errors scores useful probe failures", async () => {
	const result = await new ActionableErrorsRule().computeScore(
		context({
			probes: [{ tool: "search", field: "query", isError: true, actionable: true, error: "query must be string" }],
		}),
	);
	expect(result.score).toBe(1);
});
