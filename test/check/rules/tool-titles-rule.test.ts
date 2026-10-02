import { expect, test } from "bun:test";
import { ToolTitlesRule } from "../../../src/check/rules/tool-quality/tool-titles-rule.ts";
import { context } from "./helpers.ts";

test("tool titles recognizes top-level titles", async () => {
	const result = await new ToolTitlesRule().computeScore(
		context({ tools: [{ name: "status", title: "Status", inputSchema: {} }] }),
	);
	expect(result.score).toBe(1);
});
