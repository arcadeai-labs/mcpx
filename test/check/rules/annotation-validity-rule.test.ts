import { expect, test } from "bun:test";
import { AnnotationValidityRule } from "../../../src/check/rules/tool-quality/annotation-validity-rule.ts";
import { context } from "./helpers.ts";

test("annotations reject contradictory hints", async () => {
	const result = await new AnnotationValidityRule().computeScore(
		context({
			tools: [
				{
					name: "bad",
					inputSchema: { type: "object" },
					annotations: { readOnlyHint: true, destructiveHint: true },
				},
			],
		}),
	);
	expect(result.score).toBe(0);
});
