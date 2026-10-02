import { expect, test } from "bun:test";
import { ToolDescriptionsRule } from "../../../src/check/rules/tool-quality/tool-descriptions-rule.ts";
import { context } from "./helpers.ts";

test("tool descriptions score their coverage ratio", async () => {
	const result = await new ToolDescriptionsRule().computeScore(
		context({
			tools: [
				{ name: "a", description: "A", inputSchema: { type: "object" } },
				{ name: "b", inputSchema: { type: "object" } },
			],
		}),
	);
	expect(result.score).toBe(0.5);
});
