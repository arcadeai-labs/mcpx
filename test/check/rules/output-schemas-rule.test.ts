import { expect, test } from "bun:test";
import { OutputSchemasRule } from "../../../src/check/rules/tool-quality/output-schemas-rule.ts";
import { context } from "./helpers.ts";

test("output schemas scores typed responses", async () => {
	const result = await new OutputSchemasRule().computeScore(
		context({
			tools: [{ name: "status", inputSchema: {}, outputSchema: { type: "object" } }],
		}),
	);
	expect(result.score).toBe(1);
});
