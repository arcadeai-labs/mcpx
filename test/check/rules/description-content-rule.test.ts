import { expect, test } from "bun:test";
import { DescriptionContentRule } from "../../../src/check/rules/tool-quality/description-content-rule.ts";
import { context } from "./helpers.ts";

test("description content checks action, usage, and output", async () => {
	const result = await new DescriptionContentRule().computeScore(
		context({
			tools: [
				{
					name: "search",
					description: "Use when searching records. Returns matching results.",
					inputSchema: {},
				},
			],
		}),
	);
	expect(result.score).toBe(1);
});
