import { expect, test } from "bun:test";
import { objectDepth, SchemaDepthRule } from "../../../src/check/rules/tool-quality/schema-depth-rule.ts";
import { context } from "./helpers.ts";

const nested = (levels: number): Record<string, unknown> =>
	levels === 1 ? { type: "object" } : { type: "object", properties: { child: nested(levels - 1) } };

test("object depth counts nested objects through arrays", () => {
	expect(objectDepth({ type: "object", properties: { items: { type: "array", items: nested(2) } } })).toBe(3);
});

test("schema depth flags deeply nested inputs", async () => {
	const result = await new SchemaDepthRule().computeScore(
		context({
			tools: [
				{ name: "shallow", inputSchema: nested(3) as never },
				{ name: "deep", inputSchema: nested(4) as never },
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("deep");
});
