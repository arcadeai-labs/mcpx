import { expect, test } from "bun:test";
import { ParameterDescriptionsRule } from "../../../src/check/rules/tool-quality/parameter-descriptions-rule.ts";
import { context } from "./helpers.ts";

test("parameter descriptions scores documented properties", async () => {
	const result = await new ParameterDescriptionsRule().computeScore(
		context({
			tools: [
				{
					name: "search",
					inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query" } } },
				},
			],
		}),
	);
	expect(result.score).toBe(1);
});
