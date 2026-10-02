import { expect, test } from "bun:test";
import { InputConstraintsRule } from "../../../src/check/rules/tool-quality/input-constraints-rule.ts";
import { context } from "./helpers.ts";

test("input constraints recognizes enums and ranges", async () => {
	const result = await new InputConstraintsRule().computeScore(
		context({
			tools: [
				{
					name: "list",
					inputSchema: { type: "object", properties: { limit: { type: "number", minimum: 1, maximum: 100 } } },
				},
			],
		}),
	);
	expect(result.score).toBe(1);
});
