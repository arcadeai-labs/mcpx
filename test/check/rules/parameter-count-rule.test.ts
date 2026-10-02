import { expect, test } from "bun:test";
import { ParameterCountRule } from "../../../src/check/rules/tool-quality/parameter-count-rule.ts";
import { context } from "./helpers.ts";

test("parameter count passes focused tools", async () => {
	const result = await new ParameterCountRule().computeScore(
		context({
			tools: [{ name: "search", inputSchema: { type: "object", properties: { query: { type: "string" } } } }],
		}),
	);
	expect(result.score).toBe(1);
});
