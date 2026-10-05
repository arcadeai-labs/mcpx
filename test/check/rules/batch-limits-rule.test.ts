import { expect, test } from "bun:test";
import { BatchLimitsRule } from "../../../src/check/rules/tool-quality/batch-limits-rule.ts";
import { context } from "./helpers.ts";

test("batch limits requires maxItems on arrays", async () => {
	const result = await new BatchLimitsRule().computeScore(
		context({
			tools: [
				{
					name: "send_invites",
					inputSchema: {
						type: "object",
						properties: {
							emails: { type: "array", items: { type: "string" }, maxItems: 50 },
							labels: { type: "array", items: { type: "string" } },
						},
					},
				},
			],
		}),
	);
	expect(result.score).toBe(0.5);
});
