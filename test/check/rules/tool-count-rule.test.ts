import { expect, test } from "bun:test";
import { ToolCountRule } from "../../../src/check/rules/surface/tool-count-rule.ts";
import { context } from "./helpers.ts";

test("tool count rejects 100 tools", async () => {
	const tools = Array.from({ length: 100 }, (_, index) => ({
		name: `tool-${index}`,
		inputSchema: { type: "object" as const },
	}));
	expect((await new ToolCountRule().computeScore(context({ tools }))).score).toBe(0);
});
