import { expect, test } from "bun:test";
import { ElicitationRule } from "../../../src/check/rules/protocol/elicitation-rule.ts";
import { context } from "./helpers.ts";

test("elicitation recognizes an eliciting tool surface", async () => {
	const result = await new ElicitationRule().computeScore(
		context({
			tools: [{ name: "elicit_input", description: "Use elicitation", inputSchema: { type: "object" } }],
		}),
	);
	expect(result.score).toBe(1);
});
