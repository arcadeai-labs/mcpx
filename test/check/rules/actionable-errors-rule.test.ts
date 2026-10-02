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

test("actionable errors ignores probes that did not produce errors", async () => {
	const result = await new ActionableErrorsRule().computeScore(
		context({
			probes: [
				{ tool: "search", field: "query", isError: false, actionable: false },
				{ tool: "lookup", field: "id", isError: true, actionable: true, error: "id must be a string" },
			],
		}),
	);
	expect(result.score).toBe(1);
});

test("actionable errors is not applicable when probes produce no errors", async () => {
	const result = await new ActionableErrorsRule().computeScore(
		context({
			probes: [{ tool: "search", field: "query", isError: false, actionable: false }],
		}),
	);
	expect(result.status).toBe("skip");
	expect(result.evidence).toBe("Probe calls did not produce errors to assess");
});
