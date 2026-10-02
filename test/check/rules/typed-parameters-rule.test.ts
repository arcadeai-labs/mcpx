import { expect, test } from "bun:test";
import { TypedParametersRule } from "../../../src/check/rules/tool-quality/typed-parameters-rule.ts";
import { context } from "./helpers.ts";

test("typed parameters scores explicit JSON Schema types", async () => {
	const result = await new TypedParametersRule().computeScore(
		context({
			tools: [
				{
					name: "search",
					inputSchema: { type: "object", properties: { query: { type: "string" } } },
				},
			],
		}),
	);
	expect(result.score).toBe(1);
});
