import { expect, test } from "bun:test";
import { ToolAnnotationsRule } from "../../../src/check/rules/protocol/tool-annotations-rule.ts";
import { context } from "./helpers.ts";

test("tool annotations require all four hints", async () => {
	const result = await new ToolAnnotationsRule().computeScore(
		context({
			tools: [
				{
					name: "read",
					inputSchema: { type: "object" },
					annotations: {
						readOnlyHint: true,
						destructiveHint: false,
						idempotentHint: true,
						openWorldHint: false,
					},
				},
			],
		}),
	);
	expect(result.score).toBe(1);
});
